import json
import re

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
    Enregistre le message utilisateur, puis :
    - si une clé API est configurée → appelle Claude avec les tools disponibles
      (apps.assistant.tools) en bouclant tant qu'il demande des tool_use, jusqu'à
      MAX_TURNOS_TOOL_USE ;
    - sinon, si IA_MODO_SIMULADO=True (interrupteur explicite, voir settings) → route le
      message vers un outil réel par reconnaissance de mots-clés (_responder_simulado),
      pour tester la procédure avec des documents fictifs sans clé API ;
    - sinon → lève RuntimeError (message en espagnol, remonte tel quel côté frontend),
      même pattern que apps.documents.vision.analizar_documento.

    Dans tous les cas le message utilisateur est déjà enregistré au moment du choix de
    branche (comme un Document reste créé même si son traitement IA échoue) : seul le
    message assistant peut manquer, l'appelant (apps.assistant.views) le signale à part
    plutôt que d'inventer une réponse.
    """
    Mensaje.objects.create(conversacion=conversacion, rol=Mensaje.Rol.USUARIO, contenido=texto_usuario)
    conversacion.save(update_fields=["updated_at"])

    if not settings.ANTHROPIC_API_KEY:
        if settings.IA_MODO_SIMULADO:
            return _responder_simulado(conversacion, texto_usuario)

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


_RE_EXPIRACION = re.compile(r"cadu|expir", re.I)
_RE_CLIENTE = re.compile(r"cliente|busca", re.I)
_RE_EXPEDIENTE = re.compile(r"expediente|dossier", re.I)
# Retire tous les mots-clés de routage (pas juste le premier trouvé) pour ne garder que
# la partie utile de la requête, ex. "busca cliente Garcia" → "Garcia".
_RE_MOTS_CLE_CLIENTE = re.compile(r"\b(?:buscar?|cliente)\b", re.I)


def _responder_simulado(conversacion: Conversacion, texto_usuario: str) -> Mensaje:
    """
    Reconnaissance de mots-clés simple (pas une vraie compréhension du langage) qui
    appelle un outil réel (apps.assistant.tools) sur les vraies données du cabinet, pour
    tester la boucle complète — dispatch d'outil, mise en forme de la réponse — sans clé
    API. La réponse est toujours préfixée par « [Modo simulado] » pour ne jamais la
    confondre avec une vraie réponse de Claude.
    """
    if _RE_EXPIRACION.search(texto_usuario):
        resultados = ejecutar_tool("documentos_por_expirar", {})
        if resultados:
            lineas = [f"- {r['documento']} ({r['cliente']}): {r['dias_restantes']} días" for r in resultados]
            texto_final = "He encontrado estos documentos próximos a caducar:\n" + "\n".join(lineas)
        else:
            texto_final = "No hay documentos próximos a caducar en los próximos 90 días."

    elif _RE_CLIENTE.search(texto_usuario):
        consulta = _RE_MOTS_CLE_CLIENTE.sub("", texto_usuario).strip() or texto_usuario
        resultados = ejecutar_tool("buscar_clientes", {"consulta": consulta})
        if resultados:
            lineas = [f"- {r['nombre']} (NIE {r['nie'] or '—'})" for r in resultados]
            texto_final = f"Clientes encontrados para «{consulta}»:\n" + "\n".join(lineas)
        else:
            texto_final = f"No he encontrado ningún cliente para «{consulta}»."

    elif _RE_EXPEDIENTE.search(texto_usuario):
        resultados = ejecutar_tool("listar_expedientes", {})
        if resultados:
            lineas = [f"- {r['titulo']} ({r['cliente']}): {r['estado']}" for r in resultados]
            texto_final = "Expedientes encontrados:\n" + "\n".join(lineas)
        else:
            texto_final = "No hay expedientes registrados."

    else:
        texto_final = (
            "No he reconocido su petición en modo simulado. Puedo responder a preguntas "
            "sobre documentos próximos a caducar, buscar un cliente, o listar expedientes."
        )

    return Mensaje.objects.create(
        conversacion=conversacion, rol=Mensaje.Rol.ASISTENTE, contenido=f"[Modo simulado] {texto_final}"
    )
