from django.conf import settings
from django.db import models
from django.db.models import Q

User = settings.AUTH_USER_MODEL


class Signalement(models.Model):
    class Statut(models.TextChoices):
        OUVERT = "ouvert", "Ouvert"
        TRAITE = "traite", "Traité"
        REJETE = "rejete", "Rejeté"

    motif = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    statut = models.CharField(max_length=10, choices=Statut.choices, default=Statut.OUVERT)
    date_signalement = models.DateTimeField(auto_now_add=True)
    date_traitement = models.DateTimeField(null=True, blank=True)
    signaleur = models.ForeignKey(User, on_delete=models.CASCADE, related_name="signalements_emis")
    moderateur = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="signalements_traites",
    )
    ressource = models.ForeignKey(
        "resources.Ressource", null=True, blank=True, on_delete=models.CASCADE,
        related_name="signalements",
    )
    commentaire = models.ForeignKey(
        "interactions.Commentaire", null=True, blank=True, on_delete=models.CASCADE,
        related_name="signalements",
    )

    class Meta:
        ordering = ["-date_signalement"]
        indexes = [models.Index(fields=["statut"])]
        constraints = [
            models.CheckConstraint(
                condition=(
                    Q(ressource__isnull=False, commentaire__isnull=True)
                    | Q(ressource__isnull=True, commentaire__isnull=False)
                ),
                name="signalement_une_seule_cible",
            )
        ]
