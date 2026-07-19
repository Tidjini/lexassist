from datetime import date

from celery import shared_task
from django_tenants.utils import schema_context

from apps.notifications.models import Notification
from apps.notifications.utils import notificar
from . import vision
from .models import Document


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

            documento.categoria_sugerida = resultado["categoria"]
            documento.datos_extraidos = resultado["campos"]
            fecha = resultado.get("fecha_expiracion")
            documento.fecha_expiracion = date.fromisoformat(fecha) if fecha else None
            documento.estado_ia = Document.EstadoIA.COMPLETADO
            documento.error_ia = ""
            documento.save(
                update_fields=[
                    "categoria_sugerida",
                    "datos_extraidos",
                    "fecha_expiracion",
                    "estado_ia",
                    "error_ia",
                    "updated_at",
                ]
            )
            tipo = Notification.Tipo.DOCUMENTO_PROCESADO
            mensaje = f"Documento «{documento.nom_original}» analizado."
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
