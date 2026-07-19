import datetime
from unittest.mock import Mock, patch

import pytest
from django.test import override_settings

from apps.documents.models import Document
from apps.documents.vision import analizar_documento, analizar_documento_simulado


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


class TestAnalizarDocumentoSimulado:
    def test_extrae_categoria_nombre_y_numero(self):
        # Convention : prénom (nombre) avant nom de famille (apellidos) dans le nom de
        # fichier, pour matcher _buscar_o_crear_cliente (nombre→prenom, apellidos→nom).
        resultado = analizar_documento_simulado("Maria_Garcia_PASAPORTE_X1234567A.jpg")

        assert resultado["categoria"] == Document.Categorie.PASSEPORT
        assert resultado["campos"]["nombre"] == "Maria"
        assert resultado["campos"]["apellidos"] == "Garcia"
        assert resultado["campos"]["numero_documento"] == "X1234567A"

    def test_reconoce_alias_de_categoria(self):
        resultado = analizar_documento_simulado("Lopez_Juan_PASAPORTE.jpg")
        assert resultado["categoria"] == Document.Categorie.PASSEPORT

        resultado_padron = analizar_documento_simulado("Lopez_Juan_PADRON.jpg")
        assert resultado_padron["categoria"] == Document.Categorie.EMPADRONAMIENTO

    def test_usa_fecha_explicita_del_nombre(self):
        resultado = analizar_documento_simulado("Garcia_Maria_NIE_2027-03-15.jpg")

        assert resultado["fecha_expiracion"] == "2027-03-15"

    def test_genera_fecha_por_defecto_para_categorias_que_expiran(self):
        resultado = analizar_documento_simulado("Garcia_Maria_NIE.jpg")

        assert resultado["fecha_expiracion"] is not None
        fecha = datetime.date.fromisoformat(resultado["fecha_expiracion"])
        assert fecha > datetime.date.today()

    def test_sin_fecha_para_categorias_que_no_expiran(self):
        resultado = analizar_documento_simulado("Garcia_Maria_DIPLOMA.jpg")

        assert resultado["fecha_expiracion"] is None

    def test_sin_indicios_reconocidos_cae_en_autre_y_no_permite_rapprocher_cliente(self):
        # Un seul token alphabétique : nombre extrait, mais apellidos manque — pas assez
        # pour le rapprochement/la création automatique de client (voir
        # apps.documents.tasks._buscar_o_crear_cliente), exactement le chemin qu'on veut
        # pouvoir tester : document qui reste « sans client ».
        resultado = analizar_documento_simulado("documento.pdf")

        assert resultado["categoria"] == Document.Categorie.AUTRE
        assert resultado["campos"]["apellidos"] is None
        assert resultado["campos"]["numero_documento"] is None
