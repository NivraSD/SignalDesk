import React, { useState, useRef, useEffect } from "react";
import api from "../services/api";
import { useProject } from "../contexts/ProjectContext";
import SaveToMemoryVaultButton from "./MemoryVault/SaveToMemoryVaultButton";
import {
  AlertTriangle,
  Users,
  MessageCircle,
  Shield,
  Activity,
  FileText,
  ChevronDown,
  ChevronUp,
  Bot,
  Send,
  Loader2,
  Bell,
  CheckCircle,
  XCircle,
  AlertCircle,
  Phone,
  Mail,
  Globe,
  Timer,
  HelpCircle,
  ListChecks,
  PhoneCall,
  Radio,
  ExternalLink,
  ClipboardCheck,
  UserCheck,
  Calendar,
  Pencil,
  Save,
  Plus,
  X,
  Target,
} from "lucide-react";
import "./CrisisCommandCenter.css";
import AIAdvisorHelp, { CrisisSeverityMeter } from "./AIAdvisorHelp";

const CrisisCommandCenter = () => {
  const { selectedProject } = useProject();

  // Crisis Plan States
  const [industry, setIndustry] = useState("");
  const [loading, setLoading] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStep, setGenerationStep] = useState("");
  const [crisisPlan, setCrisisPlan] = useState(null);
  const [error, setError] = useState("");
  const [expandedSections, setExpandedSections] = useState({});
  const [editingSection, setEditingSection] = useState(null);
  const [editedPlan, setEditedPlan] = useState(null);

  // Command Center States
  const [activeView, setActiveView] = useState("dashboard");
  const [activeAlert, setActiveAlert] = useState(false);
  const [crisisStatus, setCrisisStatus] = useState("monitoring");
  const [selectedScenario, setSelectedScenario] = useState(null);

  // Crisis Mode States
  const [showScenarioModal, setShowScenarioModal] = useState(false);
  const [crisisStartTime, setCrisisStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState("00:00:00");
  const [teamStatus, setTeamStatus] = useState({});
  const [tasks, setTasks] = useState([]);
  const [decisionLog, setDecisionLog] = useState([]);
  const [communicationStatus, setCommunicationStatus] = useState({});
  const [draftedResponses, setDraftedResponses] = useState({});
  const [draftingFor, setDraftingFor] = useState(null);

  // AI Advisor States
  const [chatMessages, setChatMessages] = useState([]);
  const [showQueryHelp, setShowQueryHelp] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [isAIResponding, setIsAIResponding] = useState(false);
  const chatContainerRef = useRef(null);

  // Notifications
  const [notifications, setNotifications] = useState([]);

  // Enhanced Crisis Plan Generation Form State
  const [crisisPlanForm, setCrisisPlanForm] = useState({
    industry: "",
    companySize: "",
    teamMembers: [],
    keyConcerns: [],
    existingProtocols: "",
    additionalContext: "",
  });
  const [showEnhancedForm, setShowEnhancedForm] = useState(false);

  // Active Crisis Documentation State
  const [activeCrisisData, setActiveCrisisData] = useState(null);

  // Helper Functions
  const cleanJsonResponse = (response) => {
    return response
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const addNotification = (message, type = "info") => {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date().toLocaleTimeString(),
    };
    setNotifications((prev) => [notification, ...prev].slice(0, 10));
  };

  const addToDecisionLog = (entry) => {
    const logEntry = {
      id: Date.now(),
      ...entry,
      timestamp: new Date().toISOString(),
    };
    setDecisionLog((prev) => [logEntry, ...prev]);

    // Update active crisis data
    if (activeCrisisData) {
      setActiveCrisisData((prev) => ({
        ...prev,
        decisionLog: [logEntry, ...(prev.decisionLog || [])],
      }));
    }
  };

  // Default crisis team structure
  const getDefaultCrisisTeam = () => [
    {
      role: "Crisis Response Leader",
      title: "Chief Executive Officer or designated senior executive",
      name: "",
      contact: "",
      phone: "",
      email: "",
      alternateContact: "",
      responsibilities: [
        "Overall crisis response authority and decision-making",
        "External stakeholder communications approval",
        "Resource allocation and strategic direction",
      ],
    },
    {
      role: "Communications Director",
      title: "Head of Communications/PR or senior communications executive",
      name: "",
      contact: "",
      phone: "",
      email: "",
      alternateContact: "",
      responsibilities: [
        "Develop and implement communication strategies",
        "Media relations and press release coordination",
        "Message consistency across all channels",
      ],
    },
    {
      role: "Operations Manager",
      title: "Chief Operating Officer or senior operations executive",
      name: "",
      contact: "",
      phone: "",
      email: "",
      alternateContact: "",
      responsibilities: [
        "Operational impact assessment and mitigation",
        "Business continuity plan activation",
        "Internal coordination and resource management",
      ],
    },
    {
      role: "Legal Counsel",
      title: "General Counsel or senior legal advisor",
      name: "",
      contact: "",
      phone: "",
      email: "",
      alternateContact: "",
      responsibilities: [
        "Legal risk assessment and compliance guidance",
        "Regulatory notification requirements",
        "Litigation risk management",
      ],
    },
    {
      role: "Human Resources Lead",
      title: "Chief Human Resources Officer or senior HR executive",
      name: "",
      contact: "",
      phone: "",
      email: "",
      alternateContact: "",
      responsibilities: [
        "Employee communications and support",
        "Staff safety and welfare coordination",
        "Union and labor relations management",
      ],
    },
  ];

  // Universal scenarios that apply to all industries
  const getUniversalScenarios = () => [
    {
      title: "Cyber Attack / Ransomware",
      description:
        "Sophisticated cyber attack compromising systems, encrypting data, or demanding ransom payment, potentially paralyzing operations",
      likelihood: "High",
      impact: "Critical",
      isUniversal: true,
    },
    {
      title: "Executive Misconduct",
      description:
        "Senior leadership accused of illegal, unethical, or inappropriate behavior requiring immediate action and public response",
      likelihood: "Medium",
      impact: "Major",
      isUniversal: true,
    },
    {
      title: "Workplace Violence Incident",
      description:
        "Active threat or violent incident at company facilities requiring immediate safety response and crisis management",
      likelihood: "Low",
      impact: "Critical",
      isUniversal: true,
    },
    {
      title: "Financial Fraud or Embezzlement",
      description:
        "Discovery of internal financial misconduct, accounting irregularities, or embezzlement affecting company finances and credibility",
      likelihood: "Medium",
      impact: "Major",
      isUniversal: true,
    },
    {
      title: "Pandemic/Health Emergency",
      description:
        "Widespread health crisis requiring business continuity measures, remote work protocols, and employee safety procedures",
      likelihood: "Medium",
      impact: "Major",
      isUniversal: true,
    },
  ];

  // Crisis Timer Effect
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

  // Start editing a section
  const startEditingSection = (section) => {
    setEditingSection(section);
    const planCopy = { ...crisisPlan };

    // Ensure crisisTeam exists if editing team section
    if (section === "team" && !planCopy.crisisTeam) {
      planCopy.crisisTeam = getDefaultCrisisTeam();
    }

    setEditedPlan(planCopy);
  };

  // Save edited section
  const saveEditedSection = () => {
    if (!editedPlan) {
      addNotification("No changes to save", "error");
      return;
    }

    setCrisisPlan(editedPlan);
    setEditingSection(null);
    setEditedPlan(null);

    const sectionNames = {
      objectives: "Objectives",
      team: "Crisis Communications Team",
      process: "Crisis Response Process",
      scenarios: "Crisis Scenarios",
      stakeholders: "Key Stakeholders",
      communication: "Stakeholder Communication Plans",
      monitoring: "Event Monitoring",
      evaluation: "Post-Incident Evaluation",
    };
    addNotification(
      `${
        sectionNames[editingSection] || editingSection
      } section updated successfully`,
      "success"
    );
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingSection(null);
    setEditedPlan(null);
    addNotification("Changes discarded", "info");
  };

  // Enhanced Draft Response using Claude
  const draftResponse = async (stakeholder, plan) => {
    setDraftingFor(stakeholder);

    try {
      const prompt = `You are drafting a crisis communication for ${stakeholder} during a ${
        selectedScenario ? selectedScenario.title : "crisis situation"
      } in the ${crisisPlan?.industry || "business"} industry.

Key messages to include:
${plan.keyMessages.map((msg, i) => `${i + 1}. ${msg}`).join("\n")}

Communication channel: ${plan.primaryChannel}
Spokesperson: ${plan.spokesperson}
Timing requirement: ${plan.timing}
Company: ${selectedProject?.name || "the company"}

Draft a professional, empathetic, and clear communication that:
1. Addresses the crisis situation
2. Incorporates ALL the key messages listed above
3. Is appropriate for ${stakeholder}
4. Maintains trust and transparency
5. Provides clear next steps or actions

The tone should be appropriate for the stakeholder group and the severity of the situation.

Respond with ONLY the drafted message text, no other commentary.`;

      const response = await api.draftCrisisResponse({
        prompt,
        stakeholder,
        scenario: selectedScenario,
        projectId: selectedProject?.id,
      });

      if (response.success && response.draft) {
        setDraftedResponses((prev) => ({
          ...prev,
          [stakeholder]: {
            content: response.draft,
            timestamp: new Date().toLocaleTimeString(),
            plan: plan,
          },
        }));

        addNotification(`Response drafted for ${stakeholder}`, "success");
      } else {
        throw new Error("Failed to get draft from Claude");
      }
    } catch (error) {
      console.error("Error drafting response:", error);

      // Fallback template
      const template = `Dear ${stakeholder},

We are writing to inform you about ${
        selectedScenario ? selectedScenario.title : "a situation"
      } that may affect our operations.

${plan.keyMessages.map((msg) => `• ${msg}`).join("\n")}

We are committed to keeping you informed as the situation develops. Please don't hesitate to reach out through ${
        plan.primaryChannel
      } if you have any questions or concerns.

Thank you for your patience and understanding.

Sincerely,
${plan.spokesperson}`;

      setDraftedResponses((prev) => ({
        ...prev,
        [stakeholder]: {
          content: template,
          timestamp: new Date().toLocaleTimeString(),
          plan: plan,
        },
      }));

      addNotification(`Template response created for ${stakeholder}`, "info");
    } finally {
      setDraftingFor(null);
    }
  };

  // Send Communication
  const sendCommunication = (stakeholder) => {
    setCommunicationStatus((prev) => ({
      ...prev,
      [stakeholder]: "sent",
    }));

    addToDecisionLog({
      action: "Stakeholder Communication Sent",
      by: "Communications Director",
      details: `Message sent to ${stakeholder}`,
      severity: "info",
    });

    addNotification(`Communication sent to ${stakeholder}`, "success");
  };

  // Update Task Status
  const updateTaskStatus = (taskId, newStatus) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    );

    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      addToDecisionLog({
        action: "Task Status Updated",
        by: task.assignee,
        details: `${task.task} - ${newStatus}`,
        severity: "info",
      });
    }
  };

  // Update Team Member Status
  const updateTeamMemberStatus = (memberId, status) => {
    setTeamStatus((prev) => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        status,
        checkinTime: new Date().toLocaleTimeString(),
      },
    }));
  };

  // Notify Crisis Team
  const notifyCrisisTeam = () => {
    const teamWithEmails =
      crisisPlan && crisisPlan.crisisTeam
        ? crisisPlan.crisisTeam.filter(
            (member) =>
              member.email || (member.contact && member.contact.includes("@"))
          )
        : [];

    const emailCount = teamWithEmails.length;
    const totalTeam =
      crisisPlan && crisisPlan.crisisTeam ? crisisPlan.crisisTeam.length : 5;

    addToDecisionLog({
      action: "Crisis Team Email Notification",
      by: "Crisis Response Leader",
      details: `Email alerts sent to ${emailCount} team members`,
      severity: "critical",
    });

    if (emailCount > 0) {
      addNotification(
        `Crisis alert emails sent to ${emailCount} team members`,
        "success"
      );

      Object.keys(teamStatus).forEach((memberId) => {
        if (teamStatus[memberId].status === "pending") {
          setTeamStatus((prev) => ({
            ...prev,
            [memberId]: {
              ...prev[memberId],
              notified: true,
              notificationTime: new Date().toLocaleTimeString(),
            },
          }));
        }
      });
    } else {
      addNotification(
        `No email contacts available. ${totalTeam} team members need contact info`,
        "warning"
      );
    }
  };

  // Activate Crisis Mode
  const activateCrisisMode = () => {
    setCrisisStatus("active");
    setActiveAlert(true);
    setShowScenarioModal(true);
    setCrisisStartTime(new Date());

    const teamMembers =
      crisisPlan && crisisPlan.crisisTeam
        ? crisisPlan.crisisTeam.map((member, index) => ({
            id: index + 1,
            name: member.name || member.role,
            role: member.role,
            title: member.title,
            status: "pending",
          }))
        : [
            {
              id: 1,
              name: "Crisis Response Leader",
              role: "CEO",
              status: "pending",
            },
            {
              id: 2,
              name: "Communications Director",
              role: "PR Head",
              status: "pending",
            },
            {
              id: 3,
              name: "Operations Manager",
              role: "COO",
              status: "pending",
            },
            {
              id: 4,
              name: "Legal Counsel",
              role: "General Counsel",
              status: "pending",
            },
            { id: 5, name: "HR Lead", role: "CHRO", status: "pending" },
          ];

    const statusMap = {};
    teamMembers.forEach((member) => {
      statusMap[member.id] = member;
    });
    setTeamStatus(statusMap);

    // Initialize active crisis data
    const crisisData = {
      id: Date.now(),
      startTime: new Date(),
      status: "active",
      scenario: null,
      teamStatus: statusMap,
      tasks: [],
      decisionLog: [],
      communications: [],
      projectId: selectedProject?.id,
    };
    setActiveCrisisData(crisisData);

    addToDecisionLog({
      action: "Crisis Mode Activated",
      by: "System Administrator",
      reason: "Manual activation via command center",
      severity: "critical",
    });

    addNotification("Crisis Mode Activated - All teams notified", "error");
  };

  // Select Crisis Scenario
  const selectCrisisScenario = (scenario) => {
    setSelectedScenario(scenario);
    setShowScenarioModal(false);
    setDraftedResponses({});
    setCommunicationStatus({});

    // Update active crisis data
    if (activeCrisisData) {
      setActiveCrisisData((prev) => ({
        ...prev,
        scenario: scenario,
      }));
    }

    generateCrisisTasks(scenario);

    addToDecisionLog({
      action: "Crisis Scenario Selected",
      by: "Crisis Response Leader",
      details: scenario.title,
      severity: scenario.impact.toLowerCase(),
    });

    setActiveView("war-room");
    addNotification(`Active Scenario: ${scenario.title}`, "warning");
  };

  // Generate Crisis Tasks
  const generateCrisisTasks = (scenario) => {
    const baseTasks = [];

    const getTeamMemberName = (role) => {
      if (crisisPlan && crisisPlan.crisisTeam) {
        const member = crisisPlan.crisisTeam.find((m) => m.role.includes(role));
        return member && member.name ? member.name : role;
      }
      return role;
    };

    baseTasks.push(
      {
        id: 1,
        task: "Detection & Initial Assessment - Identify crisis severity and potential impact",
        assignee: getTeamMemberName("Crisis Response Leader"),
        priority: "critical",
        status: "pending",
        section: "Response Process",
      },
      {
        id: 2,
        task: "Crisis Team Activation - Alert all team members and convene emergency meeting",
        assignee: getTeamMemberName("Crisis Response Leader"),
        priority: "critical",
        status: "pending",
        section: "Response Process",
      },
      {
        id: 3,
        task: "Situation Analysis - Gather information and identify affected stakeholders",
        assignee: getTeamMemberName("Operations Manager"),
        priority: "critical",
        status: "pending",
        section: "Response Process",
      },
      {
        id: 4,
        task: "Response Strategy Development - Create comprehensive response plan",
        assignee: getTeamMemberName("Crisis Response Leader"),
        priority: "high",
        status: "pending",
        section: "Response Process",
      },
      {
        id: 5,
        task: "Implementation & Communication - Execute plan and initiate communications",
        assignee: getTeamMemberName("Communications Director"),
        priority: "high",
        status: "pending",
        section: "Response Process",
      }
    );

    if (scenario.impact === "Critical") {
      baseTasks.push({
        id: 6,
        task: `Critical Impact Response: ${scenario.title} - Activate highest-level protocols`,
        assignee: getTeamMemberName("Operations Manager"),
        priority: "critical",
        status: "pending",
        section: "Scenario Response",
      });
    }

    if (crisisPlan && crisisPlan.stakeholders) {
      const highImpactStakeholders = crisisPlan.stakeholders.filter(
        (s) => s.impactLevel === "High"
      );
      highImpactStakeholders.slice(0, 3).forEach((stakeholder, index) => {
        baseTasks.push({
          id: baseTasks.length + 1,
          task: `Assess impact on ${stakeholder.name} - Address: ${stakeholder.concerns[0]}`,
          assignee: stakeholder.name.includes("Employee")
            ? getTeamMemberName("Human Resources Lead")
            : stakeholder.name.includes("Customer")
            ? getTeamMemberName("Communications Director")
            : getTeamMemberName("Crisis Response Leader"),
          priority: "high",
          status: "pending",
          section: "Stakeholder Impact",
        });
      });
    }

    setTasks(baseTasks);

    // Update active crisis data
    if (activeCrisisData) {
      setActiveCrisisData((prev) => ({
        ...prev,
        tasks: baseTasks,
      }));
    }
  };

  // Deactivate Crisis Mode
  const deactivateCrisisMode = () => {
    // Save final crisis data to MemoryVault before deactivating
    if (activeCrisisData) {
      const finalCrisisData = {
        ...activeCrisisData,
        endTime: new Date(),
        duration: elapsedTime,
        status: "resolved",
        finalDecisionLog: decisionLog,
        finalCommunications: Object.entries(draftedResponses).map(
          ([stakeholder, data]) => ({
            stakeholder,
            content: data.content,
            status: communicationStatus[stakeholder] || "drafted",
            timestamp: data.timestamp,
          })
        ),
      };

      // This will be handled by the SaveToMemoryVaultButton
      setActiveCrisisData(finalCrisisData);
    }

    setCrisisStatus("monitoring");
    setActiveAlert(false);
    setSelectedScenario(null);
    setCrisisStartTime(null);
    setCommunicationStatus({});
    setDraftedResponses({});

    addToDecisionLog({
      action: "Crisis Mode Deactivated",
      by: "Crisis Response Leader",
      details: `Crisis resolved after ${elapsedTime}`,
      severity: "info",
    });

    addNotification(
      "Crisis Mode Deactivated - Returning to normal operations",
      "success"
    );
    setActiveView("dashboard");
  };

  // Enhanced AI Chat Handler with Claude
  const handleAIChat = async () => {
    if (!chatInput.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: "user",
      content: chatInput,
      timestamp: new Date().toLocaleTimeString(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput("");
    setIsAIResponding(true);

    try {
      const response = await api.crisisAdvisor({
        query: chatInput,
        context: {
          scenario: selectedScenario,
          crisisStatus: crisisStatus,
          elapsedTime: elapsedTime,
          projectName: selectedProject?.name,
          industry: crisisPlan?.industry,
          hasCrisisPlan: !!crisisPlan,
        },
      });

      if (response.success) {
        let aiContent = response.advice;

        if (response.detectedCrisisType) {
          aiContent = `🚨 **Detected Crisis Type: ${response.detectedCrisisName}**\n\n${aiContent}`;
        }

        if (response.immediateActions && !response.hasCrisisPlan) {
          aiContent = `${aiContent}\n\n💡 **Note:** You don't have a crisis plan yet. Consider creating one after addressing the immediate situation.`;
        }

        if (response.hasCrisisPlan && response.planSummary) {
          const summary = response.planSummary;
          aiContent = `✅ Using your ${summary.industry} crisis plan (${summary.teamMembersAssigned}/${summary.scenarioCount} team members assigned)\n\n${aiContent}`;
        }

        const aiMessage = {
          id: Date.now() + 1,
          type: "ai",
          content: aiContent,
          timestamp: new Date().toLocaleTimeString(),
          detectedCrisisType: response.detectedCrisisType,
          immediateActions: response.immediateActions,
        };

        setChatMessages((prev) => [...prev, aiMessage]);

        if (response.detectedCrisisType) {
          addNotification(
            `Crisis type detected: ${response.detectedCrisisName}`,
            "warning"
          );
        }
      } else {
        throw new Error(response.error || "Failed to get AI advice");
      }
    } catch (error) {
      console.error("Crisis advisor error:", error);

      const errorMessage = {
        id: Date.now() + 1,
        type: "ai",
        content:
          "I apologize, but I encountered an error. Please try again or ensure you have an active connection.",
        isError: true,
        timestamp: new Date().toLocaleTimeString(),
      };

      setChatMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsAIResponding(false);
    }
  };

  // Enhanced Crisis Plan Generation with Claude
  const generateCrisisPlan = async () => {
    const planData = showEnhancedForm ? crisisPlanForm : { industry };

    if (!planData.industry) {
      setError("Please enter your industry");
      return;
    }

    setError(null);
    setLoading(true);
    setGenerationProgress(0);

    try {
      setGenerationStep("Connecting to crisis planning system...");
      setGenerationProgress(10);

      const requestData = {
        ...planData,
        projectId: selectedProject?.id,
        projectName: selectedProject?.name,
        projectIndustry: selectedProject?.industry,
      };

      const response = await api.generateCrisisPlan(requestData);
      console.log("Crisis plan response:", response);
      console.log(
        "Plan data keys:",
        response?.plan?.plan_data
          ? Object.keys(response.plan.plan_data)
          : "No plan data"
      );
      if (response && response.plan && response.plan.plan_data) {
        const planData = response.plan.plan_data;

        setGenerationProgress(90);
        setGenerationStep("Finalizing crisis plan...");

        setCrisisPlan({
          industry: planData.industry || industry,
          ...planData,
          generatedAt: new Date().toISOString(),
          projectId: selectedProject?.id,
        });

        setGenerationProgress(100);
        setGenerationStep("Crisis plan generated successfully!");

        setTimeout(() => {
          setGenerationProgress(0);
          setGenerationStep("");
          setShowEnhancedForm(false);
        }, 2000);
      } else {
        throw new Error("Invalid response format from API");
      }
    } catch (error) {
      console.error("Error generating crisis plan:", error);
      setError("Failed to generate crisis plan. Please try again.");
      setGenerationProgress(0);
      setGenerationStep("");
    } finally {
      setLoading(false);
    }
  };

  // Define which sections have edit functionality
  const editableSections = [
    "objectives",
    "team",
    "scenarios",
    "stakeholders",
    "communication",
  ];

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
        {expandedSections[section] &&
          editingSection !== section &&
          editableSections.includes(section) && (
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
        {expandedSections[section] ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </div>
    </div>
  );

  const StatusIndicator = () => {
    const statusConfig = {
      monitoring: {
        color: "green",
        icon: CheckCircle,
        text: "Normal Operations",
      },
      alert: { color: "yellow", icon: AlertCircle, text: "Alert Status" },
      active: { color: "red", icon: XCircle, text: "Crisis Active" },
    };

    const config = statusConfig[crisisStatus];
    const Icon = config.icon;

    return (
      <div
        className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
          crisisStatus === "monitoring"
            ? "bg-green-100 border-green-300"
            : crisisStatus === "alert"
            ? "bg-yellow-100 border-yellow-300"
            : "bg-red-100 border-red-300"
        } border`}
      >
        <Icon
          className={`w-5 h-5 ${
            crisisStatus === "monitoring"
              ? "text-green-600"
              : crisisStatus === "alert"
              ? "text-yellow-600"
              : "text-red-600"
          }`}
        />
        <span
          className={`font-semibold ${
            crisisStatus === "monitoring"
              ? "text-green-800"
              : crisisStatus === "alert"
              ? "text-yellow-800"
              : "text-red-800"
          }`}
        >
          {config.text}
        </span>
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
                <h1 className="text-2xl font-bold text-gray-900">
                  Crisis Command Center
                </h1>
              </div>
              {selectedProject && (
                <div className="text-sm text-gray-600">
                  {selectedProject.name} -{" "}
                  {selectedProject.industry || "General"}
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
              {crisisStatus === "active" && (
                <div className="flex items-center gap-2 px-3 py-1 bg-red-50 rounded-lg">
                  <Timer className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-mono text-red-800">
                    {elapsedTime}
                  </span>
                </div>
              )}
              <StatusIndicator />
              <div className="relative">
                <Bell
                  className={`w-6 h-6 ${
                    activeAlert ? "text-red-600 animate-pulse" : "text-gray-600"
                  }`}
                />
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
              onClick={() => setActiveView("dashboard")}
              className={`py-3 px-4 border-b-2 transition-colors ${
                activeView === "dashboard"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-800"
              }`}
            >
              Dashboard
            </button>
            {crisisStatus === "active" && (
              <button
                onClick={() => setActiveView("war-room")}
                className={`py-3 px-4 border-b-2 transition-colors relative ${
                  activeView === "war-room"
                    ? "border-red-600 text-red-600"
                    : "border-transparent text-gray-600 hover:text-gray-800"
                }`}
              >
                Crisis War Room
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
              </button>
            )}
            <button
              onClick={() => setActiveView("plan")}
              className={`py-3 px-4 border-b-2 transition-colors ${
                activeView === "plan"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-800"
              }`}
            >
              Crisis Plan
            </button>
            <button
              onClick={() => setActiveView("advisor")}
              className={`py-3 px-4 border-b-2 transition-colors relative ${
                activeView === "advisor"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-800"
              }`}
            >
              AI Advisor
              {activeAlert && activeView !== "advisor" && (
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
                <h2 className="text-lg font-bold text-gray-900">
                  Select Active Crisis Scenario
                </h2>
                <p className="text-xs text-gray-600 mt-0.5">
                  Choose the scenario that best matches the current crisis
                  situation
                </p>
              </div>

              <div className="flex-1 overflow-y-auto p-3">
                {/* Industry-Specific Scenarios */}
                <div className="mb-3">
                  <h3 className="font-semibold text-gray-700 mb-1.5 text-xs uppercase tracking-wider">
                    Industry-Specific
                  </h3>
                  <div className="space-y-1.5">
                    {crisisPlan.scenarios
                      .filter((s) => !s.isUniversal)
                      .map((scenario, index) => (
                        <button
                          key={`industry-${index}`}
                          onClick={() => selectCrisisScenario(scenario)}
                          className="w-full text-left p-2.5 border rounded hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <h3 className="font-medium text-gray-800 text-sm flex-1 pr-2">
                              {scenario.title}
                            </h3>
                            <div className="flex gap-1 flex-shrink-0">
                              <span
                                className={`px-1 py-0.5 text-xs rounded ${
                                  scenario.likelihood === "High"
                                    ? "bg-red-100 text-red-700"
                                    : scenario.likelihood === "Medium"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-green-100 text-green-700"
                                }`}
                              >
                                {scenario.likelihood[0]}
                              </span>
                              <span
                                className={`px-1 py-0.5 text-xs rounded ${
                                  scenario.impact === "Critical"
                                    ? "bg-red-100 text-red-700"
                                    : scenario.impact === "Major"
                                    ? "bg-orange-100 text-orange-700"
                                    : scenario.impact === "Moderate"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-green-100 text-green-700"
                                }`}
                              >
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
                  <h3 className="font-semibold text-gray-700 mb-1.5 text-xs uppercase tracking-wider">
                    Universal
                  </h3>
                  <div className="space-y-1.5">
                    {crisisPlan.scenarios
                      .filter((s) => s.isUniversal)
                      .map((scenario, index) => (
                        <button
                          key={`universal-${index}`}
                          onClick={() => selectCrisisScenario(scenario)}
                          className="w-full text-left p-2.5 border border-blue-200 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <h3 className="font-medium text-gray-800 text-sm flex-1 pr-2">
                              {scenario.title}
                            </h3>
                            <div className="flex gap-1 flex-shrink-0">
                              <span
                                className={`px-1 py-0.5 text-xs rounded ${
                                  scenario.likelihood === "High"
                                    ? "bg-red-100 text-red-700"
                                    : scenario.likelihood === "Medium"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-green-100 text-green-700"
                                }`}
                              >
                                {scenario.likelihood[0]}
                              </span>
                              <span
                                className={`px-1 py-0.5 text-xs rounded ${
                                  scenario.impact === "Critical"
                                    ? "bg-red-100 text-red-700"
                                    : scenario.impact === "Major"
                                    ? "bg-orange-100 text-orange-700"
                                    : scenario.impact === "Moderate"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-green-100 text-green-700"
                                }`}
                              >
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
        {activeView === "dashboard" && (
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={activateCrisisMode}
                  disabled={crisisStatus === "active" || !crisisPlan}
                  className="p-4 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                  <p className="font-semibold text-red-800">
                    Activate Crisis Mode
                  </p>
                  {!crisisPlan && (
                    <p className="text-xs text-red-600 mt-1">
                      Create a plan first
                    </p>
                  )}
                </button>

                <button
                  onClick={() => setActiveView("plan")}
                  className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <FileText className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="font-semibold text-blue-800">
                    {crisisPlan ? "View Crisis Plan" : "Create Crisis Plan"}
                  </p>
                  {!crisisPlan && (
                    <p className="text-xs text-blue-600 mt-1">
                      Get started here
                    </p>
                  )}
                </button>

                <button
                  onClick={() => setActiveView("advisor")}
                  className="p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  <Bot className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <p className="font-semibold text-purple-800">
                    Consult AI Advisor
                  </p>
                  {!crisisPlan && (
                    <p className="text-xs text-purple-600 mt-1">
                      Get crisis guidance
                    </p>
                  )}
                </button>
              </div>
            </div>

            {/* Status Overview */}
            {crisisPlan && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">
                    Crisis Readiness Status
                  </h2>
                  <SaveToMemoryVaultButton
                    content={JSON.stringify(crisisPlan, null, 2)}
                    title={`Crisis Management Plan - ${crisisPlan.industry}`}
                    type="crisis-plan"
                    source="crisis-command-center"
                    folder_type="crisis-management"
                    tags={["crisis-plan", crisisPlan.industry, "management"]}
                    metadata={{
                      generated_at: crisisPlan.generatedAt,
                      project_id: selectedProject?.id,
                      industry: crisisPlan.industry,
                      team_members: crisisPlan.crisisTeam?.length || 0,
                      scenarios: crisisPlan.scenarios?.length || 0,
                    }}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-green-800 mb-2">
                      Plan Status
                    </h3>
                    <p className="text-2xl font-bold text-green-600">Active</p>
                    <p className="text-sm text-green-700 mt-1">
                      Last updated: {new Date().toLocaleDateString()}
                    </p>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-800 mb-2">
                      Team Members
                    </h3>
                    <p className="text-2xl font-bold text-blue-600">
                      {crisisPlan.crisisTeam
                        ? crisisPlan.crisisTeam.filter((m) => m.name).length
                        : 0}
                      /
                      {crisisPlan.crisisTeam ? crisisPlan.crisisTeam.length : 5}
                    </p>
                    <p className="text-sm text-blue-700 mt-1">
                      Positions assigned
                    </p>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-purple-800 mb-2">
                      Scenarios
                    </h3>
                    <p className="text-2xl font-bold text-purple-600">
                      {crisisPlan.scenarios ? crisisPlan.scenarios.length : 0}
                    </p>
                    <p className="text-sm text-purple-700 mt-1">
                      Crisis scenarios mapped
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Activity & Active Crisis Archive */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Notifications */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Recent Notifications
                </h2>
                {notifications.length > 0 ? (
                  <div className="space-y-2">
                    {notifications.slice(0, 5).map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-3 rounded-lg flex items-center justify-between ${
                          notif.type === "error"
                            ? "bg-red-50 text-red-800"
                            : notif.type === "warning"
                            ? "bg-yellow-50 text-yellow-800"
                            : notif.type === "success"
                            ? "bg-green-50 text-green-800"
                            : "bg-gray-50 text-gray-800"
                        }`}
                      >
                        <span className="text-sm">{notif.message}</span>
                        <span className="text-xs opacity-70">
                          {notif.timestamp}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    No recent notifications
                  </p>
                )}
              </div>

              {/* Active Crisis Documentation */}
              {activeCrisisData && crisisStatus === "active" && (
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">
                      Active Crisis Documentation
                    </h2>
                    <SaveToMemoryVaultButton
                      content={JSON.stringify(activeCrisisData, null, 2)}
                      title={`Active Crisis - ${
                        selectedScenario?.title || "Crisis Response"
                      }`}
                      type="crisis-response"
                      source="crisis-command-center"
                      folder_type="crisis-management"
                      tags={[
                        "active-crisis",
                        "response",
                        selectedScenario?.title || "crisis",
                      ]}
                      metadata={{
                        crisis_start: activeCrisisData.startTime,
                        project_id: selectedProject?.id,
                        scenario: selectedScenario?.title,
                        status: crisisStatus,
                        elapsed_time: elapsedTime,
                      }}
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="bg-red-50 p-3 rounded">
                      <p className="text-sm font-semibold text-red-800">
                        Crisis Started:{" "}
                        {new Date(activeCrisisData.startTime).toLocaleString()}
                      </p>
                      <p className="text-xs text-red-600 mt-1">
                        Duration: {elapsedTime}
                      </p>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>Decision Log Entries: {decisionLog.length}</p>
                      <p>
                        Communications Drafted:{" "}
                        {Object.keys(draftedResponses).length}
                      </p>
                      <p>Tasks Created: {tasks.length}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Getting Started Guide - Only show if no plan exists */}
            {!crisisPlan && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h2 className="text-xl font-bold text-blue-900 mb-4">
                  Getting Started with Crisis Management
                </h2>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm font-bold">
                      1
                    </div>
                    <div>
                      <p className="font-semibold text-blue-900">
                        Create Your Crisis Plan
                      </p>
                      <p className="text-sm text-blue-700">
                        Click "Create Crisis Plan" above to generate an
                        industry-specific crisis management plan
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm font-bold">
                      2
                    </div>
                    <div>
                      <p className="font-semibold text-blue-900">
                        Customize Your Plan
                      </p>
                      <p className="text-sm text-blue-700">
                        Edit team members, scenarios, and communication
                        strategies to match your organization
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm font-bold">
                      3
                    </div>
                    <div>
                      <p className="font-semibold text-blue-900">
                        Test Your Readiness
                      </p>
                      <p className="text-sm text-blue-700">
                        Use the AI Advisor to practice scenarios and activate
                        Crisis Mode for real emergencies
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Crisis War Room View */}
        {activeView === "war-room" && crisisStatus === "active" && (
          <div className="space-y-6">
            {/* Crisis Header */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-red-800">
                    Crisis War Room
                  </h2>
                  {selectedScenario && (
                    <p className="text-red-600 mt-1">
                      Active Scenario: {selectedScenario.title}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  {crisisPlan && (
                    <div className="text-sm">
                      <span className="text-gray-600">Communications: </span>
                      <span className="font-semibold text-gray-800">
                        {
                          Object.keys(communicationStatus).filter(
                            (k) => communicationStatus[k] === "sent"
                          ).length
                        }{" "}
                        sent, {Object.keys(draftedResponses).length} drafted
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Team Status */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Team Status
                </h3>
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {Object.values(teamStatus).map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded"
                    >
                      <div>
                        <p className="font-medium text-sm">{member.name}</p>
                        <p className="text-xs text-gray-600">
                          {member.role}
                          {member.title && member.name !== member.role
                            ? ` - ${member.title}`
                            : ""}
                        </p>
                        {member.notified && (
                          <p className="text-xs text-blue-600 mt-0.5">
                            ✉️ Notified at {member.notificationTime}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {member.status === "active" ? (
                          <span className="flex items-center gap-1 text-xs text-green-600">
                            <CheckCircle className="w-3 h-3" />
                            <span>{member.checkinTime}</span>
                          </span>
                        ) : (
                          <button
                            onClick={() =>
                              updateTeamMemberStatus(member.id, "active")
                            }
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
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className={`p-3 rounded-lg ${
                        task.priority === "critical"
                          ? "bg-red-50"
                          : "bg-yellow-50"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{task.task}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <p className="text-xs text-gray-600">
                              Assigned: {task.assignee}
                            </p>
                            <p className="text-xs text-gray-500">
                              From: {task.section}
                            </p>
                          </div>
                        </div>
                        <select
                          value={task.status}
                          onChange={(e) =>
                            updateTaskStatus(task.id, e.target.value)
                          }
                          className="text-xs px-2 py-1 border rounded"
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

              {/* Stakeholder Communications */}
              <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-blue-600" />
                  Stakeholder Communications
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto">
                  {crisisPlan && crisisPlan.communicationPlans ? (
                    crisisPlan.communicationPlans.map((plan, index) => (
                      <div key={index} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-800">
                              {plan.stakeholder}
                            </h4>
                            <p className="text-xs text-gray-600 mt-1">
                              {plan.timing}
                            </p>
                          </div>
                          {communicationStatus[plan.stakeholder] === "sent" ? (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                              ✓ Sent
                            </span>
                          ) : draftedResponses[plan.stakeholder] ? (
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                              ✓ Drafted
                            </span>
                          ) : (
                            <button
                              onClick={() =>
                                draftResponse(plan.stakeholder, plan)
                              }
                              disabled={draftingFor === plan.stakeholder}
                              className="text-xs px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                            >
                              {draftingFor === plan.stakeholder ? (
                                <span className="flex items-center gap-1">
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  Drafting...
                                </span>
                              ) : (
                                "Draft Response"
                              )}
                            </button>
                          )}
                        </div>
                        <div className="space-y-2 text-xs">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <p className="font-medium text-gray-700">
                                Primary Channel:
                              </p>
                              <p className="text-gray-600">
                                {plan.primaryChannel}
                              </p>
                            </div>
                            <div>
                              <p className="font-medium text-gray-700">
                                Spokesperson:
                              </p>
                              <p className="text-gray-600">
                                {plan.spokesperson}
                              </p>
                            </div>
                          </div>
                          <div>
                            <p className="font-medium text-gray-700">
                              Key Messages:
                            </p>
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
                              <p className="text-sm text-purple-700">
                                Drafting response based on key messages...
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Show drafted response if available */}
                        {draftedResponses[plan.stakeholder] &&
                          draftingFor !== plan.stakeholder && (
                            <div className="mt-3 p-3 bg-purple-50 rounded border border-purple-200">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-semibold text-purple-800">
                                  Drafted Response:
                                </p>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-purple-600">
                                    {
                                      draftedResponses[plan.stakeholder]
                                        .timestamp
                                    }
                                  </span>
                                  <SaveToMemoryVaultButton
                                    content={
                                      draftedResponses[plan.stakeholder].content
                                    }
                                    title={`Crisis Response - ${plan.stakeholder}`}
                                    type="stakeholder-communication"
                                    source="crisis-command-center"
                                    folder_type="crisis-management"
                                    tags={[
                                      "crisis-response",
                                      "communication",
                                      plan.stakeholder,
                                    ]}
                                    metadata={{
                                      stakeholder: plan.stakeholder,
                                      scenario: selectedScenario?.title,
                                      drafted_at:
                                        draftedResponses[plan.stakeholder]
                                          .timestamp,
                                      project_id: selectedProject?.id,
                                      channel: plan.primaryChannel,
                                      spokesperson: plan.spokesperson,
                                    }}
                                    buttonSize="small"
                                  />
                                </div>
                              </div>
                              <div className="bg-white p-3 rounded border border-purple-100 mb-2 max-h-48 overflow-y-auto">
                                <p className="text-xs text-gray-700 whitespace-pre-wrap">
                                  {draftedResponses[plan.stakeholder].content}
                                </p>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(
                                      draftedResponses[plan.stakeholder].content
                                    );
                                    addNotification(
                                      "Response copied to clipboard",
                                      "success"
                                    );
                                  }}
                                  className="text-xs px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
                                >
                                  Copy to Clipboard
                                </button>
                                <button
                                  onClick={() =>
                                    sendCommunication(plan.stakeholder)
                                  }
                                  className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                                >
                                  Mark as Sent
                                </button>
                                <button
                                  onClick={() =>
                                    draftResponse(plan.stakeholder, plan)
                                  }
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
                    <p className="text-gray-500 text-center py-4">
                      No communication plans available
                    </p>
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
                    <div
                      key={entry.id}
                      className="p-2 bg-gray-50 rounded text-sm"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{entry.action}</p>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            entry.severity === "critical"
                              ? "bg-red-100 text-red-700"
                              : entry.severity === "warning"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {entry.severity}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">By: {entry.by}</p>
                      {entry.details && (
                        <p className="text-xs text-gray-600 mt-1">
                          {entry.details}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        {new Date(entry.timestamp).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Crisis Plan View */}
        {activeView === "plan" && (
          <div className="space-y-6">
            {console.log("Current crisis plan state:", crisisPlan)}
            {console.log(
              "Crisis plan sections available:",
              crisisPlan ? Object.keys(crisisPlan) : "No plan"
            )}

            {!crisisPlan ? (
              // Show plan generation when no plan exists
              <div className="bg-white rounded-lg shadow-lg p-8">
                <div className="max-w-2xl mx-auto">
                  <div className="text-center mb-8">
                    <Shield className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      Create Your Crisis Management Plan
                    </h2>
                    <p className="text-gray-600">
                      Generate a comprehensive crisis management plan tailored
                      to your industry. This AI-powered plan will include
                      scenarios, team structures, and communication strategies.
                    </p>
                  </div>

                  {!showEnhancedForm ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Your Industry
                        </label>
                        <input
                          type="text"
                          value={industry}
                          onChange={(e) => setIndustry(e.target.value)}
                          placeholder="Enter your industry (e.g., healthcare, finance, retail, technology)"
                          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          onKeyPress={(e) =>
                            e.key === "Enter" && generateCrisisPlan()
                          }
                          disabled={loading}
                        />
                        <p className="mt-2 text-sm text-gray-500">
                          Be specific for better results (e.g., "healthcare
                          technology" instead of just "tech")
                        </p>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={generateCrisisPlan}
                          disabled={loading || !industry}
                          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium"
                        >
                          {loading
                            ? "Generating Your Crisis Plan..."
                            : "Generate Crisis Plan"}
                        </button>
                        <button
                          onClick={() => setShowEnhancedForm(true)}
                          disabled={loading}
                          className="px-6 py-3 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                        >
                          <Plus className="w-4 h-4 inline mr-2" />
                          Advanced Options
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Enhanced Form
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Industry *
                        </label>
                        <input
                          type="text"
                          value={crisisPlanForm.industry}
                          onChange={(e) =>
                            setCrisisPlanForm({
                              ...crisisPlanForm,
                              industry: e.target.value,
                            })
                          }
                          placeholder="e.g., Healthcare Technology"
                          className="w-full px-4 py-2 border rounded-md"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Company Size
                        </label>
                        <select
                          value={crisisPlanForm.companySize}
                          onChange={(e) =>
                            setCrisisPlanForm({
                              ...crisisPlanForm,
                              companySize: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 border rounded-md"
                        >
                          <option value="">Select size</option>
                          <option value="startup">
                            Startup (1-50 employees)
                          </option>
                          <option value="small">
                            Small (51-200 employees)
                          </option>
                          <option value="medium">
                            Medium (201-1000 employees)
                          </option>
                          <option value="large">Large (1000+ employees)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Crisis Team Members
                        </label>
                        <div className="space-y-2">
                          {crisisPlanForm.teamMembers.map((member, index) => (
                            <div key={index} className="flex gap-2">
                              <input
                                type="text"
                                value={member.name}
                                onChange={(e) => {
                                  const newMembers = [
                                    ...crisisPlanForm.teamMembers,
                                  ];
                                  newMembers[index].name = e.target.value;
                                  setCrisisPlanForm({
                                    ...crisisPlanForm,
                                    teamMembers: newMembers,
                                  });
                                }}
                                placeholder="Name"
                                className="flex-1 px-3 py-2 border rounded"
                              />
                              <input
                                type="text"
                                value={member.role}
                                onChange={(e) => {
                                  const newMembers = [
                                    ...crisisPlanForm.teamMembers,
                                  ];
                                  newMembers[index].role = e.target.value;
                                  setCrisisPlanForm({
                                    ...crisisPlanForm,
                                    teamMembers: newMembers,
                                  });
                                }}
                                placeholder="Role"
                                className="flex-1 px-3 py-2 border rounded"
                              />
                              <input
                                type="text"
                                value={member.contact}
                                onChange={(e) => {
                                  const newMembers = [
                                    ...crisisPlanForm.teamMembers,
                                  ];
                                  newMembers[index].contact = e.target.value;
                                  setCrisisPlanForm({
                                    ...crisisPlanForm,
                                    teamMembers: newMembers,
                                  });
                                }}
                                placeholder="Contact"
                                className="flex-1 px-3 py-2 border rounded"
                              />
                              <button
                                onClick={() => {
                                  const newMembers =
                                    crisisPlanForm.teamMembers.filter(
                                      (_, i) => i !== index
                                    );
                                  setCrisisPlanForm({
                                    ...crisisPlanForm,
                                    teamMembers: newMembers,
                                  });
                                }}
                                className="px-3 py-2 text-red-600 hover:bg-red-50 rounded"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() => {
                              setCrisisPlanForm({
                                ...crisisPlanForm,
                                teamMembers: [
                                  ...crisisPlanForm.teamMembers,
                                  { name: "", role: "", contact: "" },
                                ],
                              });
                            }}
                            className="w-full py-2 border-2 border-dashed border-gray-300 rounded text-gray-600 hover:border-gray-400"
                          >
                            + Add Team Member
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Key Concerns
                        </label>
                        <div className="space-y-2">
                          {crisisPlanForm.keyConcerns.map((concern, index) => (
                            <div key={index} className="flex gap-2">
                              <input
                                type="text"
                                value={concern}
                                onChange={(e) => {
                                  const newConcerns = [
                                    ...crisisPlanForm.keyConcerns,
                                  ];
                                  newConcerns[index] = e.target.value;
                                  setCrisisPlanForm({
                                    ...crisisPlanForm,
                                    keyConcerns: newConcerns,
                                  });
                                }}
                                placeholder="e.g., Data breach, Product recall"
                                className="flex-1 px-3 py-2 border rounded"
                              />
                              <button
                                onClick={() => {
                                  const newConcerns =
                                    crisisPlanForm.keyConcerns.filter(
                                      (_, i) => i !== index
                                    );
                                  setCrisisPlanForm({
                                    ...crisisPlanForm,
                                    keyConcerns: newConcerns,
                                  });
                                }}
                                className="px-3 py-2 text-red-600 hover:bg-red-50 rounded"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() => {
                              setCrisisPlanForm({
                                ...crisisPlanForm,
                                keyConcerns: [
                                  ...crisisPlanForm.keyConcerns,
                                  "",
                                ],
                              });
                            }}
                            className="w-full py-2 border-2 border-dashed border-gray-300 rounded text-gray-600 hover:border-gray-400"
                          >
                            + Add Concern
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Existing Protocols
                        </label>
                        <textarea
                          value={crisisPlanForm.existingProtocols}
                          onChange={(e) =>
                            setCrisisPlanForm({
                              ...crisisPlanForm,
                              existingProtocols: e.target.value,
                            })
                          }
                          placeholder="Describe any existing crisis management protocols..."
                          className="w-full px-4 py-2 border rounded-md"
                          rows="3"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Additional Context
                        </label>
                        <textarea
                          value={crisisPlanForm.additionalContext}
                          onChange={(e) =>
                            setCrisisPlanForm({
                              ...crisisPlanForm,
                              additionalContext: e.target.value,
                            })
                          }
                          placeholder="Any other relevant information..."
                          className="w-full px-4 py-2 border rounded-md"
                          rows="3"
                        />
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={generateCrisisPlan}
                          disabled={loading || !crisisPlanForm.industry}
                          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium"
                        >
                          {loading
                            ? "Generating Enhanced Plan..."
                            : "Generate Enhanced Crisis Plan"}
                        </button>
                        <button
                          onClick={() => setShowEnhancedForm(false)}
                          disabled={loading}
                          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                        >
                          Back to Simple
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Progress Bar */}
                  {loading && (
                    <div className="mt-8">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          {generationStep}
                        </span>
                        <span className="text-sm font-medium text-gray-700">
                          {generationProgress}%
                        </span>
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
                        {generationProgress < 33 &&
                          "📊 Analyzing industry-specific risks..."}
                        {generationProgress >= 33 &&
                          generationProgress < 66 &&
                          "👥 Mapping stakeholder relationships..."}
                        {generationProgress >= 66 &&
                          generationProgress < 90 &&
                          "📝 Developing communication strategies..."}
                        {generationProgress >= 90 &&
                          "✅ Finalizing your crisis management plan..."}
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
                      {error}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Show the existing crisis plan
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="bg-blue-600 text-white p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-2xl font-bold">
                        Crisis Management Plan
                      </h1>
                      <p className="text-blue-100 mt-2">
                        {crisisPlan.industry
                          ? crisisPlan.industry.charAt(0).toUpperCase() +
                            crisisPlan.industry.slice(1)
                          : "Unknown"}{" "}
                        Industry
                      </p>
                      <p className="text-sm text-blue-100 mt-1">
                        Generated on{" "}
                        {crisisPlan.generatedDate ||
                          new Date().toLocaleDateString()}
                      </p>
                    </div>
                    <SaveToMemoryVaultButton
                      content={JSON.stringify(crisisPlan, null, 2)}
                      title={`Crisis Management Plan - ${crisisPlan.industry}`}
                      type="crisis-plan"
                      source="crisis-command-center"
                      folder_type="crisis-management"
                      tags={["crisis-plan", crisisPlan.industry, "complete"]}
                      metadata={{
                        generated_at: crisisPlan.generatedAt,
                        project_id: selectedProject?.id,
                        industry: crisisPlan.industry,
                        team_members: crisisPlan.crisisTeam?.length || 0,
                        scenarios: crisisPlan.scenarios?.length || 0,
                      }}
                    />
                  </div>
                </div>

                {/* Crisis Plan Sections */}
                <div className="divide-y divide-gray-200">
                  {/* Objectives Section */}
                  <div>
                    <SectionHeader
                      icon={Target}
                      title="Crisis Management Objectives"
                      section="objectives"
                    />
                    {expandedSections.objectives && (
                      <div className="p-6">
                        {editingSection === "objectives" ? (
                          <div className="space-y-4">
                            <textarea
                              value={editedPlan.objectives.join("\n")}
                              onChange={(e) =>
                                setEditedPlan({
                                  ...editedPlan,
                                  objectives: e.target.value
                                    .split("\n")
                                    .filter((obj) => obj.trim()),
                                })
                              }
                              className="w-full h-32 px-3 py-2 border rounded-md"
                              placeholder="Enter objectives, one per line"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={saveEditedSection}
                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                              >
                                <Save className="w-4 h-4 inline mr-2" />
                                Save Changes
                              </button>
                              <button
                                onClick={cancelEditing}
                                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <ul className="space-y-2">
                            {crisisPlan.objectives.map((objective, index) => (
                              <li
                                key={index}
                                className="flex items-start gap-3"
                              >
                                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                <span className="text-gray-700">
                                  {objective}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Crisis Team Section */}
                  <div>
                    <SectionHeader
                      icon={Users}
                      title="Crisis Communications Team"
                      section="team"
                    />
                    {expandedSections.team && (
                      <div className="p-6">
                        {editingSection === "team" ? (
                          <div className="space-y-4">
                            {editedPlan.crisisTeam.map((member, index) => (
                              <div
                                key={index}
                                className="p-4 bg-gray-50 rounded-lg"
                              >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Name
                                    </label>
                                    <input
                                      type="text"
                                      value={member.name || ""}
                                      onChange={(e) => {
                                        const updatedTeam = [
                                          ...editedPlan.crisisTeam,
                                        ];
                                        updatedTeam[index].name =
                                          e.target.value;
                                        setEditedPlan({
                                          ...editedPlan,
                                          crisisTeam: updatedTeam,
                                        });
                                      }}
                                      className="w-full px-3 py-2 border rounded-md"
                                      placeholder="Enter team member name"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Email
                                    </label>
                                    <input
                                      type="email"
                                      value={member.email || ""}
                                      onChange={(e) => {
                                        const updatedTeam = [
                                          ...editedPlan.crisisTeam,
                                        ];
                                        updatedTeam[index].email =
                                          e.target.value;
                                        setEditedPlan({
                                          ...editedPlan,
                                          crisisTeam: updatedTeam,
                                        });
                                      }}
                                      className="w-full px-3 py-2 border rounded-md"
                                      placeholder="Enter email address"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Phone
                                    </label>
                                    <input
                                      type="text"
                                      value={member.phone || ""}
                                      onChange={(e) => {
                                        const updatedTeam = [
                                          ...editedPlan.crisisTeam,
                                        ];
                                        updatedTeam[index].phone =
                                          e.target.value;
                                        setEditedPlan({
                                          ...editedPlan,
                                          crisisTeam: updatedTeam,
                                        });
                                      }}
                                      className="w-full px-3 py-2 border rounded-md"
                                      placeholder="Enter phone number"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Alternate Contact
                                    </label>
                                    <input
                                      type="text"
                                      value={member.alternateContact || ""}
                                      onChange={(e) => {
                                        const updatedTeam = [
                                          ...editedPlan.crisisTeam,
                                        ];
                                        updatedTeam[index].alternateContact =
                                          e.target.value;
                                        setEditedPlan({
                                          ...editedPlan,
                                          crisisTeam: updatedTeam,
                                        });
                                      }}
                                      className="w-full px-3 py-2 border rounded-md"
                                      placeholder="Enter alternate contact"
                                    />
                                  </div>
                                </div>
                                <div className="mt-3">
                                  <p className="text-sm font-medium text-gray-700">
                                    {member.role}
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    {member.title}
                                  </p>
                                </div>
                              </div>
                            ))}
                            <div className="flex gap-2">
                              <button
                                onClick={saveEditedSection}
                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                              >
                                <Save className="w-4 h-4 inline mr-2" />
                                Save Changes
                              </button>
                              <button
                                onClick={cancelEditing}
                                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {crisisPlan.crisisTeam &&
                              crisisPlan.crisisTeam.map((member, index) => (
                                <div
                                  key={index}
                                  className="p-4 bg-gray-50 rounded-lg"
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <h4 className="font-semibold text-gray-800">
                                        {member.role}
                                      </h4>
                                      <p className="text-sm text-gray-600 mt-1">
                                        {member.title}
                                      </p>
                                      {member.name && (
                                        <p className="text-sm font-medium text-blue-600 mt-2">
                                          <UserCheck className="w-4 h-4 inline mr-1" />
                                          {member.name}
                                        </p>
                                      )}
                                      <div className="mt-3 space-y-1">
                                        {member.email && (
                                          <p className="text-xs text-gray-600">
                                            <Mail className="w-3 h-3 inline mr-1" />
                                            {member.email}
                                          </p>
                                        )}
                                        {member.phone && (
                                          <p className="text-xs text-gray-600">
                                            <Phone className="w-3 h-3 inline mr-1" />
                                            {member.phone}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="mt-3">
                                    <p className="text-xs font-medium text-gray-700 mb-1">
                                      Key Responsibilities:
                                    </p>
                                    <ul className="text-xs text-gray-600 space-y-1">
                                      {member.responsibilities.map(
                                        (resp, idx) => (
                                          <li
                                            key={idx}
                                            className="flex items-start"
                                          >
                                            <span className="text-blue-600 mr-1">
                                              •
                                            </span>
                                            <span>{resp}</span>
                                          </li>
                                        )
                                      )}
                                    </ul>
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {/* Crisis Response Process Section */}
                  <div>
                    <SectionHeader
                      icon={Activity}
                      title="Crisis Response Process"
                      section="process"
                    />
                    {expandedSections.process && (
                      <div className="p-6">
                        {editingSection === "process" ? (
                          <div className="space-y-4">
                            {/* Edit mode for process */}
                            <div className="space-y-4">
                              {editedPlan.responseProcess.map(
                                (phase, index) => (
                                  <div
                                    key={index}
                                    className="p-4 bg-gray-50 rounded-lg"
                                  >
                                    <input
                                      type="text"
                                      value={phase.phase}
                                      onChange={(e) => {
                                        const updated = [
                                          ...editedPlan.responseProcess,
                                        ];
                                        updated[index].phase = e.target.value;
                                        setEditedPlan({
                                          ...editedPlan,
                                          responseProcess: updated,
                                        });
                                      }}
                                      className="w-full px-3 py-2 border rounded-md mb-2"
                                      placeholder="Phase name"
                                    />
                                    <textarea
                                      value={phase.description}
                                      onChange={(e) => {
                                        const updated = [
                                          ...editedPlan.responseProcess,
                                        ];
                                        updated[index].description =
                                          e.target.value;
                                        setEditedPlan({
                                          ...editedPlan,
                                          responseProcess: updated,
                                        });
                                      }}
                                      className="w-full px-3 py-2 border rounded-md mb-2"
                                      placeholder="Phase description"
                                      rows="2"
                                    />
                                    <textarea
                                      value={phase.actions.join("\n")}
                                      onChange={(e) => {
                                        const updated = [
                                          ...editedPlan.responseProcess,
                                        ];
                                        updated[index].actions = e.target.value
                                          .split("\n")
                                          .filter((a) => a.trim());
                                        setEditedPlan({
                                          ...editedPlan,
                                          responseProcess: updated,
                                        });
                                      }}
                                      className="w-full px-3 py-2 border rounded-md"
                                      placeholder="Actions (one per line)"
                                      rows="3"
                                    />
                                  </div>
                                )
                              )}
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={saveEditedSection}
                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                              >
                                <Save className="w-4 h-4 inline mr-2" />
                                Save Changes
                              </button>
                              <button
                                onClick={cancelEditing}
                                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {crisisPlan.responseProcess &&
                              crisisPlan.responseProcess.map((phase, index) => (
                                <div
                                  key={index}
                                  className="bg-gray-50 p-4 rounded-lg"
                                >
                                  <h4 className="font-semibold text-gray-800 mb-2">
                                    Phase {index + 1}: {phase.phase}
                                  </h4>
                                  <p className="text-sm text-gray-600 mb-3">
                                    {phase.description}
                                  </p>
                                  <div>
                                    <p className="text-sm font-medium text-gray-700 mb-2">
                                      Key Actions:
                                    </p>
                                    <ul className="space-y-1">
                                      {phase.actions.map((action, idx) => (
                                        <li
                                          key={idx}
                                          className="flex items-start gap-2 text-sm text-gray-600"
                                        >
                                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                          <span>{action}</span>
                                        </li>
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

                  {/* Crisis Scenarios Section */}
                  <div>
                    <SectionHeader
                      icon={AlertTriangle}
                      title="Crisis Scenarios"
                      section="scenarios"
                    />
                    {expandedSections.scenarios && (
                      <div className="p-6">
                        {editingSection === "scenarios" ? (
                          <div className="space-y-4">
                            {/* Edit mode */}
                            <div className="flex gap-2">
                              <button
                                onClick={saveEditedSection}
                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                              >
                                <Save className="w-4 h-4 inline mr-2" />
                                Save Changes
                              </button>
                              <button
                                onClick={cancelEditing}
                                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {/* Industry-Specific Scenarios */}
                            <div>
                              <h3 className="font-semibold text-gray-700 mb-3">
                                Industry-Specific Scenarios
                              </h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {crisisPlan.scenarios &&
                                  crisisPlan.scenarios
                                    .filter((s) => !s.isUniversal)
                                    .map((scenario, index) => (
                                      <div
                                        key={index}
                                        className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                                      >
                                        <div className="flex justify-between items-start mb-2">
                                          <h4 className="font-medium text-gray-800">
                                            {scenario.title}
                                          </h4>
                                          <div className="flex gap-2">
                                            <span
                                              className={`px-2 py-1 text-xs rounded ${
                                                scenario.likelihood === "High"
                                                  ? "bg-red-100 text-red-700"
                                                  : scenario.likelihood ===
                                                    "Medium"
                                                  ? "bg-yellow-100 text-yellow-700"
                                                  : "bg-green-100 text-green-700"
                                              }`}
                                            >
                                              {scenario.likelihood}
                                            </span>
                                            <span
                                              className={`px-2 py-1 text-xs rounded ${
                                                scenario.impact === "Critical"
                                                  ? "bg-red-100 text-red-700"
                                                  : scenario.impact === "Major"
                                                  ? "bg-orange-100 text-orange-700"
                                                  : scenario.impact ===
                                                    "Moderate"
                                                  ? "bg-yellow-100 text-yellow-700"
                                                  : "bg-green-100 text-green-700"
                                              }`}
                                            >
                                              {scenario.impact}
                                            </span>
                                          </div>
                                        </div>
                                        <p className="text-sm text-gray-600">
                                          {scenario.description}
                                        </p>
                                      </div>
                                    ))}
                              </div>
                            </div>

                            {/* Universal Scenarios */}
                            <div>
                              <h3 className="font-semibold text-gray-700 mb-3">
                                Universal Scenarios
                              </h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {crisisPlan.scenarios &&
                                  crisisPlan.scenarios
                                    .filter((s) => s.isUniversal)
                                    .map((scenario, index) => (
                                      <div
                                        key={index}
                                        className="border border-blue-200 bg-blue-50 rounded-lg p-4 hover:shadow-md transition-shadow"
                                      >
                                        <div className="flex justify-between items-start mb-2">
                                          <h4 className="font-medium text-gray-800">
                                            {scenario.title}
                                          </h4>
                                          <div className="flex gap-2">
                                            <span
                                              className={`px-2 py-1 text-xs rounded ${
                                                scenario.likelihood === "High"
                                                  ? "bg-red-100 text-red-700"
                                                  : scenario.likelihood ===
                                                    "Medium"
                                                  ? "bg-yellow-100 text-yellow-700"
                                                  : "bg-green-100 text-green-700"
                                              }`}
                                            >
                                              {scenario.likelihood}
                                            </span>
                                            <span
                                              className={`px-2 py-1 text-xs rounded ${
                                                scenario.impact === "Critical"
                                                  ? "bg-red-100 text-red-700"
                                                  : scenario.impact === "Major"
                                                  ? "bg-orange-100 text-orange-700"
                                                  : scenario.impact ===
                                                    "Moderate"
                                                  ? "bg-yellow-100 text-yellow-700"
                                                  : "bg-green-100 text-green-700"
                                              }`}
                                            >
                                              {scenario.impact}
                                            </span>
                                          </div>
                                        </div>
                                        <p className="text-sm text-gray-600">
                                          {scenario.description}
                                        </p>
                                      </div>
                                    ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Key Stakeholders Section */}
                  <div>
                    <SectionHeader
                      icon={Users}
                      title="Key Stakeholders"
                      section="stakeholders"
                    />
                    {expandedSections.stakeholders && (
                      <div className="p-6">
                        {editingSection === "stakeholders" ? (
                          <div className="space-y-4">
                            {/* Edit mode */}
                            <div className="flex gap-2">
                              <button
                                onClick={saveEditedSection}
                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                              >
                                <Save className="w-4 h-4 inline mr-2" />
                                Save Changes
                              </button>
                              <button
                                onClick={cancelEditing}
                                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {crisisPlan.stakeholders &&
                              crisisPlan.stakeholders.map(
                                (stakeholder, index) => (
                                  <div
                                    key={index}
                                    className="border rounded-lg p-4"
                                  >
                                    <div className="flex justify-between items-start mb-2">
                                      <h4 className="font-semibold text-gray-800">
                                        {stakeholder.name}
                                      </h4>
                                      <span
                                        className={`px-2 py-1 text-xs rounded ${
                                          stakeholder.impactLevel === "High"
                                            ? "bg-red-100 text-red-700"
                                            : stakeholder.impactLevel ===
                                              "Medium"
                                            ? "bg-yellow-100 text-yellow-700"
                                            : "bg-green-100 text-green-700"
                                        }`}
                                      >
                                        {stakeholder.impactLevel} Impact
                                      </span>
                                    </div>
                                    {stakeholder.description && (
                                      <p className="text-sm text-gray-600 mb-3">
                                        {stakeholder.description}
                                      </p>
                                    )}
                                    <div>
                                      <p className="text-sm font-medium text-gray-700 mb-1">
                                        Key Concerns:
                                      </p>
                                      <ul className="space-y-1">
                                        {stakeholder.concerns.map(
                                          (concern, idx) => (
                                            <li
                                              key={idx}
                                              className="text-sm text-gray-600 flex items-start gap-2"
                                            >
                                              <span className="text-blue-600">
                                                •
                                              </span>
                                              <span>{concern}</span>
                                            </li>
                                          )
                                        )}
                                      </ul>
                                    </div>
                                  </div>
                                )
                              )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Stakeholder Communication Plans Section */}
                  <div>
                    <SectionHeader
                      icon={MessageCircle}
                      title="Stakeholder Communication Plans"
                      section="communication"
                    />
                    {expandedSections.communication && (
                      <div className="p-6">
                        {editingSection === "communication" ? (
                          <div className="space-y-4">
                            {/* Edit mode */}
                            <div className="flex gap-2">
                              <button
                                onClick={saveEditedSection}
                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                              >
                                <Save className="w-4 h-4 inline mr-2" />
                                Save Changes
                              </button>
                              <button
                                onClick={cancelEditing}
                                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {crisisPlan.communicationPlans &&
                              crisisPlan.communicationPlans.map(
                                (plan, index) => (
                                  <div
                                    key={index}
                                    className="bg-gray-50 rounded-lg p-4"
                                  >
                                    <h4 className="font-semibold text-gray-800 mb-3">
                                      {plan.stakeholder}
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                                      <div>
                                        <p className="text-sm font-medium text-gray-700">
                                          Primary Channel:
                                        </p>
                                        <p className="text-sm text-gray-600">
                                          {plan.primaryChannel}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium text-gray-700">
                                          Secondary Channel:
                                        </p>
                                        <p className="text-sm text-gray-600">
                                          {plan.secondaryChannel || "N/A"}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium text-gray-700">
                                          Timing:
                                        </p>
                                        <p className="text-sm text-gray-600">
                                          {plan.timing}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium text-gray-700">
                                          Spokesperson:
                                        </p>
                                        <p className="text-sm text-gray-600">
                                          {plan.spokesperson}
                                        </p>
                                      </div>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-gray-700 mb-2">
                                        Key Messages:
                                      </p>
                                      <ul className="space-y-1">
                                        {plan.keyMessages.map(
                                          (message, idx) => (
                                            <li
                                              key={idx}
                                              className="text-sm text-gray-600 flex items-start gap-2"
                                            >
                                              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                              <span>{message}</span>
                                            </li>
                                          )
                                        )}
                                      </ul>
                                    </div>
                                  </div>
                                )
                              )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Event Monitoring Section */}
                  <div>
                    <SectionHeader
                      icon={Activity}
                      title="Event Monitoring"
                      section="monitoring"
                    />
                    {expandedSections.monitoring && (
                      <div className="p-6">
                        <div className="space-y-4">
                          {crisisPlan.eventMonitoring && (
                            <>
                              <div>
                                <h4 className="font-semibold text-gray-800 mb-2">
                                  Monitoring Tools
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                  {crisisPlan.eventMonitoring.tools.map(
                                    (tool, index) => (
                                      <span
                                        key={index}
                                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                                      >
                                        {tool}
                                      </span>
                                    )
                                  )}
                                </div>
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-800 mb-2">
                                  Monitoring Responsibilities
                                </h4>
                                <ul className="space-y-1">
                                  {crisisPlan.eventMonitoring.responsibilities.map(
                                    (resp, index) => (
                                      <li
                                        key={index}
                                        className="text-sm text-gray-600 flex items-start gap-2"
                                      >
                                        <UserCheck className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                        <span>{resp}</span>
                                      </li>
                                    )
                                  )}
                                </ul>
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-800 mb-2">
                                  Alert Thresholds
                                </h4>
                                <ul className="space-y-1">
                                  {crisisPlan.eventMonitoring.alertThresholds.map(
                                    (threshold, index) => (
                                      <li
                                        key={index}
                                        className="text-sm text-gray-600 flex items-start gap-2"
                                      >
                                        <Bell className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                                        <span>{threshold}</span>
                                      </li>
                                    )
                                  )}
                                </ul>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Post-Incident Evaluation Section */}
                  <div>
                    <SectionHeader
                      icon={ClipboardCheck}
                      title="Post-Incident Evaluation"
                      section="evaluation"
                    />
                    {expandedSections.evaluation && (
                      <div className="p-6">
                        <div className="space-y-4">
                          {crisisPlan.postIncidentEvaluation && (
                            <>
                              <div>
                                <h4 className="font-semibold text-gray-800 mb-2">
                                  Evaluation Process
                                </h4>
                                <ol className="space-y-2">
                                  {crisisPlan.postIncidentEvaluation.process.map(
                                    (step, index) => (
                                      <li
                                        key={index}
                                        className="text-sm text-gray-600 flex items-start gap-3"
                                      >
                                        <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">
                                          {index + 1}
                                        </span>
                                        <span>{step}</span>
                                      </li>
                                    )
                                  )}
                                </ol>
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-800 mb-2">
                                  Key Evaluation Questions
                                </h4>
                                <ul className="space-y-2">
                                  {crisisPlan.postIncidentEvaluation.keyQuestions.map(
                                    (question, index) => (
                                      <li
                                        key={index}
                                        className="text-sm text-gray-600 flex items-start gap-2"
                                      >
                                        <HelpCircle className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                                        <span>{question}</span>
                                      </li>
                                    )
                                  )}
                                </ul>
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-800 mb-2">
                                  Documentation Requirements
                                </h4>
                                <ul className="space-y-1">
                                  {crisisPlan.postIncidentEvaluation.documentationRequirements.map(
                                    (req, index) => (
                                      <li
                                        key={index}
                                        className="text-sm text-gray-600 flex items-start gap-2"
                                      >
                                        <FileText className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                                        <span>{req}</span>
                                      </li>
                                    )
                                  )}
                                </ul>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* AI Advisor View */}
        {activeView === "advisor" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Chat Area */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow-lg flex flex-col h-[600px]">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Bot className="w-6 h-6 text-purple-600" />
                    AI Crisis Advisor
                  </h2>
                  <button
                    onClick={() => setShowQueryHelp(!showQueryHelp)}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    <HelpCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Chat Messages */}
              <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-4"
              >
                {chatMessages.length === 0 ? (
                  <div className="text-center text-gray-500 mt-8">
                    <Bot className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-lg font-medium">
                      Hello! I'm your AI Crisis Advisor
                    </p>
                    <p className="text-sm mt-2">
                      Ask me about crisis scenarios, best practices, or get
                      real-time guidance during an active crisis.
                    </p>
                    {!crisisPlan && (
                      <p className="text-sm mt-2 text-blue-600">
                        💡 Tip: Create a crisis plan first for personalized
                        advice
                      </p>
                    )}
                  </div>
                ) : (
                  chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.type === "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-4 ${
                          message.type === "user"
                            ? "bg-blue-600 text-white"
                            : message.isError
                            ? "bg-red-50 text-red-800 border border-red-200"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">
                          {message.content}
                        </p>
                        <p
                          className={`text-xs mt-2 ${
                            message.type === "user"
                              ? "text-blue-100"
                              : "text-gray-500"
                          }`}
                        >
                          {message.timestamp}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                {isAIResponding && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                        <span className="text-sm text-gray-600">
                          AI is thinking...
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAIChat()}
                    placeholder="Ask about crisis scenarios, best practices, or current situation..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    disabled={isAIResponding}
                  />
                  <button
                    onClick={handleAIChat}
                    disabled={!chatInput.trim() || isAIResponding}
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400 transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* Crisis Severity Meter */}
              <CrisisSeverityMeter messages={chatMessages} />

              {/* AI Advisor Help */}
              <AIAdvisorHelp showHelp={showQueryHelp} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CrisisCommandCenter;
