from django.db.models import ProtectedError
from django_filters import rest_framework as django_filters
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

    def perform_destroy(self, instance):
        # Avec une relation plusieurs-a-plusieurs, la base ne protege plus la suppression
        if instance.matieres.exists():
            raise ProtectedError("Filière utilisée par des matières.", set())
        super().perform_destroy(instance)


class MatiereFilter(django_filters.FilterSet):
    filiere = django_filters.NumberFilter(field_name="filieres")

    class Meta:
        model = Matiere
        fields = ["niveau", "semestre"]


class MatiereViewSet(ProtectedDeleteMixin, viewsets.ModelViewSet):
    queryset = Matiere.objects.prefetch_related("filieres")
    serializer_class = MatiereSerializer
    permission_classes = [IsAdminOrReadOnly]
    pagination_class = None
    filterset_class = MatiereFilter
    search_fields = ["nom", "code"]