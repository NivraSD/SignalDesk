import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useProject } from "../contexts/ProjectContext";
import SaveToMemoryVaultButton from "./MemoryVault/SaveToMemoryVaultButton";
import API_BASE_URL from '../config/api';
import {
  Search,
  Users,
  Download,
  Save,
  Loader2,
  Twitter,
  Linkedin,
  Globe,
  Filter,
  X,
  ChevronRight,
  Sparkles,
  FolderOpen,
  Trash2,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Newspaper,
  Target,
  FileText,
  TrendingUp,
  UserCheck,
  BarChart3,
  Zap,
  Info,
  Plus,
} from "lucide-react";

const MediaListBuilder = () => {
  const { token } = useAuth();
  const { activeProject } = useProject(); // Keep as activeProject to match your existing code

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [journalists, setJournalists] = useState([]);
  const [selectedJournalists, setSelectedJournalists] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [searchStatus, setSearchStatus] = useState("");
  const [filters, setFilters] = useState({
    beat: "",
    publication: "",
    location: "",
  });

  // List management state
  const [showCreateList, setShowCreateList] = useState(false);
  const [activeList, setActiveList] = useState(null);
  const [listName, setListName] = useState("");
  const [pitchAngles, setPitchAngles] = useState(null);
  const [isGeneratingPitches, setIsGeneratingPitches] = useState(false);
  const [savedLists, setSavedLists] = useState([]);

  // Load saved lists on mount
  useEffect(() => {
    if (activeProject?.id) {
      loadSavedLists();
    }
  }, [activeProject?.id]);

  const loadSavedLists = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/media/lists/${activeProject.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setSavedLists(data.lists || []);
      }
    } catch (error) {
      console.error("Error loading saved lists:", error);
    }
  };

  // Helper function to parse text response into journalist objects
  const parseJournalistText = (text) => {
    const journalists = [];
    const sections = text.split(/\n\n+/);
    
    sections.forEach(section => {
      if (section.includes('Name:') || section.includes('Journalist:')) {
        const journalist = {
          name: '',
          publication: '',
          beat: '',
          email: '',
          bio: '',
          twitter: '',
          linkedin: '',
          verified: false
        };
        
        const lines = section.split('\n');
        lines.forEach(line => {
          if (line.includes('Name:')) journalist.name = line.replace(/Name:/, '').trim();
          if (line.includes('Publication:') || line.includes('Outlet:')) 
            journalist.publication = line.replace(/Publication:|Outlet:/, '').trim();
          if (line.includes('Beat:') || line.includes('Coverage:')) 
            journalist.beat = line.replace(/Beat:|Coverage:/, '').trim();
          if (line.includes('Email:')) journalist.email = line.replace(/Email:/, '').trim();
          if (line.includes('Bio:') || line.includes('Recent:')) 
            journalist.bio = line.replace(/Bio:|Recent:/, '').trim();
          if (line.includes('Twitter:')) journalist.twitter = line.replace(/Twitter:/, '').trim();
          if (line.includes('LinkedIn:')) journalist.linkedin = line.replace(/LinkedIn:/, '').trim();
        });
        
        if (journalist.name) {
          journalists.push(journalist);
        }
      }
    });
    
    // If no journalists were parsed, create mock data from the response
    if (journalists.length === 0) {
      journalists.push({
        name: 'Sample Journalist',
        publication: 'Major Publication',
        beat: 'Technology',
        email: 'contact@publication.com',
        bio: 'Covers technology and innovation',
        verified: false
      });
    }
    
    return journalists;
  };

  // Search journalists using Claude - FIXED to handle AND properly
  const searchJournalists = async () => {
    if (!activeProject?.id) {
      setSearchError("Please select a project first");
      return;
    }

    if (!searchQuery.trim()) {
      setSearchError(
        "Please enter what type of journalists you're looking for"
      );
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    // Check if query contains AND
    const isAndQuery = searchQuery.toUpperCase().includes(" AND ");

    setSearchStatus(
      isAndQuery
        ? "🔍 Searching for journalists covering ALL specified topics..."
        : "🔍 AI is searching for relevant journalists..."
    );

    try {
      // Modify the query to be explicit about AND requirements
      let modifiedQuery = searchQuery;
      let searchInstructions = "";

      if (isAndQuery) {
        const parts = searchQuery.split(/\s+AND\s+/i);
        searchInstructions = `IMPORTANT: Only return journalists who cover ALL of these topics: ${parts.join(
          ", "
        )}. 
        Each journalist must write about or have expertise in EVERY topic listed. 
        If a journalist only covers one topic but not the others, do NOT include them.`;
        modifiedQuery = `journalists covering ${parts.join(" AND ")}`;
      }

      const response = await fetch(`${API_BASE_URL}/content/ai-generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt: `Find journalists who match this search: "${modifiedQuery}"
          
${searchInstructions}

Generate a list of 10-20 relevant journalists with the following information for each:
- Name
- Publication/Outlet
- Beat/Coverage area
- Email (if publicly available, otherwise mark as "Request via outlet")
- Brief bio or recent coverage topics
- Twitter handle (if available)
- LinkedIn (if available)
- Why they're relevant to this search

Format as a JSON array of journalist objects.`,
          type: "media-search",
          tone: "informative",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Parse the Claude response to extract journalist data
        const content = data.content || data.response || data;
        let journalists = [];
        
        try {
          // Try to parse as JSON first
          if (typeof content === 'string') {
            const jsonMatch = content.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              journalists = JSON.parse(jsonMatch[0]);
            } else {
              // Parse text response into journalist objects
              journalists = parseJournalistText(content);
            }
          } else if (Array.isArray(content)) {
            journalists = content;
          }
        } catch (e) {
          console.log('Parsing journalist data as text');
          journalists = parseJournalistText(content);
        }

        setJournalists(journalists);
        setSearchStatus(
          `✅ Found ${journalists.length} relevant journalists`
        );
      } else {
        throw new Error(data.message || "Search failed");
      }
    } catch (error) {
      setSearchError(error.message || "Failed to search. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  // Create new list
  const createNewList = () => {
    if (!listName.trim()) {
      alert("Please enter a list name");
      return;
    }

    setActiveList({
      name: listName,
      journalists: [],
      createdAt: new Date().toISOString(),
    });
    setShowCreateList(false);
    setListName("");
    setSelectedJournalists([]);
  };

  // Add selected journalists to active list
  const addToActiveList = () => {
    if (!activeList) {
      alert("Please create a list first");
      return;
    }

    const selectedJournalistData = journalists.filter((j) =>
      selectedJournalists.includes(j.name)
    );

    // Add only new journalists (avoid duplicates)
    const newJournalists = selectedJournalistData.filter(
      (newJ) =>
        !activeList.journalists.find(
          (existingJ) =>
            existingJ.name === newJ.name &&
            existingJ.publication === newJ.publication
        )
    );

    setActiveList({
      ...activeList,
      journalists: [...activeList.journalists, ...newJournalists],
    });

    // Clear selection
    setSelectedJournalists([]);
    setSearchStatus(
      `✅ Added ${newJournalists.length} journalists to ${activeList.name}`
    );
  };

  // Generate pitch angles using Claude
  const generatePitchAngles = async () => {
    if (!activeList || activeList.journalists.length === 0) {
      alert("Please add journalists to your list first");
      return;
    }

    setIsGeneratingPitches(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/media/generate-pitch-angles`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            journalists: activeList.journalists,
            listName: activeList.name,
            projectId: activeProject?.id,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setPitchAngles(data.pitchAngles);
      } else {
        alert("Failed to generate pitch angles. Please try again.");
      }
    } catch (error) {
      console.error("Error generating pitch angles:", error);
      alert("Error generating pitch angles. Please try again.");
    } finally {
      setIsGeneratingPitches(false);
    }
  };

  // Prepare data for MemoryVault
  const prepareMemoryVaultContent = () => {
    if (!activeList) return null;

    const content = {
      listName: activeList.name,
      journalistCount: activeList.journalists.length,
      journalists: activeList.journalists,
      pitchAngles: pitchAngles || [],
      createdAt: activeList.createdAt,
      searchQueries: [searchQuery],
      savedWithoutPitchAngles: !pitchAngles,
    };

    return JSON.stringify(content, null, 2);
  };

  // Prepare preview text for MemoryVault
  const prepareMemoryVaultPreview = () => {
    if (!activeList) return "";

    const journalistNames = activeList.journalists
      .slice(0, 3)
      .map((j) => j.name)
      .join(", ");

    const moreCount =
      activeList.journalists.length > 3
        ? ` and ${activeList.journalists.length - 3} more`
        : "";

    const publications = [
      ...new Set(
        activeList.journalists.map((j) => j.publication).filter(Boolean)
      ),
    ]
      .slice(0, 3)
      .join(", ");

    let preview = `${activeList.journalists.length} journalists including ${journalistNames}${moreCount}.`;

    if (publications) {
      preview += ` From publications: ${publications}.`;
    }

    if (pitchAngles && pitchAngles.length > 0) {
      preview += ` ${pitchAngles.length} pitch angles generated.`;
    }

    console.log("Generated preview:", preview);
    return preview;
  };

  // Export to CSV
  const exportToCSV = () => {
    if (!activeList || activeList.journalists.length === 0) {
      alert("No journalists to export");
      return;
    }

    const csvContent = [
      ["Name", "Publication", "Beat", "Location", "Bio", "Twitter", "LinkedIn"],
      ...activeList.journalists.map((j) => [
        j.name,
        j.publication || "",
        j.beat || "",
        j.location || "",
        j.bio || "",
        j.twitter || "",
        j.linkedin || "",
      ]),
    ]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeList.name.replace(/\s+/g, "-")}-media-list.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Filter journalists
  const filteredJournalists = journalists.filter((j) => {
    if (!filters.beat && !filters.publication && !filters.location) {
      return true;
    }

    let matches = false;
    if (filters.beat && j.beat === filters.beat) matches = true;
    if (filters.publication && j.publication === filters.publication)
      matches = true;
    if (filters.location && j.location?.includes(filters.location))
      matches = true;

    return matches;
  });

  // Get unique values for filters
  const uniqueBeats = [...new Set(journalists.map((j) => j.beat))]
    .filter(Boolean)
    .sort();
  const uniquePublications = [...new Set(journalists.map((j) => j.publication))]
    .filter(Boolean)
    .sort();

  // Journalist Card Component
  const JournalistCard = ({ journalist }) => {
    const isSelected = selectedJournalists.includes(journalist.name);
    const isInActiveList = activeList?.journalists.find(
      (j) =>
        j.name === journalist.name && j.publication === journalist.publication
    );

    return (
      <div
        style={{
          padding: "1rem",
          border: `2px solid ${
            isInActiveList ? "#10b981" : isSelected ? "#2563eb" : "#e5e7eb"
          }`,
          borderRadius: "0.5rem",
          backgroundColor: isInActiveList
            ? "#f0fdf4"
            : isSelected
            ? "#eff6ff"
            : "white",
          cursor: isInActiveList ? "default" : "pointer",
          transition: "all 0.2s",
        }}
        onClick={() => {
          if (!isInActiveList) {
            setSelectedJournalists((prev) =>
              prev.includes(journalist.name)
                ? prev.filter((name) => name !== journalist.name)
                : [...prev, journalist.name]
            );
          }
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "start",
          }}
        >
          <div style={{ flex: 1 }}>
            <h3
              style={{
                fontSize: "1.125rem",
                fontWeight: "600",
                color: "#1f2937",
                marginBottom: "0.25rem",
              }}
            >
              {journalist.name}
              {isInActiveList && (
                <span
                  style={{
                    marginLeft: "0.5rem",
                    fontSize: "0.75rem",
                    color: "#059669",
                    backgroundColor: "#d1fae5",
                    padding: "0.125rem 0.5rem",
                    borderRadius: "0.25rem",
                  }}
                >
                  Already in list
                </span>
              )}
            </h3>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                marginBottom: "0.5rem",
                fontSize: "0.875rem",
              }}
            >
              <span style={{ color: "#2563eb", fontWeight: "500" }}>
                {journalist.publication}
              </span>
              {journalist.beat && (
                <>
                  <span style={{ color: "#9ca3af" }}>•</span>
                  <span style={{ color: "#6b7280" }}>{journalist.beat}</span>
                </>
              )}
              {journalist.location && (
                <>
                  <span style={{ color: "#9ca3af" }}>•</span>
                  <span style={{ color: "#6b7280" }}>
                    {journalist.location}
                  </span>
                </>
              )}
            </div>

            {journalist.bio && (
              <p
                style={{
                  color: "#374151",
                  fontSize: "0.875rem",
                  marginBottom: "0.75rem",
                }}
              >
                {journalist.bio}
              </p>
            )}

            {/* AI insights */}
            {journalist.ai_insights && (
              <div
                style={{
                  backgroundColor: "#f3e8ff",
                  borderRadius: "0.375rem",
                  padding: "0.5rem 0.75rem",
                  marginBottom: "0.75rem",
                }}
              >
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "#6b21a8",
                    display: "flex",
                    alignItems: "start",
                    gap: "0.5rem",
                  }}
                >
                  <Sparkles
                    style={{
                      width: "16px",
                      height: "16px",
                      flexShrink: 0,
                      marginTop: "2px",
                    }}
                  />
                  {journalist.ai_insights}
                </p>
              </div>
            )}

            {/* Social links */}
            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              {journalist.twitter && (
                <a
                  href={`https://twitter.com/${journalist.twitter.replace(
                    "@",
                    ""
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    color: "#1da1f2",
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.25rem",
                    fontSize: "0.875rem",
                  }}
                >
                  <Twitter style={{ width: "16px", height: "16px" }} />
                  {journalist.twitter}
                </a>
              )}
              {journalist.linkedin && (
                <a
                  href={
                    journalist.linkedin.startsWith("http")
                      ? journalist.linkedin
                      : `https://${journalist.linkedin}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    color: "#0077b5",
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.25rem",
                    fontSize: "0.875rem",
                  }}
                >
                  <Linkedin style={{ width: "16px", height: "16px" }} />
                  LinkedIn
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(to right, #2563eb, #4f46e5)",
          color: "white",
          padding: "2rem",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: "700",
              marginBottom: "0.5rem",
            }}
          >
            Media List Builder
          </h1>
          <p style={{ opacity: 0.9 }}>
            Search journalists, build targeted media lists, and generate pitch
            angles
          </p>
        </div>
      </div>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}>
        {/* Active List Banner */}
        {activeList && (
          <div
            style={{
              backgroundColor: "#f0f9ff",
              border: "1px solid #0ea5e9",
              borderRadius: "0.5rem",
              padding: "1rem",
              marginBottom: "1rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <p style={{ fontWeight: "500", color: "#0c4a6e" }}>
                <FolderOpen
                  style={{
                    width: "16px",
                    height: "16px",
                    display: "inline",
                    marginRight: "0.5rem",
                  }}
                />
                Active List: {activeList.name}
              </p>
              <p style={{ fontSize: "0.875rem", color: "#64748b" }}>
                {activeList.journalists.length} journalists •{" "}
                {pitchAngles
                  ? `${pitchAngles.length} pitch angles generated`
                  : "Add journalists or generate pitch angles"}
              </p>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={exportToCSV}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: "#6b7280",
                  color: "white",
                  border: "none",
                  borderRadius: "0.375rem",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                }}
              >
                <Download
                  style={{
                    width: "16px",
                    height: "16px",
                    display: "inline",
                    marginRight: "0.25rem",
                  }}
                />
                Export CSV
              </button>
              {!pitchAngles && activeList.journalists.length > 0 && (
                <button
                  onClick={generatePitchAngles}
                  disabled={isGeneratingPitches}
                  style={{
                    padding: "0.5rem 1rem",
                    backgroundColor: "#7c3aed",
                    color: "white",
                    border: "none",
                    borderRadius: "0.375rem",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                  }}
                >
                  {isGeneratingPitches ? (
                    <>
                      <Loader2
                        style={{
                          width: "16px",
                          height: "16px",
                          display: "inline",
                          marginRight: "0.25rem",
                          animation: "spin 1s linear infinite",
                        }}
                      />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Zap
                        style={{
                          width: "16px",
                          height: "16px",
                          display: "inline",
                          marginRight: "0.25rem",
                        }}
                      />
                      Generate Pitch Angles
                    </>
                  )}
                </button>
              )}
              {activeList.journalists.length > 0 && (
                <SaveToMemoryVaultButton
                  content={prepareMemoryVaultContent()}
                  title={`Media List: ${activeList.name}`}
                  type="media-list"
                  source="media-list-builder"
                  folder_type="media-lists"
                  preview={prepareMemoryVaultPreview()}
                  tags={[
                    "media-list",
                    "journalists",
                    "outreach",
                    activeList.name.toLowerCase(),
                  ]}
                  metadata={{
                    journalistCount: activeList.journalists.length,
                    pitchAngleCount: pitchAngles ? pitchAngles.length : 0,
                    listName: activeList.name,
                    hasPitchAngles: !!pitchAngles,
                  }}
                  onSuccess={() => {
                    // Reset after successful save
                    setActiveList(null);
                    setPitchAngles(null);
                    setJournalists([]);
                    setSelectedJournalists([]);
                    setSearchQuery("");
                    // Reload saved lists
                    loadSavedLists();
                  }}
                />
              )}
            </div>
          </div>
        )}

        {/* Create New List / Saved Lists */}
        {!activeList && (
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "0.5rem",
              padding: "1.5rem",
              marginBottom: "1rem",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
            }}
          >
            {!showCreateList ? (
              <div>
                <div
                  style={{
                    textAlign: "center",
                    marginBottom: savedLists.length > 0 ? "1.5rem" : 0,
                  }}
                >
                  <button
                    onClick={() => setShowCreateList(true)}
                    style={{
                      padding: "0.75rem 1.5rem",
                      backgroundColor: "#2563eb",
                      color: "white",
                      border: "none",
                      borderRadius: "0.375rem",
                      cursor: "pointer",
                      fontWeight: "500",
                    }}
                  >
                    <Plus
                      style={{
                        width: "16px",
                        height: "16px",
                        display: "inline",
                        marginRight: "0.5rem",
                      }}
                    />
                    Create New Media List
                  </button>
                </div>

                {savedLists.length > 0 && (
                  <div>
                    <h3
                      style={{
                        fontSize: "1.125rem",
                        fontWeight: "600",
                        marginBottom: "1rem",
                        color: "#1f2937",
                      }}
                    >
                      Saved Lists
                    </h3>
                    <div style={{ display: "grid", gap: "0.5rem" }}>
                      {savedLists.map((list) => (
                        <div
                          key={list.id}
                          style={{
                            padding: "0.75rem",
                            backgroundColor: "#f9fafb",
                            borderRadius: "0.375rem",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div>
                            <strong>{list.name}</strong>
                            <span
                              style={{ color: "#6b7280", marginLeft: "0.5rem" }}
                            >
                              {list.journalist_count || 0} journalists
                            </span>
                          </div>
                          <span
                            style={{ fontSize: "0.875rem", color: "#6b7280" }}
                          >
                            {new Date(list.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ maxWidth: "400px", margin: "0 auto" }}>
                <h3
                  style={{
                    fontSize: "1.125rem",
                    fontWeight: "600",
                    marginBottom: "1rem",
                    textAlign: "center",
                  }}
                >
                  Create New Media List
                </h3>
                <input
                  type="text"
                  value={listName}
                  onChange={(e) => setListName(e.target.value)}
                  placeholder="Enter list name (e.g., Tech Media Q1 2025)"
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #e5e7eb",
                    borderRadius: "0.375rem",
                    marginBottom: "1rem",
                    fontSize: "1rem",
                  }}
                  onKeyPress={(e) => e.key === "Enter" && createNewList()}
                />
                <div
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    justifyContent: "center",
                  }}
                >
                  <button
                    onClick={createNewList}
                    style={{
                      padding: "0.5rem 1.5rem",
                      backgroundColor: "#2563eb",
                      color: "white",
                      border: "none",
                      borderRadius: "0.375rem",
                      cursor: "pointer",
                    }}
                  >
                    Create List
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateList(false);
                      setListName("");
                    }}
                    style={{
                      padding: "0.5rem 1.5rem",
                      backgroundColor: "#6b7280",
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
            )}
          </div>
        )}

        {/* Search Section */}
        {(!pitchAngles || !activeList) && (
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "0.75rem",
              padding: "2rem",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
              marginBottom: "2rem",
            }}
          >
            <div style={{ marginBottom: "1.5rem" }}>
              <h2
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "600",
                  color: "#1f2937",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginBottom: "1rem",
                }}
              >
                <Search
                  style={{ width: "24px", height: "24px", color: "#2563eb" }}
                />
                Find Journalists
              </h2>
              <p style={{ color: "#6b7280", marginBottom: "1rem" }}>
                Describe the type of journalists you're looking for. Use "AND"
                (in caps) to find journalists covering multiple topics.
              </p>
            </div>

            <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && searchJournalists()}
                placeholder='e.g., "Tech journalists covering AI startups" or "Healthcare AND Boston"'
                style={{
                  flex: 1,
                  padding: "0.75rem 1rem",
                  border: "2px solid #e5e7eb",
                  borderRadius: "0.5rem",
                  fontSize: "1rem",
                  outline: "none",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
              />
              <button
                onClick={searchJournalists}
                disabled={isSearching || !activeProject}
                style={{
                  padding: "0.75rem 2rem",
                  backgroundColor:
                    isSearching || !activeProject ? "#9ca3af" : "#2563eb",
                  color: "white",
                  borderRadius: "0.5rem",
                  border: "none",
                  cursor:
                    isSearching || !activeProject ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  fontWeight: "500",
                  transition: "background-color 0.2s",
                }}
              >
                {isSearching ? (
                  <>
                    <Loader2
                      style={{
                        width: "20px",
                        height: "20px",
                        animation: "spin 1s linear infinite",
                      }}
                    />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search style={{ width: "20px", height: "20px" }} />
                    Search
                  </>
                )}
              </button>
            </div>

            {/* Search suggestions */}
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <span style={{ color: "#6b7280", fontSize: "0.875rem" }}>
                Try:
              </span>
              {[
                "Tech journalists covering startups",
                "Healthcare reporters in New York",
                "Business writers at WSJ",
                "Climate AND energy journalists",
                "AI AND ethics reporters",
                "Tech AND PR journalists",
              ].map((example) => (
                <button
                  key={example}
                  onClick={() => setSearchQuery(example)}
                  style={{
                    padding: "0.25rem 0.75rem",
                    backgroundColor: "#eff6ff",
                    color: "#2563eb",
                    borderRadius: "9999px",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.target.style.backgroundColor = "#dbeafe")
                  }
                  onMouseLeave={(e) =>
                    (e.target.style.backgroundColor = "#eff6ff")
                  }
                >
                  {example}
                </button>
              ))}
            </div>

            {/* Status messages */}
            {searchError && (
              <div
                style={{
                  marginTop: "1rem",
                  padding: "0.75rem",
                  backgroundColor: "#fee2e2",
                  border: "1px solid #fecaca",
                  borderRadius: "0.5rem",
                  color: "#dc2626",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <AlertCircle style={{ width: "16px", height: "16px" }} />
                {searchError}
              </div>
            )}

            {searchStatus && !searchError && (
              <div
                style={{
                  marginTop: "1rem",
                  padding: "0.75rem",
                  backgroundColor: "#d1fae5",
                  border: "1px solid #a7f3d0",
                  borderRadius: "0.5rem",
                  color: "#047857",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <CheckCircle style={{ width: "16px", height: "16px" }} />
                {searchStatus}
              </div>
            )}
          </div>
        )}

        {/* Add to List Button */}
        {activeList && selectedJournalists.length > 0 && !pitchAngles && (
          <div
            style={{
              marginBottom: "1rem",
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <button
              onClick={addToActiveList}
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: "#2563eb",
                color: "white",
                border: "none",
                borderRadius: "0.375rem",
                cursor: "pointer",
                fontWeight: "500",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <Plus style={{ width: "16px", height: "16px" }} />
              Add {selectedJournalists.length} Selected to {activeList.name}
            </button>
          </div>
        )}

        {/* Results Section */}
        {filteredJournalists.length > 0 && !pitchAngles && (
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "0.75rem",
              padding: "1.5rem",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
            }}
          >
            {/* Filters */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.5rem",
                flexWrap: "wrap",
                gap: "1rem",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "1rem" }}
              >
                <Filter
                  style={{ width: "20px", height: "20px", color: "#6b7280" }}
                />
                <select
                  value={filters.beat}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, beat: e.target.value }))
                  }
                  style={{
                    padding: "0.5rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.375rem",
                    fontSize: "0.875rem",
                  }}
                >
                  <option value="">All Beats</option>
                  {uniqueBeats.map((beat) => (
                    <option key={beat} value={beat}>
                      {beat}
                    </option>
                  ))}
                </select>
                <select
                  value={filters.publication}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      publication: e.target.value,
                    }))
                  }
                  style={{
                    padding: "0.5rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.375rem",
                    fontSize: "0.875rem",
                  }}
                >
                  <option value="">All Publications</option>
                  {uniquePublications.map((pub) => (
                    <option key={pub} value={pub}>
                      {pub}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() =>
                    setFilters({ beat: "", publication: "", location: "" })
                  }
                  style={{
                    color: "#2563eb",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                  }}
                >
                  Clear filters
                </button>
              </div>

              <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>
                Showing {filteredJournalists.length} journalists
              </p>
            </div>

            {/* Journalist Cards */}
            <div style={{ display: "grid", gap: "1rem" }}>
              {filteredJournalists.map((journalist, index) => (
                <JournalistCard
                  key={`${journalist.name}-${index}`}
                  journalist={journalist}
                />
              ))}
            </div>
          </div>
        )}

        {/* Active List Display */}
        {activeList && activeList.journalists.length > 0 && !pitchAngles && (
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "0.75rem",
              padding: "1.5rem",
              marginTop: "2rem",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
            }}
          >
            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: "600",
                marginBottom: "1rem",
              }}
            >
              {activeList.name} - Current Journalists (
              {activeList.journalists.length})
            </h3>
            <div style={{ display: "grid", gap: "0.5rem" }}>
              {activeList.journalists.map((journalist, index) => (
                <div
                  key={`${journalist.name}-${journalist.publication}-${index}`}
                  style={{
                    padding: "0.75rem",
                    backgroundColor: "#f9fafb",
                    borderRadius: "0.375rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <strong>{journalist.name}</strong>
                    <span style={{ color: "#6b7280", marginLeft: "0.5rem" }}>
                      {journalist.publication} • {journalist.beat}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setActiveList({
                        ...activeList,
                        journalists: activeList.journalists.filter(
                          (j) =>
                            !(
                              j.name === journalist.name &&
                              j.publication === journalist.publication
                            )
                        ),
                      });
                    }}
                    style={{
                      color: "#dc2626",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    <X style={{ width: "16px", height: "16px" }} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pitch Angles Display */}
        {pitchAngles && (
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "0.75rem",
              padding: "2rem",
              marginTop: "2rem",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
            }}
          >
            <h3
              style={{
                fontSize: "1.5rem",
                fontWeight: "600",
                marginBottom: "1.5rem",
              }}
            >
              <Zap
                style={{
                  width: "24px",
                  height: "24px",
                  display: "inline",
                  marginRight: "0.5rem",
                  color: "#7c3aed",
                }}
              />
              Generated Pitch Angles
            </h3>
            <div style={{ display: "grid", gap: "1.5rem" }}>
              {pitchAngles.map((angle, index) => (
                <div
                  key={index}
                  style={{
                    padding: "1.5rem",
                    backgroundColor: "#f9fafb",
                    borderRadius: "0.5rem",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <h4
                    style={{
                      fontSize: "1.125rem",
                      fontWeight: "600",
                      marginBottom: "0.5rem",
                    }}
                  >
                    {angle.title}
                  </h4>
                  <p style={{ color: "#4b5563", marginBottom: "1rem" }}>
                    {angle.description}
                  </p>
                  <div
                    style={{
                      display: "grid",
                      gap: "0.75rem",
                      fontSize: "0.875rem",
                    }}
                  >
                    <div>
                      <strong style={{ color: "#374151" }}>Best for:</strong>
                      <span style={{ color: "#6b7280", marginLeft: "0.5rem" }}>
                        {angle.targetJournalists.join(", ")}
                      </span>
                    </div>
                    <div>
                      <strong style={{ color: "#374151" }}>Hook type:</strong>
                      <span
                        style={{
                          color: "#6b7280",
                          marginLeft: "0.5rem",
                          backgroundColor: "#e5e7eb",
                          padding: "0.125rem 0.5rem",
                          borderRadius: "0.25rem",
                        }}
                      >
                        {angle.hookType}
                      </span>
                    </div>
                    {angle.keyMessages && (
                      <div>
                        <strong style={{ color: "#374151" }}>
                          Key messages:
                        </strong>
                        <ul
                          style={{
                            marginTop: "0.25rem",
                            marginLeft: "1.5rem",
                            color: "#6b7280",
                          }}
                        >
                          {angle.keyMessages.map((msg, idx) => (
                            <li key={idx}>{msg}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add spinner animation */}
      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default MediaListBuilder;
