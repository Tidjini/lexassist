import base64
import json
import re
from datetime import date, timedelta

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


_CATEGORIAS_CON_EXPIRACION = {
    Document.Categorie.PASSEPORT,
    Document.Categorie.NIE,
    Document.Categorie.DNI,
    Document.Categorie.EMPADRONAMIENTO,
}
_DIAS_EXPIRACION_SIMULADA = 45

_RE_FECHA = re.compile(r"^\d{4}-\d{2}-\d{2}$")
_RE_NUMERO = re.compile(r"^[A-Za-z0-9]*\d[A-Za-z0-9]*$")

_ALIAS_CATEGORIA = {
    "PASAPORTE": Document.Categorie.PASSEPORT,
    "PASSEPORT": Document.Categorie.PASSEPORT,
    "PADRON": Document.Categorie.EMPADRONAMIENTO,
    "CONTRATO": Document.Categorie.CONTRAT,
    "NOMINA": Document.Categorie.FICHE_PAIE,
    "DIPLOMA": Document.Categorie.DIPLOME,
    "ANTECEDENTES": Document.Categorie.CASIER_JUDICIAIRE,
}


def analizar_documento_simulado(nom_original: str) -> dict:
    """
    Simule une analyse IA à partir du nom du fichier — utilisé quand IA_MODO_SIMULADO=True
    (interrupteur explicite, voir settings) et qu'aucune clé API n'est configurée : permet
    de tester toute la procédure (rapprochement/création de client, alertes...) avec des
    documents fictifs, sans jamais appeler Claude.

    Convention de nommage libre, tokens séparés par « _ » ou espace (pas « - », réservé
    à l'intérieur d'une date AAAA-MM-JJ) :
    - un token égal à une catégorie connue (PASAPORTE, NIE, DNI, EMPADRONAMIENTO...) ou à
      un alias usuel (_ALIAS_CATEGORIA) → catégorie ;
    - un token AAAA-MM-JJ → date d'expiration explicite ;
    - un token contenant au moins un chiffre (et qui n'est pas une date) → numéro de
      document ;
    - les deux premiers tokens alphabétiques restants, dans l'ordre du nom de fichier →
      nombre (prénom) puis apellidos (nom de famille).

    Sans date explicite, une catégorie qui expire habituellement (passeport, NIE, DNI,
    empadronamiento) reçoit une date d'expiration à J+45 (pour peupler la page Alertas en
    test). Sans aucun indice reconnu, retombe sur AUTRE avec des champs vides — teste
    aussi le chemin « document non classé ».

    Exemple : « Maria_Garcia_PASAPORTE_X1234567A.jpg » → catégorie PASSEPORT,
    nombre=Maria, apellidos=Garcia, numero_documento=X1234567A — dans cet ordre précis
    (prénom avant nom de famille), pour matcher _buscar_o_crear_cliente qui compare
    nombre→prenom et apellidos→nom.
    """
    # Séparateur : « _ » ou espace uniquement — pas « - », pour ne pas casser un token
    # date AAAA-MM-JJ en trois morceaux.
    base = nom_original.rsplit(".", 1)[0]
    tokens = [t for t in re.split(r"[_\s]+", base) if t]

    categoria = Document.Categorie.AUTRE
    fecha_token = None
    numero = None
    alphas = []

    for token in tokens:
        haut = token.upper()
        if haut in Document.Categorie.values:
            categoria = haut
        elif haut in _ALIAS_CATEGORIA:
            categoria = _ALIAS_CATEGORIA[haut]
        elif _RE_FECHA.match(token):
            fecha_token = token
        elif _RE_NUMERO.match(token):
            numero = token
        elif token.isalpha():
            alphas.append(token)

    nombre = alphas[0] if len(alphas) > 0 else None
    apellidos = alphas[1] if len(alphas) > 1 else None

    if fecha_token:
        fecha_expiracion = fecha_token
    elif categoria in _CATEGORIAS_CON_EXPIRACION:
        fecha_expiracion = (date.today() + timedelta(days=_DIAS_EXPIRACION_SIMULADA)).isoformat()
    else:
        fecha_expiracion = None

    return {
        "categoria": categoria,
        "campos": {
            "nombre": nombre,
            "apellidos": apellidos,
            "numero_documento": numero,
            "fecha_nacimiento": None,
            "nacionalidad": None,
        },
        "fecha_expiracion": fecha_expiracion,
    }
