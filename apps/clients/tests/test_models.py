import pytest
from django_tenants.utils import schema_context

from apps.tenants.models import Cabinet
from apps.clients.factories import ClientFactory
from apps.clients.models import Client


@pytest.fixture
def cabinet(db):
    c = Cabinet(schema_name="testclimodels", nom="Cabinet Test Clients Models")
    c.save(verbosity=0)
    return c


@pytest.mark.django_db
class TestClientModel:
    def test_str_est_prenom_nom(self, cabinet):
        with schema_context(cabinet.schema_name):
            client = ClientFactory(nom="Garcia", prenom="Maria")
            assert str(client) == "Maria Garcia"

    def test_actif_par_defaut(self, cabinet):
        with schema_context(cabinet.schema_name):
            client = ClientFactory()
            assert client.actif is True

    def test_ordering_par_nom_prenom(self, cabinet):
        with schema_context(cabinet.schema_name):
            ClientFactory(nom="Zapata", prenom="Ana")
            ClientFactory(nom="Alvarez", prenom="Luis")
            noms = list(Client.objects.values_list("nom", flat=True))
            assert noms == ["Alvarez", "Zapata"]

    def test_suppression_utilisateur_ne_supprime_pas_le_client(self, cabinet):
        from apps.accounts.models import User

        with schema_context(cabinet.schema_name):
            user = User.objects.create_user(
                username=User.make_username(cabinet, "avocat@testclimodels.es"),
                email="avocat@testclimodels.es", password="x",
                role=User.Role.AVOCAT, cabinet=cabinet,
            )
            client = ClientFactory(cree_par=user)
            user.delete()
            client.refresh_from_db()
            assert client.cree_par is None
