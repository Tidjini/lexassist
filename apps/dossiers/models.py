from django.conf import settings
from django.db import models
from apps.core.models import TimeStampedModel
from apps.clients.models import Client


class Dossier(TimeStampedModel):
    """
    Expediente : un dossier de procédure pour un client. Le catalogue structuré
    des trámites (apps.procedures) arrive en Phase 3 — `type_procedure` reste un
    champ libre en attendant.
    """

    class Statut(models.TextChoices):
        PREPARATION = "PREPARATION", "En préparation"
        DEPOSE = "DEPOSE", "Déposé"
        REQUERIMIENTO = "REQUERIMIENTO", "Requerimiento"
        RESOLU = "RESOLU", "Résolu"

    cliente = models.ForeignKey(Client, on_delete=models.CASCADE, related_name="dossiers")
    titre = models.CharField(max_length=200)
    type_procedure = models.CharField(max_length=100, blank=True)
    statut = models.CharField(max_length=20, choices=Statut.choices, default=Statut.PREPARATION)
    date_ouverture = models.DateField(auto_now_add=True)
    date_cloture = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)

    cree_par = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="dossiers_crees",
    )

    class Meta:
        ordering = ["-date_ouverture", "-id"]
        verbose_name = "Dossier"
        verbose_name_plural = "Dossiers"

    def __str__(self):
        return f"{self.titre} ({self.cliente})"


class DossierEvenement(models.Model):
    """
    Historique immuable des changements de statut d'un dossier — jamais modifié
    après création, même logique que AffectationPlace côté schoolavia.
    """

    dossier = models.ForeignKey(Dossier, on_delete=models.CASCADE, related_name="evenements")
    auteur = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="dossier_evenements",
    )
    ancien_statut = models.CharField(max_length=20, choices=Dossier.Statut.choices, blank=True)
    nouveau_statut = models.CharField(max_length=20, choices=Dossier.Statut.choices)
    commentaire = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Événement de dossier"
        verbose_name_plural = "Événements de dossier"

    def __str__(self):
        return f"{self.dossier_id}: {self.ancien_statut} → {self.nouveau_statut}"
