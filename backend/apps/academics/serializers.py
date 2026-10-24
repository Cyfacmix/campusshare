from rest_framework import serializers

from .models import Filiere, Matiere


class FiliereSerializer(serializers.ModelSerializer):
    class Meta:
        model = Filiere
        fields = ["id", "nom", "description"]


class MatiereSerializer(serializers.ModelSerializer):
    filieres = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Filiere.objects.all(),
        allow_empty=False,
        error_messages={
            "empty": "Choisissez au moins une filière.",
            "required": "Choisissez au moins une filière.",
        },
    )
    filiere_nom = serializers.SerializerMethodField()

    class Meta:
        model = Matiere
        fields = ["id", "code", "nom", "niveau", "semestre", "filieres", "filiere_nom"]

    def get_filiere_nom(self, obj):
        return ", ".join(f.nom for f in obj.filieres.all())