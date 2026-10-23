from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import AcceptAnswerView, QuestionViewSet

router = DefaultRouter()
router.register("questions", QuestionViewSet, basename="question")

urlpatterns = [path("answers/<int:pk>/accept/", AcceptAnswerView.as_view())] + router.urls
