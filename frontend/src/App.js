import React, { useState, useEffect } from 'react';
import './App.css';
import PDFUpload from './components/PDFUpload';
import PDFViewer from './components/PDFViewer';
import ChatInterface from './components/ChatInterface';
import DocumentList from './components/DocumentList';

function App() {
  const [currentDocument, setCurrentDocument] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await fetch('http://localhost:8001/api/documents/');
      const data = await response.json();
      setDocuments(data);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const handleDocumentUpload = async (document) => {
    setDocuments([document, ...documents]);
    setCurrentDocument(document);
    setCurrentPage(1);
  };

  const handleDocumentSelect = (document) => {
    setCurrentDocument(document);
    setCurrentPage(1);
  };

  const handlePageChange = (pageNumber) => {
    console.log('App: Page changed to', pageNumber);
    setCurrentPage(pageNumber);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Google LLM Clone</h1>
        <p>Upload PDFs and chat with AI about their content</p>
      </header>
      
      <main className="App-main">
        <div className="sidebar">
          <PDFUpload onUpload={handleDocumentUpload} />
          <DocumentList 
            documents={documents} 
            currentDocument={currentDocument}
            onSelectDocument={handleDocumentSelect}
          />
        </div>
        
        <div className="content">
          {currentDocument ? (
            <>
              <div className="pdf-section">
                <h2>{currentDocument.title}</h2>
                <PDFViewer 
                  document={currentDocument} 
                  onPageChange={handlePageChange}
                  currentPage={currentPage}
                />
              </div>
              <div className="chat-section">
                <ChatInterface 
                  document={currentDocument} 
                  onPageChange={handlePageChange}
                />
              </div>
            </>
          ) : (
            <div className="welcome-message">
              <h2>Welcome to Google LLM Clone</h2>
              <p>Upload a PDF document to get started!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
