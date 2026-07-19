import pytest
from django_tenants.utils import schema_context

from apps.tenants.models import Cabinet
from apps.documents.factories import DocumentFactory
from apps.documents.models import Document


@pytest.fixture
def cabinet(db):
    c = Cabinet(schema_name="testdocmodels", nom="Cabinet Test Documents Models")
    c.save(verbosity=0)
    return c


@pytest.mark.django_db
class TestDocumentModel:
    def test_categorie_par_defaut_autre(self, cabinet):
        with schema_context(cabinet.schema_name):
            from apps.clients.factories import ClientFactory

            doc = Document.objects.create(cliente=ClientFactory(), fichier="documents/x.pdf")
            assert doc.categorie == Document.Categorie.AUTRE

    def test_str_utilise_nom_original(self, cabinet):
        with schema_context(cabinet.schema_name):
            doc = DocumentFactory(nom_original="nie_recto.pdf")
            assert str(doc) == "nie_recto.pdf"

    def test_suppression_dossier_conserve_le_document(self, cabinet):
        from apps.dossiers.factories import DossierFactory

        with schema_context(cabinet.schema_name):
            dossier = DossierFactory()
            doc = DocumentFactory(cliente=dossier.cliente, dossier=dossier)
            dossier.delete()
            doc.refresh_from_db()
            assert doc.dossier is None
