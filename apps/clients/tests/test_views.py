import pytest
from django_tenants.utils import schema_context
from rest_framework.test import APIRequestFactory, force_authenticate

from apps.tenants.models import Cabinet
from apps.accounts.models import User
from apps.clients.factories import ClientFactory
from apps.clients.views import ClientViewSet


@pytest.fixture
def cabinet(db):
    c = Cabinet(schema_name="testcliviews", nom="Cabinet Test Clients Views")
    c.save(verbosity=0)
    return c


@pytest.fixture
def autre_cabinet(db):
    c = Cabinet(schema_name="testcliviewsautre", nom="Autre Cabinet")
    c.save(verbosity=0)
    return c


@pytest.fixture
def avocat(cabinet):
    # Pas de schema_context ici : User vit dans le schéma public (SHARED_APPS).
    return User.objects.create_user(
        username=User.make_username(cabinet, "avocat@testcliviews.es"),
        email="avocat@testcliviews.es", password="x",
        role=User.Role.AVOCAT, cabinet=cabinet,
    )


def appeler(methode, user, url, data=None, pk=None, action="create", format="json"):
    factory = APIRequestFactory()
    request = getattr(factory, methode)(url, data, format=format)
    force_authenticate(request, user=user)
    view = ClientViewSet.as_view({methode: action})
    return view(request, pk=pk) if pk is not None else view(request)


@pytest.mark.django_db
class TestClientCRUD:
    def test_creation(self, cabinet, avocat):
        with schema_context(cabinet.schema_name):
            response = appeler(
                "post", avocat, "/api/clientes/",
                {"nom": "Belkacem", "prenom": "Amine", "email": "amine@example.es"},
            )
            assert response.status_code == 201
            assert response.data["nom"] == "Belkacem"
            assert response.data["cree_par"]["id"] == avocat.id

    def test_creation_sans_authentification_refusee(self, cabinet):
        with schema_context(cabinet.schema_name):
            factory = APIRequestFactory()
            request = factory.post("/api/clientes/", {"nom": "X", "prenom": "Y"}, format="json")
            view = ClientViewSet.as_view({"post": "create"})
            response = view(request)
            assert response.status_code == 401 or response.status_code == 403

    def test_liste(self, cabinet, avocat):
        with schema_context(cabinet.schema_name):
            ClientFactory.create_batch(3)
            response = appeler("get", avocat, "/api/clientes/", action="list")
            assert response.status_code == 200
            assert response.data["count"] == 3

    def test_recherche_par_nom(self, cabinet, avocat):
        with schema_context(cabinet.schema_name):
            ClientFactory(nom="Garcia", prenom="Maria")
            ClientFactory(nom="Lopez", prenom="Juan")
            response = appeler(
                "get", avocat, "/api/clientes/?search=Garcia", action="list",
            )
            assert response.status_code == 200
            assert response.data["count"] == 1
            assert response.data["results"][0]["nom"] == "Garcia"

    def test_modification(self, cabinet, avocat):
        with schema_context(cabinet.schema_name):
            client = ClientFactory(telephone="600000000")
            response = appeler(
                "patch", avocat, f"/api/clientes/{client.id}/",
                {"telephone": "611111111"}, pk=client.id, action="partial_update",
            )
            assert response.status_code == 200
            assert response.data["telephone"] == "611111111"

    def test_suppression(self, cabinet, avocat):
        from apps.clients.models import Client

        with schema_context(cabinet.schema_name):
            client = ClientFactory()
            response = appeler(
                "delete", avocat, f"/api/clientes/{client.id}/", pk=client.id, action="destroy",
            )
            assert response.status_code == 204
            assert not Client.objects.filter(id=client.id).exists()

    def test_isolation_entre_cabinets(self, cabinet, autre_cabinet, avocat):
        """Un client créé dans un cabinet ne doit jamais apparaître dans un autre
        (isolation par schéma PostgreSQL, pas par filtre applicatif)."""
        with schema_context(cabinet.schema_name):
            ClientFactory(nom="Cabinet1Client")

        with schema_context(autre_cabinet.schema_name):
            response = appeler("get", avocat, "/api/clientes/", action="list")
            assert response.status_code == 200
            assert response.data["count"] == 0
