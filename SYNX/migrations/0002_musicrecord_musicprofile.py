# Generated for SYNX music collections.
import django.core.validators
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("app_name", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="MusicProfile",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("display_name", models.CharField(blank=True, max_length=100)),
                ("personality", models.CharField(blank=True, max_length=120)),
                ("favorite_artists", models.TextField(blank=True, help_text="Separate artists with commas.")),
                ("favorite_genres", models.TextField(blank=True, help_text="Separate genres with commas.")),
                ("favorite_moods", models.TextField(blank=True, help_text="Separate moods with commas.")),
                ("favorite_era", models.CharField(blank=True, max_length=80)),
                ("description", models.TextField(blank=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("user", models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name="music_profile", to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name="MusicRecord",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("song_title", models.CharField(max_length=200)),
                ("artist_name", models.CharField(max_length=160)),
                ("genre", models.CharField(max_length=80)),
                ("mood", models.CharField(max_length=80)),
                ("release_year", models.PositiveSmallIntegerField(blank=True, null=True, validators=[django.core.validators.MinValueValidator(1000), django.core.validators.MaxValueValidator(2100)])),
                ("favorite_era", models.CharField(blank=True, max_length=80)),
                ("rating", models.PositiveSmallIntegerField(validators=[django.core.validators.MinValueValidator(1), django.core.validators.MaxValueValidator(5)])),
                ("description", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("user", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name="music_records", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
    ]
