from rest_framework.routers import DefaultRouter

from .views import NotificationViewSet

router = DefaultRouter()
router.register("notificaciones", NotificationViewSet, basename="notificacion")

urlpatterns = router.urls
