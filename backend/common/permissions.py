from rest_framework.permissions import SAFE_METHODS, BasePermission


def is_role(user, *roles):
    """Vrai si l'utilisateur est connecte et possede l'un des roles (ou est superuser)."""
    return bool(
        user and user.is_authenticated and (user.is_superuser or user.role in roles)
    )


class IsAdminRole(BasePermission):
    def has_permission(self, request, view):
        return is_role(request.user, "admin")


class IsAdminOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        return request.method in SAFE_METHODS or is_role(request.user, "admin")


class IsModerator(BasePermission):
    def has_permission(self, request, view):
        return is_role(request.user, "moderateur", "admin")


class IsTeacher(BasePermission):
    def has_permission(self, request, view):
        return is_role(request.user, "enseignant", "admin")


class IsOwnerOrModerator(BasePermission):
    """Modification/suppression reservee au proprietaire ou a la moderation."""

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        owner_id = getattr(obj, "auteur_id", None)
        if owner_id is None:
            owner_id = getattr(obj, "user_id", None)
        if request.user.is_authenticated and owner_id == request.user.id:
            return True
        return is_role(request.user, "moderateur", "admin")
