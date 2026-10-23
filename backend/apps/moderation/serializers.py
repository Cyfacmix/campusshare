from rest_framework import serializers

from common.names import display_name

from .models import Signalement


class SignalementCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Signalement
        fields = ["id", "ressource", "commentaire", "motif", "description"]
        read_only_fields = ["id"]

    def validate(self, attrs):
        ressource, commentaire = attrs.get("ressource"), attrs.get("commentaire")
        if bool(ressource) == bool(commentaire):
            raise serializers.ValidationError(
                "Un signalement doit viser soit une ressource, soit un commentaire."
            )
        user = self.context["request"].user
        lookup = {"ressource": ressource} if ressource else {"commentaire": commentaire}
        if Signalement.objects.filter(signaleur=user, **lookup).exists():
            raise serializers.ValidationError("Vous avez déjà signalé ce contenu.")
        return attrs


class SignalementSerializer(serializers.ModelSerializer):
    signaleur_nom = serializers.SerializerMethodField()
    cible_type = serializers.SerializerMethodField()
    cible_id = serializers.SerializerMethodField()
    cible_texte = serializers.SerializerMethodField()

    class Meta:
        model = Signalement
        fields = ["id", "motif", "description", "statut", "date_signalement",
                  "date_traitement", "signaleur_nom", "cible_type", "cible_id", "cible_texte"]

    def get_signaleur_nom(self, obj):
        return display_name(obj.signaleur)

    def get_cible_type(self, obj):
        return "ressource" if obj.ressource_id else "commentaire"

    def get_cible_id(self, obj):
        # pour un commentaire : id de la ressource afin de pouvoir y naviguer
        return obj.ressource_id or obj.commentaire.ressource_id

    def get_cible_texte(self, obj):
        if obj.ressource_id:
            return obj.ressource.titre
        return obj.commentaire.contenu[:140]
