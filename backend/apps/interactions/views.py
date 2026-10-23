from django.db import transaction
from django.db.models import Sum
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.academics.models import Matiere
from apps.academics.serializers import MatiereSerializer
from apps.gamification.services import add_points, points_for_vote
from apps.resources.models import Ressource
from apps.resources.queries import ressources_qs
from apps.resources.serializers import RessourceListSerializer
from common.permissions import is_role

from .models import Commentaire, Favori, SuiviMatiere, Vote
from .serializers import CommentaireSerializer


def _visible_ressource(request, pk):
    return get_object_or_404(ressources_qs(request.user), pk=pk)


def _score(ressource):
    return Vote.objects.filter(ressource=ressource).aggregate(s=Sum("valeur"))["s"] or 0


class VoteView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        ressource = get_object_or_404(Ressource, pk=pk, statut=Ressource.Statut.PUBLIEE)
        if ressource.auteur_id == request.user.id:
            return Response({"detail": "Vous ne pouvez pas voter pour votre propre ressource."},
                            status=status.HTTP_400_BAD_REQUEST)
        try:
            valeur = int(request.data.get("valeur"))
        except (TypeError, ValueError):
            valeur = None
        if valeur not in (1, -1):
            return Response({"detail": "La valeur doit être 1 ou -1."},
                            status=status.HTTP_400_BAD_REQUEST)
        with transaction.atomic():
            vote = Vote.objects.filter(user=request.user, ressource=ressource).first()
            if vote and vote.valeur == valeur:  # meme vote : annulation
                add_points(ressource.auteur, -points_for_vote(vote.valeur))
                vote.delete()
                mon_vote = None
            elif vote:  # changement de vote
                add_points(ressource.auteur, points_for_vote(valeur) - points_for_vote(vote.valeur))
                vote.valeur = valeur
                vote.save(update_fields=["valeur"])
                mon_vote = valeur
            else:
                Vote.objects.create(user=request.user, ressource=ressource, valeur=valeur)
                add_points(ressource.auteur, points_for_vote(valeur))
                mon_vote = valeur
        return Response({"score": _score(ressource), "mon_vote": mon_vote})

    def delete(self, request, pk):
        ressource = get_object_or_404(Ressource, pk=pk)
        with transaction.atomic():
            vote = Vote.objects.filter(user=request.user, ressource=ressource).first()
            if vote:
                add_points(ressource.auteur, -points_for_vote(vote.valeur))
                vote.delete()
        return Response({"score": _score(ressource), "mon_vote": None})


class FavoriView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        ressource = _visible_ressource(request, pk)
        Favori.objects.get_or_create(user=request.user, ressource_id=ressource.pk)
        return Response({"est_favori": True}, status=status.HTTP_201_CREATED)

    def delete(self, request, pk):
        Favori.objects.filter(user=request.user, ressource_id=pk).delete()
        return Response({"est_favori": False})


class FavorisListView(generics.ListAPIView):
    serializer_class = RessourceListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ressources_qs(self.request.user).filter(
            favoris__user=self.request.user
        ).order_by("-favoris__date_ajout")


class SuiviView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        matiere = get_object_or_404(Matiere, pk=pk)
        SuiviMatiere.objects.get_or_create(user=request.user, matiere=matiere)
        return Response({"suivi": True}, status=status.HTTP_201_CREATED)

    def delete(self, request, pk):
        SuiviMatiere.objects.filter(user=request.user, matiere_id=pk).delete()
        return Response({"suivi": False})


class SuivisListView(generics.ListAPIView):
    serializer_class = MatiereSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        return Matiere.objects.filter(suivis__user=self.request.user).select_related("filiere")


class CommentaireListCreateView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        ressource = _visible_ressource(request, pk)
        qs = Commentaire.objects.filter(ressource_id=ressource.pk).select_related("user")
        return Response(CommentaireSerializer(qs, many=True, context={"request": request}).data)

    def post(self, request, pk):
        if not request.user.is_authenticated:
            return Response({"detail": "Authentification requise."}, status=status.HTTP_401_UNAUTHORIZED)
        ressource = _visible_ressource(request, pk)
        serializer = CommentaireSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        parent = serializer.validated_data.get("parent")
        if parent and parent.ressource_id != ressource.pk:
            return Response({"parent": "Le commentaire parent appartient à une autre ressource."},
                            status=status.HTTP_400_BAD_REQUEST)
        comment = serializer.save(user=request.user, ressource_id=ressource.pk)
        return Response(CommentaireSerializer(comment, context={"request": request}).data,
                        status=status.HTTP_201_CREATED)


class CommentaireDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get(self, request, pk):
        comment = get_object_or_404(Commentaire.objects.select_related("user"), pk=pk)
        is_owner = comment.user_id == request.user.id
        is_mod = is_role(request.user, "moderateur", "admin")
        return comment, is_owner, is_mod

    def patch(self, request, pk):
        comment, is_owner, is_mod = self._get(request, pk)
        if not (is_owner or is_mod):
            return Response({"detail": "Action non autorisée."}, status=status.HTTP_403_FORBIDDEN)
        if is_owner and "contenu" in request.data:
            serializer = CommentaireSerializer(comment, data={"contenu": request.data["contenu"]},
                                               partial=True, context={"request": request})
            serializer.is_valid(raise_exception=True)
            serializer.save()
        if is_mod and "est_masque" in request.data:
            comment.est_masque = bool(request.data["est_masque"])
            comment.save(update_fields=["est_masque"])
        return Response(CommentaireSerializer(comment, context={"request": request}).data)

    def delete(self, request, pk):
        comment, is_owner, is_mod = self._get(request, pk)
        if not (is_owner or is_mod):
            return Response({"detail": "Action non autorisée."}, status=status.HTTP_403_FORBIDDEN)
        comment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
