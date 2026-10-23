# CampusShare

Plateforme web de partage de connaissances pour un campus : les étudiants publient et trouvent des cours, résumés, sujets d'examen et tutoriels, classés par filière, niveau et matière. Votes, commentaires, questions/réponses, modération, réputation et badges font remonter les meilleurs contenus.

**Stack** : Django 5 + Django REST Framework (backend) · React 18 + Vite + Tailwind CSS (frontend) · MySQL 8 (base de données).

## Fonctionnalités

- Inscription / connexion JWT (access 15 min, refresh 7 jours avec rotation et blacklist), profil, changement de mot de passe
- 4 rôles : **étudiant, enseignant, modérateur, administrateur**, avec permissions par rôle
- Publication de ressources (fichier pdf/docx/pptx/png/jpg/zip jusqu'à 20 Mo, ou lien externe), tags, aperçu PDF intégré
- Recherche et filtres (texte, filière, niveau, matière, type, tag, vérifiées) et tri (date, score, vues, téléchargements)
- Votes utile / pas utile, favoris, suivi de matières, commentaires imbriqués
- Questions / réponses avec « meilleure réponse »
- Modération : file de validation, signalements, rejet avec motif
- Certification d'une ressource par un enseignant
- Réputation, badges automatiques, notifications, classement
- Tableaux de bord : personnel et administrateur (graphiques)
- Mode sombre, interface responsive, documentation Swagger de l'API

## Structure

```
campusshare/
├── backend/             # Django + DRF
│   ├── config/          # settings, urls
│   ├── apps/            # accounts, academics, resources, interactions,
│   │                    # qna, moderation, gamification, dashboard
│   ├── common/          # permissions, pagination, utilitaires
│   └── tests/           # tests pytest
├── frontend/            # React + Vite
│   └── src/             # api, components, context, pages, routes, utils
├── docker-compose.yml   # MySQL 8
└── README.md
```

## Prérequis

Python 3.12, Node.js 20+, Docker Desktop (ou un MySQL 8 installé), Git.

## Installation

### 1. Base de données MySQL

```bash
docker compose up -d
```

Cela crée la base `campusshare` (utilisateur `campus`, mot de passe `campus_pass`). Attendez quelques secondes que MySQL soit prêt (`docker compose ps` doit afficher *healthy*).

> Sans Docker ni MySQL, vous pouvez démarrer rapidement avec SQLite : mettez `DB_ENGINE=sqlite` dans `backend/.env`.

### 2. Backend

```bash
cd backend
python -m venv .venv
# Windows : .venv\Scripts\activate      Mac/Linux : source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env            # Windows : copy .env.example .env
python manage.py makemigrations
python manage.py migrate
python manage.py seed_demo
python manage.py runserver
```

- API : http://localhost:8000/api/v1/
- Documentation Swagger : http://localhost:8000/api/docs/
- Administration Django : http://localhost:8000/admin/

> `makemigrations` génère les fichiers de migration à partir des modèles. Lancez-le **avant** `migrate`, une seule fois. Gardez ensuite les fichiers générés dans `apps/*/migrations/`.

### 3. Frontend

Dans un second terminal :

```bash
cd frontend
cp .env.example .env            # Windows : copy .env.example .env
npm install
npm run dev
```

Application : http://localhost:5173

## Comptes de démonstration

Créés par `python manage.py seed_demo`. Mot de passe commun : **`Campus2026!`**

| Rôle | Email |
|---|---|
| Administrateur | `admin@campus.mg` |
| Modérateur | `moderateur@campus.mg` |
| Enseignant | `prof.informatique@campus.mg` |
| Étudiant | `etudiant1@campus.mg` (jusqu'à `etudiant25@campus.mg`) |

`python manage.py seed_demo --reset` supprime les données de démonstration et les recrée.

Les données comprennent 3 filières, 18 matières, 60 ressources (statuts variés), votes, commentaires, questions/réponses, signalements, badges.

## Tests

```bash
cd backend
pytest
```

Les tests utilisent SQLite en mémoire (aucun MySQL requis) et couvrent : authentification, permissions par rôle, visibilité des ressources, validation des uploads, modération, certification, votes, réputation et badges, favoris, suivis, commentaires, questions/réponses, signalements, filtres et recherche, tableaux de bord, notifications.

## Règles de gestion

1. Une ressource n'est visible publiquement que si elle est **publiée** ; l'auteur et la modération voient aussi les autres statuts.
2. Une ressource d'un étudiant est créée **en attente** ; celle d'un enseignant, modérateur ou admin est publiée directement.
3. Le rejet exige un **motif**, transmis à l'auteur par notification.
4. Un utilisateur vote **une fois** par ressource (revoter à l'identique annule, voter autrement change le vote) et **jamais pour sa propre ressource**.
5. Seul un enseignant (ou admin) peut **certifier** une ressource publiée.
6. Un signalement vise **soit une ressource, soit un commentaire** (contrainte en base) ; un utilisateur ne signale pas deux fois la même cible.
7. Une question a **au plus une réponse acceptée**, choisie par l'auteur de la question.
8. Réputation : +10 ressource publiée, +2 vote positif reçu, −1 vote négatif reçu, +15 réponse acceptée, +5 certification (jamais sous 0).
9. Badges attribués automatiquement selon le seuil de points ; notifications pour les événements importants.
10. La suppression d'un compte conserve ses contenus (auteur affiché « Utilisateur supprimé »).

## Permissions

| Action | Visiteur | Étudiant | Enseignant | Modérateur | Admin |
|---|---|---|---|---|---|
| Voir les ressources publiées | ✔ | ✔ | ✔ | ✔ | ✔ |
| Publier, voter, commenter, favoris, questions | | ✔ | ✔ | ✔ | ✔ |
| Certifier une ressource | | | ✔ | | ✔ |
| Modérer ressources et signalements | | | | ✔ | ✔ |
| Gérer filières, matières, utilisateurs | | | | | ✔ |

## API (préfixe `/api/v1/`)

Liste complète et interactive : `/api/docs/`. Principaux groupes : `auth/`, `users/`, `filieres/`, `matieres/`, `resources/` (+ `mine/`, `recommended/`, `vote/`, `favorite/`, `comments/`, `certify/`, `moderate/`, `download/`), `favorites/`, `follows/`, `questions/` (+ `answers/`), `answers/{id}/accept/`, `reports/`, `notifications/`, `badges/`, `leaderboard/`, `dashboard/me/`, `dashboard/admin/`, `admin/users/`.

## Sécurité

- JWT avec rotation et blacklist des refresh tokens ; throttling sur connexion et inscription
- Validation des mots de passe (validateurs Django) ; le rôle ne peut pas être modifié par l'utilisateur
- Uploads : extension, taille (20 Mo), type MIME et signature du fichier contrôlés
- Profil public sans email ; CORS limité à l'URL du frontend
- Secrets et identifiants dans `.env` (jamais versionné) ; pensez à `DEBUG=False` et à une vraie `SECRET_KEY` en production

## Dépannage

- **`mysqlclient` ne s'installe pas** (Windows) : installez les « Build Tools C++ » de Microsoft, ou utilisez temporairement `DB_ENGINE=sqlite`. Sous Linux : `sudo apt install libmysqlclient-dev pkg-config build-essential`.
- **« Can't connect to MySQL server »** : Docker Desktop n'est pas lancé, ou le conteneur n'est pas prêt (`docker compose ps`), ou le port 3306 est déjà utilisé.
- **Erreur CORS** : vérifiez `CORS_ALLOWED_ORIGINS` dans `backend/.env` et `VITE_API_URL` dans `frontend/.env`.
- **Repartir de zéro** : `docker compose down -v`, supprimez les fichiers de migration générés, puis refaites `makemigrations`, `migrate`, `seed_demo`.
- **Aperçu PDF vide** : le fichier doit être servi par le backend (`DEBUG=True` en développement). En production, servez `/media/` avec nginx.

## Pistes d'amélioration

Index FULLTEXT MySQL pour la recherche, envoi d'emails, tâches planifiées (Celery), détection de doublons, déploiement Docker complet, ESLint/Prettier.
