import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useProject } from "../contexts/ProjectContext";
import { useMemoryVault } from "../hooks/useMemoryVault";
import api from "../services/api";
import {
  Shield,
  Bot,
  Send,
  Loader2,
  AlertTriangle,
  Users,
  MessageCircle,
  Activity,
  FileText,
  Phone,
  Bell,
  CheckCircle,
  XCircle,
  AlertCircle,
  Timer,
  Zap,
  Brain,
  Target,
  TrendingUp,
  Lightbulb,
  ClipboardCheck,
  Radio,
  Siren,
  HeartHandshake,
  ChevronRight,
  Download,
  Copy,
  ExternalLink,
  Sparkles,
  MessageSquare,
  Flame,
  ArrowRight,
  Play,
  Pause,
  RefreshCw,
  BookOpen,
  HelpCircle,
  Clock,
  PlusCircle,
  X,
  Maximize2,
  Minimize2,
  Settings,
  History,
  FileDown,
  Share2,
  Building,
  Globe,
  Award,
  BarChart3,
  Save,
  Mail,
  ListChecks,
  Pencil,
  ChevronDown,
  ChevronUp,
  UserCheck,
  Calendar,
  Plus,
  Folder,
  PhoneCall,
  FileCheck,
  Eye,
  Search,
} from "lucide-react";

const CrisisCommandCenter = () => {
  // Get auth and project context
  const { user } = useAuth();
  const { selectedProject } = useProject();
  const { saveToMemoryVault } = useMemoryVault();

  // Core States
  const [crisisStatus, setCrisisStatus] = useState("monitoring");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isAIResponding, setIsAIResponding] = useState(false);
  const [showResources, setShowResources] = useState(false);
  const chatContainerRef = useRef(null);

  // Crisis States
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [elapsedTime, setElapsedTime] = useState("00:00:00");
  const [crisisStartTime, setCrisisStartTime] = useState(null);
  const [showScenarioModal, setShowScenarioModal] = useState(false);
  const [crisisSeverity, setCrisisSeverity] = useState("low");
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [currentDraftStakeholder, setCurrentDraftStakeholder] = useState(null);
  const [editingDraft, setEditingDraft] = useState("");
  const [isDraftSaving, setIsDraftSaving] = useState(false);

  // Quick Stats
  const [quickStats, setQuickStats] = useState({
    teamMembersActive: 0,
    tasksCompleted: 0,
    communicationsSent: 0,
    decisionsMade: 0,
  });

  // Crisis Documentation
  const [crisisDocumentation, setCrisisDocumentation] = useState({
    timeline: [],
    decisions: [],
    communications: [],
    aiInteractions: [],
  });

  // Crisis Plan States
  const [crisisPlan, setCrisisPlan] = useState(null);
  const [showPlanGenerator, setShowPlanGenerator] = useState(false);
  const [planGenerating, setPlanGenerating] = useState(false);
  const [editingSection, setEditingSection] = useState(null);

  // Team & Task Management
  const [teamStatus, setTeamStatus] = useState({});
  const [tasks, setTasks] = useState([]);
  const [decisionLog, setDecisionLog] = useState([]);
  const [communicationDrafts, setCommunicationDrafts] = useState({});

  // AI Assistant States
  const [aiExpanded, setAiExpanded] = useState(true);
  const [showQueryHelp, setShowQueryHelp] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);

  // Plan Generation Form
  const [planForm, setPlanForm] = useState({
    industry: "",
    companySize: "",
    teamMembers: [],
    keyConcerns: [],
    existingProtocols: "",
    additionalContext: "",
    emergencyContacts: [], // Add this
  });
  // Add error handling wrapper for API calls
  const handleAPIError = (error, context) => {
    console.error(`Error in ${context}:`, error);

    const errorMessage = {
      id: Date.now() + Math.random(),
      type: "ai",
      content: `❌ I encountered an error while ${context}. ${
        error.message || "Please try again or check your connection."
      }`,
      timestamp: new Date().toLocaleTimeString(),
      error: true,
    };

    setMessages((prev) => [...prev, errorMessage]);
    return errorMessage;
  };
  // Initialize with AI welcome
  useEffect(() => {
    const welcomeMessage = {
      id: Date.now(),
      type: "ai",
      content: `👋 Welcome to your Crisis Command Center!

I'm your AI Crisis Management Expert, trained on thousands of real-world crisis scenarios and best practices. I'm here to help you:

📋 **Create a Crisis Plan** - Generate a comprehensive, industry-specific crisis management plan
🚨 **Manage Active Crises** - Real-time guidance and support during emergencies
💬 **Draft Communications** - Create stakeholder messages with the right tone and content
🎯 **Strategic Decisions** - Data-driven recommendations for critical choices
📊 **Post-Crisis Analysis** - Learn and improve from each incident

${
  selectedProject
    ? `I'm working within your "${selectedProject.name}" project.`
    : "Select a project to save your crisis plans and documentation."
}

How can I help you prepare for or manage a crisis today?`,
      timestamp: new Date().toLocaleTimeString(),
    };
    setMessages([welcomeMessage]);
  }, [selectedProject]);

  // Timer Effect
  useEffect(() => {
    if (crisisStartTime && crisisStatus === "active") {
      const interval = setInterval(() => {
        const elapsed = Date.now() - crisisStartTime.getTime();
        const hours = Math.floor(elapsed / 3600000);
        const minutes = Math.floor((elapsed % 3600000) / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        setElapsedTime(
          `${hours.toString().padStart(2, "0")}:${minutes
            .toString()
            .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
        );
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [crisisStartTime, crisisStatus]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Document everything during crisis
  const documentAction = (type, data) => {
    if (crisisStatus === "active") {
      const documentEntry = {
        ...data,
        timestamp: new Date().toISOString(),
        elapsedTime: elapsedTime,
        type: type,
      };

      setCrisisDocumentation((prev) => ({
        ...prev,
        [type]: [...(prev[type] || []), documentEntry],
      }));

      // Also add to decision log if it's a decision
      if (type === "decisions" || data.isDecision) {
        setDecisionLog((prev) => [
          ...prev,
          {
            id: Date.now(),
            action: data.action || data.event || "Decision made",
            details: data.details || data.description,
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    }
  };

  // Analyze crisis severity from conversation
  const analyzeCrisisSeverity = (text) => {
    const criticalKeywords = [
      "death",
      "fatality",
      "explosion",
      "terrorism",
      "ransomware",
      "data breach",
      "lawsuit",
      "regulatory",
      "shutdown",
    ];
    const highKeywords = [
      "injured",
      "accident",
      "media",
      "viral",
      "protest",
      "boycott",
      "investigation",
      "complaint",
    ];
    const mediumKeywords = [
      "concern",
      "issue",
      "problem",
      "delay",
      "error",
      "mistake",
      "confusion",
    ];

    const lowerText = text.toLowerCase();

    if (criticalKeywords.some((word) => lowerText.includes(word))) {
      setCrisisSeverity("critical");
      return "critical";
    }
    if (highKeywords.some((word) => lowerText.includes(word))) {
      setCrisisSeverity("high");
      return "high";
    }
    if (mediumKeywords.some((word) => lowerText.includes(word))) {
      setCrisisSeverity("medium");
      return "medium";
    }
    return "low";
  };

  // Enhanced AI response
  const sendMessage = async (text) => {
    const messageText = text || input;
    if (!messageText.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: "user",
      content: messageText,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsAIResponding(true);

    // Add to conversation history
    const updatedHistory = [
      ...conversationHistory,
      { role: "user", content: messageText },
    ];
    setConversationHistory(updatedHistory);

    // Document AI interaction
    documentAction("aiInteractions", {
      query: messageText,
      context: { crisisStatus, selectedScenario, severity: crisisSeverity },
    });

    // Analyze severity
    const severity = analyzeCrisisSeverity(messageText);

    try {
      const response = await api.crisisAdvisor({
        query: messageText,
        conversationHistory: updatedHistory, // Pass full conversation history
        context: {
          scenario: selectedScenario,
          crisisStatus: crisisStatus,
          elapsedTime: elapsedTime,
          projectName: selectedProject?.name,
          projectId: selectedProject?.id,
          industry: selectedProject?.industry,
          hasCrisisPlan: !!crisisPlan,
        },
      });

      if (response.success && response.advice) {
        let aiResponseContent = response.advice; // Changed variable name to avoid confusion

        if (response.detectedCrisisType) {
          aiResponseContent = `🚨 **Detected Crisis Type: ${response.detectedCrisisName}**\n\n${aiResponseContent}`;
        }

        const aiMessage = {
          id: Date.now() + 1,
          type: "ai",
          content: aiResponseContent,
          timestamp: new Date().toLocaleTimeString(),
          actions: response.immediateActions || [],
          severity: severity,
          detectedCrisisType: response.detectedCrisisType,
        };

        setMessages((prev) => [...prev, aiMessage]);

        // Add AI response to conversation history - using the actual response content
        setConversationHistory([
          ...updatedHistory,
          { role: "assistant", content: response.advice },
        ]);

        // Update stats if in crisis mode
        if (crisisStatus === "active") {
          setQuickStats((prev) => ({
            ...prev,
            decisionsMade: prev.decisionsMade + 1,
          }));
        }
      }
    } catch (error) {
      console.error("Error getting AI response:", error);
      const errorMessage = {
        id: Date.now() + 1,
        type: "ai",
        content:
          "I apologize, but I'm having trouble connecting. Please try again in a moment.",
        timestamp: new Date().toLocaleTimeString(),
        error: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsAIResponding(false);
    }
  };

  // Generate Crisis Plan
  const generateCrisisPlan = async () => {
    setPlanGenerating(true);
    try {
      const response = await api.generateCrisisPlan({
        ...planForm,
        projectId: selectedProject?.id,
        projectName: selectedProject?.name,
        teamMembers: planForm.teamMembers,
        emergencyContacts: planForm.emergencyContacts,
      });

      if (response.success && response.plan) {
        // Extract the plan data properly
        const planData = response.plan.plan_data || response.plan;
        setCrisisPlan(planData);
        setShowPlanGenerator(false);

        // Save to MemoryVault with proper structure
        try {
          const saveResult = await saveToMemoryVault({
            content: JSON.stringify(planData, null, 2),
            title: `Crisis Management Plan - ${planForm.industry}`,
            type: "crisis-plan",
            source: "crisis-command-center",
            folder_type: "crisis-management", // Maps to crisis-management folder
            tags: ["crisis-plan", planForm.industry, "comprehensive"],
            metadata: {
              generated_at: new Date().toISOString(),
              project_id: selectedProject?.id,
              industry: planForm.industry,
              company_size: planForm.companySize,
              team_members_count: planForm.teamMembers.filter((m) => m.name)
                .length,
              scenarios_count: planData.scenarios?.length || 0,
            },
          });

          if (saveResult.success) {
            // Success notification via AI
            const planMessage = {
              id: Date.now() + 10,
              type: "ai",
              content: `✅ **Crisis Management Plan Generated & Saved!**

Your comprehensive crisis management plan has been created and saved to MemoryVault.

**Plan Highlights:**
- ${planData.scenarios?.length || 0} crisis scenarios identified
- ${planData.crisisTeam?.filter((m) => m.name).length || 0}/${
                planData.crisisTeam?.length || 0
              } team roles defined
- ${planData.stakeholders?.length || 0} key stakeholder groups
- ${planData.communicationPlans?.length || 0} communication templates
- Industry-specific protocols for ${planForm.industry}

**Next Steps:**
1. Review all ${Object.keys(planData).length} sections of your plan
2. Assign remaining team members to roles
3. Share with key stakeholders
4. Run a crisis simulation to test readiness

You can now activate Crisis Mode when needed, and I'll guide you through your personalized response plan.`,
              timestamp: new Date().toLocaleTimeString(),
            };
            setMessages((prev) => [...prev, planMessage]);
          } else {
            throw new Error("Failed to save to MemoryVault");
          }
        } catch (saveError) {
          console.error("Error saving to MemoryVault:", saveError);
          // Still set the plan even if save fails
          const errorMessage = {
            id: Date.now() + 11,
            type: "ai",
            content: `⚠️ Your crisis plan was generated but there was an issue saving to MemoryVault. The plan is still loaded and ready to use. Try saving again from the plan viewer.`,
            timestamp: new Date().toLocaleTimeString(),
            error: true,
          };
          setMessages((prev) => [...prev, errorMessage]);
        }
      }
    } catch (error) {
      console.error("Error generating plan:", error);
      const errorMessage = {
        id: Date.now() + 12,
        type: "ai",
        content: `❌ I encountered an error generating your crisis plan. Please try again or let me know what specific error you're seeing.`,
        timestamp: new Date().toLocaleTimeString(),
        error: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setPlanGenerating(false);
    }
  };

  // Activate Crisis Mode
  const activateCrisisMode = () => {
    setCrisisStatus("active");
    setShowScenarioModal(true);
    setCrisisStartTime(new Date());

    // Initialize team status
    if (crisisPlan?.crisisTeam) {
      const teamMap = {};
      crisisPlan.crisisTeam.forEach((member, idx) => {
        teamMap[idx] = {
          ...member,
          status: "pending",
          notified: false,
        };
      });
      setTeamStatus(teamMap);
    }

    documentAction("timeline", {
      event: "Crisis Mode Activated",
      details: "Manual activation via command center",
    });

    // Update stats
    setQuickStats({
      teamMembersActive: 0,
      tasksCompleted: 0,
      communicationsSent: 0,
      decisionsMade: 0,
    });

    // Send AI notification about crisis mode
    const crisisActivationMessage = {
      id: Date.now() + 15,
      type: "ai",
      content: `🚨 **CRISIS MODE ACTIVATED**

I'm now in crisis support mode and will remain fully accessible throughout this incident.

**My Role During This Crisis:**
- Provide real-time guidance and recommendations
- Help draft communications for all stakeholders
- Analyze decisions and suggest next steps
- Document all actions for post-incident review
- Monitor severity and escalation triggers

**Available Commands:**
- "Draft [stakeholder] communication"
- "What should we do next?"
- "Analyze current situation"
- "Review crisis checklist"
- "Update stakeholder on progress"

I'm here to support you every step of the way. What's your first priority?`,
      timestamp: new Date().toLocaleTimeString(),
      priority: "critical",
    };

    setMessages((prev) => [...prev, crisisActivationMessage]);
  };
  // Select Crisis Scenario
  const selectCrisisScenario = (scenario) => {
    setSelectedScenario(scenario);
    setShowScenarioModal(false);

    // Generate initial tasks based on scenario
    generateCrisisTasks(scenario);

    documentAction("timeline", {
      event: "Crisis Scenario Selected",
      scenario: scenario.title,
      severity: scenario.impact,
    });

    // AI notification
    const scenarioMessage = {
      id: Date.now() + 20,
      type: "ai",
      content: `🚨 **Active Crisis: ${scenario.title}**

I'm now providing real-time support for this ${
        scenario.impact
      } severity incident.

**Immediate Actions Required:**
${
  scenario.immediateActions
    ?.map((action, idx) => `${idx + 1}. ${action}`)
    .join("\n") ||
  "1. Assess the situation\n2. Notify crisis team\n3. Begin response protocol"
}

I'm here to help with communications, decisions, and guidance. The crisis management tools are now active on your main screen.`,
      timestamp: new Date().toLocaleTimeString(),
      priority: "critical",
    };
    setMessages((prev) => [...prev, scenarioMessage]);
  };

  // Generate Crisis Tasks
  const generateCrisisTasks = (scenario) => {
    const baseTasks = [
      {
        id: 1,
        task: "Activate crisis team and verify availability",
        assignee: crisisPlan?.crisisTeam?.[0]?.name || "Crisis Leader",
        priority: "critical",
        status: "pending",
      },
      {
        id: 2,
        task: "Assess immediate impact and risks",
        assignee: crisisPlan?.crisisTeam?.[2]?.name || "Operations Manager",
        priority: "critical",
        status: "pending",
      },
      {
        id: 3,
        task: "Draft initial stakeholder communications",
        assignee:
          crisisPlan?.crisisTeam?.[1]?.name || "Communications Director",
        priority: "high",
        status: "pending",
      },
      {
        id: 4,
        task: "Review legal and compliance requirements",
        assignee: crisisPlan?.crisisTeam?.[3]?.name || "Legal Counsel",
        priority: "high",
        status: "pending",
      },
      {
        id: 5,
        task: "Prepare employee communication",
        assignee: crisisPlan?.crisisTeam?.[4]?.name || "HR Lead",
        priority: "medium",
        status: "pending",
      },
    ];

    // Add scenario-specific tasks
    if (scenario.impact === "Critical") {
      baseTasks.push({
        id: 6,
        task: `Execute ${scenario.title} response protocol`,
        assignee: crisisPlan?.crisisTeam?.[0]?.name || "Crisis Leader",
        priority: "critical",
        status: "pending",
      });
    }

    setTasks(baseTasks);
  };

  // Draft Communication
  const draftCommunication = async (stakeholder, template) => {
    try {
      // Show loading state in UI
      setCommunicationDrafts((prev) => ({
        ...prev,
        [stakeholder]: {
          content: "Generating draft...",
          status: "generating",
          timestamp: new Date(),
        },
      }));

      const prompt = `You are a crisis communications expert. Draft a ${stakeholder} communication for the following crisis:

Crisis Scenario: ${selectedScenario?.title || "Unknown Crisis"}
Description: ${selectedScenario?.description || "No description available"}
Severity: ${crisisSeverity}
Time Elapsed: ${elapsedTime}
Company: ${selectedProject?.name || "the company"}

Stakeholder: ${stakeholder}
Primary Channel: ${template.primaryChannel}
Key Messages to Include:
${
  template.keyMessages?.map((msg, idx) => `${idx + 1}. ${msg}`).join("\n") ||
  "- General crisis response"
}

Please draft a professional, empathetic communication that:
1. Acknowledges the situation
2. Shows concern for those affected
3. Outlines immediate actions being taken
4. Provides next steps or timeline for updates
5. Includes appropriate contact information

The tone should be ${
        stakeholder === "Employees"
          ? "reassuring and transparent"
          : stakeholder === "Media"
          ? "professional and factual"
          : stakeholder === "Customers"
          ? "apologetic and solution-focused"
          : stakeholder === "Investors"
          ? "confident and action-oriented"
          : "appropriate for the audience"
      }.`;

      const response = await api.draftCrisisResponse({
        prompt,
        stakeholder,
        template,
        scenario: selectedScenario,
        context: {
          projectName: selectedProject?.name,
          crisisStatus,
          elapsedTime,
          severity: crisisSeverity,
        },
        projectId: selectedProject?.id,
      });

      if (response.success && response.draft) {
        const draft = {
          content: response.draft,
          stakeholder,
          timestamp: new Date(),
          status: "draft",
        };

        setCommunicationDrafts((prev) => ({
          ...prev,
          [stakeholder]: draft,
        }));

        // Document the communication
        documentAction("communications", {
          stakeholder,
          type: "draft",
          action: `${stakeholder} communication drafted`,
          details: `Draft created for ${template.primaryChannel} channel`,
        });

        // Show success message
        const draftMessage = {
          id: Date.now() + 100,
          type: "ai",
          content: `✅ ${stakeholder} communication drafted successfully. Click "View Draft" to review and edit before sending.`,
          timestamp: new Date().toLocaleTimeString(),
        };
        setMessages((prev) => [...prev, draftMessage]);

        return draft;
      } else {
        throw new Error(response.message || "Failed to generate draft");
      }
    } catch (error) {
      // Remove loading state
      setCommunicationDrafts((prev) => {
        const updated = { ...prev };
        delete updated[stakeholder];
        return updated;
      });

      handleAPIError(error, `drafting ${stakeholder} communication`);
    }
  };
  // Save Communication to MemoryVault
  // Save Communication to MemoryVault
  const saveCommunication = async (stakeholder, draft) => {
    try {
      const saveResult = await saveToMemoryVault({
        content: draft.content,
        title: `Crisis Communication - ${stakeholder} - ${
          selectedScenario?.title || "Crisis Response"
        }`,
        type: "crisis-communication",
        source: "crisis-command-center",
        folder_type: "crisis-management", // Proper folder mapping
        tags: [
          "crisis-communication",
          stakeholder.toLowerCase(),
          selectedScenario?.title || "crisis",
        ],
        metadata: {
          stakeholder,
          scenario: selectedScenario?.title,
          severity: crisisSeverity,
          drafted_at: draft.timestamp,
          crisis_status: crisisStatus,
          elapsed_time: elapsedTime,
          project_id: selectedProject?.id,
        },
      });

      if (saveResult.success) {
        // Update draft status
        setCommunicationDrafts((prev) => ({
          ...prev,
          [stakeholder]: { ...draft, status: "saved", savedAt: new Date() },
        }));

        // Update stats
        setQuickStats((prev) => ({
          ...prev,
          communicationsSent: prev.communicationsSent + 1,
        }));

        // Document action
        documentAction("communications", {
          stakeholder,
          type: "sent",
          savedToVault: true,
          timestamp: new Date().toISOString(),
        });

        // Success notification
        const successMessage = {
          id: Date.now() + 200,
          type: "ai",
          content: `✅ ${stakeholder} communication saved to MemoryVault and marked as sent. The message is now documented for compliance and future reference.`,
          timestamp: new Date().toLocaleTimeString(),
        };
        setMessages((prev) => [...prev, successMessage]);
      } else {
        throw new Error("Failed to save communication");
      }
    } catch (error) {
      console.error("Error saving communication:", error);
      // Error notification
      const errorMessage = {
        id: Date.now() + 201,
        type: "ai",
        content: `❌ Failed to save ${stakeholder} communication. Please try again or save manually.`,
        timestamp: new Date().toLocaleTimeString(),
        error: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  // Deactivate Crisis Mode
  // Deactivate Crisis Mode
  const deactivateCrisisMode = async () => {
    // Prepare crisis report
    const crisisReport = {
      scenario: selectedScenario,
      startTime: crisisStartTime,
      endTime: new Date(),
      duration: elapsedTime,
      severity: crisisSeverity,
      stats: quickStats,
      documentation: crisisDocumentation,
      tasks: tasks,
      communications: communicationDrafts,
      teamStatus: teamStatus,
      decisionLog: decisionLog,
    };

    try {
      const saveResult = await saveToMemoryVault({
        content: JSON.stringify(crisisReport, null, 2),
        title: `Crisis Report - ${
          selectedScenario?.title || "Crisis"
        } - ${new Date().toLocaleDateString()}`,
        type: "crisis-report",
        source: "crisis-command-center",
        folder_type: "analytics-reports", // Post-crisis reports go to analytics
        tags: [
          "crisis-report",
          selectedScenario?.title || "crisis",
          "post-incident",
          crisisSeverity,
        ],
        metadata: {
          scenario: selectedScenario?.title,
          duration: elapsedTime,
          severity: crisisSeverity,
          stats: quickStats,
          project_id: selectedProject?.id,
          incident_date: crisisStartTime?.toISOString(),
        },
      });

      if (!saveResult.success) {
        console.error("Warning: Crisis report may not have saved properly");
      }
    } catch (error) {
      console.error("Error saving crisis report:", error);
    }

    // Reset states
    setCrisisStatus("monitoring");
    setSelectedScenario(null);
    setCrisisStartTime(null);
    setAiExpanded(true); // Re-expand AI assistant
    setCommunicationDrafts({});
    setTasks([]);
    setTeamStatus({});
    setDecisionLog([]);
    setCrisisDocumentation({
      timeline: [],
      decisions: [],
      communications: [],
      aiInteractions: [],
    });

    // AI debrief message
    const debriefMessage = {
      id: Date.now() + 30,
      type: "ai",
      content: `✅ **Crisis Mode Deactivated**

Excellent work managing this crisis! Here's your comprehensive summary:

📊 **Crisis Statistics:**
- Duration: ${elapsedTime}
- Severity: ${crisisSeverity.toUpperCase()}
- Decisions Made: ${quickStats.decisionsMade}
- Team Members Involved: ${quickStats.teamMembersActive}
- Communications Sent: ${quickStats.communicationsSent}
- Tasks Completed: ${quickStats.tasksCompleted}/${tasks.length}

📁 **Documentation:**
All crisis data has been saved to your MemoryVault:
- Full incident report saved to Analytics & Reports
- Communications archived in Crisis Management
- Decision log preserved for compliance
- Timeline documented for review

💡 **Recommended Next Steps:**
1. Schedule a post-incident review within 48 hours
2. Update your crisis plan based on lessons learned
3. Recognize team members for their response
4. Follow up with stakeholders as needed
5. Review the saved report for improvement areas

Would you like me to help you:
- Create a detailed post-incident analysis?
- Schedule the review meeting?
- Draft follow-up communications?
- Update your crisis plan with lessons learned?`,
      timestamp: new Date().toLocaleTimeString(),
    };
    setMessages((prev) => [...prev, debriefMessage]);
  };

  // Quick action buttons
  const quickActions = [
    {
      icon: FileText,
      label: "Create Crisis Plan",
      action: () => setShowPlanGenerator(true),
      disabled: !!crisisPlan,
      color: "blue",
    },
    {
      icon: Shield,
      label: "View Crisis Plan",
      action: () => setShowResources(true),
      disabled: !crisisPlan,
      color: "purple",
    },
    {
      icon: Flame,
      label: "Activate Crisis Mode",
      action: activateCrisisMode,
      disabled: crisisStatus === "active" || !crisisPlan,
      color: "red",
    },
    {
      icon: Brain,
      label: "Crisis Training",
      action: () =>
        sendMessage("Let's run a crisis simulation to test our readiness"),
      color: "green",
    },
  ];

  // Render Crisis Plan Section
  const renderCrisisPlanSection = (section, data) => {
    const isEditing = editingSection === section;

    return (
      <div
        style={{
          marginBottom: "1.5rem",
          background: "white",
          borderRadius: "0.75rem",
          border: "1px solid #e5e7eb",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "1rem 1.5rem",
            background: "#f9fafb",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: "pointer",
          }}
        >
          <h3
            style={{
              fontSize: "1.125rem",
              fontWeight: "600",
              color: "#111827",
              margin: 0,
            }}
          >
            {section.title}
          </h3>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {section.editable && !isEditing && (
              <button
                onClick={() => setEditingSection(section.key)}
                style={{
                  padding: "0.25rem 0.75rem",
                  fontSize: "0.875rem",
                  color: "#4f46e5",
                  background: "white",
                  border: "1px solid #4f46e5",
                  borderRadius: "0.375rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem",
                }}
              >
                <Pencil style={{ width: "14px", height: "14px" }} />
                Edit
              </button>
            )}
          </div>
        </div>
        <div style={{ padding: "1.5rem" }}>
          {isEditing ? (
            <div>
              {/* Edit form based on section */}
              <div
                style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}
              >
                <button
                  onClick={() => setEditingSection(null)}
                  style={{
                    padding: "0.5rem 1rem",
                    background: "#10b981",
                    color: "white",
                    border: "none",
                    borderRadius: "0.375rem",
                    cursor: "pointer",
                  }}
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setEditingSection(null)}
                  style={{
                    padding: "0.5rem 1rem",
                    background: "#6b7280",
                    color: "white",
                    border: "none",
                    borderRadius: "0.375rem",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>{data}</div>
          )}
        </div>
      </div>
    );
  };

  const containerStyle = {
    minHeight: "100vh",
    background: "#f3f4f6",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "critical":
        return "#dc2626";
      case "high":
        return "#ea580c";
      case "medium":
        return "#f59e0b";
      default:
        return "#10b981";
    }
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div
        style={{
          background: "white",
          borderBottom: "1px solid #e5e7eb",
          position: "sticky",
          top: 0,
          zIndex: 40,
        }}
      >
        <div
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            padding: "1rem 1.5rem",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div
                style={{
                  background:
                    crisisStatus === "active"
                      ? "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)"
                      : "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                  borderRadius: "0.75rem",
                  padding: "0.75rem",
                  transition: "all 0.3s ease",
                }}
              >
                <Shield
                  style={{ width: "24px", height: "24px", color: "white" }}
                />
              </div>
              <div>
                <h1
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: "700",
                    color: "#111827",
                    margin: 0,
                  }}
                >
                  Crisis Command Center
                </h1>
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "#6b7280",
                    margin: 0,
                  }}
                >
                  {selectedProject
                    ? `${selectedProject.name}`
                    : "AI-Powered Crisis Management"}
                </p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              {/* Crisis Timer */}
              {crisisStatus === "active" && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.5rem 1rem",
                    background: "rgba(220, 38, 38, 0.1)",
                    border: "1px solid rgba(220, 38, 38, 0.3)",
                    borderRadius: "0.5rem",
                  }}
                >
                  <Timer
                    style={{ width: "16px", height: "16px", color: "#dc2626" }}
                  />
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontWeight: "600",
                      color: "#dc2626",
                    }}
                  >
                    {elapsedTime}
                  </span>
                </div>
              )}

              {/* Crisis Status */}
              <div
                style={{
                  padding: "0.5rem 1rem",
                  background:
                    crisisStatus === "active"
                      ? "rgba(220, 38, 38, 0.1)"
                      : "rgba(16, 185, 129, 0.1)",
                  border: `1px solid ${
                    crisisStatus === "active"
                      ? "rgba(220, 38, 38, 0.3)"
                      : "rgba(16, 185, 129, 0.3)"
                  }`,
                  borderRadius: "0.5rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    background:
                      crisisStatus === "active" ? "#dc2626" : "#10b981",
                    borderRadius: "50%",
                    animation:
                      crisisStatus === "active" ? "pulse 2s infinite" : "none",
                  }}
                />
                <span
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    color: crisisStatus === "active" ? "#dc2626" : "#10b981",
                  }}
                >
                  {crisisStatus === "active" ? "Crisis Active" : "Monitoring"}
                </span>
              </div>

              {/* Quick Actions */}
              {crisisStatus === "active" ? (
                <button
                  onClick={deactivateCrisisMode}
                  style={{
                    padding: "0.625rem 1.25rem",
                    background:
                      "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)",
                    color: "white",
                    border: "none",
                    borderRadius: "0.5rem",
                    fontWeight: "600",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    transition: "all 0.2s",
                  }}
                >
                  <XCircle style={{ width: "16px", height: "16px" }} />
                  End Crisis Mode
                </button>
              ) : (
                <button
                  onClick={activateCrisisMode}
                  disabled={!crisisPlan}
                  style={{
                    padding: "0.625rem 1.25rem",
                    background: crisisPlan
                      ? "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)"
                      : "#9ca3af",
                    color: "white",
                    border: "none",
                    borderRadius: "0.5rem",
                    fontWeight: "600",
                    cursor: crisisPlan ? "pointer" : "not-allowed",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    opacity: crisisPlan ? 1 : 0.5,
                  }}
                >
                  <Flame style={{ width: "16px", height: "16px" }} />
                  Activate Crisis Mode
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "1.5rem" }}>
        {crisisStatus === "monitoring" ? (
          // Pre-Crisis View - AI Assistant Focused
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 380px",
              gap: "1.5rem",
            }}
          >
            {/* AI Assistant - Main Focus */}
            <div
              style={{
                background: "white",
                borderRadius: "0.75rem",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                display: "flex",
                flexDirection: "column",
                height: "calc(100vh - 140px)",
              }}
            >
              {/* AI Header */}
              <div
                style={{
                  padding: "1.5rem",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                    }}
                  >
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        background:
                          "linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)",
                        borderRadius: "0.5rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Bot
                        style={{
                          width: "24px",
                          height: "24px",
                          color: "white",
                        }}
                      />
                    </div>
                    <div>
                      <h2
                        style={{
                          fontSize: "1.25rem",
                          fontWeight: "600",
                          color: "#111827",
                          margin: 0,
                        }}
                      >
                        AI Crisis Management Expert
                      </h2>
                      <p
                        style={{
                          fontSize: "0.875rem",
                          color: "#6b7280",
                          margin: 0,
                        }}
                      >
                        {isAIResponding ? "Analyzing..." : "Ready to assist"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowQueryHelp(!showQueryHelp)}
                    style={{
                      padding: "0.5rem",
                      background: "transparent",
                      border: "none",
                      borderRadius: "0.375rem",
                      cursor: "pointer",
                      color: "#6b7280",
                      transition: "all 0.2s",
                    }}
                  >
                    <HelpCircle style={{ width: "20px", height: "20px" }} />
                  </button>
                </div>

                {/* Quick Action Buttons */}
                <div
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    marginTop: "1rem",
                    flexWrap: "wrap",
                  }}
                >
                  {quickActions.map((action, idx) => (
                    <button
                      key={idx}
                      onClick={action.action}
                      disabled={action.disabled}
                      style={{
                        padding: "0.5rem 1rem",
                        background: action.disabled ? "#e5e7eb" : "white",
                        color: action.disabled ? "#9ca3af" : "#374151",
                        border: `1px solid ${
                          action.disabled ? "#e5e7eb" : "#d1d5db"
                        }`,
                        borderRadius: "0.5rem",
                        fontSize: "0.875rem",
                        fontWeight: "500",
                        cursor: action.disabled ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        if (!action.disabled) {
                          e.currentTarget.style.borderColor = "#9ca3af";
                          e.currentTarget.style.background = "#f9fafb";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!action.disabled) {
                          e.currentTarget.style.borderColor = "#d1d5db";
                          e.currentTarget.style.background = "white";
                        }
                      }}
                    >
                      <action.icon style={{ width: "16px", height: "16px" }} />
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Messages Area */}
              <div
                ref={chatContainerRef}
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "1.5rem",
                }}
              >
                {messages.map((message) => (
                  <div
                    key={message.id}
                    style={{
                      display: "flex",
                      justifyContent:
                        message.type === "user" ? "flex-end" : "flex-start",
                      marginBottom: "1rem",
                    }}
                  >
                    <div
                      style={{
                        maxWidth: "80%",
                        padding: "1rem",
                        borderRadius: "0.75rem",
                        background:
                          message.type === "user"
                            ? "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)"
                            : message.error
                            ? "#fee2e2"
                            : "#f3f4f6",
                        color: message.type === "user" ? "white" : "#111827",
                      }}
                    >
                      <div
                        style={{
                          whiteSpace: "pre-wrap",
                          fontSize: "0.9375rem",
                          lineHeight: "1.5",
                        }}
                      >
                        {message.content}
                      </div>

                      {/* Action buttons for AI messages */}
                      {message.type === "ai" &&
                        message.actions &&
                        message.actions.length > 0 && (
                          <div
                            style={{
                              marginTop: "0.75rem",
                              paddingTop: "0.75rem",
                              borderTop: "1px solid rgba(0, 0, 0, 0.1)",
                              display: "flex",
                              flexWrap: "wrap",
                              gap: "0.5rem",
                            }}
                          >
                            {message.actions.map((action, idx) => (
                              <button
                                key={idx}
                                onClick={() => sendMessage(action)}
                                style={{
                                  padding: "0.375rem 0.75rem",
                                  background: "white",
                                  color: "#4f46e5",
                                  border: "1px solid #e0e7ff",
                                  borderRadius: "0.375rem",
                                  fontSize: "0.8125rem",
                                  cursor: "pointer",
                                  transition: "all 0.2s",
                                }}
                              >
                                {action}
                              </button>
                            ))}
                          </div>
                        )}

                      <p
                        style={{
                          fontSize: "0.75rem",
                          marginTop: "0.5rem",
                          opacity: 0.7,
                        }}
                      >
                        {message.timestamp}
                      </p>
                    </div>
                  </div>
                ))}

                {isAIResponding && (
                  <div
                    style={{ display: "flex", justifyContent: "flex-start" }}
                  >
                    <div
                      style={{
                        padding: "1rem",
                        background: "#f3f4f6",
                        borderRadius: "0.75rem",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                      >
                        <Loader2
                          style={{
                            width: "16px",
                            height: "16px",
                            animation: "spin 1s linear infinite",
                          }}
                        />
                        <span
                          style={{ fontSize: "0.875rem", color: "#6b7280" }}
                        >
                          AI is thinking...
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div
                style={{
                  padding: "1.5rem",
                  borderTop: "1px solid #e5e7eb",
                }}
              >
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="Ask about crisis scenarios, best practices, or get help..."
                    style={{
                      flex: 1,
                      padding: "0.75rem 1rem",
                      border: "1px solid #e5e7eb",
                      borderRadius: "0.5rem",
                      fontSize: "0.9375rem",
                      outline: "none",
                      transition: "all 0.2s",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#8b5cf6";
                      e.target.style.boxShadow =
                        "0 0 0 3px rgba(139, 92, 246, 0.1)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#e5e7eb";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                  <button
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || isAIResponding}
                    style={{
                      padding: "0.75rem 1.5rem",
                      background:
                        "linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)",
                      color: "white",
                      border: "none",
                      borderRadius: "0.5rem",
                      fontWeight: "600",
                      cursor:
                        !input.trim() || isAIResponding
                          ? "not-allowed"
                          : "pointer",
                      opacity: !input.trim() || isAIResponding ? 0.5 : 1,
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      transition: "all 0.2s",
                    }}
                  >
                    <Send style={{ width: "16px", height: "16px" }} />
                    Send
                  </button>
                </div>
              </div>
            </div>

            {/* Right Sidebar - Quick Info */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              {/* Crisis Readiness Status */}
              <div
                style={{
                  background: "white",
                  borderRadius: "0.75rem",
                  padding: "1.5rem",
                  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                }}
              >
                <h3
                  style={{
                    fontSize: "1rem",
                    fontWeight: "600",
                    color: "#111827",
                    marginBottom: "1rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <Activity
                    style={{ width: "18px", height: "18px", color: "#6366f1" }}
                  />
                  Crisis Readiness
                </h3>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem",
                  }}
                >
                  <div
                    style={{
                      padding: "0.75rem",
                      background: crisisPlan ? "#d1fae5" : "#fee2e2",
                      borderRadius: "0.5rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      {crisisPlan ? (
                        <CheckCircle
                          style={{
                            width: "16px",
                            height: "16px",
                            color: "#10b981",
                          }}
                        />
                      ) : (
                        <XCircle
                          style={{
                            width: "16px",
                            height: "16px",
                            color: "#dc2626",
                          }}
                        />
                      )}
                      <span
                        style={{
                          fontSize: "0.875rem",
                          fontWeight: "500",
                          color: crisisPlan ? "#047857" : "#b91c1c",
                        }}
                      >
                        Crisis Plan {crisisPlan ? "Active" : "Not Created"}
                      </span>
                    </div>
                  </div>

                  {crisisPlan && (
                    <>
                      <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: "0.5rem",
                          }}
                        >
                          <span>Scenarios:</span>
                          <span style={{ fontWeight: "600", color: "#111827" }}>
                            {crisisPlan.scenarios?.length || 0}
                          </span>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: "0.5rem",
                          }}
                        >
                          <span>Team Members:</span>
                          <span style={{ fontWeight: "600", color: "#111827" }}>
                            {crisisPlan.crisisTeam?.filter((m) => m.name)
                              .length || 0}
                            /{crisisPlan.crisisTeam?.length || 0}
                          </span>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <span>Stakeholders:</span>
                          <span style={{ fontWeight: "600", color: "#111827" }}>
                            {crisisPlan.stakeholders?.length || 0}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => setShowResources(true)}
                        style={{
                          width: "100%",
                          padding: "0.625rem",
                          background: "white",
                          color: "#6366f1",
                          border: "1px solid #e0e7ff",
                          borderRadius: "0.5rem",
                          fontSize: "0.875rem",
                          fontWeight: "500",
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                      >
                        View Crisis Plan
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Suggested Questions */}
              {showQueryHelp && (
                <div
                  style={{
                    background: "white",
                    borderRadius: "0.75rem",
                    padding: "1.5rem",
                    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "1rem",
                      fontWeight: "600",
                      color: "#111827",
                      marginBottom: "1rem",
                    }}
                  >
                    Example Questions
                  </h3>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                    }}
                  >
                    {[
                      "How do I handle a data breach?",
                      "What should I communicate during a crisis?",
                      "Create a crisis management plan",
                      "Who should be on my crisis team?",
                      "What are the first steps in a crisis?",
                    ].map((question, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setInput(question);
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
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#e5e7eb";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "#f3f4f6";
                        }}
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Crisis Severity Indicator */}
              <div
                style={{
                  background: "white",
                  borderRadius: "0.75rem",
                  padding: "1.5rem",
                  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                }}
              >
                <h3
                  style={{
                    fontSize: "1rem",
                    fontWeight: "600",
                    color: "#111827",
                    marginBottom: "1rem",
                  }}
                >
                  Conversation Analysis
                </h3>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      height: "8px",
                      background: "#e5e7eb",
                      borderRadius: "9999px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width:
                          crisisSeverity === "critical"
                            ? "100%"
                            : crisisSeverity === "high"
                            ? "75%"
                            : crisisSeverity === "medium"
                            ? "50%"
                            : "25%",
                        background: getSeverityColor(crisisSeverity),
                        transition: "all 0.3s ease",
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      color: getSeverityColor(crisisSeverity),
                    }}
                  >
                    {crisisSeverity.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Crisis Mode Active - Operational View
          <div style={{ display: "flex", gap: "1.5rem" }}>
            {/* Main Crisis Management Area */}
            <div style={{ flex: 1 }}>
              {/* Crisis Header */}
              <div
                style={{
                  background: "white",
                  borderRadius: "0.75rem",
                  padding: "1.5rem",
                  marginBottom: "1.5rem",
                  border: "2px solid #dc2626",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <h2
                      style={{
                        fontSize: "1.5rem",
                        fontWeight: "700",
                        color: "#dc2626",
                        marginBottom: "0.25rem",
                      }}
                    >
                      Crisis War Room
                    </h2>
                    {selectedScenario && (
                      <p
                        style={{
                          fontSize: "1rem",
                          color: "#7f1d1d",
                        }}
                      >
                        Active Scenario: {selectedScenario.title}
                      </p>
                    )}
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(4, 1fr)",
                      gap: "2rem",
                    }}
                  >
                    {Object.entries(quickStats).map(([key, value]) => (
                      <div key={key} style={{ textAlign: "center" }}>
                        <p
                          style={{
                            fontSize: "1.5rem",
                            fontWeight: "700",
                            color: "#dc2626",
                            margin: 0,
                          }}
                        >
                          {value}
                        </p>
                        <p
                          style={{
                            fontSize: "0.75rem",
                            color: "#6b7280",
                            margin: 0,
                          }}
                        >
                          {key.replace(/([A-Z])/g, " $1").trim()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Crisis Management Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1.5rem",
                }}
              >
                {/* Team Status */}
                <div
                  style={{
                    background: "white",
                    borderRadius: "0.75rem",
                    padding: "1.5rem",
                    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "1.125rem",
                      fontWeight: "600",
                      color: "#111827",
                      marginBottom: "1rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <Users
                      style={{
                        width: "20px",
                        height: "20px",
                        color: "#6366f1",
                      }}
                    />
                    Crisis Team Status
                  </h3>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.75rem",
                    }}
                  >
                    {Object.values(teamStatus).map((member) => (
                      <div
                        key={member.id || member.role}
                        style={{
                          padding: "0.75rem",
                          background: "#f9fafb",
                          borderRadius: "0.5rem",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <div>
                          <p
                            style={{
                              fontWeight: "500",
                              color: "#111827",
                              marginBottom: "0.25rem",
                            }}
                          >
                            {member.name || member.role}
                          </p>
                          <p
                            style={{
                              fontSize: "0.875rem",
                              color: "#6b7280",
                            }}
                          >
                            {member.title || member.role}
                          </p>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                          }}
                        >
                          {member.status === "active" ? (
                            <span
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.25rem",
                                fontSize: "0.875rem",
                                color: "#10b981",
                              }}
                            >
                              <CheckCircle
                                style={{ width: "16px", height: "16px" }}
                              />
                              Active
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                setTeamStatus((prev) => ({
                                  ...prev,
                                  [member.id || member.role]: {
                                    ...member,
                                    status: "active",
                                  },
                                }));
                                setQuickStats((prev) => ({
                                  ...prev,
                                  teamMembersActive: prev.teamMembersActive + 1,
                                }));
                              }}
                              style={{
                                padding: "0.375rem 0.75rem",
                                background: "#e0e7ff",
                                color: "#4338ca",
                                border: "none",
                                borderRadius: "0.375rem",
                                fontSize: "0.875rem",
                                cursor: "pointer",
                              }}
                            >
                              Check In
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Critical Tasks */}
                <div
                  style={{
                    background: "white",
                    borderRadius: "0.75rem",
                    padding: "1.5rem",
                    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                    height: "500px", // Fixed height
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "1.125rem",
                      fontWeight: "600",
                      color: "#111827",
                      marginBottom: "1rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      flexShrink: 0,
                    }}
                  >
                    <ListChecks
                      style={{
                        width: "20px",
                        height: "20px",
                        color: "#6366f1",
                      }}
                    />
                    Critical Tasks
                  </h3>
                  <div
                    style={{
                      flex: 1,
                      overflowY: "auto",
                      paddingRight: "0.5rem",
                    }}
                  >
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        style={{
                          padding: "0.75rem",
                          marginBottom: "0.5rem",
                          background:
                            task.priority === "critical"
                              ? "#fee2e2"
                              : "#fef3c7",
                          borderRadius: "0.5rem",
                          border: `1px solid ${
                            task.priority === "critical" ? "#fecaca" : "#fde68a"
                          }`,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "start",
                            justifyContent: "space-between",
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <p
                              style={{
                                fontWeight: "500",
                                color: "#111827",
                                marginBottom: "0.25rem",
                              }}
                            >
                              {task.task}
                            </p>
                            <p
                              style={{
                                fontSize: "0.875rem",
                                color: "#6b7280",
                              }}
                            >
                              Assigned: {task.assignee}
                            </p>
                          </div>
                          <select
                            value={task.status}
                            onChange={(e) => {
                              setTasks((prev) =>
                                prev.map((t) =>
                                  t.id === task.id
                                    ? { ...t, status: e.target.value }
                                    : t
                                )
                              );
                              if (e.target.value === "completed") {
                                setQuickStats((prev) => ({
                                  ...prev,
                                  tasksCompleted: prev.tasksCompleted + 1,
                                }));
                              }
                            }}
                            style={{
                              padding: "0.375rem",
                              fontSize: "0.875rem",
                              border: "1px solid #e5e7eb",
                              borderRadius: "0.375rem",
                              background: "white",
                              minWidth: "120px",
                            }}
                          >
                            <option value="pending">Pending</option>
                            <option value="in-progress">In Progress</option>
                            <option value="completed">Completed</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Stakeholder Communications - Full Width */}
                <div
                  style={{
                    gridColumn: "1 / -1",
                    background: "white",
                    borderRadius: "0.75rem",
                    padding: "1.5rem",
                    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "1.125rem",
                      fontWeight: "600",
                      color: "#111827",
                      marginBottom: "1rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <MessageCircle
                      style={{
                        width: "20px",
                        height: "20px",
                        color: "#6366f1",
                      }}
                    />
                    Stakeholder Communications
                  </h3>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(300px, 1fr))",
                      gap: "1rem",
                    }}
                  >
                    {crisisPlan?.communicationPlans?.map((plan, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: "1rem",
                          background: "#f9fafb",
                          borderRadius: "0.5rem",
                          border: "1px solid #e5e7eb",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: "0.75rem",
                          }}
                        >
                          <h4
                            style={{
                              fontWeight: "600",
                              color: "#111827",
                            }}
                          >
                            {plan.stakeholder}
                          </h4>
                          {communicationDrafts[plan.stakeholder]?.status ===
                          "saved" ? (
                            <span
                              style={{
                                fontSize: "0.75rem",
                                padding: "0.25rem 0.5rem",
                                background: "#d1fae5",
                                color: "#047857",
                                borderRadius: "0.25rem",
                              }}
                            >
                              ✓ Sent
                            </span>
                          ) : communicationDrafts[plan.stakeholder] ? (
                            <span
                              style={{
                                fontSize: "0.75rem",
                                padding: "0.25rem 0.5rem",
                                background: "#e0e7ff",
                                color: "#4338ca",
                                borderRadius: "0.25rem",
                              }}
                            >
                              Drafted
                            </span>
                          ) : null}
                        </div>

                        <div
                          style={{
                            fontSize: "0.875rem",
                            color: "#6b7280",
                            marginBottom: "0.75rem",
                          }}
                        >
                          <p>Channel: {plan.primaryChannel}</p>
                          <p>Timing: {plan.timing}</p>
                        </div>
                        {communicationDrafts[plan.stakeholder] ? (
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <button
                              onClick={() => {
                                setCurrentDraftStakeholder(plan.stakeholder);
                                setShowDraftModal(true);
                              }}
                              style={{
                                flex: 1,
                                padding: "0.5rem",
                                background: "#6366f1",
                                color: "white",
                                border: "none",
                                borderRadius: "0.375rem",
                                fontSize: "0.875rem",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "0.25rem",
                              }}
                            >
                              <Eye style={{ width: "14px", height: "14px" }} />
                              View Draft
                            </button>
                            {communicationDrafts[plan.stakeholder].status !==
                              "saved" && (
                              <button
                                onClick={() =>
                                  saveCommunication(
                                    plan.stakeholder,
                                    communicationDrafts[plan.stakeholder]
                                  )
                                }
                                style={{
                                  padding: "0.5rem",
                                  background: "#10b981",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "0.375rem",
                                  fontSize: "0.875rem",
                                  cursor: "pointer",
                                }}
                                title="Quick save without viewing"
                              >
                                <Save
                                  style={{ width: "14px", height: "14px" }}
                                />
                              </button>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() =>
                              draftCommunication(plan.stakeholder, plan)
                            }
                            style={{
                              width: "100%",
                              padding: "0.5rem",
                              background: "#6366f1",
                              color: "white",
                              border: "none",
                              borderRadius: "0.375rem",
                              fontSize: "0.875rem",
                              cursor: "pointer",
                            }}
                          >
                            Draft Response
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Decision Log and Emergency Resources Row */}
                <div
                  style={{
                    gridColumn: "1 / -1",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "1.5rem",
                  }}
                >
                  {/* Decision Log */}
                  <div
                    style={{
                      background: "white",
                      borderRadius: "0.75rem",
                      padding: "1.5rem",
                      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "1.125rem",
                        fontWeight: "600",
                        color: "#111827",
                        marginBottom: "1rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <ClipboardCheck
                        style={{
                          width: "20px",
                          height: "20px",
                          color: "#6366f1",
                        }}
                      />
                      Decision Log
                    </h3>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.5rem",
                        maxHeight: "300px",
                        overflowY: "auto",
                      }}
                    >
                      {decisionLog.map((entry) => (
                        <div
                          key={entry.id}
                          style={{
                            padding: "0.75rem",
                            background: "#f9fafb",
                            borderRadius: "0.375rem",
                            fontSize: "0.875rem",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              marginBottom: "0.25rem",
                            }}
                          >
                            <p style={{ fontWeight: "500", color: "#111827" }}>
                              {entry.action}
                            </p>
                            <span
                              style={{
                                fontSize: "0.75rem",
                                color: "#6b7280",
                              }}
                            >
                              {new Date(entry.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          {entry.details && (
                            <p style={{ color: "#6b7280" }}>{entry.details}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Emergency Resources */}
                  <div
                    style={{
                      background: "white",
                      borderRadius: "0.75rem",
                      padding: "1.5rem",
                      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "1.125rem",
                        fontWeight: "600",
                        color: "#111827",
                        marginBottom: "1rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <Phone
                        style={{
                          width: "20px",
                          height: "20px",
                          color: "#6366f1",
                        }}
                      />
                      Emergency Contacts
                    </h3>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "0.75rem",
                      }}
                    >
                      {/* Show user-defined emergency contacts if available */}
                      {crisisPlan?.emergencyContacts &&
                      crisisPlan.emergencyContacts.length > 0
                        ? crisisPlan.emergencyContacts.map((contact, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                navigator.clipboard.writeText(contact.number);
                                // Show copied feedback
                                const copiedMsg = {
                                  id: Date.now() + 200,
                                  type: "ai",
                                  content: `📋 Copied ${contact.name}: ${contact.number}`,
                                  timestamp: new Date().toLocaleTimeString(),
                                };
                                setMessages((prev) => [...prev, copiedMsg]);
                              }}
                              style={{
                                padding: "0.75rem",
                                background: "#f3f4f6",
                                border: "1px solid #e5e7eb",
                                borderRadius: "0.5rem",
                                cursor: "pointer",
                                textAlign: "left",
                                transition: "all 0.2s",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = "#e5e7eb";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = "#f3f4f6";
                              }}
                            >
                              <p
                                style={{
                                  fontWeight: "500",
                                  color: "#111827",
                                  marginBottom: "0.25rem",
                                }}
                              >
                                {contact.name}
                              </p>
                              <p
                                style={{
                                  fontSize: "0.875rem",
                                  color: "#6b7280",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "0.25rem",
                                }}
                              >
                                <Phone
                                  style={{ width: "12px", height: "12px" }}
                                />
                                {contact.number}
                              </p>
                            </button>
                          ))
                        : // Default emergency contacts
                          [
                            { name: "Legal Hotline", number: "1-800-LEGAL" },
                            { name: "PR Agency", number: "1-800-CRISIS" },
                            { name: "IT Security", number: "1-800-SECURE" },
                            { name: "Insurance", number: "1-800-INSURE" },
                          ].map((contact, idx) => (
                            <button
                              key={idx}
                              style={{
                                padding: "0.75rem",
                                background: "#f3f4f6",
                                border: "1px solid #e5e7eb",
                                borderRadius: "0.5rem",
                                cursor: "pointer",
                                textAlign: "left",
                                transition: "all 0.2s",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = "#e5e7eb";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = "#f3f4f6";
                              }}
                            >
                              <p
                                style={{
                                  fontWeight: "500",
                                  color: "#111827",
                                  marginBottom: "0.25rem",
                                }}
                              >
                                {contact.name}
                              </p>
                              <p
                                style={{
                                  fontSize: "0.875rem",
                                  color: "#6b7280",
                                }}
                              >
                                {contact.number}
                              </p>
                            </button>
                          ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* AI Assistant - Minimized to Corner */}
            <div
              style={{
                width: aiExpanded ? "380px" : "300px",
                transition: "width 0.3s ease",
              }}
            >
              <div
                style={{
                  background: "white",
                  borderRadius: "0.75rem",
                  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                  height: aiExpanded ? "calc(100vh - 140px)" : "80px",
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                  border:
                    crisisStatus === "active"
                      ? "2px solid #dc2626"
                      : "1px solid #e5e7eb",
                }}
              >
                {/* AI Header - Always Visible */}
                <div
                  style={{
                    padding: "1rem",
                    borderBottom: aiExpanded ? "1px solid #e5e7eb" : "none",
                    background:
                      crisisStatus === "active"
                        ? "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)"
                        : "linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                  onClick={() => !aiExpanded && setAiExpanded(true)}
                >
                  {aiExpanded ? (
                    <>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                      >
                        <Bot
                          style={{
                            width: "20px",
                            height: "20px",
                            color: "white",
                          }}
                        />
                        <span
                          style={{
                            fontSize: "0.875rem",
                            fontWeight: "600",
                            color: "white",
                          }}
                        >
                          AI Crisis Advisor
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setAiExpanded(false);
                        }}
                        style={{
                          padding: "0.25rem",
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          color: "white",
                        }}
                      >
                        <Minimize2 style={{ width: "16px", height: "16px" }} />
                      </button>
                    </>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        width: "100%",
                      }}
                    >
                      <Bot
                        style={{
                          width: "24px",
                          height: "24px",
                          color: "white",
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: "0.875rem",
                            fontWeight: "600",
                            color: "white",
                          }}
                        >
                          🚨 Crisis AI Advisor
                        </div>
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: "rgba(255, 255, 255, 0.8)",
                          }}
                        >
                          {isAIResponding ? "Analyzing..." : "Click to expand"}
                        </div>
                      </div>
                      <div
                        style={{
                          padding: "0.25rem 0.5rem",
                          background: "rgba(255, 255, 255, 0.2)",
                          borderRadius: "0.25rem",
                          fontSize: "0.75rem",
                          color: "white",
                          fontWeight: "600",
                        }}
                      >
                        {messages.length} msgs
                      </div>
                    </div>
                  )}
                </div>

                {/* Expanded Content */}
                {aiExpanded && (
                  <>
                    {/* Messages */}
                    <div
                      ref={chatContainerRef}
                      style={{
                        flex: 1,
                        overflowY: "auto",
                        padding: "1rem",
                      }}
                    >
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          style={{
                            marginBottom: "0.75rem",
                            display: "flex",
                            justifyContent:
                              message.type === "user"
                                ? "flex-end"
                                : "flex-start",
                          }}
                        >
                          <div
                            style={{
                              maxWidth: "85%",
                              padding: "0.75rem",
                              borderRadius: "0.5rem",
                              background:
                                message.type === "user" ? "#4f46e5" : "#f3f4f6",
                              color:
                                message.type === "user" ? "white" : "#111827",
                            }}
                          >
                            <p
                              style={{
                                fontSize: "0.875rem",
                                lineHeight: "1.4",
                                whiteSpace: "pre-wrap",
                                margin: 0,
                              }}
                            >
                              {message.content}
                            </p>
                            <p
                              style={{
                                fontSize: "0.75rem",
                                marginTop: "0.25rem",
                                opacity: 0.7,
                                margin: "0.25rem 0 0 0",
                              }}
                            >
                              {message.timestamp}
                            </p>
                          </div>
                        </div>
                      ))}
                      {isAIResponding && (
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "flex-start",
                          }}
                        >
                          <div
                            style={{
                              padding: "1rem",
                              background: "#f3f4f6",
                              borderRadius: "0.75rem",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem",
                              }}
                            >
                              <Loader2
                                style={{
                                  width: "16px",
                                  height: "16px",
                                  animation: "spin 1s linear infinite",
                                }}
                              />
                              <span
                                style={{
                                  fontSize: "0.875rem",
                                  color: "#6b7280",
                                }}
                              >
                                AI is analyzing the situation...
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Input */}
                    <div
                      style={{
                        padding: "1rem",
                        borderTop: "1px solid #e5e7eb",
                      }}
                    >
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <input
                          type="text"
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                          placeholder="Ask for crisis guidance..."
                          style={{
                            flex: 1,
                            padding: "0.5rem",
                            border: "1px solid #e5e7eb",
                            borderRadius: "0.375rem",
                            fontSize: "0.875rem",
                            outline: "none",
                          }}
                        />
                        <button
                          onClick={() => sendMessage()}
                          disabled={!input.trim() || isAIResponding}
                          style={{
                            padding: "0.5rem",
                            background: "#dc2626",
                            color: "white",
                            border: "none",
                            borderRadius: "0.375rem",
                            cursor:
                              !input.trim() || isAIResponding
                                ? "not-allowed"
                                : "pointer",
                            opacity: !input.trim() || isAIResponding ? 0.5 : 1,
                          }}
                        >
                          <Send style={{ width: "16px", height: "16px" }} />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {/* Scenario Selection Modal */}
      {showScenarioModal && crisisPlan && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            padding: "1rem",
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "0.75rem",
              maxWidth: "600px",
              width: "100%",
              maxHeight: "80vh",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                padding: "1.5rem",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              <h2
                style={{
                  fontSize: "1.25rem",
                  fontWeight: "600",
                  color: "#111827",
                }}
              >
                Select Crisis Scenario
              </h2>
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "#6b7280",
                  marginTop: "0.25rem",
                }}
              >
                Choose the scenario that matches your current situation
              </p>
            </div>

            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "1.5rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                {crisisPlan.scenarios?.map((scenario, idx) => (
                  <button
                    key={idx}
                    onClick={() => selectCrisisScenario(scenario)}
                    style={{
                      padding: "1rem",
                      background: "white",
                      border: `1px solid ${
                        scenario.isUniversal ? "#4f46e5" : "#e5e7eb"
                      }`,
                      borderRadius: "0.5rem",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = scenario.isUniversal
                        ? "#e0e7ff"
                        : "#f9fafb";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "white";
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "start",
                        justifyContent: "space-between",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <h3
                          style={{
                            fontWeight: "600",
                            color: "#111827",
                            marginBottom: "0.25rem",
                          }}
                        >
                          {scenario.title}
                        </h3>
                        <p
                          style={{
                            fontSize: "0.875rem",
                            color: "#6b7280",
                          }}
                        >
                          {scenario.description}
                        </p>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.25rem",
                          marginLeft: "1rem",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "0.75rem",
                            padding: "0.25rem 0.5rem",
                            background:
                              scenario.likelihood === "High"
                                ? "#fee2e2"
                                : scenario.likelihood === "Medium"
                                ? "#fef3c7"
                                : "#d1fae5",
                            color:
                              scenario.likelihood === "High"
                                ? "#b91c1c"
                                : scenario.likelihood === "Medium"
                                ? "#a16207"
                                : "#047857",
                            borderRadius: "0.25rem",
                          }}
                        >
                          {scenario.likelihood}
                        </span>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            padding: "0.25rem 0.5rem",
                            background:
                              scenario.impact === "Critical"
                                ? "#fee2e2"
                                : scenario.impact === "Major"
                                ? "#fed7aa"
                                : scenario.impact === "Moderate"
                                ? "#fef3c7"
                                : "#d1fae5",
                            color:
                              scenario.impact === "Critical"
                                ? "#b91c1c"
                                : scenario.impact === "Major"
                                ? "#c2410c"
                                : scenario.impact === "Moderate"
                                ? "#a16207"
                                : "#047857",
                            borderRadius: "0.25rem",
                          }}
                        >
                          {scenario.impact}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div
              style={{
                padding: "1.5rem",
                borderTop: "1px solid #e5e7eb",
              }}
            >
              <button
                onClick={() => setShowScenarioModal(false)}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  background: "#6b7280",
                  color: "white",
                  border: "none",
                  borderRadius: "0.5rem",
                  fontWeight: "500",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Crisis Plan Generator Modal */}
      {showPlanGenerator && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            padding: "1rem",
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "0.75rem",
              maxWidth: "600px",
              width: "100%",
              maxHeight: "90vh",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                padding: "1.5rem",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              <h2
                style={{
                  fontSize: "1.25rem",
                  fontWeight: "600",
                  color: "#111827",
                }}
              >
                Generate Crisis Management Plan
              </h2>
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "#6b7280",
                  marginTop: "0.25rem",
                }}
              >
                Create a comprehensive plan tailored to your industry
              </p>
            </div>

            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "1.5rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                {/* Industry */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      color: "#374151",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Industry *
                  </label>
                  <input
                    type="text"
                    value={planForm.industry}
                    onChange={(e) =>
                      setPlanForm({ ...planForm, industry: e.target.value })
                    }
                    placeholder="e.g., Healthcare, Technology, Finance"
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "1px solid #e5e7eb",
                      borderRadius: "0.5rem",
                      fontSize: "0.875rem",
                    }}
                  />
                </div>

                {/* Company Size */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      color: "#374151",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Company Size
                  </label>
                  <select
                    value={planForm.companySize}
                    onChange={(e) =>
                      setPlanForm({ ...planForm, companySize: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "1px solid #e5e7eb",
                      borderRadius: "0.5rem",
                      fontSize: "0.875rem",
                    }}
                  >
                    <option value="">Select size</option>
                    <option value="startup">Startup (1-50)</option>
                    <option value="small">Small (51-200)</option>
                    <option value="medium">Medium (201-1000)</option>
                    <option value="large">Large (1000+)</option>
                  </select>
                </div>

                {/* Key Concerns */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      color: "#374151",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Key Concerns
                  </label>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                    }}
                  >
                    {planForm.keyConcerns.map((concern, idx) => (
                      <div key={idx} style={{ display: "flex", gap: "0.5rem" }}>
                        <input
                          type="text"
                          value={concern}
                          onChange={(e) => {
                            const updated = [...planForm.keyConcerns];
                            updated[idx] = e.target.value;
                            setPlanForm({ ...planForm, keyConcerns: updated });
                          }}
                          placeholder="e.g., Data breach, Product recall"
                          style={{
                            flex: 1,
                            padding: "0.5rem",
                            border: "1px solid #e5e7eb",
                            borderRadius: "0.375rem",
                            fontSize: "0.875rem",
                          }}
                        />
                        <button
                          onClick={() => {
                            setPlanForm({
                              ...planForm,
                              keyConcerns: planForm.keyConcerns.filter(
                                (_, i) => i !== idx
                              ),
                            });
                          }}
                          style={{
                            padding: "0.5rem",
                            background: "#fee2e2",
                            color: "#dc2626",
                            border: "none",
                            borderRadius: "0.375rem",
                            cursor: "pointer",
                          }}
                        >
                          <X style={{ width: "16px", height: "16px" }} />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() =>
                        setPlanForm({
                          ...planForm,
                          keyConcerns: [...planForm.keyConcerns, ""],
                        })
                      }
                      style={{
                        padding: "0.5rem",
                        background: "#f3f4f6",
                        color: "#374151",
                        border: "1px solid #e5e7eb",
                        borderRadius: "0.375rem",
                        fontSize: "0.875rem",
                        cursor: "pointer",
                      }}
                    >
                      + Add Concern
                    </button>
                  </div>
                </div>
                {/* Team Members with Contact Info */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      color: "#374151",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Crisis Team Members
                  </label>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                    }}
                  >
                    {planForm.teamMembers.map((member, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: "0.75rem",
                          background: "#f9fafb",
                          borderRadius: "0.375rem",
                          border: "1px solid #e5e7eb",
                        }}
                      >
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "0.5rem",
                            marginBottom: "0.5rem",
                          }}
                        >
                          <input
                            type="text"
                            value={member.name}
                            onChange={(e) => {
                              const updated = [...planForm.teamMembers];
                              updated[idx].name = e.target.value;
                              setPlanForm({
                                ...planForm,
                                teamMembers: updated,
                              });
                            }}
                            placeholder="Name"
                            style={{
                              padding: "0.5rem",
                              border: "1px solid #e5e7eb",
                              borderRadius: "0.375rem",
                              fontSize: "0.875rem",
                            }}
                          />
                          <input
                            type="text"
                            value={member.role}
                            onChange={(e) => {
                              const updated = [...planForm.teamMembers];
                              updated[idx].role = e.target.value;
                              setPlanForm({
                                ...planForm,
                                teamMembers: updated,
                              });
                            }}
                            placeholder="Role/Title"
                            style={{
                              padding: "0.5rem",
                              border: "1px solid #e5e7eb",
                              borderRadius: "0.375rem",
                              fontSize: "0.875rem",
                            }}
                          />
                        </div>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr auto",
                            gap: "0.5rem",
                          }}
                        >
                          <input
                            type="email"
                            value={member.email}
                            onChange={(e) => {
                              const updated = [...planForm.teamMembers];
                              updated[idx].email = e.target.value;
                              setPlanForm({
                                ...planForm,
                                teamMembers: updated,
                              });
                            }}
                            placeholder="Email"
                            style={{
                              padding: "0.5rem",
                              border: "1px solid #e5e7eb",
                              borderRadius: "0.375rem",
                              fontSize: "0.875rem",
                            }}
                          />
                          <input
                            type="tel"
                            value={member.phone}
                            onChange={(e) => {
                              const updated = [...planForm.teamMembers];
                              updated[idx].phone = e.target.value;
                              setPlanForm({
                                ...planForm,
                                teamMembers: updated,
                              });
                            }}
                            placeholder="Phone"
                            style={{
                              padding: "0.5rem",
                              border: "1px solid #e5e7eb",
                              borderRadius: "0.375rem",
                              fontSize: "0.875rem",
                            }}
                          />
                          <button
                            onClick={() => {
                              setPlanForm({
                                ...planForm,
                                teamMembers: planForm.teamMembers.filter(
                                  (_, i) => i !== idx
                                ),
                              });
                            }}
                            style={{
                              padding: "0.5rem",
                              background: "#fee2e2",
                              color: "#dc2626",
                              border: "none",
                              borderRadius: "0.375rem",
                              cursor: "pointer",
                            }}
                          >
                            <X style={{ width: "16px", height: "16px" }} />
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={() =>
                        setPlanForm({
                          ...planForm,
                          teamMembers: [
                            ...planForm.teamMembers,
                            { name: "", role: "", email: "", phone: "" },
                          ],
                        })
                      }
                      style={{
                        padding: "0.5rem",
                        background: "#f3f4f6",
                        color: "#374151",
                        border: "1px solid #e5e7eb",
                        borderRadius: "0.375rem",
                        fontSize: "0.875rem",
                        cursor: "pointer",
                      }}
                    >
                      + Add Team Member
                    </button>
                  </div>
                </div>

                {/* Emergency Contacts */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      color: "#374151",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Emergency Contacts
                  </label>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                    }}
                  >
                    {planForm.emergencyContacts.map((contact, idx) => (
                      <div key={idx} style={{ display: "flex", gap: "0.5rem" }}>
                        <input
                          type="text"
                          value={contact.name}
                          onChange={(e) => {
                            const updated = [...planForm.emergencyContacts];
                            updated[idx].name = e.target.value;
                            setPlanForm({
                              ...planForm,
                              emergencyContacts: updated,
                            });
                          }}
                          placeholder="Contact Name (e.g., Legal Hotline)"
                          style={{
                            flex: 2,
                            padding: "0.5rem",
                            border: "1px solid #e5e7eb",
                            borderRadius: "0.375rem",
                            fontSize: "0.875rem",
                          }}
                        />
                        <input
                          type="tel"
                          value={contact.number}
                          onChange={(e) => {
                            const updated = [...planForm.emergencyContacts];
                            updated[idx].number = e.target.value;
                            setPlanForm({
                              ...planForm,
                              emergencyContacts: updated,
                            });
                          }}
                          placeholder="Phone Number"
                          style={{
                            flex: 1,
                            padding: "0.5rem",
                            border: "1px solid #e5e7eb",
                            borderRadius: "0.375rem",
                            fontSize: "0.875rem",
                          }}
                        />
                        <button
                          onClick={() => {
                            setPlanForm({
                              ...planForm,
                              emergencyContacts:
                                planForm.emergencyContacts.filter(
                                  (_, i) => i !== idx
                                ),
                            });
                          }}
                          style={{
                            padding: "0.5rem",
                            background: "#fee2e2",
                            color: "#dc2626",
                            border: "none",
                            borderRadius: "0.375rem",
                            cursor: "pointer",
                          }}
                        >
                          <X style={{ width: "16px", height: "16px" }} />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() =>
                        setPlanForm({
                          ...planForm,
                          emergencyContacts: [
                            ...planForm.emergencyContacts,
                            { name: "", number: "" },
                          ],
                        })
                      }
                      style={{
                        padding: "0.5rem",
                        background: "#f3f4f6",
                        color: "#374151",
                        border: "1px solid #e5e7eb",
                        borderRadius: "0.375rem",
                        fontSize: "0.875rem",
                        cursor: "pointer",
                      }}
                    >
                      + Add Emergency Contact
                    </button>
                  </div>
                </div>
                {/* Additional Context */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      color: "#374151",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Additional Context
                  </label>
                  <textarea
                    value={planForm.additionalContext}
                    onChange={(e) =>
                      setPlanForm({
                        ...planForm,
                        additionalContext: e.target.value,
                      })
                    }
                    placeholder="Any other relevant information about your organization..."
                    rows={3}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "1px solid #e5e7eb",
                      borderRadius: "0.5rem",
                      fontSize: "0.875rem",
                    }}
                  />
                </div>
              </div>
            </div>

            <div
              style={{
                padding: "1.5rem",
                borderTop: "1px solid #e5e7eb",
                display: "flex",
                gap: "0.75rem",
              }}
            >
              <button
                onClick={() => setShowPlanGenerator(false)}
                style={{
                  flex: 1,
                  padding: "0.75rem",
                  background: "#6b7280",
                  color: "white",
                  border: "none",
                  borderRadius: "0.5rem",
                  fontWeight: "500",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={generateCrisisPlan}
                disabled={!planForm.industry || planGenerating}
                style={{
                  flex: 1,
                  padding: "0.75rem",
                  background:
                    planForm.industry && !planGenerating
                      ? "#6366f1"
                      : "#9ca3af",
                  color: "white",
                  border: "none",
                  borderRadius: "0.5rem",
                  fontWeight: "500",
                  cursor:
                    planForm.industry && !planGenerating
                      ? "pointer"
                      : "not-allowed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                }}
              >
                {planGenerating ? (
                  <>
                    <Loader2
                      style={{
                        width: "16px",
                        height: "16px",
                        animation: "spin 1s linear infinite",
                      }}
                    />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles style={{ width: "16px", height: "16px" }} />
                    Generate Plan
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Crisis Plan Viewer Modal */}
      {showResources && crisisPlan && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            padding: "1rem",
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "0.75rem",
              maxWidth: "900px",
              width: "100%",
              maxHeight: "90vh",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                padding: "1.5rem",
                borderBottom: "1px solid #e5e7eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: "600",
                    color: "#111827",
                  }}
                >
                  Crisis Management Plan
                </h2>
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "#6b7280",
                    marginTop: "0.25rem",
                  }}
                >
                  {crisisPlan.industry} Industry • Generated{" "}
                  {new Date(
                    crisisPlan.generatedAt || Date.now()
                  ).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={async () => {
                  await saveToMemoryVault({
                    content: JSON.stringify(crisisPlan, null, 2),
                    title: `Crisis Management Plan - ${crisisPlan.industry}`,
                    type: "crisis-plan",
                    source: "crisis-command-center",
                    folder_type: "crisis-management",
                    tags: ["crisis-plan", crisisPlan.industry, "complete"],
                    metadata: {
                      generated_at: crisisPlan.generatedAt,
                      project_id: selectedProject?.id,
                      industry: crisisPlan.industry,
                    },
                  });
                }}
                style={{
                  padding: "0.5rem 1rem",
                  background: "#10b981",
                  color: "white",
                  border: "none",
                  borderRadius: "0.5rem",
                  fontWeight: "500",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <Save style={{ width: "16px", height: "16px" }} />
                Save to MemoryVault
              </button>
            </div>

            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "1.5rem",
              }}
            >
              {/* Crisis Plan Sections */}
              {[
                {
                  key: "objectives",
                  title: "Crisis Management Objectives",
                  icon: Target,
                  editable: true,
                  data: (
                    <ul style={{ marginLeft: "1.5rem", color: "#4b5563" }}>
                      {crisisPlan.objectives?.map((obj, idx) => (
                        <li key={idx} style={{ marginBottom: "0.5rem" }}>
                          {obj}
                        </li>
                      ))}
                    </ul>
                  ),
                },
                {
                  key: "team",
                  title: "Crisis Communications Team",
                  icon: Users,
                  editable: true,
                  data: (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.75rem",
                      }}
                    >
                      {crisisPlan.crisisTeam?.map((member, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: "1rem",
                            background: "#f9fafb",
                            borderRadius: "0.5rem",
                          }}
                        >
                          <h4
                            style={{
                              fontWeight: "600",
                              color: "#111827",
                              marginBottom: "0.5rem",
                            }}
                          >
                            {member.role}
                          </h4>
                          <p
                            style={{
                              fontSize: "0.875rem",
                              color: "#6b7280",
                              marginBottom: "0.5rem",
                            }}
                          >
                            {member.title}
                          </p>
                          {member.name && (
                            <p
                              style={{ fontSize: "0.875rem", color: "#4f46e5" }}
                            >
                              <UserCheck
                                style={{
                                  width: "14px",
                                  height: "14px",
                                  display: "inline",
                                  marginRight: "0.25rem",
                                }}
                              />
                              {member.name}
                            </p>
                          )}
                          <div style={{ marginTop: "0.75rem" }}>
                            <p
                              style={{
                                fontSize: "0.75rem",
                                fontWeight: "500",
                                color: "#374151",
                                marginBottom: "0.25rem",
                              }}
                            >
                              Responsibilities:
                            </p>
                            <ul
                              style={{
                                marginLeft: "1rem",
                                fontSize: "0.75rem",
                                color: "#6b7280",
                              }}
                            >
                              {member.responsibilities?.map((resp, i) => (
                                <li key={i}>{resp}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>
                  ),
                },
                {
                  key: "process",
                  title: "Crisis Response Process",
                  icon: Activity,
                  data: (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "1rem",
                      }}
                    >
                      {crisisPlan.responseProcess?.map((phase, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: "1rem",
                            background: "#f9fafb",
                            borderRadius: "0.5rem",
                          }}
                        >
                          <h4
                            style={{
                              fontWeight: "600",
                              color: "#111827",
                              marginBottom: "0.5rem",
                            }}
                          >
                            Phase {idx + 1}: {phase.phase}
                          </h4>
                          <p
                            style={{
                              fontSize: "0.875rem",
                              color: "#6b7280",
                              marginBottom: "0.75rem",
                            }}
                          >
                            {phase.description}
                          </p>
                          <ul
                            style={{
                              marginLeft: "1rem",
                              fontSize: "0.875rem",
                              color: "#4b5563",
                            }}
                          >
                            {phase.actions?.map((action, i) => (
                              <li key={i}>{action}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  ),
                },
                {
                  key: "scenarios",
                  title: "Crisis Scenarios",
                  icon: AlertTriangle,
                  editable: true,
                  data: (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.75rem",
                      }}
                    >
                      {crisisPlan.scenarios?.map((scenario, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: "1rem",
                            background: scenario.isUniversal
                              ? "#e0e7ff"
                              : "#f9fafb",
                            borderRadius: "0.5rem",
                            border: `1px solid ${
                              scenario.isUniversal ? "#c7d2fe" : "#e5e7eb"
                            }`,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "start",
                              justifyContent: "space-between",
                            }}
                          >
                            <div>
                              <h4
                                style={{
                                  fontWeight: "600",
                                  color: "#111827",
                                  marginBottom: "0.25rem",
                                }}
                              >
                                {scenario.title}
                              </h4>
                              <p
                                style={{
                                  fontSize: "0.875rem",
                                  color: "#6b7280",
                                }}
                              >
                                {scenario.description}
                              </p>
                            </div>
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                              <span
                                style={{
                                  fontSize: "0.75rem",
                                  padding: "0.25rem 0.5rem",
                                  background:
                                    scenario.likelihood === "High"
                                      ? "#fee2e2"
                                      : scenario.likelihood === "Medium"
                                      ? "#fef3c7"
                                      : "#d1fae5",
                                  color:
                                    scenario.likelihood === "High"
                                      ? "#b91c1c"
                                      : scenario.likelihood === "Medium"
                                      ? "#a16207"
                                      : "#047857",
                                  borderRadius: "0.25rem",
                                }}
                              >
                                {scenario.likelihood}
                              </span>
                              <span
                                style={{
                                  fontSize: "0.75rem",
                                  padding: "0.25rem 0.5rem",
                                  background:
                                    scenario.impact === "Critical"
                                      ? "#fee2e2"
                                      : scenario.impact === "Major"
                                      ? "#fed7aa"
                                      : "#fef3c7",
                                  color:
                                    scenario.impact === "Critical"
                                      ? "#b91c1c"
                                      : scenario.impact === "Major"
                                      ? "#c2410c"
                                      : "#a16207",
                                  borderRadius: "0.25rem",
                                }}
                              >
                                {scenario.impact}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ),
                },
                {
                  key: "stakeholders",
                  title: "Key Stakeholders",
                  icon: Globe,
                  data: (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fill, minmax(250px, 1fr))",
                        gap: "1rem",
                      }}
                    >
                      {crisisPlan.stakeholders?.map((stakeholder, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: "1rem",
                            background: "#f9fafb",
                            borderRadius: "0.5rem",
                            border: "1px solid #e5e7eb",
                          }}
                        >
                          <h4
                            style={{
                              fontWeight: "600",
                              color: "#111827",
                              marginBottom: "0.5rem",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                            }}
                          >
                            <Building
                              style={{
                                width: "16px",
                                height: "16px",
                                color: "#6366f1",
                              }}
                            />
                            {typeof stakeholder === "string"
                              ? stakeholder
                              : stakeholder.name || "Stakeholder"}
                          </h4>
                          {typeof stakeholder === "object" && (
                            <>
                              {stakeholder.description && (
                                <p
                                  style={{
                                    fontSize: "0.875rem",
                                    color: "#6b7280",
                                    marginBottom: "0.5rem",
                                  }}
                                >
                                  {stakeholder.description}
                                </p>
                              )}
                              {stakeholder.impactLevel && (
                                <p
                                  style={{
                                    fontSize: "0.75rem",
                                    color: "#6366f1",
                                    marginBottom: "0.25rem",
                                  }}
                                >
                                  Impact Level: {stakeholder.impactLevel}
                                </p>
                              )}
                              {stakeholder.concerns &&
                                stakeholder.concerns.length > 0 && (
                                  <div style={{ marginTop: "0.5rem" }}>
                                    <p
                                      style={{
                                        fontSize: "0.75rem",
                                        fontWeight: "500",
                                        color: "#374151",
                                        marginBottom: "0.25rem",
                                      }}
                                    >
                                      Key Concerns:
                                    </p>
                                    <ul
                                      style={{
                                        marginLeft: "1rem",
                                        fontSize: "0.75rem",
                                        color: "#6b7280",
                                      }}
                                    >
                                      {stakeholder.concerns.map(
                                        (concern, i) => (
                                          <li key={i}>{concern}</li>
                                        )
                                      )}
                                    </ul>
                                  </div>
                                )}
                            </>
                          )}
                          {typeof stakeholder === "string" && (
                            <p
                              style={{ fontSize: "0.875rem", color: "#6b7280" }}
                            >
                              Priority stakeholder group requiring targeted
                              communication
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ),
                },
                {
                  key: "communicationPlans",
                  title: "Stakeholder Communication Plans",
                  icon: MessageCircle,
                  data: (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "1rem",
                      }}
                    >
                      {crisisPlan.communicationPlans?.map((plan, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: "1.25rem",
                            background: "#f9fafb",
                            borderRadius: "0.5rem",
                            border: "1px solid #e5e7eb",
                          }}
                        >
                          <div style={{ marginBottom: "1rem" }}>
                            <h4
                              style={{
                                fontWeight: "600",
                                color: "#111827",
                                marginBottom: "0.5rem",
                              }}
                            >
                              {typeof plan.stakeholder === "string"
                                ? plan.stakeholder
                                : plan.stakeholder?.name || "Stakeholder"}
                            </h4>
                            <div
                              style={{
                                display: "flex",
                                gap: "1rem",
                                fontSize: "0.875rem",
                                color: "#6b7280",
                              }}
                            >
                              <span>
                                <Phone
                                  style={{
                                    width: "14px",
                                    height: "14px",
                                    display: "inline",
                                    marginRight: "0.25rem",
                                  }}
                                />
                                {plan.primaryChannel}
                              </span>
                              <span>
                                <Clock
                                  style={{
                                    width: "14px",
                                    height: "14px",
                                    display: "inline",
                                    marginRight: "0.25rem",
                                  }}
                                />
                                {plan.timing}
                              </span>
                            </div>
                          </div>
                          {plan.keyMessages && plan.keyMessages.length > 0 && (
                            <div>
                              <p
                                style={{
                                  fontSize: "0.75rem",
                                  fontWeight: "500",
                                  color: "#374151",
                                  marginBottom: "0.5rem",
                                }}
                              >
                                Key Messages:
                              </p>
                              <ul
                                style={{
                                  marginLeft: "1rem",
                                  fontSize: "0.875rem",
                                  color: "#6b7280",
                                }}
                              >
                                {plan.keyMessages.map((msg, i) => (
                                  <li
                                    key={i}
                                    style={{ marginBottom: "0.25rem" }}
                                  >
                                    {msg}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ),
                },
                {
                  key: "eventMonitoring",
                  title: "Event Monitoring",
                  icon: Activity,
                  data: (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.75rem",
                      }}
                    >
                      {crisisPlan.escalationCriteria?.map((criteria, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: "1rem",
                            background: "#f9fafb",
                            borderRadius: "0.5rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "1rem",
                          }}
                        >
                          <div
                            style={{
                              width: "40px",
                              height: "40px",
                              background: "#e0e7ff",
                              borderRadius: "0.5rem",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <AlertCircle
                              style={{
                                width: "20px",
                                height: "20px",
                                color: "#6366f1",
                              }}
                            />
                          </div>
                          <div style={{ flex: 1 }}>
                            <p
                              style={{ fontSize: "0.875rem", color: "#111827" }}
                            >
                              {criteria}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div
                        style={{
                          marginTop: "1rem",
                          padding: "1rem",
                          background: "#e0e7ff",
                          borderRadius: "0.5rem",
                          border: "1px solid #c7d2fe",
                        }}
                      >
                        <p
                          style={{
                            fontSize: "0.875rem",
                            color: "#4338ca",
                            fontWeight: "500",
                          }}
                        >
                          These criteria trigger immediate crisis team
                          activation and response protocol initiation.
                        </p>
                      </div>
                    </div>
                  ),
                },
                {
                  key: "postIncident",
                  title: "Post-Incident Evaluation",
                  icon: ClipboardCheck,
                  data: (
                    <div>
                      <div
                        style={{
                          marginBottom: "1.5rem",
                          padding: "1rem",
                          background: "#f9fafb",
                          borderRadius: "0.5rem",
                        }}
                      >
                        <h4
                          style={{
                            fontWeight: "600",
                            color: "#111827",
                            marginBottom: "0.75rem",
                          }}
                        >
                          Evaluation Timeline
                        </h4>
                        <ul
                          style={{
                            fontSize: "0.875rem",
                            color: "#6b7280",
                            marginLeft: "1.5rem",
                          }}
                        >
                          <li style={{ marginBottom: "0.5rem" }}>
                            <strong>Within 24 hours:</strong> Initial debrief
                            with crisis team
                          </li>
                          <li style={{ marginBottom: "0.5rem" }}>
                            <strong>Within 48 hours:</strong> Stakeholder
                            feedback collection
                          </li>
                          <li style={{ marginBottom: "0.5rem" }}>
                            <strong>Within 1 week:</strong> Comprehensive
                            incident report
                          </li>
                          <li>
                            <strong>Within 2 weeks:</strong> Plan updates and
                            team training
                          </li>
                        </ul>
                      </div>

                      {crisisPlan.improvementAreas && (
                        <div>
                          <h4
                            style={{
                              fontWeight: "600",
                              color: "#111827",
                              marginBottom: "0.75rem",
                            }}
                          >
                            Key Improvement Areas
                          </h4>
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "1fr 1fr",
                              gap: "0.75rem",
                            }}
                          >
                            {crisisPlan.improvementAreas.map((area, idx) => (
                              <div
                                key={idx}
                                style={{
                                  padding: "0.75rem",
                                  background: "#fef3c7",
                                  borderRadius: "0.375rem",
                                  fontSize: "0.875rem",
                                  color: "#92400e",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "0.5rem",
                                }}
                              >
                                <Lightbulb
                                  style={{ width: "16px", height: "16px" }}
                                />
                                {area}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ),
                },
              ].map((section) =>
                renderCrisisPlanSection(section, section.data)
              )}
            </div>

            <div
              style={{
                padding: "1.5rem",
                borderTop: "1px solid #e5e7eb",
              }}
            >
              <button
                onClick={() => setShowResources(false)}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  background: "#6b7280",
                  color: "white",
                  border: "none",
                  borderRadius: "0.5rem",
                  fontWeight: "500",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Draft Modal */}
      {showDraftModal &&
        currentDraftStakeholder &&
        communicationDrafts[currentDraftStakeholder] && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0, 0, 0, 0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 50,
              padding: "1rem",
            }}
          >
            <div
              style={{
                background: "white",
                borderRadius: "0.75rem",
                maxWidth: "800px",
                width: "100%",
                maxHeight: "90vh",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  padding: "1.5rem",
                  borderBottom: "1px solid #e5e7eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <h2
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: "600",
                    color: "#111827",
                  }}
                >
                  {currentDraftStakeholder} Communication Draft
                </h2>
                <button
                  onClick={() => {
                    setShowDraftModal(false);
                    setCurrentDraftStakeholder(null);
                    setEditingDraft("");
                  }}
                  style={{
                    padding: "0.5rem",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: "#6b7280",
                  }}
                >
                  <X style={{ width: "20px", height: "20px" }} />
                </button>
              </div>

              <div
                style={{
                  flex: 1,
                  padding: "1.5rem",
                  overflowY: "auto",
                }}
              >
                <textarea
                  value={
                    editingDraft ||
                    communicationDrafts[currentDraftStakeholder].content
                  }
                  onChange={(e) => setEditingDraft(e.target.value)}
                  style={{
                    width: "100%",
                    minHeight: "400px",
                    padding: "1rem",
                    border: "1px solid #e5e7eb",
                    borderRadius: "0.5rem",
                    fontSize: "0.9375rem",
                    lineHeight: "1.6",
                    resize: "vertical",
                  }}
                />
              </div>

              <div
                style={{
                  padding: "1.5rem",
                  borderTop: "1px solid #e5e7eb",
                  display: "flex",
                  gap: "0.75rem",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  onClick={() => {
                    setShowDraftModal(false);
                    setCurrentDraftStakeholder(null);
                    setEditingDraft("");
                  }}
                  style={{
                    padding: "0.625rem 1.25rem",
                    background: "#6b7280",
                    color: "white",
                    border: "none",
                    borderRadius: "0.5rem",
                    fontWeight: "500",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (editingDraft) {
                      setCommunicationDrafts((prev) => ({
                        ...prev,
                        [currentDraftStakeholder]: {
                          ...prev[currentDraftStakeholder],
                          content: editingDraft,
                          timestamp: new Date(),
                        },
                      }));
                    }
                    saveCommunication(
                      currentDraftStakeholder,
                      communicationDrafts[currentDraftStakeholder]
                    );
                    setShowDraftModal(false);
                    setCurrentDraftStakeholder(null);
                    setEditingDraft("");
                  }}
                  disabled={isDraftSaving}
                  style={{
                    padding: "0.625rem 1.25rem",
                    background: isDraftSaving ? "#9ca3af" : "#10b981",
                    color: "white",
                    border: "none",
                    borderRadius: "0.5rem",
                    fontWeight: "500",
                    cursor: isDraftSaving ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  {isDraftSaving ? (
                    <>
                      <Loader2
                        style={{
                          width: "16px",
                          height: "16px",
                          animation: "spin 1s linear infinite",
                        }}
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save style={{ width: "16px", height: "16px" }} />
                      Save & Send
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

      <style>
        {`
                @keyframes spin {
                  from { transform: rotate(0deg); }
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

export default CrisisCommandCenter;
