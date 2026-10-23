from django.contrib import admin

from .models import Badge, Notification, UserBadge

admin.site.register(Badge)
admin.site.register(UserBadge)


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("user", "type", "est_lue", "date_creation")
    list_filter = ("type", "est_lue")
