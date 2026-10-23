from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.gamification.services import (
    PTS_CERTIFICATION,
    PTS_RESSOURCE_PUBLIEE,
    add_points,
    notify,
    notify_matiere_followers,
)

from .models import Ressource


def publish(ressource, notify_author=True):
    if ressource.statut == Ressource.Statut.PUBLIEE:
        return ressource
    ressource.statut = Ressource.Statut.PUBLIEE
    ressource.motif_rejet = ""
    ressource.save(update_fields=["statut", "motif_rejet", "date_modification"])
    add_points(ressource.auteur, PTS_RESSOURCE_PUBLIEE)
    if notify_author:
        notify(ressource.auteur, "ressource_publiee",
               f"Votre ressource « {ressource.titre} » a été publiée.", ressource)
    notify_matiere_followers(ressource)
    return ressource


def reject(ressource, motif):
    motif = (motif or "").strip()
    if not motif:
        raise ValidationError({"motif": "Un motif est obligatoire pour rejeter une ressource."})
    was_published = ressource.statut == Ressource.Statut.PUBLIEE
    ressource.statut = Ressource.Statut.REJETEE
    ressource.motif_rejet = motif
    ressource.save(update_fields=["statut", "motif_rejet", "date_modification"])
    if was_published:
        add_points(ressource.auteur, -PTS_RESSOURCE_PUBLIEE)
    notify(ressource.auteur, "ressource_rejetee",
           f"Votre ressource « {ressource.titre} » a été rejetée : {motif}", ressource)
    return ressource


def moderate(ressource, action, motif=""):
    if action == "publish":
        return publish(ressource)
    if action == "reject":
        return reject(ressource, motif)
    raise ValidationError({"action": "Action invalide (publish ou reject)."})


def certify(ressource, enseignant):
    if ressource.statut != Ressource.Statut.PUBLIEE:
        raise ValidationError("Seule une ressource publiée peut être certifiée.")
    if ressource.certificateur_id:
        raise ValidationError("Cette ressource est déjà certifiée.")
    ressource.certificateur = enseignant
    ressource.date_certification = timezone.now()
    ressource.save(update_fields=["certificateur", "date_certification", "date_modification"])
    add_points(ressource.auteur, PTS_CERTIFICATION)
    notify(ressource.auteur, "ressource_certifiee",
           f"Votre ressource « {ressource.titre} » a été vérifiée par un enseignant.", ressource)
    return ressource
