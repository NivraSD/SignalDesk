import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, Target, Globe, Hash, TrendingUp, 
  ArrowRight, Check, Plus, X, AlertCircle, Sparkles,
  Shield, Zap, Search, Save, Loader, CheckCircle,
  Brain, RefreshCw, Info, Edit2, Trash2
} from 'lucide-react';
import API_BASE_URL from '../../config/api';

const AutomatedOrganizationSetup = ({ onSetupComplete }) => {
  // Add CSS animations
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      @keyframes pulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.05); opacity: 0.9; }
      }
      @keyframes progress {
        from { transform: translateX(-100%); }
        to { transform: translateX(0); }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);
  
  // Check for temporary organization data from settings
  const [step, setStep] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Initialize with temp org data if available
  const tempOrgData = localStorage.getItem('signaldesk_temp_org');
  const initialOrgData = tempOrgData ? JSON.parse(tempOrgData) : null;
  
  const [orgData, setOrgData] = useState({
    name: initialOrgData?.organizationName || '',
    url: '',
    description: initialOrgData?.organizationDescription || ''
  });
  
  // Clear temp data after loading
  React.useEffect(() => {
    if (tempOrgData) {
      localStorage.removeItem('signaldesk_temp_org');
    }
  }, [tempOrgData]);
  
  const [discoveredData, setDiscoveredData] = useState({
    industry: '',
    competitors: [],
    topics: [],
    stakeholders: {
      regulators: [],
      investors: [],
      customers: [],
      media: []
    }
  });

  const [selectedItems, setSelectedItems] = useState({
    competitors: [],
    topics: [],
    stakeholders: []
  });
  
  const [isActivating, setIsActivating] = useState(false);
  const [activationStep, setActivationStep] = useState('');
  
  const [editingCompetitor, setEditingCompetitor] = useState(null);
  const [editingTopic, setEditingTopic] = useState(null);
  const [showAddCompetitor, setShowAddCompetitor] = useState(false);
  const [showAddTopic, setShowAddTopic] = useState(false);
  const [newCompetitor, setNewCompetitor] = useState({ name: '', marketCap: 'Private', priority: 'medium' });
  const [newTopic, setNewTopic] = useState({ name: '', priority: 'medium', trending: false });

  const analyzeOrganization = async () => {
    if (!orgData.name) return;
    
    setIsAnalyzing(true);
    
    try {
      // Call backend API to analyze organization using AI
      const response = await fetch(`${API_BASE_URL}/intelligence/analyze-organization`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          company: orgData.name,
          url: orgData.url || '',
          requestType: 'discover'
        })
      });

      console.log('Organization analysis response:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Received analysis data:', data);
        
        // Transform API response to our format
        const discoveredData = {
          industry: data.industry || 'Technology',
          competitors: data.competitors || [],
          topics: data.topics || [],
          stakeholders: data.stakeholders || generateStakeholders(orgData.name, data.industry)
        };
        
        setDiscoveredData(discoveredData);
        
        // Pre-select high priority items
        setSelectedItems({
          competitors: discoveredData.competitors.filter(c => c.priority === 'high').map(c => c.id),
          topics: discoveredData.topics.filter(t => t.priority === 'high').map(t => t.id),
          stakeholders: []
        });
        
        setIsAnalyzing(false);
        setStep(2);
      } else {
        // Fallback to local detection if API fails
        console.error('API analysis failed:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error details:', errorText);
        const industry = orgData.url ? detectIndustryFromUrl(orgData.url) : detectIndustry(orgData.name);
        
        const mockData = {
          industry: industry,
          competitors: generateCompetitors(orgData.name, industry),
          topics: generateTopics(orgData.name, industry),
          stakeholders: generateStakeholders(orgData.name, industry)
        };
        
        setDiscoveredData(mockData);
        setSelectedItems({
          competitors: mockData.competitors.filter(c => c.priority === 'high').map(c => c.id),
          topics: mockData.topics.filter(t => t.priority === 'high').map(t => t.id),
          stakeholders: []
        });
        
        setIsAnalyzing(false);
        setStep(2);
      }
    } catch (error) {
      console.error('Error analyzing organization:', error);
      console.error('Full error details:', error.message, error.stack);
      // Use fallback detection
      const industry = orgData.url ? detectIndustryFromUrl(orgData.url) : detectIndustry(orgData.name);
      
      const mockData = {
        industry: industry,
        competitors: generateCompetitors(orgData.name, industry),
        topics: generateTopics(orgData.name, industry),
        stakeholders: generateStakeholders(orgData.name, industry)
      };
      
      setDiscoveredData(mockData);
      setSelectedItems({
        competitors: mockData.competitors.filter(c => c.priority === 'high').map(c => c.id),
        topics: mockData.topics.filter(t => t.priority === 'high').map(t => t.id),
        stakeholders: []
      });
      
      setIsAnalyzing(false);
      setStep(2);
    }
  };

  const detectIndustry = (companyName) => {
    const name = companyName.toLowerCase();
    if (name.includes('tech') || name.includes('soft') || name.includes('app')) return 'Technology';
    if (name.includes('bank') || name.includes('finance') || name.includes('capital')) return 'Finance';
    if (name.includes('health') || name.includes('med') || name.includes('pharma')) return 'Healthcare';
    if (name.includes('food') || name.includes('restaurant') || name.includes('taco')) return 'Food & Beverage';
    return 'Technology'; // Default
  };

  const detectIndustryFromUrl = (url) => {
    const domain = url.toLowerCase();
    // Check domain patterns for better industry detection
    if (domain.includes('.tech') || domain.includes('software') || domain.includes('app')) return 'Technology';
    if (domain.includes('bank') || domain.includes('financial') || domain.includes('.finance')) return 'Finance';
    if (domain.includes('health') || domain.includes('medical') || domain.includes('pharma')) return 'Healthcare';
    if (domain.includes('food') || domain.includes('restaurant') || domain.includes('eat')) return 'Food & Beverage';
    if (domain.includes('retail') || domain.includes('shop') || domain.includes('store')) return 'Retail';
    if (domain.includes('.edu') || domain.includes('university') || domain.includes('college')) return 'Education';
    if (domain.includes('.gov')) return 'Government';
    // Fall back to name-based detection
    return detectIndustry(orgData.name);
  };

  const generateCompetitors = (companyName, industry) => {
    // Mock competitor discovery based on industry
    const competitorSets = {
      'Technology': [
        { id: 'c1', name: 'Microsoft', priority: 'high', marketCap: '$2.8T', similarity: 0.85 },
        { id: 'c2', name: 'Google', priority: 'high', marketCap: '$1.7T', similarity: 0.82 },
        { id: 'c3', name: 'Amazon', priority: 'medium', marketCap: '$1.5T', similarity: 0.75 },
        { id: 'c4', name: 'Meta', priority: 'medium', marketCap: '$900B', similarity: 0.70 },
        { id: 'c5', name: 'Apple', priority: 'low', marketCap: '$2.9T', similarity: 0.65 }
      ],
      'Food & Beverage': [
        { id: 'c1', name: "McDonald's", priority: 'high', marketCap: '$200B', similarity: 0.88 },
        { id: 'c2', name: 'Chipotle', priority: 'high', marketCap: '$50B', similarity: 0.85 },
        { id: 'c3', name: 'Subway', priority: 'medium', marketCap: 'Private', similarity: 0.78 },
        { id: 'c4', name: "Wendy's", priority: 'medium', marketCap: '$4B', similarity: 0.75 },
        { id: 'c5', name: 'Burger King', priority: 'low', marketCap: '$20B', similarity: 0.70 }
      ],
      'Finance': [
        { id: 'c1', name: 'JPMorgan Chase', priority: 'high', marketCap: '$450B', similarity: 0.85 },
        { id: 'c2', name: 'Bank of America', priority: 'high', marketCap: '$250B', similarity: 0.82 },
        { id: 'c3', name: 'Wells Fargo', priority: 'medium', marketCap: '$180B', similarity: 0.75 },
        { id: 'c4', name: 'Goldman Sachs', priority: 'medium', marketCap: '$120B', similarity: 0.70 },
        { id: 'c5', name: 'Morgan Stanley', priority: 'low', marketCap: '$150B', similarity: 0.65 }
      ],
      'Healthcare': [
        { id: 'c1', name: 'UnitedHealth', priority: 'high', marketCap: '$500B', similarity: 0.85 },
        { id: 'c2', name: 'CVS Health', priority: 'high', marketCap: '$140B', similarity: 0.82 },
        { id: 'c3', name: 'Anthem', priority: 'medium', marketCap: '$120B', similarity: 0.75 },
        { id: 'c4', name: 'Cigna', priority: 'medium', marketCap: '$90B', similarity: 0.70 },
        { id: 'c5', name: 'Humana', priority: 'low', marketCap: '$60B', similarity: 0.65 }
      ]
    };
    return competitorSets[industry] || competitorSets['Technology'];
  };

  const generateTopics = (companyName, industry) => {
    const topicSets = {
      'Technology': [
        { id: 't1', name: 'AI & Machine Learning', priority: 'high', trending: true },
        { id: 't2', name: 'Data Privacy & Security', priority: 'high', trending: true },
        { id: 't3', name: 'Cloud Computing', priority: 'medium', trending: false },
        { id: 't4', name: 'Digital Transformation', priority: 'medium', trending: true },
        { id: 't5', name: 'Cybersecurity Threats', priority: 'high', trending: true },
        { id: 't6', name: 'Remote Work Technology', priority: 'low', trending: false }
      ],
      'Food & Beverage': [
        { id: 't1', name: 'Digital Payment & Mobile Ordering', priority: 'high', trending: true },
        { id: 't2', name: 'Plant-Based & Alternative Proteins', priority: 'high', trending: true },
        { id: 't3', name: 'Food Safety & Supply Chain', priority: 'high', trending: false },
        { id: 't4', name: 'AI-Driven Personalization', priority: 'medium', trending: true },
        { id: 't5', name: 'Labor Automation & Robotics', priority: 'medium', trending: true },
        { id: 't6', name: 'Sustainability & ESG', priority: 'medium', trending: true }
      ],
      'Finance': [
        { id: 't1', name: 'Digital Banking & Fintech', priority: 'high', trending: true },
        { id: 't2', name: 'Cryptocurrency & Blockchain', priority: 'high', trending: true },
        { id: 't3', name: 'Regulatory Compliance', priority: 'high', trending: false },
        { id: 't4', name: 'Open Banking & APIs', priority: 'medium', trending: true },
        { id: 't5', name: 'ESG Investing', priority: 'medium', trending: true },
        { id: 't6', name: 'Cybersecurity in Finance', priority: 'high', trending: true }
      ],
      'Healthcare': [
        { id: 't1', name: 'Telemedicine & Digital Health', priority: 'high', trending: true },
        { id: 't2', name: 'AI in Diagnostics', priority: 'high', trending: true },
        { id: 't3', name: 'Drug Pricing & Access', priority: 'high', trending: false },
        { id: 't4', name: 'Patient Data Privacy', priority: 'medium', trending: true },
        { id: 't5', name: 'Healthcare Workforce', priority: 'medium', trending: true },
        { id: 't6', name: 'Value-Based Care', priority: 'medium', trending: false }
      ]
    };
    return topicSets[industry] || topicSets['Technology'];
  };

  const generateStakeholders = (companyName, industry) => {
    return {
      regulators: industry === 'Finance' ? ['SEC', 'FDIC', 'Federal Reserve'] : 
                 industry === 'Healthcare' ? ['FDA', 'CMS', 'HHS'] :
                 industry === 'Food & Beverage' ? ['FDA', 'USDA', 'FTC'] :
                 ['FTC', 'FCC', 'SEC'],
      investors: ['BlackRock', 'Vanguard', 'State Street'],
      customers: ['Enterprise Clients', 'Small Business', 'Consumers'],
      media: ['TechCrunch', 'Wall Street Journal', 'Bloomberg', 'Reuters']
    };
  };

  const toggleSelection = (category, id) => {
    setSelectedItems(prev => ({
      ...prev,
      [category]: prev[category].includes(id)
        ? prev[category].filter(item => item !== id)
        : [...prev[category], id]
    }));
  };
  
  const updateCompetitor = (id, updates) => {
    setDiscoveredData(prev => ({
      ...prev,
      competitors: prev.competitors.map(c => 
        c.id === id ? { ...c, ...updates } : c
      )
    }));
  };
  
  const deleteCompetitor = (id) => {
    setDiscoveredData(prev => ({
      ...prev,
      competitors: prev.competitors.filter(c => c.id !== id)
    }));
    setSelectedItems(prev => ({
      ...prev,
      competitors: prev.competitors.filter(cId => cId !== id)
    }));
  };
  
  const addCompetitor = () => {
    if (newCompetitor.name) {
      const competitor = {
        id: `custom-comp-${Date.now()}`,
        name: newCompetitor.name,
        marketCap: newCompetitor.marketCap,
        priority: newCompetitor.priority,
        similarity: 0.7,
        custom: true
      };
      setDiscoveredData(prev => ({
        ...prev,
        competitors: [...prev.competitors, competitor]
      }));
      setSelectedItems(prev => ({
        ...prev,
        competitors: [...prev.competitors, competitor.id]
      }));
      setNewCompetitor({ name: '', marketCap: 'Private', priority: 'medium' });
      setShowAddCompetitor(false);
    }
  };
  
  const updateTopic = (id, updates) => {
    setDiscoveredData(prev => ({
      ...prev,
      topics: prev.topics.map(t => 
        t.id === id ? { ...t, ...updates } : t
      )
    }));
  };
  
  const deleteTopic = (id) => {
    setDiscoveredData(prev => ({
      ...prev,
      topics: prev.topics.filter(t => t.id !== id)
    }));
    setSelectedItems(prev => ({
      ...prev,
      topics: prev.topics.filter(tId => tId !== id)
    }));
  };
  
  const addTopic = () => {
    if (newTopic.name) {
      const topic = {
        id: `custom-topic-${Date.now()}`,
        name: newTopic.name,
        priority: newTopic.priority,
        trending: newTopic.trending,
        custom: true
      };
      setDiscoveredData(prev => ({
        ...prev,
        topics: [...prev.topics, topic]
      }));
      setSelectedItems(prev => ({
        ...prev,
        topics: [...prev.topics, topic.id]
      }));
      setNewTopic({ name: '', priority: 'medium', trending: false });
      setShowAddTopic(false);
    }
  };

  const handleComplete = async () => {
    setIsActivating(true);
    setActivationStep('Creating organization profile...');
    
    try {
      // Step 1: Create the organization in the database
      const orgResponse = await fetch(`${API_BASE_URL}/organizations/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: orgData.name,
          url: orgData.url,
          industry: discoveredData.industry,
          description: orgData.description
        })
      });
      
      if (!orgResponse.ok) {
        const errorText = await orgResponse.text();
        console.error('Organization creation failed:', orgResponse.status, errorText);
        setActivationStep(`Failed to create organization: ${errorText}`);
        throw new Error(`Failed to create organization: ${errorText}`);
      }
      
      const orgResult = await orgResponse.json();
      const organizationId = orgResult.organizationId; // This is now a proper ID from the database
      
      console.log('Organization created with ID:', organizationId);
      setActivationStep('Setting up competitors and topics...');
      
      // Step 2: Create intelligence targets (competitors and topics)
      const targetPromises = [];
      
      // Add competitors as intelligence targets
      discoveredData.competitors
        .filter(c => selectedItems.competitors.includes(c.id))
        .forEach(competitor => {
          targetPromises.push(
            fetch(`${API_BASE_URL}/organizations/targets`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
              body: JSON.stringify({
                organization_id: organizationId,
                name: competitor.name,
                type: 'competitor',
                priority: competitor.priority || 'medium',
                metadata: {
                  marketCap: competitor.marketCap,
                  similarity: competitor.similarity,
                  reason: competitor.reason
                }
              })
            })
          );
        });
      
      // Add topics as intelligence targets
      discoveredData.topics
        .filter(t => selectedItems.topics.includes(t.id))
        .forEach(topic => {
          targetPromises.push(
            fetch(`${API_BASE_URL}/organizations/targets`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
              body: JSON.stringify({
                organization_id: organizationId,
                name: topic.name,
                type: 'topic',
                priority: topic.priority || 'medium',
                metadata: {
                  trending: topic.trending,
                  reason: topic.reason
                }
              })
            })
          );
        });
      
      const targetResults = await Promise.allSettled(targetPromises);
      const failedTargets = targetResults.filter(r => r.status === 'rejected');
      if (failedTargets.length > 0) {
        console.warn(`Failed to create ${failedTargets.length} targets:`, failedTargets);
      }
      console.log('Intelligence targets created');
      
      setActivationStep('Configuring monitoring sources...');
      
      // Step 3: Configure organization-specific monitoring sources
      const sourceResponse = await fetch(`${API_BASE_URL}/source-config/configure-sources`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          organizationId,
          organization: {
            name: orgData.name,
            industry: discoveredData.industry,
            url: orgData.url
          },
          competitors: discoveredData.competitors.filter(c => selectedItems.competitors.includes(c.id)),
          topics: discoveredData.topics.filter(t => selectedItems.topics.includes(t.id))
        })
      });
      
      if (sourceResponse.ok) {
        const sourceResult = await sourceResponse.json();
        console.log('Sources configured:', sourceResult.message);
        console.log('Source details:', sourceResult.sources);
      } else {
        const errorText = await sourceResponse.text();
        console.error('Source configuration failed:', sourceResponse.status, errorText);
        setActivationStep(`Warning: Source configuration incomplete`);
        // Don't throw - continue with setup even if sources fail
      }
      
      setActivationStep('Initializing monitoring system...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Prepare the complete organization data to pass to parent
      const selected = {
        organizationId, // Now using the real database ID
        company: orgData.name,
        url: orgData.url,
        industry: discoveredData.industry,
        overview: orgData.description,
        stakeholders: [
          ...discoveredData.competitors
            .filter(c => selectedItems.competitors.includes(c.id))
            .map(c => ({
              id: c.id,
              name: c.name,
              type: 'competitor',
              priority: c.priority,
              keywords: [c.name.toLowerCase()],
              topics: ['competitive intelligence']
            })),
          ...discoveredData.topics
            .filter(t => selectedItems.topics.includes(t.id))
            .map(t => ({
              id: t.id,
              name: t.name,
              type: 'topic',
              priority: t.priority,
              keywords: t.name.toLowerCase().split(' '),
              topics: [t.name]
            }))
        ]
      };
      
      setActivationStep('Ready! Launching monitoring dashboard...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      onSetupComplete(selected);
      
    } catch (error) {
      console.error('Setup failed:', error);
      console.error('Full error details:', error.message, error.stack);
      setActivationStep(`Setup failed: ${error.message}`);
      
      // Show user-friendly error message
      alert(`Setup encountered an issue: ${error.message}\n\nThe system will continue in limited mode. Please check the console for details.`);
      
      // Fallback to temporal ID if API calls fail
      const fallbackId = `org-${Date.now()}`;
      console.warn('Using fallback temporal ID:', fallbackId);
      
      onSetupComplete({
        organizationId: fallbackId,
        company: orgData.name,
        url: orgData.url,
        industry: discoveredData.industry,
        overview: orgData.description,
        stakeholders: []
      });
    }
    
    setIsActivating(false);
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Step 1: Organization Input */}
      {step === 1 && (
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '3rem',
          border: '1px solid #e5e7eb',
          textAlign: 'center'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 2rem'
          }}>
            <Building2 size={40} style={{ color: 'white' }} />
          </div>
          
          <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#111827' }}>
            Let's Set Up Your Intelligence System
          </h2>
          <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
            Enter your organization details and we'll automatically discover what to monitor
          </p>
          
          <div style={{ maxWidth: '500px', margin: '0 auto' }}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontSize: '0.875rem', 
                color: '#374151', 
                fontWeight: '500',
                textAlign: 'left'
              }}>
                Organization Name *
              </label>
              <input
                type="text"
                value={orgData.name}
                onChange={(e) => setOrgData({ ...orgData, name: e.target.value })}
                placeholder="e.g., Acme Corporation"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  fontSize: '1rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '0.5rem'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontSize: '0.875rem', 
                color: '#374151', 
                fontWeight: '500',
                textAlign: 'left'
              }}>
                Website URL (Optional but recommended)
              </label>
              <input
                type="url"
                value={orgData.url}
                onChange={(e) => setOrgData({ ...orgData, url: e.target.value })}
                placeholder="https://www.example.com"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  fontSize: '1rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem'
                }}
                onKeyPress={(e) => e.key === 'Enter' && orgData.name && analyzeOrganization()}
              />
              <p style={{ 
                margin: '0.25rem 0 0 0', 
                fontSize: '0.75rem', 
                color: '#9ca3af',
                textAlign: 'left'
              }}>
                Helps us identify the correct organization and find more accurate competitors
              </p>
            </div>
            
            <button
              onClick={analyzeOrganization}
              disabled={!orgData.name || isAnalyzing}
              style={{
                width: '100%',
                padding: '1rem 2rem',
                background: orgData.name ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#e5e7eb',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: orgData.name ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              {isAnalyzing ? (
                <>
                  <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} />
                  Analyzing Organization...
                </>
              ) : (
                <>
                  <Brain size={20} />
                  Analyze & Discover Targets
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Review Discovered Data */}
      {step === 2 && (
        <div style={{ position: 'relative' }}>
          {/* Activation Progress Overlay */}
          {isActivating && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '1rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 100
            }}>
              <div style={{
                background: 'white',
                borderRadius: '1rem',
                padding: '3rem',
                boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                textAlign: 'center',
                maxWidth: '400px'
              }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 2rem',
                  animation: 'pulse 2s infinite'
                }}>
                  <Zap size={40} style={{ color: 'white' }} />
                </div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#111827' }}>
                  Activating Monitoring
                </h3>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  color: '#6366f1',
                  marginBottom: '1rem'
                }}>
                  <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} />
                  <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                    {activationStep}
                  </span>
                </div>
                <div style={{
                  width: '100%',
                  height: '4px',
                  background: '#e5e7eb',
                  borderRadius: '2px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    animation: 'progress 3s ease-in-out'
                  }}/>
                </div>
              </div>
            </div>
          )}
          
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '1rem 1rem 0 0',
            padding: '2rem',
            color: 'white'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <CheckCircle size={32} />
              <div>
                <h2 style={{ margin: 0, fontSize: '1.75rem' }}>
                  Intelligence Targets Discovered
                </h2>
                <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9 }}>
                  We've identified key competitors, topics, and stakeholders for {orgData.name}
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div style={{
            background: 'white',
            borderRadius: '0 0 1rem 1rem',
            padding: '2rem',
            border: '1px solid #e5e7eb',
            borderTop: 'none'
          }}>
            {/* Industry Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              background: '#f3f4f6',
              borderRadius: '2rem',
              marginBottom: '2rem'
            }}>
              <Globe size={16} />
              <span style={{ fontSize: '0.875rem', color: '#374151' }}>
                Industry: <strong>{discoveredData.industry}</strong>
              </span>
            </div>

            {/* Competitors Section */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.25rem', margin: 0, color: '#111827', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Building2 size={20} />
                  Competitors to Monitor
                </h3>
                <button
                  onClick={() => setShowAddCompetitor(true)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#6366f1',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                >
                  <Plus size={16} />
                  Add Competitor
                </button>
              </div>
              
              {/* Add Competitor Form */}
              {showAddCompetitor && (
                <div style={{
                  padding: '1rem',
                  background: '#f0f9ff',
                  border: '2px solid #6366f1',
                  borderRadius: '0.5rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 150px 120px auto', gap: '0.5rem', alignItems: 'end' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: '#6b7280', display: 'block', marginBottom: '0.25rem' }}>
                        Competitor Name
                      </label>
                      <input
                        type="text"
                        value={newCompetitor.name}
                        onChange={(e) => setNewCompetitor({ ...newCompetitor, name: e.target.value })}
                        placeholder="e.g., Competitor Corp"
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: '1px solid #e5e7eb',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: '#6b7280', display: 'block', marginBottom: '0.25rem' }}>
                        Market Cap
                      </label>
                      <input
                        type="text"
                        value={newCompetitor.marketCap}
                        onChange={(e) => setNewCompetitor({ ...newCompetitor, marketCap: e.target.value })}
                        placeholder="e.g., $1B"
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: '1px solid #e5e7eb',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem'
                        }}
                      />
                    </div>
                    <select
                      value={newCompetitor.priority}
                      onChange={(e) => setNewCompetitor({ ...newCompetitor, priority: e.target.value })}
                      style={{
                        padding: '0.5rem',
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem'
                      }}
                    >
                      <option value="high">High Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="low">Low Priority</option>
                    </select>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={addCompetitor}
                        style={{
                          padding: '0.5rem',
                          background: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.375rem',
                          cursor: 'pointer'
                        }}
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={() => setShowAddCompetitor(false)}
                        style={{
                          padding: '0.5rem',
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.375rem',
                          cursor: 'pointer'
                        }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {discoveredData.competitors.map(comp => (
                  <div
                    key={comp.id}
                    style={{
                      padding: '1rem',
                      background: selectedItems.competitors.includes(comp.id) ? '#eef2ff' : '#f9fafb',
                      border: `2px solid ${selectedItems.competitors.includes(comp.id) ? '#6366f1' : '#e5e7eb'}`,
                      borderRadius: '0.5rem',
                      transition: 'all 0.2s',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div 
                      style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, cursor: 'pointer' }}
                      onClick={() => toggleSelection('competitors', comp.id)}
                    >
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        border: `2px solid ${selectedItems.competitors.includes(comp.id) ? '#6366f1' : '#d1d5db'}`,
                        background: selectedItems.competitors.includes(comp.id) ? '#6366f1' : 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {selectedItems.competitors.includes(comp.id) && (
                          <Check size={14} style={{ color: 'white' }} />
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        {editingCompetitor === comp.id ? (
                          <input
                            type="text"
                            value={comp.name}
                            onChange={(e) => updateCompetitor(comp.id, { name: e.target.value })}
                            onBlur={() => setEditingCompetitor(null)}
                            onKeyPress={(e) => e.key === 'Enter' && setEditingCompetitor(null)}
                            style={{
                              padding: '0.25rem 0.5rem',
                              border: '1px solid #6366f1',
                              borderRadius: '0.25rem',
                              fontSize: '1rem',
                              fontWeight: '600'
                            }}
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <div style={{ fontWeight: '600', color: '#111827' }}>{comp.name}</div>
                        )}
                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                          {comp.marketCap} • Similarity: {Math.round(comp.similarity * 100)}%
                          {comp.custom && ' • Custom'}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        background: comp.priority === 'high' ? '#fee2e2' : comp.priority === 'medium' ? '#fef3c7' : '#f3f4f6',
                        color: comp.priority === 'high' ? '#dc2626' : comp.priority === 'medium' ? '#f59e0b' : '#6b7280',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}>
                        {comp.priority.toUpperCase()}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingCompetitor(comp.id);
                        }}
                        style={{
                          padding: '0.25rem',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#6b7280'
                        }}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteCompetitor(comp.id);
                        }}
                        style={{
                          padding: '0.25rem',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#ef4444'
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Topics Section */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.25rem', margin: 0, color: '#111827', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Hash size={20} />
                  Topics to Track
                </h3>
                <button
                  onClick={() => setShowAddTopic(true)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#f59e0b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                >
                  <Plus size={16} />
                  Add Topic
                </button>
              </div>
              
              {/* Add Topic Form */}
              {showAddTopic && (
                <div style={{
                  padding: '1rem',
                  background: '#fffbeb',
                  border: '2px solid #f59e0b',
                  borderRadius: '0.5rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 120px 120px auto', gap: '0.5rem', alignItems: 'end' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: '#6b7280', display: 'block', marginBottom: '0.25rem' }}>
                        Topic Name
                      </label>
                      <input
                        type="text"
                        value={newTopic.name}
                        onChange={(e) => setNewTopic({ ...newTopic, name: e.target.value })}
                        placeholder="e.g., AI in Healthcare"
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: '1px solid #e5e7eb',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem'
                        }}
                      />
                    </div>
                    <select
                      value={newTopic.priority}
                      onChange={(e) => setNewTopic({ ...newTopic, priority: e.target.value })}
                      style={{
                        padding: '0.5rem',
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem'
                      }}
                    >
                      <option value="high">High Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="low">Low Priority</option>
                    </select>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.875rem',
                      color: '#374151',
                      cursor: 'pointer'
                    }}>
                      <input
                        type="checkbox"
                        checked={newTopic.trending}
                        onChange={(e) => setNewTopic({ ...newTopic, trending: e.target.checked })}
                      />
                      Trending
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={addTopic}
                        style={{
                          padding: '0.5rem',
                          background: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.375rem',
                          cursor: 'pointer'
                        }}
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={() => setShowAddTopic(false)}
                        style={{
                          padding: '0.5rem',
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.375rem',
                          cursor: 'pointer'
                        }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                {discoveredData.topics.map(topic => (
                  <div
                    key={topic.id}
                    style={{
                      padding: '1rem',
                      background: selectedItems.topics.includes(topic.id) ? '#fef3c7' : '#f9fafb',
                      border: `2px solid ${selectedItems.topics.includes(topic.id) ? '#f59e0b' : '#e5e7eb'}`,
                      borderRadius: '0.5rem',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      position: 'relative'
                    }}
                  >
                    <div 
                      style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, cursor: 'pointer' }}
                      onClick={() => toggleSelection('topics', topic.id)}
                    >
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        border: `2px solid ${selectedItems.topics.includes(topic.id) ? '#f59e0b' : '#d1d5db'}`,
                        background: selectedItems.topics.includes(topic.id) ? '#f59e0b' : 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {selectedItems.topics.includes(topic.id) && (
                          <Check size={14} style={{ color: 'white' }} />
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        {editingTopic === topic.id ? (
                          <input
                            type="text"
                            value={topic.name}
                            onChange={(e) => updateTopic(topic.id, { name: e.target.value })}
                            onBlur={() => setEditingTopic(null)}
                            onKeyPress={(e) => e.key === 'Enter' && setEditingTopic(null)}
                            style={{
                              padding: '0.25rem 0.5rem',
                              border: '1px solid #f59e0b',
                              borderRadius: '0.25rem',
                              fontSize: '0.875rem',
                              fontWeight: '500',
                              width: '100%'
                            }}
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <div style={{ fontWeight: '500', color: '#111827', fontSize: '0.875rem' }}>
                            {topic.name}
                          </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                          {topic.trending && (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              fontSize: '0.75rem',
                              color: '#10b981'
                            }}>
                              <TrendingUp size={12} />
                              Trending
                            </span>
                          )}
                          {topic.custom && (
                            <span style={{
                              fontSize: '0.75rem',
                              color: '#6b7280'
                            }}>
                              • Custom
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div style={{
                      position: 'absolute',
                      top: '0.5rem',
                      right: '0.5rem',
                      display: 'flex',
                      gap: '0.25rem'
                    }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingTopic(topic.id);
                        }}
                        style={{
                          padding: '0.25rem',
                          background: 'rgba(255, 255, 255, 0.8)',
                          border: 'none',
                          borderRadius: '0.25rem',
                          cursor: 'pointer',
                          color: '#6b7280'
                        }}
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTopic(topic.id);
                        }}
                        style={{
                          padding: '0.25rem',
                          background: 'rgba(255, 255, 255, 0.8)',
                          border: 'none',
                          borderRadius: '0.25rem',
                          cursor: 'pointer',
                          color: '#ef4444'
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Stakeholders */}
            <div style={{
              padding: '1rem',
              background: '#f9fafb',
              borderRadius: '0.5rem',
              marginBottom: '2rem'
            }}>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#6b7280' }}>
                We'll also monitor these stakeholders:
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {Object.entries(discoveredData.stakeholders).map(([type, items]) => 
                  items.map(item => (
                    <span key={`${type}-${item}`} style={{
                      padding: '0.25rem 0.5rem',
                      background: 'white',
                      borderRadius: '0.25rem',
                      fontSize: '0.75rem',
                      color: '#374151',
                      border: '1px solid #e5e7eb'
                    }}>
                      {item}
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Actions */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: '1rem',
              borderTop: '1px solid #e5e7eb'
            }}>
              <button
                onClick={() => {
                  setStep(1);
                  setSelectedItems({ competitors: [], topics: [], stakeholders: [] });
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'white',
                  color: '#6b7280',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <RefreshCw size={18} />
                Start Over
              </button>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  {selectedItems.competitors.length + selectedItems.topics.length} targets selected
                </span>
                <button
                  onClick={handleComplete}
                  disabled={selectedItems.competitors.length === 0 && selectedItems.topics.length === 0 || isActivating}
                  style={{
                    padding: '0.75rem 2rem',
                    background: (selectedItems.competitors.length > 0 || selectedItems.topics.length > 0) && !isActivating
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      : '#e5e7eb',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: (selectedItems.competitors.length > 0 || selectedItems.topics.length > 0) && !isActivating
                      ? 'pointer'
                      : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontWeight: '600',
                    minWidth: '200px',
                    justifyContent: 'center'
                  }}
                >
                  {isActivating ? (
                    <>
                      <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
                      Activating...
                    </>
                  ) : (
                    <>
                      <Zap size={18} />
                      Activate Monitoring
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutomatedOrganizationSetup;