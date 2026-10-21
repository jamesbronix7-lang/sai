from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class LostFound(models.Model):

    item_name = models.CharField(max_length=100)
    description = models.TextField()
    category = models.CharField(max_length=100)
    location = models.CharField(max_length=200)
    date = models.DateField()
    status = models.CharField(max_length=20)
    owner_name = models.CharField(max_length=100)

    def __str__(self):
        return self.item_name


class ListeningRoom(models.Model):
    host = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="listening_room",
    )
    room_name = models.CharField(max_length=100)
    atmosphere = models.CharField(max_length=80, blank=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.room_name} — hosted by {self.host}"


class MusicRecord(models.Model):
    room = models.ForeignKey(
        ListeningRoom,
        on_delete=models.CASCADE,
        related_name="music_records",
        null=True,
        blank=True,
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="music_records",
        null=True,
        blank=True,
    )
    song_title = models.CharField(max_length=200)
    artist_name = models.CharField(max_length=160)
    genre = models.CharField(max_length=80)
    mood = models.CharField(max_length=80)
    release_year = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1000), MaxValueValidator(2100)],
    )
    favorite_era = models.CharField(max_length=80, blank=True)
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.song_title} — {self.artist_name}"


class MusicProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="music_profile",
        null=True,
        blank=True,
    )
    display_name = models.CharField(max_length=100, blank=True)
    personality = models.CharField(max_length=120, blank=True)
    favorite_artists = models.TextField(blank=True, help_text="Separate artists with commas.")
    favorite_genres = models.TextField(blank=True, help_text="Separate genres with commas.")
    favorite_moods = models.TextField(blank=True, help_text="Separate moods with commas.")
    favorite_era = models.CharField(max_length=80, blank=True)
    description = models.TextField(blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.display_name or "Music profile"