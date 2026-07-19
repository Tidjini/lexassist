import pytest
from django_tenants.utils import schema_context
from rest_framework.test import APIRequestFactory, force_authenticate

from apps.tenants.models import Cabinet
from apps.accounts.models import User
from apps.clients.factories import ClientFactory
from apps.dossiers.factories import DossierFactory
from apps.dossiers.models import DossierEvenement
from apps.dossiers.views import DossierViewSet


@pytest.fixture
def cabinet(db):
    c = Cabinet(schema_name="testdosviews", nom="Cabinet Test Dossiers Views")
    c.save(verbosity=0)
    return c


@pytest.fixture
def avocat(cabinet):
    # Pas de schema_context ici : User vit dans le schéma public (SHARED_APPS),
    # et rester "with" ouvert pendant tout le test empêcherait de créer un
    # second Cabinet (public uniquement) dans le corps du test.
    return User.objects.create_user(
        username=User.make_username(cabinet, "avocat@testdosviews.es"),
        email="avocat@testdosviews.es", password="x",
        role=User.Role.AVOCAT, cabinet=cabinet,
    )


def appeler(methode, user, url, data=None, pk=None, action="create", format="json"):
    factory = APIRequestFactory()
    request = getattr(factory, methode)(url, data, format=format)
    force_authenticate(request, user=user)
    view = DossierViewSet.as_view({methode: action})
    return view(request, pk=pk) if pk is not None else view(request)


@pytest.mark.django_db
class TestDossierCRUD:
    def test_creation(self, cabinet, avocat):
        with schema_context(cabinet.schema_name):
            client = ClientFactory()
            response = appeler(
                "post", avocat, "/api/expedientes/",
                {"cliente": client.id, "titre": "Arraigo social"},
            )
            assert response.status_code == 201
            assert response.data["statut"] == "PREPARATION"

    def test_detail_inclut_les_evenements(self, cabinet, avocat):
        with schema_context(cabinet.schema_name):
            dossier = DossierFactory()
            DossierEvenement.objects.create(
                dossier=dossier, ancien_statut="", nouveau_statut="PREPARATION",
            )
            response = appeler(
                "get", avocat, f"/api/expedientes/{dossier.id}/", pk=dossier.id, action="retrieve",
            )
            assert response.status_code == 200
            assert len(response.data["evenements"]) == 1


@pytest.mark.django_db
class TestChangerStatut:
    def _appeler_changer_statut(self, avocat, dossier, statut, commentaire=""):
        factory = APIRequestFactory()
        request = factory.post(
            f"/api/expedientes/{dossier.id}/changer_statut/",
            {"statut": statut, "commentaire": commentaire}, format="json",
        )
        force_authenticate(request, user=avocat)
        view = DossierViewSet.as_view({"post": "changer_statut"})
        return view(request, pk=dossier.id)

    def test_changement_valide_cree_un_evenement(self, cabinet, avocat):
        with schema_context(cabinet.schema_name):
            dossier = DossierFactory()
            response = self._appeler_changer_statut(avocat, dossier, "DEPOSE", "Envoyé au registre")
            assert response.status_code == 200
            assert response.data["statut"] == "DEPOSE"
            dossier.refresh_from_db()
            assert dossier.statut == "DEPOSE"
            evenement = dossier.evenements.first()
            assert evenement.ancien_statut == "PREPARATION"
            assert evenement.nouveau_statut == "DEPOSE"
            assert evenement.auteur_id == avocat.id
            assert evenement.commentaire == "Envoyé au registre"

    def test_statut_identique_refuse(self, cabinet, avocat):
        with schema_context(cabinet.schema_name):
            dossier = DossierFactory()
            response = self._appeler_changer_statut(avocat, dossier, "PREPARATION")
            assert response.status_code == 400

    def test_resolu_renseigne_date_cloture(self, cabinet, avocat):
        with schema_context(cabinet.schema_name):
            dossier = DossierFactory()
            self._appeler_changer_statut(avocat, dossier, "DEPOSE")
            self._appeler_changer_statut(avocat, dossier, "RESOLU")
            dossier.refresh_from_db()
            assert dossier.date_cloture is not None

    def test_statut_invalide_rejete(self, cabinet, avocat):
        with schema_context(cabinet.schema_name):
            dossier = DossierFactory()
            response = self._appeler_changer_statut(avocat, dossier, "INEXISTANT")
            assert response.status_code == 400


@pytest.mark.django_db
class TestIsolationTenant:
    def test_dossiers_isoles_par_cabinet(self, cabinet, avocat):
        autre_cabinet = Cabinet(schema_name="testdosviewsautre", nom="Autre Cabinet")
        autre_cabinet.save(verbosity=0)

        with schema_context(cabinet.schema_name):
            DossierFactory()

        with schema_context(autre_cabinet.schema_name):
            response = appeler("get", avocat, "/api/expedientes/", action="list")
            assert response.status_code == 200
            assert response.data["count"] == 0
