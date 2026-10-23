from rest_framework import serializers

from common.names import display_name

from .models import Question, Reponse


class QuestionSerializer(serializers.ModelSerializer):
    matiere_nom = serializers.CharField(source="matiere.nom", read_only=True)
    auteur_nom = serializers.SerializerMethodField()
    auteur_id = serializers.IntegerField(source="user_id", read_only=True)
    nb_reponses = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Question
        fields = ["id", "titre", "contenu", "est_resolue", "date_creation", "matiere",
                  "matiere_nom", "auteur_id", "auteur_nom", "nb_reponses"]
        read_only_fields = ["id", "est_resolue", "date_creation"]

    def get_auteur_nom(self, obj):
        return display_name(obj.user)


class ReponseSerializer(serializers.ModelSerializer):
    auteur_nom = serializers.SerializerMethodField()
    auteur_id = serializers.IntegerField(source="user_id", read_only=True)

    class Meta:
        model = Reponse
        fields = ["id", "contenu", "est_acceptee", "date_creation", "auteur_id",
                  "auteur_nom", "question"]
        read_only_fields = ["id", "est_acceptee", "date_creation", "question"]

    def get_auteur_nom(self, obj):
        return display_name(obj.user)
