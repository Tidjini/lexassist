from django.conf import settings
from django.db import models
from apps.core.models import TimeStampedModel


class Client(TimeStampedModel):
    """
    La « valise de données » du cabinet : fiche client construite manuellement en
    Phase 1, puis remplie automatiquement par l'IA documentaire en Phase 2. Pas de
    FK vers le cabinet : l'isolation est assurée par le schéma du tenant (comme
    Etudiant côté schoolavia).
    """

    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    email = models.EmailField(blank=True)
    telephone = models.CharField(max_length=20, blank=True)
    adresse = models.CharField(max_length=255, blank=True)
    date_naissance = models.DateField(null=True, blank=True)
    nationalite = models.CharField(max_length=100, blank=True)
    numero_nie = models.CharField(max_length=20, blank=True)
    numero_passeport = models.CharField(max_length=30, blank=True)
    numero_dni = models.CharField(max_length=20, blank=True)
    notes = models.TextField(blank=True)
    actif = models.BooleanField(default=True)

    cree_par = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="clients_crees",
    )

    class Meta:
        ordering = ["nom", "prenom"]
        verbose_name = "Client"
        verbose_name_plural = "Clients"

    def __str__(self):
        return f"{self.prenom} {self.nom}"
