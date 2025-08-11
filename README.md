# Google LLM Clone

A PDF document analysis and chat application built with Django and React, featuring OpenAI GPT integration.

## Quick Start

### Prerequisites
- Python 3.8+
- Node.js 14+
- OpenAI API key

### Setup

1. **Get OpenAI API Key**
   - Visit: https://platform.openai.com/api-keys
   - Create account and get API key

2. **Backend Setup**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Configure Environment**
   ```bash
   # Create .env file in backend directory
   echo "OPENAI_API_KEY=your_api_key_here" > .env
   echo "DEBUG=True" >> .env
   ```

4. **Run Migrations**
   ```bash
   python manage.py migrate
   ```

5. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   ```

### Run the Application

1. **Start Backend**
   ```bash
   cd backend
   source venv/bin/activate
   python manage.py runserver 8001
   ```

2. **Start Frontend**
   ```bash
   cd frontend
   npm start
   ```

3. **Open Application**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:8001

## Usage

1. Upload a PDF document
2. View the PDF in the built-in viewer
3. Ask questions about the document in the chat interface
4. Get intelligent responses from OpenAI GPT

## Features

- PDF upload and viewing
- AI-powered chat interface
- Page citation navigation
- Responsive design 