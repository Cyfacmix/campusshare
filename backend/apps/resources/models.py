from django.conf import settings
from django.db import models
from django.db.models import Q


class Tag(models.Model):
    nom = models.CharField(max_length=50, unique=True)

    class Meta:
        ordering = ["nom"]

    def __str__(self):
        return self.nom


def chemin_ressource(instance, filename):
    return f"ressources/{instance.matiere_id}/{filename}"


class Ressource(models.Model):
    class Type(models.TextChoices):
        COURS = "cours", "Cours"
        RESUME = "resume", "Résumé"
        EXAMEN = "examen", "Sujet d'examen"
        TUTORIEL = "tutoriel", "Tutoriel"

    class Statut(models.TextChoices):
        EN_ATTENTE = "en_attente", "En attente"
        PUBLIEE = "publiee", "Publiée"
        REJETEE = "rejetee", "Rejetée"

    titre = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    type = models.CharField(max_length=10, choices=Type.choices)
    fichier = models.FileField(upload_to=chemin_ressource, blank=True)
    lien_externe = models.URLField(blank=True)
    statut = models.CharField(
        max_length=12, choices=Statut.choices, default=Statut.EN_ATTENTE
    )
    motif_rejet = models.TextField(blank=True)
    nb_vues = models.PositiveIntegerField(default=0)
    nb_telechargements = models.PositiveIntegerField(default=0)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    auteur = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL,
        related_name="ressources",
    )
    matiere = models.ForeignKey(
        "academics.Matiere", on_delete=models.PROTECT, related_name="ressources"
    )
    certificateur = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="ressources_certifiees",
    )
    date_certification = models.DateTimeField(null=True, blank=True)
    tags = models.ManyToManyField(Tag, blank=True, related_name="ressources")

    class Meta:
        ordering = ["-date_creation"]
        constraints = [
            models.CheckConstraint(
                condition=~Q(fichier="") | ~Q(lien_externe=""),
                name="ressource_fichier_ou_lien",
            ),
        ]
        indexes = [
            models.Index(fields=["matiere", "statut"]),
            models.Index(fields=["date_creation"]),
        ]

    def __str__(self):
        return self.titre
