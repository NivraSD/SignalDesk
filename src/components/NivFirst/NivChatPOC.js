import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, CheckCircle } from 'lucide-react';
import supabaseApiService from '../../services/supabaseApiService';
import nivStateManager from './NivStateManager';

// PROOF OF CONCEPT: Clean Chat Component
// This component ONLY handles chat - no work item UI

const NivChatPOC = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [workItemsCreated, setWorkItemsCreated] = useState(0);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Subscribe to chat updates from state manager
    const unsubscribe = nivStateManager.subscribe('chat', (event) => {
      if (event.type === 'message_added') {
        setMessages(nivStateManager.getChatMessages());
      } else if (event.type === 'work_items_created') {
        // Show notification that work items were created
        setWorkItemsCreated(prev => prev + event.count);
        setTimeout(() => setWorkItemsCreated(0), 3000);
      }
    });

    // Load initial messages
    setMessages(nivStateManager.getChatMessages());

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isProcessing) return;

    const userMessage = input.trim();
    setInput('');
    setIsProcessing(true);

    // Add user message to state
    nivStateManager.addChatMessage({
      type: 'user',
      content: userMessage
    });

    try {
      // Call Niv API - Niv does all the intelligent generation
      const response = await supabaseApiService.callNivChat({
        message: userMessage,
        messages: messages.map(m => ({
          type: m.type,
          content: m.content
        })),
        context: { hasConversationHistory: messages.length > 0 }
      });

      // DEBUG: Log what we're getting from Niv
      console.log('🔍 Raw Niv response:', response);
      console.log('🔍 Response has workItems?', response.workItems ? 'YES' : 'NO');
      if (response.workItems) {
        console.log('🔍 Work items content:', response.workItems);
        response.workItems.forEach((item, i) => {
          console.log(`  Item ${i}:`, {
            type: item.type,
            title: item.title,
            hasContent: !!item.generatedContent,
            contentKeys: item.generatedContent ? Object.keys(item.generatedContent) : []
          });
        });
      }
      console.log('🔍 Response has artifacts?', response.artifacts ? 'YES' : 'NO');
      console.log('🔍 Response has workCards?', response.workCards ? 'YES' : 'NO');

      // Let state manager handle the response
      // This cleanly separates chat from work items
      const result = nivStateManager.handleNivResponse(response);
      
      console.log('Niv response handled:', result);

    } catch (error) {
      console.error('Error calling Niv:', error);
      nivStateManager.addChatMessage({
        type: 'error',
        content: 'Sorry, I encountered an error. Please try again.'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: '#0a0a0f',
      color: '#e8e8e8'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        borderBottom: '1px solid rgba(139, 92, 246, 0.2)',
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1))'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Sparkles size={24} color="#8b5cf6" />
          <div>
            <h3 style={{ margin: 0, fontSize: '18px' }}>Niv - Strategic PR Assistant</h3>
            <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>
              Proof of Concept - Clean Architecture
            </p>
          </div>
        </div>
      </div>

      {/* Work Items Created Notification */}
      {workItemsCreated > 0 && (
        <div style={{
          padding: '12px 20px',
          background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.1))',
          borderBottom: '1px solid rgba(16, 185, 129, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          animation: 'slideDown 0.3s ease'
        }}>
          <CheckCircle size={16} color="#10b981" />
          <span style={{ color: '#10b981', fontSize: '14px' }}>
            {workItemsCreated} work {workItemsCreated === 1 ? 'item' : 'items'} created - check the sidebar
          </span>
        </div>
      )}

      {/* Messages Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              display: 'flex',
              justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start'
            }}
          >
            <div style={{
              maxWidth: '70%',
              padding: '12px 16px',
              borderRadius: '12px',
              background: message.type === 'user' 
                ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                : message.type === 'error'
                ? 'rgba(239, 68, 68, 0.2)'
                : 'rgba(30, 30, 45, 0.8)',
              color: message.type === 'user' ? '#ffffff' : '#e8e8e8',
              border: message.type === 'assistant' 
                ? '1px solid rgba(139, 92, 246, 0.2)' 
                : 'none'
            }}>
              {message.content}
            </div>
          </div>
        ))}
        
        {isProcessing && (
          <div style={{
            display: 'flex',
            justifyContent: 'flex-start'
          }}>
            <div style={{
              padding: '12px 16px',
              borderRadius: '12px',
              background: 'rgba(30, 30, 45, 0.8)',
              border: '1px solid rgba(139, 92, 246, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <span style={{ color: '#9ca3af', fontSize: '14px' }}>
                Niv is thinking...
              </span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{
        padding: '20px',
        borderTop: '1px solid rgba(139, 92, 246, 0.2)',
        background: 'rgba(30, 30, 45, 0.4)'
      }}>
        <div style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center'
        }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask Niv to create materials..."
            style={{
              flex: 1,
              padding: '12px 16px',
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '8px',
              color: '#e8e8e8',
              fontSize: '14px',
              outline: 'none'
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isProcessing}
            style={{
              padding: '12px 20px',
              background: isProcessing 
                ? 'rgba(139, 92, 246, 0.3)'
                : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            <Send size={16} />
            Send
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideDown {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .typing-indicator {
          display: flex;
          gap: 4px;
        }

        .typing-indicator span {
          width: 8px;
          height: 8px;
          background: #8b5cf6;
          border-radius: 50%;
          animation: typing 1.4s ease-in-out infinite;
        }

        .typing-indicator span:nth-child(2) {
          animation-delay: 0.2s;
        }

        .typing-indicator span:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes typing {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.5;
          }
          30% {
            transform: translateY(-10px);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default NivChatPOC;