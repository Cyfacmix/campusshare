from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Profil de l'utilisateur connecte."""

    filiere_nom = serializers.CharField(source="filiere.nom", read_only=True, default=None)

    class Meta:
        model = User
        fields = [
            "id", "email", "first_name", "last_name", "role", "niveau", "bio",
            "avatar", "points_reputation", "filiere", "filiere_nom", "date_joined",
        ]
        read_only_fields = ["id", "email", "role", "points_reputation", "date_joined"]


class PublicUserSerializer(serializers.ModelSerializer):
    """Profil public : l'email n'est jamais expose."""

    filiere_nom = serializers.CharField(source="filiere.nom", read_only=True, default=None)
    badges = serializers.SerializerMethodField()
    nb_ressources = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id", "first_name", "last_name", "bio", "avatar", "role",
            "points_reputation", "filiere_nom", "niveau", "date_joined",
            "badges", "nb_ressources",
        ]

    def get_badges(self, obj):
        return [
            {"nom": ub.badge.nom, "icone": ub.badge.icone, "description": ub.badge.description}
            for ub in obj.user_badges.select_related("badge")
        ]

    def get_nb_ressources(self, obj):
        return obj.ressources.filter(statut="publiee").count()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, style={"input_type": "password"})

    class Meta:
        model = User
        fields = ["email", "password", "first_name", "last_name", "filiere", "niveau"]
        extra_kwargs = {"first_name": {"required": True}, "last_name": {"required": True}}

    def validate_email(self, value):
        value = value.lower().strip()
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Un compte existe déjà avec cet email.")
        return value

    def validate(self, attrs):
        probe = User(email=attrs.get("email"), first_name=attrs.get("first_name", ""),
                     last_name=attrs.get("last_name", ""))
        validate_password(attrs["password"], user=probe)
        return attrs

    def create(self, validated_data):
        password = validated_data.pop("password")
        return User.objects.create_user(password=password, role="etudiant", **validated_data)


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)

    def validate_old_password(self, value):
        if not self.context["request"].user.check_password(value):
            raise serializers.ValidationError("Ancien mot de passe incorrect.")
        return value

    def validate_new_password(self, value):
        validate_password(value, user=self.context["request"].user)
        return value


class AdminUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id", "email", "first_name", "last_name", "role", "is_active",
            "points_reputation", "date_joined",
        ]
        read_only_fields = ["id", "email", "points_reputation", "date_joined"]


class LoginSerializer(TokenObtainPairSerializer):
    """Ajoute le profil utilisateur a la reponse de connexion."""

    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = UserSerializer(self.user, context=self.context).data
        return data
