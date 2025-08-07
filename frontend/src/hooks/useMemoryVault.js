// hooks/useMemoryVault.js
import { useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useProject } from "../contexts/ProjectContext";

/**
 * Custom hook for saving content to MemoryVault
 * Provides auto-save functionality for any feature component
 */
export const useMemoryVault = () => {
  const { projectId } = useParams();
  const { activeProject } = useProject(); // Changed from selectedProject to activeProject
  const [saveStatus, setSaveStatus] = useState(null); // 'saving', 'saved', 'error'
  const [lastSavedItem, setLastSavedItem] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  /**
   * Determine which MemoryVault folder based on content type
   * Updated to match the 5 default folders created per project
   */
  const determineFolderType = (contentType, folderType) => {
    // If folderType is explicitly provided, use it
    if (folderType) {
      return folderType;
    }

    // Map content type to folder type - MATCHING MEMORYVAULT STRUCTURE
    const folderMap = {
      // Content folder (PR Materials)
      "press-release": "content",
      announcement: "content",
      news: "content",
      "blog-post": "content",
      "social-media": "content",
      "email-template": "content",
      content: "content",

      // Campaign Intelligence folder
      "campaign-brief": "campaign-intelligence",
      "campaign-plan": "campaign-intelligence",
      "competitor-analysis": "campaign-intelligence",
      "campaign-strategy": "campaign-intelligence",

      // Media Lists folder
      "media-list": "media-lists",
      "media-contact": "media-lists",
      "journalist-list": "media-lists",

      // Crisis Management folder
      "crisis-plan": "crisis-management",
      "crisis-communication": "crisis-management",
      "crisis-report": "crisis-management",
      "crisis-response": "crisis-management",

      // Research folder
      analytics: "research",
      report: "research",
      "sentiment-analysis": "research",
      "performance-report": "research",
      "market-analysis": "research",
      research: "research",

      // Default
      default: "content",
    };

    return folderMap[contentType] || folderMap.default;
  };

  /**
   * Save content to MemoryVault
   * @param {Object} params - Save parameters
   * @param {string} params.content - The content to save
   * @param {string} params.title - Title of the content
   * @param {string} params.type - Type of content (e.g., 'press-release', 'blog-post')
   * @param {string} params.folder_type - Explicit folder type (optional)
   * @param {string} params.preview - Custom preview text (optional)
   * @param {Array} params.tags - Tags for the content
   * @param {Object} params.metadata - Additional metadata
   * @param {string} params.source - Source feature (e.g., 'content-generator', 'ai-assistant')
   * @returns {Promise<Object>} The saved item or null if error
   */
  const saveToMemoryVault = useCallback(
    async ({
      content,
      title,
      type = "general",
      folder_type,
      preview,
      tags = [],
      metadata = {},
      source = "unknown",
    }) => {
      console.log("=== useMemoryVault Hook Debug ===");
      console.log("1. saveToMemoryVault called");
      console.log("2. projectId from params:", projectId);
      console.log("3. activeProject:", activeProject);
      console.log("4. Content type:", typeof content);
      console.log("5. Content length:", content?.length);
      console.log("6. Title:", title);
      console.log("7. Type:", type);
      console.log("8. Folder type:", folder_type);

      // Use the projectId from params or from activeProject
      const currentProjectId = projectId || activeProject?.id;
      console.log("9. Current project ID:", currentProjectId);

      if (!currentProjectId || !content) {
        console.error("Missing required data for MemoryVault save", {
          projectId: currentProjectId,
          hasContent: !!content,
          activeProject,
        });
        setSaveStatus("error");
        setIsSaving(false);
        return { success: false, error: "Missing project or content" };
      }

      setSaveStatus("saving");
      setIsSaving(true);

      try {
        // Auto-generate tags if none provided
        const autoTags = [type, source, new Date().getFullYear().toString()];

        // Add project-specific tags if available
        if (activeProject) {
          if (activeProject.industry) autoTags.push(activeProject.industry);
          if (activeProject.campaign) autoTags.push(activeProject.campaign);
        }

        const finalTags = [...new Set([...tags, ...autoTags])].filter(Boolean);

        // Determine folder type
        const folderType = determineFolderType(type, folder_type);

        // Create preview
        let finalPreview = preview; // Use the provided preview parameter if available

        if (!finalPreview) {
          // Only generate preview if none was provided
          if (typeof content === "string") {
            finalPreview =
              content.length > 200
                ? content.substring(0, 200) + "..."
                : content;
          } else {
            finalPreview = JSON.stringify(content).substring(0, 200) + "...";
          }
        }

        const requestBody = {
          folder_type: folderType,
          title:
            title ||
            `${type.replace(/-/g, " ")} - ${new Date().toLocaleDateString()}`,
          content:
            typeof content === "string"
              ? content
              : JSON.stringify(content, null, 2),
          preview: finalPreview,
          type: type,
          tags: finalTags,
          author: metadata.author || "SignalDesk AI",
          status: metadata.status || "draft",
          source: source,
          metadata: {
            projectId: currentProjectId,
            projectName: activeProject?.name,
            projectIndustry: activeProject?.industry,
            projectCampaign: activeProject?.campaign,
            generatedAt: new Date().toISOString(),
            ...metadata,
          },
        };

        console.log("10. Request body prepared:", requestBody);
        console.log(
          "11. Making API call to:",
          `http://localhost:5001/api/projects/${currentProjectId}/memoryvault`
        );

        const response = await fetch(
          `http://localhost:5001/api/projects/${currentProjectId}/memoryvault`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify(requestBody),
          }
        );

        console.log("12. Response status:", response.status);
        console.log("13. Response ok?", response.ok);

        const data = await response.json();
        console.log("14. Response data:", data);

        if (response.ok && data.success) {
          setSaveStatus("saved");
          setLastSavedItem(data.item);
          setIsSaving(false);

          // Auto-clear success status after 3 seconds
          setTimeout(() => {
            setSaveStatus(null);
          }, 3000);

          return { success: true, item: data.item };
        } else {
          throw new Error(data.message || "Failed to save to MemoryVault");
        }
      } catch (error) {
        console.error("Error saving to MemoryVault:", error);
        setSaveStatus("error");
        setIsSaving(false);

        // Auto-clear error status after 5 seconds
        setTimeout(() => {
          setSaveStatus(null);
        }, 5000);

        return { success: false, error: error.message };
      }
    },
    [projectId, activeProject]
  );

  /**
   * Quick save function with minimal parameters
   */
  const quickSave = useCallback(
    async (content, title, type = "general") => {
      return saveToMemoryVault({ content, title, type });
    },
    [saveToMemoryVault]
  );

  /**
   * Clear save status manually
   */
  const clearStatus = useCallback(() => {
    setSaveStatus(null);
  }, []);

  return {
    saveToMemoryVault,
    quickSave,
    saveStatus,
    lastSavedItem,
    clearStatus,
    isProjectReady: !!(projectId || activeProject?.id),
    isSaving,
  };
};

// Export status types for consistency
export const SAVE_STATUS = {
  SAVING: "saving",
  SAVED: "saved",
  ERROR: "error",
};
