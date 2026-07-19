from unittest.mock import Mock, patch

import pytest
from django.test import override_settings

from apps.documents.vision import analizar_documento


class TestAnalizarDocumento:
    def test_sans_clave_leve_runtime_error(self):
        with override_settings(ANTHROPIC_API_KEY=""):
            with pytest.raises(RuntimeError):
                analizar_documento(b"contenido", "application/pdf")

    def test_llama_a_claude_con_el_esquema_estructurado(self):
        respuesta = Mock()
        bloque_texto = Mock(
            type="text",
            text='{"categoria": "NIE", "campos": {"nombre": "Maria"}, "fecha_expiracion": "2027-01-01"}',
        )
        respuesta.content = [bloque_texto]

        with override_settings(ANTHROPIC_API_KEY="sk-test"):
            with patch("apps.documents.vision.anthropic.Anthropic") as cliente_mock:
                cliente_mock.return_value.messages.create.return_value = respuesta
                resultado = analizar_documento(b"contenido", "image/jpeg")

        assert resultado["categoria"] == "NIE"
        assert resultado["campos"]["nombre"] == "Maria"
        cliente_mock.return_value.messages.create.assert_called_once()
        kwargs = cliente_mock.return_value.messages.create.call_args.kwargs
        assert kwargs["output_config"]["format"]["type"] == "json_schema"
