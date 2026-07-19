from unittest.mock import patch

import pytest
from django_tenants.utils import schema_context
from rest_framework.test import APIRequestFactory, force_authenticate

from apps.tenants.models import Cabinet
from apps.accounts.models import User
from apps.assistant.models import Conversacion, Mensaje
from apps.assistant.views import ConversacionViewSet


@pytest.fixture
def cabinet(db):
    c = Cabinet(schema_name="testassistantviews", nom="Cabinet Test Assistant Views")
    c.save(verbosity=0)
    return c


@pytest.fixture
def avocat(cabinet):
    return User.objects.create_user(
        username=User.make_username(cabinet, "avocat@testassistantviews.es"),
        email="avocat@testassistantviews.es", password="x", role=User.Role.AVOCAT, cabinet=cabinet,
    )


@pytest.fixture
def otro_avocat(cabinet):
    return User.objects.create_user(
        username=User.make_username(cabinet, "otro@testassistantviews.es"),
        email="otro@testassistantviews.es", password="x", role=User.Role.AVOCAT, cabinet=cabinet,
    )


def appeler(metodo, user, url, action, data=None):
    factory = APIRequestFactory()
    request = getattr(factory, metodo)(url, data, format="json")
    force_authenticate(request, user=user)
    view = ConversacionViewSet.as_view({metodo: action})
    return view(request)


@pytest.mark.django_db
class TestConversacionViewSet:
    def test_actual_crea_la_conversacion_si_no_existe(self, cabinet, avocat):
        with schema_context(cabinet.schema_name):
            assert not Conversacion.objects.filter(usuario=avocat).exists()

            response = appeler("get", avocat, "/api/asistente/conversaciones/actual/", "actual")

            assert response.status_code == 200
            assert Conversacion.objects.filter(usuario=avocat).exists()

    def test_actual_no_duplica_la_conversacion(self, cabinet, avocat):
        with schema_context(cabinet.schema_name):
            appeler("get", avocat, "/api/asistente/conversaciones/actual/", "actual")
            appeler("get", avocat, "/api/asistente/conversaciones/actual/", "actual")

            assert Conversacion.objects.filter(usuario=avocat).count() == 1

    def test_enviar_mensaje_vacio_rechazado(self, cabinet, avocat):
        with schema_context(cabinet.schema_name):
            response = appeler(
                "post", avocat, "/api/asistente/conversaciones/enviar_mensaje/", "enviar_mensaje",
                data={"texto": "   "},
            )

            assert response.status_code == 400

    def test_enviar_mensaje_sin_clave_devuelve_error_pero_guarda_el_mensaje(self, cabinet, avocat):
        with schema_context(cabinet.schema_name):
            response = appeler(
                "post", avocat, "/api/asistente/conversaciones/enviar_mensaje/", "enviar_mensaje",
                data={"texto": "Hola"},
            )

            assert response.status_code == 200
            assert response.data["error"] == "SIN_CLAVE"
            mensajes = response.data["conversacion"]["mensajes"]
            assert len(mensajes) == 1
            assert mensajes[0]["rol"] == Mensaje.Rol.USUARIO

    def test_enviar_mensaje_con_respuesta_ok(self, cabinet, avocat):
        with schema_context(cabinet.schema_name):
            with patch("apps.assistant.service.settings.ANTHROPIC_API_KEY", "fake-key"), patch(
                "apps.assistant.service.anthropic.Anthropic"
            ) as ClienteMock:
                from types import SimpleNamespace

                ClienteMock.return_value.messages.create.return_value = SimpleNamespace(
                    stop_reason="end_turn",
                    content=[SimpleNamespace(type="text", text="¡Hola! ¿En qué puedo ayudarte?")],
                )

                response = appeler(
                    "post", avocat, "/api/asistente/conversaciones/enviar_mensaje/", "enviar_mensaje",
                    data={"texto": "Hola"},
                )

            assert response.status_code == 200
            assert "error" not in response.data
            mensajes = response.data["conversacion"]["mensajes"]
            assert len(mensajes) == 2
            assert mensajes[1]["contenido"] == "¡Hola! ¿En qué puedo ayudarte?"

    def test_no_ve_la_conversacion_de_otro_usuario(self, cabinet, avocat, otro_avocat):
        with schema_context(cabinet.schema_name):
            appeler("get", avocat, "/api/asistente/conversaciones/actual/", "actual")
            appeler("get", otro_avocat, "/api/asistente/conversaciones/actual/", "actual")

            assert Conversacion.objects.filter(usuario=avocat).count() == 1
            assert Conversacion.objects.filter(usuario=otro_avocat).count() == 1
