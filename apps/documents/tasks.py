from datetime import date

from celery import shared_task
from django_tenants.utils import schema_context

from apps.clients.models import Client
from apps.notifications.models import Notification
from apps.notifications.utils import notificar
from . import vision
from .models import Document


def _fecha_o_none(valeur):
    if not valeur:
        return None
    try:
        return date.fromisoformat(valeur)
    except ValueError:
        return None


def _buscar_o_crear_cliente(campos, categoria):
    """
    Rapprochement strict pour l'import en masse (upload sans client, cf. §3.1 de la
    présentation) : nom+prénom ET numéro de document doivent correspondre exactement à
    un client existant. En cas de correspondance ambiguë (plusieurs clients) ou de
    données insuffisantes, on ne devine jamais — on laisse le document sans client,
    à assigner à la main (voir DocumentViewSet.sin_clasificar).

    Retourne (client_ou_None, creado: bool).
    """
    nombre = (campos.get("nombre") or "").strip()
    apellidos = (campos.get("apellidos") or "").strip()
    numero_documento = (campos.get("numero_documento") or "").strip()

    if not (nombre and apellidos and numero_documento):
        return None, False

    champ_numero = Document.CHAMP_NUMERO_PAR_CATEGORIE.get(categoria)
    if not champ_numero:
        return None, False

    candidatos = list(
        Client.objects.filter(nom__iexact=apellidos, prenom__iexact=nombre, **{champ_numero: numero_documento})
    )

    if len(candidatos) == 1:
        return candidatos[0], False

    if len(candidatos) > 1:
        return None, False

    cliente = Client.objects.create(
        nom=apellidos,
        prenom=nombre,
        date_naissance=_fecha_o_none(campos.get("fecha_nacimiento")),
        nationalite=campos.get("nacionalidad") or "",
        **{champ_numero: numero_documento},
    )
    return cliente, True


@shared_task
def procesar_documento(document_id, schema_name):
    """
    Classification + extraction IA d'un document fraîchement uploadé (déclenché depuis
    DocumentViewSet.perform_create). `schema_name` est explicite : un worker Celery n'a
    pas de requête HTTP pour router le tenant (contrairement à TenantMainMiddleware),
    donc schema_context() est indispensable ici — même en mode CELERY_TASK_ALWAYS_EAGER,
    où le code tourne dans le même process/connexion mais on veut que ça reste correct
    quand on passera à un vrai worker asynchrone.
    """
    with schema_context(schema_name):
        try:
            documento = Document.objects.select_related("cliente", "televerse_par").get(id=document_id)
        except Document.DoesNotExist:
            return

        documento.estado_ia = Document.EstadoIA.PROCESANDO
        documento.save(update_fields=["estado_ia", "updated_at"])

        try:
            documento.fichier.open("rb")
            try:
                fichier_bytes = documento.fichier.read()
            finally:
                documento.fichier.close()

            resultado = vision.analizar_documento(fichier_bytes, documento.content_type)
            campos = resultado["campos"]

            documento.categoria_sugerida = resultado["categoria"]
            documento.datos_extraidos = campos
            documento.fecha_expiracion = _fecha_o_none(resultado.get("fecha_expiracion"))
            documento.estado_ia = Document.EstadoIA.COMPLETADO
            documento.error_ia = ""

            campos_a_sauvegarder = [
                "categoria_sugerida",
                "datos_extraidos",
                "fecha_expiracion",
                "estado_ia",
                "error_ia",
                "updated_at",
            ]

            # Import sans client (cf. DocumentoUploadDialog/page d'import en masse) :
            # on tente le rapprochement/la création automatique.
            if documento.cliente_id is None:
                cliente, creado = _buscar_o_crear_cliente(campos, documento.categoria_sugerida)
                if cliente is not None:
                    documento.cliente = cliente
                    documento.cliente_confirmado = False
                    campos_a_sauvegarder += ["cliente", "cliente_confirmado"]
                    mensaje = (
                        f"Documento «{documento.nom_original}»: cliente nuevo «{cliente}» creado."
                        if creado
                        else f"Documento «{documento.nom_original}»: asociado al cliente «{cliente}»."
                    )
                else:
                    mensaje = f"Documento «{documento.nom_original}» analizado: sin cliente, revisar manualmente."
            else:
                mensaje = f"Documento «{documento.nom_original}» analizado."

            documento.save(update_fields=campos_a_sauvegarder)
            tipo = Notification.Tipo.DOCUMENTO_PROCESADO
        except RuntimeError as e:
            documento.estado_ia = Document.EstadoIA.SIN_CLAVE
            documento.error_ia = str(e)
            documento.save(update_fields=["estado_ia", "error_ia", "updated_at"])
            tipo = Notification.Tipo.DOCUMENTO_ERROR
            mensaje = f"Documento «{documento.nom_original}» no analizado: falta configurar la IA."
        except Exception as e:  # noqa: BLE001 — toute erreur IA doit finir en notification, pas en 500 silencieux
            documento.estado_ia = Document.EstadoIA.ERROR
            documento.error_ia = str(e)[:255]
            documento.save(update_fields=["estado_ia", "error_ia", "updated_at"])
            tipo = Notification.Tipo.DOCUMENTO_ERROR
            mensaje = f"Error al analizar «{documento.nom_original}»."

        if documento.televerse_par:
            notificar(documento.televerse_par, tipo, mensaje, documento=documento)
