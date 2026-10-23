from rest_framework import serializers

MAX_SIZE = 20 * 1024 * 1024  # 20 Mo
OOXML_DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
OOXML_PPTX = "application/vnd.openxmlformats-officedocument.presentationml.presentation"

MIME_BY_EXT = {
    "pdf": {"application/pdf"},
    "docx": {OOXML_DOCX},
    "pptx": {OOXML_PPTX},
    "png": {"image/png"},
    "jpg": {"image/jpeg"},
    "jpeg": {"image/jpeg"},
    "zip": {"application/zip", "application/x-zip-compressed"},
}
MAGIC_BY_EXT = {
    "pdf": (b"%PDF-",),
    "png": (b"\x89PNG",),
    "jpg": (b"\xff\xd8",),
    "jpeg": (b"\xff\xd8",),
    "zip": (b"PK",),
    "docx": (b"PK",),
    "pptx": (b"PK",),
}


def validate_upload(f):
    """Controle extension, taille, type MIME declare et signature du fichier."""
    name = (f.name or "").replace("\\", "/").split("/")[-1]
    ext = name.rsplit(".", 1)[-1].lower() if "." in name else ""
    if ext not in MIME_BY_EXT:
        raise serializers.ValidationError(
            "Format non autorisé. Formats acceptés : pdf, docx, pptx, png, jpg, zip."
        )
    if f.size > MAX_SIZE:
        raise serializers.ValidationError("Le fichier dépasse 20 Mo.")
    declared = getattr(f, "content_type", None)
    if declared and declared != "application/octet-stream" and declared not in MIME_BY_EXT[ext]:
        raise serializers.ValidationError("Le type du fichier ne correspond pas à son extension.")
    head = f.read(8)
    f.seek(0)
    if not any(head.startswith(sig) for sig in MAGIC_BY_EXT[ext]):
        raise serializers.ValidationError("Le contenu du fichier ne correspond pas à son format.")
    return f
