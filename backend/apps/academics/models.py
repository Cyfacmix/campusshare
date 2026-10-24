from django.db import models


class Filiere(models.Model):
    nom = models.CharField(max_length=120, unique=True)
    description = models.TextField(blank=True)

    class Meta:
        ordering = ["nom"]

    def __str__(self):
        return self.nom


class Matiere(models.Model):
    code = models.CharField(max_length=20)
    nom = models.CharField(max_length=150)
    niveau = models.CharField(max_length=20)
    semestre = models.PositiveSmallIntegerField(default=1)
    filieres = models.ManyToManyField(Filiere, related_name="matieres")

    class Meta:
        ordering = ["niveau", "nom"]

    def __str__(self):
        return f"{self.code} - {self.nom}"