from datetime import timedelta

from django.db import connection, transaction
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Document
from .serializers import AlertaDocumentoSerializer, AplicarAClienteSerializer, DocumentSerializer
from .tasks import procesar_documento


class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.select_related("cliente", "dossier").all()
    serializer_class = DocumentSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["cliente", "dossier", "categorie"]

    def perform_create(self, serializer):
        fichier = serializer.validated_data["fichier"]
        documento = serializer.save(
            televerse_par=self.request.user,
            nom_original=fichier.name,
            taille=fichier.size,
            content_type=fichier.content_type,
        )
        schema_name = connection.schema_name
        transaction.on_commit(lambda: procesar_documento.delay(documento.id, schema_name))

    @action(detail=True, methods=["post"])
    def aplicar_a_cliente(self, request, pk=None):
        """
        Écran de validation humaine : copie vers le Client les champs choisis parmi
        ceux extraits par l'IA (jamais automatique — l'utilisateur choisit quoi
        appliquer). Ne touche jamais un champ non demandé.
        """
        documento = self.get_object()

        if documento.cliente_id is None:
            raise ValidationError("Este documento no tiene cliente asignado todavía.")

        serializer = AplicarAClienteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        campos = serializer.validated_data["campos"]
        aplicar_categoria = serializer.validated_data["aplicar_categoria"]

        cliente = documento.cliente
        datos = documento.datos_extraidos or {}
        actualizados = []

        if "nombre" in campos and datos.get("nombre"):
            cliente.prenom = datos["nombre"]
            actualizados.append("prenom")
        if "apellidos" in campos and datos.get("apellidos"):
            cliente.nom = datos["apellidos"]
            actualizados.append("nom")
        if "fecha_nacimiento" in campos and datos.get("fecha_nacimiento"):
            cliente.date_naissance = datos["fecha_nacimiento"]
            actualizados.append("date_naissance")
        if "nacionalidad" in campos and datos.get("nacionalidad"):
            cliente.nationalite = datos["nacionalidad"]
            actualizados.append("nationalite")
        if "numero_documento" in campos and datos.get("numero_documento"):
            champ = Document.CHAMP_NUMERO_PAR_CATEGORIE.get(documento.categoria_sugerida)
            if champ:
                setattr(cliente, champ, datos["numero_documento"])
                actualizados.append(champ)

        if actualizados:
            cliente.save(update_fields=actualizados + ["updated_at"])

        if aplicar_categoria and documento.categoria_sugerida:
            documento.categorie = documento.categoria_sugerida
            documento.save(update_fields=["categorie", "updated_at"])

        from apps.clients.serializers import ClientSerializer

        return Response(ClientSerializer(cliente).data)

    @action(detail=True, methods=["post"])
    def confirmar_cliente(self, request, pk=None):
        """Le client rattaché/créé automatiquement par l'IA (cliente_confirmado=False)
        est le bon — rien à changer, on marque juste comme validé."""
        documento = self.get_object()

        if documento.cliente_id is None:
            raise ValidationError("Este documento no tiene cliente asignado todavía.")

        documento.cliente_confirmado = True
        documento.save(update_fields=["cliente_confirmado", "updated_at"])
        return Response(DocumentSerializer(documento, context=self.get_serializer_context()).data)

    @action(detail=False, methods=["get"])
    def sin_clasificar(self, request):
        """Documents importés sans client choisi, que l'IA n'a pas pu rattacher ni
        transformer en nouveau client (données insuffisantes ou correspondance
        ambiguë) — à assigner manuellement."""
        documentos = Document.objects.filter(cliente__isnull=True).order_by("-created_at")
        return Response(DocumentSerializer(documentos, many=True, context=self.get_serializer_context()).data)

    @action(detail=False, methods=["get"])
    def alertas(self, request):
        limite = timezone.localdate() + timedelta(days=90)
        documentos = (
            Document.objects.select_related("cliente")
            .filter(fecha_expiracion__isnull=False, fecha_expiracion__lte=limite)
            .order_by("fecha_expiracion")
        )
        return Response(AlertaDocumentoSerializer(documentos, many=True).data)
