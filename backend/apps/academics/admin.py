from django.contrib import admin

from .models import Filiere, Matiere

admin.site.register(Filiere)


@admin.register(Matiere)
class MatiereAdmin(admin.ModelAdmin):
    list_display = ("code", "nom", "niveau", "semestre")
    list_filter = ("filieres", "niveau")
    search_fields = ("code", "nom")
    filter_horizontal = ("filieres",)