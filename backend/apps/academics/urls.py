from rest_framework.routers import DefaultRouter

from .views import FiliereViewSet, MatiereViewSet

router = DefaultRouter()
router.register("filieres", FiliereViewSet, basename="filiere")
router.register("matieres", MatiereViewSet, basename="matiere")
urlpatterns = router.urls
