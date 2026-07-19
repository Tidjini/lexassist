from django.conf import settings
from django.db import models
from apps.core.models import TimeStampedModel
from apps.clients.models import Client
from apps.dossiers.models import Dossier


class Document(TimeStampedModel):
    """
    Upload et rangement par catégorie manuelle (Phase 1). La classification et
    l'extraction automatiques par l'IA (Claude vision) arrivent en Phase 2.
    """

    class Categorie(models.TextChoices):
        PASSEPORT = "PASSEPORT", "Passeport"
        NIE = "NIE", "NIE"
        DNI = "DNI", "DNI"
        EMPADRONAMIENTO = "EMPADRONAMIENTO", "Empadronamiento"
        CONTRAT = "CONTRAT", "Contrat"
        VIDA_LABORAL = "VIDA_LABORAL", "Vida laboral"
        FICHE_PAIE = "FICHE_PAIE", "Fiche de paie"
        DIPLOME = "DIPLOME", "Diplôme"
        CASIER_JUDICIAIRE = "CASIER_JUDICIAIRE", "Casier judiciaire"
        AUTRE = "AUTRE", "Autre"

    cliente = models.ForeignKey(Client, on_delete=models.CASCADE, related_name="documents")
    dossier = models.ForeignKey(
        Dossier, null=True, blank=True, on_delete=models.SET_NULL, related_name="documents"
    )
    fichier = models.FileField(upload_to="documents/%Y/%m/")
    nom_original = models.CharField(max_length=255, blank=True)
    categorie = models.CharField(max_length=20, choices=Categorie.choices, default=Categorie.AUTRE)
    taille = models.PositiveIntegerField(default=0)
    content_type = models.CharField(max_length=100, blank=True)

    televerse_par = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="documents_televerses",
    )

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Document"
        verbose_name_plural = "Documents"

    def __str__(self):
        return self.nom_original or self.fichier.name
