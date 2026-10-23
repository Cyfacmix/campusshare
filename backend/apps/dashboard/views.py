from django.contrib.auth import get_user_model
from django.db.models import Count, Sum
from django.db.models.functions import TruncMonth
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.gamification.models import Badge
from apps.interactions.models import Vote
from apps.moderation.models import Signalement
from apps.qna.models import Question, Reponse
from apps.resources.models import Ressource
from common.permissions import IsModerator

User = get_user_model()


def _par_mois(qs, limit=12):
    rows = (
        qs.annotate(mois=TruncMonth("date_creation"))
        .values("mois")
        .annotate(total=Count("id"))
        .order_by("-mois")[:limit]
    )
    return [{"mois": r["mois"].strftime("%Y-%m"), "total": r["total"]} for r in reversed(list(rows))]


class MyDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        mine = Ressource.objects.filter(auteur=user)
        published = mine.filter(statut=Ressource.Statut.PUBLIEE)
        sums = published.aggregate(v=Sum("nb_vues"), t=Sum("nb_telechargements"))
        votes = Vote.objects.filter(ressource__auteur=user).aggregate(s=Sum("valeur"))["s"] or 0
        next_badge = (
            Badge.objects.filter(seuil_points__gt=user.points_reputation)
            .order_by("seuil_points").first()
        )
        return Response({
            "nb_ressources": mine.count(),
            "nb_publiees": published.count(),
            "nb_en_attente": mine.filter(statut=Ressource.Statut.EN_ATTENTE).count(),
            "nb_rejetees": mine.filter(statut=Ressource.Statut.REJETEE).count(),
            "total_vues": sums["v"] or 0,
            "total_telechargements": sums["t"] or 0,
            "votes_recus": votes,
            "nb_questions": Question.objects.filter(user=user).count(),
            "nb_reponses": Reponse.objects.filter(user=user).count(),
            "reponses_acceptees": Reponse.objects.filter(user=user, est_acceptee=True).count(),
            "points_reputation": user.points_reputation,
            "badges": [
                {"nom": ub.badge.nom, "icone": ub.badge.icone, "description": ub.badge.description}
                for ub in user.user_badges.select_related("badge")
            ],
            "prochain_badge": (
                {"nom": next_badge.nom, "seuil": next_badge.seuil_points,
                 "restant": next_badge.seuil_points - user.points_reputation}
                if next_badge else None
            ),
            "ressources_par_mois": _par_mois(mine),
            "top_ressources": list(
                published.order_by("-nb_vues").values("id", "titre", "nb_vues", "nb_telechargements")[:5]
            ),
        })


class AdminDashboardView(APIView):
    permission_classes = [IsModerator]

    def get(self, request):
        published = Ressource.objects.filter(statut=Ressource.Statut.PUBLIEE)
        contributors = (
            published.exclude(auteur__isnull=True)
            .values("auteur__id", "auteur__first_name", "auteur__last_name", "auteur__email")
            .annotate(total=Count("id"))
            .order_by("-total")[:8]
        )
        return Response({
            "totaux": {
                "utilisateurs": User.objects.count(),
                "ressources_publiees": published.count(),
                "ressources_en_attente": Ressource.objects.filter(
                    statut=Ressource.Statut.EN_ATTENTE).count(),
                "questions": Question.objects.count(),
                "signalements_ouverts": Signalement.objects.filter(
                    statut=Signalement.Statut.OUVERT).count(),
            },
            "ressources_par_mois": _par_mois(Ressource.objects.all()),
            "top_matieres": list(
                published.values("matiere__nom")
                .annotate(vues=Sum("nb_vues"), total=Count("id"))
                .order_by("-vues")[:8]
            ),
            "top_contributeurs": [
                {
                    "id": c["auteur__id"],
                    "nom": f'{c["auteur__first_name"]} {c["auteur__last_name"]}'.strip()
                    or c["auteur__email"].split("@")[0],
                    "total": c["total"],
                }
                for c in contributors
            ],
            "par_type": list(published.values("type").annotate(total=Count("id")).order_by("-total")),
            "utilisateurs_par_role": list(
                User.objects.values("role").annotate(total=Count("id")).order_by("-total")
            ),
        })
