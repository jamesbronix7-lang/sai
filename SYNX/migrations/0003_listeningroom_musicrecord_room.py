import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("app_name", "0002_musicrecord_musicprofile"),
    ]

    operations = [
        migrations.CreateModel(
            name="ListeningRoom",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("room_name", models.CharField(max_length=100)),
                ("atmosphere", models.CharField(blank=True, max_length=80)),
                ("description", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("host", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="listening_room", to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.AddField(
            model_name="musicrecord",
            name="room",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name="music_records", to="app_name.listeningroom"),
        ),
    ]
