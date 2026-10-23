from django_filters import rest_framework as django_filters

from .models import Ressource


class RessourceFilter(django_filters.FilterSet):
    filiere = django_filters.NumberFilter(field_name="matiere__filiere")
    niveau = django_filters.CharFilter(field_name="matiere__niveau")
    tag = django_filters.CharFilter(field_name="tags__nom", lookup_expr="iexact")
    certifiee = django_filters.BooleanFilter(
        field_name="certificateur", lookup_expr="isnull", exclude=True
    )

    class Meta:
        model = Ressource
        fields = ["matiere", "type", "auteur", "statut"]
