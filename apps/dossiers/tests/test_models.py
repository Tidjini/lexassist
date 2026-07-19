import pytest
from django_tenants.utils import schema_context

from apps.tenants.models import Cabinet
from apps.dossiers.factories import DossierFactory
from apps.dossiers.models import Dossier, DossierEvenement


@pytest.fixture
def cabinet(db):
    c = Cabinet(schema_name="testdosmodels", nom="Cabinet Test Dossiers Models")
    c.save(verbosity=0)
    return c


@pytest.mark.django_db
class TestDossierModel:
    def test_statut_par_defaut_preparation(self, cabinet):
        with schema_context(cabinet.schema_name):
            dossier = DossierFactory()
            assert dossier.statut == Dossier.Statut.PREPARATION

    def test_str(self, cabinet):
        with schema_context(cabinet.schema_name):
            dossier = DossierFactory(titre="Regroupement familial")
            assert "Regroupement familial" in str(dossier)

    def test_suppression_client_cascade_sur_dossier(self, cabinet):
        with schema_context(cabinet.schema_name):
            dossier = DossierFactory()
            client_id = dossier.cliente_id
            dossier.cliente.delete()
            assert not Dossier.objects.filter(id=dossier.id).exists()

    def test_evenement_historique_immuable_par_defaut(self, cabinet):
        with schema_context(cabinet.schema_name):
            dossier = DossierFactory()
            evenement = DossierEvenement.objects.create(
                dossier=dossier, ancien_statut="PREPARATION", nouveau_statut="DEPOSE",
            )
            assert evenement.dossier_id == dossier.id
            assert list(dossier.evenements.all()) == [evenement]
