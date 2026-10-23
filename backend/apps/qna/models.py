from django.conf import settings
from django.db import models

User = settings.AUTH_USER_MODEL


class Question(models.Model):
    titre = models.CharField(max_length=200)
    contenu = models.TextField()
    est_resolue = models.BooleanField(default=False)
    date_creation = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey(User, null=True, on_delete=models.SET_NULL, related_name="questions")
    matiere = models.ForeignKey(
        "academics.Matiere", on_delete=models.PROTECT, related_name="questions"
    )

    class Meta:
        ordering = ["-date_creation"]


class Reponse(models.Model):
    contenu = models.TextField()
    est_acceptee = models.BooleanField(default=False)
    date_creation = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey(User, null=True, on_delete=models.SET_NULL, related_name="reponses")
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name="reponses")

    class Meta:
        ordering = ["-est_acceptee", "date_creation"]
