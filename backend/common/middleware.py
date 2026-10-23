from django.conf import settings


class AllowMediaFraming:
    """Autorise l'apercu des fichiers /media/ (PDF, images) dans une iframe du frontend.

    Le frontend (autre origine) integre les documents ; le reste de l'application
    garde l'en-tete X-Frame-Options par defaut.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        if request.path.startswith(settings.MEDIA_URL):
            response.headers.pop("X-Frame-Options", None)
        return response
