from rest_framework.routers import DefaultRouter

from .views import DocumentViewSet

router = DefaultRouter()
router.register("documentos", DocumentViewSet, basename="documento")

urlpatterns = router.urls
