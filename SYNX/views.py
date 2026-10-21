import json
from functools import wraps

from django.contrib import messages
from django.contrib.auth import login
from django.contrib.auth.decorators import login_required
from django.db.models import Avg, Count, Q
from django.core.paginator import Paginator
from django.http import HttpResponseNotFound, JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse
from django.views.decorators.http import require_http_methods

from .forms import ListeningRoomForm, MusicProfileForm, MusicRecordForm, SignUpForm
from .models import LostFound as LostFoundModel
from .models import ListeningRoom, MusicProfile, MusicRecord


LISTENING_ROOM_USERS = [
    {"slug": "nux", "image": "user1.png", "name": "nux", "message": "bro got left on read by a refrigerator 💀", "preset": "bursts", "preset_label": "Prismatic bursts", "foil": "#b1ff72"},
    {"slug": "kayn", "image": "user2.png", "name": "kayn", "message": "the sticker has lore now", "preset": "stars", "preset_label": "Starfield", "foil": "#f1f3d4"},
    {"slug": "bronix", "image": "user3.png", "name": "bronix", "message": "bro is beefing with an appliance", "preset": "shards", "preset_label": "Glass shards", "foil": "#b0c7a4"},
    {"slug": "dongkuy", "image": "user4.png", "name": "dongkuy", "message": "fish drink water through their gills", "preset": "cosmos", "preset_label": "Deep cosmos", "foil": "#85b4a2"},
    {"slug": "calvon", "image": "user5.png", "name": "calvon", "message": "the worm economy is collapsing", "preset": "rainbow", "preset_label": "Spectrum foil", "foil": "#d3e895"},
    {"slug": "ragedrix", "image": "user6.png", "name": "ragedrix", "message": "you cannot silence the truth", "preset": "swirl", "preset_label": "Liquid swirl", "foil": "#9bd982"},
    {"slug": "tatsuya", "image": "user7.png", "name": "tatsuya", "message": "i’m hiding all their left shoes", "preset": "glitter", "preset_label": "Micro glitter", "foil": "#d0d8bd"},
    {"slug": "zynxx", "image": "user8.png", "name": "zynxx", "message": "he found his way home", "preset": "gold", "preset_label": "Gilded foil", "foil": "#e5d99a"},
    {"slug": "uznav", "image": "user9.png", "name": "uznav", "message": "I KNOW WHERE YOU LIVE", "preset": "bursts-olive", "preset_label": "Olive burst", "foil": "#a8d8b5"},
    {"slug": "iam-tan", "image": "user10.png", "name": "Iam Tan", "message": "the server is planning psychological warfare", "preset": "stars-ice", "preset_label": "Ice constellation", "foil": "#b8c5ec"},
    {"slug": "guest", "image": "user11.png", "name": "guest", "message": "guyssss i think my fridge is sentient", "preset": "shards-copper", "preset_label": "Copper fracture", "foil": "#d7b9a6"},
    {"slug": "mico", "image": "user12.png", "name": "mico", "message": "no Wi-Fi no taxes", "preset": "cosmos-violet", "preset_label": "Violet nebula", "foil": "#b6a5dc"},
    {"slug": "rayn", "image": "user13.png", "name": "rayn", "message": "he found iron", "preset": "rainbow-rose", "preset_label": "Rose spectrum", "foil": "#e5a8bc"},
    {"slug": "fluximity", "image": "user14.png", "name": "fluximity", "message": "new here, what are we listening to?", "preset": "swirl-aqua", "preset_label": "Aqua current", "foil": "#a4dfdf"},
]

LISTENER_MUSIC_PROFILES = {
    "nux": {
        "favorite_song": "24K Magic",
        "favorite_artist": "Bruno Mars",
        "music_vibe": "Main character, party starter, effortlessly cool.",
        "music_style": "Popular & Fun",
        "recommendations": ["Uptown Funk", "Starboy", "FE!N", "Espresso", "Industry Baby", "Can't Hold Us", "Levitating"],
    },
    "kayn": {
        "favorite_song": "The Spectre",
        "favorite_artist": "Alan Walker",
        "music_vibe": "Futuristic, electronic, mysterious, gaming montage.",
        "music_style": "Techno & Alan Walker energy",
        "recommendations": ["Faded", "Alone", "Unity", "Cradles", "Heroes (we could be)", "Dreamer", "Animals", "Invincible", "Alone, Pt. II"],
    },
    "bronix": {
        "favorite_song": "Psychosocial",
        "favorite_artist": "Slipknot",
        "music_vibe": "Final boss, rage mode, headphones at maximum volume.",
        "music_style": "Heavy Metal",
        "recommendations": ["Duality", "The Devil in I", "Chop Suey!", "Master of Puppets", "Enter Sandman", "The Pretender", "Down with the Sickness", "Can You Feel My Heart", "Numb"],
    },
    "calvon": {
        "favorite_song": "Bohemian Rhapsody",
        "favorite_artist": "Queen",
        "music_vibe": "Timeless classics, vintage taste, old-school gentleman.",
        "music_style": "Old but Gold",
        "recommendations": ["Hotel California", "Everybody Wants to Rule the World", "Take On Me", "Careless Whisper", "Africa", "Dream On", "Never Gonna Give You Up", "Sweet Child o' Mine", "Billie Jean"],
    },
    "dongkuy": {
        "favorite_song": "Glimpse of Us",
        "favorite_artist": "Joji",
        "music_vibe": "I'm over her, followed by checking her profile again.",
        "music_style": "Relapse & Late-Night Regret",
        "recommendations": ["SLOW DANCING IN THE DARK", "Die For You", "Another Love", "The Night We Met", "Let Her Go", "Somebody Else", "Heather", "traitor", "I Love You So"],
    },
    "zynxx": {
        "favorite_song": "everything i wanted",
        "favorite_artist": "Billie Eilish",
        "music_vibe": "Quiet sadness, rainy windows, 2 AM thoughts.",
        "music_style": "Sad Songs",
        "recommendations": ["when the party's over", "Another Love", "Fourth of July", "Apocalypse", "Romantic Homicide", "idontwannabeyouanymore", "TV", "ceilings", "The Scientist"],
    },
    "rayn": {
        "favorite_song": "PONPONPON",
        "favorite_artist": "Kyary Pamyu Pamyu",
        "music_vibe": "Cute, colorful, bubbly, secretly chaotic.",
        "music_style": "Kawaii Music",
        "recommendations": ["Candy Candy", "World Is Mine", "Love Taste", "Cupid", "Tell Your World", "Idol", "Baby Sweet Berry Love", "Polyrhythm", "Doki Doki Morning"],
    },
    "uznav": {
        "favorite_song": "Unity",
        "favorite_artist": "TheFatRat",
        "music_vibe": "Ranked grind, boss battles, clutch plays.",
        "music_style": "Gaming Music",
        "recommendations": ["Monody", "Xenogenesis", "Invincible", "Spectre", "Legends Never Die", "Warriors", "Enemy", "Ezio's Family", "Megalovania"],
    },
    "ragedrix": {
        "favorite_song": "LEveL",
        "favorite_artist": "SawanoHiroyuki[nZk]",
        "music_vibe": "Solo Leveling, revenge arcs, shadow monarch aura.",
        "music_style": "Manhwa / Overpowered Protagonist",
        "recommendations": ["Dark Aria", "100% UNDEAD", "The Rumbling", "Ashes on The Fire", "YouSeeBIGGIRL/T:T", "Vogel im Käfig", "Inferno", "Kick Back", "SPECIALZ"],
    },
    "tatsuya": {
        "favorite_song": "Gurenge",
        "favorite_artist": "LiSA",
        "music_vibe": "Anime protagonist, dramatic entrances, final-episode energy.",
        "music_style": "Anime Openings",
        "recommendations": ["Blue Bird", "Silhouette", "Unravel", "Again", "Kaikai Kitan", "SPECIALZ", "A Cruel Angel's Thesis", "The Hero!!", "Peace Sign"],
    },
    "guest": {
        "favorite_song": "Hotel California",
        "favorite_artist": "Eagles",
        "music_vibe": "Mysterious veteran who has immaculate taste.",
        "music_style": "Old but Gold",
        "recommendations": ["Thriller", "September", "Take On Me", "Everybody Wants to Rule the World", "Smooth Criminal", "Never Gonna Give You Up", "Africa", "Dreams", "I Want to Know What Love Is", "Dancing Queen"],
    },
    "mico": {
        "favorite_song": "Nadarang",
        "favorite_artist": "Shanti Dope",
        "music_vibe": "Smooth confidence, OPM/Pinoy hip-hop, walking edit.",
        "music_style": "Pinoy Aura Farmer",
        "recommendations": ["Norem", "Marlboro Black", "Pauwi Nako", "Manila", "Uhaw", "PILLOWTALK", "Murder on My Mind", "AMAKABOGERA", "Gento"],
    },
    "fluximity": {
        "favorite_song": "Multo",
        "favorite_artist": "Cup of Joe",
        "music_vibe": "Filipino feels, indie nights, singing your heart out.",
        "music_style": "OPM Songs",
        "recommendations": ["Misteryoso", "Tingin", "Pasilyo", "Raining in Manila", "Mahika", "Sining", "Kathang Isip", "The Day You Said Goodnight", "214", "Migraine", "With a Smile"],
    },
    "iam-tan": {
        "favorite_song": "Faded",
        "favorite_artist": "Alan Walker",
        "music_vibe": "47 games open, three hours in an obby, no intention of logging off.",
        "music_style": "Roblox Songs",
        "recommendations": ["It's Raining Tacos", "Tension", "Monody", "Life in an Elevator", "The Spectre", "Megalovania", "Invincible"],
    },
}


def _listeners_with_music_profiles():
    return [
        {**listener, **LISTENER_MUSIC_PROFILES[listener["slug"]]}
        for listener in LISTENING_ROOM_USERS
    ]


ROOM_CHAT_MESSAGES = [
    {"name": "nux", "image": "user1.png", "slug": "nux", "text": "the sticker has lore now", "side": "incoming", "time": "10:12 PM"},
    {"name": "kayn", "image": "user2.png", "slug": "kayn", "text": "bro got left on read by a refrigerator 💀", "side": "outgoing", "time": "10:12 PM"},
    {"name": "bronix", "image": "user3.png", "slug": "bronix", "text": "bro is beefing with an appliance", "side": "incoming", "time": "10:13 PM"},
    {"name": "dongkuy", "image": "user4.png", "slug": "dongkuy", "text": "fish drink water through their gills", "side": "outgoing", "time": "10:13 PM"},
    {"name": "calvon", "image": "user5.png", "slug": "calvon", "text": "the worm economy is collapsing", "side": "incoming", "time": "10:14 PM"},
    {"name": "ragedrix", "image": "user6.png", "slug": "ragedrix", "text": "you cannot silence the truth", "side": "outgoing", "time": "10:14 PM"},
    {"name": "tatsuya", "image": "user7.png", "slug": "tatsuya", "text": "i’m hiding all their left shoes", "side": "incoming", "time": "10:15 PM"},
    {"name": "zynxx", "image": "user8.png", "slug": "zynxx", "text": "he found his way home", "side": "outgoing", "time": "10:15 PM"},
    {"name": "uznav", "image": "user9.png", "slug": "uznav", "text": "I KNOW WHERE YOU LIVE", "side": "incoming", "time": "10:16 PM"},
    {"name": "Iam Tan", "image": "user10.png", "slug": "iam-tan", "text": "the server is planning psychological warfare", "side": "outgoing", "time": "10:16 PM"},
    {"name": "guest", "image": "user11.png", "slug": "guest", "text": "guyssss i think my fridge is sentient", "side": "incoming", "time": "10:17 PM"},
    {"name": "mico", "image": "user12.png", "slug": "mico", "text": "no Wi-Fi no taxes", "side": "outgoing", "time": "10:17 PM"},
    {"name": "rayn", "image": "user13.png", "slug": "rayn", "text": "he found iron", "side": "incoming", "time": "10:18 PM"},
    {"name": "fluximity", "image": "user14.png", "slug": "fluximity", "text": "new here, what are we listening to?", "side": "outgoing", "time": "10:19 PM"},
]


def _owner_filter(request):
    return {"user": request.user, "room": request.user.listening_room}


def _room_for(request):
    try:
        return request.user.listening_room
    except ListeningRoom.DoesNotExist:
        return None


def host_room_required(view):
    @wraps(view)
    @login_required
    def wrapped(request, *args, **kwargs):
        if _room_for(request) is None:
            return redirect("room_setup")
        return view(request, *args, **kwargs)

    return wrapped


def _profile_for(request):
    profile, _ = MusicProfile.objects.get_or_create(user=request.user)
    return profile


def sign_up(request):
    if request.user.is_authenticated:
        return redirect("dashboard")
    if request.method == "POST":
        form = SignUpForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            messages.success(request, "Welcome to SYNX. Let's make a room that sounds like you.")
            return redirect("room_setup")
    else:
        form = SignUpForm()
    return render(request, "InvApp/synx/signup.html", {"form": form})


def not_found(request, exception=None):
    return HttpResponseNotFound(render(request, "InvApp/synx/404.html"))


@login_required
def room_setup(request):
    room = _room_for(request)
    if request.method == "POST":
        form = ListeningRoomForm(request.POST, instance=room)
        if form.is_valid():
            hosted_room = form.save(commit=False)
            hosted_room.host = request.user
            hosted_room.save()
            MusicRecord.objects.filter(user=request.user, room__isnull=True).update(room=hosted_room)
            messages.success(request, f"“{hosted_room.room_name}” is ready. You’re the host.")
            return redirect("dashboard")
    else:
        form = ListeningRoomForm(instance=room)
    return render(
        request,
        "InvApp/synx/room_setup.html",
        {"form": form, "room": room, "is_edit": room is not None},
    )


@login_required
def dashboard(request):
    room = _room_for(request)
    if room is None:
        return redirect("room_setup")
    records = MusicRecord.objects.filter(**_owner_filter(request))
    profile = _profile_for(request)
    stats = records.aggregate(average_rating=Avg("rating"))
    favorite_genres = (
        records.values("genre")
        .annotate(total=Count("id"))
        .order_by("-total", "genre")[:5]
    )
    favorite_moods = (
        records.values("mood")
        .annotate(total=Count("id"))
        .order_by("-total", "mood")[:5]
    )
    other_users = _listeners_with_music_profiles()
    listener_picks = [
        {
            "listener": listener,
            "song_title": listener["favorite_song"],
            "artist_name": listener["favorite_artist"],
            "genre": listener["music_style"],
            "source_label": "SIGNATURE",
        }
        for listener in other_users
    ]
    listener_recommendations = [
        {
            "listener": listener,
            "song_title": song,
            "artist_name": listener["favorite_artist"],
            "genre": listener["music_style"],
            "source_label": "PICK",
        }
        for listener in other_users
        for song in listener["recommendations"]
    ]
    queue_tracks = [
        {
            "song_title": music.song_title,
            "artist_name": music.artist_name,
            "genre": music.genre,
            "source_label": "ROOM",
        }
        for music in records.order_by("created_at", "pk")
    ]
    queue_tracks.extend(listener_picks)
    queue_tracks.extend(listener_recommendations)
    context = {
        "total_songs": records.count(),
        "total_artists": records.values("artist_name").distinct().count(),
        "total_genres": records.values("genre").distinct().count(),
        "average_rating": stats["average_rating"],
        "recent_records": records[:5],
        "favorite_genres": favorite_genres,
        "favorite_moods": favorite_moods,
        "profile": profile,
        "room": room,
        "other_users": other_users,
        "queue_tracks": queue_tracks,
        "chat_messages": ROOM_CHAT_MESSAGES,
    }
    return render(request, "InvApp/synx/dashboard.html", context)


@login_required
def listener_profile(request, username):
    room = _room_for(request)
    if room is None:
        return redirect("room_setup")

    listeners = _listeners_with_music_profiles()
    listener = next((user for user in listeners if user["slug"] == username), None)
    if listener is None:
        return HttpResponseNotFound(render(request, "InvApp/synx/404.html"))
    listener_index = next(index for index, user in enumerate(listeners) if user["slug"] == username)
    previous_listener = listeners[(listener_index - 1) % len(listeners)]
    next_listener = listeners[(listener_index + 1) % len(listeners)]
    return render(
        request,
        "InvApp/synx/listener_profile.html",
        {
            "room": room,
            "listener": listener,
            "listener_count": len(listeners),
            "previous_listener": previous_listener,
            "next_listener": next_listener,
        },
    )


@host_room_required
def music_library(request):
    records = MusicRecord.objects.filter(**_owner_filter(request))
    search = request.GET.get("q", "").strip()
    genre = request.GET.get("genre", "").strip()
    mood = request.GET.get("mood", "").strip()
    artist = request.GET.get("artist", "").strip()
    rating = request.GET.get("rating", "").strip()
    sort = request.GET.get("sort", "recent")

    if search:
        records = records.filter(Q(song_title__icontains=search) | Q(artist_name__icontains=search))
    if genre:
        records = records.filter(genre=genre)
    if mood:
        records = records.filter(mood=mood)
    if artist:
        records = records.filter(artist_name__icontains=artist)
    if rating:
        if rating.isdigit() and 1 <= int(rating) <= 5:
            records = records.filter(rating=int(rating))
        else:
            rating = ""

    ordering = {
        "title": "song_title",
        "artist": "artist_name",
        "rating": "-rating",
        "recent": "-created_at",
    }
    if sort not in ordering:
        sort = "recent"
    records = records.order_by(ordering[sort], "pk")
    paginator = Paginator(records, 12)
    page_obj = paginator.get_page(request.GET.get("page"))
    query_params = request.GET.copy()
    query_params.pop("page", None)

    context = {
        "music_records": page_obj,
        "page_obj": page_obj,
        "querystring": query_params.urlencode(),
        "genres": MusicRecord.objects.filter(**_owner_filter(request)).values_list("genre", flat=True).distinct().order_by("genre"),
        "moods": MusicRecord.objects.filter(**_owner_filter(request)).values_list("mood", flat=True).distinct().order_by("mood"),
        "artists": MusicRecord.objects.filter(**_owner_filter(request)).values_list("artist_name", flat=True).distinct().order_by("artist_name"),
        "filters": {"q": search, "genre": genre, "mood": mood, "artist": artist, "rating": rating, "sort": sort},
    }
    return render(request, "InvApp/synx/library.html", context)


@host_room_required
def music_create(request):
    if request.method == "POST":
        form = MusicRecordForm(request.POST)
        if form.is_valid():
            record = form.save(commit=False)
            record.user = request.user
            record.room = request.user.listening_room
            record.save()
            messages.success(request, f"“{record.song_title}” is now in your collection.")
            return redirect("dashboard")
    else:
        form = MusicRecordForm()
    return render(request, "InvApp/synx/music_form.html", {"form": form, "is_edit": False})


@host_room_required
def music_detail(request, pk):
    record = get_object_or_404(MusicRecord, pk=pk, **_owner_filter(request))
    return render(request, "InvApp/synx/music_detail.html", {"music": record})


@host_room_required
def music_edit(request, pk):
    record = get_object_or_404(MusicRecord, pk=pk, **_owner_filter(request))
    if request.method == "POST":
        form = MusicRecordForm(request.POST, instance=record)
        if form.is_valid():
            form.save()
            messages.success(request, f"“{record.song_title}” has been updated.")
            return redirect("music_detail", pk=record.pk)
    else:
        form = MusicRecordForm(instance=record)
    return render(request, "InvApp/synx/music_form.html", {"form": form, "is_edit": True, "music": record})


@host_room_required
def music_delete(request, pk):
    record = get_object_or_404(MusicRecord, pk=pk, **_owner_filter(request))
    if request.method == "POST":
        title = record.song_title
        record.delete()
        messages.success(request, f"“{title}” has been removed from your collection.")
        return redirect("music_library")
    return render(request, "InvApp/synx/music_confirm_delete.html", {"music": record})


@host_room_required
def music_profile(request):
    profile = _profile_for(request)
    if request.method == "POST":
        form = MusicProfileForm(request.POST, instance=profile)
        if form.is_valid():
            form.save()
            messages.success(request, "Your music identity has been saved.")
            return redirect("music_profile")
    else:
        form = MusicProfileForm(instance=profile)
    records = MusicRecord.objects.filter(**_owner_filter(request))
    return render(
        request,
        "InvApp/synx/profile.html",
        {
            "form": form,
            "profile": profile,
            "favorite_artists": [artist.strip() for artist in profile.favorite_artists.split(",") if artist.strip()],
            "favorite_genres": [item.strip() for item in profile.favorite_genres.split(",") if item.strip()],
            "favorite_moods": [item.strip() for item in profile.favorite_moods.split(",") if item.strip()],
            "record_count": records.count(),
        },
    )


@require_http_methods(["GET", "POST"])
@host_room_required
def listening_room_api(request):
    records = MusicRecord.objects.filter(**_owner_filter(request))

    if request.method == "GET":
        return JsonResponse(
            {
                "records": [_record_payload(record) for record in records[:100]],
                "summary": _room_summary(request),
            }
        )

    try:
        payload = json.loads(request.body or "{}")
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse({"error": "The request body must contain valid JSON."}, status=400)
    if not isinstance(payload, dict):
        return JsonResponse({"error": "Send a JSON object with an action."}, status=400)

    action = payload.get("action")
    if action == "create":
        record_data = payload.get("record", {})
        if not isinstance(record_data, dict):
            return JsonResponse({"error": "Track details must be sent as an object."}, status=400)
        form = MusicRecordForm(record_data)
        if not form.is_valid():
            return JsonResponse({"errors": form.errors.get_json_data()}, status=400)
        record = form.save(commit=False)
        record.user = request.user
        record.room = request.user.listening_room
        record.save()
        return JsonResponse(
            {
                "message": f"“{record.song_title}” is on the shelf now.",
                "record": _record_payload(record),
                "summary": _room_summary(request),
            },
            status=201,
        )

    record_id = payload.get("id")
    if not isinstance(record_id, int) or isinstance(record_id, bool):
        return JsonResponse({"error": "Choose a track from your collection first."}, status=400)
    record = records.filter(pk=record_id).first()
    if record is None:
        return JsonResponse({"error": "That track is not in this listening room."}, status=404)

    if action == "update":
        record_data = payload.get("record", {})
        if not isinstance(record_data, dict):
            return JsonResponse({"error": "Track details must be sent as an object."}, status=400)
        form = MusicRecordForm(record_data, instance=record)
        if not form.is_valid():
            return JsonResponse({"errors": form.errors.get_json_data()}, status=400)
        record = form.save()
        return JsonResponse(
            {
                "message": f"“{record.song_title}” has been updated.",
                "record": _record_payload(record),
                "summary": _room_summary(request),
            }
        )
    if action == "delete":
        if payload.get("confirmed") is not True:
            return JsonResponse({"error": "Confirm before removing this track."}, status=400)
        title = record.song_title
        record.delete()
        return JsonResponse(
            {"message": f"“{title}” has been removed from the room.", "summary": _room_summary(request)}
        )
    return JsonResponse({"error": "Choose add, edit, or remove."}, status=400)


def _record_payload(record):
    return {
        "id": record.pk,
        "song_title": record.song_title,
        "artist_name": record.artist_name,
        "genre": record.genre,
        "mood": record.mood,
        "release_year": record.release_year or "",
        "favorite_era": record.favorite_era,
        "rating": record.rating,
        "description": record.description,
        "detail_url": reverse("music_detail", args=[record.pk]),
    }


def _room_summary(request):
    records = MusicRecord.objects.filter(**_owner_filter(request))
    summary = records.aggregate(average_rating=Avg("rating"))
    return {
        "total_songs": records.count(),
        "total_artists": records.values("artist_name").distinct().count(),
        "total_genres": records.values("genre").distinct().count(),
        "average_rating": summary["average_rating"],
        "recent_records": [_record_payload(record) for record in records[:5]],
    }


def LostFound(request):
    if not request.user.is_authenticated:
        return redirect("login")
    items = LostFoundModel.objects.all()
    return render(request, "InvApp/dashboard.html", {"LostFound": items})
