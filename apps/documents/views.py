from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated

from .models import Document
from .serializers import DocumentSerializer


class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.select_related("cliente", "dossier").all()
    serializer_class = DocumentSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["cliente", "dossier", "categorie"]

    def perform_create(self, serializer):
        fichier = serializer.validated_data["fichier"]
        serializer.save(
            televerse_par=self.request.user,
            nom_original=fichier.name,
            taille=fichier.size,
            content_type=fichier.content_type,
        )
