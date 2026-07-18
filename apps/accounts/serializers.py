from rest_framework import serializers
from .models import User


class UserSerializer(serializers.ModelSerializer):
    displayName = serializers.SerializerMethodField()
    photoURL = serializers.SerializerMethodField()
    cabinet_nom = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "role", "telephone",
                  "displayName", "photoURL", "cabinet_nom"]

    def get_displayName(self, obj):
        # obj.username est un identifiant technique namespacé par cabinet (cf.
        # User.make_username), jamais adapté à l'affichage — préférer l'email.
        return obj.get_full_name() or obj.email or obj.username

    def get_photoURL(self, obj):
        return ""

    def get_cabinet_nom(self, obj):
        return obj.cabinet.nom if obj.cabinet_id else ""

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if data.get("role"):
            data["role"] = data["role"].lower()
        return data
