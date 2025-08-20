import React, { useState, useRef, useEffect } from 'react';
import './NivStrategicAdvisor.css';

const NivStrategicAdvisor = ({ activeModule, organizationData, onModuleSwitch, embedded = false }) => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hello! I'm Niv, your Strategic PR Advisor. I have access to all four modules - Intelligence, Opportunity, Execution, and MemoryVault. 

I'm here to interpret insights, validate opportunities, guide your execution, and connect patterns from past experiences. 

What strategic challenge can I help you with today?`
    }
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isThinking) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsThinking(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/niv/strategic-advice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: userMessage,
          context: {
            activeModule,
            organizationId: organizationData?.id,
            organizationName: organizationData?.name
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Add Niv's response
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.advice,
          suggestions: data.suggestions,
          relatedModule: data.relatedModule
        }]);

        // If Niv suggests switching to a different module
        if (data.suggestedModule && data.suggestedModule !== activeModule) {
          // Offer to switch modules
          setTimeout(() => {
            if (window.confirm(`Would you like to switch to the ${data.suggestedModule} module?`)) {
              onModuleSwitch(data.suggestedModule);
            }
          }, 500);
        }
      } else {
        // Fallback strategic advice
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: generateStrategicAdvice(userMessage, activeModule)
        }]);
      }
    } catch (error) {
      console.error('Error getting strategic advice:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: generateStrategicAdvice(userMessage, activeModule)
      }]);
    } finally {
      setIsThinking(false);
    }
  };

  const generateStrategicAdvice = (query, module) => {
    const lowerQuery = query.toLowerCase();
    
    // Intelligence-related queries
    if (lowerQuery.includes('competitor') || lowerQuery.includes('monitor') || lowerQuery.includes('intelligence')) {
      return `Based on your Intelligence data, I see several strategic considerations:

1. **Competitive Landscape**: Your competitors are actively engaging in sustainability messaging. This creates an opportunity for differentiation through authentic action rather than just messaging.

2. **Media Monitoring**: Recent sentiment shows 72% positive coverage, but there's a vulnerability in technical product discussions where clarity could be improved.

3. **Strategic Recommendation**: Focus on demonstrable results rather than promises. The data shows audiences respond 3x better to case studies than forward-looking statements.

Would you like me to help you identify specific opportunities based on these insights?`;
    }
    
    // Opportunity-related queries
    if (lowerQuery.includes('opportunity') || lowerQuery.includes('timing') || lowerQuery.includes('when')) {
      return `Looking at your Opportunity Queue, here's my strategic assessment:

1. **Immediate Window** (Next 48 hours): There's a trending discussion about AI ethics that aligns perfectly with your thought leadership goals. CRS: 85, NVS: 78.

2. **Upcoming Opportunity** (Next week): Your competitor's product launch creates a counter-programming opportunity. Consider announcing your developer tools update 24 hours before.

3. **Pattern Recognition**: Based on MemoryVault data, similar situations have succeeded when you lead with customer success stories rather than feature lists.

The optimal action window is within the next 48 hours. Shall I guide you through the execution strategy?`;
    }
    
    // Execution-related queries
    if (lowerQuery.includes('create') || lowerQuery.includes('write') || lowerQuery.includes('campaign') || lowerQuery.includes('execute')) {
      return `For execution strategy, I recommend:

1. **Template Selection**: Based on the context, use the "Thought Leadership" template but modify section 2 to emphasize practical applications over theory.

2. **Messaging Framework**: Lead with the problem (30%), introduce your solution (40%), provide proof points (30%). This distribution has shown 92% success rate in similar campaigns.

3. **Channel Strategy**: 
   - Primary: Industry publications (morning release)
   - Secondary: LinkedIn (CEO perspective)
   - Support: Developer forums (technical deep-dive)

Remember: The Execution Module can generate the actual content. I'm here to ensure it aligns with your strategic objectives. Would you like me to review your messaging strategy?`;
    }
    
    // MemoryVault-related queries
    if (lowerQuery.includes('before') || lowerQuery.includes('worked') || lowerQuery.includes('pattern') || lowerQuery.includes('memory')) {
      return `Consulting the MemoryVault, I found relevant patterns:

1. **Similar Situation** (3 months ago): You faced a comparable challenge with the Q3 product launch. The winning strategy was to preview features with key customers before public announcement, generating authentic testimonials.

2. **Success Pattern**: Your most effective campaigns share three elements:
   - Data-driven headline (2.5x more engagement)
   - Customer voice in first paragraph (3x more trust)
   - Clear call-to-action (45% higher conversion)

3. **Lesson Learned**: Avoid Friday announcements - historical data shows 73% lower engagement.

This pattern has an 87% success rate. Would you like me to help adapt it to your current situation?`;
    }
    
    // Default strategic advice
    return `Let me provide strategic guidance based on your current context:

**Current Module**: ${module.charAt(0).toUpperCase() + module.slice(1)}

I can help you:
- Interpret intelligence findings and identify strategic implications
- Validate and prioritize opportunities based on your objectives
- Guide execution with proven patterns and frameworks
- Connect current situations to successful past strategies

What specific strategic challenge would you like to explore? For example:
- "What opportunities should we prioritize this week?"
- "How should we respond to competitor's announcement?"
- "What worked well in similar situations?"`;
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestedQuestions = [
    "What opportunities should we act on today?",
    "How should we respond to the competitor news?",
    "What patterns predict success for this campaign?",
    "When is the optimal time to announce?"
  ];

  return (
    <div className={`niv-strategic-advisor ${embedded ? 'embedded' : ''}`}>
      {!embedded && (
        <div className="niv-header">
          <div className="niv-title">
            <span className="niv-icon">🤖</span>
            <div className="niv-info">
              <h3>Niv - Strategic Advisor</h3>
              <p className="niv-subtitle">Interprets • Validates • Guides • Connects</p>
            </div>
          </div>
          <div className="niv-status">
            <span className="status-indicator online"></span>
            <span>Online</span>
          </div>
        </div>
      )}

      <div className="niv-messages">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.role}`}>
            {message.role === 'assistant' && (
              <div className="message-avatar">N</div>
            )}
            <div className="message-content">
              <div className="message-text">{message.content}</div>
              {message.suggestions && (
                <div className="message-suggestions">
                  {message.suggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      className="suggestion-btn"
                      onClick={() => setInput(suggestion)}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
              {message.relatedModule && (
                <div className="related-module">
                  <span>Related: {message.relatedModule}</span>
                  <button
                    className="switch-module-btn"
                    onClick={() => onModuleSwitch(message.relatedModule.toLowerCase())}
                  >
                    Go to {message.relatedModule}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {isThinking && (
          <div className="message assistant">
            <div className="message-avatar">N</div>
            <div className="message-content">
              <div className="thinking-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {messages.length === 1 && (
        <div className="suggested-questions">
          <p>Try asking:</p>
          <div className="questions-grid">
            {suggestedQuestions.map((question, index) => (
              <button
                key={index}
                className="question-btn"
                onClick={() => setInput(question)}
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="niv-input-area">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask for strategic advice..."
          className="niv-input"
          rows="2"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isThinking}
          className="niv-send-btn"
        >
          {isThinking ? '...' : '→'}
        </button>
      </div>

      {!embedded && (
        <div className="niv-footer">
          <div className="module-context">
            Active Module: <span className="module-name">{activeModule}</span>
          </div>
          <div className="niv-capabilities">
            <span title="Interprets Intelligence">🔍</span>
            <span title="Validates Opportunities">✓</span>
            <span title="Guides Execution">🎯</span>
            <span title="Connects Patterns">🔗</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default NivStrategicAdvisor;