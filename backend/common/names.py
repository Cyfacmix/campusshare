def display_name(user):
    """Nom affichable d'un utilisateur (ou mention si le compte est supprime)."""
    if user is None:
        return "Utilisateur supprimé"
    return user.get_full_name().strip() or user.email.split("@")[0]
