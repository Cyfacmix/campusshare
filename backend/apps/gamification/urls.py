from django.urls import path

from .views import (
    BadgeListView,
    LeaderboardView,
    NotificationListView,
    NotificationReadAllView,
    NotificationReadView,
    UnreadCountView,
)

urlpatterns = [
    path("notifications/", NotificationListView.as_view()),
    path("notifications/read-all/", NotificationReadAllView.as_view()),
    path("notifications/unread-count/", UnreadCountView.as_view()),
    path("notifications/<int:pk>/read/", NotificationReadView.as_view()),
    path("badges/", BadgeListView.as_view()),
    path("leaderboard/", LeaderboardView.as_view()),
]
