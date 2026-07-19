from types import SimpleNamespace
from unittest.mock import patch

import pytest
from django_tenants.utils import schema_context

from apps.tenants.models import Cabinet
from apps.accounts.models import User
from apps.clients.factories import ClientFactory
from apps.assistant.models import Conversacion, Mensaje
from apps.assistant.service import responder


@pytest.fixture
def cabinet(db):
    c = Cabinet(schema_name="testassistantservice", nom="Cabinet Test Assistant Service")
    c.save(verbosity=0)
    return c


@pytest.fixture
def avocat(cabinet):
    return User.objects.create_user(
        username=User.make_username(cabinet, "avocat@testassistantservice.es"),
        email="avocat@testassistantservice.es", password="x", role=User.Role.AVOCAT, cabinet=cabinet,
    )


def _bloque_texto(texto):
    return SimpleNamespace(type="text", text=texto)


def _bloque_tool_use(id_, nombre, entrada):
    return SimpleNamespace(type="tool_use", id=id_, name=nombre, input=entrada)


@pytest.mark.django_db
class TestResponder:
    def test_sin_clave_guarda_el_mensaje_usuario_pero_no_responde(self, cabinet, avocat):
        with schema_context(cabinet.schema_name):
            conversacion = Conversacion.objects.create(usuario=avocat)

            with pytest.raises(RuntimeError, match="ANTHROPIC_API_KEY"):
                responder(conversacion, "¿Qué pasaportes caducan pronto?")

            mensajes = list(conversacion.mensajes.all())
            assert len(mensajes) == 1
            assert mensajes[0].rol == Mensaje.Rol.USUARIO
            assert mensajes[0].contenido == "¿Qué pasaportes caducan pronto?"

    def test_respuesta_directa_sin_tool_use(self, cabinet, avocat, settings):
        settings.ANTHROPIC_API_KEY = "fake-key"
        with schema_context(cabinet.schema_name):
            conversacion = Conversacion.objects.create(usuario=avocat)

            respuesta_final = SimpleNamespace(
                stop_reason="end_turn", content=[_bloque_texto("Hola, ¿en qué puedo ayudarte?")]
            )

            with patch("apps.assistant.service.anthropic.Anthropic") as ClienteMock:
                ClienteMock.return_value.messages.create.return_value = respuesta_final

                mensaje = responder(conversacion, "Hola")

            assert mensaje.rol == Mensaje.Rol.ASISTENTE
            assert mensaje.contenido == "Hola, ¿en qué puedo ayudarte?"
            assert ClienteMock.return_value.messages.create.call_count == 1

    def test_bucle_tool_use_ejecuta_la_herramienta_y_responde(self, cabinet, avocat, settings):
        settings.ANTHROPIC_API_KEY = "fake-key"
        with schema_context(cabinet.schema_name):
            ClientFactory(nom="Garcia", prenom="Maria")
            conversacion = Conversacion.objects.create(usuario=avocat)

            turno_tool_use = SimpleNamespace(
                stop_reason="tool_use",
                content=[_bloque_tool_use("call_1", "buscar_clientes", {"consulta": "Garcia"})],
            )
            turno_final = SimpleNamespace(
                stop_reason="end_turn", content=[_bloque_texto("He encontrado a Maria Garcia.")]
            )

            with patch("apps.assistant.service.anthropic.Anthropic") as ClienteMock:
                ClienteMock.return_value.messages.create.side_effect = [turno_tool_use, turno_final]

                mensaje = responder(conversacion, "Busca al cliente Garcia")

            assert mensaje.contenido == "He encontrado a Maria Garcia."
            assert ClienteMock.return_value.messages.create.call_count == 2

            # Le deuxième appel doit contenir le tool_result avec le vrai résultat de la BD.
            segundo_llamada = ClienteMock.return_value.messages.create.call_args_list[1]
            mensajes_enviados = segundo_llamada.kwargs["messages"]
            tool_result = mensajes_enviados[-1]["content"][0]
            assert tool_result["type"] == "tool_result"
            assert "Maria Garcia" in tool_result["content"]

    def test_detiene_el_bucle_tras_max_turnos(self, cabinet, avocat, settings):
        settings.ANTHROPIC_API_KEY = "fake-key"
        with schema_context(cabinet.schema_name):
            conversacion = Conversacion.objects.create(usuario=avocat)

            turno_tool_use = SimpleNamespace(
                stop_reason="tool_use",
                content=[_bloque_tool_use("call_1", "buscar_clientes", {"consulta": "x"})],
            )

            with patch("apps.assistant.service.anthropic.Anthropic") as ClienteMock:
                ClienteMock.return_value.messages.create.return_value = turno_tool_use

                mensaje = responder(conversacion, "Busca algo")

            assert "demasiados pasos" in mensaje.contenido
