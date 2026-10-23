from django.contrib.auth import get_user_model
from django.db.models import Count
from django.shortcuts import get_object_or_404
from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Badge, Notification
from .serializers import BadgeSerializer, LeaderboardSerializer, NotificationSerializer


class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["est_lue"]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).select_related(
            "type_objet_lie"
        )


class NotificationReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        notif = get_object_or_404(Notification, pk=pk, user=request.user)
        notif.est_lue = True
        notif.save(update_fields=["est_lue"])
        return Response({"detail": "ok"})


class NotificationReadAllView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        Notification.objects.filter(user=request.user, est_lue=False).update(est_lue=True)
        return Response({"detail": "ok"})


class UnreadCountView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(
            {"count": Notification.objects.filter(user=request.user, est_lue=False).count()}
        )


class BadgeListView(generics.ListAPIView):
    queryset = Badge.objects.all()
    serializer_class = BadgeSerializer
    permission_classes = [AllowAny]
    pagination_class = None


class LeaderboardView(generics.ListAPIView):
    serializer_class = LeaderboardSerializer
    permission_classes = [AllowAny]
    pagination_class = None

    def get_queryset(self):
        User = get_user_model()
        return (
            User.objects.filter(is_active=True)
            .annotate(nb_badges=Count("user_badges"))
            .order_by("-points_reputation", "id")[:20]
        )
