from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


class UserManager(BaseUserManager):
    use_in_migrations = True

    def _create(self, email, password, **extra):
        if not email:
            raise ValueError("L'email est obligatoire.")
        user = self.model(email=self.normalize_email(email), **extra)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra):
        extra.setdefault("is_staff", False)
        extra.setdefault("is_superuser", False)
        return self._create(email, password, **extra)

    def create_superuser(self, email, password=None, **extra):
        extra.setdefault("is_staff", True)
        extra.setdefault("is_superuser", True)
        extra.setdefault("role", "admin")
        return self._create(email, password, **extra)


class User(AbstractUser):
    class Role(models.TextChoices):
        ETUDIANT = "etudiant", "Étudiant"
        ENSEIGNANT = "enseignant", "Enseignant"
        MODERATEUR = "moderateur", "Modérateur"
        ADMIN = "admin", "Administrateur"

    username = None
    email = models.EmailField("email", unique=True)
    role = models.CharField(max_length=12, choices=Role.choices, default=Role.ETUDIANT)
    niveau = models.CharField(max_length=20, blank=True)
    bio = models.TextField(blank=True)
    avatar = models.ImageField(upload_to="avatars/", null=True, blank=True)
    points_reputation = models.IntegerField(default=0)
    filiere = models.ForeignKey(
        "academics.Filiere",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="etudiants",
    )

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []
    objects = UserManager()

    def __str__(self):
        return self.email
