from rest_framework import serializers

from common.names import display_name
from common.permissions import is_role

from .models import Commentaire

MASKED = "Commentaire masqué par la modération."


class CommentaireSerializer(serializers.ModelSerializer):
    auteur_nom = serializers.SerializerMethodField()
    auteur_id = serializers.IntegerField(source="user_id", read_only=True)

    class Meta:
        model = Commentaire
        fields = ["id", "contenu", "date_creation", "est_masque", "auteur_id",
                  "auteur_nom", "ressource", "parent"]
        read_only_fields = ["id", "date_creation", "est_masque", "ressource"]

    def get_auteur_nom(self, obj):
        return display_name(obj.user)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.est_masque:
            request = self.context.get("request")
            user = getattr(request, "user", None)
            if not is_role(user, "moderateur", "admin"):
                data["contenu"] = MASKED
        return data

    def validate_contenu(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Le commentaire ne peut pas être vide.")
        return value
