from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Notification
from .serializers import NotificationSerializer


class NotificationViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(destinataire=self.request.user)

    @action(detail=True, methods=["post"])
    def marcar_leida(self, request, pk=None):
        notification = self.get_object()
        notification.leida = True
        notification.save(update_fields=["leida"])
        return Response(NotificationSerializer(notification).data)
