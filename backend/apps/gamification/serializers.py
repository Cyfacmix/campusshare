from rest_framework import serializers

from common.names import display_name

from .models import Badge, Notification


class NotificationSerializer(serializers.ModelSerializer):
    objet_type = serializers.SerializerMethodField()
    objet_id = serializers.IntegerField(source="id_objet_lie", read_only=True)

    class Meta:
        model = Notification
        fields = ["id", "type", "message", "est_lue", "date_creation", "objet_type", "objet_id"]

    def get_objet_type(self, obj):
        return obj.type_objet_lie.model if obj.type_objet_lie_id else None


class BadgeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Badge
        fields = ["id", "nom", "description", "icone", "seuil_points"]


class LeaderboardSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    nom = serializers.SerializerMethodField()
    points_reputation = serializers.IntegerField()
    nb_badges = serializers.IntegerField()

    def get_nom(self, obj):
        return display_name(obj)
