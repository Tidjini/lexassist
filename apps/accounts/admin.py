from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ("username", "email", "role", "cabinet", "is_active")
    list_filter = ("role", "is_active", "cabinet")
    fieldsets = BaseUserAdmin.fieldsets + (
        ("Cabinet / rôle", {"fields": ("role", "cabinet", "telephone")}),
    )
