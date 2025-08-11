import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './ChatInterface.css';

const ChatInterface = ({ document, onPageChange }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (document) {
      fetchChatHistory();
    }
  }, [document]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchChatHistory = async () => {
    try {
      const response = await axios.get(`http://localhost:8001/api/documents/${document.id}/chat/`);
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching chat history:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || loading) return;

    const userMessage = {
      id: Date.now(),
      message_type: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:8001/api/chat/', {
        message: inputMessage,
        document_id: document.id,
      });

      const assistantMessage = {
        ...response.data.response,
        citations: response.data.citations,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now(),
        message_type: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleCitationClick = (pageNumber) => {
    console.log('Citation clicked for page:', pageNumber);
    if (onPageChange) {
      onPageChange(pageNumber);
    }
  };

  const formatMessage = (message) => {
    if (message.message_type === 'assistant' && message.citations?.length > 0) {
      let content = message.content;
      
      // Replace page references with clickable buttons
      message.citations.forEach(citation => {
        const regex = new RegExp(`page\\s+${citation.page}`, 'gi');
        const buttonHtml = `<button class="citation-btn" data-page="${citation.page}">Page ${citation.page}</button>`;
        content = content.replace(regex, buttonHtml);
      });
      
      return { __html: content };
    }
    return null;
  };

  const handleCitationButtonClick = (e) => {
    if (e.target.classList.contains('citation-btn')) {
      const pageNumber = parseInt(e.target.getAttribute('data-page'));
      handleCitationClick(pageNumber);
    }
  };

  return (
    <div className="chat-interface">
      <div className="chat-header">
        <h3>Chat with AI</h3>
        <p>Ask questions about "{document.title}"</p>
      </div>

      <div className="chat-messages" onClick={handleCitationButtonClick}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${message.message_type}`}
          >
            <div className="message-content">
              {formatMessage(message) ? (
                <div dangerouslySetInnerHTML={formatMessage(message)} />
              ) : (
                <p>{message.content}</p>
              )}
              
              {message.message_type === 'assistant' && message.citations?.length > 0 && (
                <div className="citations">
                  <span className="citation-label">References:</span>
                  {message.citations.map((citation, index) => (
                    <button
                      key={index}
                      className="citation-button"
                      onClick={() => handleCitationClick(citation.page)}
                    >
                      {citation.text}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="message-timestamp">
              {new Date(message.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="message assistant">
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-form" onSubmit={sendMessage}>
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Ask a question about the document..."
          disabled={loading}
          className="chat-input"
        />
        <button
          type="submit"
          disabled={!inputMessage.trim() || loading}
          className="send-button"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatInterface; 