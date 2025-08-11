from django.db import models
import os
import uuid

def pdf_upload_path(instance, filename):
    """Generate unique path for PDF uploads"""
    ext = filename.split('.')[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    return os.path.join('pdfs', filename)

class PDFDocument(models.Model):
    """Model to store uploaded PDF documents"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to=pdf_upload_path)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    page_count = models.IntegerField(default=0)
    text_content = models.TextField(blank=True)  # Store extracted text for searching
    
    def __str__(self):
        return self.title
    
    def filename(self):
        return os.path.basename(self.file.name)

class ChatMessage(models.Model):
    """Model to store chat messages"""
    MESSAGE_TYPES = [
        ('user', 'User'),
        ('assistant', 'Assistant'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    document = models.ForeignKey(PDFDocument, on_delete=models.CASCADE, related_name='messages')
    message_type = models.CharField(max_length=10, choices=MESSAGE_TYPES)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    citations = models.JSONField(default=list, blank=True)  # Store page references
    
    class Meta:
        ordering = ['timestamp']
    
    def __str__(self):
        return f"{self.message_type}: {self.content[:50]}..."
