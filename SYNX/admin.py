from django.contrib import admin
from .models import ListeningRoom, LostFound, MusicProfile, MusicRecord


@admin.register(MusicRecord)
class MusicRecordAdmin(admin.ModelAdmin):
    list_display = ("song_title", "artist_name", "genre", "mood", "rating", "user", "created_at")
    list_filter = ("genre", "mood", "rating")
    search_fields = ("song_title", "artist_name")


@admin.register(MusicProfile)
class MusicProfileAdmin(admin.ModelAdmin):
    list_display = ("display_name", "personality", "user", "updated_at")
    search_fields = ("display_name", "personality", "favorite_artists")


admin.site.register(LostFound)
admin.site.register(ListeningRoom)
