from rest_framework import serializers

from .models import Document

TYPES_AUTORISES = {"image/jpeg", "image/png", "image/webp", "application/pdf"}


class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = [
            "id", "cliente", "dossier", "fichier", "nom_original", "categorie", "taille",
            "content_type", "televerse_par", "created_at", "updated_at",
        ]
        read_only_fields = ["nom_original", "taille", "content_type", "televerse_par"]

    def validate_fichier(self, fichier):
        if fichier.content_type not in TYPES_AUTORISES:
            raise serializers.ValidationError(
                "Type de fichier non supporté (image ou PDF uniquement)."
            )
        return fichier

    def validate(self, attrs):
        dossier = attrs.get("dossier")
        cliente = attrs.get("cliente", getattr(self.instance, "cliente", None))
        if dossier is not None and dossier.cliente_id != cliente.id:
            raise serializers.ValidationError(
                {"dossier": "Ce dossier n'appartient pas au client indiqué."}
            )
        return attrs
