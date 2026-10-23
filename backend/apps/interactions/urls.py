from django.urls import path

from .views import (
    CommentaireDetailView,
    CommentaireListCreateView,
    FavoriView,
    FavorisListView,
    SuiviView,
    SuivisListView,
    VoteView,
)

urlpatterns = [
    path("resources/<int:pk>/vote/", VoteView.as_view()),
    path("resources/<int:pk>/favorite/", FavoriView.as_view()),
    path("resources/<int:pk>/comments/", CommentaireListCreateView.as_view()),
    path("comments/<int:pk>/", CommentaireDetailView.as_view()),
    path("favorites/", FavorisListView.as_view()),
    path("matieres/<int:pk>/follow/", SuiviView.as_view()),
    path("follows/", SuivisListView.as_view()),
]
