import datetime

import pytest
from django_tenants.utils import schema_context

from apps.tenants.models import Cabinet
from apps.clients.factories import ClientFactory
from apps.dossiers.factories import DossierFactory
from apps.dossiers.models import Dossier
from apps.documents.factories import DocumentFactory
from apps.assistant.tools import (
    agregar_nota_expediente,
    buscar_clientes,
    documentos_por_expirar,
    ejecutar_tool,
    listar_expedientes,
)


@pytest.fixture
def cabinet(db):
    c = Cabinet(schema_name="testassistanttools", nom="Cabinet Test Assistant Tools")
    c.save(verbosity=0)
    return c


@pytest.mark.django_db
class TestBuscarClientes:
    def test_encuentra_por_nombre(self, cabinet):
        with schema_context(cabinet.schema_name):
            ClientFactory(nom="Garcia", prenom="Maria")
            ClientFactory(nom="Lopez", prenom="Juan")

            resultados = buscar_clientes("Garcia")

            assert len(resultados) == 1
            assert resultados[0]["nombre"] == "Maria Garcia"

    def test_encuentra_por_nie(self, cabinet):
        with schema_context(cabinet.schema_name):
            cliente = ClientFactory(numero_nie="X1234567A")

            resultados = buscar_clientes("X1234567A")

            assert resultados[0]["id"] == cliente.id

    def test_sin_resultados(self, cabinet):
        with schema_context(cabinet.schema_name):
            ClientFactory(nom="Garcia")

            assert buscar_clientes("Inexistente") == []

    def test_limita_a_10(self, cabinet):
        with schema_context(cabinet.schema_name):
            for _ in range(15):
                ClientFactory(nom="Duplicado")

            assert len(buscar_clientes("Duplicado")) == 10


@pytest.mark.django_db
class TestListarExpedientes:
    def test_lista_todos_sin_filtro(self, cabinet):
        with schema_context(cabinet.schema_name):
            DossierFactory()
            DossierFactory()

            assert len(listar_expedientes()) == 2

    def test_filtra_por_estado(self, cabinet):
        with schema_context(cabinet.schema_name):
            DossierFactory(statut=Dossier.Statut.PREPARATION)
            DossierFactory(statut=Dossier.Statut.DEPOSE)

            resultados = listar_expedientes(estado=Dossier.Statut.DEPOSE)

            assert len(resultados) == 1
            assert resultados[0]["estado"] == Dossier.Statut.DEPOSE

    def test_filtra_por_cliente(self, cabinet):
        with schema_context(cabinet.schema_name):
            cliente = ClientFactory()
            DossierFactory(cliente=cliente)
            DossierFactory()

            resultados = listar_expedientes(cliente_id=cliente.id)

            assert len(resultados) == 1


@pytest.mark.django_db
class TestDocumentosPorExpirar:
    def test_incluye_documentos_dentro_del_rango(self, cabinet):
        with schema_context(cabinet.schema_name):
            pronto = datetime.date.today() + datetime.timedelta(days=10)
            DocumentFactory(fecha_expiracion=pronto)

            resultados = documentos_por_expirar(dias=90)

            assert len(resultados) == 1
            assert resultados[0]["dias_restantes"] == 10

    def test_excluye_documentos_fuera_de_rango(self, cabinet):
        with schema_context(cabinet.schema_name):
            lejos = datetime.date.today() + datetime.timedelta(days=200)
            DocumentFactory(fecha_expiracion=lejos)

            assert documentos_por_expirar(dias=90) == []

    def test_excluye_documentos_sin_cliente(self, cabinet):
        with schema_context(cabinet.schema_name):
            pronto = datetime.date.today() + datetime.timedelta(days=10)
            DocumentFactory(fecha_expiracion=pronto, cliente=None)

            assert documentos_por_expirar(dias=90) == []


@pytest.mark.django_db
class TestAgregarNotaExpediente:
    def test_agrega_nota_a_expediente_vacio(self, cabinet):
        with schema_context(cabinet.schema_name):
            dossier = DossierFactory(notes="")

            resultado = agregar_nota_expediente(dossier.id, "Cliente ha llamado")

            dossier.refresh_from_db()
            assert "Cliente ha llamado" in dossier.notes
            assert resultado["ok"] is True

    def test_agrega_nota_a_expediente_con_notas_existentes(self, cabinet):
        with schema_context(cabinet.schema_name):
            dossier = DossierFactory(notes="Nota anterior")

            agregar_nota_expediente(dossier.id, "Nota nueva")

            dossier.refresh_from_db()
            assert "Nota anterior" in dossier.notes
            assert "Nota nueva" in dossier.notes

    def test_expediente_inexistente(self, cabinet):
        with schema_context(cabinet.schema_name):
            resultado = agregar_nota_expediente(999999, "Nota")

            assert "error" in resultado


@pytest.mark.django_db
class TestEjecutarTool:
    def test_dispatch_buscar_clientes(self, cabinet):
        with schema_context(cabinet.schema_name):
            ClientFactory(nom="Garcia")

            resultado = ejecutar_tool("buscar_clientes", {"consulta": "Garcia"})

            assert len(resultado) == 1

    def test_herramienta_desconocida(self, cabinet):
        with schema_context(cabinet.schema_name):
            resultado = ejecutar_tool("no_existe", {})

            assert "error" in resultado
