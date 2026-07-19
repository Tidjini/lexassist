from rest_framework.routers import DefaultRouter

from .views import DossierViewSet

router = DefaultRouter()
router.register("expedientes", DossierViewSet, basename="expediente")

urlpatterns = router.urls
