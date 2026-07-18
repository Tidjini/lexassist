from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        SUPERADMIN = "SUPERADMIN", "Super administrateur"   # staff plateforme, schéma public
        AVOCAT     = "AVOCAT",     "Avocat·e"               # admin du cabinet
        ASSISTANT  = "ASSISTANT",  "Assistant·e"

    role = models.CharField(max_length=20, choices=Role, default=Role.ASSISTANT)

    # Même déviation que schoolavia : les cabinets sont des tenants indépendants,
    # un login est rattaché à un seul cabinet (isolation stricte). Seul SUPERADMIN
    # (staff plateforme, schéma public) n'a pas de cabinet. on_delete=CASCADE :
    # un compte AVOCAT/ASSISTANT n'a aucun sens sans cabinet, et SET_NULL
    # violerait la contrainte superadmin_or_has_cabinet à la suppression.
    cabinet = models.ForeignKey(
        "tenants.Cabinet",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="utilisateurs",
    )
    telephone = models.CharField(max_length=20, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["cabinet", "email"], name="uniq_cabinet_email"),
            models.UniqueConstraint(
                fields=["email"], condition=models.Q(cabinet__isnull=True), name="uniq_superadmin_email"
            ),
            models.CheckConstraint(
                condition=models.Q(role="SUPERADMIN") | models.Q(cabinet__isnull=False),
                name="superadmin_or_has_cabinet",
            ),
        ]

    def __str__(self):
        return self.get_full_name() or self.username

    @staticmethod
    def make_username(cabinet, email):
        """
        `username` (champ technique hérité d'AbstractUser) reste unique GLOBALEMENT,
        alors que `email` (identifiant de connexion réel) n'est unique que par
        cabinet (uniq_cabinet_email). Deux cabinets différents doivent pouvoir
        avoir un compte sur la même adresse email sans collision de `username` :
        on le préfixe donc par le schéma du cabinet. SUPERADMIN (cabinet=None,
        unique globalement de toute façon) garde l'email tel quel.
        """
        if cabinet is None:
            return email
        return f"{cabinet.schema_name}+{email}"
