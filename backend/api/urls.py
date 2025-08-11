from django.urls import path
from . import views

urlpatterns = [
    path('upload/', views.PDFUploadView.as_view(), name='pdf-upload'),
    path('chat/', views.chat, name='chat'),
    path('documents/', views.document_list, name='document-list'),
    path('documents/<uuid:document_id>/', views.document_detail, name='document-detail'),
    path('documents/<uuid:document_id>/chat/', views.chat_history, name='chat-history'),
    path('serve-pdf/<uuid:document_id>/', views.serve_pdf, name='serve-pdf'),
] 