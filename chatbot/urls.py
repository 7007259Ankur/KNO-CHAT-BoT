from django.urls import path
from . import views

urlpatterns = [
    path("upload/", views.upload_document),
    path("chat/", views.chat),
    path("history/", views.chat_history),
    path("documents/", views.list_documents),
]
