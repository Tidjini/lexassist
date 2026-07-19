# Recherche intelligente et assistant conversationnel/vocal (Claude + tool use) (Phase 4).

from django.conf import settings
from django.db import models
from apps.core.models import TimeStampedModel


class Conversacion(TimeStampedModel):
    """Fil de discussion avec l'assistant — un par utilisateur pour cette première passe
    (pas de sélecteur de plusieurs fils côté UI, cf. apps.assistant.views)."""

    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="conversaciones_asistente"
    )
    titulo = models.CharField(max_length=200, blank=True)

    class Meta:
        ordering = ["-updated_at"]
        verbose_name = "Conversación"
        verbose_name_plural = "Conversaciones"
        constraints = [
            models.UniqueConstraint(fields=["usuario"], name="una_conversacion_por_usuario"),
        ]

    def __str__(self):
        return self.titulo or f"Conversación #{self.pk}"


class Mensaje(models.Model):
    class Rol(models.TextChoices):
        USUARIO = "USUARIO", "Usuario"
        ASISTENTE = "ASISTENTE", "Asistente"

    conversacion = models.ForeignKey(Conversacion, on_delete=models.CASCADE, related_name="mensajes")
    rol = models.CharField(max_length=10, choices=Rol.choices)
    contenido = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]
        verbose_name = "Mensaje"
        verbose_name_plural = "Mensajes"

    def __str__(self):
        return f"{self.rol}: {self.contenido[:50]}"
