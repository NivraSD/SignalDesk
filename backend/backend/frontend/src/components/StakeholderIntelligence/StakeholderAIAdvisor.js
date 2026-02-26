import React, { useState } from 'react';
import { MessageCircle, HelpCircle, Send, X, Sparkles, Users, TrendingUp, Shield, AlertCircle } from 'lucide-react';
import API_BASE_URL from '../../config/api';

const StakeholderAIAdvisor = ({ stakeholderStrategy, priorityStakeholders, intelligenceFindings, context = 'insights', onSourceSuggestion }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Get stakeholder names for context
  const getStakeholderNames = () => {
    if (!stakeholderStrategy?.stakeholderGroups) return [];
    return priorityStakeholders
      .map(id => {
        const stakeholder = stakeholderStrategy.stakeholderGroups.find(s => String(s.id || s.name) === id);
        return stakeholder?.name;
      })
      .filter(Boolean);
  };

  // Example prompts based on context
  const getContextualPrompts = () => {
    const stakeholderNames = getStakeholderNames();
    const prompts = [];

    if (context === 'source_configuration') {
      // Source configuration specific prompts
      if (stakeholderNames.length > 0) {
        prompts.push({
          icon: Users,
          text: `Find sources for ${stakeholderNames[0]}`,
          query: `What are the best sources to monitor for information about ${stakeholderNames[0]}?`
        });
      }

      prompts.push({
        icon: Sparkles,
        text: "Suggest industry sources",
        query: `What are the key industry publications and sources for ${stakeholderStrategy?.profile?.industry || 'our industry'}?`
      });

      prompts.push({
        icon: Shield,
        text: "Find regulatory sources",
        query: "What regulatory and compliance sources should we monitor?"
      });

      prompts.push({
        icon: TrendingUp,
        text: "Social media monitoring",
        query: "Which social media platforms and accounts should we monitor for stakeholder insights?"
      });
    } else {
      // Strategic insights prompts
      if (stakeholderNames.length > 0) {
        prompts.push({
          icon: Users,
          text: `How should I engage with ${stakeholderNames[0]}?`,
          query: `What's the best approach to engage with ${stakeholderNames[0]} given their influence and current sentiment?`
        });
      }

      if (intelligenceFindings.length > 0) {
        prompts.push({
          icon: TrendingUp,
          text: "What are the sentiment trends?",
          query: "Based on recent intelligence, what are the key sentiment trends across our stakeholders?"
        });
      }

      prompts.push({
        icon: Shield,
        text: "Identify relationship risks",
        query: "What are the main risks in our stakeholder relationships and how can we mitigate them?"
      });

      prompts.push({
        icon: Sparkles,
        text: "Suggest quick wins",
        query: "What are some quick wins to improve stakeholder relationships?"
      });
    }

    return prompts;
  };

  const sendMessage = async (message) => {
    if (!message.trim()) return;

    const userMessage = { role: 'user', content: message };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Build context for the AI
      const contextData = {
        company: stakeholderStrategy?.profile?.company || 'the organization',
        industry: stakeholderStrategy?.profile?.industry || 'your industry',
        stakeholders: stakeholderStrategy?.stakeholderGroups || [],
        priorityStakeholders: getStakeholderNames(),
        recentFindings: intelligenceFindings.slice(0, 5),
        overview: stakeholderStrategy?.overview,
        stakeholderTopics: stakeholderStrategy?.stakeholderGroups?.reduce((acc, s) => {
          if (s.topics && s.topics.length > 0) {
            acc[s.name] = {
              topics: s.topics,
              goals: s.goals,
              fears: s.fears
            };
          }
          return acc;
        }, {})
      };

      const response = await fetch(`${API_BASE_URL}/ai/advisor`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: message,
          context: {
            ...contextData,
            type: context === 'source_configuration' ? 'source_discovery' : 'stakeholder_advice',
            stakeholders: stakeholderStrategy?.stakeholderGroups || []
          },
          conversationHistory: messages
        })
      });

      if (!response.ok) throw new Error('Failed to get AI response');
      
      const data = await response.json();
      const aiMessage = { 
        role: 'assistant', 
        content: data.response || data.message || 'I can help you understand and manage your stakeholder relationships. What would you like to know?'
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // Check if response contains source suggestions
      if (context === 'source_configuration' && data.sources && onSourceSuggestion) {
        // Parse source suggestions from AI response
        data.sources.forEach(source => {
          if (source.stakeholderId && source.url && source.name) {
            onSourceSuggestion({
              stakeholderId: source.stakeholderId,
              source: {
                name: source.name,
                url: source.url,
                type: source.type || 'web',
                extractionMethod: source.extractionMethod || 'auto'
              }
            });
          }
        });
      }
    } catch (error) {
      console.error('AI Advisor error:', error);
      // Provide helpful fallback response
      const fallbackMessage = {
        role: 'assistant',
        content: generateFallbackResponse(message)
      };
      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateFallbackResponse = (query) => {
    const lowerQuery = query.toLowerCase();
    
    if (context === 'source_configuration') {
      // Source configuration specific fallback responses
      if (lowerQuery.includes('source') || lowerQuery.includes('monitor')) {
        const stakeholderName = stakeholderStrategy?.stakeholderGroups?.[0]?.name || 'stakeholders';
        const topics = stakeholderStrategy?.stakeholderGroups?.[0]?.topics || [];
        const topicsText = topics.length > 0 ? `\n\nBased on your tracked topics (${topics.join(', ')}), I recommend setting up alerts and filters for these specific keywords when configuring sources.` : '';
        
        return `Here are some recommended sources for monitoring ${stakeholderName}:${topicsText}\n\n**News & Media**\n• Google News alerts for "${stakeholderName}"\n• Industry-specific publications\n• Press release distribution sites\n\n**Social Media**\n• Twitter/X - Follow relevant accounts and hashtags\n• LinkedIn - Company pages and industry groups\n• Reddit - Relevant subreddits\n\n**Regulatory & Official**\n• Government websites and databases\n• SEC filings (for public companies)\n• Industry regulatory bodies\n\n**Analytics & Data**\n• Google Trends for keyword tracking\n• Industry research reports\n• Market intelligence platforms\n\nWould you like specific recommendations for any of these categories?`;
      }
      
      if (lowerQuery.includes('industry') || lowerQuery.includes('publication')) {
        return `Key industry sources to monitor:\n\n**General Business**\n• Wall Street Journal\n• Financial Times\n• Bloomberg\n• Reuters\n\n**Tech Industry**\n• TechCrunch\n• The Verge\n• Wired\n• VentureBeat\n\n**Trade Publications**\n• Industry-specific magazines\n• Professional association publications\n• Conference proceedings\n\n**Research**\n• Gartner reports\n• Forrester research\n• Industry analyst firms\n\nI can provide more specific recommendations based on your industry.`;
      }
      
      return `I can help you find the best sources to monitor your stakeholders. Try asking:\n\n• "What sources should I monitor for [stakeholder name]?"\n• "Find social media accounts for [industry] influencers"\n• "What regulatory sources are important for [industry]?"\n• "Suggest news sources for tracking [topic]"\n\nWhat would you like to explore?`;
    } else {
      // Original fallback responses for strategic insights
      if (lowerQuery.includes('engage') || lowerQuery.includes('approach')) {
        return "To effectively engage stakeholders:\n\n1. **Understand their priorities** - Review their concerns and interests\n2. **Tailor your communication** - Use language and channels they prefer\n3. **Show value alignment** - Demonstrate how your goals align with theirs\n4. **Be consistent** - Regular, transparent communication builds trust\n5. **Listen actively** - Their feedback is crucial for relationship building";
      }
      
      if (lowerQuery.includes('sentiment') || lowerQuery.includes('trend')) {
        return "To analyze stakeholder sentiment:\n\n1. **Monitor consistently** - Track mentions and feedback regularly\n2. **Look for patterns** - Identify recurring themes in their communications\n3. **Compare over time** - Note changes in tone or engagement levels\n4. **Segment by group** - Different stakeholders may have different concerns\n5. **Act on insights** - Use sentiment data to adjust your approach";
      }
      
      if (lowerQuery.includes('risk')) {
        return "Key stakeholder relationship risks to monitor:\n\n1. **Communication gaps** - Lack of regular engagement\n2. **Misaligned expectations** - Different views on outcomes\n3. **Influence changes** - Shifts in stakeholder power dynamics\n4. **Negative sentiment** - Growing dissatisfaction or concerns\n5. **Competitive pressure** - Other organizations courting your stakeholders";
      }
      
      if (lowerQuery.includes('quick win') || lowerQuery.includes('improve')) {
        return "Quick wins for stakeholder relationships:\n\n1. **Personal outreach** - Send personalized updates to key stakeholders\n2. **Acknowledge concerns** - Show you're listening to their feedback\n3. **Share successes** - Celebrate wins that benefit them\n4. **Simplify processes** - Make it easier for them to work with you\n5. **Surprise positively** - Exceed expectations in small ways";
      }
      
      return "I can help you with:\n\n• Stakeholder engagement strategies\n• Sentiment analysis and trends\n• Relationship risk management\n• Communication planning\n• Influence mapping\n\nWhat specific aspect of stakeholder management would you like to explore?";
    }
  };

  if (!isOpen) {
    return (
      <div style={{
        background: 'white',
        borderRadius: '0.75rem',
        padding: '1.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        cursor: 'pointer',
        transition: 'all 0.2s'
      }}
      onClick={() => setIsOpen(true)}
      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <MessageCircle style={{ width: '24px', height: '24px', color: 'white' }} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600', color: '#111827' }}>
              AI Stakeholder Advisor
            </h3>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
              {context === 'source_configuration' ? 
                'Get help finding sources to monitor your stakeholders' :
                'Get insights and advice on managing stakeholder relationships'}
            </p>
          </div>
          <Sparkles style={{ width: '20px', height: '20px', color: '#9333ea' }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: 'white',
      borderRadius: '0.75rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      height: '450px',
      gridColumn: 'span 2',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative'
    }}>
      {/* Header */}
      <div style={{
        padding: '1rem 1.5rem',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MessageCircle style={{ width: '20px', height: '20px', color: '#9333ea' }} />
          <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600', color: '#111827' }}>
            AI Stakeholder Advisor
          </h3>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setShowHelp(!showHelp)}
            style={{
              padding: '0.5rem',
              background: showHelp ? '#f3f4f6' : 'transparent',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <HelpCircle style={{ width: '18px', height: '18px', color: '#9333ea' }} />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            style={{
              padding: '0.5rem',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#6b7280'
            }}
          >
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>
      </div>

      {/* Help Menu */}
      {showHelp && (
        <div style={{
          position: 'absolute',
          top: '60px',
          right: '1rem',
          width: '320px',
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '0.5rem',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          padding: '1rem',
          zIndex: 50
        }}>
          <div style={{ marginBottom: '0.75rem' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: '600' }}>
              Suggested Questions:
            </h4>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {getContextualPrompts().map((prompt, idx) => {
              const Icon = prompt.icon;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    setInputValue(prompt.query);
                    setShowHelp(false);
                  }}
                  style={{
                    padding: '0.75rem',
                    background: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f3f4f6';
                    e.currentTarget.style.borderColor = '#9333ea';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f9fafb';
                    e.currentTarget.style.borderColor = '#e5e7eb';
                  }}
                >
                  <Icon style={{ width: '16px', height: '16px', color: '#9333ea', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.875rem', color: '#374151' }}>{prompt.text}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        {messages.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '2rem',
            color: '#9ca3af'
          }}>
            <Sparkles style={{ width: '48px', height: '48px', margin: '0 auto 1rem', opacity: 0.5 }} />
            <p style={{ marginBottom: '1rem' }}>
              {context === 'source_configuration' ?
                "I'm here to help you find the best sources to monitor your stakeholders." :
                "I'm here to help you understand and improve stakeholder relationships."}
            </p>
            <p style={{ fontSize: '0.875rem' }}>
              {context === 'source_configuration' ?
                "Ask me about news sources, social media accounts, or industry publications." :
                "Ask me about engagement strategies, sentiment analysis, or relationship risks."}
            </p>
          </div>
        ) : (
          messages.map((message, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start'
              }}
            >
              <div style={{
                maxWidth: '80%',
                padding: '0.75rem 1rem',
                background: message.role === 'user' ? '#9333ea' : '#f3f4f6',
                color: message.role === 'user' ? 'white' : '#111827',
                borderRadius: '0.75rem',
                fontSize: '0.875rem',
                lineHeight: '1.5',
                whiteSpace: 'pre-wrap'
              }}>
                {message.content}
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{
              padding: '0.75rem 1rem',
              background: '#f3f4f6',
              borderRadius: '0.75rem',
              display: 'flex',
              gap: '0.25rem'
            }}>
              <div style={{ width: '8px', height: '8px', background: '#9333ea', borderRadius: '50%', animation: 'pulse 1.5s infinite' }} />
              <div style={{ width: '8px', height: '8px', background: '#9333ea', borderRadius: '50%', animation: 'pulse 1.5s infinite 0.2s' }} />
              <div style={{ width: '8px', height: '8px', background: '#9333ea', borderRadius: '50%', animation: 'pulse 1.5s infinite 0.4s' }} />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{
        padding: '1rem 1.5rem',
        borderTop: '1px solid #e5e7eb',
        display: 'flex',
        gap: '0.75rem',
        alignItems: 'flex-end'
      }}>
        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendMessage(inputValue);
            }
          }}
          placeholder={context === 'source_configuration' ? 
            "Ask about sources to monitor..." : 
            "Ask about stakeholder strategies..."}
          style={{
            flex: 1,
            padding: '0.75rem',
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            outline: 'none',
            transition: 'border-color 0.2s',
            resize: 'none',
            minHeight: '42px',
            maxHeight: '120px',
            overflowY: 'auto',
            fontFamily: 'inherit',
            lineHeight: '1.5'
          }}
          rows={1}
          onInput={(e) => {
            e.target.style.height = 'auto';
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
          }}
          onFocus={(e) => e.target.style.borderColor = '#9333ea'}
          onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
        />
        <button
          onClick={() => sendMessage(inputValue)}
          disabled={!inputValue.trim() || isLoading}
          style={{
            padding: '0.75rem 1rem',
            background: inputValue.trim() && !isLoading ? '#9333ea' : '#e5e7eb',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: inputValue.trim() && !isLoading ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s',
            flexShrink: 0
          }}
        >
          <Send style={{ width: '16px', height: '16px' }} />
        </button>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default StakeholderAIAdvisor;