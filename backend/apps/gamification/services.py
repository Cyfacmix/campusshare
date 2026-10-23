"""Reputation, badges et notifications (logique metier appelee par les vues)."""
from django.contrib.contenttypes.models import ContentType
from django.db import transaction

from .models import Badge, Notification, UserBadge

# Points de reputation
PTS_RESSOURCE_PUBLIEE = 10
PTS_VOTE_POSITIF = 2
PTS_VOTE_NEGATIF = -1
PTS_REPONSE_ACCEPTEE = 15
PTS_CERTIFICATION = 5


def points_for_vote(valeur):
    return PTS_VOTE_POSITIF if valeur == 1 else PTS_VOTE_NEGATIF


def notify(user, type_, message, obj=None):
    """Cree une notification (ignoree si le destinataire n'existe plus)."""
    if user is None:
        return None
    notif = Notification(user=user, type=type_, message=message[:255])
    if obj is not None:
        notif.type_objet_lie = ContentType.objects.get_for_model(obj)
        notif.id_objet_lie = obj.pk
    notif.save()
    return notif


def check_badges(user):
    """Attribue les badges dont le seuil est atteint."""
    owned = set(UserBadge.objects.filter(user=user).values_list("badge_id", flat=True))
    new = Badge.objects.filter(seuil_points__lte=user.points_reputation).exclude(id__in=owned)
    for badge in new:
        _, created = UserBadge.objects.get_or_create(user=user, badge=badge)
        if created:
            notify(user, "badge", f"Nouveau badge obtenu : {badge.nom}")


def add_points(user, delta):
    """Ajoute (ou retire) des points, sans descendre sous 0, puis verifie les badges."""
    if user is None or delta == 0:
        return
    from django.contrib.auth import get_user_model

    User = get_user_model()
    with transaction.atomic():
        locked = User.objects.select_for_update().get(pk=user.pk)
        locked.points_reputation = max(0, locked.points_reputation + delta)
        locked.save(update_fields=["points_reputation"])
    user.points_reputation = locked.points_reputation
    check_badges(locked)


def notify_matiere_followers(ressource):
    """Previent les suiveurs de la matiere qu'une ressource est publiee."""
    from apps.interactions.models import SuiviMatiere

    followers = SuiviMatiere.objects.filter(matiere=ressource.matiere).exclude(
        user_id=ressource.auteur_id
    )
    ctype = ContentType.objects.get_for_model(ressource)
    Notification.objects.bulk_create(
        [
            Notification(
                user_id=f.user_id,
                type="nouvelle_ressource",
                message=f"Nouvelle ressource en {ressource.matiere.nom} : {ressource.titre}"[:255],
                type_objet_lie=ctype,
                id_objet_lie=ressource.pk,
            )
            for f in followers
        ]
    )
