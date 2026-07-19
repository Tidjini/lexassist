import json

import anthropic
from django.conf import settings

from .models import Conversacion, Mensaje
from .tools import TOOLS_SCHEMA, ejecutar_tool

MODEL = "claude-opus-4-8"
MAX_TURNOS_TOOL_USE = 5

SYSTEM_PROMPT = (
    "Eres el asistente interno de un despacho de abogados de extranjería en España. "
    "Ayudas al abogado a consultar y actualizar su base de clientes, expedientes y "
    "documentos usando las herramientas disponibles. Responde siempre en español, de "
    "forma breve y concreta. Si una herramienta no encuentra nada, dilo claramente en "
    "vez de inventar datos."
)


def _bloque_a_dict(bloque):
    if bloque.type == "text":
        return {"type": "text", "text": bloque.text}

    return {"type": "tool_use", "id": bloque.id, "name": bloque.name, "input": bloque.input}


def responder(conversacion: Conversacion, texto_usuario: str) -> Mensaje:
    """
    Enregistre le message utilisateur, puis — si une clé API est configurée — appelle
    Claude avec les tools disponibles (apps.assistant.tools) en bouclant tant qu'il
    demande des tool_use, jusqu'à MAX_TURNOS_TOOL_USE. Enregistre et renvoie le message
    assistant final.

    Lève RuntimeError (message en espagnol, remonte tel quel côté frontend) si
    ANTHROPIC_API_KEY n'est pas configurée — même pattern que
    apps.documents.vision.analizar_documento. Le message utilisateur est déjà enregistré
    à ce moment-là (comme un Document reste créé même si son traitement IA échoue) : seul
    le message assistant manque, l'appelant (apps.assistant.views) le signale à part
    plutôt que d'inventer une réponse.
    """
    Mensaje.objects.create(conversacion=conversacion, rol=Mensaje.Rol.USUARIO, contenido=texto_usuario)
    conversacion.save(update_fields=["updated_at"])

    if not settings.ANTHROPIC_API_KEY:
        raise RuntimeError("La clave ANTHROPIC_API_KEY no está configurada en el servidor (ver .env).")

    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

    mensajes_api = [
        {"role": "user" if m.rol == Mensaje.Rol.USUARIO else "assistant", "content": m.contenido}
        for m in conversacion.mensajes.all()
    ]

    texto_final = "No he podido completar la petición (demasiados pasos)."

    for _ in range(MAX_TURNOS_TOOL_USE):
        response = client.messages.create(
            model=MODEL,
            max_tokens=1024,
            system=SYSTEM_PROMPT,
            tools=TOOLS_SCHEMA,
            messages=mensajes_api,
        )

        if response.stop_reason != "tool_use":
            texto_final = "".join(b.text for b in response.content if b.type == "text")
            break

        mensajes_api.append({"role": "assistant", "content": [_bloque_a_dict(b) for b in response.content]})

        resultados_tools = []
        for bloque in response.content:
            if bloque.type != "tool_use":
                continue

            resultado = ejecutar_tool(bloque.name, bloque.input)
            resultados_tools.append(
                {
                    "type": "tool_result",
                    "tool_use_id": bloque.id,
                    "content": json.dumps(resultado, ensure_ascii=False),
                }
            )

        mensajes_api.append({"role": "user", "content": resultados_tools})

    return Mensaje.objects.create(conversacion=conversacion, rol=Mensaje.Rol.ASISTENTE, contenido=texto_final)
