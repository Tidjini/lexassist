from rest_framework import serializers

from apps.accounts.serializers import UserSerializer
from .models import Client


class ClientSerializer(serializers.ModelSerializer):
    cree_par = UserSerializer(read_only=True)
    nb_dossiers = serializers.IntegerField(source="dossiers.count", read_only=True)

    class Meta:
        model = Client
        fields = [
            "id", "nom", "prenom", "email", "telephone", "adresse", "date_naissance",
            "nationalite", "numero_nie", "numero_passeport", "numero_dni", "notes", "actif",
            "cree_par", "nb_dossiers", "created_at", "updated_at",
        ]
