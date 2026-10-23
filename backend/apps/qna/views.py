from django.db import transaction
from django.db.models import Count
from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.gamification.services import PTS_REPONSE_ACCEPTEE, add_points, notify
from common.permissions import IsOwnerOrModerator

from .models import Question, Reponse
from .serializers import QuestionSerializer, ReponseSerializer


class QuestionViewSet(viewsets.ModelViewSet):
    serializer_class = QuestionSerializer
    filterset_fields = ["matiere", "est_resolue"]
    search_fields = ["titre", "contenu"]
    ordering_fields = ["date_creation", "nb_reponses"]

    def get_queryset(self):
        return (
            Question.objects.select_related("user", "matiere")
            .annotate(nb_reponses=Count("reponses"))
            .order_by("-date_creation")
        )

    def get_permissions(self):
        if self.action in ("list", "retrieve", "answers") and self.request.method == "GET":
            return [AllowAny()]
        if self.action in ("create", "answers"):
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsOwnerOrModerator()]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=["get", "post"])
    def answers(self, request, pk=None):
        question = self.get_object()
        if request.method == "GET":
            qs = question.reponses.select_related("user")
            return Response(ReponseSerializer(qs, many=True, context={"request": request}).data)
        serializer = ReponseSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        reponse = serializer.save(user=request.user, question=question)
        if question.user_id != request.user.id:
            notify(question.user, "nouvelle_reponse",
                   f"Nouvelle réponse à votre question « {question.titre} ».", question)
        return Response(ReponseSerializer(reponse, context={"request": request}).data,
                        status=status.HTTP_201_CREATED)


class AcceptAnswerView(APIView):
    """Une seule reponse acceptee par question, uniquement par l'auteur de la question."""

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        reponse = get_object_or_404(Reponse.objects.select_related("question", "user"), pk=pk)
        question = reponse.question
        if question.user_id != request.user.id:
            return Response({"detail": "Seul l'auteur de la question peut accepter une réponse."},
                            status=status.HTTP_403_FORBIDDEN)
        with transaction.atomic():
            previous = list(
                question.reponses.filter(est_acceptee=True).exclude(pk=reponse.pk).select_related("user")
            )
            for prev in previous:
                add_points(prev.user, -PTS_REPONSE_ACCEPTEE)
            if previous:
                Reponse.objects.filter(pk__in=[p.pk for p in previous]).update(est_acceptee=False)
            if not reponse.est_acceptee:
                reponse.est_acceptee = True
                reponse.save(update_fields=["est_acceptee"])
                add_points(reponse.user, PTS_REPONSE_ACCEPTEE)
                if reponse.user_id != request.user.id:
                    notify(reponse.user, "reponse_acceptee",
                           f"Votre réponse à « {question.titre} » a été acceptée.", question)
            question.est_resolue = True
            question.save(update_fields=["est_resolue"])
        return Response(ReponseSerializer(reponse, context={"request": request}).data)
