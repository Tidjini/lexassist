from rest_framework import serializers

from .models import Conversacion, Mensaje


class MensajeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Mensaje
        fields = ["id", "rol", "contenido", "created_at"]
        read_only_fields = fields


class ConversacionSerializer(serializers.ModelSerializer):
    mensajes = MensajeSerializer(many=True, read_only=True)

    class Meta:
        model = Conversacion
        fields = ["id", "titulo", "mensajes", "created_at", "updated_at"]
        read_only_fields = fields
