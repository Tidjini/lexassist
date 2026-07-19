import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django_tenants.utils import schema_context
from rest_framework.test import APIRequestFactory, force_authenticate

from apps.tenants.models import Cabinet
from apps.accounts.models import User
from apps.clients.factories import ClientFactory
from apps.documents.factories import DocumentFactory
from apps.documents.models import Document
from apps.documents.views import DocumentViewSet
from apps.dossiers.factories import DossierFactory


@pytest.fixture
def cabinet(db):
    c = Cabinet(schema_name="testdocviews", nom="Cabinet Test Documents Views")
    c.save(verbosity=0)
    return c


@pytest.fixture
def avocat(cabinet):
    # Pas de schema_context ici : User vit dans le schéma public (SHARED_APPS).
    return User.objects.create_user(
        username=User.make_username(cabinet, "avocat@testdocviews.es"),
        email="avocat@testdocviews.es", password="x",
        role=User.Role.AVOCAT, cabinet=cabinet,
    )


def appeler(methode, user, url, data=None, pk=None, action="create", format="multipart"):
    factory = APIRequestFactory()
    request = getattr(factory, methode)(url, data, format=format)
    force_authenticate(request, user=user)
    view = DocumentViewSet.as_view({methode: action})
    return view(request, pk=pk) if pk is not None else view(request)


@pytest.mark.django_db
class TestDocumentUpload:
    def test_upload_pdf(self, cabinet, avocat):
        with schema_context(cabinet.schema_name):
            client = ClientFactory()
            fichier = SimpleUploadedFile("nie.pdf", b"%PDF-1.4 contenu", content_type="application/pdf")
            response = appeler(
                "post", avocat, "/api/documentos/",
                {"cliente": client.id, "categorie": "NIE", "fichier": fichier},
            )
            assert response.status_code == 201
            assert response.data["nom_original"] == "nie.pdf"
            assert response.data["content_type"] == "application/pdf"
            assert response.data["taille"] > 0

    def test_upload_image(self, cabinet, avocat):
        with schema_context(cabinet.schema_name):
            client = ClientFactory()
            fichier = SimpleUploadedFile("passeport.jpg", b"\xff\xd8\xff contenu", content_type="image/jpeg")
            response = appeler(
                "post", avocat, "/api/documentos/",
                {"cliente": client.id, "categorie": "PASSEPORT", "fichier": fichier},
            )
            assert response.status_code == 201

    def test_type_non_supporte_rejete(self, cabinet, avocat):
        with schema_context(cabinet.schema_name):
            client = ClientFactory()
            fichier = SimpleUploadedFile("virus.exe", b"MZ", content_type="application/x-msdownload")
            response = appeler(
                "post", avocat, "/api/documentos/",
                {"cliente": client.id, "fichier": fichier},
            )
            assert response.status_code == 400

    def test_dossier_incoherent_avec_client_rejete(self, cabinet, avocat):
        with schema_context(cabinet.schema_name):
            client = ClientFactory()
            autre_dossier = DossierFactory()  # rattaché à un autre client
            fichier = SimpleUploadedFile("nie.pdf", b"%PDF-1.4", content_type="application/pdf")
            response = appeler(
                "post", avocat, "/api/documentos/",
                {"cliente": client.id, "dossier": autre_dossier.id, "fichier": fichier},
            )
            assert response.status_code == 400

    def test_filtre_par_categorie(self, cabinet, avocat):
        with schema_context(cabinet.schema_name):
            DocumentFactory(categorie=Document.Categorie.PASSEPORT)
            DocumentFactory(categorie=Document.Categorie.NIE)
            response = appeler(
                "get", avocat, "/api/documentos/?categorie=NIE", action="list", format="json",
            )
            assert response.status_code == 200
            assert response.data["count"] == 1
