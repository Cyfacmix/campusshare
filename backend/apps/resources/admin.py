from django.contrib import admin

from .models import Ressource, Tag

admin.site.register(Tag)


@admin.register(Ressource)
class RessourceAdmin(admin.ModelAdmin):
    list_display = ("titre", "type", "statut", "matiere", "auteur", "date_creation")
    list_filter = ("statut", "type", "matiere__filiere")
    search_fields = ("titre", "description")
