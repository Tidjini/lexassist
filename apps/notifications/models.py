from django.conf import settings
from django.db import models


class Notification(models.Model):
    """
    Notification persistée pour un utilisateur (relue au polling côté frontend) —
    poussée aussi en temps réel sur le WebSocket via apps.notifications.utils.notificar
    quand le group Channels notifications_user_{id} a un client connecté (voir
    apps.notifications.consumers.NotificationConsumer).
    """

    class Tipo(models.TextChoices):
        DOCUMENTO_PROCESADO = "DOCUMENTO_PROCESADO", "Documento procesado"
        DOCUMENTO_ERROR = "DOCUMENTO_ERROR", "Error al procesar documento"

    destinataire = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notificaciones"
    )
    tipo = models.CharField(max_length=30, choices=Tipo.choices)
    mensaje = models.CharField(max_length=255)
    documento = models.ForeignKey(
        "documents.Document", null=True, blank=True, on_delete=models.CASCADE, related_name="notificaciones"
    )
    leida = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Notification"
        verbose_name_plural = "Notifications"

    def __str__(self):
        return f"{self.destinataire}: {self.mensaje}"
