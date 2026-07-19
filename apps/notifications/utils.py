from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from .models import Notification


def notificar(user, tipo, mensaje, documento=None):
    """
    Crée la notification en base (relue au polling, voir NotificationViewSet) et la
    pousse en temps réel sur le group Channels de l'utilisateur — sans effet si aucun
    client n'est connecté sur ws://.../ws/notifications/ (NotificationConsumer gère déjà
    l'absence de Redis/canal proprement, cf. apps.notifications.consumers).
    """
    notification = Notification.objects.create(
        destinataire=user, tipo=tipo, mensaje=mensaje, documento=documento
    )

    channel_layer = get_channel_layer()
    if channel_layer is None:
        return notification

    async_to_sync(channel_layer.group_send)(
        f"notifications_user_{user.id}",
        {
            "type": "notification",
            "data": {
                "id": notification.id,
                "tipo": notification.tipo,
                "mensaje": notification.mensaje,
                "documento": notification.documento_id,
                "created_at": notification.created_at.isoformat(),
            },
        },
    )
    return notification
