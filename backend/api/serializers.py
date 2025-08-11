from rest_framework import serializers
from .models import PDFDocument, ChatMessage

class PDFDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = PDFDocument
        fields = ['id', 'title', 'file', 'uploaded_at', 'page_count', 'filename']
        read_only_fields = ['id', 'uploaded_at', 'page_count']

class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ['id', 'document', 'message_type', 'content', 'timestamp', 'citations']
        read_only_fields = ['id', 'timestamp']

class ChatRequestSerializer(serializers.Serializer):
    message = serializers.CharField()
    document_id = serializers.UUIDField() 