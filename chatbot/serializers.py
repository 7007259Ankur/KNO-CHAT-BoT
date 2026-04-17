from rest_framework import serializers
from .models import Document, ChatMessage


class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ["id", "original_name", "uploaded_at", "processed"]


class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ["id", "question", "answer", "sources", "created_at"]
