from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import RessourceViewSet, TagListView

router = DefaultRouter()
router.register("resources", RessourceViewSet, basename="resource")

urlpatterns = [path("tags/", TagListView.as_view())] + router.urls
