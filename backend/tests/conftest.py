import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from apps.academics.models import Filiere, Matiere

User = get_user_model()


@pytest.fixture(autouse=True)
def media_tmp(settings, tmp_path):
    settings.MEDIA_ROOT = tmp_path


@pytest.fixture
def api():
    return APIClient()


def make_user(email, role="etudiant", **kw):
    return User.objects.create_user(email=email, password="Passw0rd!x9", role=role,
                                    first_name=email.split("@")[0].title(), last_name="Test", **kw)


@pytest.fixture
def filiere(db):
    return Filiere.objects.create(nom="Informatique")


@pytest.fixture
def matiere(filiere):
    return Matiere.objects.create(code="INF1", nom="Algorithmique", niveau="L1", filiere=filiere)


@pytest.fixture
def student(db):
    return make_user("alice@campus.mg")


@pytest.fixture
def other(db):
    return make_user("bob@campus.mg")


@pytest.fixture
def teacher(db):
    return make_user("prof@campus.mg", role="enseignant")


@pytest.fixture
def moderator(db):
    return make_user("mod@campus.mg", role="moderateur")


@pytest.fixture
def admin(db):
    return make_user("admin@campus.mg", role="admin")


def login(client, user):
    client.force_authenticate(user=user)
    return client
