from rest_framework import serializers

from common.names import display_name

from .models import Ressource, Tag
from .validators import validate_upload


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ["id", "nom"]


class RessourceListSerializer(serializers.ModelSerializer):
    matiere_nom = serializers.CharField(source="matiere.nom", read_only=True)
    matiere_code = serializers.CharField(source="matiere.code", read_only=True)
    filiere_nom = serializers.CharField(source="matiere.filiere.nom", read_only=True)
    niveau = serializers.CharField(source="matiere.niveau", read_only=True)
    auteur_nom = serializers.SerializerMethodField()
    tags = serializers.SlugRelatedField(many=True, slug_field="nom", read_only=True)
    certifiee = serializers.SerializerMethodField()
    score = serializers.IntegerField(read_only=True, default=0)
    mon_vote = serializers.IntegerField(read_only=True, default=None)
    est_favori = serializers.BooleanField(read_only=True, default=False)

    class Meta:
        model = Ressource
        fields = [
            "id", "titre", "type", "statut", "matiere", "matiere_nom", "matiere_code",
            "filiere_nom", "niveau", "auteur", "auteur_nom", "tags", "certifiee",
            "score", "mon_vote", "est_favori", "nb_vues", "nb_telechargements",
            "date_creation",
        ]

    def get_auteur_nom(self, obj):
        return display_name(obj.auteur)

    def get_certifiee(self, obj):
        return obj.certificateur_id is not None


class RessourceDetailSerializer(RessourceListSerializer):
    certificateur_nom = serializers.SerializerMethodField()
    fichier = serializers.FileField(read_only=True)

    class Meta(RessourceListSerializer.Meta):
        fields = RessourceListSerializer.Meta.fields + [
            "description", "fichier", "lien_externe", "motif_rejet",
            "certificateur_nom", "date_certification", "date_modification",
        ]

    def get_certificateur_nom(self, obj):
        return display_name(obj.certificateur) if obj.certificateur_id else None


class RessourceWriteSerializer(serializers.ModelSerializer):
    tags = serializers.ListField(
        child=serializers.CharField(max_length=50), required=False, write_only=True
    )

    class Meta:
        model = Ressource
        fields = ["titre", "description", "type", "matiere", "fichier", "lien_externe", "tags"]
        extra_kwargs = {
            "fichier": {"required": False},
            "lien_externe": {"required": False},
            "description": {"required": False},
        }

    def validate_fichier(self, value):
        return validate_upload(value) if value else value

    def validate(self, attrs):
        fichier = attrs.get("fichier", getattr(self.instance, "fichier", None))
        lien = attrs.get("lien_externe", getattr(self.instance, "lien_externe", ""))
        if not fichier and not lien:
            raise serializers.ValidationError("Ajoutez un fichier ou un lien externe.")
        return attrs

    @staticmethod
    def _set_tags(instance, names):
        clean = []
        for name in names:
            name = name.strip().lower()
            if name and name not in clean:
                clean.append(name)
        tags = [Tag.objects.get_or_create(nom=n)[0] for n in clean[:10]]
        instance.tags.set(tags)

    def create(self, validated_data):
        names = validated_data.pop("tags", None)
        instance = super().create(validated_data)
        if names is not None:
            self._set_tags(instance, names)
        return instance

    def update(self, instance, validated_data):
        names = validated_data.pop("tags", None)
        instance = super().update(instance, validated_data)
        if names is not None:
            self._set_tags(instance, names)
        return instance
