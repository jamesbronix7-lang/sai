from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth import get_user_model

from .models import ListeningRoom, MusicProfile, MusicRecord


class SignUpForm(UserCreationForm):
    email = forms.EmailField(
        required=True,
        widget=forms.EmailInput(attrs={"autocomplete": "email", "placeholder": "you@example.com"}),
    )

    class Meta(UserCreationForm.Meta):
        model = get_user_model()
        fields = ("username", "email")

    def clean_email(self):
        email = self.cleaned_data["email"].strip()
        if get_user_model().objects.filter(email__iexact=email).exists():
            raise forms.ValidationError("An account with this email address already exists.")
        return email


class ListeningRoomForm(forms.ModelForm):
    class Meta:
        model = ListeningRoom
        fields = ["room_name", "atmosphere", "description"]
        labels = {
            "room_name": "Room name",
            "atmosphere": "The atmosphere",
            "description": "A note for your guests",
        }
        widgets = {
            "room_name": forms.TextInput(attrs={"placeholder": "e.g. The After Hours Room", "maxlength": 100}),
            "atmosphere": forms.TextInput(attrs={"placeholder": "e.g. Low lights, warm vinyl, no rush"}),
            "description": forms.Textarea(attrs={"rows": 3, "placeholder": "What should it feel like when someone steps inside?"}),
        }


class MusicRecordForm(forms.ModelForm):
    class Meta:
        model = MusicRecord
        fields = [
            "song_title",
            "artist_name",
            "genre",
            "mood",
            "release_year",
            "favorite_era",
            "rating",
            "description",
        ]
        widgets = {
            "song_title": forms.TextInput(attrs={"placeholder": "Track title"}),
            "artist_name": forms.TextInput(attrs={"placeholder": "Artist or band"}),
            "genre": forms.TextInput(attrs={"placeholder": "e.g. Alternative rock"}),
            "mood": forms.TextInput(attrs={"placeholder": "e.g. Restless"}),
            "release_year": forms.NumberInput(attrs={"placeholder": "e.g. 1998", "min": 1000, "max": 2100}),
            "favorite_era": forms.TextInput(attrs={"placeholder": "e.g. Late 90s"}),
            "rating": forms.Select(choices=[(value, f"{value} / 5") for value in range(1, 6)]),
            "description": forms.Textarea(attrs={"rows": 4, "placeholder": "What does this song mean to you?"}),
        }

    def clean_release_year(self):
        year = self.cleaned_data.get("release_year")
        if year and year > 2100:
            raise forms.ValidationError("Enter a valid release year.")
        return year


class MusicProfileForm(forms.ModelForm):
    class Meta:
        model = MusicProfile
        fields = [
            "display_name",
            "personality",
            "favorite_artists",
            "favorite_genres",
            "favorite_moods",
            "favorite_era",
            "description",
        ]
        widgets = {
            "display_name": forms.TextInput(attrs={"placeholder": "What should we call you?"}),
            "personality": forms.TextInput(attrs={"placeholder": "e.g. The Midnight Wanderer"}),
            "favorite_artists": forms.Textarea(attrs={"rows": 2, "placeholder": "Artist names, separated by commas"}),
            "favorite_genres": forms.Textarea(attrs={"rows": 2, "placeholder": "Genres, separated by commas"}),
            "favorite_moods": forms.Textarea(attrs={"rows": 2, "placeholder": "Moods, separated by commas"}),
            "favorite_era": forms.TextInput(attrs={"placeholder": "e.g. 90s alternative"}),
            "description": forms.Textarea(attrs={"rows": 4, "placeholder": "Describe the sound that feels like you."}),
        }
