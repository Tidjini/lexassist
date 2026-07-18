from django.db import models
from django_tenants.models import TenantMixin, DomainMixin
from django_tenants.utils import schema_context


class Cabinet(TenantMixin):
    nom = models.CharField(max_length=200)
    adresse = models.CharField(max_length=255, blank=True)
    telephone = models.CharField(max_length=20, blank=True)
    email_contact = models.EmailField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    auto_create_schema = True

    def __str__(self):
        return self.nom

    def delete(self, *args, **kwargs):
        # apps.accounts.User (schéma public) peut cascader vers des modèles
        # TENANT_APPS qui n'existent que dans le schéma de CE cabinet. Sans
        # schema_context, le collector Django cherche ces tables avec un
        # search_path resté sur "public" et échoue (UndefinedTable). schema_context
        # place le schéma du cabinet en tête du search_path, les tables publiques
        # restant visibles (fallback normal de django-tenants).
        with schema_context(self.schema_name):
            return super().delete(*args, **kwargs)


class Domain(DomainMixin):
    pass
