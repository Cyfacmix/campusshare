from rest_framework.routers import DefaultRouter

from .views import SignalementViewSet

router = DefaultRouter()
router.register("reports", SignalementViewSet, basename="report")
urlpatterns = router.urls
