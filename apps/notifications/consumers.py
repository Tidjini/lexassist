import json
import logging
from urllib.parse import parse_qs

from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

logger = logging.getLogger(__name__)


class NotificationConsumer(AsyncWebsocketConsumer):
    """
    WebSocket : ws://<cabinet>.localhost:8000/ws/notifications/?token=<jwt_access_token>
    Chaque user reçoit ses notifications dans le groupe notifications_user_{id}.
    """

    async def __call__(self, scope, receive, send):
        """
        Override pour intercepter les TimeoutError Redis qui remonteraient
        sinon jusqu'à l'ASGI server et provoqueraient un 500.
        """
        try:
            await super().__call__(scope, receive, send)
        except Exception as exc:
            logger.warning("WebSocket consumer fermé suite à une erreur : %s", exc)
            # Le client reconnectera automatiquement

    async def connect(self):
        user = await self._get_user_from_token()
        if user is None:
            await self.close(code=4001)
            return

        self.user = user
        self.group_name = f"notifications_user_{user.id}"
        self._in_group = False
        try:
            await self.channel_layer.group_add(self.group_name, self.channel_name)
            self._in_group = True
        except Exception as e:
            logger.warning("Channel layer indisponible au connect : %s", e)
            await self.accept()
            await self.send(text_data=json.dumps({
                "type": "warning",
                "message": "Redis indisponible, notifications désactivées",
            }))
            return
        await self.accept()
        await self.send(text_data=json.dumps({"type": "connected", "user": user.username}))

    async def disconnect(self, close_code):
        if hasattr(self, "group_name") and getattr(self, "_in_group", False):
            try:
                await self.channel_layer.group_discard(self.group_name, self.channel_name)
            except Exception as e:
                logger.warning("Channel layer indisponible au disconnect : %s", e)

    async def receive(self, text_data=None, bytes_data=None):
        pass

    async def notification(self, event):
        try:
            await self.send(text_data=json.dumps(event["data"]))
        except Exception as e:
            logger.warning("Erreur envoi notification : %s", e)

    @database_sync_to_async
    def _get_user_from_token(self):
        from rest_framework_simplejwt.tokens import AccessToken
        from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
        from apps.accounts.models import User

        qs = parse_qs(self.scope["query_string"].decode())
        token_key = qs.get("token", [None])[0]
        if not token_key:
            return None
        try:
            access_token = AccessToken(token_key)
            user_id = access_token["user_id"]
            return User.objects.get(id=user_id)
        except (TokenError, InvalidToken, User.DoesNotExist):
            return None
