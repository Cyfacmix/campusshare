from django.utils import timezone
from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.gamification.services import notify
from apps.resources import services as resource_services
from apps.resources.models import Ressource
from common.permissions import IsModerator

from .models import Signalement
from .serializers import SignalementCreateSerializer, SignalementSerializer


class SignalementViewSet(mixins.CreateModelMixin, mixins.ListModelMixin, viewsets.GenericViewSet):
    queryset = Signalement.objects.select_related(
        "signaleur", "ressource", "commentaire", "moderateur"
    )
    filterset_fields = ["statut"]
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_permissions(self):
        if self.action == "create":
            return [IsAuthenticated()]
        return [IsModerator()]

    def get_serializer_class(self):
        return SignalementCreateSerializer if self.action == "create" else SignalementSerializer

    def perform_create(self, serializer):
        serializer.save(signaleur=self.request.user)

    @action(detail=True, methods=["patch"])
    def resolve(self, request, pk=None):
        signalement = self.get_object()
        if signalement.statut != Signalement.Statut.OUVERT:
            raise ValidationError("Ce signalement a déjà été traité.")
        decision = request.data.get("decision")
        if decision == "traiter":
            if signalement.ressource_id:
                resource_services.reject(
                    signalement.ressource,
                    request.data.get("motif") or f"Signalement : {signalement.motif}",
                )
            else:
                signalement.commentaire.est_masque = True
                signalement.commentaire.save(update_fields=["est_masque"])
            signalement.statut = Signalement.Statut.TRAITE
        elif decision == "rejeter":
            signalement.statut = Signalement.Statut.REJETE
        else:
            raise ValidationError({"decision": "Valeurs possibles : traiter ou rejeter."})
        signalement.moderateur = request.user
        signalement.date_traitement = timezone.now()
        signalement.save(update_fields=["statut", "moderateur", "date_traitement"])
        notify(signalement.signaleur, "signalement_traite",
               "Votre signalement a été examiné par la modération.")
        return Response(SignalementSerializer(signalement, context={"request": request}).data)
