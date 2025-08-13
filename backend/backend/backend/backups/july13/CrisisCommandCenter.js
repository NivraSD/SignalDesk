import React, { useState, useRef, useEffect } from 'react';
import api from "../services/api";import { AlertTriangle, Users, MessageCircle, Shield, Activity, FileText, ChevronDown, ChevronUp, Bot, Send, Loader2, Bell, CheckCircle, XCircle, AlertCircle, Phone, Mail, Globe, Timer, ListChecks, PhoneCall, Radio, ExternalLink, ClipboardCheck, UserCheck, Calendar, Pencil } from 'lucide-react';
import './CrisisCommandCenter.css'; 

const CrisisCommandCenter = () => {
  // Crisis Plan States
  const [industry, setIndustry] = useState('');
  const [loading, setLoading] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStep, setGenerationStep] = useState('');
  const [crisisPlan, setCrisisPlan] = useState(null);
  const [error, setError] = useState('');
  const [expandedSections, setExpandedSections] = useState({});
  const [editingSection, setEditingSection] = useState(null);
  const [editedPlan, setEditedPlan] = useState(null);
  
  // Command Center States
  const [activeView, setActiveView] = useState('dashboard');
  const [activeAlert, setActiveAlert] = useState(false);
  const [crisisStatus, setCrisisStatus] = useState('monitoring');
  const [selectedScenario, setSelectedScenario] = useState(null);
  
  // Crisis Mode States
  const [showScenarioModal, setShowScenarioModal] = useState(false);
  const [crisisStartTime, setCrisisStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const [teamStatus, setTeamStatus] = useState({});
  const [tasks, setTasks] = useState([]);
  const [decisionLog, setDecisionLog] = useState([]);
  const [communicationStatus, setCommunicationStatus] = useState({});
  const [draftedResponses, setDraftedResponses] = useState({});
  const [draftingFor, setDraftingFor] = useState(null);
  
  // AI Advisor States
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isAIResponding, setIsAIResponding] = useState(false);
  const chatContainerRef = useRef(null);
  
  // Notifications
  const [notifications, setNotifications] = useState([]);

  // Helper Functions
  const cleanJsonResponse = (response) => {
    return response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  const addNotification = (message, type = 'info') => {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date().toLocaleTimeString()
    };
    setNotifications(prev => [notification, ...prev].slice(0, 10));
  };
  
  const addToDecisionLog = (entry) => {
    setDecisionLog(prev => [{
      id: Date.now(),
      ...entry,
      timestamp: new Date().toISOString()
    }, ...prev]);
  };

  // Default crisis team structure
  const getDefaultCrisisTeam = () => [
    {
      role: 'Crisis Response Leader',
      title: 'Chief Executive Officer or designated senior executive',
      name: '',
      contact: '',
      responsibilities: [
        'Overall crisis response authority and decision-making',
        'External stakeholder communications approval',
        'Resource allocation and strategic direction'
      ]
    },
    {
      role: 'Communications Director',
      title: 'Head of Communications/PR or senior communications executive',
      name: '',
      contact: '',
      responsibilities: [
        'Develop and implement communication strategies',
        'Media relations and press release coordination',
        'Message consistency across all channels'
      ]
    },
    {
      role: 'Operations Manager',
      title: 'Chief Operating Officer or senior operations executive',
      name: '',
      contact: '',
      responsibilities: [
        'Operational impact assessment and mitigation',
        'Business continuity plan activation',
        'Internal coordination and resource management'
      ]
    },
    {
      role: 'Legal Counsel',
      title: 'General Counsel or senior legal advisor',
      name: '',
      contact: '',
      responsibilities: [
        'Legal risk assessment and compliance guidance',
        'Regulatory notification requirements',
        'Litigation risk management'
      ]
    },
    {
      role: 'Human Resources Lead',
      title: 'Chief Human Resources Officer or senior HR executive',
      name: '',
      contact: '',
      responsibilities: [
        'Employee communications and support',
        'Staff safety and welfare coordination',
        'Union and labor relations management'
      ]
    }
  ];

  // Universal scenarios that apply to all industries
  const getUniversalScenarios = () => [
    {
      title: "Cyber Attack / Ransomware",
      description: "Sophisticated cyber attack compromising systems, encrypting data, or demanding ransom payment, potentially paralyzing operations",
      likelihood: "High",
      impact: "Critical",
      isUniversal: true
    },
    {
      title: "Executive Misconduct",
      description: "Senior leadership accused of illegal, unethical, or inappropriate behavior requiring immediate action and public response",
      likelihood: "Medium",
      impact: "Major",
      isUniversal: true
    },
    {
      title: "Workplace Violence Incident",
      description: "Active threat or violent incident at company facilities requiring immediate safety response and crisis management",
      likelihood: "Low",
      impact: "Critical",
      isUniversal: true
    },
    {
      title: "Financial Fraud or Embezzlement",
      description: "Discovery of internal financial misconduct, accounting irregularities, or embezzlement affecting company finances and credibility",
      likelihood: "Medium",
      impact: "Major",
      isUniversal: true
    },
    {
      title: "Pandemic/Health Emergency",
      description: "Widespread health crisis requiring business continuity measures, remote work protocols, and employee safety procedures",
      likelihood: "Medium",
      impact: "Major",
      isUniversal: true
    }
  ];

  // Fallback data for when API is unavailable
  const getFallbackData = (industry) => ({
    industry,
  scenarios: [
    {
      title: "Major Data Security Breach",
      description: `Unauthorized access to sensitive ${industry} data affecting customer records and proprietary information`,
      likelihood: "High",
      impact: "Critical",
      isUniversal: false
    },
    {
      title: "Regulatory Compliance Violation",
      description: `Significant breach of ${industry} regulations resulting in potential fines and operational restrictions`,
      likelihood: "Medium",
      impact: "Major",
      isUniversal: false
    },
    {
      title: "Supply Chain Disruption",
      description: `Critical supplier failure or logistics breakdown affecting ${industry} operations and service delivery`,
      likelihood: "Medium",
      impact: "Major",
      isUniversal: false
    },
    {
      title: "Reputation Crisis",
      description: `Negative media coverage or social media backlash damaging ${industry} brand and customer trust`,
      likelihood: "High",
      impact: "Moderate",
      isUniversal: false
    },
    {
      title: "Natural Disaster Impact",
      description: `Severe weather or natural disaster affecting ${industry} facilities and business continuity`,
      likelihood: "Low",
      impact: "Critical",
      isUniversal: false
    },
    ...getUniversalScenarios()
  ],
  stakeholders: [
    {
      name: "Customers/Clients",
      description: `Primary users of ${industry} products or services`,
      impactLevel: "High",
      concerns: [
        "Data security and privacy protection", // Relates to Data Security Breach scenario
        "Service continuity during crisis", // Relates to Supply Chain Disruption
        "Transparent communication about impacts" // General crisis concern
      ]
    },
    {
      name: "Employees",
      description: "Internal workforce and contractors",
      impactLevel: "High",
      concerns: [
        "Job security during reputation crisis", // Relates to Reputation Crisis scenario
        "Safety measures in workplace incidents", // Relates to universal scenarios
        "Clear guidance during emergencies" // General crisis concern
      ]
    },
    {
      name: "Shareholders/Investors",
      description: "Financial stakeholders and board members",
      impactLevel: "High",
      concerns: [
        "Financial impact of data breaches", // Relates to Data Security Breach
        "Regulatory fines and compliance issues", // Relates to Compliance Violation
        "Leadership response to crisis" // General crisis concern
      ]
    },
    // ... other stakeholders with scenario-specific concerns ...
  ],
  communicationPlans: [
    {
      stakeholder: "Customers/Clients",
      primaryChannel: "Email and company website",
      secondaryChannel: "Customer service hotline",
      keyMessages: [
        "We take data security seriously and are investigating the incident", // Addresses Data Breach scenario
        "Your service will continue uninterrupted despite the situation", // Addresses Supply Chain scenario
        "We will keep you informed with regular updates as we resolve this matter" // General crisis message
      ],
      timing: "Within 2 hours of crisis confirmation",
      spokesperson: "CEO or Chief Customer Officer"
    },
    // ... other communication plans with scenario-relevant messages ...
  ]
});

  // Crisis Timer Effect
  useEffect(() => {
    if (crisisStartTime && crisisStatus === 'active') {
      const interval = setInterval(() => {
        const elapsed = Date.now() - crisisStartTime.getTime();
        const hours = Math.floor(elapsed / 3600000);
        const minutes = Math.floor((elapsed % 3600000) / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        setElapsedTime(
          `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [crisisStartTime, crisisStatus]);

  // Start editing a section
  const startEditingSection = (section) => {
    setEditingSection(section);
    const planCopy = {...crisisPlan};
    
    // Ensure crisisTeam exists if editing team section
    if (section === 'team' && !planCopy.crisisTeam) {
      planCopy.crisisTeam = getDefaultCrisisTeam();
    }
    
    setEditedPlan(planCopy);
  };

  // Save edited section
  const saveEditedSection = () => {
    if (!editedPlan) {
      addNotification('No changes to save', 'error');
      return;
    }
    
    setCrisisPlan(editedPlan);
    setEditingSection(null);
    setEditedPlan(null);
    
    const sectionNames = {
      objectives: 'Objectives',
      team: 'Crisis Communications Team',
      process: 'Crisis Response Process',
      scenarios: 'Crisis Scenarios',
      stakeholders: 'Key Stakeholders',
      communication: 'Stakeholder Communication Plans',
      monitoring: 'Event Monitoring',
      evaluation: 'Post-Incident Evaluation'
    };
    addNotification(`${sectionNames[editingSection] || editingSection} section updated successfully`, 'success');
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingSection(null);
    setEditedPlan(null);
    addNotification('Changes discarded', 'info');
  };

  // Draft Response using Claude
  const draftResponse = async (stakeholder, plan) => {
    setDraftingFor(stakeholder);
    
    try {
      if (typeof window.claude !== 'undefined' && typeof window.claude.complete === 'function') {
        const prompt = `You are drafting a crisis communication for ${stakeholder} during a ${selectedScenario ? selectedScenario.title : 'crisis situation'} in the ${crisisPlan?.industry || 'business'} industry.

Key messages to include:
${plan.keyMessages.map((msg, i) => `${i + 1}. ${msg}`).join('\n')}

Communication channel: ${plan.primaryChannel}
Spokesperson: ${plan.spokesperson}
Timing requirement: ${plan.timing}

Draft a professional, empathetic, and clear communication that:
1. Addresses the crisis situation
2. Incorporates ALL the key messages listed above
3. Is appropriate for ${stakeholder}
4. Maintains trust and transparency
5. Provides clear next steps or actions

The tone should be appropriate for the stakeholder group and the severity of the situation.

Respond with ONLY the drafted message text, no other commentary.`;

        const response = await window.claude.complete(prompt);
        
        setDraftedResponses(prev => ({
          ...prev,
          [stakeholder]: {
            content: response,
            timestamp: new Date().toLocaleTimeString(),
            plan: plan
          }
        }));
        
        addNotification(`Response drafted for ${stakeholder}`, 'success');
      } else {
        // Fallback template
        const template = `Dear ${stakeholder},

We are writing to inform you about ${selectedScenario ? selectedScenario.title : 'a situation'} that may affect our operations.

${plan.keyMessages.map(msg => `• ${msg}`).join('\n')}

We are committed to keeping you informed as the situation develops. Please don't hesitate to reach out through ${plan.primaryChannel} if you have any questions or concerns.

Thank you for your patience and understanding.

Sincerely,
${plan.spokesperson}`;

        setDraftedResponses(prev => ({
          ...prev,
          [stakeholder]: {
            content: template,
            timestamp: new Date().toLocaleTimeString(),
            plan: plan
          }
        }));
        
        addNotification(`Template response created for ${stakeholder}`, 'info');
      }
    } catch (error) {
      console.error('Error drafting response:', error);
      addNotification('Failed to draft response. Please try again.', 'error');
    } finally {
      setDraftingFor(null);
    }
  };

  // Send Communication
  const sendCommunication = (stakeholder) => {
    setCommunicationStatus(prev => ({
      ...prev,
      [stakeholder]: 'sent'
    }));
    
    addToDecisionLog({
      action: 'Stakeholder Communication Sent',
      by: 'Communications Director',
      details: `Message sent to ${stakeholder}`,
      severity: 'info'
    });
    
    addNotification(`Communication sent to ${stakeholder}`, 'success');
  };

  // Update Task Status
  const updateTaskStatus = (taskId, newStatus) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, status: newStatus } : task
    ));
    
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      addToDecisionLog({
        action: 'Task Status Updated',
        by: task.assignee,
        details: `${task.task} - ${newStatus}`,
        severity: 'info'
      });
    }
  };

  // Update Team Member Status
  const updateTeamMemberStatus = (memberId, status) => {
    setTeamStatus(prev => ({
      ...prev,
      [memberId]: { ...prev[memberId], status, checkinTime: new Date().toLocaleTimeString() }
    }));
  };

  // Notify Crisis Team
  const notifyCrisisTeam = () => {
    // Get team members with email contacts
    const teamWithEmails = crisisPlan && crisisPlan.crisisTeam ? 
      crisisPlan.crisisTeam.filter(member => member.contact && member.contact.includes('@')) : [];
    
    const emailCount = teamWithEmails.length;
    const totalTeam = crisisPlan && crisisPlan.crisisTeam ? crisisPlan.crisisTeam.length : 5;
    
    // Log notification action
    addToDecisionLog({
      action: 'Crisis Team Email Notification',
      by: 'Crisis Response Leader',
      details: `Email alerts sent to ${emailCount} team members`,
      severity: 'critical'
    });
    
    // Show notification
    if (emailCount > 0) {
      addNotification(`Crisis alert emails sent to ${emailCount} team members`, 'success');
      
      // Update team status to show they've been notified
      Object.keys(teamStatus).forEach(memberId => {
        if (teamStatus[memberId].status === 'pending') {
          setTeamStatus(prev => ({
            ...prev,
            [memberId]: { ...prev[memberId], notified: true, notificationTime: new Date().toLocaleTimeString() }
          }));
        }
      });
    } else {
      addNotification(`No email contacts available. ${totalTeam} team members need contact info`, 'warning');
    }
  };

  // Activate Crisis Mode
  const activateCrisisMode = () => {
    setCrisisStatus('active');
    setActiveAlert(true);
    setShowScenarioModal(true);
    setCrisisStartTime(new Date());
    
    // Initialize team status
    const teamMembers = crisisPlan && crisisPlan.crisisTeam ? 
      crisisPlan.crisisTeam.map((member, index) => ({
        id: index + 1,
        name: member.name || member.role,
        role: member.role,
        title: member.title,
        status: 'pending'
      })) :
      [
        { id: 1, name: 'Crisis Response Leader', role: 'CEO', status: 'pending' },
        { id: 2, name: 'Communications Director', role: 'PR Head', status: 'pending' },
        { id: 3, name: 'Operations Manager', role: 'COO', status: 'pending' },
        { id: 4, name: 'Legal Counsel', role: 'General Counsel', status: 'pending' },
        { id: 5, name: 'HR Lead', role: 'CHRO', status: 'pending' }
      ];
    
    const statusMap = {};
    teamMembers.forEach(member => {
      statusMap[member.id] = member;
    });
    setTeamStatus(statusMap);
    
    // Log activation
    addToDecisionLog({
      action: 'Crisis Mode Activated',
      by: 'System Administrator',
      reason: 'Manual activation via command center',
      severity: 'critical'
    });
    
    addNotification('Crisis Mode Activated - All teams notified', 'error');
  };

  // Select Crisis Scenario
  const selectCrisisScenario = (scenario) => {
    setSelectedScenario(scenario);
    setShowScenarioModal(false);
    setDraftedResponses({});
    setCommunicationStatus({});
    
    // Generate tasks based on scenario
    generateCrisisTasks(scenario);
    
    // Log scenario selection
    addToDecisionLog({
      action: 'Crisis Scenario Selected',
      by: 'Crisis Response Leader',
      details: scenario.title,
      severity: scenario.impact.toLowerCase()
    });
    
    setActiveView('war-room');
    addNotification(`Active Scenario: ${scenario.title}`, 'warning');
  };

  // Generate Crisis Tasks
  const generateCrisisTasks = (scenario) => {
    const baseTasks = [];
    
    // Get team member names if available
    const getTeamMemberName = (role) => {
      if (crisisPlan && crisisPlan.crisisTeam) {
        const member = crisisPlan.crisisTeam.find(m => m.role.includes(role));
        return member && member.name ? member.name : role;
      }
      return role;
    };
    
    // Tasks from Crisis Response Process (Section 3)
    baseTasks.push(
      { id: 1, task: 'Detection & Initial Assessment - Identify crisis severity and potential impact', assignee: getTeamMemberName('Crisis Response Leader'), priority: 'critical', status: 'pending', section: 'Response Process' },
      { id: 2, task: 'Crisis Team Activation - Alert all team members and convene emergency meeting', assignee: getTeamMemberName('Crisis Response Leader'), priority: 'critical', status: 'pending', section: 'Response Process' },
      { id: 3, task: 'Situation Analysis - Gather information and identify affected stakeholders', assignee: getTeamMemberName('Operations Manager'), priority: 'critical', status: 'pending', section: 'Response Process' },
      { id: 4, task: 'Response Strategy Development - Create comprehensive response plan', assignee: getTeamMemberName('Crisis Response Leader'), priority: 'high', status: 'pending', section: 'Response Process' },
      { id: 5, task: 'Implementation & Communication - Execute plan and initiate communications', assignee: getTeamMemberName('Communications Director'), priority: 'high', status: 'pending', section: 'Response Process' }
    );
    
    // Add scenario-specific tasks (Section 4)
    if (scenario.impact === 'Critical') {
      baseTasks.push({
        id: 6,
        task: `Critical Impact Response: ${scenario.title} - Activate highest-level protocols`,
        assignee: getTeamMemberName('Operations Manager'),
        priority: 'critical',
        status: 'pending',
        section: 'Scenario Response'
      });
    }
    
    // Add stakeholder-specific tasks (Section 5) if crisisPlan exists
    if (crisisPlan && crisisPlan.stakeholders) {
      const highImpactStakeholders = crisisPlan.stakeholders.filter(s => s.impactLevel === 'High');
      highImpactStakeholders.slice(0, 3).forEach((stakeholder, index) => {
        baseTasks.push({
          id: baseTasks.length + 1,
          task: `Assess impact on ${stakeholder.name} - Address: ${stakeholder.concerns[0]}`,
          assignee: stakeholder.name.includes('Employee') ? getTeamMemberName('Human Resources Lead') : 
                   stakeholder.name.includes('Customer') ? getTeamMemberName('Communications Director') : 
                   getTeamMemberName('Crisis Response Leader'),
          priority: 'high',
          status: 'pending',
          section: 'Stakeholder Impact'
        });
      });
    }
    
    setTasks(baseTasks);
  };

  // Deactivate Crisis Mode
  const deactivateCrisisMode = () => {
    setCrisisStatus('monitoring');
    setActiveAlert(false);
    setSelectedScenario(null);
    setCrisisStartTime(null);
    setCommunicationStatus({});
    setDraftedResponses({});
    
    addToDecisionLog({
      action: 'Crisis Mode Deactivated',
      by: 'Crisis Response Leader',
      details: `Crisis resolved after ${elapsedTime}`,
      severity: 'info'
    });
    
    addNotification('Crisis Mode Deactivated - Returning to normal operations', 'success');
    setActiveView('dashboard');
  };

  // AI Chat Handler
const handleAIChat = async () => {
  if (!chatInput.trim()) return;
  
  const userMessage = {
    id: Date.now(),
    type: 'user',
    content: chatInput,
    timestamp: new Date().toLocaleTimeString()
  };
  
  setChatMessages(prev => [...prev, userMessage]);
  setChatInput('');
  setIsAIResponding(true);
  
  try {
    if (typeof window.claude !== 'undefined' && typeof window.claude.complete === 'function' && crisisPlan) {
      const context = `
        You are a crisis management advisor. The user has a crisis plan for the ${crisisPlan.industry} industry with:
        
        Industry-Specific Scenarios: ${crisisPlan.scenarios.filter(s => !s.isUniversal).map(s => s.title).join(', ')}
        
        Universal Scenarios: ${crisisPlan.scenarios.filter(s => s.isUniversal).map(s => s.title).join(', ')}
        
        Key Stakeholders: ${crisisPlan.stakeholders.map(s => s.name).join(', ')}
        
        Communication Plans for: ${crisisPlan.communicationPlans.map(p => p.stakeholder).join(', ')}
        
        ${selectedScenario ? `Active Crisis Scenario: ${selectedScenario.title}` : ''}
        
        Based on the user's crisis description, identify which scenario (industry-specific or universal) applies and provide specific guidance.
      `;
      
      const prompt = `${context}
      
      User's crisis: "${chatInput}"
      
      Respond with JSON:
      {
        "advice": "Detailed advice with specific steps",
        "immediateActions": ["Action 1", "Action 2", "Action 3"],
        "relevantScenario": "Matching scenario name or null",
        "urgencyLevel": "high/medium/low",
        "keyStakeholders": ["Stakeholder 1", "Stakeholder 2"],
        "suggestedMessage": "Brief holding statement"
      }
      
      ONLY valid JSON, no other text.`;
      
      const response = await window.claude.complete(prompt);
      console.log('Claude raw response:', response); // Debug log
      
      let aiResponse;
      try {
        aiResponse = JSON.parse(cleanJsonResponse(response));
        console.log('Parsed AI response:', aiResponse); // Debug log
      } catch (parseError) {
        console.error('Failed to parse Claude response:', parseError);
        // Fallback if JSON parsing fails
        aiResponse = {
          advice: "Based on your crisis situation, here's what I recommend: " + response.substring(0, 500),
          immediateActions: ["Activate crisis response team", "Assess full scope of situation", "Prepare initial stakeholder communications"],
          relevantScenario: null,
          urgencyLevel: "high",
          keyStakeholders: ["Employees", "Customers", "Media", "Regulatory bodies"],
          suggestedMessage: "We are aware of the current situation and have activated our crisis response team. We are thoroughly investigating the matter and will provide updates as more information becomes available. The safety and well-being of all stakeholders remains our highest priority."
        };
      }
      
      // Ensure suggestedMessage exists
      setChatMessages(prev => [...prev, aiResponse]);
      
      if (aiResponse.urgencyLevel === 'high' && crisisStatus !== 'active') {
        addNotification('AI recommends activating crisis mode', 'warning');
      }
      
      if (aiResponse.relevantScenario && crisisPlan && !selectedScenario) {
        const matchingScenario = crisisPlan.scenarios.find(s => 
          s.title.toLowerCase().includes(aiResponse.relevantScenario.toLowerCase())
        );
        if (matchingScenario && crisisStatus === 'active') {
          setSelectedScenario(matchingScenario);
        }
      }
    } else {
      // Fallback when Claude API is not available or no crisis plan
      const fallbackMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: crisisPlan 
          ? "Based on your crisis plan, I recommend: 1) Activate your crisis response team immediately, 2) Assess which scenario from your plan best matches this situation, 3) Begin stakeholder notifications according to your communication protocols."
          : "Without a crisis plan, I recommend: 1) Establish a crisis response team immediately, 2) Assess the scope and impact of the situation, 3) Begin notifying key stakeholders.",
        immediateActions: [
          "Convene crisis response team",
          "Assess situation severity",
          "Prepare stakeholder communications"
        ],
        urgencyLevel: "medium",
        suggestedMessage: "We are aware of the situation and are actively investigating. Our crisis response team has been activated and we are taking all necessary steps to address this matter. We will provide updates as more information becomes available.",
        timestamp: new Date().toLocaleTimeString()
      };
      setChatMessages(prev => [...prev, fallbackMessage]);
    }
  } catch (error) {
    console.error('Crisis advisor error:', error);
    const errorMessage = {
      id: Date.now() + 1,
      type: 'ai',
      content: 'I understand you need immediate crisis guidance. Please activate your crisis response team and follow your established protocols. Key steps: 1) Secure safety of all personnel, 2) Assess the situation scope, 3) Activate communication channels, 4) Document all actions.',
      immediateActions: [
        "Ensure safety of all personnel",
        "Activate crisis response team",
        "Establish communication command center",
        "Begin stakeholder notification process"
      ],
      urgencyLevel: "high",
      keyStakeholders: ["Employees", "Emergency Services", "Senior Leadership", "Legal Team"],
      suggestedMessage: "We are currently managing an evolving situation. Our crisis response team has been activated and we are taking all necessary precautions. We will communicate updates through official channels as the situation develops. Your safety and well-being remain our top priority.",
      isError: true,
      timestamp: new Date().toLocaleTimeString()
    };
    setChatMessages(prev => [...prev, errorMessage]);
  } finally {
    setIsAIResponding(false);
  }
};

  // Generate Crisis Plan
  const generateCrisisPlan = async () => {
    if (!industry) {
      setError('Please select an industry first');
      return;
    }
    
    setError(null);
    setLoading(true);
    setGenerationProgress(0);
    
    console.log('=== Crisis Plan Generation Debug ===');
    console.log('1. Industry:', industry);
    
    try {
      setGenerationStep('Connecting to crisis planning system...');
      setGenerationProgress(10);
      
      // Call backend API to generate complete plan
const response = await api.post('/crisis/generate-plan', { industry });
      console.log('2. API Response:', response);
      
      if (response && response.plan && response.plan.plan_data) {
        const planData = response.plan.plan_data;
        
        setGenerationProgress(90);
        setGenerationStep('Finalizing crisis plan...');
        
        // Set the complete plan
        setCrisisPlan({
          industry: industry,
          ...planData
        });
        
        // Set editable sections
        
        setGenerationProgress(100);
        setGenerationStep('Crisis plan generated successfully!');
        
        setTimeout(() => {
          setGenerationProgress(0);
          setGenerationStep('');
        }, 2000);
        
        console.log('3. Crisis plan set successfully:', planData);
      } else {
        throw new Error('Invalid response format from API');
      }
    } catch (error) {
      console.error('Error generating crisis plan:', error);
      setError('Failed to generate crisis plan. Please try again.');
      
      // Use fallback data
      const fallbackPlan = getFallbackData(industry);
      setCrisisPlan(fallbackPlan);
      
      console.log('Using fallback plan data');
    } finally {
      setLoading(false);
    }
  };
  // Define which sections have edit functionality
  const editableSections = ['objectives', 'team', 'scenarios', 'stakeholders', 'communication'];

  const SectionHeader = ({ icon: Icon, title, section }) => (
    <div 
      className="flex items-center justify-between cursor-pointer p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
      onClick={() => toggleSection(section)}
    >
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
      </div>
      <div className="flex items-center gap-2">
        {expandedSections[section] && editingSection !== section && editableSections.includes(section) && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              startEditingSection(section);
            }}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"
          >
            <Pencil className="w-3 h-3" />
            Edit
          </button>
        )}
        {expandedSections[section] ? 
          <ChevronUp className="w-5 h-5 text-gray-500" /> : 
          <ChevronDown className="w-5 h-5 text-gray-500" />
        }
      </div>
    </div>
  );

  const StatusIndicator = () => {
    const statusConfig = {
      monitoring: { color: 'green', icon: CheckCircle, text: 'Normal Operations' },
      alert: { color: 'yellow', icon: AlertCircle, text: 'Alert Status' },
      active: { color: 'red', icon: XCircle, text: 'Crisis Active' }
    };
    
    const config = statusConfig[crisisStatus];
    const Icon = config.icon;
    
    return (
      <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
        crisisStatus === 'monitoring' ? 'bg-green-100 border-green-300' :
        crisisStatus === 'alert' ? 'bg-yellow-100 border-yellow-300' :
        'bg-red-100 border-red-300'
      } border`}>
        <Icon className={`w-5 h-5 ${
          crisisStatus === 'monitoring' ? 'text-green-600' :
          crisisStatus === 'alert' ? 'text-yellow-600' :
          'text-red-600'
        }`} />
        <span className={`font-semibold ${
          crisisStatus === 'monitoring' ? 'text-green-800' :
          crisisStatus === 'alert' ? 'text-yellow-800' :
          'text-red-800'
        }`}>{config.text}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <Shield className="w-8 h-8 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">Crisis Command Center</h1>
              </div>
              {crisisPlan && (
                <div className="text-sm text-gray-600">
                  {crisisPlan.industry ? crisisPlan.industry.charAt(0).toUpperCase() + crisisPlan.industry.slice(1) : "Unknown"} Industry
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
              {crisisStatus === 'active' && (
                <div className="flex items-center gap-2 px-3 py-1 bg-red-50 rounded-lg">
                  <Timer className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-mono text-red-800">{elapsedTime}</span>
                </div>
              )}
              <StatusIndicator />
              <div className="relative">
                <Bell className={`w-6 h-6 ${activeAlert ? 'text-red-600 animate-pulse' : 'text-gray-600'}`} />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveView('dashboard')}
              className={`py-3 px-4 border-b-2 transition-colors ${
                activeView === 'dashboard' 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              Dashboard
            </button>
            {crisisStatus === 'active' && (
              <button
                onClick={() => setActiveView('war-room')}
                className={`py-3 px-4 border-b-2 transition-colors relative ${
                  activeView === 'war-room' 
                    ? 'border-red-600 text-red-600' 
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                Crisis War Room
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
              </button>
            )}
            <button
              onClick={() => setActiveView('plan')}
              className={`py-3 px-4 border-b-2 transition-colors ${
                activeView === 'plan' 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              Crisis Plan
            </button>
            <button
              onClick={() => setActiveView('advisor')}
              className={`py-3 px-4 border-b-2 transition-colors relative ${
                activeView === 'advisor' 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              AI Advisor
              {activeAlert && activeView !== 'advisor' && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Scenario Selection Modal */}
        {showScenarioModal && crisisPlan && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-xl w-full max-h-[50vh] flex flex-col">
              <div className="p-3 border-b">
                <h2 className="text-lg font-bold text-gray-900">Select Active Crisis Scenario</h2>
                <p className="text-xs text-gray-600 mt-0.5">Choose the scenario that best matches the current crisis situation</p>
              </div>
              
              <div className="flex-1 overflow-y-auto p-3">
                {/* Industry-Specific Scenarios */}
                <div className="mb-3">
                  <h3 className="font-semibold text-gray-700 mb-1.5 text-xs uppercase tracking-wider">Industry-Specific</h3>
                  <div className="space-y-1.5">
                    {crisisPlan.scenarios.filter(s => !s.isUniversal).map((scenario, index) => (
                      <button
                        key={`industry-${index}`}
                        onClick={() => selectCrisisScenario(scenario)}
                        className="w-full text-left p-2.5 border rounded hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <h3 className="font-medium text-gray-800 text-sm flex-1 pr-2">{scenario.title}</h3>
                          <div className="flex gap-1 flex-shrink-0">
                            <span className={`px-1 py-0.5 text-xs rounded ${
                              scenario.likelihood === 'High' ? 'bg-red-100 text-red-700' :
                              scenario.likelihood === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {scenario.likelihood[0]}
                            </span>
                            <span className={`px-1 py-0.5 text-xs rounded ${
                              scenario.impact === 'Critical' ? 'bg-red-100 text-red-700' :
                              scenario.impact === 'Major' ? 'bg-orange-100 text-orange-700' :
                              scenario.impact === 'Moderate' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {scenario.impact[0]}
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Universal Scenarios */}
                <div>
                  <h3 className="font-semibold text-gray-700 mb-1.5 text-xs uppercase tracking-wider">Universal</h3>
                  <div className="space-y-1.5">
                    {crisisPlan.scenarios.filter(s => s.isUniversal).map((scenario, index) => (
                      <button
                        key={`universal-${index}`}
                        onClick={() => selectCrisisScenario(scenario)}
                        className="w-full text-left p-2.5 border border-blue-200 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <h3 className="font-medium text-gray-800 text-sm flex-1 pr-2">{scenario.title}</h3>
                          <div className="flex gap-1 flex-shrink-0">
                            <span className={`px-1 py-0.5 text-xs rounded ${
                              scenario.likelihood === 'High' ? 'bg-red-100 text-red-700' :
                              scenario.likelihood === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {scenario.likelihood[0]}
                            </span>
                            <span className={`px-1 py-0.5 text-xs rounded ${
                              scenario.impact === 'Critical' ? 'bg-red-100 text-red-700' :
                              scenario.impact === 'Major' ? 'bg-orange-100 text-orange-700' :
                              scenario.impact === 'Moderate' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {scenario.impact[0]}
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="p-3 border-t">
                <button
                  onClick={() => setShowScenarioModal(false)}
                  className="w-full px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard View */}
        {activeView === 'dashboard' && (
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={activateCrisisMode}
                  disabled={crisisStatus === 'active' || !crisisPlan}
                  className="p-4 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                  <p className="font-semibold text-red-800">Activate Crisis Mode</p>
                  {!crisisPlan && <p className="text-xs text-red-600 mt-1">Generate plan first</p>}
                </button>
                <button
                  onClick={() => setActiveView('advisor')}
                  className="p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  <Bot className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <p className="font-semibold text-purple-800">Consult AI Advisor</p>
                </button>
                <button
                  onClick={() => setActiveView('plan')}
                  className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <FileText className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="font-semibold text-blue-800">View Crisis Plan</p>
                </button>
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Notifications</h2>
              {notifications.length > 0 ? (
                <div className="space-y-2">
                  {notifications.slice(0, 5).map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-3 rounded-lg flex items-center justify-between ${
                        notif.type === 'error' ? 'bg-red-50 text-red-800' :
                        notif.type === 'warning' ? 'bg-yellow-50 text-yellow-800' :
                        notif.type === 'success' ? 'bg-green-50 text-green-800' :
                        'bg-gray-50 text-gray-800'
                      }`}
                    >
                      <span className="text-sm">{notif.message}</span>
                      <span className="text-xs opacity-70">{notif.timestamp}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No recent notifications</p>
              )}
            </div>

            {/* Plan Generation */}
            {!crisisPlan && (
              <div className="bg-white rounded-lg shadow-lg p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Generate Crisis Plan</h2>
                <p className="text-gray-600 mb-6">Create a comprehensive crisis management plan tailored to your industry</p>
                <div className="flex gap-4">
                  <input
                    type="text"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder="Enter your industry (e.g., healthcare, finance, retail)"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyPress={(e) => e.key === 'Enter' && generateCrisisPlan()}
                    disabled={loading}
                  />
                  <button
                    onClick={generateCrisisPlan}
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                  >
                    {loading ? 'Generating...' : 'Generate Plan'}
                  </button>
                </div>
                
                {/* Progress Bar */}
                {loading && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">{generationStep}</span>
                      <span className="text-sm font-medium text-gray-700">{generationProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div 
                        className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out relative overflow-hidden"
                        style={{ width: `${generationProgress}%` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500"></div>
                        <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-600 text-center">
                      {generationProgress < 33 && "📊 Analyzing industry-specific risks..."}
                      {generationProgress >= 33 && generationProgress < 66 && "👥 Mapping stakeholder relationships..."}
                      {generationProgress >= 66 && generationProgress < 90 && "📝 Developing communication strategies..."}
                      {generationProgress >= 90 && "✅ Finalizing your crisis management plan..."}
                    </div>
                  </div>
                )}
                
                {error && (
                  <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
                    {error}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Crisis War Room View */}
        {activeView === 'war-room' && crisisStatus === 'active' && (
          <div className="space-y-6">
            {/* Crisis Header */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-red-800">Crisis War Room</h2>
                  {selectedScenario && (
                    <p className="text-red-600 mt-1">Active Scenario: {selectedScenario.title}</p>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  {crisisPlan && (
                    <div className="text-sm">
                      <span className="text-gray-600">Communications: </span>
                      <span className="font-semibold text-gray-800">
                        {Object.keys(communicationStatus).filter(k => communicationStatus[k] === 'sent').length} sent, 
                        {' '}{Object.keys(draftedResponses).length} drafted
                      </span>
                    </div>
                  )}
                  <button
                    onClick={deactivateCrisisMode}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    Deactivate Crisis Mode
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Team Status */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Team Status
                </h3>
                <div className="space-y-3">
                  {Object.values(teamStatus).map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium text-sm">{member.name}</p>
                        <p className="text-xs text-gray-600">{member.role}{member.title && member.name !== member.role ? ` - ${member.title}` : ''}</p>
                        {member.notified && (
                          <p className="text-xs text-blue-600 mt-0.5">✉️ Notified at {member.notificationTime}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {member.status === 'active' ? (
                          <span className="flex items-center gap-1 text-xs text-green-600">
                            <CheckCircle className="w-3 h-3" />
                            <span>{member.checkinTime}</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => updateTeamMemberStatus(member.id, 'active')}
                            className="text-xs px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                          >
                            Check In
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={notifyCrisisTeam}
                  className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                >
                  <Mail className="w-4 h-4 inline mr-2" />
                  Notify Team
                </button>
              </div>

              {/* Critical Tasks */}
<div className="bg-white rounded-lg shadow-lg p-6">
  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
    <ListChecks className="w-5 h-5 text-blue-600" />
    Critical Tasks
  </h3>
  <div className="space-y-2 max-h-96 overflow-y-auto">
    {tasks.map((task) => (
      <div 
        key={task.id} 
        className={`rounded-lg ${task.priority === 'critical' ? 'bg-red-50' : 'bg-yellow-50'}`}
        style={{ padding: '6px 8px', marginBottom: '4px' }}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p style={{ fontSize: '12px', fontWeight: '500', lineHeight: '1.2', margin: '0' }}>
              {task.task}
            </p>
            <div className="flex items-center gap-3" style={{ marginTop: '2px' }}>
              <p style={{ fontSize: '10px', color: '#666', margin: '0' }}>
                Assigned: {task.assignee}
              </p>
              <p style={{ fontSize: '10px', color: '#888', margin: '0' }}>
                From: {task.section}
              </p>
            </div>
          </div>
          <select
            value={task.status}
            onChange={(e) => updateTaskStatus(task.id, e.target.value)}
            style={{
              fontSize: '8px',
              padding: '0px 1px',
              height: '15px',
              width: '38px',
              border: '1px solid #ddd',
              borderRadius: '2px',
              backgroundColor: 'white',
              lineHeight: '1',
              cursor: 'pointer'
            }}
          >
            <option value="pending">Pend</option>
            <option value="in-progress">Prog</option>
            <option value="completed">Done</option>
          </select>
        </div>
      </div>
    ))}
  </div>
</div>
              {/* Stakeholder Communications */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-blue-600" />
                  Stakeholder Communications
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {crisisPlan && crisisPlan.communicationPlans ? (
                    crisisPlan.communicationPlans.map((plan, index) => (
                      <div key={index} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-800">{plan.stakeholder}</h4>
                            <p className="text-xs text-gray-600 mt-1">{plan.timing}</p>
                          </div>
                          {communicationStatus[plan.stakeholder] === 'sent' ? (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">✓ Sent</span>
                          ) : draftedResponses[plan.stakeholder] ? (
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">✓ Drafted</span>
                          ) : (
                            <button
                              onClick={() => draftResponse(plan.stakeholder, plan)}
                              disabled={draftingFor === plan.stakeholder}
                              className="text-xs px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                            >
                              {draftingFor === plan.stakeholder ? (
                                <span className="flex items-center gap-1">
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  Drafting...
                                </span>
                              ) : (
                                'Draft Response'
                              )}
                            </button>
                          )}
                        </div>
                        <div className="space-y-2 text-xs">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <p className="font-medium text-gray-700">Primary Channel:</p>
                              <p className="text-gray-600">{plan.primaryChannel}</p>
                            </div>
                            <div>
                              <p className="font-medium text-gray-700">Spokesperson:</p>
                              <p className="text-gray-600">{plan.spokesperson}</p>
                            </div>
                          </div>
                          <div>
                            <p className="font-medium text-gray-700">Key Messages:</p>
                            <ul className="text-gray-600 mt-1 space-y-0.5">
                              {plan.keyMessages.slice(0, 2).map((msg, idx) => (
                                <li key={idx} className="flex items-start">
                                  <span className="text-blue-600 mr-1">•</span>
                                  <span>{msg}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                        
                        {/* Show loading state while drafting */}
                        {draftingFor === plan.stakeholder && (
                          <div className="mt-3 p-3 bg-purple-50 rounded border border-purple-200">
                            <div className="flex items-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                              <p className="text-sm text-purple-700">Drafting response based on key messages...</p>
                            </div>
                          </div>
                        )}
                        
                        {/* Show drafted response if available */}
                        {draftedResponses[plan.stakeholder] && draftingFor !== plan.stakeholder && (
                          <div className="mt-3 p-3 bg-purple-50 rounded border border-purple-200">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs font-semibold text-purple-800">Drafted Response:</p>
                              <span className="text-xs text-purple-600">{draftedResponses[plan.stakeholder].timestamp}</span>
                            </div>
                            <div className="bg-white p-3 rounded border border-purple-100 mb-2 max-h-48 overflow-y-auto">
                              <p className="text-xs text-gray-700 whitespace-pre-wrap">{draftedResponses[plan.stakeholder].content}</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(draftedResponses[plan.stakeholder].content);
                                  addNotification('Response copied to clipboard', 'success');
                                }}
                                className="text-xs px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
                              >
                                Copy to Clipboard
                              </button>
                              <button
                                onClick={() => sendCommunication(plan.stakeholder)}
                                className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                              >
                                Mark as Sent
                              </button>
                              <button
                                onClick={() => draftResponse(plan.stakeholder, plan)}
                                className="text-xs px-2 py-1 border border-purple-600 text-purple-600 rounded hover:bg-purple-50"
                              >
                                Redraft
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">No communication plans available</p>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Resource Hub */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-blue-600" />
                  Emergency Contacts & Resources
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <button className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 text-left">
                    <p className="font-medium text-sm">Legal Hotline</p>
                    <p className="text-xs text-gray-600">1-800-LEGAL-01</p>
                  </button>
                  <button className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 text-left">
                    <p className="font-medium text-sm">PR Agency</p>
                    <p className="text-xs text-gray-600">1-800-CRISIS-PR</p>
                  </button>
                  <button className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 text-left">
                    <p className="font-medium text-sm">Insurance</p>
                    <p className="text-xs text-gray-600">1-800-INSURE-01</p>
                  </button>
                  <button className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 text-left">
                    <p className="font-medium text-sm">IT Security</p>
                    <p className="text-xs text-gray-600">1-800-SECURE-IT</p>
                  </button>
                </div>
              </div>

              {/* Decision Log */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5 text-blue-600" />
                  Decision Log
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {decisionLog.slice(0, 5).map((entry) => (
                    <div key={entry.id} className="p-2 bg-gray-50 rounded text-sm">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{entry.action}</p>
                        <span className={`text-xs px-2 py-1 rounded ${
                          entry.severity === 'critical' ? 'bg-red-100 text-red-700' :
                          entry.severity === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {entry.severity}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">By: {entry.by}</p>
                      {entry.details && <p className="text-xs text-gray-600 mt-1">{entry.details}</p>}
                      <p className="text-xs text-gray-500">{new Date(entry.timestamp).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">External Communications</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button className="p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                  <Mail className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm font-medium">Send All-Staff Email</p>
                </button>
                <button className="p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                  <Globe className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                  <p className="text-sm font-medium">Update Website</p>
                </button>
                <button className="p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                  <Radio className="w-6 h-6 text-green-600 mx-auto mb-2" />
                  <p className="text-sm font-medium">Media Statement</p>
                </button>
                <button className="p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors">
                  <ExternalLink className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
                  <p className="text-sm font-medium">Social Media Post</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Crisis Plan View */}
        {activeView === 'plan' && crisisPlan && (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-blue-600 text-white p-6">
              <h1 className="text-2xl font-bold">Crisis Management Plan</h1>
              <p className="text-blue-100 mt-2">{crisisPlan.industry ? crisisPlan.industry.charAt(0).toUpperCase() + crisisPlan.industry.slice(1) : "Unknown"} Industry</p>
              <p className="text-sm text-blue-100 mt-1">Generated on {crisisPlan.generatedDate}</p>
              {!crisisPlan.isAIGenerated && (
                <p className="text-xs text-blue-200 mt-2 italic">Using template data - Claude API unavailable</p>
              )}
              <p className="text-xs text-blue-200 mt-2">Click on any section header to expand. Sections 1, 2, 4, 5, and 6 are editable.</p>
            </div>

            {/* Objectives Section */}
            <div className="border-b">
              <SectionHeader icon={Shield} title="1. Objectives" section="objectives" />
              {expandedSections.objectives && (
                <div className="p-6">
                  {editingSection === 'objectives' ? (
                    // Edit Mode
                    <div className="space-y-3">
                      <textarea
                        value={editedPlan.objectives || `• Protect the safety and well-being of all stakeholders including employees, customers, and the public
• Maintain operational continuity and minimize business disruption during crisis events
• Preserve organizational reputation and maintain stakeholder trust through transparent communication
• Ensure compliance with all regulatory requirements and legal obligations
• Enable rapid, coordinated response to minimize financial and operational impact`}
                        onChange={(e) => setEditedPlan({...editedPlan, objectives: e.target.value})}
                        className="w-full px-3 py-2 border rounded"
                        rows="8"
                        placeholder="Enter crisis management objectives (use • for bullet points)"
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={cancelEditing}
                          className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={saveEditedSection}
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <ul className="space-y-3">
                      {(crisisPlan.objectives ? crisisPlan.objectives.split('\n').filter(line => line.trim()) : [
                        '• Protect the safety and well-being of all stakeholders including employees, customers, and the public',
                        '• Maintain operational continuity and minimize business disruption during crisis events',
                        '• Preserve organizational reputation and maintain stakeholder trust through transparent communication',
                        '• Ensure compliance with all regulatory requirements and legal obligations',
                        '• Enable rapid, coordinated response to minimize financial and operational impact'
                      ]).map((objective, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-blue-600 mr-2">•</span>
                          <span>{objective.replace('•', '').trim()}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* Crisis Communications Team */}
            <div className="border-b">
              <SectionHeader icon={Users} title="2. Crisis Communications Team" section="team" />
              {expandedSections.team && (
                <div className="p-6">
                  {editingSection === 'team' ? (
                    // Edit Mode
                    <div className="space-y-4">
                      {editedPlan.crisisTeam && editedPlan.crisisTeam.map((member, index) => (
                        <div key={index} className="bg-gray-50 p-4 rounded-lg border">
                          <div className="mb-3 grid gap-2">
                            <div>
                              <label className="text-xs font-medium text-gray-700">Role:</label>
                              <input
                                type="text"
                                value={member.role}
                                onChange={(e) => {
                                  const newTeam = [...editedPlan.crisisTeam];
                                  newTeam[index].role = e.target.value;
                                  setEditedPlan({...editedPlan, crisisTeam: newTeam});
                                }}
                                className="w-full px-2 py-1 border rounded text-sm font-semibold"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-gray-700">Title/Department:</label>
                              <input
                                type="text"
                                value={member.title}
                                onChange={(e) => {
                                  const newTeam = [...editedPlan.crisisTeam];
                                  newTeam[index].title = e.target.value;
                                  setEditedPlan({...editedPlan, crisisTeam: newTeam});
                                }}
                                className="w-full px-2 py-1 border rounded text-sm text-gray-600"
                              />
                            </div>
                          </div>
                          <div className="mb-3 grid gap-2 md:grid-cols-2">
                            <div>
                              <label className="text-sm font-medium text-gray-700 block mb-1">Assigned Person:</label>
                              <input
                                type="text"
                                value={member.name || ''}
                                onChange={(e) => {
                                  const newTeam = [...editedPlan.crisisTeam];
                                  newTeam[index].name = e.target.value;
                                  setEditedPlan({...editedPlan, crisisTeam: newTeam});
                                }}
                                className="w-full px-3 py-2 border rounded"
                                placeholder="Enter full name"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-700 block mb-1">Contact:</label>
                              <input
                                type="text"
                                value={member.contact || ''}
                                onChange={(e) => {
                                  const newTeam = [...editedPlan.crisisTeam];
                                  newTeam[index].contact = e.target.value;
                                  setEditedPlan({...editedPlan, crisisTeam: newTeam});
                                }}
                                className="w-full px-3 py-2 border rounded"
                                placeholder="Email or phone"
                              />
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-1">Responsibilities:</p>
                            <ul className="text-sm text-gray-600 space-y-1">
                              {member.responsibilities.map((resp, idx) => (
                                <li key={idx}>• {resp}</li>
                              ))}
                            </ul>
                          </div>
                          {index >= 5 && (
                            <button
                              onClick={() => {
                                const newTeam = editedPlan.crisisTeam.filter((_, i) => i !== index);
                                setEditedPlan({...editedPlan, crisisTeam: newTeam});
                              }}
                              className="mt-2 text-xs text-red-600 hover:text-red-800"
                            >
                              Remove this member
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          const newMember = {
                            role: 'Additional Team Member',
                            title: 'Specify title/department',
                            name: '',
                            contact: '',
                            responsibilities: ['Define specific responsibilities for this role']
                          };
                          setEditedPlan({
                            ...editedPlan, 
                            crisisTeam: [...editedPlan.crisisTeam, newMember]
                          });
                        }}
                        className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-800"
                      >
                        + Add Team Member
                      </button>
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={cancelEditing}
                          className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={saveEditedSection}
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div>
                      {crisisPlan.crisisTeam && (
                        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-800">
                            <span className="font-semibold">Team Status: </span>
                            {crisisPlan.crisisTeam.filter(m => m.name).length} of {crisisPlan.crisisTeam.length} positions filled
                          </p>
                        </div>
                      )}
                      <div className="grid gap-4">
                        {crisisPlan.crisisTeam ? (
                          crisisPlan.crisisTeam.map((member, index) => (
                            <div key={index} className="bg-gray-50 p-4 rounded-lg">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h3 className="font-semibold text-gray-800 mb-1">{member.role}</h3>
                                  {member.name && (
                                    <div className="mb-1">
                                      <p className="text-blue-600 font-medium">{member.name}</p>
                                      {member.contact && (
                                        <p className="text-xs text-gray-600">{member.contact}</p>
                                      )}
                                    </div>
                                  )}
                                  <p className="text-gray-600 text-sm mb-2">{member.title}</p>
                                </div>
                                {member.name && (
                                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Assigned</span>
                                )}
                              </div>
                              <ul className="text-sm text-gray-600 space-y-1">
                                {member.responsibilities.map((resp, idx) => (
                                  <li key={idx}>• {resp}</li>
                                ))}
                              </ul>
                            </div>
                          ))
                        ) : (
                          // Fallback for plans without crisisTeam property
                          <>
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <h3 className="font-semibold text-gray-800 mb-2">Crisis Response Leader</h3>
                              <p className="text-gray-600 text-sm mb-2">Chief Executive Officer or designated senior executive</p>
                              <ul className="text-sm text-gray-600 space-y-1">
                                <li>• Overall crisis response authority and decision-making</li>
                                <li>• External stakeholder communications approval</li>
                                <li>• Resource allocation and strategic direction</li>
                              </ul>
                            </div>
                            
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <h3 className="font-semibold text-gray-800 mb-2">Communications Director</h3>
                              <p className="text-gray-600 text-sm mb-2">Head of Communications/PR or senior communications executive</p>
                              <ul className="text-sm text-gray-600 space-y-1">
                                <li>• Develop and implement communication strategies</li>
                                <li>• Media relations and press release coordination</li>
                                <li>• Message consistency across all channels</li>
                              </ul>
                            </div>
                            
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <h3 className="font-semibold text-gray-800 mb-2">Operations Manager</h3>
                              <p className="text-gray-600 text-sm mb-2">Chief Operating Officer or senior operations executive</p>
                              <ul className="text-sm text-gray-600 space-y-1">
                                <li>• Operational impact assessment and mitigation</li>
                                <li>• Business continuity plan activation</li>
                                <li>• Internal coordination and resource management</li>
                              </ul>
                            </div>
                            
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <h3 className="font-semibold text-gray-800 mb-2">Legal Counsel</h3>
                              <p className="text-gray-600 text-sm mb-2">General Counsel or senior legal advisor</p>
                              <ul className="text-sm text-gray-600 space-y-1">
                                <li>• Legal risk assessment and compliance guidance</li>
                                <li>• Regulatory notification requirements</li>
                                <li>• Litigation risk management</li>
                              </ul>
                            </div>
                            
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <h3 className="font-semibold text-gray-800 mb-2">Human Resources Lead</h3>
                              <p className="text-gray-600 text-sm mb-2">Chief Human Resources Officer or senior HR executive</p>
                              <ul className="text-sm text-gray-600 space-y-1">
                                <li>• Employee communications and support</li>
                                <li>• Staff safety and welfare coordination</li>
                                <li>• Union and labor relations management</li>
                              </ul>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Process for Responding to Crisis */}
            <div className="border-b">
              <SectionHeader icon={Activity} title="3. Crisis Response Process" section="process" />
              {expandedSections.process && (
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-semibold">1</div>
                      <div className="ml-4">
                        <h4 className="font-semibold text-gray-800">Detection & Initial Assessment</h4>
                        <p className="text-gray-600 text-sm mt-1">Identify potential crisis through monitoring systems, employee reports, or external alerts. Conduct rapid initial assessment of severity and potential impact.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-semibold">2</div>
                      <div className="ml-4">
                        <h4 className="font-semibold text-gray-800">Crisis Team Activation</h4>
                        <p className="text-gray-600 text-sm mt-1">Alert crisis response team members through established communication channels. Convene emergency meeting within 30 minutes of crisis identification.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-semibold">3</div>
                      <div className="ml-4">
                        <h4 className="font-semibold text-gray-800">Situation Analysis</h4>
                        <p className="text-gray-600 text-sm mt-1">Gather all available information, assess immediate threats, identify affected stakeholders, and determine resource requirements.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-semibold">4</div>
                      <div className="ml-4">
                        <h4 className="font-semibold text-gray-800">Response Strategy Development</h4>
                        <p className="text-gray-600 text-sm mt-1">Develop comprehensive response strategy including operational actions, communication plans, and resource allocation based on scenario assessment.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-semibold">5</div>
                      <div className="ml-4">
                        <h4 className="font-semibold text-gray-800">Implementation & Communication</h4>
                        <p className="text-gray-600 text-sm mt-1">Execute response plan, initiate stakeholder communications, deploy resources, and begin continuous monitoring of situation evolution.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-semibold">6</div>
                      <div className="ml-4">
                        <h4 className="font-semibold text-gray-800">Ongoing Management</h4>
                        <p className="text-gray-600 text-sm mt-1">Maintain crisis response operations, provide regular updates, adjust strategy as needed, and coordinate with external agencies.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Possible Scenarios */}
            <div className="border-b">
              <SectionHeader icon={AlertTriangle} title="4. Crisis Scenarios" section="scenarios" />
              {expandedSections.scenarios && (
                <div className="p-6 space-y-6">
                  {editingSection === 'scenarios' ? (
                    // Edit Mode
                    <div className="space-y-6">
                      <div>
                        <h3 className="font-semibold text-gray-800 mb-3 text-lg">Industry-Specific Scenarios</h3>
                        <div className="space-y-3">
                          {editedPlan.scenarios.filter(s => !s.isUniversal).map((scenario, index) => (
                            <div key={`edit-industry-${index}`} className="bg-gray-50 p-4 rounded-lg border">
                              <input
                                type="text"
                                value={scenario.title}
                                onChange={(e) => {
                                  const newScenarios = [...editedPlan.scenarios];
                                  newScenarios[editedPlan.scenarios.indexOf(scenario)].title = e.target.value;
                                  setEditedPlan({...editedPlan, scenarios: newScenarios});
                                }}
                                className="w-full mb-2 px-3 py-1 border rounded"
                                placeholder="Scenario title"
                              />
                              <textarea
                                value={scenario.description}
                                onChange={(e) => {
                                  const newScenarios = [...editedPlan.scenarios];
                                  newScenarios[editedPlan.scenarios.indexOf(scenario)].description = e.target.value;
                                  setEditedPlan({...editedPlan, scenarios: newScenarios});
                                }}
                                className="w-full mb-2 px-3 py-1 border rounded"
                                rows="2"
                                placeholder="Scenario description"
                              />
                              <div className="flex gap-2">
                                <select
                                  value={scenario.likelihood}
                                  onChange={(e) => {
                                    const newScenarios = [...editedPlan.scenarios];
                                    newScenarios[editedPlan.scenarios.indexOf(scenario)].likelihood = e.target.value;
                                    setEditedPlan({...editedPlan, scenarios: newScenarios});
                                  }}
                                  className="px-3 py-1 border rounded text-sm"
                                >
                                  <option value="High">High Risk</option>
                                  <option value="Medium">Medium Risk</option>
                                  <option value="Low">Low Risk</option>
                                </select>
                                <select
                                  value={scenario.impact}
                                  onChange={(e) => {
                                    const newScenarios = [...editedPlan.scenarios];
                                    newScenarios[editedPlan.scenarios.indexOf(scenario)].impact = e.target.value;
                                    setEditedPlan({...editedPlan, scenarios: newScenarios});
                                  }}
                                  className="px-3 py-1 border rounded text-sm"
                                >
                                  <option value="Critical">Critical Impact</option>
                                  <option value="Major">Major Impact</option>
                                  <option value="Moderate">Moderate Impact</option>
                                  <option value="Minor">Minor Impact</option>
                                </select>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={cancelEditing}
                          className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={saveEditedSection}
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <>
                      <div>
                        <h3 className="font-semibold text-gray-800 mb-3 text-lg">Industry-Specific Scenarios</h3>
                        <div className="grid gap-4">
                          {crisisPlan.scenarios.filter(s => !s.isUniversal).map((scenario, index) => (
                            <div key={`industry-${index}`} className="bg-gray-50 p-4 rounded-lg">
                              <div className="flex justify-between items-start mb-2">
                                <h3 className="font-semibold text-gray-800">{scenario.title}</h3>
                                <div className="flex gap-2">
                                  <span className={`px-2 py-1 text-xs rounded ${
                                    scenario.likelihood === 'High' ? 'bg-red-100 text-red-700' :
                                    scenario.likelihood === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-green-100 text-green-700'
                                  }`}>
                                    {scenario.likelihood} Risk
                                  </span>
                                  <span className={`px-2 py-1 text-xs rounded ${
                                    scenario.impact === 'Critical' ? 'bg-red-100 text-red-700' :
                                    scenario.impact === 'Major' ? 'bg-orange-100 text-orange-700' :
                                    scenario.impact === 'Moderate' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-green-100 text-green-700'
                                  }`}>
                                    {scenario.impact} Impact
                                  </span>
                                </div>
                              </div>
                              <p className="text-gray-600 text-sm">{scenario.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h3 className="font-semibold text-gray-800 mb-3 text-lg">Universal Crisis Scenarios</h3>
                        <div className="grid gap-4">
                          {crisisPlan.scenarios.filter(s => s.isUniversal).map((scenario, index) => (
                            <div key={`universal-${index}`} className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold text-gray-800">{scenario.title}</h3>
                                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Universal</span>
                                </div>
                                <div className="flex gap-2">
                                  <span className={`px-2 py-1 text-xs rounded ${
                                    scenario.likelihood === 'High' ? 'bg-red-100 text-red-700' :
                                    scenario.likelihood === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-green-100 text-green-700'
                                  }`}>
                                    {scenario.likelihood} Risk
                                  </span>
                                  <span className={`px-2 py-1 text-xs rounded ${
                                    scenario.impact === 'Critical' ? 'bg-red-100 text-red-700' :
                                    scenario.impact === 'Major' ? 'bg-orange-100 text-orange-700' :
                                    scenario.impact === 'Moderate' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-green-100 text-green-700'
                                  }`}>
                                    {scenario.impact} Impact
                                  </span>
                                </div>
                              </div>
                              <p className="text-gray-600 text-sm">{scenario.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Key Stakeholders & Impact Analysis */}
            <div className="border-b">
              <SectionHeader icon={Users} title="5. Key Stakeholders & Impact Analysis" section="stakeholders" />
              {expandedSections.stakeholders && (
                <div className="p-6">
                  {editingSection === 'stakeholders' ? (
                    // Edit Mode
                    <div className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        {editedPlan.stakeholders.map((stakeholder, index) => (
                          <div key={index} className="bg-gray-50 p-4 rounded-lg border">
                            <div className="mb-2">
                              <input
                                type="text"
                                value={stakeholder.name}
                                onChange={(e) => {
                                  const newStakeholders = [...editedPlan.stakeholders];
                                  newStakeholders[index].name = e.target.value;
                                  setEditedPlan({...editedPlan, stakeholders: newStakeholders});
                                }}
                                className="w-full font-semibold px-3 py-1 border rounded"
                                placeholder="Stakeholder name"
                              />
                            </div>
                            <textarea
                              value={stakeholder.description}
                              onChange={(e) => {
                                const newStakeholders = [...editedPlan.stakeholders];
                                newStakeholders[index].description = e.target.value;
                                setEditedPlan({...editedPlan, stakeholders: newStakeholders});
                              }}
                              className="w-full mb-2 px-3 py-1 border rounded text-sm"
                              rows="2"
                              placeholder="Description"
                            />
                            <select
                              value={stakeholder.impactLevel}
                              onChange={(e) => {
                                const newStakeholders = [...editedPlan.stakeholders];
                                newStakeholders[index].impactLevel = e.target.value;
                                setEditedPlan({...editedPlan, stakeholders: newStakeholders});
                              }}
                              className="w-full mb-2 px-3 py-1 border rounded text-sm"
                            >
                              <option value="High">High Impact</option>
                              <option value="Medium">Medium Impact</option>
                              <option value="Low">Low Impact</option>
                            </select>
                            <div>
                              <p className="text-xs font-semibold text-gray-700 mb-1">Key Concerns:</p>
                              {stakeholder.concerns.map((concern, cIdx) => (
                                <input
                                  key={cIdx}
                                  type="text"
                                  value={concern}
                                  onChange={(e) => {
                                    const newStakeholders = [...editedPlan.stakeholders];
                                    newStakeholders[index].concerns[cIdx] = e.target.value;
                                    setEditedPlan({...editedPlan, stakeholders: newStakeholders});
                                  }}
                                  className="w-full mb-1 px-2 py-1 border rounded text-xs"
                                  placeholder={`Concern ${cIdx + 1}`}
                                />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={cancelEditing}
                          className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={saveEditedSection}
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div className="grid gap-4 md:grid-cols-2">
                      {crisisPlan.stakeholders.map((stakeholder, index) => (
                        <div key={index} className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold text-gray-800">{stakeholder.name}</h3>
                            <span className={`px-2 py-1 text-xs rounded ${
                              stakeholder.impactLevel === 'High' ? 'bg-red-100 text-red-700' :
                              stakeholder.impactLevel === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {stakeholder.impactLevel} Impact
                            </span>
                          </div>
                          <p className="text-gray-600 text-sm mb-2">{stakeholder.description}</p>
                          <div className="mt-2">
                            <p className="text-xs font-semibold text-gray-700 mb-1">Key Concerns:</p>
                            <ul className="text-xs text-gray-600 space-y-1">
                              {stakeholder.concerns.map((concern, idx) => (
                                <li key={idx}>• {concern}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Communication Plan by Stakeholder */}
            <div className="border-b">
              <SectionHeader icon={MessageCircle} title="6. Stakeholder Communication Plans" section="communication" />
              {expandedSections.communication && (
                <div className="p-6">
                  {editingSection === 'communication' ? (
                    // Edit Mode
                    <div className="space-y-4">
                      {editedPlan.communicationPlans.map((plan, index) => (
                        <div key={index} className="bg-gray-50 p-4 rounded-lg border">
                          <div className="mb-3">
                            <input
                              type="text"
                              value={plan.stakeholder}
                              onChange={(e) => {
                                const newPlans = [...editedPlan.communicationPlans];
                                newPlans[index].stakeholder = e.target.value;
                                setEditedPlan({...editedPlan, communicationPlans: newPlans});
                              }}
                              className="w-full font-semibold px-3 py-1 border rounded"
                              placeholder="Stakeholder name"
                            />
                          </div>
                          <div className="grid gap-3 md:grid-cols-2 mb-3">
                            <div>
                              <label className="text-sm font-medium text-gray-700">Primary Channel:</label>
                              <input
                                type="text"
                                value={plan.primaryChannel}
                                onChange={(e) => {
                                  const newPlans = [...editedPlan.communicationPlans];
                                  newPlans[index].primaryChannel = e.target.value;
                                  setEditedPlan({...editedPlan, communicationPlans: newPlans});
                                }}
                                className="w-full px-3 py-1 border rounded text-sm"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-700">Secondary Channel:</label>
                              <input
                                type="text"
                                value={plan.secondaryChannel}
                                onChange={(e) => {
                                  const newPlans = [...editedPlan.communicationPlans];
                                  newPlans[index].secondaryChannel = e.target.value;
                                  setEditedPlan({...editedPlan, communicationPlans: newPlans});
                                }}
                                className="w-full px-3 py-1 border rounded text-sm"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-700">Timing:</label>
                              <input
                                type="text"
                                value={plan.timing}
                                onChange={(e) => {
                                  const newPlans = [...editedPlan.communicationPlans];
                                  newPlans[index].timing = e.target.value;
                                  setEditedPlan({...editedPlan, communicationPlans: newPlans});
                                }}
                                className="w-full px-3 py-1 border rounded text-sm"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-700">Spokesperson:</label>
                              <input
                                type="text"
                                value={plan.spokesperson}
                                onChange={(e) => {
                                  const newPlans = [...editedPlan.communicationPlans];
                                  newPlans[index].spokesperson = e.target.value;
                                  setEditedPlan({...editedPlan, communicationPlans: newPlans});
                                }}
                                className="w-full px-3 py-1 border rounded text-sm"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-2">Key Messages:</label>
                            {plan.keyMessages.map((message, msgIdx) => (
                              <input
                                key={msgIdx}
                                type="text"
                                value={message}
                                onChange={(e) => {
                                  const newPlans = [...editedPlan.communicationPlans];
                                  newPlans[index].keyMessages[msgIdx] = e.target.value;
                                  setEditedPlan({...editedPlan, communicationPlans: newPlans});
                                }}
                                className="w-full mb-1 px-3 py-1 border rounded text-sm"
                                placeholder={`Key message ${msgIdx + 1}`}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={cancelEditing}
                          className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={saveEditedSection}
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div className="space-y-4">
                      {crisisPlan.communicationPlans.map((plan, index) => (
                        <div key={index} className="bg-gray-50 p-4 rounded-lg">
                          <h3 className="font-semibold text-gray-800 mb-3">{plan.stakeholder}</h3>
                          <div className="grid gap-3 md:grid-cols-2">
                            <div>
                              <p className="text-sm font-medium text-gray-700">Primary Channel:</p>
                              <p className="text-sm text-gray-600">{plan.primaryChannel}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-700">Secondary Channel:</p>
                              <p className="text-sm text-gray-600">{plan.secondaryChannel}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-700">Timing:</p>
                              <p className="text-sm text-gray-600">{plan.timing}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-700">Spokesperson:</p>
                              <p className="text-sm text-gray-600">{plan.spokesperson}</p>
                            </div>
                          </div>
                          <div className="mt-3">
                            <p className="text-sm font-medium text-gray-700 mb-2">Key Messages:</p>
                            <ul className="text-sm text-gray-600 space-y-1">
                              {plan.keyMessages.map((message, idx) => (
                                <li key={idx}>• {message}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Event Monitoring and Response Mechanisms */}
            <div className="border-b">
              <SectionHeader icon={Activity} title="7. Event Monitoring & Response Mechanisms" section="monitoring" />
              {expandedSections.monitoring && (
                <div className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-2">Monitoring Systems</h3>
                      <ul className="text-gray-600 space-y-2">
                        <li className="flex items-start">
                          <span className="text-blue-600 mr-2">•</span>
                          <span><strong>Media Monitoring:</strong> 24/7 traditional and social media monitoring for brand mentions, industry issues, and emerging threats</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-blue-600 mr-2">•</span>
                          <span><strong>Internal Reporting:</strong> Employee hotline and digital reporting system for rapid escalation of potential issues</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-blue-600 mr-2">•</span>
                          <span><strong>Regulatory Alerts:</strong> Automated monitoring of regulatory changes and compliance notifications</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-blue-600 mr-2">•</span>
                          <span><strong>Operational Metrics:</strong> Real-time dashboards tracking key performance and risk indicators</span>
                        </li>
                      </ul>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-2">Response Triggers</h3>
                      <div className="grid gap-3">
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3">
                          <p className="font-medium text-gray-800">Level 1 - Monitor</p>
                          <p className="text-sm text-gray-600">Potential issue identified, increased monitoring activated, situation assessment initiated</p>
                        </div>
                        <div className="bg-orange-50 border-l-4 border-orange-400 p-3">
                          <p className="font-medium text-gray-800">Level 2 - Alert</p>
                          <p className="text-sm text-gray-600">Crisis team notified, preliminary response planning, stakeholder notification prepared</p>
                        </div>
                        <div className="bg-red-50 border-l-4 border-red-400 p-3">
                          <p className="font-medium text-gray-800">Level 3 - Activate</p>
                          <p className="text-sm text-gray-600">Full crisis response activated, all teams deployed, external communications initiated</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Post-incident Evaluation */}
            <div className="border-b">
              <SectionHeader icon={FileText} title="8. Post-Incident Evaluation & Improvement" section="evaluation" />
              {expandedSections.evaluation && (
                <div className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-2">Immediate Actions (Within 48 hours)</h3>
                      <ul className="text-gray-600 space-y-1">
                        <li>• Document timeline of events and decisions made</li>
                        <li>• Capture initial lessons learned while fresh</li>
                        <li>• Assess ongoing risks and required follow-up actions</li>
                        <li>• Communicate resolution to key stakeholders</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-2">Comprehensive Review (Within 2 weeks)</h3>
                      <ul className="text-gray-600 space-y-1">
                        <li>• Conduct formal after-action review with all team members</li>
                        <li>• Analyze effectiveness of response strategies and communications</li>
                        <li>• Review stakeholder feedback and media coverage</li>
                        <li>• Identify gaps in plans, processes, or capabilities</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-2">Improvement Implementation (Within 30 days)</h3>
                      <ul className="text-gray-600 space-y-1">
                        <li>• Update crisis management plans based on findings</li>
                        <li>• Revise communication templates and protocols</li>
                        <li>• Conduct training on identified improvement areas</li>
                        <li>• Test updated procedures through simulation exercises</li>
                      </ul>
                    </div>
                    
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-800 mb-2">Continuous Improvement Metrics</h3>
                      <div className="grid gap-2 md:grid-cols-2 text-sm text-gray-600">
                        <div>• Response time to crisis activation</div>
                        <div>• Stakeholder satisfaction scores</div>
                        <div>• Media sentiment analysis</div>
                        <div>• Operational recovery time</div>
                        <div>• Financial impact mitigation</div>
                        <div>• Employee confidence ratings</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* AI Advisor View */}
        {activeView === 'advisor' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-xl p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Bot className="w-7 h-7 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">AI Crisis Advisor</h3>
                    <p className="text-gray-600">Get real-time guidance based on your crisis situation</p>
                  </div>
                </div>
                {chatMessages.length > 0 && (
                  <button
                    onClick={() => setChatMessages([])}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    Clear Chat
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <div 
                    ref={chatContainerRef}
                    className="h-96 overflow-y-auto mb-4 p-4 bg-gray-50 rounded-lg space-y-3"
                  >
                    {chatMessages.length === 0 ? (
                      <div className="text-center text-gray-500 py-12">
                        <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm">Describe your crisis situation and I'll provide guidance based on your plan</p>
                      </div>
                    ) : (
                      chatMessages.map(message => (
                        <div
                          key={message.id}
                          className={`${
                            message.type === 'user' ? 'ml-auto' : 'mr-auto'
                          } max-w-[80%]`}
                        >
                          <div
                            className={`p-4 rounded-lg ${
                              message.type === 'user'
                                ? 'bg-purple-600 text-white'
                                : message.isError
                                ? 'bg-red-100 text-red-800'
                                : 'bg-white border border-gray-200'
                            }`}
                          >
                            {message.type === 'ai' && message.urgencyLevel && (
                              <div className="mb-2">
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  message.urgencyLevel === 'high' ? 'bg-red-100 text-red-700' :
                                  message.urgencyLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-green-100 text-green-700'
                                }`}>
                                  {message.urgencyLevel.toUpperCase()} URGENCY
                                </span>
                              </div>
                            )}
                            <p className="text-sm">{message.content}</p>
                            {message.immediateActions && (
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <p className="text-xs font-semibold mb-1">Immediate Actions:</p>
                                <ul className="text-xs space-y-1">
                                  {message.immediateActions.map((action, idx) => (
                                    <li key={idx} className="flex items-start gap-1">
                                      <span className="text-purple-600">•</span>
                                      <span>{action}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {message.suggestedMessage && (
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <p className="text-xs font-semibold mb-1">Suggested Statement:</p>
                                <p className="text-xs italic">"{message.suggestedMessage}"</p>
                              </div>
                            )}
                            <div className="text-xs mt-2 opacity-70">
                              {message.timestamp}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAIChat()}
                      placeholder="Describe your crisis situation..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      disabled={isAIResponding}
                    />
                    <button
                      onClick={handleAIChat}
                      disabled={isAIResponding || !chatInput.trim()}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isAIResponding ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
                
                <div className="lg:col-span-1">
                  <div className="bg-purple-50 rounded-lg p-5 h-full">
                    <h4 className="font-semibold text-purple-800 mb-3">How AI Advisor Works</h4>
                    <ul className="space-y-3 text-sm text-purple-700">
                      <li className="flex items-start gap-2">
                        <span className="text-purple-500 mt-1">1.</span>
                        <span>Describe your current crisis situation in detail</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-purple-500 mt-1">2.</span>
                        <span>AI analyzes your crisis plan to identify relevant scenarios</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-purple-500 mt-1">3.</span>
                        <span>Receive specific guidance based on your protocols</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-purple-500 mt-1">4.</span>
                        <span>Get immediate actions and suggested communications</span>
                      </li>
                    </ul>
                    {!crisisPlan && (
                      <div className="mt-4 p-3 bg-yellow-100 rounded-lg border border-yellow-300">
                        <p className="text-xs text-yellow-800">
                          <strong>Note:</strong> Generate a crisis plan first for personalized guidance
                        </p>
                      </div>
                    )}
                    {selectedScenario && (
                      <div className="mt-4 p-3 bg-purple-100 rounded-lg border border-purple-300">
                        <p className="text-xs text-purple-800">
                          <strong>Active Scenario:</strong> {selectedScenario.title}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State for Plan View when no plan exists */}
        {activeView === 'plan' && !crisisPlan && (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">No Crisis Plan Generated</h2>
            <p className="text-gray-600 mb-6">Generate a crisis plan to view it here</p>
            <button
              onClick={() => setActiveView('dashboard')}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CrisisCommandCenter;
