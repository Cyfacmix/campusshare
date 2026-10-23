from django.contrib import admin

from .models import Signalement


@admin.register(Signalement)
class SignalementAdmin(admin.ModelAdmin):
    list_display = ("id", "motif", "statut", "signaleur", "date_signalement")
    list_filter = ("statut",)
