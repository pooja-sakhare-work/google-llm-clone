import React from 'react';
import './DocumentList.css';

const DocumentList = ({ documents, currentDocument, onSelectDocument }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="document-list">
      <h3>Uploaded Documents</h3>
      {documents.length === 0 ? (
        <div className="no-documents">
          <p>No documents uploaded yet</p>
        </div>
      ) : (
        <div className="documents">
          {documents.map((document) => (
            <div
              key={document.id}
              className={`document-item ${currentDocument?.id === document.id ? 'active' : ''}`}
              onClick={() => onSelectDocument(document)}
            >
              <div className="document-icon">📄</div>
              <div className="document-info">
                <h4 className="document-title">{document.title}</h4>
                <p className="document-meta">
                  {document.page_count} pages • {formatDate(document.uploaded_at)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentList; 