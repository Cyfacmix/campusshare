from rest_framework import viewsets

from common.mixins import ProtectedDeleteMixin
from common.permissions import IsAdminOrReadOnly

from .models import Filiere, Matiere
from .serializers import FiliereSerializer, MatiereSerializer


class FiliereViewSet(ProtectedDeleteMixin, viewsets.ModelViewSet):
    queryset = Filiere.objects.all()
    serializer_class = FiliereSerializer
    permission_classes = [IsAdminOrReadOnly]
    pagination_class = None
    search_fields = ["nom"]


class MatiereViewSet(ProtectedDeleteMixin, viewsets.ModelViewSet):
    queryset = Matiere.objects.select_related("filiere")
    serializer_class = MatiereSerializer
    permission_classes = [IsAdminOrReadOnly]
    pagination_class = None
    filterset_fields = ["filiere", "niveau", "semestre"]
    search_fields = ["nom", "code"]
