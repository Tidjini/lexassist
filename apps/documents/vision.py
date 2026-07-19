import base64
import json

import anthropic
from django.conf import settings

from .models import Document

MODEL = "claude-opus-4-8"

SCHEMA = {
    "type": "object",
    "properties": {
        "categoria": {"type": "string", "enum": [c.value for c in Document.Categorie]},
        "campos": {
            "type": "object",
            "properties": {
                "nombre": {"type": ["string", "null"]},
                "apellidos": {"type": ["string", "null"]},
                "numero_documento": {"type": ["string", "null"]},
                "fecha_nacimiento": {"type": ["string", "null"]},
                "nacionalidad": {"type": ["string", "null"]},
            },
            "required": ["nombre", "apellidos", "numero_documento", "fecha_nacimiento", "nacionalidad"],
            "additionalProperties": False,
        },
        "fecha_expiracion": {"type": ["string", "null"]},
    },
    "required": ["categoria", "campos", "fecha_expiracion"],
    "additionalProperties": False,
}

_PROMPT = (
    "Eres un asistente de un despacho de abogados de extranjería en España. Analiza este "
    "documento (foto o PDF) y clasifícalo entre las categorías conocidas. Extrae también "
    "los datos personales visibles (nombre, apellidos, número de documento, fecha de "
    "nacimiento, nacionalidad) y, si el documento tiene una fecha de caducidad/expiración "
    "(pasaporte, NIE, empadronamiento…), indícala en formato ISO (AAAA-MM-DD). Si un dato "
    "no está visible o no aplica, indica null. No inventes datos que no estén en el "
    "documento."
)


def _bloc_source(fichier_bytes: bytes, media_type: str) -> dict:
    data_b64 = base64.standard_b64encode(fichier_bytes).decode("utf-8")
    if media_type == "application/pdf":
        return {"type": "document", "source": {"type": "base64", "media_type": media_type, "data": data_b64}}
    return {"type": "image", "source": {"type": "base64", "media_type": media_type, "data": data_b64}}


def analizar_documento(fichier_bytes: bytes, media_type: str) -> dict:
    """
    Envoie un document (photo/PDF) à Claude et retourne sa classification +
    extraction structurée : {"categoria": str, "campos": {...}, "fecha_expiracion":
    str|None}. Lève RuntimeError si ANTHROPIC_API_KEY n'est pas configurée côté
    serveur (voir .env) — même pattern que schoolavia (apps.paiements.vision).
    """
    if not settings.ANTHROPIC_API_KEY:
        # Message en espagnol : ce texte remonte tel quel jusqu'à error_ia et s'affiche
        # directement dans l'interface cliente (toujours en espagnol), contrairement aux
        # commentaires/docstrings du code qui restent en français.
        raise RuntimeError("La clave ANTHROPIC_API_KEY no está configurada en el servidor (ver .env).")

    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

    response = client.messages.create(
        model=MODEL,
        max_tokens=1024,
        messages=[{
            "role": "user",
            "content": [
                _bloc_source(fichier_bytes, media_type),
                {"type": "text", "text": _PROMPT},
            ],
        }],
        output_config={"format": {"type": "json_schema", "schema": SCHEMA}},
    )

    texte = next(b.text for b in response.content if b.type == "text")
    return json.loads(texte)
