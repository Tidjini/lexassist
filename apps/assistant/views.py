from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Conversacion
from .serializers import ConversacionSerializer
from .service import responder


class ConversacionViewSet(viewsets.GenericViewSet):
    """
    Une seule conversation par utilisateur pour cette première passe (Phase 4) — pas de
    sélecteur de plusieurs fils côté frontend. `actual` la récupère (ou la crée), `enviar_
    mensaje` y ajoute un tour de dialogue.
    """

    serializer_class = ConversacionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Conversacion.objects.filter(usuario=self.request.user)

    def _conversacion_actual(self):
        conversacion, _ = Conversacion.objects.get_or_create(usuario=self.request.user)
        return conversacion

    @action(detail=False, methods=["get"])
    def actual(self, request):
        return Response(self.get_serializer(self._conversacion_actual()).data)

    @action(detail=False, methods=["post"])
    def enviar_mensaje(self, request):
        texto = (request.data.get("texto") or "").strip()

        if not texto:
            return Response({"detail": "El mensaje no puede estar vacío."}, status=status.HTTP_400_BAD_REQUEST)

        conversacion = self._conversacion_actual()

        try:
            responder(conversacion, texto)
        except RuntimeError as exc:
            return Response(
                {
                    "error": "SIN_CLAVE",
                    "detalle": str(exc),
                    "conversacion": self.get_serializer(conversacion).data,
                }
            )

        return Response({"conversacion": self.get_serializer(conversacion).data})
