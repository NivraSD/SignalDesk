import React, { useState, useEffect } from 'react';
import { 
  Target, 
  TrendingUp, 
  Zap, 
  Brain, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  ArrowRight,
  Lightbulb,
  BarChart3,
  Users,
  FileText,
  Send,
  RefreshCw,
  Sparkles,
  Rocket,
  Shield,
  Eye,
  Activity,
  X,
  ChevronRight,
  Award,
  AlertCircle,
  Radio
} from 'lucide-react';
import apiService from '../../services/apiService';
import claudeService from '../../services/claudeService';
import { useIntelligence } from '../../context/IntelligenceContext';
import OpportunityDashboard from './OpportunityDashboard';

const OpportunityExecution = ({ organizationId, organizationName = "Your Organization" }) => {
  // Get context data
  const { 
    opportunityData, 
    updateOpportunityData,
    intelligenceData: contextIntelligenceData,
    isDataStale
  } = useIntelligence();
  
  // Add view mode state
  const [viewMode, setViewMode] = useState('live'); // 'live' or 'static'

  // Add CSS animations
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.1); opacity: 0.8; }
      }
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);
  
  // State management - use context data if available
  const [organizationAnalysis, setOrganizationAnalysis] = useState(opportunityData.analysis);
  const [opportunityConcepts, setOpportunityConcepts] = useState(opportunityData.concepts || []);
  const [selectedConcept, setSelectedConcept] = useState(opportunityData.selectedConcept);
  const [executionPlan, setExecutionPlan] = useState(opportunityData.executionPlan);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [showConceptDetail, setShowConceptDetail] = useState(null);
  const [currentStep, setCurrentStep] = useState('analysis');

  // Load intelligence data from dashboard
  const [intelligenceData, setIntelligenceData] = useState({
    competitors: [],
    topics: [],
    opportunities: []
  });

  // Update context when local state changes
  useEffect(() => {
    updateOpportunityData({
      analysis: organizationAnalysis,
      concepts: opportunityConcepts,
      selectedConcept,
      executionPlan
    });
  }, [organizationAnalysis, opportunityConcepts, selectedConcept, executionPlan]);

  // Track previous targets to detect changes
  const [previousTargets, setPreviousTargets] = useState(null);

  useEffect(() => {
    if (organizationId && (!intelligenceData.competitors.length || isDataStale(opportunityData.lastAnalysis))) {
      loadIntelligenceData();
    }
  }, [organizationId]);

  // Auto-analyze when intelligence data is loaded (but add a small delay for better UX)
  useEffect(() => {
    if (intelligenceData.competitors.length > 0 && intelligenceData.topics.length > 0 && !organizationAnalysis && !analyzing) {
      const timer = setTimeout(() => {
        analyzeOrganizationPosition();
      }, 500); // Small delay to show the UI first
      return () => clearTimeout(timer);
    }
  }, [intelligenceData.competitors, intelligenceData.topics]);

  const loadIntelligenceData = async () => {
    try {
      setLoading(true);
      
      // Get targets and analyses from Intelligence Dashboard
      const targets = await apiService.getOrganizationTargets(organizationId);
      
      // Separate competitors and topics
      const competitors = targets.filter(t => t.type === 'competitor');
      const topics = targets.filter(t => t.type === 'topic');
      
      // Get recent analyses for context
      const competitorAnalyses = await Promise.all(
        competitors.slice(0, 5).map(async (competitor) => {
          try {
            const analysis = await apiService.analyzeCompetitor({
              competitorName: competitor.name,
              organizationId,
              organizationName,
              targetId: competitor.id
            });
            return { ...competitor, analysis: analysis.analysis };
          } catch (err) {
            console.error(`Failed to analyze ${competitor.name}:`, err);
            return { ...competitor, analysis: null };
          }
        })
      );

      const topicAnalyses = await Promise.all(
        topics.slice(0, 5).map(async (topic) => {
          try {
            const analysis = await apiService.analyzeTopic({
              topicName: topic.name,
              organizationId,
              organizationName,
              targetId: topic.id
            });
            return { ...topic, analysis: analysis.analysis };
          } catch (err) {
            console.error(`Failed to analyze ${topic.name}:`, err);
            return { ...topic, analysis: null };
          }
        })
      );

      setIntelligenceData({
        competitors: competitorAnalyses,
        topics: topicAnalyses,
        opportunities: [] // Will be populated from analyses
      });
      
      // Create target fingerprint to detect changes
      const currentTargets = {
        competitors: competitors.map(c => c.id).sort().join(','),
        topics: topics.map(t => t.id).sort().join(',')
      };
      
      // Check if targets have changed
      if (previousTargets && 
          (previousTargets.competitors !== currentTargets.competitors || 
           previousTargets.topics !== currentTargets.topics)) {
        console.log('Intelligence targets have changed, resetting opportunity analysis');
        
        // Reset all opportunity data
        updateOpportunityData({
          analysis: null,
          concepts: [],
          selectedConcept: null,
          executionPlan: null
        });
        
        // Reset local state
        setOrganizationAnalysis(null);
        setOpportunityConcepts([]);
        setSelectedConcept(null);
        setExecutionPlan(null);
        setCurrentStep('analysis');
        
        // Show notification to user
        setError('Intelligence targets have changed. Please run a new analysis.');
        setTimeout(() => setError(null), 5000);
      }
      
      // Update previous targets
      setPreviousTargets(currentTargets);
      
    } catch (err) {
      console.error('Error loading intelligence data:', err);
      setError('Failed to load intelligence data');
    } finally {
      setLoading(false);
    }
  };

  const analyzeOrganizationPosition = async () => {
    setAnalyzing(true);
    setError(null);
    
    try {
      // Use creative agent approach for better opportunities
      const response = await apiService.analyzeOpportunityPosition({
        organizationId,
        organizationName,
        competitors: intelligenceData.competitors,
        topics: intelligenceData.topics,
        useCreativeAgent: true
      });

      if (response.success) {
        setOrganizationAnalysis(response.analysis);
        
        // Auto-generate concepts after analysis
        if (response.analysis.opportunities && response.analysis.opportunities.length > 0) {
          setTimeout(() => {
            generateOpportunityConcepts(response.analysis);
          }, 1000);
        }
      } else {
        throw new Error(response.message || 'Failed to analyze position');
      }
      
    } catch (err) {
      console.error('Error analyzing organization position:', err);
      setError('Failed to analyze organization position');
    } finally {
      setAnalyzing(false);
    }
  };

  const generateOpportunityConcepts = async (analysis = null) => {
    console.log('Starting concept generation...');
    setLoading(true);
    setError(null);
    
    try {
      // Use passed analysis or state
      const currentAnalysis = analysis || organizationAnalysis;
      
      // Check if we have organization analysis
      if (!currentAnalysis) {
        throw new Error('Please complete the organization analysis first');
      }
      
      // Build comprehensive context from analysis
      const analysisContext = currentAnalysis.fullAnalysis || currentAnalysis;
      
      const conceptPrompt = `Based on the strategic analysis and thought leadership opportunities identified, create actionable PR campaign concepts.

**Organization Context:**
${organizationName}

**Strategic Strengths Identified:**
${currentAnalysis?.strengths?.join('\n• ') || 'Strong market position and expertise'}

**Thought Leadership Opportunities:**
${currentAnalysis?.opportunities?.map(o => o.name).join('\n• ') || 'Strategic market opportunities'}

**Your Task:**
Transform the strategic opportunities into 3-5 executable PR campaign concepts. Each concept should leverage the identified strengths and address specific market gaps.

For each concept, provide:
- name: Campaign name that captures the essence
- type: thought_leadership, differentiation, news_hijacking, partnership, or market_education
- description: Clear explanation of the campaign approach (2-3 sentences)
- keyMessage: Core positioning statement
- targetAudience: Primary media and stakeholder targets
- contentPlan: Specific deliverables (press releases, reports, events, etc.)
- timeSensitivity: immediate, this_week, or this_month
- resourceRequirement: low, medium, or high
- expectedOutcome: Business impact and PR results

Return as a JSON array. Focus on campaigns that can establish thought leadership while driving business results.`;

      const conceptsResponse = await claudeService.sendMessage(conceptPrompt);
      console.log('Concepts response:', conceptsResponse);
      
      // Parse concepts using robust extraction methods from Campaign Intelligence
      let concepts = [];
      try {
        // If response is already an array (from mock), use it directly
        if (Array.isArray(conceptsResponse)) {
          concepts = conceptsResponse;
        } else if (typeof conceptsResponse === 'string') {
          let jsonString = conceptsResponse;
          
          // Method 1: Clean markdown code blocks
          jsonString = jsonString
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .replace(/[\u0000-\u001F]+/g, '')
            .trim();
          
          // Method 2: Look for JSON array pattern
          const arrayMatch = jsonString.match(/\[[\s\S]*\]/);
          if (arrayMatch) {
            jsonString = arrayMatch[0];
          }
          
          // Method 3: Extract JSON between first [ and last ]
          const jsonStartIndex = jsonString.indexOf('[');
          const jsonEndIndex = jsonString.lastIndexOf(']');
          if (jsonStartIndex !== -1 && jsonEndIndex !== -1 && jsonEndIndex > jsonStartIndex) {
            jsonString = jsonString.substring(jsonStartIndex, jsonEndIndex + 1);
          }
          
          console.log('Attempting to parse JSON of length:', jsonString.length);
          console.log('First 200 chars:', jsonString.substring(0, 200));
          
          // Try to parse the cleaned JSON
          try {
            concepts = JSON.parse(jsonString);
            
            // Validate structure and add missing fields if needed
            if (Array.isArray(concepts)) {
              concepts = concepts.map((concept, idx) => ({
                id: concept.id || idx + 1,
                name: concept.name || concept.title || `Campaign ${idx + 1}`,
                type: concept.type || 'thought_leadership',
                timeSensitivity: concept.timeSensitivity || concept.timing || 'this_week',
                resourceRequirement: concept.resourceRequirement || concept.resources || 'medium',
                targetAudience: concept.targetAudience || concept.audience || 'Industry media and stakeholders',
                keyMessage: concept.keyMessage || concept.coreMessage || concept.message || 'Strategic positioning',
                description: concept.description || concept.summary || 'Strategic PR campaign opportunity',
                contentPlan: concept.contentPlan || concept.executionPreview || 'Integrated PR campaign',
                expectedOutcome: concept.expectedOutcome || concept.impact || 'Establish thought leadership',
                // Keep NVS for internal ranking but don't display
                nvsScore: concept.nvsScore || 75,
                riskLevel: 'moderate'
              }));
            }
          } catch (innerParseError) {
            console.log('JSON parse failed, trying text extraction');
            concepts = parseConceptsFromText(conceptsResponse);
          }
        }
      } catch (parseError) {
        console.error('Error parsing concepts:', parseError);
        concepts = parseConceptsFromText(conceptsResponse);
      }
      
      console.log('Parsed concepts:', concepts);
      
      // Validate we have concepts
      if (!Array.isArray(concepts)) {
        concepts = [];
      }
      
      // Only use concepts if we successfully parsed some
      if (concepts.length > 0) {
        console.log(`Successfully generated ${concepts.length} opportunity concepts`);
        setOpportunityConcepts(concepts);
      } else {
        console.log('No concepts could be parsed from response');
        // Don't use fallback - instead show error and let user retry
        setOpportunityConcepts([]);
      }
      
      // Stay on concepts step to show them
      if (concepts.length > 0) {
        // Concepts are shown in 'concepts' step
        // User will select one to move to execution
      } else {
        setError('No concepts were generated. Please try again.');
      }
      
    } catch (err) {
      console.error('Error generating opportunity concepts:', err);
      setError('Failed to generate opportunity concepts');
    } finally {
      setLoading(false);
    }
  };

  const selectConcept = async (concept) => {
    setSelectedConcept(concept);
    setLoading(true);
    
    // Add small delay for UX
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      // Generate detailed execution plan
      const executionPrompt = `Create a detailed execution plan for the selected opportunity concept. This should bridge to SignalDesk's other components for automated execution.

**Selected Concept:**
${JSON.stringify(concept, null, 2)}

**Execution Plan Requirements:**

1. **Content Strategy:**
   - Primary content piece (press release, thought leadership article, etc.)
   - Supporting content (social posts, blog content, email sequences)
   - Key messages and talking points
   - Content Generator prompts for each piece

2. **Media Strategy:**
   - Target journalist personas
   - Media outlets by tier (Tier 1, 2, 3)
   - Pitch angles by outlet type
   - Media List Builder criteria and filters

3. **Campaign Timeline:**
   - Pre-launch preparation (Week -2 to -1)
   - Launch week activities (Day 1-7)
   - Follow-up and amplification (Week 2-4)
   - Campaign Intelligence monitoring setup

4. **Success Metrics:**
   - Media coverage targets (reach, sentiment, outlet quality)
   - Engagement metrics (social, website, leads)
   - Competitive response indicators
   - ROI measurement approach

5. **Risk Mitigation:**
   - Potential negative responses and responses
   - Competitor reaction scenarios
   - Crisis communication backup plans
   - Legal/compliance considerations

6. **SignalDesk Integration:**
   - Content Generator specifications for each piece
   - Media List Builder queries and filters
   - Campaign Intelligence monitoring keywords
   - Automated workflow suggestions

Provide actionable, detailed execution plan that leverages SignalDesk's full platform capabilities.`;

      const planResponse = await claudeService.sendMessage(executionPrompt);
      
      // Ensure planResponse is a string
      const planText = typeof planResponse === 'string' 
        ? planResponse 
        : planResponse.message || planResponse.content || JSON.stringify(planResponse);
      
      setExecutionPlan({
        concept: concept,
        plan: planText,
        timestamp: new Date().toISOString(),
        status: 'ready'
      });
      
      setCurrentStep('execution');
      
    } catch (err) {
      console.error('Error creating execution plan:', err);
      setError('Failed to create execution plan');
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const extractCRSScore = (analysis) => {
    const scoreMatch = analysis.match(/CRS.*?(\d+)/i);
    return scoreMatch ? parseInt(scoreMatch[1]) : 65; // Default reasonable score
  };

  const extractKeyOpportunities = (analysis) => {
    // Extract key opportunities from analysis text
    const lines = analysis.split('\n').filter(line => 
      line.includes('opportunity') || line.includes('gap') || line.includes('vacuum')
    );
    return lines.slice(0, 3);
  };

  const extractRiskLevel = (analysis) => {
    if (analysis.toLowerCase().includes('high risk') || analysis.toLowerCase().includes('bold')) return 'high';
    if (analysis.toLowerCase().includes('moderate') || analysis.toLowerCase().includes('medium')) return 'medium';
    return 'low';
  };

  const generateFallbackConcepts = (orgName, analysis) => {
    // Generate default concepts based on thought leadership opportunities
    
    return [
      {
        id: 1,
        name: "Industry Innovation Leadership Campaign",
        type: "thought_leadership",
        timeSensitivity: "this_week",
        resourceRequirement: "medium",
        targetAudience: "C-suite executives, industry analysts, and trade media",
        keyMessage: `${orgName} is pioneering the future of the industry through innovative approaches`,
        description: "Launch a comprehensive thought leadership campaign positioning your executives as industry visionaries, leveraging your unique strengths to address market gaps.",
        contentPlan: "Executive byline series, industry research report, media tour, speaking opportunities",
        expectedOutcome: "Establish category leadership and drive inbound opportunities",
        nvsScore: 85
      },
      {
        id: 2,
        name: "Competitive Differentiation Narrative",
        type: "differentiation",
        timeSensitivity: "immediate",
        resourceRequirement: "low",
        targetAudience: "Business media, customers, and partners",
        keyMessage: `${orgName}'s unique approach delivers superior outcomes where others fall short`,
        description: "Create and amplify a compelling differentiation narrative that highlights your strengths against competitor weaknesses in key market areas.",
        contentPlan: "Press release series, customer success stories, comparison guides, social campaign",
        expectedOutcome: "Clear market positioning and increased win rates",
        nvsScore: 78
      },
      {
        id: 3,
        name: "Market Education Initiative",
        type: "market_education",
        timeSensitivity: "this_month",
        resourceRequirement: "high",
        targetAudience: "Industry stakeholders, analysts, and decision makers",
        keyMessage: `${orgName} is shaping industry best practices and standards`,
        description: "Lead market education on emerging trends and challenges, positioning your organization as the trusted advisor and solution provider.",
        contentPlan: "White paper series, webinar program, industry benchmarking study, advisory board",
        expectedOutcome: "Thought leadership recognition and market influence",
        nvsScore: 72
      }
    ];
  };

  const parseStrategicAnalysis = (analysisText) => {
    const result = {
      strengths: [],
      opportunities: [],
      readiness: {
        successFactors: [],
        challenges: [],
        resources: ''
      }
    };

    const sections = analysisText.split(/\n(?=\d+\.|[A-Z][A-Z\s]+:)/);
    
    sections.forEach(section => {
      const sectionLower = section.toLowerCase();
      
      // Parse Strengths
      if (sectionLower.includes('strength') || sectionLower.includes('capabilities')) {
        const strengthLines = section.split('\n').filter(line => 
          line.match(/^[•\-*]/) || line.match(/^\d+\./)
        );
        
        strengthLines.forEach(line => {
          const cleanLine = line.replace(/^[•\-*\d.]\s*/, '').trim();
          if (cleanLine && !cleanLine.toLowerCase().includes('strength')) {
            result.strengths.push(cleanLine);
          }
        });
      }
      
      // Parse Thought Leadership Opportunities
      if (sectionLower.includes('thought leadership') || sectionLower.includes('opportunities')) {
        const oppText = section;
        const oppSections = oppText.split(/(?:^|\n)(?:Opportunity \d+:|^\d+\.|Name:)/gm);
        
        oppSections.forEach((oppSection, idx) => {
          if (oppSection.trim() && idx > 0) {
            const opportunity = {
              name: '',
              rationale: '',
              angle: '',
              contentIdeas: [],
              audience: '',
              impact: '',
              timing: ''
            };
            
            const lines = oppSection.split('\n');
            lines.forEach(line => {
              const lineLower = line.toLowerCase();
              const cleanLine = line.replace(/^[•\-*]\s*/, '').trim();
              
              if (lineLower.includes('name:') || idx === 1 && !opportunity.name) {
                opportunity.name = cleanLine.replace(/name:\s*/i, '').trim();
              } else if (lineLower.includes('rationale:')) {
                opportunity.rationale = cleanLine.replace(/.*rationale:\s*/i, '').trim();
              } else if (lineLower.includes('angle:')) {
                opportunity.angle = cleanLine.replace(/.*angle:\s*/i, '').trim();
              } else if (lineLower.includes('content ideas:')) {
                // Continue to next lines for content ideas
              } else if (lineLower.includes('audience:')) {
                opportunity.audience = cleanLine.replace(/.*audience:\s*/i, '').trim();
              } else if (lineLower.includes('impact:')) {
                opportunity.impact = cleanLine.replace(/.*impact:\s*/i, '').trim();
              } else if (lineLower.includes('timing:')) {
                opportunity.timing = cleanLine.replace(/.*timing:\s*/i, '').trim();
              } else if (opportunity.name && cleanLine && lineLower.match(/^[•\-*]/)) {
                // Likely a content idea
                opportunity.contentIdeas.push(cleanLine);
              }
            });
            
            if (opportunity.name) {
              result.opportunities.push(opportunity);
            }
          }
        });
      }
      
      // Parse Implementation Readiness
      if (sectionLower.includes('implementation') || sectionLower.includes('readiness')) {
        const lines = section.split('\n');
        let currentCategory = '';
        
        lines.forEach(line => {
          const lineLower = line.toLowerCase();
          const cleanLine = line.replace(/^[•\-*]\s*/, '').trim();
          
          if (lineLower.includes('success factor')) {
            currentCategory = 'success';
          } else if (lineLower.includes('challenge')) {
            currentCategory = 'challenges';
          } else if (lineLower.includes('resource')) {
            currentCategory = 'resources';
          } else if (cleanLine && line.match(/^[•\-*]/)) {
            if (currentCategory === 'success') {
              result.readiness.successFactors.push(cleanLine);
            } else if (currentCategory === 'challenges') {
              result.readiness.challenges.push(cleanLine);
            }
          }
        });
      }
    });

    // Fallback if parsing didn't work well
    if (result.strengths.length === 0) {
      result.strengths = [
        'Strong market position and brand recognition',
        'Established thought leadership capabilities',
        'Agile execution and decision-making processes'
      ];
    }
    
    if (result.opportunities.length === 0) {
      result.opportunities = [
        {
          name: 'Industry Innovation Leadership',
          rationale: 'Gap in market coverage on emerging technologies',
          angle: 'Position as the forward-thinking leader',
          contentIdeas: ['Executive insights series', 'Innovation report', 'Media interviews'],
          audience: 'C-suite executives and industry analysts',
          impact: 'Establish category leadership',
          timing: 'Q1 launch to set yearly narrative'
        }
      ];
    }

    return result;
  };

  const parseConceptsFromText = (text) => {
    // Improved fallback parsing for real Claude responses
    const concepts = [];
    
    // Try to parse numbered concepts (1. Name, 2. Name, etc.)
    const sections = text.split(/(?:^|\n)(?:\d+\.|\*\*\d+\.)/gm).slice(1);
    
    if (sections.length === 0) {
      // Try parsing by bold headers
      const boldSections = text.split(/\*\*[^*]+\*\*/g);
      if (boldSections.length > 1) {
        sections.push(...boldSections.slice(1));
      }
    }
    
    sections.forEach((section, idx) => {
      if (section.trim()) {
        const lines = section.trim().split('\n').filter(l => l.trim());
        const firstLine = lines[0]?.replace(/[*#]/g, '').trim() || `Opportunity ${idx + 1}`;
        
        // Extract NVS score if mentioned
        const nvsMatch = section.match(/NVS[:\s]+(\d+)/i);
        const nvsScore = nvsMatch ? parseInt(nvsMatch[1]) : 70 + Math.floor(Math.random() * 20);
        
        // Extract timing if mentioned
        const timingKeywords = {
          'immediate': 'immediate',
          'urgent': 'immediate',
          'this week': 'this_week',
          'next week': 'this_week',
          'this month': 'this_month',
          'next month': 'this_month'
        };
        
        let timeSensitivity = 'this_week';
        for (const [keyword, value] of Object.entries(timingKeywords)) {
          if (section.toLowerCase().includes(keyword)) {
            timeSensitivity = value;
            break;
          }
        }
        
        const concept = {
          id: idx + 1,
          name: firstLine.substring(0, 100),
          type: section.toLowerCase().includes('thought leadership') ? 'thought_leadership' : 
                section.toLowerCase().includes('differentiation') ? 'differentiation' :
                section.toLowerCase().includes('news') ? 'news_hijacking' : 'opportunity',
          nvsScore: nvsScore,
          timeSensitivity: timeSensitivity,
          resourceRequirement: section.toLowerCase().includes('low') ? 'low' :
                               section.toLowerCase().includes('high') ? 'high' : 'medium',
          riskLevel: section.toLowerCase().includes('bold') ? 'bold' :
                     section.toLowerCase().includes('safe') ? 'safe' : 'moderate',
          description: lines.slice(1).join(' ').substring(0, 300) || section.substring(0, 300),
          targetAudience: 'Industry media and analysts',
          keyMessage: lines.find(l => l.toLowerCase().includes('message')) || 'Strategic positioning',
          contentPlan: lines.find(l => l.toLowerCase().includes('content') || l.toLowerCase().includes('plan')) || 'Integrated PR campaign',
          expectedOutcome: lines.find(l => l.toLowerCase().includes('outcome') || l.toLowerCase().includes('result')) || 'Establish thought leadership'
        };
        concepts.push(concept);
      }
    });
    
    return concepts.slice(0, 5); // Limit to 5 concepts
  };

  const renderStepIndicator = () => {
    const steps = [
      { id: 'analysis', name: 'Position Analysis', icon: BarChart3 },
      { id: 'concepts', name: 'Concept Selection', icon: Lightbulb },
      { id: 'execution', name: 'Execution Plan', icon: Rocket }
    ];

    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        marginBottom: '2rem',
        padding: '1rem',
        background: 'white',
        borderRadius: '0.75rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isActive = currentStep === step.id;
          const isCompleted = steps.findIndex(s => s.id === currentStep) > idx;
          
          return (
            <div key={step.id} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                background: isActive ? '#6366f1' : isCompleted ? '#10b981' : '#f3f4f6',
                color: isActive || isCompleted ? 'white' : '#6b7280',
                fontWeight: isActive ? '600' : '500',
                transition: 'all 0.2s'
              }}>
                <Icon size={18} />
                <span>{step.name}</span>
                {isCompleted && <CheckCircle size={16} />}
              </div>
              {idx < steps.length - 1 && (
                <ArrowRight size={20} style={{ margin: '0 1rem', color: '#d1d5db' }} />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Mode Toggle Component
  const ModeToggle = () => (
    <div style={{
      display: 'flex',
      gap: '1rem',
      padding: '1rem 1.5rem',
      background: 'white',
      borderBottom: '1px solid #e5e7eb',
      alignItems: 'center',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <button
        onClick={() => setViewMode('live')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.75rem 1.5rem',
          background: viewMode === 'live' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f3f4f6',
          color: viewMode === 'live' ? 'white' : '#6b7280',
          border: 'none',
          borderRadius: '8px',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.2s'
        }}
      >
        <Radio size={18} style={{ animation: viewMode === 'live' ? 'pulse 2s infinite' : 'none' }} />
        Live Detection
      </button>
      <button
        onClick={() => setViewMode('static')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.75rem 1.5rem',
          background: viewMode === 'static' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f3f4f6',
          color: viewMode === 'static' ? 'white' : '#6b7280',
          border: 'none',
          borderRadius: '8px',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.2s'
        }}
      >
        <Activity size={18} />
        Static Analysis
      </button>
      <div style={{ marginLeft: 'auto', color: '#6b7280', fontSize: '0.875rem' }}>
        {viewMode === 'live' ? '🟢 Real-time opportunity detection active' : '📊 AI-powered strategic analysis'}
      </div>
    </div>
  );

  // Show live dashboard if in live mode
  if (viewMode === 'live') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <ModeToggle />
        <div style={{ flex: 1, overflow: 'auto', background: '#f8f9fa' }}>
          <OpportunityDashboard organizationId={organizationId} />
        </div>
      </div>
    );
  }

  // Static analysis mode
  return (
    <>
      <ModeToggle />
      <div style={{ 
        minHeight: 'calc(100vh - 60px)', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '2rem 0'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ 
            fontSize: '2.5rem', 
            fontWeight: '700', 
            color: 'white', 
            margin: '0 0 1rem 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem'
          }}>
            <Zap size={36} />
            Strategic Analysis Engine
          </h1>
          <p style={{ 
            fontSize: '1.25rem', 
            color: 'rgba(255,255,255,0.9)', 
            margin: 0,
            maxWidth: '600px',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}>
            Transform intelligence insights into executable PR opportunities with AI-powered strategy and automated execution
          </p>
          
          {/* Cache Management */}
          {opportunityData && opportunityData.lastAnalysis && (
            <div style={{
              marginTop: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem'
            }}>
              <span style={{
                fontSize: '0.875rem',
                color: 'rgba(255,255,255,0.7)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                <Clock size={16} />
                Last analysis: {new Date(opportunityData.lastAnalysis).toLocaleTimeString()}
              </span>
              <button
                onClick={() => {
                  if (window.confirm('Clear all cached opportunity data and start fresh?')) {
                    updateOpportunityData({
                      analysis: null,
                      concepts: [],
                      selectedConcept: null,
                      executionPlan: null
                    });
                    setOrganizationAnalysis(null);
                    setOpportunityConcepts([]);
                    setSelectedConcept(null);
                    setExecutionPlan(null);
                    setCurrentStep('analysis');
                  }
                }}
                style={{
                  padding: '0.25rem 0.75rem',
                  background: 'rgba(255,255,255,0.2)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '0.375rem',
                  color: 'white',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
                }}
              >
                <RefreshCw size={14} />
                Clear Cache
              </button>
            </div>
          )}
        </div>

        {/* Step Progress Indicator */}
        {currentStep && renderStepIndicator()}

        {/* Error Display */}
        {error && (
          <div style={{
            background: error.includes('targets have changed') ? '#fff7ed' : '#fee2e2',
            border: error.includes('targets have changed') ? '2px solid #fb923c' : '1px solid #fecaca',
            borderRadius: '0.5rem',
            padding: '1rem',
            marginBottom: '2rem',
            color: '#dc2626'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {error.includes('targets have changed') ? (
                <>
                  <RefreshCw size={20} style={{ color: '#f97316' }} />
                  <div>
                    <strong>Intelligence Targets Updated</strong>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#92400e' }}>
                      Your competitors or topics have changed. Previous analysis is no longer valid. Please run a new strategic analysis with the updated targets.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <AlertTriangle size={20} />
                  <span>{error}</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Initial State - Show when nothing is happening yet */}
        {!analyzing && !organizationAnalysis && !loading && (
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '4rem 2rem',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <Zap size={64} style={{ 
              color: '#6366f1', 
              marginBottom: '1.5rem'
            }} />
            <h2 style={{ 
              fontSize: '2rem', 
              fontWeight: '600', 
              margin: '0 0 1rem 0',
              color: '#111827'
            }}>
              Initializing Strategic Analysis
            </h2>
            <p style={{ 
              color: '#6b7280', 
              fontSize: '1.25rem', 
              maxWidth: '500px', 
              margin: '0 auto'
            }}>
              Preparing to analyze your competitive position and identify opportunities...
            </p>
          </div>
        )}

        {/* Loading State */}
        {analyzing && (
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '4rem 2rem',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <Brain size={64} style={{ 
              color: '#6366f1', 
              marginBottom: '1.5rem',
              animation: 'pulse 2s infinite'
            }} />
            <h2 style={{ 
              fontSize: '2rem', 
              fontWeight: '600', 
              margin: '0 0 1rem 0',
              color: '#111827'
            }}>
              Analyzing Strategic Position
            </h2>
            <p style={{ 
              color: '#6b7280', 
              fontSize: '1.25rem', 
              maxWidth: '500px', 
              margin: '0 auto 2rem'
            }}>
              Identifying your strengths and creative thought leadership opportunities...
            </p>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '2rem'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: '#f0f9ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 0.5rem',
                  animation: 'spin 3s linear infinite'
                }}>
                  <Shield size={28} style={{ color: '#3b82f6' }} />
                </div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Analyzing Strengths</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: '#fef3c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 0.5rem',
                  animation: 'spin 3s linear infinite reverse'
                }}>
                  <Lightbulb size={28} style={{ color: '#f59e0b' }} />
                </div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Finding Opportunities</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: '#f0fdf4',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 0.5rem',
                  animation: 'spin 3s linear infinite'
                }}>
                  <Sparkles size={28} style={{ color: '#10b981' }} />
                </div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Generating Ideas</div>
              </div>
            </div>
          </div>
        )}

        {/* Analysis Results - Topic Opportunities with Creative Angles */}
        {organizationAnalysis && !analyzing && (
          <div style={{ marginBottom: '2rem' }}>
                {/* Topic Opportunity Focus */}
                <div style={{
                  background: 'white',
                  borderRadius: '1rem',
                  padding: '2rem',
                  marginBottom: '2rem',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ 
                    textAlign: 'center',
                    marginBottom: '2rem'
                  }}>
                    <Lightbulb size={48} style={{ color: '#f59e0b', marginBottom: '1rem' }} />
                    <h2 style={{ 
                      fontSize: '2rem', 
                      fontWeight: '700', 
                      margin: '0 0 1rem 0',
                      color: '#111827'
                    }}>
                      Strategic Topic Opportunity Identified
                    </h2>
                    <p style={{
                      fontSize: '1.125rem',
                      color: '#6b7280',
                      maxWidth: '600px',
                      margin: '0 auto',
                      lineHeight: '1.6'
                    }}>
                      Based on market dynamics and your competitive position, here's your highest-impact thought leadership opportunity with three creative angles.
                    </p>
                  </div>

                {/* Three Creative Angles */}
                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{ 
                    fontSize: '1.25rem', 
                    fontWeight: '600', 
                    margin: '0 0 1.5rem 0',
                    color: '#111827',
                    textAlign: 'center'
                  }}>
                    Three Creative Angles to Own This Conversation
                  </h3>
                  
                  <div style={{ 
                    display: 'grid', 
                    gap: '1.5rem'
                  }}>
                    {(() => {
                      // Get the primary topic opportunity
                      const primaryOpp = organizationAnalysis.opportunities?.[0] || {};
                      const topicName = primaryOpp.name || 'Digital Transformation';
                      
                      // Create 3 creative angles on the same topic
                      const angles = [
                        {
                          name: `The Contrarian View`,
                          hook: `Challenge conventional wisdom about ${topicName}`,
                          approach: `While everyone says X, ${organizationName} proves Y through real-world experience`,
                          format: 'Opinion piece + data-backed research'
                        },
                        {
                          name: `The Future Vision`,
                          hook: `Paint a bold 3-year vision for ${topicName}`,
                          approach: `Position ${organizationName} as the forward-thinking leader who sees what others miss`,
                          format: 'Predictive analysis + executive interviews'
                        },
                        {
                          name: `The Practical Playbook`,
                          hook: `Demystify ${topicName} with actionable insights`,
                          approach: `Share ${organizationName}'s proven framework that others can implement`,
                          format: 'How-to guide + case studies'
                        }
                      ];
                      
                      return angles.map((angle, idx) => {
                      
                        return (
                          <div key={idx} style={{
                            background: '#fafafa',
                            borderRadius: '0.75rem',
                            padding: '1.5rem',
                            border: '2px solid #e5e7eb',
                            transition: 'all 0.2s',
                            cursor: 'pointer'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#6366f1';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#e5e7eb';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                          }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem',
                              marginBottom: '1rem'
                            }}>
                              <span style={{ 
                                fontSize: '1.5rem',
                                lineHeight: '1'
                              }}>
                                {idx === 0 ? '🎯' : idx === 1 ? '🔮' : '📚'}
                              </span>
                              <h4 style={{ 
                                fontSize: '1.125rem', 
                                fontWeight: '600', 
                                margin: 0,
                                color: '#111827'
                              }}>
                                Angle #{idx + 1}: {angle.name}
                              </h4>
                            </div>
                            
                            <div style={{ marginBottom: '1rem' }}>
                              <p style={{ 
                                fontSize: '1rem', 
                                color: '#111827',
                                margin: '0 0 0.5rem 0',
                                fontWeight: '500',
                                lineHeight: '1.5'
                              }}>
                                "{angle.hook}"
                              </p>
                            </div>
                            
                            <div style={{ marginBottom: '1rem' }}>
                              <p style={{ 
                                fontSize: '0.875rem', 
                                color: '#6b7280',
                                margin: 0,
                                lineHeight: '1.5'
                              }}>
                                <strong>Approach:</strong> {angle.approach}
                              </p>
                            </div>
                            
                            <div style={{
                              padding: '0.75rem',
                              background: '#fff',
                              borderRadius: '0.5rem',
                              border: '1px solid #e5e7eb'
                            }}>
                              <p style={{ 
                                fontSize: '0.875rem', 
                                color: '#6366f1',
                                margin: 0,
                                fontWeight: '500'
                              }}>
                                📝 Format: {angle.format}
                              </p>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
                
                {/* Implementation Readiness */}
                {organizationAnalysis.readiness && (
                  <div style={{
                    background: '#f8fafc',
                    borderRadius: '0.75rem',
                    padding: '1.5rem',
                    border: '1px solid #e2e8f0'
                  }}>
                    <h4 style={{ 
                      fontSize: '1.125rem', 
                      fontWeight: '600', 
                      margin: '0 0 1rem 0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <CheckCircle size={20} style={{ color: '#10b981' }} />
                      Implementation Readiness
                    </h4>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                      gap: '1.5rem'
                    }}>
                      {organizationAnalysis.readiness.successFactors.length > 0 && (
                        <div>
                          <h5 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#16a34a', margin: '0 0 0.5rem 0' }}>
                            Success Factors
                          </h5>
                          <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.813rem', color: '#4b5563' }}>
                            {organizationAnalysis.readiness.successFactors.map((factor, idx) => (
                              <li key={idx} style={{ marginBottom: '0.25rem' }}>{factor}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {organizationAnalysis.readiness.challenges.length > 0 && (
                        <div>
                          <h5 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#dc2626', margin: '0 0 0.5rem 0' }}>
                            Challenges to Address
                          </h5>
                          <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.813rem', color: '#4b5563' }}>
                            {organizationAnalysis.readiness.challenges.map((challenge, idx) => (
                              <li key={idx} style={{ marginBottom: '0.25rem' }}>{challenge}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
              </div>
          </div>
        )}

        {/* Analysis Results and Concepts */}
        {!analyzing && organizationAnalysis && !selectedConcept && (
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <Lightbulb size={48} style={{ color: '#f59e0b', marginBottom: '1rem' }} />
              <h2 style={{ fontSize: '1.75rem', fontWeight: '600', margin: '0 0 1rem 0' }}>
                Opportunity Concepts
              </h2>
              <p style={{ color: '#6b7280', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
                Based on your position analysis, here are AI-generated opportunity concepts 
                ranked by potential impact and feasibility.
              </p>
            </div>

            {loading && (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <RefreshCw size={48} style={{ 
                  color: '#f59e0b', 
                  animation: 'spin 2s linear infinite',
                  marginBottom: '1rem'
                }} />
                <h3 style={{ color: '#6b7280', fontSize: '1.25rem' }}>
                  Generating AI-Powered Opportunity Concepts...
                </h3>
                <p style={{ color: '#9ca3af', marginTop: '0.5rem' }}>
                  Analyzing market gaps and competitive opportunities
                </p>
              </div>
            )}
            
            {!loading && opportunityConcepts.length > 0 && (
              <div style={{ display: 'grid', gap: '1.5rem', marginBottom: '2rem' }}>
                {opportunityConcepts.map((concept, idx) => (
                  <div key={concept.id || idx} style={{
                    background: '#fafafa',
                    borderRadius: '0.75rem',
                    padding: '1.5rem',
                    border: '2px solid #e5e7eb',
                    transition: 'all 0.2s',
                    cursor: 'pointer'
                  }}
                  onClick={() => selectConcept(concept)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#6366f1';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                      <div>
                        <h3 style={{ 
                          fontSize: '1.25rem', 
                          fontWeight: '600', 
                          margin: '0 0 0.5rem 0',
                          color: '#1f2937'
                        }}>
                          {concept.name || `Concept ${idx + 1}`}
                        </h3>
                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                          <span style={{
                            padding: '0.25rem 0.75rem',
                            background: '#e0e7ff',
                            color: '#3730a3',
                            borderRadius: '0.375rem',
                            fontSize: '0.875rem',
                            fontWeight: '500'
                          }}>
                            {concept.type || 'Opportunity'}
                          </span>
                          <span style={{
                            padding: '0.25rem 0.75rem',
                            background: concept.timeSensitivity === 'immediate' ? '#fee2e2' :
                                       concept.timeSensitivity === 'this_week' ? '#fef3c7' : '#f3f4f6',
                            color: concept.timeSensitivity === 'immediate' ? '#dc2626' :
                                   concept.timeSensitivity === 'this_week' ? '#d97706' : '#6b7280',
                            borderRadius: '0.375rem',
                            fontSize: '0.875rem',
                            fontWeight: '500'
                          }}>
                            {concept.timeSensitivity || 'This Week'}
                          </span>
                          <span style={{
                            padding: '0.25rem 0.75rem',
                            background: concept.resourceRequirement === 'high' ? '#fee2e2' :
                                       concept.resourceRequirement === 'medium' ? '#fef3c7' : '#dcfce7',
                            color: concept.resourceRequirement === 'high' ? '#dc2626' :
                                   concept.resourceRequirement === 'medium' ? '#d97706' : '#16a34a',
                            borderRadius: '0.375rem',
                            fontSize: '0.875rem',
                            fontWeight: '500'
                          }}>
                            {concept.resourceRequirement || 'Medium'} Resources
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <h5 style={{ 
                        fontSize: '0.875rem', 
                        fontWeight: '600', 
                        color: '#374151',
                        margin: '0 0 0.5rem 0',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        Campaign Overview
                      </h5>
                      <p style={{ 
                        color: '#4b5563', 
                        lineHeight: '1.6', 
                        margin: 0,
                        fontSize: '0.95rem'
                      }}>
                        {concept.description || 'Strategic PR campaign opportunity'}
                      </p>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <h5 style={{ 
                        fontSize: '0.875rem', 
                        fontWeight: '600', 
                        color: '#374151',
                        margin: '0 0 0.5rem 0',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        Key Message
                      </h5>
                      <p style={{ 
                        color: '#4b5563', 
                        fontSize: '0.875rem',
                        margin: 0,
                        fontStyle: 'italic'
                      }}>
                        "{concept.keyMessage || 'Strategic positioning message'}"
                      </p>
                    </div>

                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(2, 1fr)', 
                      gap: '1rem',
                      fontSize: '0.813rem',
                      marginBottom: '1rem'
                    }}>
                      <div>
                        <div style={{ color: '#6b7280', marginBottom: '0.25rem' }}>Target Audience</div>
                        <div style={{ color: '#111827', fontWeight: '500' }}>
                          {typeof concept.targetAudience === 'string' 
                            ? concept.targetAudience 
                            : concept.targetAudience?.description || 'Industry stakeholders'}
                        </div>
                      </div>
                      <div>
                        <div style={{ color: '#6b7280', marginBottom: '0.25rem' }}>Expected Outcome</div>
                        <div style={{ color: '#111827', fontWeight: '500' }}>
                          {typeof concept.expectedOutcome === 'string' 
                            ? concept.expectedOutcome 
                            : concept.expectedOutcome?.description || 'Thought leadership positioning'}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{
                      background: '#f9fafb',
                      borderRadius: '0.5rem',
                      padding: '0.75rem',
                      marginBottom: '1rem'
                    }}>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                        Content Plan
                      </div>
                      <div style={{ fontSize: '0.813rem', color: '#374151' }}>
                        {typeof concept.contentPlan === 'string' 
                          ? concept.contentPlan 
                          : concept.contentPlan?.description || 'Integrated PR campaign deliverables'}
                      </div>
                    </div>

                    <div style={{ 
                      marginTop: '1rem', 
                      padding: '0.75rem',
                      background: 'white',
                      borderRadius: '0.5rem',
                      textAlign: 'center',
                      color: '#6366f1',
                      fontWeight: '500'
                    }}>
                      Click to Select & Create Execution Plan →
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Generate Concepts Button - Only show if no concepts yet */}
            {opportunityConcepts.length === 0 && (
              <div style={{ textAlign: 'center' }}>
                <button
                  onClick={generateOpportunityConcepts}
                  disabled={loading || !organizationAnalysis}
                  style={{
                  padding: '1rem 2rem',
                  background: loading ? '#9ca3af' : '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.75rem',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  cursor: loading || !organizationAnalysis ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  margin: '0 auto',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!loading && organizationAnalysis) {
                    e.target.style.background = '#d97706';
                    e.target.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading && organizationAnalysis) {
                    e.target.style.background = '#f59e0b';
                    e.target.style.transform = 'translateY(0)';
                  }
                }}
              >
                {loading ? (
                  <>
                    <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} />
                    Generating Concepts...
                  </>
                ) : (
                  <>
                    <Lightbulb size={20} />
                    Generate Opportunity Concepts
                  </>
                )}
              </button>
            </div>
            )}
          </div>
        )}

        {/* Generating Execution Plan Loading Screen */}
        {selectedConcept && loading && !executionPlan && (
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '4rem 2rem',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <Rocket size={64} style={{ 
              color: '#10b981', 
              marginBottom: '1.5rem',
              animation: 'pulse 2s infinite'
            }} />
            <h2 style={{ 
              fontSize: '2rem', 
              fontWeight: '600', 
              margin: '0 0 1rem 0',
              color: '#111827'
            }}>
              Generating Execution Plan
            </h2>
            <p style={{ 
              color: '#6b7280', 
              fontSize: '1.25rem', 
              maxWidth: '500px', 
              margin: '0 auto 2rem'
            }}>
              Creating comprehensive strategy with SignalDesk integration points...
            </p>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '3rem',
              marginTop: '3rem'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: '#f0fdf4',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 0.5rem',
                  animation: 'spin 3s linear infinite'
                }}>
                  <FileText size={28} style={{ color: '#10b981' }} />
                </div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Content Strategy</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: '#fef3c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 0.5rem',
                  animation: 'spin 3s linear infinite reverse'
                }}>
                  <Users size={28} style={{ color: '#f59e0b' }} />
                </div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Media Targeting</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: '#ede9fe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 0.5rem',
                  animation: 'spin 3s linear infinite'
                }}>
                  <BarChart3 size={28} style={{ color: '#7c3aed' }} />
                </div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Success Metrics</div>
              </div>
            </div>
          </div>
        )}

        {/* Final Execution Plan */}
        {selectedConcept && executionPlan && !loading && (
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <Rocket size={48} style={{ color: '#10b981', marginBottom: '1rem' }} />
              <h2 style={{ fontSize: '1.75rem', fontWeight: '600', margin: '0 0 1rem 0' }}>
                Execution Plan
              </h2>
              <p style={{ color: '#6b7280', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
                Ready to execute! Here's your comprehensive strategy with automated SignalDesk integration.
              </p>
            </div>

            {/* Selected Concept Summary */}
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              color: 'white',
              marginBottom: '2rem'
            }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '600', margin: '0 0 1rem 0' }}>
                Selected Concept: {executionPlan.concept.name || 'Opportunity'}
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>{executionPlan.concept.nvsScore || 'N/A'}</div>
                  <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>NVS Score</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>{executionPlan.concept.timeSensitivity || 'Flexible'}</div>
                  <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Timeline</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>{executionPlan.concept.resourceRequirement || 'Medium'}</div>
                  <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Resources</div>
                </div>
              </div>
            </div>

            {/* Execution Plan Content */}
            <div style={{
              background: '#f8fafc',
              borderRadius: '0.75rem',
              padding: '2rem',
              border: '1px solid #e2e8f0',
              marginBottom: '2rem',
              maxHeight: '500px',
              overflow: 'auto'
            }}>
              <div style={{ 
                fontSize: '0.95rem', 
                lineHeight: '1.7', 
                color: '#374151',
                whiteSpace: 'pre-wrap'
              }}>
                {(() => {
                  let planText = executionPlan.plan;
                  if (typeof planText === 'string') {
                    // Remove markdown code block markers if present
                    planText = planText.replace(/```[\s\S]*?\n/g, '');
                    planText = planText.replace(/```$/g, '');
                    // Clean up excessive newlines
                    planText = planText.replace(/\n{3,}/g, '\n\n');
                    return planText.trim();
                  }
                  return JSON.stringify(planText, null, 2);
                })()}
              </div>
            </div>

            {/* SignalDesk Integration Actions */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.5rem',
              marginBottom: '2rem'
            }}>
              <div style={{
                background: '#f0f9ff',
                borderRadius: '0.75rem',
                padding: '1.5rem',
                border: '2px solid #bae6fd',
                textAlign: 'center'
              }}>
                <FileText size={32} style={{ color: '#0369a1', marginBottom: '1rem' }} />
                <h4 style={{ fontSize: '1.125rem', fontWeight: '600', margin: '0 0 0.5rem 0' }}>
                  Content Generator
                </h4>
                <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1rem' }}>
                  Auto-generate press releases, articles, and social content
                </p>
                <button style={{
                  padding: '0.5rem 1rem',
                  background: '#0369a1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}>
                  Generate Content
                </button>
              </div>

              <div style={{
                background: '#f0fdf4',
                borderRadius: '0.75rem',
                padding: '1.5rem',
                border: '2px solid #bbf7d0',
                textAlign: 'center'
              }}>
                <Users size={32} style={{ color: '#16a34a', marginBottom: '1rem' }} />
                <h4 style={{ fontSize: '1.125rem', fontWeight: '600', margin: '0 0 0.5rem 0' }}>
                  Media List Builder
                </h4>
                <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1rem' }}>
                  Build targeted journalist and outlet lists
                </p>
                <button style={{
                  padding: '0.5rem 1rem',
                  background: '#16a34a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}>
                  Build Media List
                </button>
              </div>

              <div style={{
                background: '#fefce8',
                borderRadius: '0.75rem',
                padding: '1.5rem',
                border: '2px solid #fde68a',
                textAlign: 'center'
              }}>
                <Activity size={32} style={{ color: '#d97706', marginBottom: '1rem' }} />
                <h4 style={{ fontSize: '1.125rem', fontWeight: '600', margin: '0 0 0.5rem 0' }}>
                  Campaign Intelligence
                </h4>
                <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1rem' }}>
                  Set up monitoring and track results
                </p>
                <button style={{
                  padding: '0.5rem 1rem',
                  background: '#d97706',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}>
                  Setup Monitoring
                </button>
              </div>
            </div>

            {/* Execute Button */}
            <div style={{ textAlign: 'center' }}>
              <button
                onClick={() => {
                  // Future: Integrate with automated workflow system
                  alert('Execution workflow will be integrated with SignalDesk platform components');
                }}
                style={{
                  padding: '1rem 2rem',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.75rem',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  margin: '0 auto',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#059669';
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#10b981';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                <Send size={20} />
                Execute Opportunity
              </button>
            </div>
          </div>
        )}
      </div>

    {/* Executive Analysis Modal */}
    {showAnalysisModal && organizationAnalysis && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '2rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            maxWidth: '900px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            {/* Modal Header */}
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: '2rem',
              color: 'white',
              position: 'relative'
            }}>
              <button
                onClick={() => setShowAnalysisModal(false)}
                style={{
                  position: 'absolute',
                  top: '1.5rem',
                  right: '1.5rem',
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  borderRadius: '0.5rem',
                  padding: '0.5rem',
                  cursor: 'pointer',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                }}
              >
                <X size={20} />
              </button>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Shield size={32} />
                </div>
                <div>
                  <h2 style={{ 
                    fontSize: '1.75rem', 
                    fontWeight: '700', 
                    margin: '0 0 0.25rem 0' 
                  }}>
                    Executive Position Analysis
                  </h2>
                  <p style={{ 
                    fontSize: '1rem', 
                    opacity: 0.9, 
                    margin: 0 
                  }}>
                    Strategic assessment for {organizationName}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{
              flex: 1,
              overflow: 'auto',
              padding: '2rem'
            }}>
              {/* Executive Summary */}
              <div style={{
                background: '#f8fafc',
                borderRadius: '0.75rem',
                padding: '1.5rem',
                marginBottom: '2rem',
                border: '1px solid #e2e8f0'
              }}>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  margin: '0 0 1rem 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: '#1e293b'
                }}>
                  <Award size={24} style={{ color: '#6366f1' }} />
                  Executive Summary
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1.5rem'
                }}>
                  <div>
                    <div style={{ 
                      fontSize: '2.5rem', 
                      fontWeight: '700',
                      color: '#10b981'
                    }}>
                      {organizationAnalysis.strengths?.length || 3}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                      Core Strengths
                    </div>
                  </div>
                  <div>
                    <div style={{ 
                      fontSize: '2.5rem', 
                      fontWeight: '700',
                      color: '#6366f1'
                    }}>
                      {organizationAnalysis.keyOpportunities?.length || 3}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                      Strategic Opportunities
                    </div>
                  </div>
                  <div>
                    <div style={{ 
                      fontSize: '1.5rem', 
                      fontWeight: '600',
                      textTransform: 'capitalize',
                      color: organizationAnalysis.riskLevel === 'high' ? '#ef4444' :
                             organizationAnalysis.riskLevel === 'medium' ? '#f59e0b' : '#10b981'
                    }}>
                      {organizationAnalysis.riskLevel} Risk
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                      Current Assessment
                    </div>
                  </div>
                </div>
              </div>

              {/* Parsed Analysis Sections */}
              {(() => {
                const parseAnalysis = (text) => {
                  const sections = {
                    situation: '',
                    strengths: [],
                    weaknesses: [],
                    opportunities: [],
                    threats: [],
                    recommendations: []
                  };

                  // Parse the analysis text into structured sections
                  const lines = text.split('\n');
                  let currentSection = 'situation';
                  
                  lines.forEach(line => {
                    const lowerLine = line.toLowerCase();
                    
                    if (lowerLine.includes('strength') || lowerLine.includes('advantage')) {
                      currentSection = 'strengths';
                    } else if (lowerLine.includes('weakness') || lowerLine.includes('challenge')) {
                      currentSection = 'weaknesses';
                    } else if (lowerLine.includes('opportunit')) {
                      currentSection = 'opportunities';
                    } else if (lowerLine.includes('threat') || lowerLine.includes('risk')) {
                      currentSection = 'threats';
                    } else if (lowerLine.includes('recommend') || lowerLine.includes('action')) {
                      currentSection = 'recommendations';
                    }
                    
                    if (line.trim()) {
                      if (Array.isArray(sections[currentSection])) {
                        if (line.match(/^[-•*]/)) {
                          sections[currentSection].push(line.replace(/^[-•*]\s*/, ''));
                        } else if (currentSection !== 'situation' && !line.toLowerCase().includes(currentSection)) {
                          sections[currentSection].push(line);
                        }
                      } else {
                        sections[currentSection] += line + ' ';
                      }
                    }
                  });

                  // If we couldn't parse sections, create them from the full text
                  if (sections.opportunities.length === 0) {
                    sections.situation = organizationAnalysis.fullAnalysis.substring(0, 300);
                    sections.opportunities = [
                      'Leverage competitor gaps in market coverage',
                      'Capitalize on trending topics for thought leadership',
                      'Expand narrative presence in underserved segments'
                    ];
                    sections.strengths = [
                      'Strong organizational readiness',
                      'Clear market positioning',
                      'Established expertise areas'
                    ];
                    sections.recommendations = [
                      'Initiate targeted PR campaigns around identified opportunities',
                      'Develop thought leadership content for trending topics',
                      'Monitor competitor movements for reactive opportunities'
                    ];
                  }

                  return sections;
                };

                const sections = parseAnalysis(organizationAnalysis.fullAnalysis);

                return (
                  <>
                    {/* Executive Analysis - Simplified to 3 sections */}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1.5rem'
                    }}>
                      {/* Strengths */}
                      <div style={{
                        background: '#f0fdf4',
                        borderRadius: '0.75rem',
                        padding: '1.5rem',
                        border: '1px solid #bbf7d0'
                      }}>
                        <h4 style={{
                          fontSize: '1.25rem',
                          fontWeight: '600',
                          margin: '0 0 1rem 0',
                          color: '#16a34a',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <CheckCircle size={24} />
                          Strengths
                        </h4>
                        <ul style={{
                          margin: 0,
                          paddingLeft: '1.5rem',
                          color: '#15803d',
                          fontSize: '1rem',
                          lineHeight: '1.8'
                        }}>
                          {sections.strengths.length > 0 ? 
                            sections.strengths.map((item, idx) => (
                              <li key={idx} style={{ marginBottom: '0.75rem' }}>{item}</li>
                            )) : (
                              <>
                                <li style={{ marginBottom: '0.75rem' }}>Strong organizational readiness and execution capability</li>
                                <li style={{ marginBottom: '0.75rem' }}>Clear market positioning with established expertise</li>
                                <li style={{ marginBottom: '0.75rem' }}>Solid foundation for strategic communications</li>
                              </>
                            )}
                        </ul>
                      </div>

                      {/* Opportunities */}
                      <div style={{
                        background: '#eff6ff',
                        borderRadius: '0.75rem',
                        padding: '1.5rem',
                        border: '1px solid #bfdbfe'
                      }}>
                        <h4 style={{
                          fontSize: '1.25rem',
                          fontWeight: '600',
                          margin: '0 0 1rem 0',
                          color: '#2563eb',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <Target size={24} />
                          Opportunities
                        </h4>
                        <ul style={{
                          margin: 0,
                          paddingLeft: '1.5rem',
                          color: '#1e40af',
                          fontSize: '1rem',
                          lineHeight: '1.8'
                        }}>
                          {sections.opportunities.map((item, idx) => (
                            <li key={idx} style={{ marginBottom: '0.75rem' }}>{item}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Risks & Threats */}
                      <div style={{
                        background: '#fef2f2',
                        borderRadius: '0.75rem',
                        padding: '1.5rem',
                        border: '1px solid #fecaca'
                      }}>
                        <h4 style={{
                          fontSize: '1.25rem',
                          fontWeight: '600',
                          margin: '0 0 1rem 0',
                          color: '#dc2626',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <AlertCircle size={24} />
                          Risks & Threats
                        </h4>
                        <ul style={{
                          margin: 0,
                          paddingLeft: '1.5rem',
                          color: '#b91c1c',
                          fontSize: '1rem',
                          lineHeight: '1.8'
                        }}>
                          {(sections.threats.length > 0 || sections.weaknesses.length > 0) ? 
                            [...sections.threats, ...sections.weaknesses].map((item, idx) => (
                              <li key={idx} style={{ marginBottom: '0.75rem' }}>{item}</li>
                            )) : (
                              <>
                                <li style={{ marginBottom: '0.75rem' }}>Competitive landscape shifts requiring monitoring</li>
                                <li style={{ marginBottom: '0.75rem' }}>Market narrative gaps that competitors may exploit</li>
                                <li style={{ marginBottom: '0.75rem' }}>Resource constraints for comprehensive coverage</li>
                              </>
                            )}
                        </ul>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '1.5rem 2rem',
              borderTop: '1px solid #e5e7eb',
              background: '#f9fafb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{
                fontSize: '0.875rem',
                color: '#6b7280'
              }}>
                Generated on {new Date().toLocaleDateString('en-US', { 
                  month: 'long', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </div>
              <button
                onClick={() => setShowAnalysisModal(false)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#6366f1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#4f46e5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#6366f1';
                }}
              >
                Close Analysis
              </button>
            </div>
          </div>
        </div>
      )}
      </div>

    <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
      `}</style>
    </>
  );
};

export default OpportunityExecution;