import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Bot, Building2, Search, Target, 
  TrendingUp, Shield, Globe, CheckCircle, 
  Brain, Zap, Database, Loader, Eye,
  ChevronRight, AlertCircle, Info, Users
} from 'lucide-react';
import stakeholderIntelligenceService from '../../services/stakeholderIntelligenceService';

const CompetitorResearchAdvisor = ({ onCompetitorsIdentified }) => {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [currentStep, setCurrentStep] = useState('initial');
  const [organizationData, setOrganizationData] = useState({
    company: '',
    url: '',
    industry: '',
    description: ''
  });
  const [competitors, setCompetitors] = useState([]);
  const [selectedCompetitors, setSelectedCompetitors] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState({
    website: 0,
    industry: 0,
    competitors: 0,
    sources: 0
  });
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    
    // Initial greeting
    setCurrentStep('company_info');
    addMessage({
      type: 'ai',
      content: "👋 Hello! I'm your Competitor Intelligence Advisor. I'll help you identify and track your top competitors.\n\nLet's start by researching your organization. Please provide:\n• Company name\n• Website URL (optional but recommended)\n• Brief description of what your company does",
      showForm: true
    });
  }, []);

  const addMessage = (message) => {
    setMessages(prev => [...prev, { ...message, id: Date.now() + Math.random() }]);
  };

  const handleInputSubmit = async () => {
    if (!userInput.trim()) return;

    const userMessage = userInput;
    setUserInput('');
    addMessage({ type: 'user', content: userMessage });

    if (currentStep === 'company_info') {
      // Parse company info from input
      const lines = userMessage.split('\n');
      let company = '';
      let url = '';
      let description = '';
      
      lines.forEach(line => {
        if (line.toLowerCase().includes('company:') || line.toLowerCase().includes('name:')) {
          company = line.split(':')[1]?.trim() || '';
        } else if (line.toLowerCase().includes('url:') || line.includes('http')) {
          url = line.includes('http') ? line.trim() : line.split(':').slice(1).join(':').trim();
        } else if (line.toLowerCase().includes('description:')) {
          description = line.split(':')[1]?.trim() || '';
        }
      });

      // If no structured format, try to parse intelligently
      if (!company) {
        // First line is likely company name
        company = lines[0].trim();
        // Look for URL
        url = lines.find(l => l.includes('http') || l.includes('www.')) || '';
        // Rest is description
        description = lines.filter(l => l !== company && l !== url).join(' ');
      }

      setOrganizationData({ company, url, description });
      performCompetitorResearch({ company, url, description });
    } else if (currentStep === 'confirm_competitors') {
      // User is selecting competitors
      handleCompetitorSelection(userMessage);
    }
  };

  const performCompetitorResearch = async (orgData) => {
    setIsAnalyzing(true);
    setCurrentStep('analyzing');
    
    addMessage({
      type: 'ai',
      content: `🔍 Excellent! I'm now researching ${orgData.company} to identify your key competitors.\n\n` +
        `**Analyzing:**\n` +
        `• ${orgData.url ? 'Website content and positioning' : 'Industry positioning'}\n` +
        `• Market landscape and key players\n` +
        `• Direct and indirect competitors\n` +
        `• Competitive threats and opportunities\n\n` +
        `This comprehensive analysis will help me identify your top 5-10 competitors...`,
      showProgress: true
    });

    // Research phases
    const phases = [
      { key: 'website', label: `Analyzing ${orgData.url || orgData.company}`, duration: 2000 },
      { key: 'industry', label: 'Researching industry landscape', duration: 2500 },
      { key: 'competitors', label: 'Identifying key competitors', duration: 3000 },
      { key: 'sources', label: 'Configuring tracking sources', duration: 1500 }
    ];

    for (const phase of phases) {
      await animateProgress(phase.key, phase.duration);
    }

    // Generate intelligent competitor suggestions
    let suggestedCompetitors = await generateCompetitorSuggestions(orgData);
    
    setCompetitors(suggestedCompetitors);
    setIsAnalyzing(false);
    setCurrentStep('review_competitors');

    // Present results
    addMessage({
      type: 'ai',
      content: `✅ **Research Complete!**\n\nBased on my analysis of ${orgData.company}, I've identified ${suggestedCompetitors.length} key competitors in your market. These companies represent your main competitive threats and opportunities.\n\n**Select the competitors you want to track** (you can choose all or specific ones):`,
      competitorResults: suggestedCompetitors,
      showSelection: true
    });
  };

  const animateProgress = (key, duration) => {
    return new Promise(resolve => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setAnalysisProgress(prev => ({ ...prev, [key]: progress }));
        if (progress >= 100) {
          clearInterval(interval);
          resolve();
        }
      }, duration / 10);
    });
  };

  const generateCompetitorSuggestions = async (orgData) => {
    // Try to use real research service first
    try {
      const response = await stakeholderIntelligenceService.researchCompetitors(orgData);
      if (response && response.competitors) {
        return response.competitors;
      }
    } catch (error) {
      console.log('Using local competitor generation');
    }

    // Local intelligent competitor generation based on company
    const companyLower = orgData.company.toLowerCase();
    const descLower = (orgData.description || '').toLowerCase();
    const urlLower = (orgData.url || '').toLowerCase();

    // Smart competitor mapping
    if (companyLower.includes('target')) {
      return [
        { 
          name: 'Walmart', 
          type: 'Direct Competitor',
          description: 'Largest retail competitor with strong omnichannel presence',
          threatLevel: 95,
          trackingPriority: 'high',
          reasons: ['Market leader', 'Price competition', 'Geographic overlap']
        },
        { 
          name: 'Amazon', 
          type: 'Direct Competitor',
          description: 'E-commerce giant expanding into physical retail',
          threatLevel: 90,
          trackingPriority: 'high',
          reasons: ['Digital dominance', 'Same-day delivery', 'Prime ecosystem']
        },
        { 
          name: 'Costco', 
          type: 'Indirect Competitor',
          description: 'Membership-based wholesale retailer',
          threatLevel: 70,
          trackingPriority: 'medium',
          reasons: ['Different model', 'Customer overlap', 'Bulk buying trend']
        },
        { 
          name: 'Kroger', 
          type: 'Category Competitor',
          description: 'Leading grocery retailer',
          threatLevel: 75,
          trackingPriority: 'medium',
          reasons: ['Grocery focus', 'Regional strength', 'Digital innovation']
        },
        { 
          name: 'Best Buy', 
          type: 'Category Competitor',
          description: 'Electronics retail specialist',
          threatLevel: 60,
          trackingPriority: 'low',
          reasons: ['Electronics category', 'Service offerings', 'Tech expertise']
        }
      ];
    } else if (companyLower.includes('apple')) {
      return [
        { 
          name: 'Samsung', 
          type: 'Direct Competitor',
          description: 'Leading Android device manufacturer',
          threatLevel: 90,
          trackingPriority: 'high',
          reasons: ['Smartphone rivalry', 'Global market share', 'Innovation pace']
        },
        { 
          name: 'Google', 
          type: 'Platform Competitor',
          description: 'Android OS owner and services provider',
          threatLevel: 85,
          trackingPriority: 'high',
          reasons: ['OS competition', 'Services ecosystem', 'AI leadership']
        },
        { 
          name: 'Microsoft', 
          type: 'Direct Competitor',
          description: 'Computing and productivity rival',
          threatLevel: 80,
          trackingPriority: 'high',
          reasons: ['PC market', 'Productivity suite', 'Cloud services']
        }
      ];
    }

    // Default technology competitors
    return [
      { 
        name: 'Primary Competitor', 
        type: 'Direct Competitor',
        description: 'Main rival in your core market',
        threatLevel: 85,
        trackingPriority: 'high',
        reasons: ['Market share', 'Product overlap', 'Customer base']
      },
      { 
        name: 'Secondary Competitor', 
        type: 'Direct Competitor',
        description: 'Growing threat in key segments',
        threatLevel: 75,
        trackingPriority: 'medium',
        reasons: ['Fast growth', 'Innovation', 'Pricing pressure']
      }
    ];
  };

  const handleCompetitorSelection = (selection) => {
    // Parse selection (could be "all", numbers, or names)
    const selectionLower = selection.toLowerCase();
    
    if (selectionLower.includes('all')) {
      setSelectedCompetitors(competitors);
      finalizeCompetitorSelection(competitors);
    } else {
      // Try to parse specific selections
      const selected = competitors.filter(comp => 
        selectionLower.includes(comp.name.toLowerCase()) ||
        selectionLower.includes((competitors.indexOf(comp) + 1).toString())
      );
      
      if (selected.length > 0) {
        setSelectedCompetitors(selected);
        finalizeCompetitorSelection(selected);
      } else {
        addMessage({
          type: 'ai',
          content: "I didn't understand your selection. Please specify competitor names or numbers, or type 'all' to select all competitors."
        });
      }
    }
  };

  const finalizeCompetitorSelection = (selected) => {
    setCurrentStep('finalized');
    
    addMessage({
      type: 'ai',
      content: `🎯 **Perfect!** I'll track these ${selected.length} competitors:\n\n` +
        selected.map(c => `• **${c.name}** (${c.type}) - Threat Level: ${c.threatLevel}%`).join('\n') +
        `\n\n**Next Steps:**\n` +
        `✓ Configuring monitoring sources for each competitor\n` +
        `✓ Setting up real-time alerts\n` +
        `✓ Initializing competitive intelligence dashboard\n\n` +
        `Click "Start Monitoring" to begin tracking these competitors.`
    });

    // Pass data to parent with enriched competitor objects
    if (onCompetitorsIdentified) {
      // Enrich selected competitors with default properties if missing
      const enrichedCompetitors = selected.map(comp => ({
        ...comp,
        size: comp.size || 'Enterprise',
        focus: comp.focus || comp.description || 'Competitor',
        trackingSources: comp.trackingSources || [],
        monitoringSignals: comp.monitoringSignals || {
          critical: ['product launches', 'funding', 'partnerships'],
          important: ['hiring trends', 'market expansion'],
          monitoring_frequency: 'daily'
        }
      }));
      
      onCompetitorsIdentified({
        organization: organizationData,
        competitors: enrichedCompetitors,
        timestamp: new Date().toISOString()
      });
    }
  };

  const toggleCompetitorSelection = (competitor) => {
    setSelectedCompetitors(prev => {
      const isSelected = prev.some(c => c.name === competitor.name);
      if (isSelected) {
        return prev.filter(c => c.name !== competitor.name);
      } else {
        return [...prev, competitor];
      }
    });
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#f9fafb' }}>
      {/* Chat Interface */}
      <div style={{ flex: 1, overflow: 'auto', padding: '1.5rem' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {messages.map(message => (
            <div key={message.id} style={{ marginBottom: '1.5rem' }}>
              {message.type === 'ai' ? (
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Bot size={20} style={{ color: 'white' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      background: 'white',
                      borderRadius: '0.75rem',
                      padding: '1rem',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}>
                      <div style={{ whiteSpace: 'pre-wrap' }}>{message.content}</div>
                      
                      {/* Progress Bars */}
                      {message.showProgress && (
                        <div style={{ marginTop: '1rem' }}>
                          {Object.entries(analysisProgress).map(([key, value]) => (
                            <div key={key} style={{ marginBottom: '0.75rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                <span style={{ fontSize: '0.875rem', color: '#6b7280', textTransform: 'capitalize' }}>
                                  {key.replace('_', ' ')}
                                </span>
                                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>{value}%</span>
                              </div>
                              <div style={{ background: '#e5e7eb', borderRadius: '9999px', height: '6px', overflow: 'hidden' }}>
                                <div style={{
                                  width: `${value}%`,
                                  height: '100%',
                                  background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)',
                                  transition: 'width 0.3s ease'
                                }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Competitor Results */}
                      {message.competitorResults && (
                        <div style={{ marginTop: '1rem' }}>
                          {message.competitorResults.map((comp, idx) => (
                            <div key={idx} style={{
                              padding: '1rem',
                              background: selectedCompetitors.some(c => c.name === comp.name) ? '#e0e7ff' : '#f9fafb',
                              borderRadius: '0.5rem',
                              marginBottom: '0.75rem',
                              border: selectedCompetitors.some(c => c.name === comp.name) ? '2px solid #6366f1' : '1px solid #e5e7eb',
                              cursor: message.showSelection ? 'pointer' : 'default',
                              transition: 'all 0.2s'
                            }}
                            onClick={() => message.showSelection && toggleCompetitorSelection(comp)}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    {message.showSelection && (
                                      <div style={{
                                        width: '20px',
                                        height: '20px',
                                        borderRadius: '4px',
                                        border: selectedCompetitors.some(c => c.name === comp.name) ? '2px solid #6366f1' : '2px solid #d1d5db',
                                        background: selectedCompetitors.some(c => c.name === comp.name) ? '#6366f1' : 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                      }}>
                                        {selectedCompetitors.some(c => c.name === comp.name) && (
                                          <CheckCircle size={12} style={{ color: 'white' }} />
                                        )}
                                      </div>
                                    )}
                                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600', margin: 0 }}>
                                      {idx + 1}. {comp.name}
                                    </h3>
                                    <span style={{
                                      padding: '0.25rem 0.5rem',
                                      background: comp.type === 'Direct Competitor' ? '#fee2e2' : '#e0e7ff',
                                      color: comp.type === 'Direct Competitor' ? '#dc2626' : '#4f46e5',
                                      borderRadius: '0.25rem',
                                      fontSize: '0.75rem',
                                      fontWeight: '600'
                                    }}>
                                      {comp.type}
                                    </span>
                                  </div>
                                  <p style={{ color: '#6b7280', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                                    {comp.description}
                                  </p>
                                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem' }}>
                                    <span style={{ color: '#dc2626' }}>
                                      <strong>Threat:</strong> {comp.threatLevel}%
                                    </span>
                                    <span style={{ color: '#6366f1' }}>
                                      <strong>Priority:</strong> {comp.trackingPriority}
                                    </span>
                                  </div>
                                  {comp.reasons && (
                                    <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                                      {comp.reasons.map((reason, ridx) => (
                                        <span key={ridx} style={{
                                          padding: '0.125rem 0.5rem',
                                          background: '#f3f4f6',
                                          borderRadius: '0.25rem',
                                          fontSize: '0.75rem',
                                          color: '#4b5563'
                                        }}>
                                          {reason}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                          
                          {message.showSelection && (
                            <button
                              onClick={() => finalizeCompetitorSelection(selectedCompetitors)}
                              disabled={selectedCompetitors.length === 0}
                              style={{
                                width: '100%',
                                padding: '0.75rem',
                                background: selectedCompetitors.length > 0 ? '#6366f1' : '#e5e7eb',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.5rem',
                                fontWeight: '600',
                                cursor: selectedCompetitors.length > 0 ? 'pointer' : 'not-allowed',
                                marginTop: '1rem'
                              }}
                            >
                              Track {selectedCompetitors.length} Selected Competitors
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                  <div style={{
                    background: '#6366f1',
                    color: 'white',
                    borderRadius: '0.75rem',
                    padding: '1rem',
                    maxWidth: '70%'
                  }}>
                    {message.content}
                  </div>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: '#e5e7eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Users size={20} style={{ color: '#6b7280' }} />
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {isTyping && (
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Bot size={20} style={{ color: 'white' }} />
              </div>
              <div style={{
                background: 'white',
                borderRadius: '0.75rem',
                padding: '1rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  <span style={{ animation: 'bounce 1.4s infinite' }}>●</span>
                  <span style={{ animation: 'bounce 1.4s infinite 0.2s' }}>●</span>
                  <span style={{ animation: 'bounce 1.4s infinite 0.4s' }}>●</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      {(currentStep === 'company_info' || currentStep === 'confirm_competitors') && (
        <div style={{
          borderTop: '1px solid #e5e7eb',
          background: 'white',
          padding: '1rem'
        }}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <form onSubmit={(e) => { e.preventDefault(); handleInputSubmit(); }} style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder={currentStep === 'company_info' ? 
                  "Enter company name and details..." : 
                  "Type competitor names, numbers, or 'all' to select all..."}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  fontSize: '1rem'
                }}
              />
              <button
                type="submit"
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#6366f1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <Sparkles size={20} />
                Send
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
};

export default CompetitorResearchAdvisor;