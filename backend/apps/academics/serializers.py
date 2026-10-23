from rest_framework import serializers

from .models import Filiere, Matiere


class FiliereSerializer(serializers.ModelSerializer):
    class Meta:
        model = Filiere
        fields = ["id", "nom", "description"]


class MatiereSerializer(serializers.ModelSerializer):
    filiere_nom = serializers.CharField(source="filiere.nom", read_only=True)

    class Meta:
        model = Matiere
        fields = ["id", "code", "nom", "niveau", "semestre", "filiere", "filiere_nom"]
