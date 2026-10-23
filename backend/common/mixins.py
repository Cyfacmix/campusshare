from django.db.models import ProtectedError
from rest_framework import status
from rest_framework.response import Response


class ProtectedDeleteMixin:
    """Renvoie 409 au lieu de 500 quand un objet est encore reference."""

    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            return Response(
                {"detail": "Suppression impossible : des elements y sont encore rattaches."},
                status=status.HTTP_409_CONFLICT,
            )
