from django.db import connection
from django.contrib.auth import authenticate
from django_tenants.utils import get_public_schema_name
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import UserSerializer


class LoginView(APIView):
    """
    Login scopé par cabinet : un même email peut exister sur des cabinets
    différents sans jamais s'authentifier l'un sur l'autre. Sur le schéma
    public, seuls les comptes SUPERADMIN (cabinet=None) peuvent se connecter.
    """

    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email", "")
        password = request.data.get("password", "")

        from .models import User as UserModel
        qs = UserModel.objects.filter(email=email)
        if connection.schema_name == get_public_schema_name():
            qs = qs.filter(cabinet__isnull=True)
        else:
            qs = qs.filter(cabinet_id=connection.tenant.id)

        try:
            username = qs.get().username
        except UserModel.DoesNotExist:
            username = email  # fallback si on passe un username directement

        user = authenticate(request, username=username, password=password)

        if not user:
            return Response({"detail": "Email ou mot de passe incorrect."}, status=400)

        refresh = RefreshToken.for_user(user)
        return Response({
            "access_token": str(refresh.access_token),
            "refresh_token": str(refresh),
            "user": UserSerializer(user).data,
        })


class TokenRefreshView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.data.get("refresh_token")
        if not refresh_token:
            return Response({"detail": "refresh_token requis."}, status=400)
        try:
            refresh = RefreshToken(refresh_token)
            return Response({
                "access_token": str(refresh.access_token),
                "refresh_token": str(refresh),
            })
        except Exception:
            return Response({"detail": "Token invalide ou expiré."}, status=401)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def put(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
