from django.conf import settings
from django.db import models
from apps.core.models import TimeStampedModel
from apps.clients.models import Client
from apps.dossiers.models import Dossier


class Document(TimeStampedModel):
    """
    Upload et rangement par catégorie manuelle (Phase 1), classification et extraction
    automatiques par l'IA (Claude vision) en complément (Phase 2, cf. apps.documents.vision
    et apps.documents.tasks) — la catégorie reste toujours modifiable manuellement, l'IA ne
    fait que suggérer (`categorie_suggeree`) tant que l'humain n'a pas validé.
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

    class EstadoIA(models.TextChoices):
        PENDIENTE = "PENDIENTE", "Pendiente"
        PROCESANDO = "PROCESANDO", "Procesando"
        COMPLETADO = "COMPLETADO", "Completado"
        ERROR = "ERROR", "Error"
        SIN_CLAVE = "SIN_CLAVE", "Sin clave configurada"

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

    # Pipeline IA (Phase 2) — voir apps.documents.tasks.procesar_documento.
    estado_ia = models.CharField(max_length=20, choices=EstadoIA.choices, default=EstadoIA.PENDIENTE)
    categoria_sugerida = models.CharField(max_length=20, choices=Categorie.choices, blank=True)
    datos_extraidos = models.JSONField(default=dict, blank=True)
    fecha_expiracion = models.DateField(null=True, blank=True)
    error_ia = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Document"
        verbose_name_plural = "Documents"

    def __str__(self):
        return self.nom_original or self.fichier.name
