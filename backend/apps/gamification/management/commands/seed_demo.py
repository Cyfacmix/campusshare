"""Donnees de demonstration : python manage.py seed_demo [--reset]"""
import random
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.academics.models import Filiere, Matiere
from apps.gamification.models import Badge, Notification, UserBadge
from apps.gamification.services import check_badges
from apps.interactions.models import Commentaire, Favori, SuiviMatiere, Vote
from apps.moderation.models import Signalement
from apps.qna.models import Question, Reponse
from apps.resources.models import Ressource, Tag

User = get_user_model()
PASSWORD = "Campus2026!"

CURRICULUM = {
    "Informatique": {
        "L1": ["Algorithmique", "Introduction aux bases de données", "Mathématiques discrètes"],
        "L2": ["Programmation orientée objet", "Réseaux informatiques", "Systèmes d'exploitation"],
        "L3": ["Génie logiciel", "Développement web", "Intelligence artificielle"],
    },
    "Gestion et Commerce": {
        "L1": ["Comptabilité générale", "Microéconomie"],
        "L2": ["Marketing", "Statistiques appliquées"],
        "L3": ["Finance d'entreprise", "Management stratégique"],
    },
    "Génie Civil": {
        "L1": ["Résistance des matériaux", "Dessin technique"],
        "L2": ["Mécanique des sols", "Topographie"],
        "L3": ["Béton armé", "Hydraulique"],
    },
}

BADGES = [
    ("Débutant", "Bienvenue sur CampusShare !", "sprout", 0),
    ("Contributeur", "Vous partagez régulièrement.", "book-open", 50),
    ("Expert", "Vos ressources sont très appréciées.", "graduation-cap", 200),
    ("Mentor", "Un pilier de la communauté.", "trophy", 500),
]

TYPES = ["cours", "resume", "examen", "tutoriel"]
TITRES = {
    "cours": "Cours complet de {m}",
    "resume": "Résumé de révision : {m}",
    "examen": "Sujet d'examen corrigé : {m}",
    "tutoriel": "Tutoriel pas à pas : {m}",
}
TAGS = ["partiel", "td", "synthese", "corrige", "exercices", "revision", "fiche", "projet"]
COMMENTS = [
    "Merci, très clair et bien structuré !",
    "Super résumé, il m'a sauvé avant le partiel.",
    "Est-ce que le chapitre 3 est aussi couvert ?",
    "Il y a une petite erreur à la page 4, sinon excellent.",
    "Très utile, merci pour le partage.",
]
QUESTIONS = [
    ("Comment bien réviser avant les partiels ?", "Vous avez des méthodes efficaces pour organiser vos révisions ?"),
    ("Différence entre clé primaire et clé étrangère ?", "Je confonds encore les deux notions, quelqu'un peut m'expliquer ?"),
    ("Quelle méthode pour résoudre ce type d'exercice ?", "Je bloque sur la démarche générale, des conseils ?"),
    ("Des ressources pour progresser en programmation ?", "Je cherche des tutoriels pour débutants."),
]


def mini_pdf(title):
    """PDF minimal valide (texte ASCII) pour l'apercu dans le navigateur."""
    text = title.encode("ascii", "ignore").decode().replace("(", "").replace(")", "")
    stream = f"BT /F1 20 Tf 60 780 Td ({text}) Tj ET\nBT /F1 12 Tf 60 740 Td (Document de demonstration CampusShare) Tj ET"
    objs = [
        "<</Type/Catalog/Pages 2 0 R>>",
        "<</Type/Pages/Kids[3 0 R]/Count 1>>",
        "<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>",
        f"<</Length {len(stream)}>>stream\n{stream}\nendstream",
        "<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>",
    ]
    body = "%PDF-1.4\n"
    offsets = []
    for i, obj in enumerate(objs, 1):
        offsets.append(len(body))
        body += f"{i} 0 obj\n{obj}\nendobj\n"
    xref = len(body)
    body += f"xref\n0 {len(objs) + 1}\n0000000000 65535 f \n"
    body += "".join(f"{o:010d} 00000 n \n" for o in offsets)
    body += f"trailer\n<</Size {len(objs) + 1}/Root 1 0 R>>\nstartxref\n{xref}\n%%EOF"
    return body.encode("latin-1")


class Command(BaseCommand):
    help = "Cree des donnees de demonstration realistes (idempotent sauf --reset)."

    def add_arguments(self, parser):
        parser.add_argument("--reset", action="store_true", help="Supprime les donnees avant de recreer.")

    @transaction.atomic
    def handle(self, *args, **opts):
        rng = random.Random(42)
        if opts["reset"]:
            for model in (Notification, UserBadge, Signalement, Commentaire, Vote, Favori,
                          SuiviMatiere, Reponse, Question, Ressource, Tag, Badge):
                model.objects.all().delete()
            User.objects.exclude(is_superuser=True).delete()
        elif Ressource.objects.exists():
            self.stdout.write(self.style.WARNING(
                "Des donnees existent deja. Utilisez --reset pour tout recreer."))
            return

        for nom, desc, icone, seuil in BADGES:
            Badge.objects.get_or_create(nom=nom, defaults={
                "description": desc, "icone": icone, "seuil_points": seuil})

        matieres = []
        filieres = {}
        for fnom, niveaux in CURRICULUM.items():
            fil, _ = Filiere.objects.get_or_create(nom=fnom, defaults={"description": f"Filière {fnom}"})
            filieres[fnom] = fil
            for niveau, noms in niveaux.items():
                for i, nom in enumerate(noms, 1):
                    code = f"{fnom[:3].upper()}{niveau[1]}{i}"
                    m, _ = Matiere.objects.get_or_create(
                        code=code,
                        defaults={"nom": nom, "niveau": niveau, "semestre": 1 + (i % 2)})
                    m.filieres.add(fil)
                    matieres.append(m)

        def make_user(email, first, last, role, filiere=None, niveau="", **extra):
            user, created = User.objects.get_or_create(email=email, defaults={
                "first_name": first, "last_name": last, "role": role,
                "filiere": filiere, "niveau": niveau, **extra})
            if created:
                user.set_password(PASSWORD)
                user.save()
            return user

        admin = make_user("admin@campus.mg", "Admin", "Campus", "admin",
                          is_staff=True, is_superuser=True)
        moderator = make_user("moderateur@campus.mg", "Mialy", "Rakoto", "moderateur")
        teachers = [
            make_user("prof.informatique@campus.mg", "Hery", "Andrianjafy", "enseignant", filieres["Informatique"]),
            make_user("prof.gestion@campus.mg", "Voahangy", "Razafy", "enseignant", filieres["Gestion et Commerce"]),
            make_user("prof.civil@campus.mg", "Tiana", "Rabe", "enseignant", filieres["Génie Civil"]),
        ]
        prenoms = ["Fanja", "Tahina", "Nirina", "Mamy", "Lalaina", "Hasina", "Faly", "Ony",
                   "Rado", "Santatra", "Miora", "Toky", "Zo", "Lova", "Aina"]
        noms = ["Rakotoarisoa", "Randria", "Rasoanaivo", "Ratsimba", "Andriamanana",
                "Rajaonarison", "Razanamaro", "Ramaroson"]
        students = []
        fil_list = list(filieres.values())
        for i in range(25):
            fil = fil_list[i % len(fil_list)]
            niveau = ["L1", "L2", "L3"][i % 3]
            students.append(make_user(
                f"etudiant{i + 1}@campus.mg", rng.choice(prenoms), rng.choice(noms),
                "etudiant", fil, niveau))
        authors = students + teachers
        tags = [Tag.objects.get_or_create(nom=t)[0] for t in TAGS]

        now = timezone.now()
        ressources = []
        for n in range(60):
            matiere = rng.choice(matieres)
            typ = rng.choice(TYPES)
            titre = TITRES[typ].format(m=matiere.nom)
            auteur = rng.choice([a for a in authors if a.filiere_id in {f.id for f in matiere.filieres.all()}] or authors)
            statut = rng.choices(["publiee", "en_attente", "rejetee"], weights=[78, 15, 7])[0]
            res = Ressource(
                titre=titre, type=typ, matiere=matiere, auteur=auteur, statut=statut,
                description=f"Document de {matiere.nom} ({matiere.niveau}) partagé par la communauté.",
                nb_vues=rng.randint(5, 400), nb_telechargements=rng.randint(0, 120),
                motif_rejet="Contenu incomplet ou illisible." if statut == "rejetee" else "",
            )
            if n % 2 == 0:
                res.fichier.save(f"demo-{n}.pdf", ContentFile(mini_pdf(titre)), save=False)
            else:
                res.lien_externe = "https://fr.wikipedia.org/wiki/Cours"
            res.save()
            Ressource.objects.filter(pk=res.pk).update(
                date_creation=now - timedelta(days=rng.randint(0, 330)))
            res.tags.set(rng.sample(tags, rng.randint(1, 3)))
            if statut == "publiee" and auteur.role != "enseignant" and rng.random() < 0.3:
                res.certificateur = rng.choice(teachers)
                res.date_certification = now
                res.save(update_fields=["certificateur", "date_certification"])
            ressources.append(res)

        published = [r for r in ressources if r.statut == "publiee"]
        for res in published:
            voters = rng.sample(students, rng.randint(0, 12))
            for v in voters:
                if v.pk != res.auteur_id:
                    Vote.objects.get_or_create(user=v, ressource=res,
                                               defaults={"valeur": rng.choices([1, -1], weights=[85, 15])[0]})
            for _ in range(rng.randint(0, 3)):
                parent = Commentaire.objects.create(
                    ressource=res, user=rng.choice(students), contenu=rng.choice(COMMENTS))
                if rng.random() < 0.4:
                    Commentaire.objects.create(
                        ressource=res, user=rng.choice(students), parent=parent,
                        contenu="Merci pour le retour !")
        for s in students:
            for res in rng.sample(published, 3):
                Favori.objects.get_or_create(user=s, ressource=res)
            for m in rng.sample(matieres, 2):
                SuiviMatiere.objects.get_or_create(user=s, matiere=m)

        for titre, contenu in QUESTIONS:
            q = Question.objects.create(titre=titre, contenu=contenu,
                                        user=rng.choice(students), matiere=rng.choice(matieres))
            answers = [Reponse.objects.create(
                question=q, user=rng.choice(authors),
                contenu="Voici ma méthode : commencez par les notions de base puis pratiquez avec des exercices.")
                for _ in range(rng.randint(1, 3))]
            if rng.random() < 0.6:
                answers[0].est_acceptee = True
                answers[0].save()
                q.est_resolue = True
                q.save()

        for res in rng.sample(published, 4):
            Signalement.objects.create(ressource=res, signaleur=rng.choice(students),
                                       motif="Contenu inapproprié",
                                       description="Ce document ne correspond pas au titre.")
        c = Commentaire.objects.first()
        if c:
            Signalement.objects.create(commentaire=c, signaleur=rng.choice(students), motif="Spam")

        # Reputation coherente avec les regles de gestion
        for user in authors:
            pts = 0
            mine = Ressource.objects.filter(auteur=user, statut="publiee")
            pts += 10 * mine.count() + 5 * mine.filter(certificateur__isnull=False).count()
            for v in Vote.objects.filter(ressource__auteur=user):
                pts += 2 if v.valeur == 1 else -1
            pts += 15 * Reponse.objects.filter(user=user, est_acceptee=True).count()
            user.points_reputation = max(0, pts)
            user.save(update_fields=["points_reputation"])
        for user in User.objects.all():
            check_badges(user)

        self.stdout.write(self.style.SUCCESS("Données de démonstration créées."))
        self.stdout.write(f"Mot de passe de tous les comptes : {PASSWORD}")
        self.stdout.write("Comptes : admin@campus.mg | moderateur@campus.mg | "
                          "prof.informatique@campus.mg | etudiant1@campus.mg")
