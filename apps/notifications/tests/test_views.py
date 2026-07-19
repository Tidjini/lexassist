import pytest
from django_tenants.utils import schema_context
from rest_framework.test import APIRequestFactory, force_authenticate

from apps.tenants.models import Cabinet
from apps.accounts.models import User
from apps.notifications.models import Notification
from apps.notifications.views import NotificationViewSet


@pytest.fixture
def cabinet(db):
    c = Cabinet(schema_name="testnotifviews", nom="Cabinet Test Notifications Views")
    c.save(verbosity=0)
    return c


@pytest.fixture
def avocat(cabinet):
    return User.objects.create_user(
        username=User.make_username(cabinet, "avocat@testnotifviews.es"),
        email="avocat@testnotifviews.es", password="x", role=User.Role.AVOCAT, cabinet=cabinet,
    )


@pytest.fixture
def autre_avocat(cabinet):
    return User.objects.create_user(
        username=User.make_username(cabinet, "otro@testnotifviews.es"),
        email="otro@testnotifviews.es", password="x", role=User.Role.AVOCAT, cabinet=cabinet,
    )


def appeler(methode, user, url, pk=None, action="list", data=None):
    factory = APIRequestFactory()
    request = getattr(factory, methode)(url, data, format="json")
    force_authenticate(request, user=user)
    view = NotificationViewSet.as_view({methode: action})
    return view(request, pk=pk) if pk is not None else view(request)


@pytest.mark.django_db
class TestNotificationViewSet:
    def test_solo_ve_sus_propias_notificaciones(self, cabinet, avocat, autre_avocat):
        with schema_context(cabinet.schema_name):
            Notification.objects.create(
                destinataire=avocat, tipo=Notification.Tipo.DOCUMENTO_PROCESADO, mensaje="Para mi"
            )
            Notification.objects.create(
                destinataire=autre_avocat, tipo=Notification.Tipo.DOCUMENTO_PROCESADO, mensaje="Para otro"
            )

            response = appeler("get", avocat, "/api/notificaciones/")

            assert response.status_code == 200
            assert response.data["count"] == 1
            assert response.data["results"][0]["mensaje"] == "Para mi"

    def test_marcar_leida(self, cabinet, avocat):
        with schema_context(cabinet.schema_name):
            notification = Notification.objects.create(
                destinataire=avocat, tipo=Notification.Tipo.DOCUMENTO_PROCESADO, mensaje="Hola"
            )

            response = appeler(
                "post", avocat, f"/api/notificaciones/{notification.id}/marcar_leida/",
                pk=notification.id, action="marcar_leida",
            )

            assert response.status_code == 200
            notification.refresh_from_db()
            assert notification.leida is True

    def test_eliminar_propia_notificacion(self, cabinet, avocat):
        with schema_context(cabinet.schema_name):
            notification = Notification.objects.create(
                destinataire=avocat, tipo=Notification.Tipo.DOCUMENTO_PROCESADO, mensaje="Hola"
            )

            response = appeler(
                "delete", avocat, f"/api/notificaciones/{notification.id}/",
                pk=notification.id, action="destroy",
            )

            assert response.status_code == 204
            assert not Notification.objects.filter(id=notification.id).exists()

    def test_no_puede_eliminar_notificacion_ajena(self, cabinet, avocat, autre_avocat):
        with schema_context(cabinet.schema_name):
            notification = Notification.objects.create(
                destinataire=autre_avocat, tipo=Notification.Tipo.DOCUMENTO_PROCESADO, mensaje="Para otro"
            )

            response = appeler(
                "delete", avocat, f"/api/notificaciones/{notification.id}/",
                pk=notification.id, action="destroy",
            )

            assert response.status_code == 404
            assert Notification.objects.filter(id=notification.id).exists()
