from django.urls import path, include
from django.conf import settings

urlpatterns = [
    path("api/auth/", include("rest_framework.urls")),  # login/logout navigateur
    path("api/accounts/", include("apps.accounts.urls")),
    path("api/", include("apps.clients.urls")),
    path("api/", include("apps.dossiers.urls")),
    path("api/", include("apps.documents.urls")),
    path("api/", include("apps.procedures.urls")),
    path("api/", include("apps.formulaires.urls")),
    path("api/", include("apps.assistant.urls")),
]

if settings.DEBUG:
    import debug_toolbar
    from django.conf.urls.static import static
    urlpatterns += [path("__debug__/", include(debug_toolbar.urls))]
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
