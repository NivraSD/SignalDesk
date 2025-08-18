import React, { useState, useRef, useEffect } from 'react';

const NivChat = ({ messages, loading, onSendMessage }) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedValue = inputValue.trim();
    if (trimmedValue && !loading) {
      onSendMessage(trimmedValue);
      setInputValue('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const autoResize = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  };

  useEffect(() => {
    autoResize();
  }, [inputValue]);

  const chatStyles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      height: '100%'
    },
    messagesContainer: {
      flex: 1,
      overflowY: 'auto',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    },
    message: {
      display: 'flex',
      flexDirection: 'column',
      gap: '4px'
    },
    userMessage: {
      alignSelf: 'flex-end',
      maxWidth: '80%'
    },
    assistantMessage: {
      alignSelf: 'flex-start',
      maxWidth: '80%'
    },
    messageContent: {
      padding: '12px 16px',
      borderRadius: '12px',
      lineHeight: '1.5',
      fontSize: '14px'
    },
    userContent: {
      backgroundColor: '#3b82f6',
      color: 'white'
    },
    assistantContent: {
      backgroundColor: 'white',
      color: '#1e293b',
      border: '1px solid #e2e8f0'
    },
    inputContainer: {
      padding: '16px',
      borderTop: '1px solid #e2e8f0',
      backgroundColor: 'white'
    },
    form: {
      display: 'flex',
      gap: '8px',
      alignItems: 'flex-end'
    },
    textarea: {
      flex: 1,
      padding: '12px 16px',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      fontSize: '14px',
      lineHeight: '1.5',
      resize: 'none',
      minHeight: '44px',
      maxHeight: '120px',
      fontFamily: 'inherit',
      outline: 'none',
      transition: 'border-color 0.2s ease'
    },
    button: {
      padding: '12px 16px',
      backgroundColor: '#3b82f6',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      minWidth: '60px',
      height: '44px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    buttonDisabled: {
      backgroundColor: '#94a3b8',
      cursor: 'not-allowed'
    },
    loadingDots: {
      display: 'flex',
      gap: '2px'
    },
    dot: {
      width: '4px',
      height: '4px',
      borderRadius: '50%',
      backgroundColor: '#64748b',
      animation: 'pulse 1.5s ease-in-out infinite'
    },
    timestamp: {
      fontSize: '12px',
      color: '#64748b',
      marginTop: '4px'
    },
    userTimestamp: {
      textAlign: 'right'
    },
    assistantTimestamp: {
      textAlign: 'left'
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const LoadingMessage = () => (
    <div style={{ ...chatStyles.message, ...chatStyles.assistantMessage }}>
      <div style={{ ...chatStyles.messageContent, ...chatStyles.assistantContent }}>
        <div style={chatStyles.loadingDots}>
          <div style={{ ...chatStyles.dot, animationDelay: '0s' }}></div>
          <div style={{ ...chatStyles.dot, animationDelay: '0.2s' }}></div>
          <div style={{ ...chatStyles.dot, animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={chatStyles.container}>
      <style>
        {`
          @keyframes pulse {
            0%, 80%, 100% {
              opacity: 0.3;
            }
            40% {
              opacity: 1;
            }
          }
          
          .niv-chat-textarea:focus {
            border-color: #3b82f6 !important;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          }
          
          .niv-chat-button:hover:not(:disabled) {
            background-color: #2563eb !important;
          }
          
          .niv-chat-button:active:not(:disabled) {
            transform: translateY(1px);
          }
        `}
      </style>

      <div style={chatStyles.messagesContainer}>
        {messages.map((message, index) => (
          <div
            key={index}
            style={{
              ...chatStyles.message,
              ...(message.role === 'user' ? chatStyles.userMessage : chatStyles.assistantMessage)
            }}
          >
            <div
              style={{
                ...chatStyles.messageContent,
                ...(message.role === 'user' ? chatStyles.userContent : chatStyles.assistantContent)
              }}
            >
              {message.content}
            </div>
            <div
              style={{
                ...chatStyles.timestamp,
                ...(message.role === 'user' ? chatStyles.userTimestamp : chatStyles.assistantTimestamp)
              }}
            >
              {formatTime(message.timestamp || Date.now())}
            </div>
          </div>
        ))}
        
        {loading && <LoadingMessage />}
        <div ref={messagesEndRef} />
      </div>

      <div style={chatStyles.inputContainer}>
        <form onSubmit={handleSubmit} style={chatStyles.form}>
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me to create media lists, press releases, strategic plans, or anything else..."
            style={chatStyles.textarea}
            className="niv-chat-textarea"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || loading}
            style={{
              ...chatStyles.button,
              ...((!inputValue.trim() || loading) ? chatStyles.buttonDisabled : {})
            }}
            className="niv-chat-button"
          >
            {loading ? '...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default NivChat;