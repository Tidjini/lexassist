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


@pytest.mark.django_db
class TestRapprochementClienteAutomatique:
    """Upload sans client (import en masse, cf. docs/LexAssist_Presentation_FR.md §3.1) :
    procesar_documento doit rattacher un client existant, en créer un nouveau, ou laisser
    le document sans client selon ce que l'extraction IA a trouvé."""

    def _resultat(self, **campos_override):
        campos = {
            "nombre": "Maria", "apellidos": "Garcia", "numero_documento": "X1234567A",
            "fecha_nacimiento": "1990-05-01", "nacionalidad": "Marroquí",
        }
        campos.update(campos_override)
        return {"categoria": "NIE", "campos": campos, "fecha_expiracion": None}

    def test_rattache_a_un_client_existant_qui_correspond(self, cabinet):
        with schema_context(cabinet.schema_name):
            from apps.clients.factories import ClientFactory

            client_existant = ClientFactory(nom="Garcia", prenom="Maria", numero_nie="X1234567A")
            documento = DocumentFactory(cliente=None)

            with patch("apps.documents.tasks.vision.analizar_documento", return_value=self._resultat()):
                procesar_documento(documento.id, cabinet.schema_name)

            documento.refresh_from_db()
            assert documento.cliente_id == client_existant.id
            assert documento.cliente_confirmado is False

    def test_cree_un_nouveau_client_si_aucune_correspondance(self, cabinet):
        with schema_context(cabinet.schema_name):
            from apps.clients.models import Client

            documento = DocumentFactory(cliente=None)

            with patch("apps.documents.tasks.vision.analizar_documento", return_value=self._resultat()):
                procesar_documento(documento.id, cabinet.schema_name)

            documento.refresh_from_db()
            assert documento.cliente is not None
            assert documento.cliente.nom == "Garcia"
            assert documento.cliente.prenom == "Maria"
            assert documento.cliente.numero_nie == "X1234567A"
            assert documento.cliente_confirmado is False
            assert Client.objects.filter(numero_nie="X1234567A").count() == 1

    def test_laisse_sans_client_si_donnees_insuffisantes(self, cabinet):
        with schema_context(cabinet.schema_name):
            documento = DocumentFactory(cliente=None)
            resultat = self._resultat(numero_documento=None)

            with patch("apps.documents.tasks.vision.analizar_documento", return_value=resultat):
                procesar_documento(documento.id, cabinet.schema_name)

            documento.refresh_from_db()
            assert documento.cliente is None
            assert documento.estado_ia == Document.EstadoIA.COMPLETADO

    def test_laisse_sans_client_si_plusieurs_correspondances(self, cabinet):
        with schema_context(cabinet.schema_name):
            from apps.clients.factories import ClientFactory

            ClientFactory(nom="Garcia", prenom="Maria", numero_nie="X1234567A")
            ClientFactory(nom="Garcia", prenom="Maria", numero_nie="X1234567A")
            documento = DocumentFactory(cliente=None)

            with patch("apps.documents.tasks.vision.analizar_documento", return_value=self._resultat()):
                procesar_documento(documento.id, cabinet.schema_name)

            documento.refresh_from_db()
            assert documento.cliente is None

    def test_ne_touche_pas_a_un_client_deja_choisi_a_l_upload(self, cabinet):
        with schema_context(cabinet.schema_name):
            from apps.clients.factories import ClientFactory

            client_upload = ClientFactory(nom="Autre", prenom="Client")
            # Un client "Maria Garcia" existe aussi, mais ne doit pas remplacer le choix
            # explicite fait à l'upload.
            ClientFactory(nom="Garcia", prenom="Maria", numero_nie="X1234567A")
            documento = DocumentFactory(cliente=client_upload)

            with patch("apps.documents.tasks.vision.analizar_documento", return_value=self._resultat()):
                procesar_documento(documento.id, cabinet.schema_name)

            documento.refresh_from_db()
            assert documento.cliente_id == client_upload.id
            assert documento.cliente_confirmado is True
