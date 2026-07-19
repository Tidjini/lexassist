# Outils exposés à Claude (tool use) — chaque fonction est une requête ORM normale,
# testable unitairement sans clé API. `ejecutar_tool` fait le pont entre le nom d'outil
# renvoyé par Claude et la fonction Python correspondante.

from datetime import timedelta

from django.db.models import Q
from django.utils import timezone

from apps.clients.models import Client
from apps.dossiers.models import Dossier
from apps.documents.models import Document

TOOLS_SCHEMA = [
    {
        "name": "buscar_clientes",
        "description": (
            "Busca clientes del despacho por nombre, apellidos, email o número de "
            "documento (NIE/pasaporte/DNI). Devuelve como máximo 10 resultados."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "consulta": {"type": "string", "description": "Texto a buscar (nombre, email, NIE...)"},
            },
            "required": ["consulta"],
        },
    },
    {
        "name": "listar_expedientes",
        "description": "Lista los expedientes del despacho, opcionalmente filtrados por estado y/o cliente.",
        "input_schema": {
            "type": "object",
            "properties": {
                "estado": {
                    "type": ["string", "null"],
                    "enum": [*Dossier.Statut.values, None],
                    "description": "Filtra por estado del expediente. Omitir o null para todos.",
                },
                "cliente_id": {
                    "type": ["integer", "null"],
                    "description": "Filtra por id de cliente. Omitir o null para todos.",
                },
            },
            "required": [],
        },
    },
    {
        "name": "documentos_por_expirar",
        "description": (
            "Lista los documentos (pasaporte, NIE, empadronamiento...) cuya fecha de "
            "expiración cae dentro de los próximos N días, ordenados por fecha más próxima."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "dias": {
                    "type": "integer",
                    "description": "Número de días hacia adelante a considerar. Por defecto 90.",
                },
            },
            "required": [],
        },
    },
    {
        "name": "agregar_nota_expediente",
        "description": "Añade una nota al expediente indicado (se añade al final de las notas existentes).",
        "input_schema": {
            "type": "object",
            "properties": {
                "expediente_id": {"type": "integer"},
                "nota": {"type": "string"},
            },
            "required": ["expediente_id", "nota"],
        },
    },
]


def buscar_clientes(consulta: str) -> list[dict]:
    resultados = Client.objects.filter(
        Q(nom__icontains=consulta)
        | Q(prenom__icontains=consulta)
        | Q(email__icontains=consulta)
        | Q(numero_nie__icontains=consulta)
        | Q(numero_passeport__icontains=consulta)
        | Q(numero_dni__icontains=consulta)
    )[:10]
    return [
        {"id": c.id, "nombre": f"{c.prenom} {c.nom}", "nie": c.numero_nie, "email": c.email}
        for c in resultados
    ]


def listar_expedientes(estado: str | None = None, cliente_id: int | None = None) -> list[dict]:
    qs = Dossier.objects.select_related("cliente")

    if estado:
        qs = qs.filter(statut=estado)

    if cliente_id:
        qs = qs.filter(cliente_id=cliente_id)

    return [
        {
            "id": d.id,
            "titulo": d.titre,
            "cliente": f"{d.cliente.prenom} {d.cliente.nom}",
            "estado": d.statut,
            "fecha_apertura": d.date_ouverture.isoformat(),
        }
        for d in qs[:20]
    ]


def documentos_por_expirar(dias: int = 90) -> list[dict]:
    limite = timezone.localdate() + timedelta(days=dias)
    hoy = timezone.localdate()
    documentos = (
        Document.objects.select_related("cliente")
        .filter(cliente__isnull=False, fecha_expiracion__isnull=False, fecha_expiracion__lte=limite)
        .order_by("fecha_expiracion")[:20]
    )
    return [
        {
            "documento": d.nom_original,
            "cliente": f"{d.cliente.prenom} {d.cliente.nom}",
            "categoria": d.categorie,
            "fecha_expiracion": d.fecha_expiracion.isoformat(),
            "dias_restantes": (d.fecha_expiracion - hoy).days,
        }
        for d in documentos
    ]


def agregar_nota_expediente(expediente_id: int, nota: str) -> dict:
    try:
        dossier = Dossier.objects.get(id=expediente_id)
    except Dossier.DoesNotExist:
        return {"error": f"No existe ningún expediente con id {expediente_id}."}

    marca = timezone.localtime().strftime("%d/%m/%Y %H:%M")
    linea = f"[Asistente, {marca}] {nota}"
    dossier.notes = f"{dossier.notes}\n{linea}" if dossier.notes else linea
    dossier.save(update_fields=["notes", "updated_at"])
    return {"ok": True, "expediente_id": dossier.id, "notas": dossier.notes}


_FUNCIONES = {
    "buscar_clientes": lambda entrada: buscar_clientes(entrada["consulta"]),
    "listar_expedientes": lambda entrada: listar_expedientes(
        entrada.get("estado"), entrada.get("cliente_id")
    ),
    "documentos_por_expirar": lambda entrada: documentos_por_expirar(entrada.get("dias", 90)),
    "agregar_nota_expediente": lambda entrada: agregar_nota_expediente(
        entrada["expediente_id"], entrada["nota"]
    ),
}


def ejecutar_tool(nombre: str, entrada: dict) -> dict | list:
    funcion = _FUNCIONES.get(nombre)
    if funcion is None:
        return {"error": f"Herramienta desconocida: {nombre}"}

    return funcion(entrada)
