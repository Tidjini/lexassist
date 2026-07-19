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

    def test_upload_sin_cliente_permitido(self, cabinet, avocat):
        """Import en masse (docs/LexAssist_Presentation_FR.md §3.1) : on peut uploader
        sans choisir de client, c'est procesar_documento qui s'en charge."""
        with schema_context(cabinet.schema_name):
            fichier = SimpleUploadedFile("nie.pdf", b"%PDF-1.4 contenu", content_type="application/pdf")
            response = appeler("post", avocat, "/api/documentos/", {"fichier": fichier})
            assert response.status_code == 201
            assert response.data["cliente"] is None

    def test_upload_con_dossier_sin_cliente_rejete(self, cabinet, avocat):
        with schema_context(cabinet.schema_name):
            dossier = DossierFactory()
            fichier = SimpleUploadedFile("nie.pdf", b"%PDF-1.4 contenu", content_type="application/pdf")
            response = appeler(
                "post", avocat, "/api/documentos/", {"dossier": dossier.id, "fichier": fichier}
            )
            assert response.status_code == 400


@pytest.mark.django_db
class TestDocumentUploadDeclencheIA:
    def test_upload_sans_clave_ia_termina_en_sin_clave(self, cabinet, avocat):
        """ANTHROPIC_API_KEY vide dans l'env de test : le document uploadé doit
        terminer en estado_ia=SIN_CLAVE (pas de crash, pas de 500). Le
        transaction.on_commit() de perform_create ne se déclenche pas tout seul sous le
        rollback standard de pytest-django — captureOnCommitCallbacks(execute=True) est
        le mécanisme officiel de Django pour l'exercer sans passer en transaction=True
        (qui casse le flush de teardown avec les schémas django-tenants)."""
        from django.test import TestCase

        with schema_context(cabinet.schema_name):
            client = ClientFactory()
            fichier = SimpleUploadedFile("nie.pdf", b"%PDF-1.4 contenu", content_type="application/pdf")
            with TestCase.captureOnCommitCallbacks(execute=True):
                response = appeler(
                    "post", avocat, "/api/documentos/",
                    {"cliente": client.id, "categorie": "NIE", "fichier": fichier},
                )
            assert response.status_code == 201
            documento = Document.objects.get(id=response.data["id"])
            assert documento.estado_ia == Document.EstadoIA.SIN_CLAVE


def appeler_action(methode, user, url, pk, action, data=None, format="json"):
    factory = APIRequestFactory()
    request = getattr(factory, methode)(url, data, format=format)
    force_authenticate(request, user=user)
    view = DocumentViewSet.as_view({methode: action})
    return view(request, pk=pk) if pk is not None else view(request)


@pytest.mark.django_db
class TestAplicarAClienteYAlertas:
    def test_aplica_los_campos_elegidos_al_cliente(self, cabinet, avocat):
        with schema_context(cabinet.schema_name):
            client = ClientFactory(prenom="Vieux", nom="Nom")
            documento = DocumentFactory(
                cliente=client,
                categoria_sugerida=Document.Categorie.NIE,
                datos_extraidos={
                    "nombre": "Maria", "apellidos": "Garcia",
                    "numero_documento": "X1234567A", "fecha_nacimiento": None, "nacionalidad": None,
                },
            )

            response = appeler_action(
                "post", avocat, f"/api/documentos/{documento.id}/aplicar_a_cliente/", documento.id,
                "aplicar_a_cliente", data={"campos": ["nombre", "apellidos", "numero_documento"]},
            )

            assert response.status_code == 200
            client.refresh_from_db()
            assert client.prenom == "Maria"
            assert client.nom == "Garcia"
            assert client.numero_nie == "X1234567A"

    def test_no_toca_campos_no_elegidos(self, cabinet, avocat):
        with schema_context(cabinet.schema_name):
            client = ClientFactory(prenom="Vieux")
            documento = DocumentFactory(
                cliente=client, datos_extraidos={"nombre": "Maria", "apellidos": None,
                                                  "numero_documento": None, "fecha_nacimiento": None,
                                                  "nacionalidad": None},
            )

            appeler_action(
                "post", avocat, f"/api/documentos/{documento.id}/aplicar_a_cliente/", documento.id,
                "aplicar_a_cliente", data={"campos": []},
            )

            client.refresh_from_db()
            assert client.prenom == "Vieux"

    def test_alertas_lista_documentos_por_vencer(self, cabinet, avocat):
        from datetime import timedelta
        from django.utils import timezone

        with schema_context(cabinet.schema_name):
            hoy = timezone.localdate()
            DocumentFactory(fecha_expiracion=hoy + timedelta(days=10))
            DocumentFactory(fecha_expiracion=hoy - timedelta(days=5))  # déjà expiré
            DocumentFactory(fecha_expiracion=hoy + timedelta(days=365))  # trop loin
            DocumentFactory(fecha_expiracion=None)

            response = appeler_action(
                "get", avocat, "/api/documentos/alertas/", None, "alertas",
            )

            assert response.status_code == 200
            assert len(response.data) == 2

    def test_aplicar_a_cliente_sin_cliente_rejete(self, cabinet, avocat):
        with schema_context(cabinet.schema_name):
            documento = DocumentFactory(cliente=None)

            response = appeler_action(
                "post", avocat, f"/api/documentos/{documento.id}/aplicar_a_cliente/", documento.id,
                "aplicar_a_cliente", data={"campos": []},
            )

            assert response.status_code == 400


@pytest.mark.django_db
class TestConfirmarClienteYSinClasificar:
    def test_confirmar_cliente(self, cabinet, avocat):
        with schema_context(cabinet.schema_name):
            client = ClientFactory()
            documento = DocumentFactory(cliente=client, cliente_confirmado=False)

            response = appeler_action(
                "post", avocat, f"/api/documentos/{documento.id}/confirmar_cliente/", documento.id,
                "confirmar_cliente",
            )

            assert response.status_code == 200
            documento.refresh_from_db()
            assert documento.cliente_confirmado is True

    def test_confirmar_cliente_sin_cliente_rejete(self, cabinet, avocat):
        with schema_context(cabinet.schema_name):
            documento = DocumentFactory(cliente=None)

            response = appeler_action(
                "post", avocat, f"/api/documentos/{documento.id}/confirmar_cliente/", documento.id,
                "confirmar_cliente",
            )

            assert response.status_code == 400

    def test_patch_cliente_confirme_automatiquement(self, cabinet, avocat):
        with schema_context(cabinet.schema_name):
            ancien_client = ClientFactory()
            nouveau_client = ClientFactory()
            documento = DocumentFactory(cliente=ancien_client, cliente_confirmado=False)

            response = appeler_action(
                "patch", avocat, f"/api/documentos/{documento.id}/", documento.id,
                "partial_update", data={"cliente": nouveau_client.id},
            )

            assert response.status_code == 200
            documento.refresh_from_db()
            assert documento.cliente_id == nouveau_client.id
            assert documento.cliente_confirmado is True

    def test_sin_clasificar_lista_documentos_sin_cliente(self, cabinet, avocat):
        with schema_context(cabinet.schema_name):
            DocumentFactory(cliente=None)
            DocumentFactory(cliente=None)
            DocumentFactory(cliente=ClientFactory())

            response = appeler_action(
                "get", avocat, "/api/documentos/sin_clasificar/", None, "sin_clasificar",
            )

            assert response.status_code == 200
            assert len(response.data) == 2
