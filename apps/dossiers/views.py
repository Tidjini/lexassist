from django.db import transaction
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.filters import SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Dossier, DossierEvenement
from .serializers import ChangerStatutSerializer, DossierDetailSerializer, DossierSerializer


class DossierViewSet(viewsets.ModelViewSet):
    queryset = Dossier.objects.select_related("cliente").all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ["statut", "cliente"]
    search_fields = ["titre", "type_procedure", "cliente__nom", "cliente__prenom"]

    def get_serializer_class(self):
        if self.action == "retrieve":
            return DossierDetailSerializer
        return DossierSerializer

    def perform_create(self, serializer):
        serializer.save(cree_par=self.request.user)

    @action(detail=True, methods=["post"])
    def changer_statut(self, request, pk=None):
        dossier = self.get_object()
        serializer = ChangerStatutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        nouveau_statut = serializer.validated_data["statut"]

        if nouveau_statut == dossier.statut:
            raise ValidationError({"statut": "Le dossier a déjà ce statut."})

        with transaction.atomic():
            DossierEvenement.objects.create(
                dossier=dossier,
                auteur=request.user,
                ancien_statut=dossier.statut,
                nouveau_statut=nouveau_statut,
                commentaire=serializer.validated_data["commentaire"],
            )
            dossier.statut = nouveau_statut
            if nouveau_statut == Dossier.Statut.RESOLU:
                from django.utils import timezone
                dossier.date_cloture = timezone.localdate()
            dossier.save(update_fields=["statut", "date_cloture", "updated_at"])

        return Response(DossierDetailSerializer(dossier).data)
