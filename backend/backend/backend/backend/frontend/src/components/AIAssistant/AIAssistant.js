import React, { useState, useRef, useEffect } from 'react';
import api from '../../services/api';

const AIAssistant = ({ projectId }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat history on mount
  useEffect(() => {
    loadChatHistory();
  }, [projectId]);

  const loadChatHistory = async () => {
    try {
      const response = await api.assistant.getHistory(projectId);
      if (response.success && response.history) {
        setMessages(response.history.map(msg => ({
          role: msg.role,
          content: msg.content
        })));
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    
    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      // Call the actual API
      const response = await api.assistant.chat(userMessage, projectId);
      
      if (response.success && response.response) {
        // Add AI response
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: response.response 
        }]);

        // Handle any suggested actions
        if (response.actions && response.actions.length > 0) {
          handleActions(response.actions);
        }
      } else {
        throw new Error('Invalid response from API');
      }
    } catch (error) {
      console.error('Chat error:', error);
      // Add error message
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'I apologize, but I encountered an error. Please try again or check your connection.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActions = (actions) => {
    // Handle suggested actions from the AI
    // For now, just log them - later we can add buttons or triggers
    console.log('Suggested actions:', actions);
  };

  const clearChat = async () => {
    try {
      await api.assistant.clearHistory(projectId);
      setMessages([]);
    } catch (error) {
      console.error('Failed to clear chat:', error);
    }
  };

  return (
    <div className="flex flex-col h-[400px]">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 rounded-t-lg">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <p className="text-lg font-medium">Welcome to SignalDesk AI Assistant!</p>
            <p className="text-sm mt-2">I can help you with:</p>
            <ul className="text-sm mt-2 space-y-1">
              <li>• Creating press releases and content</li>
              <li>• Managing PR campaigns</li>
              <li>• Media list building</li>
              <li>• Crisis management</li>
              <li>• Sentiment analysis</li>
            </ul>
            <p className="text-sm mt-4">How can I assist you today?</p>
          </div>
        )}
        
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 px-4 py-2 rounded-lg">
              <p className="text-sm text-gray-500">Thinking...</p>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t bg-white rounded-b-lg">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything about PR..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
          {messages.length > 0 && (
            <button
              type="button"
              onClick={clearChat}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
              title="Clear chat"
            >
              Clear
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default AIAssistant;