import pytest
from django_tenants.utils import schema_context

from apps.tenants.models import Cabinet
from apps.accounts.models import User
from apps.notifications.models import Notification
from apps.notifications.utils import notificar


@pytest.fixture
def cabinet(db):
    c = Cabinet(schema_name="testnotifutils", nom="Cabinet Test Notifications Utils")
    c.save(verbosity=0)
    return c


@pytest.mark.django_db
class TestNotificar:
    def test_cree_la_notification_en_base(self, cabinet):
        with schema_context(cabinet.schema_name):
            user = User.objects.create_user(
                username=User.make_username(cabinet, "avocat@testnotifutils.es"),
                email="avocat@testnotifutils.es", password="x", role=User.Role.AVOCAT, cabinet=cabinet,
            )

            notificar(user, Notification.Tipo.DOCUMENTO_PROCESADO, "Documento listo")

            assert Notification.objects.filter(destinataire=user, mensaje="Documento listo").exists()
