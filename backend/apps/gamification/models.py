from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models


class Badge(models.Model):
    nom = models.CharField(max_length=80, unique=True)
    description = models.TextField(blank=True)
    icone = models.CharField(max_length=100, blank=True)
    seuil_points = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["seuil_points"]

    def __str__(self):
        return self.nom


class UserBadge(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="user_badges"
    )
    badge = models.ForeignKey(Badge, on_delete=models.CASCADE, related_name="user_badges")
    date_obtention = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["user", "badge"], name="uniq_userbadge")
        ]


class Notification(models.Model):
    type = models.CharField(max_length=40)
    message = models.CharField(max_length=255)
    est_lue = models.BooleanField(default=False)
    date_creation = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications"
    )
    type_objet_lie = models.ForeignKey(
        ContentType, null=True, blank=True, on_delete=models.CASCADE
    )
    id_objet_lie = models.PositiveIntegerField(null=True, blank=True)
    objet_lie = GenericForeignKey("type_objet_lie", "id_objet_lie")

    class Meta:
        ordering = ["-date_creation", "-id"]
        indexes = [models.Index(fields=["user", "est_lue"])]
