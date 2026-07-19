from types import SimpleNamespace
from unittest.mock import patch

import pytest
from django.test import override_settings
from django_tenants.utils import schema_context

from apps.tenants.models import Cabinet
from apps.accounts.models import User
from apps.clients.factories import ClientFactory
from apps.dossiers.factories import DossierFactory
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


@pytest.mark.django_db
class TestResponderSimulado:
    """IA_MODO_SIMULADO : interrupteur explicite (jamais activé automatiquement) pour
    tester la boucle complète — dispatch d'un outil réel sur les vraies données — sans
    clé API."""

    @override_settings(ANTHROPIC_API_KEY="", IA_MODO_SIMULADO=True)
    def test_reconoce_pregunta_sobre_documentos_por_expirar(self, cabinet, avocat):
        with schema_context(cabinet.schema_name):
            conversacion = Conversacion.objects.create(usuario=avocat)

            mensaje = responder(conversacion, "¿Qué pasaportes caducan pronto?")

            assert mensaje.contenido.startswith("[Modo simulado]")
            assert "caducar" in mensaje.contenido

    @override_settings(ANTHROPIC_API_KEY="", IA_MODO_SIMULADO=True)
    def test_reconoce_busqueda_de_cliente_y_usa_la_base_real(self, cabinet, avocat):
        with schema_context(cabinet.schema_name):
            ClientFactory(nom="Garcia", prenom="Maria")
            conversacion = Conversacion.objects.create(usuario=avocat)

            mensaje = responder(conversacion, "busca cliente Garcia")

            assert "Maria Garcia" in mensaje.contenido

    @override_settings(ANTHROPIC_API_KEY="", IA_MODO_SIMULADO=True)
    def test_reconoce_peticion_de_expedientes(self, cabinet, avocat):
        with schema_context(cabinet.schema_name):
            dossier = DossierFactory(titre="Arraigo social")
            conversacion = Conversacion.objects.create(usuario=avocat)

            mensaje = responder(conversacion, "lista los expedientes")

            assert "Arraigo social" in mensaje.contenido

    @override_settings(ANTHROPIC_API_KEY="", IA_MODO_SIMULADO=True)
    def test_sin_palabra_clave_reconocida_da_una_respuesta_generica(self, cabinet, avocat):
        with schema_context(cabinet.schema_name):
            conversacion = Conversacion.objects.create(usuario=avocat)

            mensaje = responder(conversacion, "buenos días")

            assert mensaje.contenido.startswith("[Modo simulado]")
            assert "No he reconocido" in mensaje.contenido

    @override_settings(ANTHROPIC_API_KEY="sk-test", IA_MODO_SIMULADO=True)
    def test_una_vraie_cle_es_siempre_prioritaria_sobre_la_simulacion(self, cabinet, avocat):
        with schema_context(cabinet.schema_name):
            conversacion = Conversacion.objects.create(usuario=avocat)
            respuesta_final = SimpleNamespace(stop_reason="end_turn", content=[_bloque_texto("Hola real")])

            with patch("apps.assistant.service.anthropic.Anthropic") as ClienteMock:
                ClienteMock.return_value.messages.create.return_value = respuesta_final
                mensaje = responder(conversacion, "Hola")

            assert mensaje.contenido == "Hola real"
            assert not mensaje.contenido.startswith("[Modo simulado]")
