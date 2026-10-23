from django.contrib import admin

from .models import Commentaire, Favori, SuiviMatiere, Vote

admin.site.register(Vote)
admin.site.register(Favori)
admin.site.register(SuiviMatiere)


@admin.register(Commentaire)
class CommentaireAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "ressource", "est_masque", "date_creation")
    list_filter = ("est_masque",)
