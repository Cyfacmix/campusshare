from django.db.models import Exists, IntegerField, OuterRef, Q, Subquery, Sum
from django.db.models.functions import Coalesce

from apps.interactions.models import Favori, Vote

from .models import Ressource


def ressources_qs(user):
    """Ressources visibles par `user`, annotees (score, mon_vote, est_favori)."""
    score = (
        Vote.objects.filter(ressource=OuterRef("pk"))
        .values("ressource")
        .annotate(s=Sum("valeur"))
        .values("s")
    )
    qs = (
        Ressource.objects.select_related("matiere", "auteur", "certificateur")
        .prefetch_related("tags", "matiere__filieres")
        .annotate(score=Coalesce(Subquery(score, output_field=IntegerField()), 0,
                                 output_field=IntegerField()))
    )
    if user is not None and user.is_authenticated:
        qs = qs.annotate(
            mon_vote=Subquery(
                Vote.objects.filter(ressource=OuterRef("pk"), user=user).values("valeur")[:1],
                output_field=IntegerField(),
            ),
            est_favori=Exists(Favori.objects.filter(ressource=OuterRef("pk"), user=user)),
        )
        if not (user.is_superuser or user.role in ("moderateur", "admin")):
            qs = qs.filter(Q(statut=Ressource.Statut.PUBLIEE) | Q(auteur=user))
    else:
        qs = qs.filter(statut=Ressource.Statut.PUBLIEE)
    return qs
