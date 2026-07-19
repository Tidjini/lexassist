from unittest.mock import patch

import pytest
from django_tenants.utils import schema_context

from apps.tenants.models import Cabinet
from apps.documents.factories import DocumentFactory
from apps.documents.models import Document
from apps.documents.tasks import procesar_documento
from apps.notifications.models import Notification


@pytest.fixture
def cabinet(db):
    c = Cabinet(schema_name="testdoctasks", nom="Cabinet Test Documents Tasks")
    c.save(verbosity=0)
    return c


@pytest.mark.django_db
class TestProcesarDocumento:
    def test_sin_clave_configurada(self, cabinet):
        """ANTHROPIC_API_KEY est vide dans l'environnement de test — pas besoin de
        mocker, ce test exerce le vrai chemin "pas de clé" tel qu'il tournera sur le
        VPS démo tant que la clé n'est pas ajoutée."""
        with schema_context(cabinet.schema_name):
            documento = DocumentFactory()

            procesar_documento(documento.id, cabinet.schema_name)

            documento.refresh_from_db()
            assert documento.estado_ia == Document.EstadoIA.SIN_CLAVE
            assert documento.error_ia

    def test_completado_ecrit_les_donnees_extraites(self, cabinet):
        with schema_context(cabinet.schema_name):
            documento = DocumentFactory()

            with patch("apps.documents.tasks.vision.analizar_documento") as vision_mock:
                vision_mock.return_value = {
                    "categoria": "NIE",
                    "campos": {"nombre": "Maria", "apellidos": "Garcia"},
                    "fecha_expiracion": "2027-06-01",
                }
                procesar_documento(documento.id, cabinet.schema_name)

            documento.refresh_from_db()
            assert documento.estado_ia == Document.EstadoIA.COMPLETADO
            assert documento.categoria_sugerida == "NIE"
            assert documento.datos_extraidos == {"nombre": "Maria", "apellidos": "Garcia"}
            assert str(documento.fecha_expiracion) == "2027-06-01"

    def test_erreur_inattendue_marque_error(self, cabinet):
        with schema_context(cabinet.schema_name):
            documento = DocumentFactory()

            with patch("apps.documents.tasks.vision.analizar_documento") as vision_mock:
                vision_mock.side_effect = ValueError("boom")
                procesar_documento(documento.id, cabinet.schema_name)

            documento.refresh_from_db()
            assert documento.estado_ia == Document.EstadoIA.ERROR
            assert "boom" in documento.error_ia

    def test_notifie_l_utilisateur_qui_a_televerse(self, cabinet):
        with schema_context(cabinet.schema_name):
            from apps.accounts.models import User

            user = User.objects.create_user(
                username=User.make_username(cabinet, "avocat@testdoctasks.es"),
                email="avocat@testdoctasks.es", password="x", role=User.Role.AVOCAT, cabinet=cabinet,
            )
            documento = DocumentFactory(televerse_par=user)

            procesar_documento(documento.id, cabinet.schema_name)

            assert Notification.objects.filter(destinataire=user, documento=documento).exists()

    def test_document_inexistant_ne_leve_pas(self, cabinet):
        with schema_context(cabinet.schema_name):
            procesar_documento(999999, cabinet.schema_name)
