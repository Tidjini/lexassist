from rest_framework import serializers

from .models import Document

TYPES_AUTORISES = {"image/jpeg", "image/png", "image/webp", "application/pdf"}


class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = [
            "id", "cliente", "dossier", "fichier", "nom_original", "categorie", "taille",
            "content_type", "televerse_par", "created_at", "updated_at",
            "estado_ia", "categoria_sugerida", "datos_extraidos", "fecha_expiracion", "error_ia",
        ]
        # fecha_expiracion : suggérée par l'IA quand elle tourne, mais reste modifiable
        # à la main (correction, ou saisie manuelle tant qu'aucune clé n'est configurée) —
        # c'est ce champ qui alimente l'écran Alertas.
        read_only_fields = [
            "nom_original", "taille", "content_type", "televerse_par",
            "estado_ia", "categoria_sugerida", "datos_extraidos", "error_ia",
        ]

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


CAMPOS_APLICABLES = ["nombre", "apellidos", "numero_documento", "fecha_nacimiento", "nacionalidad"]


class AplicarAClienteSerializer(serializers.Serializer):
    campos = serializers.MultipleChoiceField(choices=CAMPOS_APLICABLES, required=False, default=list)
    aplicar_categoria = serializers.BooleanField(required=False, default=False)


class AlertaDocumentoSerializer(serializers.ModelSerializer):
    cliente_nom_complet = serializers.SerializerMethodField()
    dias_restantes = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = [
            "id", "cliente", "cliente_nom_complet", "nom_original", "categorie",
            "fecha_expiracion", "dias_restantes",
        ]

    def get_cliente_nom_complet(self, obj):
        return f"{obj.cliente.prenom} {obj.cliente.nom}"

    def get_dias_restantes(self, obj):
        from django.utils import timezone

        return (obj.fecha_expiracion - timezone.localdate()).days
