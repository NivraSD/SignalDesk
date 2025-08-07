import React, { useState, useRef, useMemo, useEffect } from "react";
import {
  Search,
  Filter,
  Calendar,
  Tag,
  Archive,
  Download,
  Upload,
  X,
  Copy,
  FileText,
  Clock,
  BarChart3,
  Grid,
  List,
  Eye,
  Star,
  FolderOpen,
  Hash,
  Folder,
  ChevronRight,
  Shield,
  Lightbulb,
  FileSearch,
  AlertCircle,
  Plus,
  FolderPlus,
  RefreshCw,
  Check,
  Brain,
  Sparkles,
  TrendingUp,
  Zap,
  Bot,
  MoreVertical,
  ArrowUpRight,
} from "lucide-react";
import { useParams } from "react-router-dom";
import { useProject } from "../contexts/ProjectContext";

// Folder structure with icons and descriptions
const folderStructure = {
  "campaign-intelligence": {
    name: "Campaign Intelligence",
    icon: Lightbulb,
    color: "#8B5CF6",
    bgColor: "#F3E8FF",
    description: "Strategic insights and campaign analytics",
  },
  content: {
    name: "PR Materials",
    icon: FileText,
    color: "#3B82F6",
    bgColor: "#DBEAFE",
    description: "All PR materials and assets",
  },
  research: {
    name: "Research",
    icon: FileSearch,
    color: "#10B981",
    bgColor: "#D1FAE5",
    description: "Market research and analysis reports",
  },
  "crisis-management": {
    name: "Crisis Management",
    icon: AlertCircle,
    color: "#EF4444",
    bgColor: "#FEE2E2",
    description: "Crisis response protocols and communications",
  },
  "media-lists": {
    name: "Media Lists",
    icon: List,
    color: "#6366F1",
    bgColor: "#E0E7FF",
    description: "Media contacts and distribution lists",
  },
};

// Initial subfolders for each main folder
const initialSubfolders = {
  "campaign-intelligence": [
    { id: "ci-1", name: "Q4 2024 Campaigns", itemCount: 3 },
    { id: "ci-2", name: "2025 Strategy", itemCount: 2 },
    { id: "ci-3", name: "Competitor Analysis", itemCount: 1 },
  ],
  content: [
    { id: "pr-1", name: "Product Launches", itemCount: 2 },
    { id: "pr-2", name: "Executive Communications", itemCount: 1 },
    { id: "pr-3", name: "Media Kits", itemCount: 0 },
  ],
  research: [
    { id: "r-1", name: "Market Studies", itemCount: 2 },
    { id: "r-2", name: "Customer Insights", itemCount: 1 },
    { id: "r-3", name: "Industry Reports", itemCount: 1 },
  ],
  "crisis-management": [
    { id: "cm-1", name: "Response Protocols", itemCount: 2 },
    { id: "cm-2", name: "Media Templates", itemCount: 1 },
    { id: "cm-3", name: "Training Materials", itemCount: 0 },
  ],
  "media-lists": [
    { id: "ml-1", name: "National Media", itemCount: 2 },
    { id: "ml-2", name: "Regional Media", itemCount: 1 },
    { id: "ml-3", name: "Industry Analysts", itemCount: 2 },
  ],
};

// Enhanced content library with AI metadata
const initialContentLibrary = {
  "Press Releases": [],
  "Media Coverage": [],
  "Social Media": [],
  Reports: [],
  Other: [],
};

// Available tags
const availableTags = [
  "Q4 2024",
  "performance",
  "analytics",
  "ROI",
  "campaigns",
  "competitor analysis",
  "market intelligence",
  "2025",
  "strategy",
  "AI",
  "product launch",
  "press release",
  "social media",
  "thought leadership",
  "research",
  "customer sentiment",
  "trends",
  "crisis",
  "protocol",
  "security",
  "media",
  "media contacts",
  "journalists",
  "national",
  "healthcare",
];

// Main MemoryVault Component
const MemoryVault = () => {
  // Original states
  const [currentFolder, setCurrentFolder] = useState("content");
  const [currentSubfolder, setCurrentSubfolder] = useState(null);
  const [subfolders, setSubfolders] = useState(initialSubfolders);
  const [contentLibrary, setContentLibrary] = useState(initialContentLibrary);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("date");
  const [showFilters, setShowFilters] = useState(false);
  const [contentViewer, setContentViewer] = useState({
    visible: false,
    content: null,
  });
  const [showStats, setShowStats] = useState(false);
  const [showCreateSubfolder, setShowCreateSubfolder] = useState(false);
  const [newSubfolderName, setNewSubfolderName] = useState("");
  const { projectId } = useParams();
  const { activeProject } = useProject();
  // Add this useEffect to load data from the API
  useEffect(() => {
    const loadMemoryVaultData = async () => {
      if (!projectId) return;

      try {
        console.log("Loading MemoryVault data for project:", projectId);
        const response = await fetch(
          `http://localhost:5001/api/projects/${projectId}/memoryvault`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        const data = await response.json();
        console.log("MemoryVault API response:", data);

        if (data.success && data.items) {
          // Create a map of folder IDs to folder types
          const folderMap = {};
          data.folders.forEach((folder) => {
            folderMap[folder.id] = folder.folder_type;
          });

          // Initialize the content library structure
          const newContentLibrary = {
            "campaign-intelligence": [],
            content: [],
            research: [],
            "crisis-management": [],
            "media-lists": [],
          };

          // Transform and group items
          data.items.forEach((item) => {
            const folderType = folderMap[item.folder_id];
            console.log(
              "Processing item:",
              item.title,
              "folder type:",
              folderType
            );

            if (folderType && newContentLibrary[folderType]) {
              newContentLibrary[folderType].push({
                id: item.id,
                subfolderId: item.subfolder_id,
                title: item.title,
                content: item.content,
                preview: item.preview,
                type: item.type,
                tags: item.tags || [],
                date: item.created_at,
                views: item.views || 0,
                starred: item.starred || false,
                lastModified: item.last_modified,
                author: item.author || "You",
                status: item.status || "saved",
                aiScore: item.ai_score,
                aiInsights: item.ai_insights
                  ? JSON.parse(item.ai_insights)
                  : [],
                source: item.source,
              });
            }
          });

          console.log("Transformed content library:", newContentLibrary);
          setContentLibrary(newContentLibrary);
        }
      } catch (error) {
        console.error("Error loading MemoryVault:", error);
      }
    };

    loadMemoryVaultData();
  }, [projectId]); // Reload when project changes

  // AI-related states
  const [aiStatus, setAiStatus] = useState({
    trained: true,
    lastTraining: "2024-12-20T15:30:00",
    documentsProcessed: 17,
    modelVersion: "2.1",
    accuracy: 94,
  });
  const [isTraining, setIsTraining] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [uploadMode, setUploadMode] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState([]);
  const [aiSearchMode, setAiSearchMode] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [templates, setTemplates] = useState([
    {
      id: "t1",
      name: "Executive Presentation Template.pptx",
      category: "Presentation",
      fileType: "powerpoint",
      description: "Standard executive presentation deck with brand guidelines",
      content: null,
      fileSize: "4.8 MB",
      tags: ["presentation", "executive", "powerpoint", "company", "branding"],
      created: "2024-10-20",
      lastUsed: "2024-12-18",
      useCount: 45,
      aiScore: 92,
      aiInsights: [
        "Well-structured template",
        "Strong brand consistency",
        "Clear slide layouts",
      ],
    },
    {
      id: "t2",
      name: "Company Letterhead.docx",
      category: "Document",
      fileType: "word",
      description:
        "Official company letterhead template with logo and formatting",
      content: null,
      fileSize: "245 KB",
      tags: ["letterhead", "word", "official", "corporate", "branding"],
      created: "2024-09-15",
      lastUsed: "2024-12-19",
      useCount: 67,
      aiScore: 88,
      aiInsights: ["Follows brand guidelines", "Professional formatting"],
    },
  ]);
  const [templateUploadModal, setTemplateUploadModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateSearchQuery, setTemplateSearchQuery] = useState("");
  const [selectedTemplateCategory, setSelectedTemplateCategory] =
    useState("all");

  const fileInputRef = useRef(null);
  const templateInputRef = useRef(null);

  // Get current folder data
  const currentFolderData = folderStructure[currentFolder];
  const currentContent = contentLibrary[currentFolder] || [];
  const currentSubfolders = subfolders[currentFolder] || [];

  // Filter content by subfolder if selected
  const filteredBySubfolder = currentSubfolder
    ? currentContent.filter((item) => item.subfolderId === currentSubfolder)
    : currentContent;

  // Advanced filtering for current folder
  const filteredContent = useMemo(() => {
    let filtered = [...filteredBySubfolder];

    // Search filter (enhanced with AI semantic search when enabled)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((item) => {
        const basicMatch =
          item.title.toLowerCase().includes(query) ||
          item.preview.toLowerCase().includes(query) ||
          (item.content && item.content.toLowerCase().includes(query)) ||
          item.tags.some((tag) => tag.toLowerCase().includes(query));

        // If AI search is enabled, also consider semantic relevance
        if (aiSearchMode && item.aiScore) {
          return basicMatch || item.aiScore > 80;
        }
        return basicMatch;
      });
    }

    // Tag filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter((item) =>
        selectedTags.every((tag) => item.tags.includes(tag))
      );
    }

    // Date range filter
    if (dateRange.start || dateRange.end) {
      filtered = filtered.filter((item) => {
        const itemDate = new Date(item.date);
        if (dateRange.start && itemDate < new Date(dateRange.start))
          return false;
        if (dateRange.end && itemDate > new Date(dateRange.end)) return false;
        return true;
      });
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return new Date(b.date) - new Date(a.date);
        case "views":
          return (b.views || 0) - (a.views || 0);
        case "title":
          return a.title.localeCompare(b.title);
        case "modified":
          return (
            new Date(b.lastModified || b.date) -
            new Date(a.lastModified || a.date)
          );
        case "ai-score":
          return (b.aiScore || 0) - (a.aiScore || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [
    filteredBySubfolder,
    searchQuery,
    selectedTags,
    dateRange,
    sortBy,
    aiSearchMode,
  ]);

  // Calculate folder statistics
  const folderStats = useMemo(() => {
    const stats = {};
    Object.keys(folderStructure).forEach((folder) => {
      const items = contentLibrary[folder] || [];
      stats[folder] = {
        total: items.length,
        starred: items.filter((item) => item.starred).length,
        views: items.reduce((sum, item) => sum + (item.views || 0), 0),
        recent: items.filter((item) => {
          const lastModified = new Date(item.lastModified || item.date);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return lastModified > weekAgo;
        }).length,
        averageAiScore:
          items.reduce((sum, item) => sum + (item.aiScore || 0), 0) /
            items.length || 0,
      };
    });
    return stats;
  }, [contentLibrary]);

  // Filter templates based on search and category
  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      const matchesSearch =
        !templateSearchQuery ||
        template.name
          .toLowerCase()
          .includes(templateSearchQuery.toLowerCase()) ||
        template.description
          .toLowerCase()
          .includes(templateSearchQuery.toLowerCase()) ||
        template.tags.some((tag) =>
          tag.toLowerCase().includes(templateSearchQuery.toLowerCase())
        );
      const matchesCategory =
        selectedTemplateCategory === "all" ||
        template.category === selectedTemplateCategory;
      return matchesSearch && matchesCategory;
    });
  }, [templates, templateSearchQuery, selectedTemplateCategory]);

  // Sync with content library and trigger AI learning
  const syncWithLibrary = async () => {
    setIsSyncing(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Simulate adding new content with AI processing
      const newContent = {
        id: Date.now(),
        subfolderId: "pr-1",
        title: "Product Update Announcement - NEW",
        date: new Date().toISOString().split("T")[0],
        preview: "Latest product updates featuring enhanced AI capabilities...",
        content: "Full announcement content...",
        type: "Press Release",
        tags: ["product update", "AI", "announcement"],
        views: 0,
        starred: false,
        lastModified: new Date().toISOString(),
        author: "PR Team",
        status: "draft",
        aiScore: 0,
        aiInsights: ["Processing..."],
      };

      setContentLibrary((prev) => ({
        ...prev,
        content: [...(prev.content || []), newContent],
      }));

      // Simulate AI processing of new content
      setTimeout(() => {
        setContentLibrary((prev) => ({
          ...prev,
          content: prev.content.map((item) =>
            item.id === newContent.id
              ? {
                  ...item,
                  aiScore: 87,
                  aiInsights: [
                    "Follows brand guidelines",
                    "Consider adding customer quotes",
                    "Strong feature highlights",
                  ],
                }
              : item
          ),
        }));
      }, 3000);

      // Update AI status
      setAiStatus((prev) => ({
        ...prev,
        documentsProcessed: prev.documentsProcessed + 1,
        lastTraining: new Date().toISOString(),
      }));
    } catch (error) {
      alert("Failed to sync with content library. Please try again.");
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle file drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    processFiles(droppedFiles);
  };

  const processFiles = async (files) => {
    // Process files and trigger AI learning
    for (const file of files) {
      const newDoc = {
        id: Date.now() + Math.random(),
        subfolderId: currentSubfolder || `${currentFolder}-1`,
        title: file.name.replace(/\.[^/.]+$/, ""),
        date: new Date().toISOString().split("T")[0],
        preview: `Uploaded file: ${file.name}`,
        content: "Processing content...",
        type: "Uploaded Document",
        tags: [],
        views: 0,
        starred: false,
        lastModified: new Date().toISOString(),
        author: "Current User",
        status: "processing",
        aiScore: 0,
        aiInsights: ["Analyzing..."],
      };

      setContentLibrary((prev) => ({
        ...prev,
        [currentFolder]: [...(prev[currentFolder] || []), newDoc],
      }));

      // Simulate AI processing
      setTimeout(() => {
        const aiTags = [
          "uploaded",
          currentFolder,
          new Date().getFullYear().toString(),
        ];
        setContentLibrary((prev) => ({
          ...prev,
          [currentFolder]: prev[currentFolder].map((item) =>
            item.id === newDoc.id
              ? {
                  ...item,
                  status: "processed",
                  aiScore: Math.floor(Math.random() * 20) + 80,
                  tags: aiTags,
                  aiInsights: [
                    "Content analyzed successfully",
                    "Matches folder category patterns",
                    "Consider adding more metadata",
                  ],
                }
              : item
          ),
        }));

        // Update AI status
        setAiStatus((prev) => ({
          ...prev,
          documentsProcessed: prev.documentsProcessed + 1,
          lastTraining: new Date().toISOString(),
        }));
      }, 2000);
    }

    setUploadMode(false);
  };

  // Toggle tag selection
  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedTags([]);
    setDateRange({ start: "", end: "" });
    setCurrentSubfolder(null);
    setAiSearchMode(false);
  };

  // Open content viewer
  const openContentViewer = (content) => {
    // Increment view count
    setContentLibrary((prev) => ({
      ...prev,
      [currentFolder]: prev[currentFolder].map((item) =>
        item.id === content.id
          ? { ...item, views: (item.views || 0) + 1 }
          : item
      ),
    }));

    setContentViewer({ visible: true, content });
  };

  // Toggle star
  const toggleStar = (contentId) => {
    setContentLibrary((prev) => ({
      ...prev,
      [currentFolder]: prev[currentFolder].map((item) =>
        item.id === contentId ? { ...item, starred: !item.starred } : item
      ),
    }));
  };

  // Create subfolder
  const handleCreateSubfolder = () => {
    if (newSubfolderName.trim()) {
      const newSubfolder = {
        id: `${currentFolder}-${Date.now()}`,
        name: newSubfolderName.trim(),
        itemCount: 0,
      };

      setSubfolders((prev) => ({
        ...prev,
        [currentFolder]: [...(prev[currentFolder] || []), newSubfolder],
      }));

      setNewSubfolderName("");
      setShowCreateSubfolder(false);
    }
  };

  // ContentDisplay component for formatting different content types
  const ContentDisplay = ({ content, type }) => {
    // For media lists, parse and display formatted content
    if (type === "media-list") {
      try {
        const mediaListData =
          typeof content === "string" ? JSON.parse(content) : content;

        return (
          <div style={{ color: "#374151", lineHeight: "1.625" }}>
            <div style={{ marginBottom: "24px" }}>
              <h4
                style={{
                  fontSize: "18px",
                  fontWeight: "600",
                  marginBottom: "8px",
                }}
              >
                {mediaListData.listName}
              </h4>
              <div
                style={{ display: "flex", gap: "16px", marginBottom: "16px" }}
              >
                <span style={{ color: "#6b7280" }}>
                  <strong>{mediaListData.journalistCount}</strong> journalists
                </span>
                <span style={{ color: "#6b7280" }}>
                  <strong>{mediaListData.pitchAngles?.length || 0}</strong>{" "}
                  pitch angles
                </span>
                <span style={{ color: "#6b7280" }}>
                  Created:{" "}
                  {new Date(mediaListData.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Journalists Section */}
            <div style={{ marginBottom: "32px" }}>
              <h5
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  marginBottom: "12px",
                  color: "#111827",
                }}
              >
                Journalists
              </h5>
              <div style={{ display: "grid", gap: "12px" }}>
                {mediaListData.journalists.map((journalist, index) => (
                  <div
                    key={index}
                    style={{
                      padding: "16px",
                      backgroundColor: "#f9fafb",
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "start",
                      }}
                    >
                      <div>
                        <h6
                          style={{
                            fontWeight: "600",
                            color: "#111827",
                            marginBottom: "4px",
                          }}
                        >
                          {journalist.name}
                        </h6>
                        <p
                          style={{
                            color: "#2563eb",
                            fontSize: "14px",
                            marginBottom: "8px",
                          }}
                        >
                          {journalist.publication} • {journalist.beat}
                        </p>
                        {journalist.bio && (
                          <p
                            style={{
                              fontSize: "14px",
                              color: "#4b5563",
                              marginBottom: "8px",
                            }}
                          >
                            {journalist.bio}
                          </p>
                        )}
                        {journalist.ai_insights && (
                          <p
                            style={{
                              fontSize: "14px",
                              color: "#7c3aed",
                              backgroundColor: "#f3e8ff",
                              padding: "8px 12px",
                              borderRadius: "6px",
                              marginTop: "8px",
                            }}
                          >
                            ✨ {journalist.ai_insights}
                          </p>
                        )}
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <span
                          style={{
                            backgroundColor: "#d1fae5",
                            color: "#047857",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            fontSize: "12px",
                            fontWeight: "500",
                          }}
                        >
                          {journalist.relevance_score}% match
                        </span>
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: "12px",
                        marginTop: "8px",
                        fontSize: "14px",
                      }}
                    >
                      {journalist.twitter && (
                        <a
                          href={`https://twitter.com/${journalist.twitter.replace(
                            "@",
                            ""
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "#1da1f2", textDecoration: "none" }}
                        >
                          🐦 {journalist.twitter}
                        </a>
                      )}
                      {journalist.email && (
                        <span style={{ color: "#6b7280" }}>
                          ✉️ {journalist.email}
                        </span>
                      )}
                      {journalist.location && (
                        <span style={{ color: "#6b7280" }}>
                          📍 {journalist.location}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pitch Angles Section */}
            {mediaListData.pitchAngles &&
              mediaListData.pitchAngles.length > 0 && (
                <div>
                  <h5
                    style={{
                      fontSize: "16px",
                      fontWeight: "600",
                      marginBottom: "12px",
                      color: "#111827",
                    }}
                  >
                    Pitch Angles
                  </h5>
                  <div style={{ display: "grid", gap: "12px" }}>
                    {mediaListData.pitchAngles.map((pitch, index) => (
                      <div
                        key={index}
                        style={{
                          padding: "16px",
                          backgroundColor: "#f0f9ff",
                          borderRadius: "8px",
                          border: "1px solid #0ea5e9",
                        }}
                      >
                        <h6
                          style={{
                            fontWeight: "600",
                            color: "#0c4a6e",
                            marginBottom: "8px",
                          }}
                        >
                          {pitch.title}
                        </h6>
                        <p
                          style={{
                            fontSize: "14px",
                            color: "#374151",
                            marginBottom: "12px",
                          }}
                        >
                          {pitch.description}
                        </p>
                        <div
                          style={{
                            display: "flex",
                            gap: "16px",
                            flexWrap: "wrap",
                            fontSize: "14px",
                          }}
                        >
                          <div>
                            <strong style={{ color: "#0369a1" }}>
                              Target Journalists:
                            </strong>{" "}
                            {pitch.targetJournalists.join(", ")}
                          </div>
                          <div>
                            <strong style={{ color: "#0369a1" }}>
                              Hook Type:
                            </strong>{" "}
                            <span
                              style={{
                                backgroundColor: "#e0f2fe",
                                padding: "2px 8px",
                                borderRadius: "4px",
                              }}
                            >
                              {pitch.hookType}
                            </span>
                          </div>
                        </div>
                        {pitch.keyMessages && (
                          <div style={{ marginTop: "12px" }}>
                            <strong
                              style={{ color: "#0369a1", fontSize: "14px" }}
                            >
                              Key Messages:
                            </strong>
                            <ul
                              style={{
                                marginTop: "4px",
                                marginLeft: "20px",
                                color: "#374151",
                              }}
                            >
                              {pitch.keyMessages.map((msg, idx) => (
                                <li key={idx} style={{ fontSize: "14px" }}>
                                  {msg}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        );
      } catch (error) {
        console.error("Error parsing media list content:", error);
        // Fallback to raw display
        return (
          <div
            style={{
              color: "#374151",
              lineHeight: "1.625",
              whiteSpace: "pre-wrap",
            }}
          >
            {content}
          </div>
        );
      }
    }

    // For other content types, display as before
    return (
      <div
        style={{
          color: "#374151",
          lineHeight: "1.625",
          whiteSpace: "pre-wrap",
        }}
      >
        {content}
      </div>
    );
  };

  // Trigger AI training
  const trainAI = async () => {
    setIsTraining(true);

    // Simulate training process
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Update AI status
    setAiStatus((prev) => ({
      ...prev,
      trained: true,
      lastTraining: new Date().toISOString(),
      modelVersion: "2.2",
      accuracy: Math.min(prev.accuracy + 1, 99),
    }));

    setIsTraining(false);

    // Show success message
    alert(
      "🧠 AI Model updated successfully! The system has learned from your content patterns."
    );
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f9fafb" }}>
      {/* Clean Header */}
      <div
        style={{ backgroundColor: "white", borderBottom: "1px solid #e5e7eb" }}
      >
        <div
          style={{ maxWidth: "1280px", margin: "0 auto", padding: "16px 24px" }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  background:
                    "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Brain
                  style={{ width: "24px", height: "24px", color: "white" }}
                />
              </div>
              <div>
                <h1
                  style={{
                    fontSize: "24px",
                    fontWeight: "600",
                    color: "#111827",
                    margin: 0,
                  }}
                >
                  MemoryVault
                </h1>
                <p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>
                  Intelligent Project Knowledge Base
                </p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {/* AI Status */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 16px",
                  backgroundColor: "#f9fafb",
                  borderRadius: "8px",
                }}
              >
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: isTraining ? "#fbbf24" : "#10b981",
                    animation: isTraining ? "pulse 1s infinite" : "none",
                  }}
                />
                <span style={{ fontSize: "14px", color: "#374151" }}>
                  AI {isTraining ? "Training" : "Active"}
                </span>
              </div>

              <button
                onClick={() => setShowTemplates(!showTemplates)}
                style={{
                  padding: "8px 16px",
                  color: "#374151",
                  backgroundColor: "transparent",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  transition: "background-color 0.2s",
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.backgroundColor = "#f9fafb")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.backgroundColor = "transparent")
                }
              >
                <FileText style={{ width: "16px", height: "16px" }} />
                Templates
              </button>

              <button
                onClick={() => setShowAiPanel(!showAiPanel)}
                style={{
                  padding: "8px 16px",
                  color: "#374151",
                  backgroundColor: "transparent",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  transition: "background-color 0.2s",
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.backgroundColor = "#f9fafb")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.backgroundColor = "transparent")
                }
              >
                <Sparkles style={{ width: "16px", height: "16px" }} />
                Insights
              </button>

              <button
                onClick={syncWithLibrary}
                disabled={isSyncing}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#111827",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: isSyncing ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  opacity: isSyncing ? 0.5 : 1,
                  transition: "all 0.2s",
                }}
              >
                <RefreshCw
                  style={{
                    width: "16px",
                    height: "16px",
                    animation: isSyncing ? "spin 1s linear infinite" : "none",
                  }}
                />
                {isSyncing ? "Syncing..." : "Sync"}
              </button>

              <button
                onClick={() => setUploadMode(true)}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#4f46e5",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  transition: "background-color 0.2s",
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.backgroundColor = "#4338ca")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.backgroundColor = "#4f46e5")
                }
              >
                <Upload style={{ width: "16px", height: "16px" }} />
                Upload
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Folder Navigation - Modern Grid */}
      <div
        style={{ backgroundColor: "white", borderBottom: "1px solid #e5e7eb" }}
      >
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "24px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: "16px",
            }}
          >
            {Object.entries(folderStructure).map(([key, folder]) => {
              const Icon = folder.icon;
              const stats = folderStats[key];
              const isActive = currentFolder === key;

              return (
                <button
                  key={key}
                  onClick={() => {
                    setCurrentFolder(key);
                    setCurrentSubfolder(null);
                    clearFilters();
                  }}
                  style={{
                    position: "relative",
                    padding: "20px",
                    borderRadius: "12px",
                    transition: "all 0.2s",
                    cursor: "pointer",
                    backgroundColor: isActive ? "#111827" : "white",
                    border: isActive ? "none" : "1px solid #e5e7eb",
                    boxShadow: isActive
                      ? "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
                      : "none",
                    transform: isActive ? "scale(1.05)" : "scale(1)",
                  }}
                  onMouseOver={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = "#f9fafb";
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = "white";
                    }
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "12px",
                    }}
                  >
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "10px",
                        backgroundColor: isActive
                          ? "rgba(255,255,255,0.2)"
                          : folder.bgColor,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Icon
                        style={{
                          width: "20px",
                          height: "20px",
                          color: isActive ? "white" : folder.color,
                        }}
                      />
                    </div>
                    {stats.recent > 0 && (
                      <span
                        style={{
                          fontSize: "12px",
                          padding: "2px 8px",
                          borderRadius: "9999px",
                          backgroundColor: isActive
                            ? "rgba(255,255,255,0.2)"
                            : "#d1fae5",
                          color: isActive ? "white" : "#047857",
                        }}
                      >
                        {stats.recent} new
                      </span>
                    )}
                  </div>
                  <h3
                    style={{
                      fontWeight: "500",
                      textAlign: "left",
                      marginBottom: "4px",
                      color: isActive ? "white" : "#111827",
                    }}
                  >
                    {folder.name}
                  </h3>
                  <p
                    style={{
                      fontSize: "12px",
                      textAlign: "left",
                      color: isActive ? "#d1d5db" : "#6b7280",
                      margin: 0,
                    }}
                  >
                    {stats.total} items
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Search and Filters - Cleaner Design */}
      <div
        style={{
          backgroundColor: "white",
          borderBottom: "1px solid #e5e7eb",
          position: "sticky",
          top: 0,
          zIndex: 40,
        }}
      >
        <div
          style={{ maxWidth: "1280px", margin: "0 auto", padding: "16px 24px" }}
        >
          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            {/* Search */}
            <div
              style={{
                flex: "1 1 auto",
                position: "relative",
                minWidth: "300px",
              }}
            >
              <Search
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#9ca3af",
                  width: "20px",
                  height: "20px",
                  pointerEvents: "none",
                }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search in ${currentFolderData.name}...`}
                style={{
                  width: "100%",
                  paddingLeft: "44px",
                  paddingRight: searchQuery ? "48px" : "16px",
                  paddingTop: "10px",
                  paddingBottom: "10px",
                  backgroundColor: "#f9fafb",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  outline: "none",
                  transition: "all 0.2s",
                  fontSize: "14px",
                  color: "#111827",
                }}
                onFocus={(e) => {
                  e.target.style.backgroundColor = "white";
                  e.target.style.borderColor = "#4f46e5";
                  e.target.style.boxShadow = "0 0 0 3px rgba(79, 70, 229, 0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.backgroundColor = "#f9fafb";
                  e.target.style.borderColor = "#e5e7eb";
                  e.target.style.boxShadow = "none";
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setAiSearchMode(!aiSearchMode)}
                  style={{
                    position: "absolute",
                    right: "8px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    padding: "4px 8px",
                    fontSize: "12px",
                    borderRadius: "6px",
                    border: "none",
                    cursor: "pointer",
                    backgroundColor: aiSearchMode ? "#e0e7ff" : "#f3f4f6",
                    color: aiSearchMode ? "#4338ca" : "#4b5563",
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  title={aiSearchMode ? "AI Search Active" : "Enable AI Search"}
                >
                  <Bot style={{ width: "16px", height: "16px" }} />
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: "10px 12px",
                paddingRight: "32px",
                backgroundColor: "#f9fafb",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                cursor: "pointer",
                outline: "none",
                fontSize: "14px",
                color: "#374151",
                minWidth: "140px",
                appearance: "none",
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 12px center",
              }}
            >
              <option value="date">Latest</option>
              <option value="modified">Modified</option>
              <option value="views">Most Viewed</option>
              <option value="title">Title (A-Z)</option>
              <option value="ai-score">AI Score</option>
            </select>

            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 16px",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.2s",
                backgroundColor: showFilters ? "#e0e7ff" : "#f9fafb",
                color: showFilters ? "#4338ca" : "#374151",
                border: showFilters ? "1px solid #c7d2fe" : "1px solid #e5e7eb",
                fontSize: "14px",
                whiteSpace: "nowrap",
              }}
            >
              <Filter style={{ width: "16px", height: "16px" }} />
              Filters
              {(selectedTags.length > 0 ||
                dateRange.start ||
                dateRange.end) && (
                <span
                  style={{
                    backgroundColor: "#4f46e5",
                    color: "white",
                    fontSize: "12px",
                    padding: "2px 8px",
                    borderRadius: "9999px",
                    marginLeft: "4px",
                  }}
                >
                  {selectedTags.length +
                    (dateRange.start || dateRange.end ? 1 : 0)}
                </span>
              )}
            </button>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div
              style={{
                marginTop: "16px",
                padding: "16px",
                backgroundColor: "#f9fafb",
                borderRadius: "8px",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                  marginBottom: "16px",
                }}
              >
                {/* Date Range */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#374151",
                      marginBottom: "8px",
                    }}
                  >
                    Date Range
                  </label>
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      alignItems: "center",
                    }}
                  >
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) =>
                        setDateRange((prev) => ({
                          ...prev,
                          start: e.target.value,
                        }))
                      }
                      style={{
                        flex: 1,
                        padding: "8px 12px",
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        outline: "none",
                      }}
                    />
                    <span style={{ color: "#6b7280" }}>to</span>
                    <input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) =>
                        setDateRange((prev) => ({
                          ...prev,
                          end: e.target.value,
                        }))
                      }
                      style={{
                        flex: 1,
                        padding: "8px 12px",
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        outline: "none",
                      }}
                    />
                  </div>
                </div>

                {/* View Mode */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#374151",
                      marginBottom: "8px",
                    }}
                  >
                    View Mode
                  </label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => setViewMode("grid")}
                      style={{
                        flex: 1,
                        padding: "8px",
                        borderRadius: "8px",
                        border: "1px solid",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        backgroundColor:
                          viewMode === "grid" ? "#111827" : "white",
                        color: viewMode === "grid" ? "white" : "#111827",
                        borderColor:
                          viewMode === "grid" ? "#111827" : "#e5e7eb",
                      }}
                    >
                      <Grid
                        style={{
                          width: "16px",
                          height: "16px",
                          margin: "0 auto",
                        }}
                      />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      style={{
                        flex: 1,
                        padding: "8px",
                        borderRadius: "8px",
                        border: "1px solid",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        backgroundColor:
                          viewMode === "list" ? "#111827" : "white",
                        color: viewMode === "list" ? "white" : "#111827",
                        borderColor:
                          viewMode === "list" ? "#111827" : "#e5e7eb",
                      }}
                    >
                      <List
                        style={{
                          width: "16px",
                          height: "16px",
                          margin: "0 auto",
                        }}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#374151",
                    marginBottom: "8px",
                  }}
                >
                  Tags
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {availableTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "9999px",
                        fontSize: "14px",
                        border: selectedTags.includes(tag)
                          ? "none"
                          : "1px solid #e5e7eb",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        backgroundColor: selectedTags.includes(tag)
                          ? "#4f46e5"
                          : "white",
                        color: selectedTags.includes(tag) ? "white" : "#374151",
                      }}
                      onMouseOver={(e) => {
                        if (!selectedTags.includes(tag)) {
                          e.currentTarget.style.backgroundColor = "#f9fafb";
                        }
                      }}
                      onMouseOut={(e) => {
                        if (!selectedTags.includes(tag)) {
                          e.currentTarget.style.backgroundColor = "white";
                        }
                      }}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div
                style={{
                  marginTop: "16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <button
                  onClick={clearFilters}
                  style={{
                    fontSize: "14px",
                    color: "#4b5563",
                    backgroundColor: "transparent",
                    border: "none",
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  Clear all filters
                </button>
                <span style={{ fontSize: "14px", color: "#4b5563" }}>
                  Showing {filteredContent.length} of {currentContent.length}{" "}
                  items
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div
        style={{ maxWidth: "1280px", margin: "0 auto", padding: "32px 24px" }}
      >
        {/* Folder Header */}
        <div
          style={{
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                backgroundColor: currentFolderData.bgColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {React.createElement(currentFolderData.icon, {
                style: {
                  width: "20px",
                  height: "20px",
                  color: currentFolderData.color,
                },
              })}
            </div>
            <div>
              <h2
                style={{
                  fontSize: "20px",
                  fontWeight: "600",
                  color: "#111827",
                  margin: 0,
                }}
              >
                {currentFolderData.name}
              </h2>
              <p
                style={{
                  fontSize: "14px",
                  color: "#6b7280",
                  margin: 0,
                }}
              >
                {currentFolderData.description}
              </p>
            </div>
          </div>

          {/* Subfolder Navigation */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              onClick={() => setCurrentSubfolder(null)}
              style={{
                padding: "6px 12px",
                borderRadius: "8px",
                fontSize: "14px",
                border: "none",
                cursor: "pointer",
                transition: "all 0.2s",
                backgroundColor: !currentSubfolder ? "#111827" : "transparent",
                color: !currentSubfolder ? "white" : "#4b5563",
              }}
              onMouseOver={(e) => {
                if (currentSubfolder) {
                  e.currentTarget.style.backgroundColor = "#f3f4f6";
                }
              }}
              onMouseOut={(e) => {
                if (currentSubfolder) {
                  e.currentTarget.style.backgroundColor = "transparent";
                }
              }}
            >
              All Files
            </button>
            {currentSubfolders.map((subfolder) => (
              <button
                key={subfolder.id}
                onClick={() => setCurrentSubfolder(subfolder.id)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "8px",
                  fontSize: "14px",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  backgroundColor:
                    currentSubfolder === subfolder.id
                      ? "#111827"
                      : "transparent",
                  color:
                    currentSubfolder === subfolder.id ? "white" : "#4b5563",
                }}
                onMouseOver={(e) => {
                  if (currentSubfolder !== subfolder.id) {
                    e.currentTarget.style.backgroundColor = "#f3f4f6";
                  }
                }}
                onMouseOut={(e) => {
                  if (currentSubfolder !== subfolder.id) {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }
                }}
              >
                {subfolder.name}
                <span style={{ marginLeft: "4px", opacity: 0.6 }}>
                  ({subfolder.itemCount})
                </span>
              </button>
            ))}
            <button
              onClick={() => setShowCreateSubfolder(true)}
              style={{
                padding: "6px",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                backgroundColor: "transparent",
                color: "#4b5563",
                transition: "all 0.2s",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.backgroundColor = "#f3f4f6")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.backgroundColor = "transparent")
              }
            >
              <Plus style={{ width: "16px", height: "16px" }} />
            </button>
          </div>
        </div>

        {/* Content Display - Modern Cards */}
        {filteredContent.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "64px",
              backgroundColor: "white",
              borderRadius: "12px",
              border: "1px solid #e5e7eb",
            }}
          >
            <Folder
              style={{
                width: "48px",
                height: "48px",
                color: "#9ca3af",
                marginBottom: "16px",
              }}
            />
            <p
              style={{
                color: "#111827",
                fontSize: "18px",
                fontWeight: "500",
                marginBottom: "4px",
              }}
            >
              No items found
            </p>
            <p style={{ color: "#6b7280", fontSize: "14px" }}>
              Try adjusting your filters or search terms
            </p>
          </div>
        ) : viewMode === "grid" ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
              gap: "16px",
            }}
          >
            {filteredContent.map((item) => (
              <div
                key={item.id}
                style={{
                  backgroundColor: "white",
                  borderRadius: "12px",
                  border: "1px solid #e5e7eb",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onClick={() => openContentViewer(item)}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = "#d1d5db";
                  e.currentTarget.style.boxShadow =
                    "0 10px 15px -3px rgba(0, 0, 0, 0.1)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = "#e5e7eb";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={{ padding: "20px" }}>
                  {/* Header */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      marginBottom: "12px",
                    }}
                  >
                    <h3
                      style={{
                        fontWeight: "500",
                        color: "#111827",
                        overflow: "hidden",
                        display: "-webkit-box",
                        WebkitBoxOrient: "vertical",
                        WebkitLineClamp: 2,
                        flex: 1,
                        marginRight: "8px",
                        transition: "color 0.2s",
                      }}
                    >
                      {item.title}
                    </h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleStar(item.id);
                      }}
                      style={{
                        padding: "6px",
                        borderRadius: "8px",
                        border: "none",
                        backgroundColor: "transparent",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        color: item.starred ? "#eab308" : "#9ca3af",
                      }}
                      onMouseOver={(e) =>
                        (e.currentTarget.style.backgroundColor = "#f3f4f6")
                      }
                      onMouseOut={(e) =>
                        (e.currentTarget.style.backgroundColor = "transparent")
                      }
                    >
                      <Star
                        style={{ width: "16px", height: "16px" }}
                        fill={item.starred ? "currentColor" : "none"}
                      />
                    </button>
                  </div>

                  {/* Preview */}
                  <p
                    style={{
                      color: "#4b5563",
                      fontSize: "14px",
                      overflow: "hidden",
                      display: "-webkit-box",
                      WebkitBoxOrient: "vertical",
                      WebkitLineClamp: 3,
                      marginBottom: "16px",
                    }}
                  >
                    {item.preview}
                  </p>

                  {/* Tags */}
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "6px",
                      marginBottom: "16px",
                    }}
                  >
                    {item.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        style={{
                          fontSize: "12px",
                          backgroundColor: "#f3f4f6",
                          color: "#4b5563",
                          padding: "4px 8px",
                          borderRadius: "6px",
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                    {item.tags.length > 3 && (
                      <span style={{ fontSize: "12px", color: "#6b7280" }}>
                        +{item.tags.length - 3}
                      </span>
                    )}
                  </div>

                  {/* Footer */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingTop: "12px",
                      borderTop: "1px solid #f3f4f6",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        fontSize: "12px",
                        color: "#6b7280",
                      }}
                    >
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <Calendar style={{ width: "12px", height: "12px" }} />
                        {new Date(item.date).toLocaleDateString()}
                      </span>
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <Eye style={{ width: "12px", height: "12px" }} />
                        {item.views || 0}
                      </span>
                    </div>

                    {item.aiScore && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <Sparkles
                          style={{
                            width: "12px",
                            height: "12px",
                            color: "#4f46e5",
                          }}
                        />
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: "500",
                            color: "#374151",
                          }}
                        >
                          {item.aiScore}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              border: "1px solid #e5e7eb",
              overflow: "hidden",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ backgroundColor: "#f9fafb" }}>
                <tr>
                  <th
                    style={{
                      padding: "12px 24px",
                      textAlign: "left",
                      fontSize: "12px",
                      fontWeight: "500",
                      color: "#6b7280",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Title
                  </th>
                  <th
                    style={{
                      padding: "12px 24px",
                      textAlign: "left",
                      fontSize: "12px",
                      fontWeight: "500",
                      color: "#6b7280",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Type
                  </th>
                  <th
                    style={{
                      padding: "12px 24px",
                      textAlign: "left",
                      fontSize: "12px",
                      fontWeight: "500",
                      color: "#6b7280",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Author
                  </th>
                  <th
                    style={{
                      padding: "12px 24px",
                      textAlign: "left",
                      fontSize: "12px",
                      fontWeight: "500",
                      color: "#6b7280",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Date
                  </th>
                  <th
                    style={{
                      padding: "12px 24px",
                      textAlign: "left",
                      fontSize: "12px",
                      fontWeight: "500",
                      color: "#6b7280",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    AI Score
                  </th>
                  <th
                    style={{
                      padding: "12px 24px",
                      textAlign: "left",
                      fontSize: "12px",
                      fontWeight: "500",
                      color: "#6b7280",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredContent.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => openContentViewer(item)}
                    style={{
                      cursor: "pointer",
                      borderTop: "1px solid #e5e7eb",
                      transition: "background-color 0.2s",
                    }}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.backgroundColor = "#f9fafb")
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.backgroundColor = "transparent")
                    }
                  >
                    <td style={{ padding: "16px 24px", whiteSpace: "nowrap" }}>
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleStar(item.id);
                          }}
                          style={{
                            marginRight: "12px",
                            border: "none",
                            backgroundColor: "transparent",
                            cursor: "pointer",
                            color: item.starred ? "#eab308" : "#9ca3af",
                          }}
                        >
                          <Star
                            style={{ width: "16px", height: "16px" }}
                            fill={item.starred ? "currentColor" : "none"}
                          />
                        </button>
                        <div
                          style={{
                            fontSize: "14px",
                            fontWeight: "500",
                            color: "#111827",
                          }}
                        >
                          {item.title}
                        </div>
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "16px 24px",
                        whiteSpace: "nowrap",
                        fontSize: "14px",
                        color: "#6b7280",
                      }}
                    >
                      {item.type}
                    </td>
                    <td
                      style={{
                        padding: "16px 24px",
                        whiteSpace: "nowrap",
                        fontSize: "14px",
                        color: "#6b7280",
                      }}
                    >
                      {item.author}
                    </td>
                    <td
                      style={{
                        padding: "16px 24px",
                        whiteSpace: "nowrap",
                        fontSize: "14px",
                        color: "#6b7280",
                      }}
                    >
                      {new Date(item.date).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "16px 24px", whiteSpace: "nowrap" }}>
                      {item.aiScore && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <div
                            style={{
                              width: "80px",
                              backgroundColor: "#e5e7eb",
                              borderRadius: "9999px",
                              height: "8px",
                            }}
                          >
                            <div
                              style={{
                                height: "8px",
                                borderRadius: "9999px",
                                transition: "all 0.2s",
                                backgroundColor:
                                  item.aiScore >= 90
                                    ? "#10b981"
                                    : item.aiScore >= 70
                                    ? "#3b82f6"
                                    : "#6b7280",
                                width: `${item.aiScore}%`,
                              }}
                            />
                          </div>
                          <span style={{ fontSize: "12px", color: "#4b5563" }}>
                            {item.aiScore}%
                          </span>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "16px 24px", whiteSpace: "nowrap" }}>
                      <span
                        style={{
                          padding: "4px 8px",
                          fontSize: "12px",
                          borderRadius: "6px",
                          fontWeight: "500",
                          backgroundColor:
                            item.status === "approved" ||
                            item.status === "published" ||
                            item.status === "finalized" ||
                            item.status === "active" ||
                            item.status === "processed"
                              ? "#d1fae5"
                              : item.status === "draft" ||
                                item.status === "in-review" ||
                                item.status === "processing"
                              ? "#fef3c7"
                              : "#f3f4f6",
                          color:
                            item.status === "approved" ||
                            item.status === "published" ||
                            item.status === "finalized" ||
                            item.status === "active" ||
                            item.status === "processed"
                              ? "#047857"
                              : item.status === "draft" ||
                                item.status === "in-review" ||
                                item.status === "processing"
                              ? "#b45309"
                              : "#374151",
                        }}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Upload Modal - Simplified */}
      {uploadMode && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            padding: "16px",
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              width: "100%",
              maxWidth: "36rem",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "24px",
                borderBottom: "1px solid #f3f4f6",
              }}
            >
              <h3
                style={{
                  fontSize: "18px",
                  fontWeight: "600",
                  color: "#111827",
                }}
              >
                Upload Documents
              </h3>
              <button
                onClick={() => setUploadMode(false)}
                style={{
                  color: "#9ca3af",
                  padding: "8px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: "transparent",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.color = "#4b5563";
                  e.currentTarget.style.backgroundColor = "#f3f4f6";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.color = "#9ca3af";
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <X style={{ width: "20px", height: "20px" }} />
              </button>
            </div>

            <div style={{ padding: "24px" }}>
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                style={{
                  border: "2px dashed",
                  borderColor: isDragging ? "#4f46e5" : "#d1d5db",
                  borderRadius: "12px",
                  padding: "48px",
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  backgroundColor: isDragging ? "#e0e7ff" : "transparent",
                }}
                onMouseOver={(e) => {
                  if (!isDragging) {
                    e.currentTarget.style.borderColor = "#9ca3af";
                    e.currentTarget.style.backgroundColor = "#f9fafb";
                  }
                }}
                onMouseOut={(e) => {
                  if (!isDragging) {
                    e.currentTarget.style.borderColor = "#d1d5db";
                    e.currentTarget.style.backgroundColor = "transparent";
                  }
                }}
              >
                <Upload
                  style={{
                    width: "48px",
                    height: "48px",
                    color: "#9ca3af",
                    margin: "0 auto 16px",
                  }}
                />
                <h3
                  style={{
                    fontSize: "16px",
                    fontWeight: "500",
                    color: "#111827",
                    marginBottom: "8px",
                  }}
                >
                  Drop files here or click to browse
                </h3>
                <p style={{ fontSize: "14px", color: "#6b7280" }}>
                  Files will be analyzed by AI for insights
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={(e) => processFiles(Array.from(e.target.files))}
                style={{ display: "none" }}
              />

              <div
                style={{
                  marginTop: "24px",
                  backgroundColor: "#e0e7ff",
                  borderRadius: "8px",
                  padding: "16px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                  }}
                >
                  <Brain
                    style={{
                      width: "20px",
                      height: "20px",
                      color: "#4f46e5",
                      marginTop: "2px",
                    }}
                  />
                  <div>
                    <h4 style={{ fontWeight: "500", color: "#312e81" }}>
                      AI Analysis
                    </h4>
                    <p
                      style={{
                        fontSize: "14px",
                        color: "#4338ca",
                        marginTop: "4px",
                      }}
                    >
                      Documents will be processed to extract insights, generate
                      tags, and improve search accuracy.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Insights Panel - Modernized */}
      {showAiPanel && (
        <div
          style={{
            position: "fixed",
            right: 0,
            top: 0,
            width: "384px",
            height: "100vh",
            backgroundColor: "white",
            boxShadow: "-10px 0 15px -3px rgba(0, 0, 0, 0.1)",
            borderLeft: "1px solid #e5e7eb",
            zIndex: 40,
            overflowY: "auto",
          }}
        >
          <div
            style={{
              position: "sticky",
              top: 0,
              backgroundColor: "white",
              padding: "24px",
              borderBottom: "1px solid #e5e7eb",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3
                style={{
                  fontSize: "18px",
                  fontWeight: "600",
                  color: "#111827",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Sparkles
                  style={{ width: "20px", height: "20px", color: "#4f46e5" }}
                />
                AI Insights
              </h3>
              <button
                onClick={() => setShowAiPanel(false)}
                style={{
                  color: "#9ca3af",
                  padding: "8px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: "transparent",
                  cursor: "pointer",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.color = "#4b5563";
                  e.currentTarget.style.backgroundColor = "#f3f4f6";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.color = "#9ca3af";
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <X style={{ width: "16px", height: "16px" }} />
              </button>
            </div>
          </div>

          <div style={{ padding: "24px" }}>
            {/* Content Trends */}
            <div
              style={{
                background:
                  "linear-gradient(to bottom right, #f3e8ff, #e0e7ff)",
                borderRadius: "12px",
                padding: "16px",
                marginBottom: "24px",
              }}
            >
              <h4
                style={{
                  fontWeight: "500",
                  color: "#111827",
                  marginBottom: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <TrendingUp
                  style={{ width: "16px", height: "16px", color: "#8b5cf6" }}
                />
                Content Trends
              </h4>
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontSize: "14px", color: "#4b5563" }}>
                    Top Topic
                  </span>
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#111827",
                    }}
                  >
                    AI Innovation
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontSize: "14px", color: "#4b5563" }}>
                    Rising Searches
                  </span>
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#059669",
                    }}
                  >
                    +45% "2025"
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontSize: "14px", color: "#4b5563" }}>
                    Best Performer
                  </span>
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#111827",
                    }}
                  >
                    Press Releases
                  </span>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div style={{ marginBottom: "24px" }}>
              <h4
                style={{
                  fontWeight: "500",
                  color: "#111827",
                  marginBottom: "12px",
                }}
              >
                Recommendations
              </h4>
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                <div
                  style={{
                    padding: "12px",
                    backgroundColor: "#dbeafe",
                    borderRadius: "8px",
                  }}
                >
                  <p style={{ fontSize: "14px", color: "#1e3a8a" }}>
                    Create more Q1 2025 content based on search patterns
                  </p>
                </div>
                <div
                  style={{
                    padding: "12px",
                    backgroundColor: "#d1fae5",
                    borderRadius: "8px",
                  }}
                >
                  <p style={{ fontSize: "14px", color: "#064e3b" }}>
                    AI Innovation content shows 3x higher engagement
                  </p>
                </div>
                <div
                  style={{
                    padding: "12px",
                    backgroundColor: "#fef3c7",
                    borderRadius: "8px",
                  }}
                >
                  <p style={{ fontSize: "14px", color: "#78350f" }}>
                    12 media contacts need updating
                  </p>
                </div>
              </div>
            </div>

            {/* Quality Score */}
            <div>
              <h4
                style={{
                  fontWeight: "500",
                  color: "#111827",
                  marginBottom: "12px",
                }}
              >
                Content Quality
              </h4>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "14px",
                      marginBottom: "4px",
                    }}
                  >
                    <span style={{ color: "#4b5563" }}>Overall Score</span>
                    <span style={{ fontWeight: "500" }}>87%</span>
                  </div>
                  <div
                    style={{
                      backgroundColor: "#e5e7eb",
                      borderRadius: "9999px",
                      height: "8px",
                    }}
                  >
                    <div
                      style={{
                        background:
                          "linear-gradient(to right, #4f46e5, #a855f7)",
                        height: "8px",
                        borderRadius: "9999px",
                        width: "87%",
                      }}
                    />
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                    fontSize: "14px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      color: "#047857",
                    }}
                  >
                    <Check style={{ width: "12px", height: "12px" }} />
                    <span>Consistent brand voice</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      color: "#047857",
                    }}
                  >
                    <Check style={{ width: "12px", height: "12px" }} />
                    <span>Strong data usage</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      color: "#b45309",
                    }}
                  >
                    <AlertCircle style={{ width: "12px", height: "12px" }} />
                    <span>Add more visuals</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content Viewer Modal - Enhanced */}
      {contentViewer.visible && contentViewer.content && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            padding: "16px",
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              width: "100%",
              maxWidth: "56rem",
              maxHeight: "90vh",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                padding: "24px",
                borderBottom: "1px solid #f3f4f6",
              }}
            >
              <div style={{ flex: 1 }}>
                <h3
                  style={{
                    fontSize: "20px",
                    fontWeight: "600",
                    color: "#111827",
                    marginBottom: "8px",
                  }}
                >
                  {contentViewer.content.title}
                </h3>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    fontSize: "14px",
                    color: "#4b5563",
                  }}
                >
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <Calendar style={{ width: "16px", height: "16px" }} />
                    {new Date(contentViewer.content.date).toLocaleDateString()}
                  </span>
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <Eye style={{ width: "16px", height: "16px" }} />
                    {contentViewer.content.views} views
                  </span>
                  {contentViewer.content.aiScore && (
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        color: "#4f46e5",
                      }}
                    >
                      <Sparkles style={{ width: "16px", height: "16px" }} />
                      {contentViewer.content.aiScore}% AI Score
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() =>
                  setContentViewer({ visible: false, content: null })
                }
                style={{
                  color: "#9ca3af",
                  padding: "8px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: "transparent",
                  cursor: "pointer",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.color = "#4b5563";
                  e.currentTarget.style.backgroundColor = "#f3f4f6";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.color = "#9ca3af";
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <X style={{ width: "20px", height: "20px" }} />
              </button>
            </div>

            <div
              style={{ padding: "24px", overflowY: "auto", maxHeight: "60vh" }}
            >
              {/* AI Insights */}
              {contentViewer.content.aiInsights &&
                contentViewer.content.aiInsights.length > 0 && (
                  <div
                    style={{
                      marginBottom: "24px",
                      backgroundColor: "#e0e7ff",
                      borderRadius: "8px",
                      padding: "16px",
                    }}
                  >
                    <h4
                      style={{
                        fontWeight: "500",
                        color: "#312e81",
                        marginBottom: "8px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <Bot style={{ width: "16px", height: "16px" }} />
                      AI Analysis
                    </h4>
                    <ul
                      style={{
                        margin: 0,
                        paddingLeft: "20px",
                        fontSize: "14px",
                        color: "#4338ca",
                      }}
                    >
                      {contentViewer.content.aiInsights.map((insight, idx) => (
                        <li key={idx} style={{ marginBottom: "4px" }}>
                          {insight}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              {/* Tags */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                  marginBottom: "24px",
                }}
              >
                {contentViewer.content.tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      backgroundColor: "#f3f4f6",
                      color: "#374151",
                      padding: "6px 12px",
                      borderRadius: "6px",
                      fontSize: "14px",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Content */}
              <ContentDisplay
                content={
                  contentViewer.content.content || contentViewer.content.preview
                }
                type={contentViewer.content.type}
              />
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "24px",
                borderTop: "1px solid #f3f4f6",
                backgroundColor: "#f9fafb",
              }}
            >
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      contentViewer.content.content ||
                        contentViewer.content.preview
                    );
                    alert("Content copied to clipboard!");
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 16px",
                    color: "#374151",
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.backgroundColor = "#f9fafb")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.backgroundColor = "white")
                  }
                >
                  <Copy style={{ width: "16px", height: "16px" }} />
                  Copy
                </button>
                <button
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 16px",
                    color: "#374151",
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.backgroundColor = "#f9fafb")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.backgroundColor = "white")
                  }
                >
                  <Download style={{ width: "16px", height: "16px" }} />
                  Export
                </button>
                <button
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 16px",
                    color: "#4338ca",
                    backgroundColor: "#e0e7ff",
                    border: "1px solid #c7d2fe",
                    borderRadius: "8px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.backgroundColor = "#c7d2fe")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.backgroundColor = "#e0e7ff")
                  }
                >
                  <Sparkles style={{ width: "16px", height: "16px" }} />
                  AI Enhance
                </button>
              </div>
              <button
                onClick={() =>
                  setContentViewer({ visible: false, content: null })
                }
                style={{
                  padding: "8px 16px",
                  color: "#4b5563",
                  backgroundColor: "transparent",
                  border: "none",
                  cursor: "pointer",
                  transition: "color 0.2s",
                }}
                onMouseOver={(e) => (e.currentTarget.style.color = "#111827")}
                onMouseOut={(e) => (e.currentTarget.style.color = "#4b5563")}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Subfolder Modal */}
      {showCreateSubfolder && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            padding: "16px",
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              width: "100%",
              maxWidth: "28rem",
            }}
          >
            <div
              style={{
                padding: "24px",
                borderBottom: "1px solid #f3f4f6",
              }}
            >
              <h3
                style={{
                  fontSize: "18px",
                  fontWeight: "600",
                  color: "#111827",
                }}
              >
                Create New Folder
              </h3>
            </div>

            <div style={{ padding: "24px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#374151",
                  marginBottom: "8px",
                }}
              >
                Folder Name
              </label>
              <input
                type="text"
                value={newSubfolderName}
                onChange={(e) => setNewSubfolderName(e.target.value)}
                placeholder="e.g., Q1 2025 Campaign"
                style={{
                  width: "100%",
                  padding: "10px 16px",
                  backgroundColor: "#f9fafb",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  outline: "none",
                }}
                onFocus={(e) => {
                  e.target.style.backgroundColor = "white";
                  e.target.style.borderColor = "#4f46e5";
                }}
                onBlur={(e) => {
                  e.target.style.backgroundColor = "#f9fafb";
                  e.target.style.borderColor = "#e5e7eb";
                }}
                autoFocus
              />

              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  justifyContent: "flex-end",
                  marginTop: "24px",
                }}
              >
                <button
                  onClick={() => {
                    setShowCreateSubfolder(false);
                    setNewSubfolderName("");
                  }}
                  style={{
                    padding: "8px 16px",
                    fontSize: "14px",
                    color: "#4b5563",
                    backgroundColor: "transparent",
                    border: "none",
                    cursor: "pointer",
                    transition: "color 0.2s",
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.color = "#111827")}
                  onMouseOut={(e) => (e.currentTarget.style.color = "#4b5563")}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateSubfolder}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#4f46e5",
                    color: "white",
                    fontSize: "14px",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    transition: "background-color 0.2s",
                  }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.backgroundColor = "#4338ca")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.backgroundColor = "#4f46e5")
                  }
                >
                  Create Folder
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Templates Modal */}
      {showTemplates && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            padding: "16px",
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              width: "100%",
              maxWidth: "80rem",
              maxHeight: "90vh",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "24px",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              <div>
                <h3
                  style={{
                    fontSize: "20px",
                    fontWeight: "600",
                    color: "#111827",
                  }}
                >
                  Template Library
                </h3>
                <p
                  style={{
                    fontSize: "14px",
                    color: "#4b5563",
                    marginTop: "4px",
                  }}
                >
                  Manage and organize your company templates with AI assistance
                </p>
              </div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "6px 12px",
                    borderRadius: "8px",
                    backgroundColor: "#f3e8ff",
                    color: "#7c3aed",
                  }}
                >
                  <Brain style={{ width: "16px", height: "16px" }} />
                  <span style={{ fontSize: "14px", fontWeight: "500" }}>
                    {templates.filter((t) => t.aiScore > 0).length} AI-Enhanced
                  </span>
                </div>
                <button
                  onClick={() => setTemplateUploadModal(true)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    backgroundColor: "#4f46e5",
                    color: "white",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "14px",
                    transition: "background-color 0.2s",
                  }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.backgroundColor = "#4338ca")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.backgroundColor = "#4f46e5")
                  }
                >
                  <Upload style={{ width: "16px", height: "16px" }} />
                  Add Template
                </button>
                <button
                  onClick={() => setShowTemplates(false)}
                  style={{
                    color: "#9ca3af",
                    padding: "8px",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: "transparent",
                    cursor: "pointer",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.color = "#4b5563";
                    e.currentTarget.style.backgroundColor = "#f3f4f6";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.color = "#9ca3af";
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <X style={{ width: "20px", height: "20px" }} />
                </button>
              </div>
            </div>

            <div style={{ padding: "24px" }}>
              {/* Search and Filter Bar */}
              <div
                style={{ display: "flex", gap: "16px", marginBottom: "24px" }}
              >
                <div style={{ flex: 1, position: "relative" }}>
                  <Search
                    style={{
                      position: "absolute",
                      left: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#9ca3af",
                      width: "20px",
                      height: "20px",
                    }}
                  />
                  <input
                    type="text"
                    value={templateSearchQuery}
                    onChange={(e) => setTemplateSearchQuery(e.target.value)}
                    placeholder="Search templates..."
                    style={{
                      width: "100%",
                      paddingLeft: "40px",
                      paddingRight: "16px",
                      paddingTop: "10px",
                      paddingBottom: "10px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      outline: "none",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#4f46e5")}
                    onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
                  />
                </div>
                <select
                  value={selectedTemplateCategory}
                  onChange={(e) => setSelectedTemplateCategory(e.target.value)}
                  style={{
                    padding: "10px 16px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    backgroundColor: "white",
                    cursor: "pointer",
                    outline: "none",
                  }}
                >
                  <option value="all">All Categories</option>
                  <option value="Presentation">Presentations</option>
                  <option value="Document">Documents</option>
                  <option value="Report">Reports</option>
                  <option value="Form">Forms</option>
                  <option value="Email">Email Templates</option>
                </select>
              </div>

              {/* Templates Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                  gap: "16px",
                  maxHeight: "50vh",
                  overflowY: "auto",
                }}
              >
                {filteredTemplates.map((template) => {
                  const getFileIcon = () => {
                    if (template.fileType === "word") return "📄";
                    if (template.fileType === "powerpoint") return "📊";
                    if (template.fileType === "excel") return "📈";
                    if (template.fileType === "email") return "📧";
                    return "📝";
                  };

                  return (
                    <div
                      key={template.id}
                      style={{
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        padding: "16px",
                        cursor: "pointer",
                        position: "relative",
                        transition: "all 0.2s",
                      }}
                      onClick={() => setSelectedTemplate(template)}
                      onMouseOver={(e) => {
                        e.currentTarget.style.boxShadow =
                          "0 4px 6px -1px rgba(0, 0, 0, 0.1)";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      {/* AI Score Badge */}
                      {template.aiScore && (
                        <div
                          style={{
                            position: "absolute",
                            top: "8px",
                            right: "8px",
                            padding: "4px 8px",
                            borderRadius: "9999px",
                            fontSize: "12px",
                            fontWeight: "500",
                            backgroundColor:
                              template.aiScore >= 90
                                ? "#d1fae5"
                                : template.aiScore >= 70
                                ? "#dbeafe"
                                : "#f3f4f6",
                            color:
                              template.aiScore >= 90
                                ? "#047857"
                                : template.aiScore >= 70
                                ? "#1e40af"
                                : "#374151",
                          }}
                        >
                          <Sparkles
                            style={{
                              width: "12px",
                              height: "12px",
                              display: "inline",
                              marginRight: "4px",
                            }}
                          />
                          {template.aiScore}%
                        </div>
                      )}

                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "12px",
                        }}
                      >
                        <div style={{ fontSize: "30px", flexShrink: 0 }}>
                          {getFileIcon()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h4
                            style={{
                              fontWeight: "600",
                              color: "#111827",
                              fontSize: "14px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {template.name}
                          </h4>
                          <p
                            style={{
                              fontSize: "12px",
                              color: "#4b5563",
                              marginTop: "4px",
                              overflow: "hidden",
                              display: "-webkit-box",
                              WebkitBoxOrient: "vertical",
                              WebkitLineClamp: 2,
                            }}
                          >
                            {template.description}
                          </p>

                          <div style={{ marginTop: "12px" }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                fontSize: "12px",
                                color: "#6b7280",
                              }}
                            >
                              <span
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                              >
                                <Clock
                                  style={{ width: "12px", height: "12px" }}
                                />
                                {new Date(
                                  template.lastUsed
                                ).toLocaleDateString()}
                              </span>
                              <span
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                              >
                                <TrendingUp
                                  style={{ width: "12px", height: "12px" }}
                                />
                                {template.useCount} uses
                              </span>
                            </div>

                            <div
                              style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "4px",
                                marginTop: "8px",
                              }}
                            >
                              {template.tags.slice(0, 2).map((tag) => (
                                <span
                                  key={tag}
                                  style={{
                                    fontSize: "12px",
                                    backgroundColor: "#f3f4f6",
                                    color: "#4b5563",
                                    padding: "2px 8px",
                                    borderRadius: "4px",
                                  }}
                                >
                                  #{tag}
                                </span>
                              ))}
                              {template.tags.length > 2 && (
                                <span
                                  style={{ fontSize: "12px", color: "#6b7280" }}
                                >
                                  +{template.tags.length - 2}
                                </span>
                              )}
                            </div>
                          </div>

                          <div
                            style={{
                              marginTop: "8px",
                              display: "flex",
                              gap: "8px",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "12px",
                                padding: "2px 8px",
                                borderRadius: "9999px",
                                backgroundColor:
                                  template.category === "Presentation"
                                    ? "#f3e8ff"
                                    : template.category === "Document"
                                    ? "#dbeafe"
                                    : template.category === "Report"
                                    ? "#d1fae5"
                                    : template.category === "Form"
                                    ? "#fef3c7"
                                    : "#f3f4f6",
                                color:
                                  template.category === "Presentation"
                                    ? "#7c3aed"
                                    : template.category === "Document"
                                    ? "#1e40af"
                                    : template.category === "Report"
                                    ? "#047857"
                                    : template.category === "Form"
                                    ? "#b45309"
                                    : "#374151",
                              }}
                            >
                              {template.category}
                            </span>
                            {template.fileSize && (
                              <span
                                style={{ fontSize: "12px", color: "#6b7280" }}
                              >
                                {template.fileSize}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* AI Learning Status */}
              <div
                style={{
                  marginTop: "24px",
                  background: "linear-gradient(to right, #f3e8ff, #dbeafe)",
                  borderRadius: "8px",
                  padding: "16px",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <Brain
                    style={{ width: "20px", height: "20px", color: "#7c3aed" }}
                  />
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontWeight: "600", color: "#111827" }}>
                      Template AI Learning
                    </h4>
                    <p
                      style={{
                        fontSize: "14px",
                        color: "#4b5563",
                        marginTop: "4px",
                      }}
                    >
                      AI analyzes template usage patterns to suggest
                      improvements and identify your most effective templates.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      alert(
                        "🧠 AI is analyzing template patterns and will provide insights soon!"
                      );
                    }}
                    style={{
                      padding: "6px 12px",
                      backgroundColor: "#7c3aed",
                      color: "white",
                      borderRadius: "8px",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "14px",
                      whiteSpace: "nowrap",
                      transition: "background-color 0.2s",
                    }}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.backgroundColor = "#6d28d9")
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.backgroundColor = "#7c3aed")
                    }
                  >
                    Analyze Templates
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Template Upload Modal */}
      {templateUploadModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            padding: "16px",
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              width: "100%",
              maxWidth: "32rem",
              maxHeight: "90%",
            }}
          >
            <div
              style={{
                padding: "16px",
                borderBottom: "1px solid #e5e7eb",
                position: "sticky",
                top: 0,
                backgroundColor: "white",
                borderRadius: "12px 12px 0 0",
              }}
            >
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#111827",
                }}
              >
                Add Template to Library
              </h3>
              <p
                style={{ fontSize: "12px", color: "#4b5563", marginTop: "2px" }}
              >
                Upload a template for AI analysis and team reuse
              </p>
            </div>

            <div
              style={{
                padding: "16px",
                overflowY: "auto",
                maxHeight: "calc(90vh - 120px)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: "500",
                      color: "#374151",
                      marginBottom: "4px",
                    }}
                  >
                    Template Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Quarterly Report Template"
                    style={{
                      width: "100%",
                      padding: "8px",
                      fontSize: "14px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      outline: "none",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#4f46e5")}
                    onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: "500",
                      color: "#374151",
                      marginBottom: "4px",
                    }}
                  >
                    Description
                  </label>
                  <textarea
                    placeholder="Brief description of the template..."
                    rows="2"
                    style={{
                      width: "100%",
                      padding: "8px",
                      fontSize: "14px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      outline: "none",
                      resize: "vertical",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#4f46e5")}
                    onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
                  />
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "12px",
                        fontWeight: "500",
                        color: "#374151",
                        marginBottom: "4px",
                      }}
                    >
                      Category
                    </label>
                    <select
                      style={{
                        width: "100%",
                        padding: "8px",
                        fontSize: "14px",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        backgroundColor: "white",
                        cursor: "pointer",
                        outline: "none",
                      }}
                    >
                      <option>Presentation</option>
                      <option>Document</option>
                      <option>Report</option>
                      <option>Form</option>
                      <option>Email Template</option>
                    </select>
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "12px",
                        fontWeight: "500",
                        color: "#374151",
                        marginBottom: "4px",
                      }}
                    >
                      Department
                    </label>
                    <select
                      style={{
                        width: "100%",
                        padding: "8px",
                        fontSize: "14px",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        backgroundColor: "white",
                        cursor: "pointer",
                        outline: "none",
                      }}
                    >
                      <option>Marketing</option>
                      <option>Sales</option>
                      <option>HR</option>
                      <option>Finance</option>
                      <option>Operations</option>
                      <option>All Departments</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: "500",
                      color: "#374151",
                      marginBottom: "4px",
                    }}
                  >
                    Upload File
                  </label>
                  <div
                    onClick={() => templateInputRef.current?.click()}
                    style={{
                      border: "2px dashed #d1d5db",
                      borderRadius: "8px",
                      padding: "16px",
                      textAlign: "center",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.borderColor = "#3b82f6";
                      e.currentTarget.style.backgroundColor = "#dbeafe";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.borderColor = "#d1d5db";
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <Upload
                      style={{
                        width: "24px",
                        height: "24px",
                        color: "#9ca3af",
                        margin: "0 auto 4px",
                      }}
                    />
                    <p style={{ fontSize: "12px", color: "#4b5563" }}>
                      Click to upload or drag and drop
                    </p>
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#6b7280",
                        marginTop: "2px",
                      }}
                    >
                      DOCX, PPTX, XLSX up to 50MB
                    </p>
                  </div>
                  <input
                    ref={templateInputRef}
                    type="file"
                    accept=".docx,.pptx,.xlsx,.html,.txt,.doc,.ppt,.xls"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        console.log(
                          "Template file selected:",
                          e.target.files[0].name
                        );
                      }
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: "500",
                      color: "#374151",
                      marginBottom: "4px",
                    }}
                  >
                    Tags
                  </label>
                  <input
                    type="text"
                    placeholder="Enter tags separated by commas"
                    style={{
                      width: "100%",
                      padding: "8px",
                      fontSize: "14px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      outline: "none",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#4f46e5")}
                    onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
                  />
                </div>

                <div
                  style={{
                    backgroundColor: "#f3e8ff",
                    borderRadius: "8px",
                    padding: "8px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "8px",
                    }}
                  >
                    <Brain
                      style={{
                        width: "16px",
                        height: "16px",
                        color: "#7c3aed",
                        marginTop: "2px",
                      }}
                    />
                    <div style={{ fontSize: "12px" }}>
                      <p style={{ fontWeight: "500", color: "#5b21b6" }}>
                        AI will analyze this template
                      </p>
                      <p style={{ color: "#6d28d9" }}>
                        The system will learn from this template's patterns
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  justifyContent: "flex-end",
                  marginTop: "16px",
                  position: "sticky",
                  bottom: 0,
                  backgroundColor: "white",
                  paddingTop: "8px",
                }}
              >
                <button
                  onClick={() => setTemplateUploadModal(false)}
                  style={{
                    padding: "6px 12px",
                    fontSize: "14px",
                    color: "#4b5563",
                    backgroundColor: "transparent",
                    border: "none",
                    cursor: "pointer",
                    transition: "color 0.2s",
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.color = "#111827")}
                  onMouseOut={(e) => (e.currentTarget.style.color = "#4b5563")}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Simulate template upload with AI processing
                    const newTemplate = {
                      id: `t${Date.now()}`,
                      name: "New Template.docx",
                      category: "Document",
                      fileType: "word",
                      description: "Newly uploaded template",
                      fileSize: "1.2 MB",
                      tags: ["new", "uploaded"],
                      created: new Date().toISOString(),
                      lastUsed: new Date().toISOString(),
                      useCount: 0,
                      aiScore: 0,
                      aiInsights: ["Processing template..."],
                    };

                    setTemplates((prev) => [...prev, newTemplate]);

                    // Simulate AI processing
                    setTimeout(() => {
                      setTemplates((prev) =>
                        prev.map((t) =>
                          t.id === newTemplate.id
                            ? {
                                ...t,
                                aiScore: 85,
                                aiInsights: [
                                  "Template structure analyzed",
                                  "Brand compliance verified",
                                  "Formatting patterns learned",
                                ],
                              }
                            : t
                        )
                      );
                    }, 2000);

                    alert(
                      "✅ Template uploaded successfully! AI is analyzing the content..."
                    );
                    setTemplateUploadModal(false);
                  }}
                  style={{
                    backgroundColor: "#4f46e5",
                    color: "white",
                    padding: "6px 12px",
                    fontSize: "14px",
                    borderRadius: "8px",
                    border: "none",
                    cursor: "pointer",
                    transition: "background-color 0.2s",
                  }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.backgroundColor = "#4338ca")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.backgroundColor = "#4f46e5")
                  }
                >
                  Upload Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Modal */}
      {showStats && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            padding: "16px",
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              width: "100%",
              maxWidth: "512px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px",
                borderBottom: "1px solid #e5e7eb",
                position: "sticky",
                top: 0,
                backgroundColor: "white",
                borderRadius: "12px 12px 0 0",
              }}
            >
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#111827",
                }}
              >
                MemoryVault Statistics
              </h3>
              <button
                onClick={() => setShowStats(false)}
                style={{
                  color: "#9ca3af",
                  padding: "4px",
                  border: "none",
                  backgroundColor: "transparent",
                  cursor: "pointer",
                }}
                onMouseOver={(e) => (e.currentTarget.style.color = "#4b5563")}
                onMouseOut={(e) => (e.currentTarget.style.color = "#9ca3af")}
              >
                <X style={{ width: "16px", height: "16px" }} />
              </button>
            </div>

            <div
              style={{
                padding: "16px",
                overflowY: "auto",
                maxHeight: "calc(90vh - 60px)",
              }}
            >
              {/* AI Statistics */}
              <div
                style={{
                  marginBottom: "12px",
                  background: "linear-gradient(to right, #dbeafe, #f3e8ff)",
                  borderRadius: "8px",
                  padding: "8px",
                }}
              >
                <h4
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#111827",
                    marginBottom: "8px",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <Brain
                    style={{ width: "16px", height: "16px", color: "#7c3aed" }}
                  />
                  AI Learning Status
                </h4>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: "8px",
                    fontSize: "12px",
                  }}
                >
                  <div>
                    <p style={{ color: "#4b5563" }}>Version</p>
                    <p style={{ fontWeight: "600", color: "#111827" }}>
                      v{aiStatus.modelVersion}
                    </p>
                  </div>
                  <div>
                    <p style={{ color: "#4b5563" }}>Docs</p>
                    <p style={{ fontWeight: "600", color: "#111827" }}>
                      {aiStatus.documentsProcessed}
                    </p>
                  </div>
                  <div>
                    <p style={{ color: "#4b5563" }}>Accuracy</p>
                    <p style={{ fontWeight: "600", color: "#111827" }}>
                      {aiStatus.accuracy}%
                    </p>
                  </div>
                  <div>
                    <p style={{ color: "#4b5563" }}>Updated</p>
                    <p style={{ fontWeight: "600", color: "#111827" }}>
                      {new Date(aiStatus.lastTraining).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: "12px", textAlign: "center" }}>
                <h4
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#111827",
                  }}
                >
                  {activeProject?.name || "Project"}
                </h4>
                <p style={{ fontSize: "12px", color: "#4b5563" }}>
                  {activeProject?.industry || "Technology"} • Est.{" "}
                  {activeProject?.created_at
                    ? new Date(activeProject.created_at).getFullYear()
                    : "2024"}
                </p>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "8px",
                  marginBottom: "12px",
                }}
              >
                {Object.entries(folderStructure).map(([key, folder]) => {
                  const stats = folderStats[key];
                  const Icon = folder.icon;

                  return (
                    <div
                      key={key}
                      style={{
                        backgroundColor: folder.bgColor,
                        borderRadius: "8px",
                        padding: "8px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <Icon
                          style={{
                            width: "16px",
                            height: "16px",
                            color: folder.color,
                          }}
                        />
                        <div
                          style={{
                            fontSize: "16px",
                            fontWeight: "600",
                            color: "#111827",
                          }}
                        >
                          {stats.total}
                        </div>
                      </div>
                      <div style={{ fontSize: "12px", color: "#4b5563" }}>
                        {folder.name}
                      </div>
                      <div style={{ fontSize: "12px", color: "#6b7280" }}>
                        {stats.views} views
                      </div>
                    </div>
                  );
                })}
              </div>

              <div
                style={{ borderTop: "1px solid #e5e7eb", paddingTop: "8px" }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "16px 8px",
                    fontSize: "12px",
                  }}
                >
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <span style={{ color: "#4b5563" }}>Total Items</span>
                    <span style={{ fontWeight: "500" }}>
                      {Object.values(folderStats).reduce(
                        (sum, stats) => sum + stats.total,
                        0
                      )}
                    </span>
                  </div>
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <span style={{ color: "#4b5563" }}>Total Views</span>
                    <span style={{ fontWeight: "500" }}>
                      {Object.values(folderStats).reduce(
                        (sum, stats) => sum + stats.views,
                        0
                      )}
                    </span>
                  </div>
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <span style={{ color: "#4b5563" }}>AI Items</span>
                    <span style={{ fontWeight: "500" }}>
                      {
                        Object.values(contentLibrary)
                          .flat()
                          .filter((item) => item.aiScore > 0).length
                      }
                    </span>
                  </div>
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <span style={{ color: "#4b5563" }}>Templates</span>
                    <span style={{ fontWeight: "500" }}>
                      {templates.length}
                    </span>
                  </div>
                </div>
              </div>

              <div
                style={{
                  marginTop: "12px",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <button
                  onClick={trainAI}
                  disabled={isTraining}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "6px 12px",
                    borderRadius: "8px",
                    transition: "all 0.2s",
                    fontSize: "12px",
                    border: "none",
                    cursor: isTraining ? "not-allowed" : "pointer",
                    backgroundColor: isTraining ? "#d1d5db" : "#7c3aed",
                    color: isTraining ? "#6b7280" : "white",
                  }}
                >
                  <Brain
                    style={{
                      width: "12px",
                      height: "12px",
                      animation: isTraining ? "pulse 1s infinite" : "none",
                    }}
                  />
                  {isTraining ? "Training..." : "Retrain AI Model"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Template Viewer Modal */}
      {selectedTemplate && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            padding: "16px",
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              width: "100%",
              maxWidth: "48rem",
              maxHeight: "85vh",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                padding: "24px",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              <div style={{ flex: 1 }}>
                <h3
                  style={{
                    fontSize: "20px",
                    fontWeight: "600",
                    color: "#111827",
                  }}
                >
                  {selectedTemplate.name}
                </h3>
                <p
                  style={{
                    fontSize: "14px",
                    color: "#4b5563",
                    marginTop: "4px",
                  }}
                >
                  {selectedTemplate.description}
                </p>
                {selectedTemplate.aiScore && (
                  <div
                    style={{
                      marginTop: "8px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <Sparkles
                      style={{
                        width: "16px",
                        height: "16px",
                        color: "#7c3aed",
                      }}
                    />
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#6d28d9",
                      }}
                    >
                      AI Score: {selectedTemplate.aiScore}%
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={() => setSelectedTemplate(null)}
                style={{
                  color: "#9ca3af",
                  padding: "8px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: "transparent",
                  cursor: "pointer",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.color = "#4b5563";
                  e.currentTarget.style.backgroundColor = "#f3f4f6";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.color = "#9ca3af";
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <X style={{ width: "20px", height: "20px" }} />
              </button>
            </div>

            <div
              style={{ padding: "24px", overflowY: "auto", maxHeight: "55vh" }}
            >
              {/* AI Insights */}
              {selectedTemplate.aiInsights &&
                selectedTemplate.aiInsights.length > 0 && (
                  <div
                    style={{
                      marginBottom: "16px",
                      backgroundColor: "#f3e8ff",
                      borderRadius: "8px",
                      padding: "16px",
                    }}
                  >
                    <h4
                      style={{
                        fontWeight: "600",
                        color: "#5b21b6",
                        marginBottom: "8px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <Bot style={{ width: "16px", height: "16px" }} />
                      AI Template Analysis
                    </h4>
                    <ul
                      style={{
                        margin: 0,
                        paddingLeft: "20px",
                        fontSize: "14px",
                        color: "#6d28d9",
                      }}
                    >
                      {selectedTemplate.aiInsights.map((insight, idx) => (
                        <li key={idx} style={{ marginBottom: "4px" }}>
                          {insight}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              {/* Template Preview */}
              <div
                style={{
                  backgroundColor: "#f9fafb",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  padding: "32px",
                  textAlign: "center",
                  marginBottom: "16px",
                }}
              >
                <div style={{ fontSize: "60px", marginBottom: "16px" }}>
                  {selectedTemplate.fileType === "word"
                    ? "📄"
                    : selectedTemplate.fileType === "powerpoint"
                    ? "📊"
                    : selectedTemplate.fileType === "excel"
                    ? "📈"
                    : selectedTemplate.fileType === "email"
                    ? "📧"
                    : "📝"}
                </div>
                <h4
                  style={{
                    fontWeight: "600",
                    color: "#111827",
                    marginBottom: "8px",
                  }}
                >
                  {selectedTemplate.name}
                </h4>
                <p
                  style={{
                    color: "#4b5563",
                    fontSize: "14px",
                    marginBottom: "16px",
                  }}
                >
                  File size: {selectedTemplate.fileSize}
                </p>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: "12px",
                  }}
                >
                  <button
                    onClick={() => {
                      alert(`Downloading ${selectedTemplate.name}...`);
                      // Update use count
                      setTemplates((prev) =>
                        prev.map((t) =>
                          t.id === selectedTemplate.id
                            ? {
                                ...t,
                                useCount: t.useCount + 1,
                                lastUsed: new Date().toISOString(),
                              }
                            : t
                        )
                      );
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      backgroundColor: "#4f46e5",
                      color: "white",
                      padding: "8px 16px",
                      borderRadius: "8px",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "14px",
                      transition: "background-color 0.2s",
                    }}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.backgroundColor = "#4338ca")
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.backgroundColor = "#4f46e5")
                    }
                  >
                    <Download style={{ width: "16px", height: "16px" }} />
                    Download Template
                  </button>
                  <button
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      backgroundColor: "#f3f4f6",
                      color: "#374151",
                      padding: "8px 16px",
                      borderRadius: "8px",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "14px",
                      transition: "background-color 0.2s",
                    }}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.backgroundColor = "#e5e7eb")
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.backgroundColor = "#f3f4f6")
                    }
                  >
                    <Eye style={{ width: "16px", height: "16px" }} />
                    Preview
                  </button>
                </div>
              </div>

              {/* Template Details */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontSize: "14px",
                  }}
                >
                  <span style={{ color: "#4b5563" }}>Category</span>
                  <span
                    style={{
                      padding: "4px 12px",
                      borderRadius: "9999px",
                      fontSize: "12px",
                      fontWeight: "500",
                      backgroundColor:
                        selectedTemplate.category === "Presentation"
                          ? "#f3e8ff"
                          : selectedTemplate.category === "Document"
                          ? "#dbeafe"
                          : selectedTemplate.category === "Report"
                          ? "#d1fae5"
                          : selectedTemplate.category === "Form"
                          ? "#fef3c7"
                          : "#f3f4f6",
                      color:
                        selectedTemplate.category === "Presentation"
                          ? "#7c3aed"
                          : selectedTemplate.category === "Document"
                          ? "#1e40af"
                          : selectedTemplate.category === "Report"
                          ? "#047857"
                          : selectedTemplate.category === "Form"
                          ? "#b45309"
                          : "#374151",
                    }}
                  >
                    {selectedTemplate.category}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontSize: "14px",
                  }}
                >
                  <span style={{ color: "#4b5563" }}>Created</span>
                  <span style={{ color: "#111827" }}>
                    {new Date(selectedTemplate.created).toLocaleDateString()}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontSize: "14px",
                  }}
                >
                  <span style={{ color: "#4b5563" }}>Last Used</span>
                  <span style={{ color: "#111827" }}>
                    {new Date(selectedTemplate.lastUsed).toLocaleDateString()}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontSize: "14px",
                  }}
                >
                  <span style={{ color: "#4b5563" }}>Total Uses</span>
                  <span style={{ fontWeight: "500", color: "#111827" }}>
                    {selectedTemplate.useCount}
                  </span>
                </div>
              </div>

              {/* Tags */}
              <div style={{ marginTop: "16px" }}>
                <h5
                  style={{
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#374151",
                    marginBottom: "8px",
                  }}
                >
                  Tags
                </h5>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {selectedTemplate.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        backgroundColor: "#f3f4f6",
                        color: "#374151",
                        padding: "6px 12px",
                        borderRadius: "9999px",
                        fontSize: "14px",
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "24px",
                borderTop: "1px solid #e5e7eb",
                backgroundColor: "#f9fafb",
              }}
            >
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => {
                    alert("Opening template editor...");
                    setSelectedTemplate(null);
                    setShowTemplates(false);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    backgroundColor: "#4f46e5",
                    color: "white",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    border: "none",
                    cursor: "pointer",
                    transition: "background-color 0.2s",
                  }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.backgroundColor = "#4338ca")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.backgroundColor = "#4f46e5")
                  }
                >
                  Use Template
                </button>
                <button
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 16px",
                    color: "#374151",
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.backgroundColor = "#f9fafb")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.backgroundColor = "white")
                  }
                >
                  <Copy style={{ width: "16px", height: "16px" }} />
                  Duplicate
                </button>
              </div>
              <button
                onClick={() => setSelectedTemplate(null)}
                style={{
                  padding: "8px 16px",
                  color: "#4b5563",
                  backgroundColor: "transparent",
                  border: "none",
                  cursor: "pointer",
                  transition: "color 0.2s",
                }}
                onMouseOver={(e) => (e.currentTarget.style.color = "#111827")}
                onMouseOut={(e) => (e.currentTarget.style.color = "#4b5563")}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add keyframes for animations */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `,
        }}
      />
    </div>
  );
};

export default MemoryVault;
