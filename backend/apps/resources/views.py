from django.db.models import F, Q
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.generics import ListAPIView
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from apps.interactions.models import Favori, SuiviMatiere, Vote
from common.permissions import IsModerator, IsOwnerOrModerator, IsTeacher, is_role

from . import services
from .filters import RessourceFilter
from .models import Ressource, Tag
from .queries import ressources_qs
from .serializers import (
    RessourceDetailSerializer,
    RessourceListSerializer,
    RessourceWriteSerializer,
    TagSerializer,
)


class RessourceViewSet(viewsets.ModelViewSet):
    filterset_class = RessourceFilter
    search_fields = ["titre", "description", "tags__nom", "matiere__nom", "matiere__code"]
    ordering_fields = ["date_creation", "score", "nb_vues", "nb_telechargements"]
    ordering = ["-date_creation"]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    PUBLIC_ACTIONS = {"list", "retrieve", "download"}

    def get_queryset(self):
        return ressources_qs(self.request.user)

    def get_permissions(self):
        if self.action in self.PUBLIC_ACTIONS:
            return [AllowAny()]
        if self.action == "certify":
            return [IsTeacher()]
        if self.action == "moderate":
            return [IsModerator()]
        if self.action in ("create", "mine", "recommended"):
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsOwnerOrModerator()]

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return RessourceWriteSerializer
        if self.action == "list" or self.action in ("mine", "recommended"):
            return RessourceListSerializer
        return RessourceDetailSerializer

    # --- helpers ---------------------------------------------------------
    def _detail(self, pk, http_status=status.HTTP_200_OK):
        instance = self.get_queryset().get(pk=pk)
        data = RessourceDetailSerializer(instance, context=self.get_serializer_context()).data
        return Response(data, status=http_status)

    def _paginated(self, qs):
        page = self.paginate_queryset(qs)
        ser = RessourceListSerializer(page, many=True, context=self.get_serializer_context())
        return self.get_paginated_response(ser.data)

    # --- CRUD ------------------------------------------------------------
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.auteur_id != getattr(request.user, "id", None):
            Ressource.objects.filter(pk=instance.pk).update(nb_vues=F("nb_vues") + 1)
            instance.nb_vues += 1
        return Response(self.get_serializer(instance).data)

    def create(self, request, *args, **kwargs):
        serializer = RessourceWriteSerializer(data=request.data, context=self.get_serializer_context())
        serializer.is_valid(raise_exception=True)
        instance = serializer.save(auteur=request.user)
        if is_role(request.user, "enseignant", "moderateur", "admin"):
            services.publish(instance, notify_author=False)
        return self._detail(instance.pk, status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = RessourceWriteSerializer(
            instance, data=request.data, partial=partial, context=self.get_serializer_context()
        )
        serializer.is_valid(raise_exception=True)
        obj = serializer.save()
        if obj.statut == Ressource.Statut.REJETEE and obj.auteur_id == request.user.id:
            obj.statut = Ressource.Statut.EN_ATTENTE
            obj.save(update_fields=["statut"])
        return self._detail(obj.pk)

    # --- actions ---------------------------------------------------------
    @action(detail=True, methods=["post"])
    def download(self, request, pk=None):
        instance = self.get_object()
        Ressource.objects.filter(pk=instance.pk).update(
            nb_telechargements=F("nb_telechargements") + 1
        )
        url = request.build_absolute_uri(instance.fichier.url) if instance.fichier else instance.lien_externe
        return Response({"url": url, "nb_telechargements": instance.nb_telechargements + 1})

    @action(detail=True, methods=["post"])
    def certify(self, request, pk=None):
        instance = self.get_object()
        services.certify(instance, request.user)
        return self._detail(instance.pk)

    @action(detail=True, methods=["post"])
    def moderate(self, request, pk=None):
        instance = self.get_object()
        services.moderate(
            instance, request.data.get("action"), request.data.get("motif", "")
        )
        return self._detail(instance.pk)

    @action(detail=False, methods=["get"])
    def mine(self, request):
        qs = self.filter_queryset(self.get_queryset().filter(auteur=request.user))
        return self._paginated(qs)

    @action(detail=False, methods=["get"])
    def recommended(self, request):
        user = request.user
        matieres = SuiviMatiere.objects.filter(user=user).values_list("matiere_id", flat=True)
        fav_tags = Favori.objects.filter(user=user).values_list("ressource__tags", flat=True)
        cond = Q(matiere_id__in=list(matieres)) | Q(tags__in=[t for t in fav_tags if t])
        if user.filiere_id:
            cond |= Q(matiere__filieres=user.filiere_id)
        voted = Vote.objects.filter(user=user).values_list("ressource_id", flat=True)
        qs = (
            self.get_queryset()
            .filter(statut=Ressource.Statut.PUBLIEE)
            .filter(cond)
            .exclude(auteur=user)
            .exclude(pk__in=list(voted))
            .distinct()
            .order_by("-score", "-date_creation")
        )
        return self._paginated(qs)


class TagListView(ListAPIView):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [AllowAny]
    pagination_class = None
    search_fields = ["nom"]
