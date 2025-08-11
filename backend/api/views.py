import os
import uuid
from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse, FileResponse, Http404
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.views import View
from django.conf import settings
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import PDFDocument, ChatMessage
from .serializers import PDFDocumentSerializer, ChatMessageSerializer, ChatRequestSerializer
import PyPDF2
import io
from openai import OpenAI
from datetime import datetime

class PDFUploadView(View):
    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)

    def post(self, request):
        if 'file' not in request.FILES:
            return JsonResponse({'error': 'No file provided'}, status=400)
        
        file = request.FILES['file']
        if not file.name.endswith('.pdf'):
            return JsonResponse({'error': 'Only PDF files are allowed'}, status=400)
        
        try:
            # Read PDF content
            pdf_content = file.read()
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(pdf_content))
            
            # Extract text from all pages
            text_content = ""
            for page_num, page in enumerate(pdf_reader.pages):
                page_text = page.extract_text()
                text_content += f"--- page {page_num + 1} ---\n{page_text}\n"
            
            # Create document
            document = PDFDocument.objects.create(
                title=file.name,
                file=file,
                page_count=len(pdf_reader.pages),
                text_content=text_content
            )
            
            serializer = PDFDocumentSerializer(document)
            return JsonResponse(serializer.data, status=201)
            
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

@api_view(['POST'])
def chat(request):
    """Handle chat messages with OpenAI GPT"""
    serializer = ChatRequestSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    message = serializer.validated_data['message']
    document_id = serializer.validated_data['document_id']
    
    try:
        document = PDFDocument.objects.get(id=document_id)
    except PDFDocument.DoesNotExist:
        return Response({'error': 'Document not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Save user message
    user_message = ChatMessage.objects.create(
        document=document,
        message_type='user',
        content=message
    )
    
    # Generate AI response using OpenAI
    ai_response, citations = generate_openai_response(message, document)
    
    # Save AI response
    assistant_message = ChatMessage.objects.create(
        document=document,
        message_type='assistant',
        content=ai_response,
        citations=citations
    )
    
    return Response({
        'response': {
            'id': assistant_message.id,
            'message_type': 'assistant',
            'content': ai_response,
            'timestamp': assistant_message.timestamp.isoformat(),
            'citations': citations
        },
        'citations': citations
    })

def generate_openai_response(message, document):
    """Generate response using OpenAI GPT"""
    print(f"Generating OpenAI response for message: {message}")
    
    # Check if OpenAI API key is configured
    openai_api_key = os.getenv('OPENAI_API_KEY')
    if not openai_api_key:
        return "OpenAI API key not configured. Please set OPENAI_API_KEY in your environment.", []
    
    try:
        # Configure OpenAI client
        client = OpenAI(api_key=openai_api_key)
        
        # Prepare the context from the document
        doc_text = document.text_content[:4000]  # Limit context to avoid token limits
        
        # Create the prompt
        system_prompt = f"""You are an AI assistant helping users understand a PDF document. 
        The document is titled: "{document.title}"
        
        Here is the document content:
        {doc_text}
        
        Please provide helpful, accurate responses based on the document content. 
        When referencing specific information, mention the page number if available.
        Keep responses concise and relevant to the user's question."""
        
        # Make API call to OpenAI
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message}
            ],
            max_tokens=500,
            temperature=0.7
        )
        
        ai_response = response.choices[0].message.content
        
        # Extract citations from the response
        citations = extract_citations(ai_response)
        
        print(f"Generated OpenAI response: {ai_response[:100]}...")
        return ai_response, citations
        
    except Exception as e:
        print(f"OpenAI API error: {e}")
        return f"Sorry, I encountered an error while processing your request: {str(e)}", []

def extract_citations(text):
    """Extract page numbers from AI response"""
    citations = []
    import re
    
    # Look for page references in the text
    page_patterns = [
        r'page\s+(\d+)',
        r'Page\s+(\d+)',
        r'p\.\s*(\d+)',
        r'pg\.\s*(\d+)'
    ]
    
    for pattern in page_patterns:
        matches = re.findall(pattern, text)
        for match in matches:
            page_num = int(match)
            citations.append({
                'page': page_num,
                'text': f'Page {page_num}'
            })
    
    return citations

@api_view(['GET'])
def document_list(request):
    """Get list of all documents"""
    documents = PDFDocument.objects.all().order_by('-uploaded_at')
    serializer = PDFDocumentSerializer(documents, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def document_detail(request, document_id):
    """Get specific document details"""
    try:
        document = PDFDocument.objects.get(id=document_id)
        serializer = PDFDocumentSerializer(document)
        return Response(serializer.data)
    except PDFDocument.DoesNotExist:
        return Response({'error': 'Document not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
def chat_history(request, document_id):
    """Get chat history for a document"""
    try:
        document = PDFDocument.objects.get(id=document_id)
        messages = ChatMessage.objects.filter(document=document).order_by('timestamp')
        serializer = ChatMessageSerializer(messages, many=True)
        return Response(serializer.data)
    except PDFDocument.DoesNotExist:
        return Response({'error': 'Document not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
def serve_pdf(request, document_id):
    """Serve PDF file with CORS headers"""
    try:
        document = get_object_or_404(PDFDocument, id=document_id)
        file_path = os.path.join(settings.MEDIA_ROOT, str(document.file))
        
        if os.path.exists(file_path):
            response = FileResponse(open(file_path, 'rb'), content_type='application/pdf')
            response['Access-Control-Allow-Origin'] = '*'
            response['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
            response['Access-Control-Allow-Headers'] = '*'
            return response
        else:
            raise Http404("PDF file not found")
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_404_NOT_FOUND)
