import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bot,
  Search,
  Sparkles,
  Package,
  Brain,
  Briefcase,
  TrendingUp,
  Target,
  Command,
  Award,
  Copy,
  X,
  Plus,
  AlertCircle,
  Menu,
  FileText,
} from "lucide-react";

// Import your project data from shared constants
const projectData = {
  techcorp: { name: "TechCorp Launch", campaign: "Q4 Product Launch Campaign" },
  healthtech: {
    name: "HealthTech PR",
    campaign: "Series B Funding Announcement",
  },
  financehub: {
    name: "FinanceHub Rebrand",
    campaign: "Corporate Rebranding Initiative",
  },
  retailmax: {
    name: "RetailMax Crisis",
    campaign: "Crisis Management Response",
  },
};

// Initial project data for quick access
const initialProjectData = {
  "project-1": {
    name: "TechCorp Launch",
    campaign: "Q4 Product Launch Campaign",
    industry: "Technology",
    status: "Active",
    color: "bg-green-100 text-green-800",
  },
  "project-2": {
    name: "HealthTech PR",
    campaign: "Series B Funding Announcement",
    industry: "Healthcare",
    status: "Planning",
    color: "bg-blue-100 text-blue-800",
  },
  "project-3": {
    name: "FinanceHub Rebrand",
    campaign: "Corporate Rebranding Initiative",
    industry: "Finance",
    status: "Active",
    color: "bg-green-100 text-green-800",
  },
  "project-4": {
    name: "RetailMax Crisis",
    campaign: "Crisis Management Response",
    industry: "Retail",
    status: "Urgent",
    color: "bg-red-100 text-red-800",
  },
};

const Homepage = () => {
  const navigate = useNavigate();
  const [researchResults, setResearchResults] = useState("");
  const [isResearching, setIsResearching] = useState(false);
  const [homeResearchTopic, setHomeResearchTopic] = useState("");
  const [showFollowUpInput, setShowFollowUpInput] = useState(false);
  const [followUpQuery, setFollowUpQuery] = useState("");
  const [showAlert, setShowAlert] = useState({ show: false, message: "" });
  const [activeProject, setActiveProject] = useState(null);
  const [researchError, setResearchError] = useState(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [projects, setProjects] = useState(initialProjectData);
  const [personalLibrary, setPersonalLibrary] = useState([]);
  const [memoryVaultData, setMemoryVaultData] = useState({});
  const [showMemoryVaultSave, setShowMemoryVaultSave] = useState(false);
  const [selectedSaveProject, setSelectedSaveProject] = useState(null);
  const [selectedVaultFolder, setSelectedVaultFolder] = useState("");

  const homeInputRef = useRef(null);

  // MemoryVault folder structure
  const vaultFolders = {
    "campaign-intelligence": {
      name: "Campaign Intelligence",
      description: "Strategic insights and campaign analytics",
    },
    content: {
      name: "PR Materials",
      description: "All PR materials and assets",
    },
    research: {
      name: "Research",
      description: "Market research and analysis reports",
    },
    "crisis-management": {
      name: "Crisis Management",
      description: "Crisis response protocols and communications",
    },
    "media-lists": {
      name: "Media Lists",
      description: "Media contacts and distribution lists",
    },
  };

  // Custom alert function
  const showCustomAlert = (message) => {
    setShowAlert({ show: true, message });
    setTimeout(() => setShowAlert({ show: false, message: "" }), 3000);
  };

  // Project detection function
  const detectProjectInQuery = (query) => {
    const lowerQuery = query.toLowerCase();
    const allProjects = { ...projectData, ...projects };

    for (const [projectId, project] of Object.entries(allProjects)) {
      if (lowerQuery.includes(projectId.toLowerCase())) {
        return { projectId, projectName: project.name };
      }
      if (lowerQuery.includes(project.name.toLowerCase())) {
        return { projectId, projectName: project.name };
      }
      const projectWords = project.name.toLowerCase().split(" ");
      if (projectWords.length > 1) {
        const partialMatch = projectWords.slice(0, 2).join(" ");
        if (lowerQuery.includes(partialMatch)) {
          return { projectId, projectName: project.name };
        }
      } else if (lowerQuery.includes(projectWords[0])) {
        return { projectId, projectName: project.name };
      }
    }
    return null;
  };

  // Tool detection function
  const detectToolInQuery = (query) => {
    const lowerQuery = query.toLowerCase();
    const tools = {
      "content generator": "content-generator",
      "media list": "media-list",
      "crisis management": "crisis",
      monitoring: "monitoring",
      "content library": "library",
      campaign: "campaign",
    };

    for (const [keyword, tool] of Object.entries(tools)) {
      if (lowerQuery.includes(keyword)) {
        return tool;
      }
    }
    return null;
  };

  // Detect writing assistance request
  const detectWritingRequest = (query) => {
    const lowerQuery = query.toLowerCase();
    const writingKeywords = [
      "write",
      "draft",
      "compose",
      "create",
      "help me write",
      "writing",
      "email",
      "letter",
      "article",
      "blog post",
      "press release",
      "social media post",
      "tweet",
      "linkedin post",
      "announcement",
    ];

    const editingKeywords = [
      "edit",
      "improve",
      "rewrite",
      "polish",
      "proofread",
      "revise",
      "refine",
    ];

    if (editingKeywords.some((keyword) => lowerQuery.includes(keyword))) {
      return false;
    }

    return writingKeywords.some((keyword) => lowerQuery.includes(keyword));
  };

  // Detect brainstorming request
  const detectBrainstormingRequest = (query) => {
    const lowerQuery = query.toLowerCase();
    const brainstormKeywords = [
      "brainstorm",
      "ideas for",
      "suggestions",
      "creative",
      "think of",
      "come up with",
      "generate ideas",
      "help me think",
      "possibilities",
      "options for",
      "alternatives",
      "concepts",
      "inspiration",
    ];

    return brainstormKeywords.some((keyword) => lowerQuery.includes(keyword));
  };

  // Detect editing request
  const detectEditingRequest = (query) => {
    const lowerQuery = query.toLowerCase();
    const editingKeywords = [
      "edit",
      "improve",
      "rewrite",
      "polish",
      "proofread",
      "revise",
      "refine",
      "enhance",
      "fix",
      "correct",
      "make better",
      "rephrase",
      "simplify",
      "clarify",
      "shorten",
      "expand",
    ];

    return editingKeywords.some((keyword) => lowerQuery.includes(keyword));
  };

  // Keep all your existing AI functions
  const performDirectResearch = async (topic, projectContext = null) => {
    // Keep your existing implementation
  };

  const performWritingAssistance = async (request, projectContext = null) => {
    // Keep your existing implementation
  };

  const performBrainstorming = async (topic, projectContext = null) => {
    // Keep your existing implementation
  };

  const performTextEditing = async (request, projectContext = null) => {
    // Keep your existing implementation
  };

  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        const event = new CustomEvent("openAIAssistant");
        window.dispatchEvent(event);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Enhanced homepage search handler
  const handleHomeSearch = async () => {
    const query = homeInputRef.current?.value || "";
    if (!query.trim()) return;

    setResearchError(null);

    const detectedProject = detectProjectInQuery(query);
    if (activeProject && !detectedProject) {
      showCustomAlert(
        `⚠️ Project Context Required\n\nYou're working in ${activeProject.projectName}. Please include the project name in your query.\n\nExample: "Research competitors for ${activeProject.projectName}"`
      );
      return;
    }

    if (detectedProject) {
      setActiveProject(detectedProject);
      if (
        !activeProject ||
        activeProject.projectId !== detectedProject.projectId
      ) {
        showCustomAlert(
          `🎯 Working with project: ${detectedProject.projectName}`
        );
      }
    }

    // Check for project navigation requests
    const viewProjectsKeywords = [
      "show all projects",
      "view all projects",
      "open projects",
      "see projects",
      "list projects",
      "all projects",
      "projects list",
      "show projects",
      "view projects",
      "see all projects",
      "open all projects",
    ];

    if (
      viewProjectsKeywords.some((keyword) =>
        query.toLowerCase().includes(keyword)
      )
    ) {
      showCustomAlert("Opening all projects...");
      navigate("/projects");
      if (homeInputRef.current) {
        homeInputRef.current.value = "";
      }
      return;
    }

    // Rest of your existing search handling logic
    // ... (keep all the existing logic)
  };

  // Save to MemoryVault function
  const saveResearchToMemoryVault = () => {
    // Keep your existing implementation
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f9fafb" }}>
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
      
      {/* Enhanced Features Banner */}
      <div style={{
        background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
        color: "white",
        padding: "12px 20px",
        textAlign: "center",
        borderBottom: "1px solid rgba(255, 255, 255, 0.2)",
        position: "sticky",
        top: 0,
        zIndex: 50,
        animation: "pulse 2s ease-in-out infinite"
      }}>
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          gap: "12px",
          fontSize: "14px",
          fontWeight: "500"
        }}>
          <Sparkles style={{ width: "18px", height: "18px" }} />
          <span>
            🚀 SignalDesk Enhanced Platform v2.0 is Live! 
            Try the new <strong>Campaign Intelligence</strong> with Railway UI, MemoryVault, and Real-time Collaboration
          </span>
          <button
            onClick={() => navigate("/projects")}
            style={{
              padding: "6px 12px",
              background: "white",
              color: "#7c3aed",
              border: "none",
              borderRadius: "6px",
              fontWeight: "600",
              cursor: "pointer",
              fontSize: "13px",
              marginLeft: "8px",
              transition: "transform 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
          >
            Explore Now →
          </button>
        </div>
      </div>
      
      {/* Navigation Bar */}
      <nav
        style={{ backgroundColor: "#1a1d23", borderBottom: "1px solid #333" }}
        className="shadow-sm sticky top-0 z-40"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left side - Logo and Navigation */}
            <div className="flex items-center space-x-8">
              <button
                onClick={() => navigate("/")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  textDecoration: "none",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  opacity: 1,
                  transition: "opacity 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                title="Go to Home"
              >
                <Bot
                  style={{ width: "32px", height: "32px", color: "white" }}
                />
                <span
                  style={{
                    fontSize: "20px",
                    fontWeight: "bold",
                    marginLeft: "8px",
                    color: "white",
                  }}
                >
                  SignalDesk
                </span>
              </button>

              <div className="hidden md:flex space-x-6">
                <button
                  onClick={() => navigate("/")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontWeight: "500",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    color: "white",
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                  </svg>
                  Home
                </button>
                <button
                  onClick={() => navigate("/projects")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontWeight: "500",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    color: "rgba(255, 255, 255, 0.8)",
                    backgroundColor: "transparent",
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "white";
                    e.currentTarget.style.backgroundColor =
                      "rgba(255, 255, 255, 0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "rgba(255, 255, 255, 0.8)";
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <Briefcase className="w-5 h-5" />
                  Projects
                </button>
              </div>
            </div>

            {/* Right side - User Profile */}
            <div className="flex items-center space-x-4">
              <button
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  color: "rgba(255, 255, 255, 0.8)",
                  fontWeight: "500",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  backgroundColor: "transparent",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                className="hidden md:flex"
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background:
                      "linear-gradient(to bottom right, #3b82f6, #9333ea)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span
                    style={{
                      color: "white",
                      fontWeight: "600",
                      fontSize: "14px",
                    }}
                  >
                    JD
                  </span>
                </div>
                <span className="hidden md:inline">John Doe</span>
              </button>

              {/* Mobile menu button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                style={{
                  padding: "8px",
                  borderRadius: "8px",
                  color: "rgba(255, 255, 255, 0.8)",
                  backgroundColor: "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
                className="md:hidden"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Mobile menu dropdown */}
          {showMobileMenu && (
            <div
              style={{
                position: "absolute",
                top: "64px",
                left: 0,
                right: 0,
                backgroundColor: "#1a1d23",
                borderTop: "1px solid #333",
                padding: "12px 0",
                zIndex: 40,
              }}
              className="md:hidden"
            >
              <button
                onClick={() => {
                  navigate("/");
                  setShowMobileMenu(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  width: "100%",
                  textAlign: "left",
                  padding: "12px 16px",
                  fontWeight: "500",
                  color: "white",
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                Home
              </button>
              <button
                onClick={() => {
                  navigate("/projects");
                  setShowMobileMenu(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  width: "100%",
                  textAlign: "left",
                  padding: "12px 16px",
                  fontWeight: "500",
                  color: "rgba(255, 255, 255, 0.8)",
                  backgroundColor: "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <Briefcase className="w-5 h-5" />
                Projects
              </button>
              <div
                style={{
                  borderTop: "1px solid #333",
                  marginTop: "8px",
                  paddingTop: "8px",
                }}
              >
                <button
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    width: "100%",
                    textAlign: "left",
                    padding: "12px 16px",
                    color: "rgba(255, 255, 255, 0.8)",
                    backgroundColor: "transparent",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      background:
                        "linear-gradient(to bottom right, #3b82f6, #9333ea)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <span
                      style={{
                        color: "white",
                        fontWeight: "600",
                        fontSize: "14px",
                      }}
                    >
                      JD
                    </span>
                  </div>
                  <span>John Doe</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Alert Component */}
      {showAlert.show && (
        <div
          style={{
            position: "fixed",
            top: "80px",
            right: "16px",
            backgroundColor: "#3b82f6",
            color: "white",
            padding: "16px 24px",
            borderRadius: "8px",
            boxShadow:
              "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
            zIndex: 50,
            maxWidth: "28rem",
          }}
        >
          <div style={{ whiteSpace: "pre-line" }}>{showAlert.message}</div>
        </div>
      )}

      {/* Main AI Assistant Interface */}
      <div
        style={{
          maxWidth: "96rem",
          margin: "0 auto",
          padding: "48px 24px",
          textAlign: "center",
        }}
      >
        {/* Hero Section */}
        <div className="mb-8 mt-8">
          <div
            style={{
              width: "128px",
              height: "128px",
              margin: "0 auto 32px auto",
              borderRadius: "50%",
              background: "linear-gradient(to bottom right, #3b82f6, #9333ea)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow:
                "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            }}
          >
            <Bot style={{ width: "64px", height: "64px", color: "white" }} />
          </div>
          <h1
            style={{
              fontSize: "48px",
              fontWeight: "bold",
              color: "#1f2937",
              marginBottom: "24px",
            }}
          >
            SignalDesk Assistant
          </h1>
          <p
            style={{
              fontSize: "20px",
              color: "#6b7280",
              marginBottom: "32px",
              lineHeight: "1.75",
              maxWidth: "64rem",
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            Your intelligent research and content creation assistant
          </p>
        </div>

        {/* Enhanced AI Assistant Search Bar */}
        {!researchResults && !isResearching && (
          <div style={{ maxWidth: "36rem", margin: "0 auto 48px auto" }}>
            <h3
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                color: "#1f2937",
                marginBottom: "8px",
              }}
            >
              AI Assistant
            </h3>
            <p style={{ color: "#6b7280", marginBottom: "16px" }}>
              Examples: "Research AI trends" • "Write press release" • "Edit
              text" • "Brainstorm ideas"
            </p>

            {/* AI Capabilities Info */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "16px",
                marginBottom: "16px",
                fontSize: "14px",
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  color: "#6b7280",
                }}
              >
                <Search style={{ width: "16px", height: "16px" }} />
                Research
              </span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  color: "#6b7280",
                }}
              >
                <FileText style={{ width: "16px", height: "16px" }} />
                Writing
              </span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  color: "#6b7280",
                }}
              >
                <Target style={{ width: "16px", height: "16px" }} />
                Editing
              </span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  color: "#6b7280",
                }}
              >
                <Brain style={{ width: "16px", height: "16px" }} />
                Brainstorming
              </span>
            </div>

            <div
              style={{
                backgroundColor: "white",
                borderRadius: "16px",
                boxShadow:
                  "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                border: "2px solid #e5e7eb",
                padding: "8px",
                transition: "border-color 0.3s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.borderColor = "#3b82f6")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.borderColor = "#e5e7eb")
              }
            >
              <div style={{ display: "flex", alignItems: "flex-start" }}>
                <textarea
                  ref={homeInputRef}
                  placeholder="Ask me anything..."
                  style={{
                    flex: 1,
                    padding: "12px 16px",
                    fontSize: "18px",
                    border: "none",
                    outline: "none",
                    backgroundColor: "white",
                    borderRadius: "12px 0 0 12px",
                    resize: "none",
                    minHeight: "48px",
                    lineHeight: "1.5",
                    overflow: "hidden",
                  }}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleHomeSearch();
                    }
                  }}
                  onInput={(e) => {
                    e.target.style.height = "auto";
                    e.target.style.height = e.target.scrollHeight + "px";
                  }}
                  autoComplete="off"
                  spellCheck={false}
                  rows={1}
                />
                <button
                  type="button"
                  onClick={handleHomeSearch}
                  style={{
                    background: "linear-gradient(to right, #3b82f6, #9333ea)",
                    color: "white",
                    padding: "12px 20px",
                    borderRadius: "16px",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.3s",
                    flexShrink: 0,
                    marginTop: 0,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow =
                      "0 10px 15px -3px rgba(0, 0, 0, 0.1)";
                    e.currentTarget.style.transform = "scale(1.05)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="white"
                    stroke="white"
                    strokeWidth="0"
                  >
                    <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                  </svg>
                </button>
              </div>
            </div>
            {activeProject && (
              <div
                style={{ marginTop: "8px", fontSize: "14px", color: "#3b82f6" }}
              >
                ⚠️ Project mode: Include "{activeProject.projectName}" in all
                queries
              </div>
            )}
          </div>
        )}

        {/* Research Status */}
        {isResearching && (
          <div
            style={{
              marginBottom: "32px",
              backgroundColor: "#f3e8ff",
              border: "1px solid #e9d5ff",
              borderRadius: "8px",
              padding: "24px",
              maxWidth: "64rem",
              margin: "0 auto 32px auto",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
              }}
            >
              <div
                style={{
                  width: "24px",
                  height: "24px",
                  border: "2px solid #9333ea",
                  borderTopColor: "transparent",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                }}
              ></div>
              <div>
                <div style={{ fontWeight: "600", color: "#6b21a8" }}>
                  Claude AI Processing
                </div>
                <div style={{ color: "#9333ea", fontSize: "14px" }}>
                  {homeResearchTopic}...
                </div>
                {activeProject && (
                  <div
                    style={{
                      color: "#9333ea",
                      fontSize: "12px",
                      marginTop: "4px",
                    }}
                  >
                    Project: {activeProject.projectName}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {researchError && !isResearching && (
          <div
            style={{
              marginBottom: "32px",
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "8px",
              padding: "24px",
              maxWidth: "64rem",
              margin: "0 auto 32px auto",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
              }}
            >
              <AlertCircle
                style={{ width: "24px", height: "24px", color: "#dc2626" }}
              />
              <div>
                <div style={{ fontWeight: "600", color: "#991b1b" }}>
                  AI Assistant Error
                </div>
                <div style={{ color: "#dc2626", fontSize: "14px" }}>
                  {researchError}
                </div>
                <button
                  onClick={() => {
                    setResearchError(null);
                    if (homeInputRef.current) {
                      let originalQuery = homeResearchTopic;
                      if (originalQuery.startsWith("Writing: ")) {
                        originalQuery = originalQuery.replace("Writing: ", "");
                      } else if (originalQuery.startsWith("Brainstorming: ")) {
                        originalQuery = originalQuery.replace(
                          "Brainstorming: ",
                          ""
                        );
                      } else if (originalQuery.startsWith("Editing: ")) {
                        originalQuery = originalQuery.replace("Editing: ", "");
                      }
                      homeInputRef.current.value = originalQuery;
                      homeInputRef.current.focus();
                    }
                  }}
                  style={{
                    marginTop: "8px",
                    color: "#b91c1c",
                    textDecoration: "underline",
                    fontSize: "14px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Platform Capabilities Section */}
        {!researchResults && !isResearching && !researchError && (
          <>
            <div style={{ marginTop: "64px" }}>
              <h3
                style={{
                  fontSize: "28px",
                  fontWeight: "bold",
                  color: "#1f2937",
                  marginBottom: "32px",
                }}
              >
                Platform Capabilities
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: "24px",
                  maxWidth: "64rem",
                  margin: "0 auto",
                }}
              >
                {[
                  {
                    icon: (
                      <Package
                        style={{
                          width: "40px",
                          height: "40px",
                          color: "white",
                        }}
                      />
                    ),
                    title: "Smart Project Context",
                    desc: "AI detects projects automatically",
                    gradient:
                      "linear-gradient(to bottom right, #3b82f6, #06b6d4)",
                  },
                  {
                    icon: (
                      <Brain
                        style={{
                          width: "40px",
                          height: "40px",
                          color: "white",
                        }}
                      />
                    ),
                    title: "Claude AI Assistant",
                    desc: "General research, writing, editing & brainstorming",
                    gradient:
                      "linear-gradient(to bottom right, #a855f7, #ec4899)",
                  },
                  {
                    icon: (
                      <Target
                        style={{
                          width: "40px",
                          height: "40px",
                          color: "white",
                        }}
                      />
                    ),
                    title: "Goal-Based Workflows",
                    desc: "Tell us your goal, we help you achieve it",
                    gradient:
                      "linear-gradient(to bottom right, #10b981, #14b8a6)",
                  },
                  {
                    icon: (
                      <Sparkles
                        style={{
                          width: "40px",
                          height: "40px",
                          color: "white",
                        }}
                      />
                    ),
                    title: "AI-Powered Everything",
                    desc: "Writing, editing, ideation & analysis",
                    gradient:
                      "linear-gradient(to bottom right, #f97316, #ef4444)",
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      backgroundColor: "white",
                      borderRadius: "16px",
                      padding: "24px",
                      boxShadow:
                        "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                      textAlign: "left",
                      transition: "all 0.3s",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow =
                        "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)";
                      e.currentTarget.style.transform = "translateY(-4px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow =
                        "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <div
                      style={{
                        display: "inline-block",
                        padding: "12px",
                        borderRadius: "12px",
                        background: item.gradient,
                        marginBottom: "16px",
                      }}
                    >
                      {item.icon}
                    </div>
                    <h4
                      style={{
                        fontWeight: "600",
                        color: "#1f2937",
                        fontSize: "18px",
                        marginBottom: "8px",
                      }}
                    >
                      {item.title}
                    </h4>
                    <p
                      style={{
                        color: "#6b7280",
                        fontSize: "14px",
                        lineHeight: "1.5",
                      }}
                    >
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Homepage;
