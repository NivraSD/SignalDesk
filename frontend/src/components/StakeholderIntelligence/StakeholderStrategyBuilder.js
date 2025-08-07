import React, { useState, useCallback, useMemo } from 'react';
import { 
  Building, Search, Loader, ChevronRight, AlertCircle, 
  CheckCircle, Brain, Target, Users, TrendingUp, Shield,
  Lightbulb, BarChart3, Globe, Zap, Info, Briefcase, MessageCircle
} from 'lucide-react';
import CompanyAnalysis from '../../services/intelligence/CompanyAnalysis';
import CompanyInputForm from './CompanyInputForm';

const StakeholderStrategyBuilder = ({ onStrategyComplete }) => {
  const [currentStep, setCurrentStep] = useState('input'); // input, analyzing, questionnaire, generating, complete
  const [companyName, setCompanyName] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');
  const [internalAnalysis, setInternalAnalysis] = useState(null);
  const [formData, setFormData] = useState({});
  const [error, setError] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Start the analysis process
  const startAnalysis = async () => {
    if (!companyName.trim()) {
      setError('Please enter a company or organization name');
      return;
    }

    setCurrentStep('analyzing');
    setError(null);
    setIsAnalyzing(true);

    try {
      // Perform deep internal analysis
      const analysis = await CompanyAnalysis.performDeepAnalysis(companyName, {
        additionalContext
      });
      
      setInternalAnalysis(analysis);
      
      // Debug log to check analysis data
      console.log('🔍 Full analysis received:', analysis);
      console.log('🔍 Profile data:', analysis.profile);
      console.log('🔍 Key extracted data:', {
        keyProducts: analysis.profile?.keyProducts,
        competitors: analysis.profile?.competitors,
        businessSegments: analysis.profile?.businessSegments,
        strategicPriorities: analysis.profile?.strategicPriorities,
        stakeholderLandscape: analysis.stakeholderLandscape,
        ceo: analysis.profile?.ceo,
        revenue: analysis.profile?.revenue,
        marketCap: analysis.profile?.marketCap
      });
      
      // Pre-populate form with intelligent defaults
      const defaults = generateSmartDefaults(analysis);
      setFormData(defaults);
      
      setIsAnalyzing(false);
      setCurrentStep('questionnaire');
    } catch (err) {
      console.error('Analysis error:', err);
      setError('Failed to analyze company. Please try again.');
      setIsAnalyzing(false);
      setCurrentStep('input');
    }
  };

  // Generate smart defaults based on analysis
  const generateSmartDefaults = (analysis) => {
    console.log('Generating defaults from analysis:', analysis);
    
    const defaults = {
      // Keep the stakeholder data from analysis
      primaryStakeholders: analysis.stakeholderLandscape?.primary?.map(s => ({
        name: s.group,
        sentiment: s.sentiment,
        influence: s.influence,
        interest: s.interest,
        targetSentiment: 'positive',
        keyMessages: analysis.recommendations?.stakeholder_strategy
          ?.find(r => r.group === s.group)?.key_messages || []
      })) || [],
      
      // Don't pre-populate generic fields - let user decide based on analysis
      priorityStakeholders: [],
      selectedOpportunities: [],
      riskMitigation: {},
      currentEvents: '',
      timeframe: '6 months',
      resources: 'moderate',
      additionalNotes: ''
    };

    console.log('Generated defaults:', defaults);
    return defaults;
  };

  // Handle questionnaire submission
  const generateStrategy = async () => {
    console.log('Generating strategy with formData:', formData);
    setCurrentStep('generating');
    
    try {
      // Combine internal analysis with user inputs
      const strategyData = {
        companyProfile: {
          name: companyName,
          industry: internalAnalysis?.profile?.industry || 'general',
          size: internalAnalysis?.profile?.size || 'medium',
          type: internalAnalysis?.profile?.type || 'private',
          marketPosition: internalAnalysis?.marketPosition?.marketPosition || 'challenger',
          additionalContext: additionalContext
        },
        internalAnalysis: internalAnalysis,
        stakeholderGroups: formData.primaryStakeholders || [],
        priorityStakeholders: formData.priorityStakeholders || [],
        selectedOpportunities: formData.selectedOpportunities || [],
        riskMitigation: formData.riskMitigation || {},
        currentEvents: formData.currentEvents || '',
        timeframe: formData.timeframe,
        resources: formData.resources,
        additionalNotes: formData.additionalNotes || '',
        aiInsights: internalAnalysis?.profile?.aiInsights || '',
        competitorMentions: internalAnalysis?.profile?.competitorMentions || [],
        recentNews: internalAnalysis?.profile?.recentNews || []
      };

      console.log('Strategy data prepared:', strategyData);

      // Use AI to generate final strategy recommendations
      try {
        const response = await fetch('http://localhost:5001/api/ai/analyze', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            prompt: `Based on the following analysis and inputs, create a comprehensive stakeholder intelligence strategy:
              
              Company: ${strategyData.companyProfile.name}
              Industry: ${strategyData.companyProfile.industry}
              Market Position: ${strategyData.companyProfile.marketPosition}
              
              Priority Stakeholders: ${strategyData.priorityStakeholders.join(', ')}
              Selected Opportunities: ${strategyData.selectedOpportunities.join(', ')}
              
              Risk Mitigation Plans: ${JSON.stringify(strategyData.riskMitigation)}
              Current Events: ${strategyData.currentEvents}
              Timeline: ${strategyData.timeframe}
              Resources: ${strategyData.resources}
              
              Additional Context: ${strategyData.additionalNotes}
              
              Generate strategic recommendations for stakeholder engagement, monitoring priorities, and communication strategies.`,
            context: 'strategy_generation'
          })
        });

        if (response.ok) {
          const data = await response.json();
          strategyData.aiStrategy = data.response || data.analysis;
        }
      } catch (error) {
        console.error('AI strategy generation error:', error);
      }
      
      setCurrentStep('complete');
      
      // Pass the complete strategy to parent
      if (onStrategyComplete) {
        console.log('Calling onStrategyComplete with:', strategyData);
        onStrategyComplete(strategyData);
      }
    } catch (err) {
      console.error('Strategy generation error:', err);
      setError('Failed to generate strategy. Please try again.');
      setCurrentStep('questionnaire');
    }
  };

  // Render different steps
  const renderContent = () => {
    switch (currentStep) {
      case 'input':
        return <CompanyInputStep />;
      case 'analyzing':
        return <AnalyzingStep />;
      case 'questionnaire':
        return <QuestionnaireStep />;
      case 'generating':
        return <GeneratingStep />;
      case 'complete':
        return <CompleteStep />;
      default:
        return null;
    }
  };

  // Handle form submission from CompanyInputForm
  const handleCompanyFormSubmit = ({ companyName: name, additionalContext: context }) => {
    setCompanyName(name);
    setAdditionalContext(context);
    startAnalysisWithParams(name, context);
  };

  // Modified startAnalysis to accept parameters
  const startAnalysisWithParams = async (name, context) => {
    if (!name.trim()) {
      setError('Please enter a company or organization name');
      return;
    }

    setCurrentStep('analyzing');
    setError(null);
    setIsAnalyzing(true);

    try {
      // Perform deep internal analysis
      console.log('Starting analysis for:', name);
      const analysis = await CompanyAnalysis.performDeepAnalysis(name, {
        additionalContext: context
      });
      
      console.log('Analysis completed:', analysis);
      setInternalAnalysis(analysis);
      
      // Pre-populate form with intelligent defaults
      const defaults = generateSmartDefaults(analysis);
      console.log('Generated defaults:', defaults);
      setFormData(defaults);
      
      setIsAnalyzing(false);
      setCurrentStep('questionnaire');
    } catch (err) {
      console.error('Analysis error:', err);
      setError('Failed to analyze company. Please try again.');
      setIsAnalyzing(false);
      setCurrentStep('input');
    }
  };

  // Step 1: Company Input
  const CompanyInputStep = () => (
    <CompanyInputForm 
      onSubmit={handleCompanyFormSubmit}
      error={error}
    />
  );

  // Step 2: Analyzing
  const AnalyzingStep = () => {
    const [analysisStage, setAnalysisStage] = useState('');
    
    React.useEffect(() => {
      const stages = [
        'Searching for company information...',
        'Analyzing industry dynamics...',
        'Identifying key stakeholders...',
        'Mapping competitive landscape...',
        'Assessing risks and opportunities...',
        'Generating strategic insights...'
      ];
      
      let currentStage = 0;
      const interval = setInterval(() => {
        if (currentStage < stages.length) {
          setAnalysisStage(stages[currentStage]);
          currentStage++;
        }
      }, 2000);
      
      return () => clearInterval(interval);
    }, []);
    
    return (
      <div style={{ 
        maxWidth: '600px', 
        margin: '0 auto', 
        padding: '4rem 2rem',
        textAlign: 'center'
      }}>
        <Brain 
          style={{ 
            width: '64px', 
            height: '64px', 
            margin: '0 auto 2rem', 
            color: '#6366f1',
            animation: 'pulse 2s infinite'
          }} 
        />
        
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
          Analyzing {companyName}
        </h2>
        
        <div style={{ marginBottom: '2rem' }}>
          <Loader 
            style={{ 
              width: '32px', 
              height: '32px', 
              margin: '0 auto 1rem',
              animation: 'spin 1s linear infinite'
            }} 
          />
          <p style={{ color: '#6366f1', marginBottom: '1rem', fontWeight: '500' }}>
            {analysisStage}
          </p>
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            This comprehensive analysis will help us ask the right questions
          </p>
        </div>

        <div style={{
          background: '#f9fafb',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          textAlign: 'left'
        }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '1rem' }}>
            What we're analyzing:
          </h3>
          <ul style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
            <li>Company profile and recent developments</li>
            <li>Industry trends and market position</li>
            <li>Key stakeholder groups and their concerns</li>
            <li>Competitive dynamics and differentiation</li>
            <li>Strategic risks and opportunities</li>
            <li>Communication channels and messaging</li>
          </ul>
        </div>

        <style>
          {`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.5; }
            }
          `}
        </style>
      </div>
    );
  };

  // Step 3: Questionnaire
  const QuestionnaireStep = () => {
    // Local state for input fields to prevent re-render issues
    const [localInputs, setLocalInputs] = useState({});
    console.log('Questionnaire formData:', formData);
    console.log('Internal analysis:', internalAnalysis);
    
    // Generate smart questions based on analysis
    const getSmartQuestions = () => {
      const questions = [];
      
      console.log('🤔 Generating stakeholder-focused questions...');
      
      // Get comprehensive stakeholder list based on industry
      const industry = internalAnalysis?.profile?.industry || 'general';
      const allPossibleStakeholders = getComprehensiveStakeholderList(industry);
      
      // Question 1: Comprehensive Stakeholder Identification
      questions.push({
        type: 'stakeholder_identification',
        title: 'Stakeholder Landscape Mapping',
        description: `Let's identify all stakeholder groups relevant to ${companyName}. Select all that apply to your organization.`,
        allStakeholders: allPossibleStakeholders,
        preSelected: internalAnalysis?.stakeholderLandscape?.primary?.map(s => s.group) || [],
        allowCustom: true
      });
      
      // Question 2: Stakeholder Prioritization Matrix
      questions.push({
        type: 'stakeholder_prioritization',
        title: 'Stakeholder Influence & Interest Assessment',
        description: 'For each selected stakeholder, assess their level of influence over your organization and their interest in your activities.',
        instruction: 'This will help us create a stakeholder prioritization matrix.',
        defaultStakeholders: internalAnalysis?.stakeholderLandscape?.primary || getIndustryStakeholders(industry).slice(0, 5)
      });
      
      // Question 3: Current Relationship Status
      questions.push({
        type: 'relationship_assessment',
        title: 'Current Stakeholder Relationships',
        description: 'How would you characterize your current relationship with each stakeholder group?',
        relationshipOptions: [
          { value: 'champion', label: 'Champion - Actively supports and advocates', color: '#10b981' },
          { value: 'supportive', label: 'Supportive - Generally positive', color: '#3b82f6' },
          { value: 'neutral', label: 'Neutral - No strong position', color: '#6b7280' },
          { value: 'skeptical', label: 'Skeptical - Has concerns or doubts', color: '#f59e0b' },
          { value: 'opposed', label: 'Opposed - Actively resistant', color: '#ef4444' },
          { value: 'unknown', label: 'Unknown - Need to assess', color: '#8b5cf6' }
        ]
      });
      
      // Question 4: Stakeholder Concerns & Priorities
      questions.push({
        type: 'stakeholder_concerns',
        title: 'Understanding Stakeholder Concerns',
        description: 'What are the primary concerns and priorities for each stakeholder group? Select all that apply or add custom concerns.',
        commonConcerns: getStakeholderConcerns(industry),
        allowCustomConcerns: true
      });
      
      // Question 5: Communication Channels
      questions.push({
        type: 'communication_preferences',
        title: 'Stakeholder Communication Channels',
        description: 'How do you currently communicate with each stakeholder group? What channels are most effective?',
        channelOptions: [
          'Direct meetings/calls',
          'Email communications',
          'Social media',
          'Press releases',
          'Industry events',
          'Reports/documentation',
          'Website/portal',
          'Newsletters',
          'Town halls',
          'Advisory boards',
          'Surveys/feedback forms',
          'Third-party intermediaries'
        ]
      });
      
      // Question 6: Engagement Frequency
      questions.push({
        type: 'engagement_frequency',
        title: 'Stakeholder Engagement Cadence',
        description: 'How frequently do you engage with each stakeholder group?',
        frequencyOptions: [
          { value: 'daily', label: 'Daily' },
          { value: 'weekly', label: 'Weekly' },
          { value: 'monthly', label: 'Monthly' },
          { value: 'quarterly', label: 'Quarterly' },
          { value: 'annually', label: 'Annually' },
          { value: 'ad-hoc', label: 'As needed/Ad-hoc' },
          { value: 'never', label: 'Currently no engagement' }
        ]
      });
      
      // Question 7: Stakeholder Risks & Opportunities
      questions.push({
        type: 'stakeholder_risk_opportunity',
        title: 'Stakeholder-Specific Risks & Opportunities',
        description: 'For your key stakeholders, what risks do they pose and what opportunities do they present?',
        riskCategories: ['Reputation', 'Operational', 'Financial', 'Regulatory', 'Strategic'],
        opportunityCategories: ['Growth', 'Innovation', 'Partnerships', 'Market Access', 'Credibility']
      });
      
      // Question 8: Stakeholder Perception Tracking
      questions.push({
        type: 'perception_tracking',
        title: 'How Stakeholders Perceive Your Organization',
        description: 'Based on your understanding, how do different stakeholder groups currently perceive your organization?',
        perceptionAreas: [
          'Trustworthiness',
          'Innovation',
          'Reliability',
          'Social responsibility',
          'Financial stability',
          'Leadership quality',
          'Product/service quality',
          'Customer focus',
          'Employee treatment',
          'Environmental impact'
        ]
      });
      
      // Question 9: Critical Stakeholder Events
      questions.push({
        type: 'stakeholder_triggers',
        title: 'Stakeholder Trigger Points & Critical Events',
        description: 'What events or decisions would significantly impact each stakeholder group? Understanding these helps anticipate reactions.',
        triggerCategories: [
          'Leadership changes',
          'Financial results',
          'Product launches/changes',
          'Policy changes',
          'Regulatory decisions',
          'Market expansion/contraction',
          'Partnership announcements',
          'Crisis events',
          'Pricing changes',
          'Organizational restructuring'
        ]
      });
      
      // Question 10: Inter-stakeholder Dynamics
      questions.push({
        type: 'stakeholder_relationships',
        title: 'Inter-Stakeholder Relationships',
        description: 'How do your stakeholder groups relate to and influence each other? Understanding these dynamics is crucial.',
        relationshipTypes: [
          'Alliance - Work together toward common goals',
          'Tension - Conflicting interests or priorities',
          'Influence - One group significantly affects another',
          'Competition - Compete for resources or attention',
          'Dependency - One relies on the other',
          'Neutral - Limited interaction or impact'
        ]
      });
      
      return questions;
    };
    
    // Helper function to get comprehensive stakeholder list
    const getComprehensiveStakeholderList = (industry) => {
      const baseStakeholders = [
        // Internal
        { category: 'Internal', name: 'Employees', description: 'All staff members' },
        { category: 'Internal', name: 'Management Team', description: 'Executive leadership' },
        { category: 'Internal', name: 'Board of Directors', description: 'Governance body' },
        { category: 'Internal', name: 'Labor Unions', description: 'Employee representatives' },
        
        // Financial
        { category: 'Financial', name: 'Shareholders/Investors', description: 'Equity holders' },
        { category: 'Financial', name: 'Lenders/Banks', description: 'Debt providers' },
        { category: 'Financial', name: 'Financial Analysts', description: 'Market analysts' },
        { category: 'Financial', name: 'Rating Agencies', description: 'Credit rating firms' },
        
        // Market
        { category: 'Market', name: 'Customers/Clients', description: 'Direct buyers' },
        { category: 'Market', name: 'End Users', description: 'Ultimate product users' },
        { category: 'Market', name: 'Suppliers', description: 'Goods/service providers' },
        { category: 'Market', name: 'Business Partners', description: 'Strategic alliances' },
        { category: 'Market', name: 'Distributors/Resellers', description: 'Channel partners' },
        { category: 'Market', name: 'Competitors', description: 'Market rivals' },
        
        // Government & Regulatory
        { category: 'Regulatory', name: 'Government Agencies', description: 'Federal/state bodies' },
        { category: 'Regulatory', name: 'Regulators', description: 'Industry oversight' },
        { category: 'Regulatory', name: 'Local Authorities', description: 'Municipal government' },
        { category: 'Regulatory', name: 'International Bodies', description: 'Global organizations' },
        
        // Society & Community
        { category: 'Society', name: 'Local Communities', description: 'Geographic neighbors' },
        { category: 'Society', name: 'NGOs/Advocacy Groups', description: 'Interest organizations' },
        { category: 'Society', name: 'Media/Press', description: 'News organizations' },
        { category: 'Society', name: 'Academic Institutions', description: 'Universities/research' },
        { category: 'Society', name: 'General Public', description: 'Broader society' },
        { category: 'Society', name: 'Environmental Groups', description: 'Sustainability advocates' }
      ];
      
      // Add industry-specific stakeholders
      const industrySpecific = {
        technology: [
          { category: 'Industry', name: 'Developers/Tech Community', description: 'Developer ecosystem' },
          { category: 'Industry', name: 'Platform Partners', description: 'Integration partners' },
          { category: 'Industry', name: 'Open Source Community', description: 'OSS contributors' }
        ],
        healthcare: [
          { category: 'Industry', name: 'Healthcare Providers', description: 'Doctors/hospitals' },
          { category: 'Industry', name: 'Patients/Patient Groups', description: 'Care recipients' },
          { category: 'Industry', name: 'Insurance Companies', description: 'Payers' },
          { category: 'Industry', name: 'Medical Associations', description: 'Professional bodies' }
        ],
        finance: [
          { category: 'Industry', name: 'Institutional Clients', description: 'Large investors' },
          { category: 'Industry', name: 'Retail Customers', description: 'Individual clients' },
          { category: 'Industry', name: 'Central Banks', description: 'Monetary authorities' },
          { category: 'Industry', name: 'Fintech Partners', description: 'Technology providers' }
        ],
        diversified: [
          { category: 'Industry', name: 'Portfolio Companies', description: 'Subsidiary firms' },
          { category: 'Industry', name: 'Joint Venture Partners', description: 'JV participants' },
          { category: 'Industry', name: 'Industry Associations', description: 'Trade groups' },
          { category: 'Industry', name: 'Cross-sector Stakeholders', description: 'Multi-industry groups' }
        ]
      };
      
      const additionalStakeholders = industrySpecific[industry] || [];
      return [...baseStakeholders, ...additionalStakeholders];
    };
    
    // Helper function to get stakeholder concerns by industry
    const getStakeholderConcerns = (industry) => {
      const baseConcerns = [
        // Universal concerns
        { category: 'Financial', concerns: ['Financial performance', 'ROI/Value', 'Cost management', 'Pricing', 'Budget allocation'] },
        { category: 'Operational', concerns: ['Service quality', 'Reliability', 'Efficiency', 'Innovation', 'Technology adoption'] },
        { category: 'Governance', concerns: ['Transparency', 'Accountability', 'Ethical practices', 'Compliance', 'Risk management'] },
        { category: 'Social', concerns: ['Social responsibility', 'Community impact', 'Diversity & inclusion', 'Employee wellbeing', 'Sustainability'] },
        { category: 'Communication', concerns: ['Information access', 'Response time', 'Clarity', 'Consultation', 'Representation'] }
      ];
      
      const industryConcerns = {
        technology: [
          { category: 'Technology', concerns: ['Data privacy', 'Security', 'Platform stability', 'Integration ease', 'Technical support'] }
        ],
        healthcare: [
          { category: 'Healthcare', concerns: ['Patient safety', 'Clinical outcomes', 'Access to care', 'Treatment costs', 'Regulatory compliance'] }
        ],
        finance: [
          { category: 'Finance', concerns: ['Market stability', 'Interest rates', 'Regulatory changes', 'Fraud prevention', 'Digital transformation'] }
        ],
        diversified: [
          { category: 'Conglomerate', concerns: ['Portfolio balance', 'Synergies', 'Resource allocation', 'Brand reputation', 'Market positioning'] }
        ]
      };
      
      const specificConcerns = industryConcerns[industry] || [];
      return [...baseConcerns, ...specificConcerns];
    };
    
    // Helper function to get industry-based stakeholders
    const getIndustryStakeholders = (industry) => {
      const stakeholderTemplates = {
        diversified: [
          { group: 'Institutional Investors', influence: 9, interest: 10, sentiment: 'neutral' },
          { group: 'Business Partners', influence: 8, interest: 8, sentiment: 'positive' },
          { group: 'Government/Regulators', influence: 9, interest: 7, sentiment: 'cautious' },
          { group: 'Industry Analysts', influence: 8, interest: 8, sentiment: 'neutral' },
          { group: 'Employees (Multi-sector)', influence: 7, interest: 9, sentiment: 'positive' }
        ],
        technology: [
          { group: 'Developers/Engineers', influence: 8, interest: 9, sentiment: 'positive' },
          { group: 'Enterprise Customers', influence: 9, interest: 8, sentiment: 'neutral' },
          { group: 'Tech Media/Analysts', influence: 7, interest: 7, sentiment: 'neutral' },
          { group: 'Investors/VCs', influence: 9, interest: 9, sentiment: 'positive' },
          { group: 'Regulators', influence: 7, interest: 5, sentiment: 'cautious' }
        ],
        healthcare: [
          { group: 'Healthcare Providers', influence: 9, interest: 9, sentiment: 'neutral' },
          { group: 'Patients/Patient Advocates', influence: 8, interest: 10, sentiment: 'mixed' },
          { group: 'Regulators (FDA/CMS)', influence: 10, interest: 8, sentiment: 'cautious' },
          { group: 'Insurance/Payers', influence: 9, interest: 7, sentiment: 'skeptical' },
          { group: 'Medical Associations', influence: 8, interest: 6, sentiment: 'neutral' }
        ],
        finance: [
          { group: 'Retail Customers', influence: 7, interest: 9, sentiment: 'mixed' },
          { group: 'Institutional Clients', influence: 9, interest: 8, sentiment: 'neutral' },
          { group: 'Regulators', influence: 10, interest: 9, sentiment: 'cautious' },
          { group: 'Shareholders', influence: 9, interest: 10, sentiment: 'demanding' },
          { group: 'Financial Media', influence: 8, interest: 7, sentiment: 'critical' }
        ],
        general: [
          { group: 'Customers', influence: 8, interest: 9, sentiment: 'mixed' },
          { group: 'Employees', influence: 7, interest: 10, sentiment: 'positive' },
          { group: 'Investors', influence: 9, interest: 9, sentiment: 'neutral' },
          { group: 'Media', influence: 7, interest: 6, sentiment: 'neutral' },
          { group: 'Regulators', influence: 8, interest: 7, sentiment: 'cautious' }
        ]
      };
      
      return stakeholderTemplates[industry] || stakeholderTemplates.general;
    };
    
    // Helper function to get industry trends
    const getIndustryTrends = (industry) => {
      const trendTemplates = {
        diversified: ['Portfolio optimization', 'Cross-sector synergies', 'ESG integration', 'Digital transformation across units', 'Geopolitical risk management'],
        technology: ['AI/ML adoption', 'Cloud transformation', 'Cybersecurity concerns', 'Remote work tools', 'Data privacy regulations'],
        healthcare: ['Digital health adoption', 'Personalized medicine', 'Value-based care', 'Telehealth expansion', 'AI in diagnostics'],
        finance: ['Digital transformation', 'Fintech disruption', 'Cryptocurrency adoption', 'ESG investing', 'Regulatory changes'],
        general: ['Digital transformation', 'Sustainability focus', 'Customer experience', 'Supply chain resilience', 'ESG considerations']
      };
      
      return trendTemplates[industry] || trendTemplates.general;
    };
    
    // Helper function to get industry regulations
    const getIndustryRegulations = (industry) => {
      const regulationTemplates = {
        diversified: ['Multi-jurisdictional compliance', 'Cross-sector regulations', 'Anti-trust laws', 'International trade regulations', 'ESG reporting requirements'],
        technology: ['GDPR', 'CCPA', 'SOC2', 'ISO27001', 'Data Protection Laws'],
        healthcare: ['HIPAA', 'FDA regulations', 'Medicare/Medicaid', 'Clinical trial requirements', 'Patient safety standards'],
        finance: ['Dodd-Frank', 'Basel III', 'MiFID II', 'AML/KYC', 'Consumer protection laws'],
        general: ['General business regulations', 'Employment law', 'Environmental standards', 'Consumer protection', 'Tax compliance']
      };
      
      return regulationTemplates[industry] || regulationTemplates.general;
    };
    
    // Helper function to get industry risks
    const getIndustryRisks = (industry) => {
      const riskTemplates = {
        diversified: [
          { type: 'Conglomerate discount', probability: 'high', impact: 'medium' },
          { type: 'Cross-sector contagion risk', probability: 'medium', impact: 'high' },
          { type: 'Regulatory complexity', probability: 'high', impact: 'high' },
          { type: 'Currency/geopolitical exposure', probability: 'high', impact: 'medium' }
        ],
        technology: [
          { type: 'Cybersecurity threats', probability: 'high', impact: 'high' },
          { type: 'Regulatory compliance', probability: 'medium', impact: 'high' },
          { type: 'Talent shortage', probability: 'high', impact: 'medium' },
          { type: 'Market disruption', probability: 'medium', impact: 'high' }
        ],
        healthcare: [
          { type: 'Regulatory changes', probability: 'high', impact: 'high' },
          { type: 'Patient safety incidents', probability: 'low', impact: 'high' },
          { type: 'Reimbursement pressures', probability: 'high', impact: 'medium' },
          { type: 'Competition from new entrants', probability: 'medium', impact: 'medium' }
        ],
        finance: [
          { type: 'Regulatory penalties', probability: 'medium', impact: 'high' },
          { type: 'Market volatility', probability: 'high', impact: 'medium' },
          { type: 'Cybersecurity breaches', probability: 'medium', impact: 'high' },
          { type: 'Interest rate changes', probability: 'high', impact: 'medium' }
        ],
        general: [
          { type: 'Economic downturn', probability: 'medium', impact: 'high' },
          { type: 'Supply chain disruption', probability: 'medium', impact: 'medium' },
          { type: 'Reputation damage', probability: 'low', impact: 'high' },
          { type: 'Competitive pressure', probability: 'high', impact: 'medium' }
        ]
      };
      
      return riskTemplates[industry] || riskTemplates.general;
    };
    
    // Helper function to get industry opportunities
    const getIndustryOpportunities = (industry) => {
      const opportunityTemplates = {
        diversified: [
          { type: 'Portfolio rationalization', potential: 'high', timeframe: 'medium' },
          { type: 'Cross-business synergies', potential: 'high', timeframe: 'short' },
          { type: 'Emerging market expansion', potential: 'high', timeframe: 'medium' },
          { type: 'Strategic M&A opportunities', potential: 'medium', timeframe: 'long' }
        ],
        technology: [
          { type: 'AI/ML implementation', potential: 'high', timeframe: 'medium' },
          { type: 'Cloud migration', potential: 'high', timeframe: 'short' },
          { type: 'New market expansion', potential: 'medium', timeframe: 'long' },
          { type: 'Strategic partnerships', potential: 'high', timeframe: 'short' }
        ],
        healthcare: [
          { type: 'Digital health adoption', potential: 'high', timeframe: 'medium' },
          { type: 'Telehealth expansion', potential: 'high', timeframe: 'short' },
          { type: 'Value-based care models', potential: 'medium', timeframe: 'long' },
          { type: 'Patient engagement technology', potential: 'high', timeframe: 'medium' }
        ],
        finance: [
          { type: 'Fintech partnerships', potential: 'high', timeframe: 'short' },
          { type: 'Digital transformation', potential: 'high', timeframe: 'medium' },
          { type: 'ESG investing', potential: 'medium', timeframe: 'medium' },
          { type: 'Cryptocurrency services', potential: 'medium', timeframe: 'long' }
        ],
        general: [
          { type: 'Digital transformation', potential: 'high', timeframe: 'medium' },
          { type: 'Sustainability initiatives', potential: 'medium', timeframe: 'medium' },
          { type: 'Customer experience enhancement', potential: 'high', timeframe: 'short' },
          { type: 'International expansion', potential: 'medium', timeframe: 'long' }
        ]
      };
      
      return opportunityTemplates[industry] || opportunityTemplates.general;
    };
    
    const smartQuestions = getSmartQuestions();
    
    // Debug: Log the analysis data
    console.log('📊 Rendering questionnaire with analysis:', {
      hasProfile: !!internalAnalysis?.profile,
      industry: internalAnalysis?.profile?.industry,
      aiInsightsLength: internalAnalysis?.profile?.aiInsights?.length,
      stakeholderCount: internalAnalysis?.stakeholderLandscape?.primary?.length,
      riskCount: internalAnalysis?.riskFactors?.length,
      opportunityCount: internalAnalysis?.opportunities?.length,
      questionsGenerated: smartQuestions.length,
      questionTypes: smartQuestions.map(q => q.type)
    });
    
    // Debug: Log each generated question
    smartQuestions.forEach((q, idx) => {
      console.log(`Question ${idx + 1} (${q.type}):`, {
        title: q.title,
        hasData: !!(q.stakeholders || q.industryData || q.risks || q.opportunities)
      });
    });
    
    return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          Let's Fine-Tune Your Strategy
        </h2>
        <p style={{ color: '#6b7280' }}>
          Based on our analysis of {companyName}, we have some targeted questions to help optimize your stakeholder strategy.
        </p>
      </div>

      {/* Executive Summary */}
      <div style={{
        background: 'linear-gradient(to bottom, #f0f9ff, #e0f2fe)',
        border: '1px solid #7dd3fc',
        borderRadius: '0.75rem',
        padding: '2rem',
        marginBottom: '2rem',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <Brain style={{ width: '24px', height: '24px', color: '#0369a1' }} />
          <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: '#0c4a6e' }}>
            Intelligence Brief: {companyName}
          </h3>
        </div>
        
        {/* Executive Summary Narrative */}
        {!internalAnalysis?.profile && isAnalyzing && (
          <div style={{ 
            marginBottom: '1.5rem', 
            padding: '1.25rem', 
            background: 'white', 
            borderRadius: '0.5rem',
            border: '1px solid #e0f2fe',
            textAlign: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid #e0f2fe',
                borderTopColor: '#3b82f6',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                Analyzing {companyName}...
              </span>
            </div>
          </div>
        )}
        
        {!internalAnalysis?.profile && !isAnalyzing && (
          <div style={{ 
            marginBottom: '1.5rem', 
            padding: '1.25rem', 
            background: '#fef3c7', 
            borderRadius: '0.5rem',
            border: '1px solid #fde68a'
          }}>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#92400e' }}>
              Unable to retrieve detailed analysis for {companyName}. 
              We'll use industry standards to guide our stakeholder strategy questions.
            </p>
          </div>
        )}
        
        {internalAnalysis?.profile && (
          <div style={{ 
            marginBottom: '1.5rem', 
            padding: '1.25rem', 
            background: 'white', 
            borderRadius: '0.5rem',
            border: '1px solid #e0f2fe'
          }}>
            {/* Company Overview - First Paragraph */}
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.9375rem', lineHeight: '1.6', color: '#1e293b' }}>
              <strong>{companyName}</strong>
              {(() => {
                // Try to use business description if available
                if (internalAnalysis.profile.businessDescription) {
                  return ` is ${internalAnalysis.profile.businessDescription}. `;
                }
                
                // Otherwise build from components
                let firstSentence = ' is ';
                
                // Size descriptor
                const sizeMap = {
                  'enterprise': 'a global enterprise',
                  'large': 'a major',
                  'medium-large': 'a substantial',
                  'medium': 'a mid-sized',
                  'small': 'a growing',
                  'startup': 'an emerging'
                };
                const sizeDesc = sizeMap[internalAnalysis.profile.size] || 'a';
                
                // Industry and type
                if (internalAnalysis.profile.industry === 'diversified') {
                  firstSentence += `${sizeDesc} diversified conglomerate`;
                } else if (internalAnalysis.profile.industryDetails?.subIndustry) {
                  firstSentence += `${sizeDesc} ${internalAnalysis.profile.industryDetails.subIndustry} company`;
                } else if (internalAnalysis.profile.industry) {
                  firstSentence += `${sizeDesc} ${internalAnalysis.profile.industry} ${internalAnalysis.profile.type === 'nonprofit' ? 'organization' : 'company'}`;
                } else if (internalAnalysis.profile.aiInsights) {
                  // Last resort - extract from AI insights
                  const match = internalAnalysis.profile.aiInsights.match(new RegExp(`${companyName}\\s+(?:is|operates as)\\s+(?:a|an)\\s+([^.]+)`, 'i'));
                  if (match && match[1]) {
                    firstSentence += match[1];
                  } else {
                    firstSentence += `${sizeDesc} organization`;
                  }
                } else {
                  firstSentence += `${sizeDesc} organization`;
                }
                
                // Add public market info inline if available
                if (internalAnalysis.profile.type === 'public' && internalAnalysis.profile.ticker) {
                  firstSentence += ` (${internalAnalysis.profile.ticker})`;
                  if (internalAnalysis.profile.marketCap) {
                    firstSentence += ` with a market capitalization of ${internalAnalysis.profile.marketCap}`;
                  }
                }
                
                return firstSentence + '. ';
              })()}
              {(() => {
                // Second sentence - founding, location, leadership
                const parts = [];
                
                if (internalAnalysis.profile.foundedYear) {
                  parts.push(`Founded in ${internalAnalysis.profile.foundedYear}`);
                }
                
                if (internalAnalysis.profile.headquarters) {
                  if (parts.length > 0) {
                    parts.push(`headquartered in ${internalAnalysis.profile.headquarters}`);
                  } else {
                    parts.push(`The company is headquartered in ${internalAnalysis.profile.headquarters}`);
                  }
                }
                
                if (internalAnalysis.profile.ceo && parts.length < 2) {
                  if (parts.length > 0) {
                    parts.push(`led by CEO ${internalAnalysis.profile.ceo}`);
                  } else {
                    parts.push(`The company is led by CEO ${internalAnalysis.profile.ceo}`);
                  }
                }
                
                if (parts.length > 0) {
                  return parts.join(' and ') + '. ';
                }
                return '';
              })()}
              {(() => {
                // Third sentence - scale and position
                const scaleParts = [];
                
                if (internalAnalysis.profile.revenue) {
                  scaleParts.push(`${companyName} generates ${internalAnalysis.profile.revenue} in annual revenue`);
                  if (internalAnalysis.profile.revenueGrowth) {
                    scaleParts[0] += ` (${internalAnalysis.profile.revenueGrowth})`;
                  }
                } else if (internalAnalysis.profile.employeeCount) {
                  scaleParts.push(`The organization employs ${internalAnalysis.profile.employeeCount.toLocaleString()} people globally`);
                }
                
                if (internalAnalysis.marketPosition?.marketPosition === 'leader') {
                  if (scaleParts.length > 0) {
                    scaleParts[0] += ' and is recognized as a market leader';
                  } else {
                    scaleParts.push(`${companyName} is recognized as a market leader in its sector`);
                  }
                } else if (internalAnalysis.marketPosition?.marketPosition && scaleParts.length === 0) {
                  scaleParts.push(`The company holds a ${internalAnalysis.marketPosition.marketPosition} position in the market`);
                }
                
                if (scaleParts.length > 0) {
                  return scaleParts[0] + '.';
                }
                return '';
              })()}
            </p>
            
            {/* Business and Market Context - Second Paragraph */}
            {(() => {
              const businessParts = [];
              
              // Core business description
              if (internalAnalysis.profile.keyProducts?.length > 0) {
                businessParts.push(`${companyName}'s core offerings include ${internalAnalysis.profile.keyProducts.slice(0, 3).join(', ')}`);
              } else if (internalAnalysis.profile.businessModel) {
                businessParts.push(`The company operates a ${internalAnalysis.profile.businessModel} model`);
              } else if (internalAnalysis.profile.aiInsights) {
                // Try to extract from AI insights as fallback
                const insightsLower = internalAnalysis.profile.aiInsights.toLowerCase();
                const businessMatch = internalAnalysis.profile.aiInsights.match(/(?:core business|business model|operates as|provides|offers)\s+[^.]+\./i);
                if (businessMatch) {
                  businessParts.push(businessMatch[0].trim());
                }
              }
              
              if (internalAnalysis.profile.businessSegments?.length > 0) {
                if (businessParts.length > 0) {
                  businessParts.push(`with operations across ${internalAnalysis.profile.businessSegments.slice(0, 3).join(', ')}`);
                } else {
                  businessParts.push(`${companyName} operates across ${internalAnalysis.profile.businessSegments.slice(0, 3).join(', ')}`);
                }
              }
              
              if (internalAnalysis.profile.valueProposition) {
                businessParts.push(`The value proposition centers on ${internalAnalysis.profile.valueProposition.toLowerCase()}`);
              }
              
              // Market context
              const marketParts = [];
              if (internalAnalysis.industryDynamics?.maturity || internalAnalysis.industryDynamics?.growthRate) {
                let marketDesc = `The ${internalAnalysis.profile.industry || 'industry'} sector`;
                if (internalAnalysis.industryDynamics.maturity) {
                  marketDesc += ` is in a ${internalAnalysis.industryDynamics.maturity} stage`;
                }
                if (internalAnalysis.industryDynamics.growthRate) {
                  marketDesc += ` with ${internalAnalysis.industryDynamics.growthRate} growth`;
                }
                marketParts.push(marketDesc);
              }
              
              if (internalAnalysis.industryDynamics?.keyTrends?.length > 0) {
                marketParts.push(`Key trends shaping the industry include ${internalAnalysis.industryDynamics.keyTrends.slice(0, 3).join(', ').toLowerCase()}`);
              }
              
              const fullParagraph = [...businessParts, ...marketParts].filter(p => p).join('. ');
              
              if (fullParagraph) {
                return (
                  <p style={{ margin: '0 0 1rem 0', fontSize: '0.9375rem', lineHeight: '1.6', color: '#1e293b' }}>
                    {fullParagraph}.
                  </p>
                );
              }
              return null;
            })()}
            
            {/* Competitive Landscape - Third Paragraph */}
            {(() => {
              const competitiveParts = [];
              
              if (internalAnalysis.profile.competitors?.length > 0) {
                competitiveParts.push(`${companyName} competes primarily with ${internalAnalysis.profile.competitors.slice(0, 3).join(', ')}`);
              } else if (internalAnalysis.profile.aiInsights) {
                // Try multiple patterns to extract competitors
                const competitorPatterns = [
                  /(?:direct competitors?|key competitors?|main competitors?)\s*(?:include|are)?\s*:?\s*([^.]+)\./i,
                  /(?:competes?\s+with|competes?\s+against)\s+([^.]+)\./i,
                  /(?:competitive landscape includes|faces competition from)\s+([^.]+)\./i
                ];
                
                for (const pattern of competitorPatterns) {
                  const match = internalAnalysis.profile.aiInsights.match(pattern);
                  if (match && match[1]) {
                    // Improved parsing to handle "and" properly
                    const competitorText = match[1];
                    const competitors = competitorText
                      .split(/,\s*(?![^()]*\))/)
                      .map(c => {
                        // Handle "X and Y" as last item
                        if (c.includes(' and ') && !c.includes(',')) {
                          return c.split(' and ').map(x => x.trim());
                        }
                        return c.trim();
                      })
                      .flat()
                      .filter(c => c.length > 2 && c.length < 100 && !c.toLowerCase().includes('other'))
                      .slice(0, 4);
                    
                    if (competitors.length > 0) {
                      competitiveParts.push(`${companyName} competes primarily with ${competitors.slice(0, 3).join(', ')}`);
                      break;
                    }
                  }
                }
              }
              
              if (internalAnalysis.profile.marketShare) {
                competitiveParts.push(`holding ${internalAnalysis.profile.marketShare} market share`);
              }
              
              if (internalAnalysis.marketPosition?.competitiveAdvantages?.length > 0) {
                const advantages = internalAnalysis.marketPosition.competitiveAdvantages.slice(0, 3).join(', ').toLowerCase();
                if (competitiveParts.length > 0) {
                  competitiveParts.push(`The company's competitive advantages include ${advantages}`);
                } else {
                  competitiveParts.push(`${companyName}'s competitive advantages include ${advantages}`);
                }
              } else if (internalAnalysis.profile.competitiveAdvantages?.length > 0) {
                const advantages = internalAnalysis.profile.competitiveAdvantages.slice(0, 3).join(', ').toLowerCase();
                competitiveParts.push(`with key differentiators including ${advantages}`);
              }
              
              if (internalAnalysis.marketPosition?.weaknesses?.length > 0) {
                competitiveParts.push(`Key challenges include ${internalAnalysis.marketPosition.weaknesses.slice(0, 2).join(' and ').toLowerCase()}`);
              }
              
              const fullParagraph = competitiveParts.filter(p => p).join('. ');
              
              if (fullParagraph) {
                return (
                  <p style={{ margin: '0 0 1rem 0', fontSize: '0.9375rem', lineHeight: '1.6', color: '#1e293b' }}>
                    {fullParagraph}.
                  </p>
                );
              }
              return null;
            })()}
            
            {/* Stakeholder Landscape - Fourth Paragraph */}
            {(() => {
              const parts = [];
              
              // Primary stakeholders if we have them
              if (internalAnalysis.stakeholderLandscape?.primary?.length > 0) {
                const primaryStakeholders = internalAnalysis.stakeholderLandscape.primary
                  .slice(0, 5)
                  .map(s => s.group);
                
                if (primaryStakeholders.length > 0) {
                  const lastStakeholder = primaryStakeholders.pop();
                  let stakeholderList = primaryStakeholders.length > 0 
                    ? `${primaryStakeholders.join(', ')} and ${lastStakeholder}`
                    : lastStakeholder;
                    
                  parts.push(`${companyName}'s stakeholder ecosystem encompasses ${stakeholderList}`);
                  
                  // Add sentiment or influence info if available
                  const highInfluence = internalAnalysis.stakeholderLandscape.primary
                    .filter(s => s.influence >= 8)
                    .map(s => s.group);
                  if (highInfluence.length > 0) {
                    parts.push(`with ${highInfluence.slice(0, 2).join(' and ')} wielding particularly significant influence`);
                  }
                }
              }
              
              // Add engagement priorities if available
              if (internalAnalysis.stakeholderLandscape?.engagement_priorities?.length > 0) {
                const priorities = internalAnalysis.stakeholderLandscape.engagement_priorities.slice(0, 3);
                if (parts.length === 0) {
                  parts.push(`Key stakeholder engagement should focus on ${priorities.join(', ')}`);
                } else {
                  parts.push(`Strategic engagement priorities center on ${priorities.join(', ')}`);
                }
              }
              
              // Add concerns if available
              if (internalAnalysis.profile.stakeholderConcerns?.length > 0 && parts.length < 3) {
                const concerns = internalAnalysis.profile.stakeholderConcerns
                  .slice(0, 3)
                  .map(c => c.toLowerCase());
                parts.push(`Current stakeholder concerns include ${concerns.join(', ')}`);
              }
              
              // Fallback if we don't have enough content
              if (parts.length === 0) {
                // Try to extract from AI insights
                if (internalAnalysis.profile.aiInsights) {
                  const stakeholderMatch = internalAnalysis.profile.aiInsights.match(/stakeholder[^.]+\./gi);
                  if (stakeholderMatch && stakeholderMatch.length > 0) {
                    const relevantSentence = stakeholderMatch
                      .find(s => s.toLowerCase().includes('include') || s.toLowerCase().includes('consist') || s.toLowerCase().includes('comprise'));
                    if (relevantSentence) {
                      parts.push(relevantSentence.trim());
                    }
                  }
                }
                
                // Ultimate fallback
                if (parts.length === 0) {
                  const defaultStakeholders = internalAnalysis.profile.type === 'public'
                    ? 'shareholders, customers, employees, regulators, and local communities'
                    : 'customers, employees, partners, investors, and the broader community';
                  parts.push(`${companyName} must effectively manage relationships with ${defaultStakeholders}`);
                }
              }
              
              const fullParagraph = parts.join('. ');
              if (fullParagraph) {
                return (
                  <p style={{ margin: '0 0 1rem 0', fontSize: '0.9375rem', lineHeight: '1.6', color: '#1e293b' }}>
                    {fullParagraph}.
                  </p>
                );
              }
              return null;
            })()}
            
            {/* Stakeholder Intelligence Approach - Fifth Paragraph */}
            <p style={{ margin: 0, fontSize: '0.9375rem', lineHeight: '1.6', color: '#1e293b' }}>
              Through systematic stakeholder intelligence gathering and analysis, {companyName} can proactively identify emerging concerns, 
              anticipate stakeholder reactions, and uncover opportunities for enhanced engagement. This intelligence-driven approach enables 
              the organization to mitigate reputational risks, strengthen key relationships, and align stakeholder interests with strategic 
              objectives, ultimately creating sustainable value for all stakeholder groups.
            </p>
            
            {/* Debug - show what data we actually have */}
            {process.env.NODE_ENV === 'development' && (
              <div style={{ 
                marginTop: '1rem', 
                padding: '0.5rem', 
                background: '#f3f4f6', 
                borderRadius: '0.25rem',
                fontSize: '0.75rem',
                color: '#6b7280'
              }}>
                <strong>Debug Data:</strong><br/>
                Industry: {internalAnalysis.profile.industry || 'none'}<br/>
                Size: {internalAnalysis.profile.size || 'none'}<br/>
                Type: {internalAnalysis.profile.type || 'none'}<br/>
                Products: {(() => {
                  const products = internalAnalysis.profile.keyProducts || [];
                  // Clean up any products that got extra content
                  const cleanProducts = products
                    .filter(p => !p.toLowerCase().includes('operating model') && 
                                !p.toLowerCase().includes('diversified') &&
                                !p.match(/^\d+$/))
                    .slice(0, 6);
                  return cleanProducts.length > 0 ? cleanProducts.join(', ') : 'none';
                })()}<br/>
                Competitors: {internalAnalysis.profile.competitors?.join(', ') || 'none'}<br/>
                Revenue: {internalAnalysis.profile.revenue || 'none'}<br/>
                CEO: {internalAnalysis.profile.ceo || 'none'}<br/>
                AI Insights Length: {internalAnalysis.profile.aiInsights?.length || 0}
              </div>
            )}
          </div>
        )}
        
        {/* Key Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
          <div style={{
            padding: '1rem',
            background: 'white',
            borderRadius: '0.5rem',
            textAlign: 'center',
            border: '1px solid #e0f2fe'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0284c7' }}>
              {internalAnalysis?.stakeholderLandscape?.primary?.length || 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#0c4a6e', fontWeight: '500' }}>Primary Stakeholders</div>
          </div>
          <div style={{
            padding: '1rem',
            background: 'white',
            borderRadius: '0.5rem',
            textAlign: 'center',
            border: '1px solid #fecaca'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc2626' }}>
              {internalAnalysis?.riskFactors?.filter(r => r.impact === 'high').length || 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#7f1d1d', fontWeight: '500' }}>Critical Risks</div>
          </div>
          <div style={{
            padding: '1rem',
            background: 'white',
            borderRadius: '0.5rem',
            textAlign: 'center',
            border: '1px solid #bbf7d0'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#16a34a' }}>
              {internalAnalysis?.opportunities?.filter(o => o.potential === 'high').length || 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#14532d', fontWeight: '500' }}>High-Value Opportunities</div>
          </div>
          <div style={{
            padding: '1rem',
            background: 'white',
            borderRadius: '0.5rem',
            textAlign: 'center',
            border: '1px solid #e9d5ff'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#9333ea' }}>
              {internalAnalysis?.industryDynamics?.regulations?.length || 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#581c87', fontWeight: '500' }}>Key Regulations</div>
          </div>
        </div>
        
        {/* Strategic Priorities Preview */}
        {internalAnalysis?.strategicPriorities?.immediate?.length > 0 && (
          <div style={{ 
            marginTop: '1rem', 
            paddingTop: '1rem', 
            borderTop: '1px solid #bae6fd' 
          }}>
            <div style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#0369a1' }}>
              Immediate Strategic Priorities:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {internalAnalysis.strategicPriorities.immediate.slice(0, 3).map((priority, idx) => (
                <span key={idx} style={{
                  padding: '0.25rem 0.75rem',
                  background: '#dbeafe',
                  color: '#1e40af',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: '500'
                }}>
                  {priority}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Smart Questions Based on Analysis */}
      {smartQuestions.map((question, index) => (
        <div key={question.type} style={{
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '0.75rem',
          padding: '2rem',
          marginBottom: '1.5rem'
        }}>
          <h3 style={{ 
            fontSize: '1.25rem', 
            fontWeight: '600', 
            marginBottom: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            {question.type === 'stakeholder_priority' && <Users style={{ width: '20px', height: '20px', color: '#6366f1' }} />}
            {question.type === 'industry_challenges' && <Briefcase style={{ width: '20px', height: '20px', color: '#7c3aed' }} />}
            {question.type === 'risk_mitigation' && <Shield style={{ width: '20px', height: '20px', color: '#dc2626' }} />}
            {question.type === 'opportunity_pursuit' && <TrendingUp style={{ width: '20px', height: '20px', color: '#10b981' }} />}
            {question.type === 'communication_strategy' && <MessageCircle style={{ width: '20px', height: '20px', color: '#0ea5e9' }} />}
            {question.type === 'current_events' && <AlertCircle style={{ width: '20px', height: '20px', color: '#f59e0b' }} />}
            {question.title}
          </h3>
          
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
            {question.description}
          </p>

          {/* Stakeholder Identification Question */}
          {question.type === 'stakeholder_identification' && (
            <div>
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
                  Select all stakeholder groups that are relevant to your organization. We've pre-selected some based on our analysis.
                </div>
                {['Internal', 'Financial', 'Market', 'Regulatory', 'Society', 'Industry'].map(category => (
                  <div key={category} style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                      {category} Stakeholders
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '0.5rem' }}>
                      {question.allStakeholders
                        .filter(s => s.category === category)
                        .map((stakeholder, idx) => (
                          <label key={idx} style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '0.75rem',
                            background: '#f9fafb',
                            borderRadius: '0.375rem',
                            cursor: 'pointer',
                            border: formData.selectedStakeholders?.includes(stakeholder.name) || question.preSelected.includes(stakeholder.name) 
                              ? '2px solid #6366f1' 
                              : '1px solid #e5e7eb',
                            transition: 'all 0.2s'
                          }}>
                            <input
                              type="checkbox"
                              checked={formData.selectedStakeholders?.includes(stakeholder.name) || 
                                      (!formData.selectedStakeholders && question.preSelected.includes(stakeholder.name))}
                              onChange={(e) => {
                                const current = formData.selectedStakeholders || question.preSelected;
                                if (e.target.checked) {
                                  setFormData({ ...formData, selectedStakeholders: [...current, stakeholder.name] });
                                } else {
                                  setFormData({ ...formData, selectedStakeholders: current.filter(s => s !== stakeholder.name) });
                                }
                              }}
                              style={{ marginRight: '0.5rem' }}
                            />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>{stakeholder.name}</div>
                              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{stakeholder.description}</div>
                            </div>
                          </label>
                        ))}
                    </div>
                  </div>
                ))}
                {question.allowCustom && (
                  <div style={{ marginTop: '1rem' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', display: 'block' }}>
                      Add custom stakeholder groups (comma-separated):
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Industry Influencers, Research Partners"
                      value={formData.customStakeholders || ''}
                      onChange={(e) => setFormData({ ...formData, customStakeholders: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Stakeholder Prioritization Matrix */}
          {question.type === 'stakeholder_prioritization' && (
            <div>
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  Rate each stakeholder on influence (ability to impact your organization) and interest (level of concern about your activities).
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {(formData.selectedStakeholders || question.defaultStakeholders.map(s => s.group)).map((stakeholder, idx) => (
                  <div key={idx} style={{
                    padding: '1rem',
                    background: '#f9fafb',
                    borderRadius: '0.5rem',
                    border: '1px solid #e5e7eb'
                  }}>
                    <h5 style={{ margin: '0 0 0.75rem 0', fontWeight: '600' }}>
                      {typeof stakeholder === 'string' ? stakeholder : stakeholder.group}
                    </h5>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ fontSize: '0.875rem', color: '#374151', marginBottom: '0.25rem', display: 'block' }}>
                          Influence Level (1-10)
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={formData.stakeholderMetrics?.[stakeholder]?.influence || 5}
                          onChange={(e) => setFormData({
                            ...formData,
                            stakeholderMetrics: {
                              ...formData.stakeholderMetrics,
                              [stakeholder]: {
                                ...formData.stakeholderMetrics?.[stakeholder],
                                influence: parseInt(e.target.value)
                              }
                            }
                          })}
                          style={{ width: '100%' }}
                        />
                        <div style={{ fontSize: '0.75rem', color: '#6b7280', textAlign: 'center' }}>
                          {formData.stakeholderMetrics?.[stakeholder]?.influence || 5}
                        </div>
                      </div>
                      <div>
                        <label style={{ fontSize: '0.875rem', color: '#374151', marginBottom: '0.25rem', display: 'block' }}>
                          Interest Level (1-10)
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={formData.stakeholderMetrics?.[stakeholder]?.interest || 5}
                          onChange={(e) => setFormData({
                            ...formData,
                            stakeholderMetrics: {
                              ...formData.stakeholderMetrics,
                              [stakeholder]: {
                                ...formData.stakeholderMetrics?.[stakeholder],
                                interest: parseInt(e.target.value)
                              }
                            }
                          })}
                          style={{ width: '100%' }}
                        />
                        <div style={{ fontSize: '0.75rem', color: '#6b7280', textAlign: 'center' }}>
                          {formData.stakeholderMetrics?.[stakeholder]?.interest || 5}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Relationship Assessment */}
          {question.type === 'relationship_assessment' && (
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {(formData.selectedStakeholders || question.defaultStakeholders || []).slice(0, 10).map((stakeholder, idx) => (
                  <div key={idx} style={{
                    padding: '1rem',
                    background: '#f9fafb',
                    borderRadius: '0.5rem'
                  }}>
                    <div style={{ fontWeight: '500', marginBottom: '0.75rem' }}>
                      {typeof stakeholder === 'string' ? stakeholder : stakeholder.group || stakeholder.name}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.5rem' }}>
                      {question.relationshipOptions.map((option, optIdx) => (
                        <label key={optIdx} style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '0.5rem',
                          background: formData.relationships?.[stakeholder] === option.value ? option.color + '20' : 'white',
                          border: formData.relationships?.[stakeholder] === option.value ? `2px solid ${option.color}` : '1px solid #e5e7eb',
                          borderRadius: '0.375rem',
                          cursor: 'pointer',
                          fontSize: '0.75rem'
                        }}>
                          <input
                            type="radio"
                            name={`relationship-${stakeholder}`}
                            value={option.value}
                            checked={formData.relationships?.[stakeholder] === option.value}
                            onChange={(e) => setFormData({
                              ...formData,
                              relationships: {
                                ...formData.relationships,
                                [stakeholder]: e.target.value
                              }
                            })}
                            style={{ marginRight: '0.5rem' }}
                          />
                          <span>{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stakeholder Concerns Question */}
          {question.type === 'stakeholder_concerns' && (
            <div>
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  For each stakeholder group, select their primary concerns and priorities. You can also add custom concerns.
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {(formData.selectedStakeholders || question.defaultStakeholders || []).slice(0, 10).map((stakeholder, idx) => (
                  <div key={idx} style={{
                    padding: '1rem',
                    background: '#f9fafb',
                    borderRadius: '0.5rem',
                    border: '1px solid #e5e7eb'
                  }}>
                    <h5 style={{ margin: '0 0 0.75rem 0', fontWeight: '600' }}>
                      {typeof stakeholder === 'string' ? stakeholder : stakeholder.group || stakeholder.name}
                    </h5>
                    {question.commonConcerns.map((concernCategory, catIdx) => (
                      <div key={catIdx} style={{ marginBottom: '0.75rem' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.5rem' }}>
                          {concernCategory.category}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                          {concernCategory.concerns.map((concern, cIdx) => (
                            <label key={cIdx} style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '0.375rem 0.75rem',
                              background: formData.stakeholderConcerns?.[stakeholder]?.includes(concern) ? '#dbeafe' : 'white',
                              border: formData.stakeholderConcerns?.[stakeholder]?.includes(concern) ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                              borderRadius: '9999px',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              transition: 'all 0.2s'
                            }}>
                              <input
                                type="checkbox"
                                checked={formData.stakeholderConcerns?.[stakeholder]?.includes(concern) || false}
                                onChange={(e) => {
                                  const current = formData.stakeholderConcerns?.[stakeholder] || [];
                                  if (e.target.checked) {
                                    setFormData({
                                      ...formData,
                                      stakeholderConcerns: {
                                        ...formData.stakeholderConcerns,
                                        [stakeholder]: [...current, concern]
                                      }
                                    });
                                  } else {
                                    setFormData({
                                      ...formData,
                                      stakeholderConcerns: {
                                        ...formData.stakeholderConcerns,
                                        [stakeholder]: current.filter(c => c !== concern)
                                      }
                                    });
                                  }
                                }}
                                style={{ display: 'none' }}
                              />
                              {concern}
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                    {question.allowCustomConcerns && (
                      <div style={{ marginTop: '0.75rem' }}>
                        <input
                          type="text"
                          placeholder="Add custom concerns (comma-separated)"
                          value={localInputs[`customConcerns_${stakeholder}`] || ''}
                          onChange={(e) => setLocalInputs({ ...localInputs, [`customConcerns_${stakeholder}`]: e.target.value })}
                          onBlur={(e) => {
                            const customConcerns = e.target.value.split(',').map(c => c.trim()).filter(c => c);
                            if (customConcerns.length > 0) {
                              const current = formData.stakeholderConcerns?.[stakeholder] || [];
                              setFormData({
                                ...formData,
                                stakeholderConcerns: {
                                  ...formData.stakeholderConcerns,
                                  [stakeholder]: [...current, ...customConcerns]
                                }
                              });
                            }
                          }}
                          style={{
                            width: '100%',
                            padding: '0.375rem 0.75rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '0.375rem',
                            fontSize: '0.75rem'
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Communication Preferences Question */}
          {question.type === 'communication_preferences' && (
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {(formData.selectedStakeholders || question.defaultStakeholders || []).slice(0, 10).map((stakeholder, idx) => (
                  <div key={idx} style={{
                    padding: '1rem',
                    background: '#f9fafb',
                    borderRadius: '0.5rem',
                    border: '1px solid #e5e7eb'
                  }}>
                    <h5 style={{ margin: '0 0 0.75rem 0', fontWeight: '600' }}>
                      {typeof stakeholder === 'string' ? stakeholder : stakeholder.group || stakeholder.name}
                    </h5>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.5rem' }}>
                      {question.channelOptions.map((channel, cIdx) => (
                        <label key={cIdx} style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '0.5rem',
                          background: formData.communicationChannels?.[stakeholder]?.includes(channel) ? '#e0e7ff' : 'white',
                          border: formData.communicationChannels?.[stakeholder]?.includes(channel) ? '2px solid #6366f1' : '1px solid #e5e7eb',
                          borderRadius: '0.375rem',
                          cursor: 'pointer',
                          fontSize: '0.75rem'
                        }}>
                          <input
                            type="checkbox"
                            checked={formData.communicationChannels?.[stakeholder]?.includes(channel) || false}
                            onChange={(e) => {
                              const current = formData.communicationChannels?.[stakeholder] || [];
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  communicationChannels: {
                                    ...formData.communicationChannels,
                                    [stakeholder]: [...current, channel]
                                  }
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  communicationChannels: {
                                    ...formData.communicationChannels,
                                    [stakeholder]: current.filter(c => c !== channel)
                                  }
                                });
                              }
                            }}
                            style={{ marginRight: '0.5rem' }}
                          />
                          <span>{channel}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Engagement Frequency Question */}
          {question.type === 'engagement_frequency' && (
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {(formData.selectedStakeholders || question.defaultStakeholders || []).slice(0, 10).map((stakeholder, idx) => (
                  <div key={idx} style={{
                    padding: '1rem',
                    background: '#f9fafb',
                    borderRadius: '0.5rem',
                    border: '1px solid #e5e7eb'
                  }}>
                    <h5 style={{ margin: '0 0 0.75rem 0', fontWeight: '600' }}>
                      {typeof stakeholder === 'string' ? stakeholder : stakeholder.group || stakeholder.name}
                    </h5>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.5rem' }}>
                      {question.frequencyOptions.map((freq, fIdx) => (
                        <label key={fIdx} style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '0.5rem',
                          background: formData.engagementFrequency?.[stakeholder] === freq.value ? '#fef3c7' : 'white',
                          border: formData.engagementFrequency?.[stakeholder] === freq.value ? '2px solid #f59e0b' : '1px solid #e5e7eb',
                          borderRadius: '0.375rem',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          textAlign: 'center'
                        }}>
                          <input
                            type="radio"
                            name={`frequency-${stakeholder}`}
                            value={freq.value}
                            checked={formData.engagementFrequency?.[stakeholder] === freq.value}
                            onChange={(e) => setFormData({
                              ...formData,
                              engagementFrequency: {
                                ...formData.engagementFrequency,
                                [stakeholder]: e.target.value
                              }
                            })}
                            style={{ display: 'none' }}
                          />
                          {freq.label}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stakeholder Risk & Opportunity Question */}
          {question.type === 'stakeholder_risk_opportunity' && (
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {(formData.selectedStakeholders || question.defaultStakeholders || []).slice(0, 5).map((stakeholder, idx) => (
                  <div key={idx} style={{
                    padding: '1.5rem',
                    background: '#f9fafb',
                    borderRadius: '0.5rem',
                    border: '1px solid #e5e7eb'
                  }}>
                    <h5 style={{ margin: '0 0 1rem 0', fontWeight: '600', fontSize: '1rem' }}>
                      {typeof stakeholder === 'string' ? stakeholder : stakeholder.group || stakeholder.name}
                    </h5>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      {/* Risks */}
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: '#dc2626' }}>
                          Potential Risks
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                          {question.riskCategories.map((risk, rIdx) => (
                            <label key={rIdx} style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '0.375rem 0.75rem',
                              background: formData.stakeholderRisks?.[stakeholder]?.includes(risk) ? '#fee2e2' : 'white',
                              border: formData.stakeholderRisks?.[stakeholder]?.includes(risk) ? '2px solid #ef4444' : '1px solid #e5e7eb',
                              borderRadius: '9999px',
                              cursor: 'pointer',
                              fontSize: '0.75rem'
                            }}>
                              <input
                                type="checkbox"
                                checked={formData.stakeholderRisks?.[stakeholder]?.includes(risk) || false}
                                onChange={(e) => {
                                  const current = formData.stakeholderRisks?.[stakeholder] || [];
                                  if (e.target.checked) {
                                    setFormData({
                                      ...formData,
                                      stakeholderRisks: {
                                        ...formData.stakeholderRisks,
                                        [stakeholder]: [...current, risk]
                                      }
                                    });
                                  } else {
                                    setFormData({
                                      ...formData,
                                      stakeholderRisks: {
                                        ...formData.stakeholderRisks,
                                        [stakeholder]: current.filter(r => r !== risk)
                                      }
                                    });
                                  }
                                }}
                                style={{ display: 'none' }}
                              />
                              {risk}
                            </label>
                          ))}
                        </div>
                      </div>
                      {/* Opportunities */}
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: '#10b981' }}>
                          Potential Opportunities
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                          {question.opportunityCategories.map((opp, oIdx) => (
                            <label key={oIdx} style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '0.375rem 0.75rem',
                              background: formData.stakeholderOpportunities?.[stakeholder]?.includes(opp) ? '#d1fae5' : 'white',
                              border: formData.stakeholderOpportunities?.[stakeholder]?.includes(opp) ? '2px solid #10b981' : '1px solid #e5e7eb',
                              borderRadius: '9999px',
                              cursor: 'pointer',
                              fontSize: '0.75rem'
                            }}>
                              <input
                                type="checkbox"
                                checked={formData.stakeholderOpportunities?.[stakeholder]?.includes(opp) || false}
                                onChange={(e) => {
                                  const current = formData.stakeholderOpportunities?.[stakeholder] || [];
                                  if (e.target.checked) {
                                    setFormData({
                                      ...formData,
                                      stakeholderOpportunities: {
                                        ...formData.stakeholderOpportunities,
                                        [stakeholder]: [...current, opp]
                                      }
                                    });
                                  } else {
                                    setFormData({
                                      ...formData,
                                      stakeholderOpportunities: {
                                        ...formData.stakeholderOpportunities,
                                        [stakeholder]: current.filter(o => o !== opp)
                                      }
                                    });
                                  }
                                }}
                                style={{ display: 'none' }}
                              />
                              {opp}
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Perception Tracking Question */}
          {question.type === 'perception_tracking' && (
            <div>
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  Rate how each stakeholder group perceives your organization across different dimensions (1-5 scale).
                </div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #e5e7eb', fontWeight: '600' }}>
                        Stakeholder
                      </th>
                      {question.perceptionAreas.slice(0, 5).map((area, aIdx) => (
                        <th key={aIdx} style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '2px solid #e5e7eb', fontSize: '0.75rem' }}>
                          {area}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(formData.selectedStakeholders || question.defaultStakeholders || []).slice(0, 5).map((stakeholder, sIdx) => (
                      <tr key={sIdx}>
                        <td style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb', fontWeight: '500' }}>
                          {typeof stakeholder === 'string' ? stakeholder : stakeholder.group || stakeholder.name}
                        </td>
                        {question.perceptionAreas.slice(0, 5).map((area, aIdx) => (
                          <td key={aIdx} style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>
                            <select
                              value={formData.perceptionScores?.[stakeholder]?.[area] || 3}
                              onChange={(e) => setFormData({
                                ...formData,
                                perceptionScores: {
                                  ...formData.perceptionScores,
                                  [stakeholder]: {
                                    ...formData.perceptionScores?.[stakeholder],
                                    [area]: parseInt(e.target.value)
                                  }
                                }
                              })}
                              style={{
                                padding: '0.25rem',
                                border: '1px solid #d1d5db',
                                borderRadius: '0.25rem',
                                fontSize: '0.75rem'
                              }}
                            >
                              <option value="1">1</option>
                              <option value="2">2</option>
                              <option value="3">3</option>
                              <option value="4">4</option>
                              <option value="5">5</option>
                            </select>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#6b7280' }}>
                1 = Very Negative, 3 = Neutral, 5 = Very Positive
              </div>
            </div>
          )}

          {/* Stakeholder Triggers Question */}
          {question.type === 'stakeholder_triggers' && (
            <div>
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  Which events or decisions would significantly impact each stakeholder group? This helps us anticipate and prepare for their reactions.
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {(formData.selectedStakeholders || question.defaultStakeholders || []).slice(0, 5).map((stakeholder, idx) => (
                  <div key={idx} style={{
                    padding: '1rem',
                    background: '#f9fafb',
                    borderRadius: '0.5rem',
                    border: '1px solid #e5e7eb'
                  }}>
                    <h5 style={{ margin: '0 0 0.75rem 0', fontWeight: '600' }}>
                      {typeof stakeholder === 'string' ? stakeholder : stakeholder.group || stakeholder.name}
                    </h5>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem' }}>
                      {question.triggerCategories.map((trigger, tIdx) => (
                        <label key={tIdx} style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '0.5rem',
                          background: formData.stakeholderTriggers?.[stakeholder]?.includes(trigger) ? '#fff7ed' : 'white',
                          border: formData.stakeholderTriggers?.[stakeholder]?.includes(trigger) ? '2px solid #f97316' : '1px solid #e5e7eb',
                          borderRadius: '0.375rem',
                          cursor: 'pointer',
                          fontSize: '0.75rem'
                        }}>
                          <input
                            type="checkbox"
                            checked={formData.stakeholderTriggers?.[stakeholder]?.includes(trigger) || false}
                            onChange={(e) => {
                              const current = formData.stakeholderTriggers?.[stakeholder] || [];
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  stakeholderTriggers: {
                                    ...formData.stakeholderTriggers,
                                    [stakeholder]: [...current, trigger]
                                  }
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  stakeholderTriggers: {
                                    ...formData.stakeholderTriggers,
                                    [stakeholder]: current.filter(t => t !== trigger)
                                  }
                                });
                              }
                            }}
                            style={{ marginRight: '0.5rem' }}
                          />
                          <span>{trigger}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Inter-Stakeholder Relationships Question */}
          {question.type === 'stakeholder_relationships' && (
            <div>
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  Understanding how stakeholder groups relate to each other helps us manage complex dynamics. Select the primary relationship type between key stakeholder pairs.
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {/* Create pairs of stakeholders */}
                {(() => {
                  const stakeholders = (formData.selectedStakeholders || question.defaultStakeholders || []).slice(0, 5);
                  const pairs = [];
                  for (let i = 0; i < stakeholders.length; i++) {
                    for (let j = i + 1; j < stakeholders.length; j++) {
                      pairs.push([stakeholders[i], stakeholders[j]]);
                    }
                  }
                  return pairs.slice(0, 10).map((pair, idx) => (
                    <div key={idx} style={{
                      padding: '1rem',
                      background: '#f9fafb',
                      borderRadius: '0.5rem',
                      border: '1px solid #e5e7eb'
                    }}>
                      <div style={{ fontWeight: '500', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
                        {typeof pair[0] === 'string' ? pair[0] : pair[0].group || pair[0].name} 
                        {' ↔ '}
                        {typeof pair[1] === 'string' ? pair[1] : pair[1].group || pair[1].name}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.5rem' }}>
                        {question.relationshipTypes.map((relType, rIdx) => {
                          const [type, description] = relType.split(' - ');
                          return (
                            <label key={rIdx} style={{
                              display: 'flex',
                              flexDirection: 'column',
                              padding: '0.5rem',
                              background: formData.interStakeholderRelations?.[`${pair[0]}-${pair[1]}`] === type ? '#e0e7ff' : 'white',
                              border: formData.interStakeholderRelations?.[`${pair[0]}-${pair[1]}`] === type ? '2px solid #6366f1' : '1px solid #e5e7eb',
                              borderRadius: '0.375rem',
                              cursor: 'pointer',
                              fontSize: '0.75rem'
                            }}>
                              <input
                                type="radio"
                                name={`relation-${pair[0]}-${pair[1]}`}
                                value={type}
                                checked={formData.interStakeholderRelations?.[`${pair[0]}-${pair[1]}`] === type}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  interStakeholderRelations: {
                                    ...formData.interStakeholderRelations,
                                    [`${pair[0]}-${pair[1]}`]: e.target.value
                                  }
                                })}
                                style={{ display: 'none' }}
                              />
                              <div style={{ fontWeight: '500' }}>{type}</div>
                              <div style={{ fontSize: '0.625rem', color: '#6b7280', marginTop: '0.25rem' }}>{description}</div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}

          {/* Stakeholder Priority Question - OLD VERSION KEPT FOR COMPATIBILITY */}
          {question.type === 'stakeholder_priority' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {question.stakeholders.map((stakeholder, idx) => (
                <label key={idx} style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '1rem',
                  background: '#f9fafb',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  border: formData.priorityStakeholders?.includes(stakeholder.group) ? '2px solid #6366f1' : '2px solid transparent'
                }}>
                  <input
                    type="checkbox"
                    checked={formData.priorityStakeholders?.includes(stakeholder.group) || false}
                    onChange={(e) => {
                      const current = formData.priorityStakeholders || [];
                      if (e.target.checked) {
                        setFormData({ ...formData, priorityStakeholders: [...current, stakeholder.group] });
                      } else {
                        setFormData({ ...formData, priorityStakeholders: current.filter(s => s !== stakeholder.group) });
                      }
                    }}
                    style={{ marginRight: '1rem' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '500' }}>{stakeholder.group}</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      Influence: {stakeholder.influence}/10 • Interest: {stakeholder.interest}/10 • Current: {stakeholder.sentiment}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}

          {/* Risk Mitigation Question */}
          {question.type === 'risk_mitigation' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {question.risks.map((risk, idx) => (
                <div key={idx} style={{
                  padding: '1rem',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '0.5rem'
                }}>
                  <div style={{ fontWeight: '500', marginBottom: '0.5rem' }}>{risk.type}</div>
                  <div style={{ fontSize: '0.875rem', color: '#7f1d1d', marginBottom: '0.5rem' }}>
                    Impact: {risk.impact} • Probability: {risk.probability}
                  </div>
                  <input
                    type="text"
                    placeholder="How are you addressing this risk?"
                    value={localInputs[`risk_${risk.type}`] ?? (formData.riskMitigation?.[risk.type] || '')}
                    onChange={(e) => {
                      const value = e.target.value;
                      setLocalInputs(prev => ({ ...prev, [`risk_${risk.type}`]: value }));
                    }}
                    onBlur={() => {
                      const value = localInputs[`risk_${risk.type}`] || '';
                      setFormData({
                        ...formData,
                        riskMitigation: {
                          ...formData.riskMitigation,
                          [risk.type]: value
                        }
                      });
                    }}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Opportunity Question */}
          {question.type === 'opportunity_pursuit' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '0.75rem' }}>
              {question.opportunities.map((opp, idx) => (
                <label key={idx} style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '1rem',
                  background: '#f0fdf4',
                  border: formData.selectedOpportunities?.includes(opp.type) ? '2px solid #10b981' : '1px solid #86efac',
                  borderRadius: '0.5rem',
                  cursor: 'pointer'
                }}>
                  <input
                    type="checkbox"
                    checked={formData.selectedOpportunities?.includes(opp.type) || false}
                    onChange={(e) => {
                      const current = formData.selectedOpportunities || [];
                      if (e.target.checked) {
                        setFormData({ ...formData, selectedOpportunities: [...current, opp.type] });
                      } else {
                        setFormData({ ...formData, selectedOpportunities: current.filter(o => o !== opp.type) });
                      }
                    }}
                    style={{ marginRight: '0.75rem' }}
                  />
                  <div>
                    <div style={{ fontWeight: '500', color: '#065f46' }}>{opp.type}</div>
                    <div style={{ fontSize: '0.75rem', color: '#047857' }}>
                      {opp.timeframe} • {opp.potential} potential
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}

          {/* Test Question */}
          {question.type === 'test_question' && (
            <div style={{
              padding: '1rem',
              background: '#fef3c7',
              border: '1px solid #f59e0b',
              borderRadius: '0.5rem',
              color: '#92400e'
            }}>
              <div style={{ fontWeight: '500' }}>DEBUG: Question system is working!</div>
              <div style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                Company: {companyName} | Industry: {internalAnalysis?.profile?.industry || 'unknown'}
              </div>
            </div>
          )}

          {/* Industry Challenges Question */}
          {question.type === 'industry_challenges' && (
            <div>
              {question.industryData.trends.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Key Industry Trends:</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {question.industryData.trends.map((trend, idx) => (
                      <span key={idx} style={{
                        padding: '0.25rem 0.75rem',
                        background: '#e0e7ff',
                        color: '#4338ca',
                        borderRadius: '9999px',
                        fontSize: '0.75rem'
                      }}>{trend}</span>
                    ))}
                  </div>
                </div>
              )}
              <textarea
                placeholder="How is your organization addressing these industry trends and challenges?"
                value={localInputs.industryResponse ?? (formData.industryResponse || '')}
                onChange={(e) => {
                  const value = e.target.value;
                  setLocalInputs(prev => ({ ...prev, industryResponse: value }));
                }}
                onBlur={() => {
                  setFormData({ ...formData, industryResponse: localInputs.industryResponse || '' });
                }}
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  resize: 'vertical'
                }}
              />
            </div>
          )}

          {/* Communication Strategy Question */}
          {question.type === 'communication_strategy' && (
            <div>
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Recommended Approaches:</div>
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  {question.approaches.map((approach, idx) => (
                    <div key={idx} style={{
                      padding: '0.5rem',
                      background: '#f3f4f6',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem'
                    }}>
                      • {approach}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                  Which communication approach best aligns with your current goals?
                </label>
                <select
                  value={formData.communicationApproach || ''}
                  onChange={(e) => setFormData({ ...formData, communicationApproach: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    marginTop: '0.5rem'
                  }}
                >
                  <option value="">Select an approach...</option>
                  {question.approaches.map((approach, idx) => (
                    <option key={idx} value={approach}>{approach}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Current Events Question */}
          {question.type === 'current_events' && (
            <div>
              {question.sentimentBreakdown && (
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(3, 1fr)', 
                  gap: '0.5rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{
                    padding: '0.5rem',
                    background: '#d1fae5',
                    borderRadius: '0.375rem',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#065f46' }}>
                      {question.sentimentBreakdown.positive}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#064e3b' }}>Positive</div>
                  </div>
                  <div style={{
                    padding: '0.5rem',
                    background: '#fed7aa',
                    borderRadius: '0.375rem',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#92400e' }}>
                      {question.sentimentBreakdown.neutral}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#78350f' }}>Neutral</div>
                  </div>
                  <div style={{
                    padding: '0.5rem',
                    background: '#fecaca',
                    borderRadius: '0.375rem',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#7f1d1d' }}>
                      {question.sentimentBreakdown.negative}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#991b1b' }}>Negative</div>
                  </div>
                </div>
              )}
              <div style={{ marginBottom: '1rem' }}>
                {question.news.slice(0, 3).map((article, idx) => (
                  <div key={idx} style={{
                    padding: '0.75rem',
                    background: '#fffbeb',
                    border: '1px solid #fde68a',
                    borderRadius: '0.375rem',
                    marginBottom: '0.5rem',
                    fontSize: '0.875rem'
                  }}>
                    <div style={{ fontWeight: '500', color: '#92400e' }}>{article.title}</div>
                    <div style={{ fontSize: '0.75rem', color: '#b45309' }}>
                      {new Date(article.date).toLocaleDateString()} • Sentiment: {article.sentiment}
                    </div>
                  </div>
                ))}
              </div>
              <textarea
                placeholder="Are there any current situations or upcoming events we should consider?"
                value={localInputs.currentEvents ?? (formData.currentEvents || '')}
                onChange={(e) => {
                  const value = e.target.value;
                  setLocalInputs(prev => ({ ...prev, currentEvents: value }));
                }}
                onBlur={() => {
                  setFormData({ ...formData, currentEvents: localInputs.currentEvents || '' });
                }}
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  resize: 'vertical'
                }}
              />
            </div>
          )}
        </div>
      ))}

      {/* Timeline and Urgency */}
      <div style={{
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '0.75rem',
        padding: '2rem',
        marginBottom: '1.5rem'
      }}>
        <h3 style={{ 
          fontSize: '1.25rem', 
          fontWeight: '600', 
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Zap style={{ width: '20px', height: '20px', color: '#6366f1' }} />
          Implementation Timeline
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
              How quickly do you need to see results?
            </label>
            <select
              value={formData.timeframe || '6 months'}
              onChange={(e) => setFormData({ ...formData, timeframe: e.target.value })}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem'
              }}
            >
              <option value="immediate">Immediate (Crisis mode)</option>
              <option value="1 month">Within 1 month</option>
              <option value="3 months">Within 3 months</option>
              <option value="6 months">Within 6 months</option>
              <option value="12 months">Within 12 months</option>
            </select>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
              What resources can you dedicate?
            </label>
            <select
              value={formData.resources || 'moderate'}
              onChange={(e) => setFormData({ ...formData, resources: e.target.value })}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem'
              }}
            >
              <option value="minimal">Minimal (Small team, limited budget)</option>
              <option value="moderate">Moderate (Dedicated team, reasonable budget)</option>
              <option value="significant">Significant (Multiple teams, substantial budget)</option>
              <option value="unlimited">Unlimited (Full organizational support)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Additional Context */}
      <div style={{
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '0.75rem',
        padding: '2rem',
        marginBottom: '1.5rem'
      }}>
        <h3 style={{ 
          fontSize: '1.25rem', 
          fontWeight: '600', 
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Lightbulb style={{ width: '20px', height: '20px', color: '#6366f1' }} />
          Anything Else We Should Know?
        </h3>
        
        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
          Share any additional context that might help us refine your strategy:
        </p>

        <textarea
          value={localInputs.additionalNotes ?? (formData.additionalNotes || '')}
          onChange={(e) => {
            const value = e.target.value;
            setLocalInputs(prev => ({ ...prev, additionalNotes: value }));
          }}
          onBlur={() => {
            setFormData({ ...formData, additionalNotes: localInputs.additionalNotes || '' });
          }}
          placeholder="e.g., Upcoming product launches, internal changes, specific goals, constraints..."
          rows={4}
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid #d1d5db',
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            resize: 'vertical'
          }}
        />
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
        <button
          onClick={() => setCurrentStep('input')}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'white',
            color: '#374151',
            border: '1px solid #d1d5db',
            borderRadius: '0.5rem',
            fontSize: '1rem',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          Back
        </button>
        <button
          onClick={generateStrategy}
          style={{
            padding: '0.75rem 2rem',
            background: '#6366f1',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          Generate Strategy
          <Zap style={{ width: '16px', height: '16px' }} />
        </button>
      </div>
    </div>
  );
  };

  // Step 4: Generating
  const GeneratingStep = () => (
    <div style={{ 
      maxWidth: '500px', 
      margin: '0 auto', 
      padding: '4rem 2rem',
      textAlign: 'center'
    }}>
      <Target 
        style={{ 
          width: '64px', 
          height: '64px', 
          margin: '0 auto 2rem', 
          color: '#10b981',
          animation: 'pulse 2s infinite'
        }} 
      />
      
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        Generating Your Strategy
      </h2>
      
      <Loader 
        style={{ 
          width: '32px', 
          height: '32px', 
          margin: '0 auto 1rem',
          animation: 'spin 1s linear infinite'
        }} 
      />
      
      <p style={{ color: '#6b7280' }}>
        Creating comprehensive stakeholder engagement strategy...
      </p>
    </div>
  );

  // Step 5: Complete
  const CompleteStep = () => (
    <div style={{ 
      maxWidth: '600px', 
      margin: '0 auto', 
      padding: '4rem 2rem',
      textAlign: 'center'
    }}>
      <CheckCircle 
        style={{ 
          width: '64px', 
          height: '64px', 
          margin: '0 auto 2rem', 
          color: '#10b981'
        }} 
      />
      
      <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        Strategy Ready!
      </h2>
      
      <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
        Your stakeholder intelligence strategy has been created and is now active.
      </p>

      <div style={{
        background: '#f0fdf4',
        border: '1px solid #86efac',
        borderRadius: '0.5rem',
        padding: '1.5rem',
        marginBottom: '2rem'
      }}>
        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.125rem', color: '#065f46' }}>
          What's Next?
        </h3>
        <ul style={{ 
          margin: 0, 
          paddingLeft: '1.5rem', 
          textAlign: 'left',
          color: '#047857',
          fontSize: '0.875rem'
        }}>
          <li>View your personalized Intelligence Dashboard</li>
          <li>AI Agent begins gathering intelligence from multiple sources</li>
          <li>Real-time monitoring of stakeholder perceptions</li>
          <li>Strategic recommendations updated continuously</li>
        </ul>
      </div>

      <button
        onClick={() => window.location.reload()}
        style={{
          padding: '0.875rem 2rem',
          background: '#6366f1',
          color: 'white',
          border: 'none',
          borderRadius: '0.5rem',
          fontSize: '1rem',
          fontWeight: '600',
          cursor: 'pointer'
        }}
      >
        Go to Dashboard
      </button>
    </div>
  );

  return (
    <div style={{
      height: '100%',
      background: '#f8fafc',
      overflowY: 'auto'
    }}>
      {renderContent()}
    </div>
  );
};

export default StakeholderStrategyBuilder;