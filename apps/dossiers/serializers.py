from rest_framework import serializers

from apps.accounts.serializers import UserSerializer
from .models import Dossier, DossierEvenement


class DossierEvenementSerializer(serializers.ModelSerializer):
    auteur = UserSerializer(read_only=True)

    class Meta:
        model = DossierEvenement
        fields = ["id", "ancien_statut", "nouveau_statut", "commentaire", "auteur", "created_at"]


class DossierSerializer(serializers.ModelSerializer):
    cree_par = UserSerializer(read_only=True)
    cliente_nom_complet = serializers.SerializerMethodField()

    class Meta:
        model = Dossier
        fields = [
            "id", "cliente", "cliente_nom_complet", "titre", "type_procedure", "statut",
            "date_ouverture", "date_cloture", "notes", "cree_par", "created_at", "updated_at",
        ]
        read_only_fields = ["statut"]

    def get_cliente_nom_complet(self, obj):
        return f"{obj.cliente.prenom} {obj.cliente.nom}"


class DossierDetailSerializer(DossierSerializer):
    evenements = DossierEvenementSerializer(many=True, read_only=True)

    class Meta(DossierSerializer.Meta):
        fields = DossierSerializer.Meta.fields + ["evenements"]


class ChangerStatutSerializer(serializers.Serializer):
    statut = serializers.ChoiceField(choices=Dossier.Statut.choices)
    commentaire = serializers.CharField(required=False, allow_blank=True, default="")
