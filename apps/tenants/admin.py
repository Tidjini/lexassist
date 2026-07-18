from django.contrib import admin
from django_tenants.admin import TenantAdminMixin
from .models import Cabinet, Domain


@admin.register(Cabinet)
class CabinetAdmin(TenantAdminMixin, admin.ModelAdmin):
    list_display = ("nom", "schema_name", "telephone", "created_at")


@admin.register(Domain)
class DomainAdmin(admin.ModelAdmin):
    list_display = ("domain", "tenant", "is_primary")
