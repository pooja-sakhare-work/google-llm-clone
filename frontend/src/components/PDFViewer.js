import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import './PDFViewer.css';

// Set up PDF.js worker using local file
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

const PDFViewer = ({ document, onPageChange, currentPage }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [pdfError, setPdfError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sync with external page changes (from citations)
  useEffect(() => {
    if (currentPage && currentPage !== pageNumber) {
      console.log('PDFViewer: Syncing to page', currentPage);
      setPageNumber(currentPage);
    }
  }, [currentPage, pageNumber]);

  const onDocumentLoadSuccess = ({ numPages }) => {
    console.log('PDF loaded successfully with', numPages, 'pages');
    setNumPages(numPages);
    setPdfError(null);
    setLoading(false);
  };

  const onDocumentLoadError = (error) => {
    console.error('PDF load error:', error);
    setPdfError(`Failed to load PDF: ${error.message || 'Unknown error'}`);
    setLoading(false);
  };

  const changePage = (offset) => {
    setPageNumber(prevPageNumber => {
      const newPageNumber = prevPageNumber + offset;
      if (onPageChange) {
        onPageChange(newPageNumber);
      }
      return newPageNumber;
    });
  };

  const previousPage = () => {
    changePage(-1);
  };

  const nextPage = () => {
    changePage(1);
  };

  const goToPage = (pageNum) => {
    setPageNumber(pageNum);
    if (onPageChange) {
      onPageChange(pageNum);
    }
  };

  const zoomIn = () => {
    setScale(prevScale => Math.min(prevScale + 0.2, 3.0));
  };

  const zoomOut = () => {
    setScale(prevScale => Math.max(prevScale - 0.2, 0.5));
  };

  const retryLoad = () => {
    setPdfError(null);
    setLoading(true);
  };

  // Use the CORS-enabled PDF serving endpoint
  const pdfUrl = `http://localhost:8001/api/serve-pdf/${document.id}/`;
  console.log('Loading PDF from URL:', pdfUrl);

  if (pdfError) {
    return (
      <div className="pdf-viewer">
        <div className="error">
          <p>{pdfError}</p>
          <p>PDF URL: {pdfUrl}</p>
          <button onClick={retryLoad} className="control-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pdf-viewer">
      <div className="pdf-controls">
        <div className="page-controls">
          <button 
            onClick={previousPage} 
            disabled={pageNumber <= 1}
            className="control-btn"
          >
            ‹ Previous
          </button>
          <span className="page-info">
            Page {pageNumber} of {numPages}
          </span>
          <button 
            onClick={nextPage} 
            disabled={pageNumber >= numPages}
            className="control-btn"
          >
            Next ›
          </button>
        </div>
        
        <div className="zoom-controls">
          <button onClick={zoomOut} className="control-btn">-</button>
          <span className="zoom-level">{Math.round(scale * 100)}%</span>
          <button onClick={zoomIn} className="control-btn">+</button>
        </div>
      </div>

      <div className="pdf-container">
        {loading && <div className="loading">Loading PDF...</div>}
        <Document
          file={pdfUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={<div className="loading">Loading PDF...</div>}
          error={<div className="error">Error loading PDF</div>}
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            loading={<div className="loading">Loading page...</div>}
            error={<div className="error">Error loading page</div>}
          />
        </Document>
      </div>

      {numPages > 1 && (
        <div className="page-thumbnails">
          {Array.from(new Array(numPages), (el, index) => (
            <button
              key={`page_${index + 1}`}
              onClick={() => goToPage(index + 1)}
              className={`page-thumbnail ${pageNumber === index + 1 ? 'active' : ''}`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default PDFViewer; 