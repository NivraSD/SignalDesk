import React, { useState, useRef, useEffect } from "react";
import { Bot, Sparkles, Target, TrendingUp, Eye, AlertTriangle, Send, HelpCircle } from "lucide-react";

const MonitoringStrategyChatbot = ({ onStrategyCreated }) => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      id: Date.now(),
      type: "ai",
      content: `👋 Welcome to your AI Monitoring Strategist!

I'm here to help you create intelligent monitoring strategies for any company, brand, or topic. I can analyze everything from Fortune 500 companies to startups and create comprehensive monitoring plans.

🎯 **What I can do for you:**
• Analyze companies and create monitoring profiles
• Suggest relevant keywords and sources  
• Identify risks and opportunities to watch
• Set up alert thresholds and review schedules
• Recommend competitive intelligence strategies

Just tell me what you want to monitor - it could be as simple as "Amazon", "my fintech startup", or "competitor analysis for Tesla" - and I'll build a complete strategy for you.

What would you like to start monitoring today?`,
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [isAIResponding, setIsAIResponding] = useState(false);
  const [showQueryHelp, setShowQueryHelp] = useState(false);
  const chatContainerRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isAIResponding) return;

    // Add user message to chat
    const userMessage = { 
      id: Date.now(), 
      type: "user", 
      content: input.trim(), 
      timestamp: new Date().toLocaleTimeString() 
    };
    setMessages((prev) => [...prev, userMessage]);
    const currentMessage = input.trim();
    setInput("");
    setIsAIResponding(true);

    try {
      const response = await fetch("http://localhost:5001/api/monitoring/chat-analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          prompt: buildStrategyPrompt(currentMessage, messages),
          userInput: currentMessage,
          context: messages.map(m => `${m.role}: ${m.content}`).join('\n'),
          currentProfile: null
        }),
      });

      const data = await response.json();
      
      if (data.success && data.analysis) {
        const aiMessage = {
          id: Date.now() + 1,
          type: "ai",
          content: data.analysis.content,
          profile: data.analysis.profile,
          strategy: data.analysis.monitoringPlan,
          suggestions: data.analysis.suggestions,
          timestamp: new Date().toLocaleTimeString()
        };
        
        setMessages((prev) => [...prev, aiMessage]);
        
        // If a strategy was created, notify parent
        if (data.analysis.monitoringPlan && onStrategyCreated) {
          onStrategyCreated({
            profile: data.analysis.profile,
            strategy: data.analysis.monitoringPlan,
            suggestions: data.analysis.suggestions
          });
        }
      } else {
        throw new Error(data.message || "Failed to get response");
      }
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          type: "ai",
          content: "I'm sorry, I encountered an error. Please try again.",
          timestamp: new Date().toLocaleTimeString(),
          error: true
        },
      ]);
    } finally {
      setIsAIResponding(false);
    }
  };

  const buildStrategyPrompt = (userInput, conversationHistory) => {
    const context = conversationHistory.map(msg => 
      `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
    ).join('\n');

    return `You are an expert AI Monitoring Strategist. Your job is to help users create monitoring strategies for companies, brands, or topics.

Current conversation:
${context}
User: ${userInput}

Your capabilities:
1. Analyze any company/brand from minimal input (e.g., "Amazon", "my fintech startup")
2. Build comprehensive company profiles including industry, competitors, risks, opportunities
3. Create specific monitoring keywords, sources, and alert configurations
4. Provide actionable insights on what to watch for

Guidelines:
- Be conversational and helpful
- For well-known companies, provide rich insights about their business model, competitors, typical risks
- For generic industries or startups, ask clarifying questions to build a profile
- Always provide specific, actionable monitoring configurations
- Include potential risks and opportunities to monitor
- Suggest relevant keywords, news sources, and alert thresholds

Response format (JSON):
{
  "content": "Your conversational response to the user",
  "profile": {
    "company": "Company name",
    "industry": "Industry sector", 
    "description": "Brief company description",
    "keyCompetitors": ["competitor1", "competitor2"],
    "businessModel": "How they make money",
    "keyRisks": ["risk1", "risk2"],
    "opportunities": ["opportunity1", "opportunity2"],
    "targetAudience": "Who they serve"
  },
  "suggestions": [
    {
      "type": "keywords",
      "title": "Primary Keywords",
      "items": ["keyword1", "keyword2", "keyword3"]
    },
    {
      "type": "sources", 
      "title": "Recommended Sources",
      "items": ["TechCrunch", "Industry Publication X"]
    },
    {
      "type": "alerts",
      "title": "Key Things to Watch",
      "items": ["alert1", "alert2"]
    }
  ],
  "monitoringPlan": {
    "keywords": ["primary", "keyword", "list"],
    "competitors": ["competitor1", "competitor2"],
    "sources": {
      "rss": ["feed1", "feed2"],
      "categories": ["technology", "business"]
    },
    "alertThresholds": {
      "sentiment": "negative",
      "volume": 10,
      "urgency": "high"
    },
    "reviewFrequency": "How often to check"
  }
}

Important: Always return valid JSON. Focus on creating actionable monitoring configurations.`;
  };

  return (
    <div style={{
      height: "100%",
      display: "flex",
      flexDirection: "column",
      background: "#f8fafc"
    }}>
      {/* AI Chat Interface */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "white",
        borderRadius: "0.75rem",
        border: "1px solid #e2e8f0",
        overflow: "hidden"
      }}>
        {/* Chat Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          padding: "1rem 1.5rem",
          borderBottom: "1px solid #e2e8f0",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white"
        }}>
          <Bot style={{ width: "24px", height: "24px" }} />
          <div>
            <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: "600" }}>
              AI Monitoring Strategist
            </h3>
            <p style={{ margin: 0, fontSize: "0.875rem", opacity: 0.9 }}>
              Tell me what you want to monitor and I'll create a strategy
            </p>
          </div>
          
          {/* Help Button */}
          <button
            onClick={() => setShowQueryHelp(!showQueryHelp)}
            style={{
              marginLeft: "auto",
              padding: "0.5rem",
              background: "rgba(255, 255, 255, 0.2)",
              border: "none",
              borderRadius: "0.5rem",
              color: "white",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => e.target.style.background = "rgba(255, 255, 255, 0.3)"}
            onMouseLeave={(e) => e.target.style.background = "rgba(255, 255, 255, 0.2)"}
          >
            <HelpCircle style={{ width: "18px", height: "18px" }} />
          </button>
        </div>

        {/* Messages Area */}
        <div
          ref={chatContainerRef}
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "1.5rem"
          }}
        >
          {messages.map((message) => (
            <div
              key={message.id}
              style={{
                display: "flex",
                justifyContent: message.type === "user" ? "flex-end" : "flex-start",
                marginBottom: "1rem"
              }}
            >
              <div
                style={{
                  maxWidth: "80%",
                  padding: "1rem",
                  borderRadius: "0.75rem",
                  background: message.type === "user"
                    ? "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)"
                    : message.error
                    ? "#fee2e2"
                    : "#f3f4f6",
                  color: message.type === "user" ? "white" : "#111827",
                  fontSize: "0.9375rem",
                  lineHeight: "1.6",
                  whiteSpace: "pre-wrap"
                }}
              >
                {message.content}
                
                {/* Enhanced content for AI responses */}
                {message.profile && (
                  <div style={{
                    marginTop: "1rem",
                    padding: "1rem",
                    background: "#dbeafe",
                    borderRadius: "0.5rem",
                    border: "1px solid #93c5fd"
                  }}>
                    <h4 style={{ margin: "0 0 0.5rem 0", fontWeight: "600", color: "#1e40af" }}>
                      📊 Company Profile
                    </h4>
                    <div style={{ fontSize: "0.875rem", color: "#1e3a8a" }}>
                      <div><strong>Industry:</strong> {message.profile.industry}</div>
                      <div><strong>Business Model:</strong> {message.profile.businessModel}</div>
                      {message.profile.keyCompetitors && (
                        <div><strong>Key Competitors:</strong> {message.profile.keyCompetitors.join(', ')}</div>
                      )}
                    </div>
                  </div>
                )}

                {message.suggestions && message.suggestions.length > 0 && (
                  <div style={{ marginTop: "1rem" }}>
                    {message.suggestions.map((suggestion, idx) => (
                      <div key={idx} style={{
                        marginBottom: "0.75rem",
                        padding: "0.75rem",
                        background: "#f0fdf4",
                        borderRadius: "0.5rem",
                        border: "1px solid #bbf7d0"
                      }}>
                        <h5 style={{ margin: "0 0 0.5rem 0", fontWeight: "600", color: "#166534" }}>
                          {suggestion.type === 'keywords' && '🎯 '}
                          {suggestion.type === 'sources' && '📰 '}
                          {suggestion.type === 'alerts' && '⚠️ '}
                          {suggestion.title}
                        </h5>
                        <div style={{ fontSize: "0.875rem", color: "#15803d" }}>
                          {suggestion.items.join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {message.strategy && (
                  <div style={{
                    marginTop: "1rem",
                    padding: "1rem",
                    background: "#ecfdf5",
                    borderRadius: "0.5rem",
                    border: "1px solid #86efac"
                  }}>
                    <h4 style={{ margin: "0 0 0.5rem 0", fontWeight: "600", color: "#166534" }}>
                      ✅ Monitoring Strategy Created
                    </h4>
                    <div style={{ fontSize: "0.875rem", color: "#15803d" }}>
                      {message.strategy.keywords && (
                        <div><strong>Keywords:</strong> {message.strategy.keywords.join(', ')}</div>
                      )}
                      {message.strategy.reviewFrequency && (
                        <div><strong>Review Frequency:</strong> {message.strategy.reviewFrequency}</div>
                      )}
                    </div>
                  </div>
                )}

                <div style={{
                  fontSize: "0.75rem",
                  color: message.type === "user" ? "rgba(255,255,255,0.7)" : "#6b7280",
                  marginTop: "0.5rem"
                }}>
                  {message.timestamp}
                </div>
              </div>
            </div>
          ))}

          {/* AI Typing Indicator */}
          {isAIResponding && (
            <div style={{
              display: "flex",
              justifyContent: "flex-start",
              marginBottom: "1rem"
            }}>
              <div style={{
                padding: "1rem",
                borderRadius: "0.75rem",
                background: "#f3f4f6",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem"
              }}>
                <div style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#6366f1",
                  animation: "pulse 1.5s ease-in-out infinite"
                }} />
                <div style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#6366f1",
                  animation: "pulse 1.5s ease-in-out infinite 0.2s"
                }} />
                <div style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#6366f1",
                  animation: "pulse 1.5s ease-in-out infinite 0.4s"
                }} />
                <span style={{ fontSize: "0.875rem", color: "#6b7280", marginLeft: "0.5rem" }}>
                  AI is analyzing...
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div style={{
          padding: "1rem 1.5rem",
          borderTop: "1px solid #e2e8f0",
          background: "#fafafa"
        }}>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Tell me what you want to monitor (e.g., 'Amazon', 'my startup', 'competitor analysis')..."
              style={{
                flex: 1,
                padding: "0.75rem 1rem",
                border: "1px solid #e5e7eb",
                borderRadius: "0.5rem",
                fontSize: "0.9375rem",
                outline: "none",
                transition: "all 0.2s"
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#8b5cf6";
                e.target.style.boxShadow = "0 0 0 3px rgba(139, 92, 246, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e5e7eb";
                e.target.style.boxShadow = "none";
              }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isAIResponding}
              style={{
                padding: "0.75rem 1.5rem",
                background: !input.trim() || isAIResponding ? "#9ca3af" : "#8b5cf6",
                color: "white",
                border: "none",
                borderRadius: "0.5rem",
                fontWeight: "500",
                cursor: !input.trim() || isAIResponding ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => {
                if (!(!input.trim() || isAIResponding)) {
                  e.target.style.background = "#7c3aed";
                }
              }}
              onMouseLeave={(e) => {
                if (!(!input.trim() || isAIResponding)) {
                  e.target.style.background = "#8b5cf6";
                }
              }}
            >
              <Send style={{ width: "16px", height: "16px" }} />
              Send
            </button>
          </div>
        </div>
      </div>

      {/* Help Popup */}
      {showQueryHelp && (
        <div style={{
          position: "absolute",
          top: "4rem",
          right: "2rem",
          width: "320px",
          background: "white",
          border: "1px solid #e2e8f0",
          borderRadius: "0.5rem",
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
          padding: "1rem",
          zIndex: 50
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "0.75rem"
          }}>
            <h4 style={{ margin: 0, fontWeight: "600", color: "#111827" }}>
              Example Questions:
            </h4>
            <button
              onClick={() => setShowQueryHelp(false)}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "#6b7280",
                fontSize: "1.25rem"
              }}
            >
              ×
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {[
              "🏢 Help me monitor Amazon's reputation",
              "🚀 Set up monitoring for my SaaS startup",
              "📊 Track Microsoft's product announcements", 
              "⚔️ Monitor my competitor Tesla's activities",
              "📈 What should I watch for in fintech industry?"
            ].map((question, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setInput(question.replace(/^[🏢🚀📊⚔️📈]\s/, ''));
                  setShowQueryHelp(false);
                }}
                style={{
                  padding: "0.5rem 0.75rem",
                  background: "#f3f4f6",
                  border: "none",
                  borderRadius: "0.375rem",
                  fontSize: "0.875rem",
                  color: "#374151",
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => e.target.style.background = "#e5e7eb"}
                onMouseLeave={(e) => e.target.style.background = "#f3f4f6"}
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}
      </style>
    </div>
  );
};

export default MonitoringStrategyChatbot;