from django.conf import settings
from django.db import models
from django.db.models import Q

User = settings.AUTH_USER_MODEL


class Vote(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="votes")
    ressource = models.ForeignKey(
        "resources.Ressource", on_delete=models.CASCADE, related_name="votes"
    )
    valeur = models.SmallIntegerField()
    date_vote = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["user", "ressource"], name="uniq_vote_user_ressource"),
            models.CheckConstraint(condition=Q(valeur__in=[1, -1]), name="vote_valeur_1_ou_moins1"),
        ]


class Favori(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="favoris")
    ressource = models.ForeignKey(
        "resources.Ressource", on_delete=models.CASCADE, related_name="favoris"
    )
    date_ajout = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date_ajout"]
        constraints = [
            models.UniqueConstraint(fields=["user", "ressource"], name="uniq_favori_user_ressource")
        ]


class SuiviMatiere(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="suivis")
    matiere = models.ForeignKey(
        "academics.Matiere", on_delete=models.CASCADE, related_name="suivis"
    )
    date_suivi = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["user", "matiere"], name="uniq_suivi_user_matiere")
        ]


class Commentaire(models.Model):
    contenu = models.TextField()
    date_creation = models.DateTimeField(auto_now_add=True)
    est_masque = models.BooleanField(default=False)
    user = models.ForeignKey(
        User, null=True, on_delete=models.SET_NULL, related_name="commentaires"
    )
    ressource = models.ForeignKey(
        "resources.Ressource", on_delete=models.CASCADE, related_name="commentaires"
    )
    parent = models.ForeignKey(
        "self", null=True, blank=True, on_delete=models.CASCADE, related_name="reponses"
    )

    class Meta:
        ordering = ["date_creation", "id"]
        indexes = [models.Index(fields=["ressource", "date_creation"])]
