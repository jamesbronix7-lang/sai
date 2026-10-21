from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from django.urls import reverse

from .models import ListeningRoom, MusicRecord


class SynxViewsTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="listener",
            email="listener@example.com",
            password="test-password",
        )
        self.room = ListeningRoom.objects.create(host=self.user, room_name="The After Hours Room")
        self.client.force_login(self.user)

    def make_record(self, **overrides):
        values = {
            "user": self.user,
            "room": self.room,
            "song_title": "Night Drive",
            "artist_name": "The Signals",
            "genre": "Post-punk",
            "mood": "Restless",
            "rating": 5,
        }
        values.update(overrides)
        return MusicRecord.objects.create(**values)

    def test_anonymous_visitors_must_sign_in(self):
        self.client.logout()
        login_response = self.client.get(reverse("login"))
        self.assertEqual(login_response.status_code, 200)
        self.assertContains(login_response, "Come on")
        self.assertContains(login_response, "auth-login-layout")
        self.assertContains(login_response, "auth-art-login")

        response = self.client.get(reverse("dashboard"))

        self.assertRedirects(response, f"{reverse('login')}?next={reverse('dashboard')}")

    def test_login_returns_host_to_their_listening_room(self):
        self.client.logout()
        response = self.client.post(
            reverse("login"),
            {"username": "listener", "password": "test-password"},
        )

        self.assertRedirects(response, reverse("dashboard"))
        self.assertContains(self.client.get(reverse("dashboard")), "THE AFTER HOURS ROOM")

    def test_not_found_screen_renders_fuzzy_text_artwork(self):
        response = self.client.get(reverse("not_found"))

        self.assertEqual(response.status_code, 404)
        self.assertContains(response, "data-fuzzy-text=\"404\"", status_code=404)
        self.assertContains(response, "SIGNAL LOST", status_code=404)

    @override_settings(DEBUG=False)
    def test_unknown_url_uses_custom_fuzzy_404_handler(self):
        response = self.client.get("/there-is-no-record/")

        self.assertEqual(response.status_code, 404)
        self.assertContains(response, "data-fuzzy-text=\"404\"", status_code=404)

    def test_dashboard_uses_host_room_and_database_statistics(self):
        self.make_record()
        self.make_record(song_title="Queue Test Track", artist_name="Queue Artist")
        response = self.client.get(reverse("dashboard"))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "THE AFTER HOURS ROOM")
        self.assertContains(response, "room-featured-listeners")
        self.assertContains(response, "ROTATION / 03 SEC")
        self.assertContains(response, "nux")
        self.assertContains(response, reverse("listener_profile", args=["nux"]))
        self.assertContains(response, 'id="room-chat-replay"')
        self.assertContains(response, 'id="room-chat-messages"')
        self.assertContains(response, 'id="chat-loop-toggle"')
        self.assertContains(response, "the sticker has lore now")
        self.assertContains(response, "room-chat-replay.js")
        self.assertNotContains(response, "Open room chat")
        self.assertNotContains(response, "CRT SIGNAL / SYNX-01")
        self.assertContains(response, "synx-text-loop")
        self.assertContains(response, "shuffle-heading")
        self.assertContains(response, "data-border-glow")
        self.assertContains(response, 'aria-controls="primary-nav"')
        self.assertContains(response, 'href="/library/"')
        self.assertContains(response, "menu-item-number")
        self.assertContains(response, "Night Drive")
        self.assertContains(response, "5.0")
        self.assertContains(response, "HOSTED BY LISTENER")
        self.assertContains(response, "24K Magic")
        self.assertContains(response, "Psychosocial")
        self.assertContains(response, "Faded")
        self.assertContains(response, "Room queue")
        self.assertContains(response, "Add music")
        self.assertContains(response, "THE LISTENER IN THIS ROOM")
        self.assertContains(response, "Auto-advances through the queue")
        self.assertContains(response, "data-queue-item")
        self.assertContains(response, "data-queue-progress")
        self.assertContains(response, "data-queue-toggle")
        self.assertContains(response, "room-queue.js")
        self.assertContains(response, "Queue Test Track")
        self.assertContains(response, "Uptown Funk")
        self.assertContains(response, "Smooth Criminal")
        self.assertContains(response, "Iam Tan")
        self.assertContains(response, "100% UNDEAD")
        self.assertLess(response.content.index(b'class="listening-room'), response.content.index(b'id="room-listener-player"'))
        self.assertLess(response.content.index(b'id="room-listener-player"'), response.content.index(b'id="room-chat"'))

    def test_listener_profile_shows_signature_song_and_recommendations(self):
        response = self.client.get(reverse("listener_profile", args=["iam-tan"]))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Roblox Songs")
        self.assertContains(response, "Faded")
        self.assertContains(response, "Alan Walker")
        self.assertContains(response, "Raining Tacos")

    def test_standalone_chat_page_is_removed(self):
        response = self.client.get("/all-chats/")

        self.assertEqual(response.status_code, 404)

    def test_create_edit_and_delete_music_records(self):
        payload = {
            "song_title": "Glass House",
            "artist_name": "Morrow",
            "genre": "Alternative",
            "mood": "Introspective",
            "release_year": "2004",
            "favorite_era": "Early 2000s",
            "rating": "4",
            "description": "A song for the long way home.",
        }
        response = self.client.post(reverse("music_create"), payload)
        record = MusicRecord.objects.get(song_title="Glass House")
        self.assertEqual(record.user, self.user)
        self.assertEqual(record.room, self.room)
        self.assertRedirects(response, reverse("music_detail", args=[record.pk]))

        response = self.client.post(
            reverse("music_edit", args=[record.pk]),
            {**payload, "song_title": "Glass House (Live)", "rating": "5"},
        )
        record.refresh_from_db()
        self.assertRedirects(response, reverse("music_detail", args=[record.pk]))
        self.assertEqual(record.song_title, "Glass House (Live)")
        self.assertEqual(record.rating, 5)

        response = self.client.post(reverse("music_delete", args=[record.pk]))
        self.assertRedirects(response, reverse("music_library"))
        self.assertFalse(MusicRecord.objects.filter(pk=record.pk).exists())

    def test_library_search_and_views_are_scoped_to_host_room(self):
        own_record = self.make_record(song_title="Red Horizon", genre="Rock", rating=4)
        other_user = get_user_model().objects.create_user(username="another-listener", password="test-password")
        other_room = ListeningRoom.objects.create(host=other_user, room_name="Private Room")
        other_record = self.make_record(
            user=other_user,
            room=other_room,
            song_title="Blue Hour",
            artist_name="South",
            genre="Jazz",
            mood="Calm",
            rating=2,
        )

        response = self.client.get(
            reverse("music_library"),
            {"q": "Red", "genre": "Rock", "rating": "4"},
        )
        self.assertContains(response, own_record.song_title)
        self.assertNotContains(response, other_record.song_title)
        self.assertEqual(self.client.get(reverse("music_detail", args=[other_record.pk])).status_code, 404)

    def test_invalid_rating_is_rejected(self):
        response = self.client.post(
            reverse("music_create"),
            {
                "song_title": "Out of Range",
                "artist_name": "Artist",
                "genre": "Rock",
                "mood": "Loud",
                "rating": "6",
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertFalse(MusicRecord.objects.filter(song_title="Out of Range").exists())

    def test_listening_room_chat_api_supports_create_read_update_and_confirmed_delete(self):
        endpoint = reverse("listening_room_api")
        payload = {
            "song_title": "Velvet Static",
            "artist_name": "The Late Hours",
            "genre": "Dream pop",
            "mood": "Hazy",
            "release_year": "2019",
            "favorite_era": "After midnight",
            "rating": "5",
            "description": "For the long ride home.",
        }

        response = self.client.post(
            endpoint,
            data={"action": "create", "record": payload},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 201)
        record_id = response.json()["record"]["id"]
        record = MusicRecord.objects.get(pk=record_id)
        self.assertEqual(record.room, self.room)

        response = self.client.get(endpoint)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["records"][0]["song_title"], "Velvet Static")
        self.assertEqual(response.json()["summary"]["total_songs"], 1)
        self.assertEqual(response.json()["summary"]["total_artists"], 1)

        response = self.client.post(
            endpoint,
            data={
                "action": "update",
                "id": record_id,
                "record": {**payload, "song_title": "Velvet Static (Remix)", "rating": "4"},
            },
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["record"]["song_title"], "Velvet Static (Remix)")
        self.assertEqual(response.json()["summary"]["average_rating"], 4.0)

        response = self.client.post(
            endpoint,
            data={"action": "delete", "id": record_id},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertTrue(MusicRecord.objects.filter(pk=record_id).exists())

        response = self.client.post(
            endpoint,
            data={"action": "delete", "id": record_id, "confirmed": True},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertFalse(MusicRecord.objects.filter(pk=record_id).exists())

    def test_listening_room_chat_api_respects_record_ownership_and_validation(self):
        other_user = get_user_model().objects.create_user(username="other", password="test-password")
        other_room = ListeningRoom.objects.create(host=other_user, room_name="Not This Room")
        other_record = self.make_record(user=other_user, room=other_room, song_title="Private Signal")
        endpoint = reverse("listening_room_api")

        response = self.client.post(
            endpoint,
            data={"action": "update", "id": other_record.pk, "record": {}},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 404)

        response = self.client.post(
            endpoint,
            data={
                "action": "create",
                "record": {
                    "song_title": "Bad Rating",
                    "artist_name": "Artist",
                    "genre": "Rock",
                    "mood": "Bright",
                    "rating": "8",
                },
            },
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertFalse(MusicRecord.objects.filter(song_title="Bad Rating").exists())

    def test_host_can_create_and_update_their_listening_room(self):
        response = self.client.post(
            reverse("room_setup"),
            {
                "room_name": "Velvet Listening Den",
                "atmosphere": "Lamplight and late records",
                "description": "A soft landing after midnight.",
            },
        )
        self.assertRedirects(response, reverse("dashboard"))
        self.room.refresh_from_db()
        self.assertEqual(self.room.room_name, "Velvet Listening Den")
        self.assertContains(self.client.get(reverse("dashboard")), "HOSTED BY LISTENER")

    def test_user_without_room_is_directed_to_room_setup(self):
        self.user.listening_room.delete()
        response = self.client.get(reverse("dashboard"))
        self.assertRedirects(response, reverse("room_setup"))

    def test_signup_creates_account_then_requires_hosted_room(self):
        self.client.logout()
        response = self.client.post(
            reverse("signup"),
            {
                "username": "new-host",
                "email": "host@example.com",
                "password1": "A-secure-listening-room-984!",
                "password2": "A-secure-listening-room-984!",
            },
        )
        self.assertRedirects(response, reverse("room_setup"))
        self.assertTrue(get_user_model().objects.filter(username="new-host").exists())
        self.assertEqual(str(self.client.session.get("_auth_user_id")), str(
            get_user_model().objects.get(username="new-host").pk
        ))

        response = self.client.get(reverse("dashboard"))
        self.assertRedirects(response, reverse("room_setup"))

    def test_profile_preferences_are_saved(self):
        response = self.client.post(
            reverse("music_profile"),
            {
                "display_name": "Avery",
                "personality": "The Night Listener",
                "favorite_artists": "Morrow, The Signals",
                "favorite_genres": "Alternative, Post-punk",
                "favorite_moods": "Restless, Dreamy",
                "favorite_era": "Late 90s",
                "description": "Music for the hours after midnight.",
            },
        )

        self.assertRedirects(response, reverse("music_profile"))
        self.assertContains(self.client.get(reverse("music_profile")), "The Night Listener")
