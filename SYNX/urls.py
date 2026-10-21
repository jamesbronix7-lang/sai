from django.urls import path
from django.contrib.auth.views import LoginView, LogoutView
from . import views

urlpatterns = [
    path("login/", LoginView.as_view(template_name="InvApp/synx/login.html"), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("signup/", views.sign_up, name="signup"),
    path("404/", views.not_found, name="not_found"),
    path("room/setup/", views.room_setup, name="room_setup"),
    path("", views.dashboard, name="dashboard"),
    path("listeners/<slug:username>/", views.listener_profile, name="listener_profile"),
    path("library/", views.music_library, name="music_library"),
    path("music/add/", views.music_create, name="music_create"),
    path("music/<int:pk>/", views.music_detail, name="music_detail"),
    path("music/<int:pk>/edit/", views.music_edit, name="music_edit"),
    path("music/<int:pk>/delete/", views.music_delete, name="music_delete"),
    path("api/listening-room/music/", views.listening_room_api, name="listening_room_api"),
    path("profile/", views.music_profile, name="music_profile"),
    path("LostFound_list", views.LostFound, name="LostFound_list"),
]