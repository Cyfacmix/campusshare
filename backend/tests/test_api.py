import pytest
from django.db import IntegrityError
from django.core.files.uploadedfile import SimpleUploadedFile

from apps.gamification.models import Badge, Notification
from apps.interactions.models import Commentaire
from apps.moderation.models import Signalement
from apps.qna.models import Question, Reponse
from apps.resources.models import Ressource

from .conftest import login, make_user

pytestmark = pytest.mark.django_db
R = "/api/v1/resources/"


def new_resource(auteur, matiere, statut="publiee", **kw):
    data = dict(titre="Cours A", type="cours", lien_externe="https://example.org/x",
                auteur=auteur, matiere=matiere, statut=statut)
    data.update(kw)
    return Ressource.objects.create(**data)


# ---------- authentification ----------
def test_register_and_login(api, filiere):
    r = api.post("/api/v1/auth/register/", {
        "email": "new@campus.mg", "password": "Str0ngPass!77", "first_name": "New", "last_name": "User"})
    assert r.status_code == 201 and r.data["role"] == "etudiant"
    r = api.post("/api/v1/auth/login/", {"email": "new@campus.mg", "password": "Str0ngPass!77"})
    assert r.status_code == 200
    assert {"access", "refresh", "user"} <= set(r.data)


def test_register_duplicate_and_weak_password(api, student):
    r = api.post("/api/v1/auth/register/", {
        "email": student.email, "password": "Str0ngPass!77", "first_name": "A", "last_name": "B"})
    assert r.status_code == 400
    r = api.post("/api/v1/auth/register/", {
        "email": "x@campus.mg", "password": "123", "first_name": "A", "last_name": "B"})
    assert r.status_code == 400


def test_login_wrong_password(api, student):
    r = api.post("/api/v1/auth/login/", {"email": student.email, "password": "mauvais"})
    assert r.status_code == 401


def test_role_cannot_be_changed_by_user(api, student):
    login(api, student)
    api.patch("/api/v1/auth/me/", {"role": "admin", "bio": "hello"}, format="json")
    student.refresh_from_db()
    assert student.role == "etudiant" and student.bio == "hello"


def test_public_profile_hides_email(api, student):
    r = api.get(f"/api/v1/users/{student.id}/")
    assert r.status_code == 200 and "email" not in r.data


# ---------- ressources : visibilite et creation ----------
def test_pending_resource_visibility(api, student, other, moderator, matiere):
    res = new_resource(student, matiere, statut="en_attente")
    assert api.get(f"{R}{res.id}/").status_code == 404
    login(api, other)
    assert api.get(f"{R}{res.id}/").status_code == 404
    login(api, student)
    assert api.get(f"{R}{res.id}/").status_code == 200
    login(api, moderator)
    assert api.get(f"{R}{res.id}/").status_code == 200


def test_student_creates_pending_teacher_publishes_directly(api, student, teacher, matiere):
    payload = {"titre": "Mon cours", "type": "cours", "matiere": matiere.id,
               "lien_externe": "https://example.org/doc", "tags": ["Partiel", "td"]}
    login(api, student)
    r = api.post(R, payload, format="json")
    assert r.status_code == 201 and r.data["statut"] == "en_attente"
    assert sorted(r.data["tags"]) == ["partiel", "td"]
    login(api, teacher)
    r = api.post(R, payload, format="json")
    assert r.data["statut"] == "publiee"
    teacher.refresh_from_db()
    assert teacher.points_reputation == 10


def test_resource_requires_file_or_link(api, student, matiere):
    login(api, student)
    r = api.post(R, {"titre": "Vide", "type": "cours", "matiere": matiere.id}, format="json")
    assert r.status_code == 400


def test_upload_validation(api, student, matiere):
    login(api, student)
    bad = SimpleUploadedFile("virus.exe", b"MZ....", content_type="application/octet-stream")
    r = api.post(R, {"titre": "X", "type": "cours", "matiere": matiere.id, "fichier": bad},
                 format="multipart")
    assert r.status_code == 400
    fake_pdf = SimpleUploadedFile("faux.pdf", b"pas un pdf", content_type="application/pdf")
    r = api.post(R, {"titre": "X", "type": "cours", "matiere": matiere.id, "fichier": fake_pdf},
                 format="multipart")
    assert r.status_code == 400
    ok = SimpleUploadedFile("cours.pdf", b"%PDF-1.4 contenu", content_type="application/pdf")
    r = api.post(R, {"titre": "Bon", "type": "cours", "matiere": matiere.id, "fichier": ok},
                 format="multipart")
    assert r.status_code == 201 and r.data["fichier"]


def test_only_owner_or_moderator_can_edit(api, student, other, moderator, matiere):
    res = new_resource(student, matiere)
    login(api, other)
    assert api.patch(f"{R}{res.id}/", {"titre": "Pirate"}, format="json").status_code == 403
    login(api, student)
    assert api.patch(f"{R}{res.id}/", {"titre": "Modifié"}, format="json").status_code == 200
    login(api, moderator)
    assert api.delete(f"{R}{res.id}/").status_code == 204


# ---------- moderation ----------
def test_moderation_publish_and_reject(api, student, moderator, matiere):
    res = new_resource(student, matiere, statut="en_attente")
    login(api, student)
    assert api.post(f"{R}{res.id}/moderate/", {"action": "publish"}, format="json").status_code == 403
    login(api, moderator)
    r = api.post(f"{R}{res.id}/moderate/", {"action": "reject"}, format="json")
    assert r.status_code == 400  # motif obligatoire
    r = api.post(f"{R}{res.id}/moderate/", {"action": "publish"}, format="json")
    assert r.status_code == 200 and r.data["statut"] == "publiee"
    student.refresh_from_db()
    assert student.points_reputation == 10
    assert Notification.objects.filter(user=student, type="ressource_publiee").exists()
    r = api.post(f"{R}{res.id}/moderate/", {"action": "reject", "motif": "Illisible"}, format="json")
    assert r.data["statut"] == "rejetee"
    student.refresh_from_db()
    assert student.points_reputation == 0


def test_certification_only_by_teacher(api, student, teacher, matiere):
    res = new_resource(student, matiere)
    login(api, student)
    assert api.post(f"{R}{res.id}/certify/").status_code == 403
    login(api, teacher)
    r = api.post(f"{R}{res.id}/certify/")
    assert r.status_code == 200 and r.data["certifiee"] is True
    assert api.post(f"{R}{res.id}/certify/").status_code == 400
    student.refresh_from_db()
    assert student.points_reputation == 5


# ---------- votes ----------
def test_vote_rules(api, student, other, matiere):
    res = new_resource(student, matiere)
    url = f"{R}{res.id}/vote/"
    login(api, student)
    assert api.post(url, {"valeur": 1}, format="json").status_code == 400  # auto-vote
    login(api, other)
    assert api.post(url, {"valeur": 5}, format="json").status_code == 400
    r = api.post(url, {"valeur": 1}, format="json")
    assert r.data == {"score": 1, "mon_vote": 1}
    student.refresh_from_db()
    assert student.points_reputation == 2
    r = api.post(url, {"valeur": -1}, format="json")  # changement
    assert r.data["score"] == -1
    student.refresh_from_db()
    assert student.points_reputation == 0  # 2 - 3 = -1, plafonne a 0
    r = api.post(url, {"valeur": -1}, format="json")  # annulation
    assert r.data == {"score": 0, "mon_vote": None}


def test_reputation_never_negative_and_badge(api, student, other, matiere, teacher):
    Badge.objects.create(nom="Débutant", seuil_points=0)
    Badge.objects.create(nom="Contributeur", seuil_points=10)
    res = new_resource(student, matiere)
    login(api, other)
    api.post(f"{R}{res.id}/vote/", {"valeur": -1}, format="json")
    student.refresh_from_db()
    assert student.points_reputation == 0
    login(api, teacher)
    api.post(R, {"titre": "T", "type": "cours", "matiere": matiere.id,
                 "lien_externe": "https://example.org"}, format="json")
    teacher.refresh_from_db()
    assert teacher.user_badges.filter(badge__nom="Contributeur").exists()


# ---------- favoris, suivis, commentaires ----------
def test_favorites_and_follows(api, student, other, matiere):
    res = new_resource(other, matiere)
    login(api, student)
    assert api.post(f"{R}{res.id}/favorite/").status_code == 201
    assert api.get("/api/v1/favorites/").data["count"] == 1
    api.delete(f"{R}{res.id}/favorite/")
    assert api.get("/api/v1/favorites/").data["count"] == 0
    assert api.post(f"/api/v1/matieres/{matiere.id}/follow/").status_code == 201
    assert len(api.get("/api/v1/follows/").data) == 1


def test_follow_notifies_on_publication(api, student, other, moderator, matiere):
    login(api, student)
    api.post(f"/api/v1/matieres/{matiere.id}/follow/")
    res = new_resource(other, matiere, statut="en_attente")
    login(api, moderator)
    api.post(f"{R}{res.id}/moderate/", {"action": "publish"}, format="json")
    assert Notification.objects.filter(user=student, type="nouvelle_ressource").exists()


def test_comments_nested_and_masked(api, student, other, moderator, matiere):
    res = new_resource(student, matiere)
    login(api, other)
    c1 = api.post(f"{R}{res.id}/comments/", {"contenu": "Super"}, format="json").data
    r = api.post(f"{R}{res.id}/comments/", {"contenu": "Merci", "parent": c1["id"]}, format="json")
    assert r.status_code == 201 and r.data["parent"] == c1["id"]
    assert api.post(f"{R}{res.id}/comments/", {"contenu": "  "}, format="json").status_code == 400
    login(api, moderator)
    api.patch(f"/api/v1/comments/{c1['id']}/", {"est_masque": True}, format="json")
    api.force_authenticate(user=None)
    data = api.get(f"{R}{res.id}/comments/").data
    assert "masqué" in next(c for c in data if c["id"] == c1["id"])["contenu"]


# ---------- Q&R ----------
def test_accept_answer_rules(api, student, other, matiere):
    login(api, student)
    q = api.post("/api/v1/questions/", {"titre": "Question ?", "contenu": "Détails", "matiere": matiere.id},
                 format="json").data
    login(api, other)
    a1 = api.post(f"/api/v1/questions/{q['id']}/answers/", {"contenu": "Réponse 1"}, format="json").data
    a2 = api.post(f"/api/v1/questions/{q['id']}/answers/", {"contenu": "Réponse 2"}, format="json").data
    assert api.post(f"/api/v1/answers/{a1['id']}/accept/").status_code == 403  # pas l'auteur
    login(api, student)
    assert api.post(f"/api/v1/answers/{a1['id']}/accept/").status_code == 200
    assert api.post(f"/api/v1/answers/{a2['id']}/accept/").status_code == 200
    assert Reponse.objects.filter(question_id=q["id"], est_acceptee=True).count() == 1
    assert Question.objects.get(pk=q["id"]).est_resolue
    other.refresh_from_db()
    assert other.points_reputation == 15  # a1: +15 puis -15 ; a2: +15


# ---------- signalements ----------
def test_report_single_target_and_resolution(api, student, other, moderator, matiere):
    res = new_resource(student, matiere)
    comment = Commentaire.objects.create(ressource=res, user=student, contenu="Spam")
    login(api, other)
    url = "/api/v1/reports/"
    assert api.post(url, {"motif": "x"}, format="json").status_code == 400
    assert api.post(url, {"motif": "x", "ressource": res.id, "commentaire": comment.id},
                    format="json").status_code == 400
    r = api.post(url, {"motif": "Spam", "commentaire": comment.id}, format="json")
    assert r.status_code == 201
    assert api.post(url, {"motif": "Spam", "commentaire": comment.id}, format="json").status_code == 400
    assert api.get(url).status_code == 403
    login(api, moderator)
    sig = Signalement.objects.get()
    r = api.patch(f"{url}{sig.id}/resolve/", {"decision": "traiter"}, format="json")
    assert r.status_code == 200 and r.data["statut"] == "traite"
    comment.refresh_from_db()
    assert comment.est_masque
    assert api.patch(f"{url}{sig.id}/resolve/", {"decision": "traiter"}, format="json").status_code == 400


def test_db_constraint_signalement_two_targets(student, matiere):
    res = new_resource(student, matiere)
    comment = Commentaire.objects.create(ressource=res, user=student, contenu="x")
    with pytest.raises(IntegrityError):
        Signalement.objects.create(signaleur=student, motif="x", ressource=res, commentaire=comment)


# ---------- recherche et filtres ----------
def test_search_filters_and_ordering(api, student, other, matiere, filiere):
    a = new_resource(student, matiere, titre="Python avance", type="cours")
    b = new_resource(student, matiere, titre="Examen reseaux", type="examen")
    login(api, other)
    api.post(f"{R}{b.id}/vote/", {"valeur": 1}, format="json")
    api.force_authenticate(user=None)
    assert api.get(R, {"search": "python"}).data["count"] == 1
    assert api.get(R, {"type": "examen"}).data["results"][0]["id"] == b.id
    assert api.get(R, {"filiere": filiere.id}).data["count"] == 2
    assert api.get(R, {"ordering": "-score"}).data["results"][0]["id"] == b.id
    assert api.get(R, {"certifiee": "true"}).data["count"] == 0


# ---------- administration, notifications, dashboards ----------
def test_admin_user_management_permissions(api, student, admin):
    login(api, student)
    assert api.get("/api/v1/admin/users/").status_code == 403
    login(api, admin)
    r = api.patch(f"/api/v1/admin/users/{student.id}/", {"role": "enseignant"}, format="json")
    assert r.status_code == 200
    student.refresh_from_db()
    assert student.role == "enseignant"


def test_filiere_delete_protected(api, admin, matiere, filiere):
    login(api, admin)
    assert api.delete(f"/api/v1/filieres/{filiere.id}/").status_code == 409


def test_notifications_flow(api, student):
    from apps.gamification.services import notify
    notify(student, "test", "Bonjour")
    notify(student, "test", "Encore")
    login(api, student)
    assert api.get("/api/v1/notifications/unread-count/").data["count"] == 2
    first = api.get("/api/v1/notifications/").data["results"][0]["id"]
    api.post(f"/api/v1/notifications/{first}/read/")
    assert api.get("/api/v1/notifications/unread-count/").data["count"] == 1
    api.post("/api/v1/notifications/read-all/")
    assert api.get("/api/v1/notifications/unread-count/").data["count"] == 0


def test_dashboards(api, student, moderator, matiere):
    new_resource(student, matiere)
    login(api, student)
    r = api.get("/api/v1/dashboard/me/")
    assert r.status_code == 200 and r.data["nb_publiees"] == 1
    assert api.get("/api/v1/dashboard/admin/").status_code == 403
    login(api, moderator)
    r = api.get("/api/v1/dashboard/admin/")
    assert r.status_code == 200 and r.data["totaux"]["ressources_publiees"] == 1


def test_recommended_and_mine(api, student, other, matiere):
    new_resource(other, matiere, titre="Recommandée")
    login(api, student)
    api.post(f"/api/v1/matieres/{matiere.id}/follow/")
    assert api.get(f"{R}recommended/").data["count"] == 1
    assert api.get(f"{R}mine/").data["count"] == 0
