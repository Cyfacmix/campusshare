from django.db import migrations, models


def copier_filiere(apps, schema_editor):
    Matiere = apps.get_model("academics", "Matiere")
    for m in Matiere.objects.all():
        m.filieres.add(m.filiere_id)


def restaurer_filiere(apps, schema_editor):
    Matiere = apps.get_model("academics", "Matiere")
    for m in Matiere.objects.all():
        premiere = m.filieres.order_by("nom").first()
        if premiere:
            m.filiere_id = premiere.pk
            m.save(update_fields=["filiere"])


class Migration(migrations.Migration):

    dependencies = [("academics", "0001_initial")]

    operations = [
        migrations.AddField(
            model_name="matiere",
            name="filieres",
            field=models.ManyToManyField(related_name="+", to="academics.filiere"),
        ),
        migrations.RunPython(copier_filiere, restaurer_filiere),
        migrations.RemoveConstraint(
            model_name="matiere", name="uniq_matiere_code_filiere"
        ),
        migrations.AlterModelOptions(
            name="matiere", options={"ordering": ["niveau", "nom"]}
        ),
        migrations.RemoveField(model_name="matiere", name="filiere"),
        migrations.AlterField(
            model_name="matiere",
            name="filieres",
            field=models.ManyToManyField(related_name="matieres", to="academics.filiere"),
        ),
    ]