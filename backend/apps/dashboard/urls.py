from django.urls import path

from .views import AdminDashboardView, MyDashboardView

urlpatterns = [
    path("dashboard/me/", MyDashboardView.as_view()),
    path("dashboard/admin/", AdminDashboardView.as_view()),
]
