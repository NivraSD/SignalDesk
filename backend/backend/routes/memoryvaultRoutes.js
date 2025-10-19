const express = require("express");
const router = express.Router();
const pool = require("../config/database");

// Test route to verify routes are loaded
router.get("/test-memoryvault", (req, res) => {
  console.log("Test route hit!");
  res.json({ message: "MemoryVault routes are working!" });
});

// Get all items for a project
router.get("/projects/:projectId/memoryvault", async (req, res) => {
  console.log(">>> GET MemoryVault - Project ID:", req.params.projectId);
  try {
    const { projectId } = req.params;
    const userId = req.user?.userId || req.user?.id;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    // Verify user owns the project
    const projectCheck = await pool.query(
      "SELECT id FROM projects WHERE id = $1 AND user_id = $2",
      [projectId, userId]
    );

    if (projectCheck.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    // Get all folders
    const foldersResult = await pool.query(
      "SELECT * FROM memoryvault_folders WHERE project_id = $1 ORDER BY created_at",
      [projectId]
    );

    // Get all items
    const itemsResult = await pool.query(
      "SELECT * FROM memoryvault_items WHERE project_id = $1 ORDER BY created_at DESC",
      [projectId]
    );

    res.json({
      success: true,
      folders: foldersResult.rows,
      items: itemsResult.rows,
    });
  } catch (error) {
    console.error("Error fetching MemoryVault:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Save item to MemoryVault
router.post("/projects/:projectId/memoryvault", async (req, res) => {
  console.log(">>> POST MemoryVault - Start");
  console.log(">>> Project ID:", req.params.projectId);
  console.log(">>> User:", req.user);
  console.log(">>> Body:", req.body);

  try {
    const { projectId } = req.params;
    const userId = req.user?.userId || req.user?.id;

    // Extract data from request body
    const {
      title = "Untitled",
      content = "",
      preview: customPreview, // Get preview from request body
      type = "document",
      tags = [],
      source = "manual",
      folder_type = "content",
      metadata = {},
    } = req.body;

    console.log(">>> User ID:", userId);
    console.log(">>> Folder Type:", folder_type);
    console.log(">>> Custom Preview provided:", customPreview ? "Yes" : "No");

    if (!userId) {
      console.log(">>> ERROR: No user ID found");
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    if (!content) {
      console.log(">>> ERROR: No content provided");
      return res
        .status(400)
        .json({ success: false, message: "Content is required" });
    }

    // Verify user owns the project
    console.log(">>> Checking if user owns project...");
    const projectCheck = await pool.query(
      "SELECT id, name FROM projects WHERE id = $1 AND user_id = $2",
      [projectId, userId]
    );

    console.log(">>> Project check result:", projectCheck.rows);

    if (projectCheck.rows.length === 0) {
      console.log(">>> ERROR: Project not found or user doesn't own it");
      // Show what projects the user has
      const userProjects = await pool.query(
        "SELECT id, name FROM projects WHERE user_id = $1",
        [userId]
      );
      console.log(">>> User's projects:", userProjects.rows);

      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    // Find or create folder
    console.log(">>> Looking for folder type:", folder_type);
    let folderResult = await pool.query(
      "SELECT id FROM memoryvault_folders WHERE project_id = $1 AND folder_type = $2",
      [projectId, folder_type]
    );

    console.log(">>> Folder search result:", folderResult.rows);

    if (folderResult.rows.length === 0) {
      console.log(">>> No folder found, creating new one...");
      const folderMap = {
        "campaign-intelligence": "Campaign Intelligence",
        content: "PR Materials",
        research: "Research",
        "crisis-management": "Crisis Management",
        "media-lists": "Media Lists",
      };

      const folderName = folderMap[folder_type] || "General";
      console.log(">>> Creating folder with name:", folderName);

      folderResult = await pool.query(
        "INSERT INTO memoryvault_folders (project_id, folder_type, name, description) VALUES ($1, $2, $3, $4) RETURNING id",
        [
          projectId,
          folder_type,
          folderName,
          `Auto-created folder for ${source}`,
        ]
      );
      console.log(">>> New folder created with ID:", folderResult.rows[0].id);
    }

    const folderId = folderResult.rows[0].id;
    console.log(">>> Using folder ID:", folderId);

    // Generate preview - USE CUSTOM PREVIEW IF PROVIDED
    let preview;
    if (customPreview) {
      // Use the preview provided by the frontend
      preview = customPreview;
      console.log(">>> Using custom preview:", preview.substring(0, 100));
    } else {
      // Generate preview based on type
      if (type === "media-list") {
        try {
          const parsedContent = JSON.parse(content);
          const journalistCount = parsedContent.journalists?.length || 0;
          const journalistNames =
            parsedContent.journalists
              ?.slice(0, 3)
              .map((j) => j.name)
              .join(", ") || "";
          const moreCount =
            journalistCount > 3 ? ` and ${journalistCount - 3} more` : "";
          preview = `${journalistCount} journalists including ${journalistNames}${moreCount}.`;
          if (parsedContent.pitchAngles?.length > 0) {
            preview += ` ${parsedContent.pitchAngles.length} pitch angles generated.`;
          }
        } catch (e) {
          // If parsing fails, use default truncation
          preview =
            content.substring(0, 200) + (content.length > 200 ? "..." : "");
        }
      } else {
        // Default preview generation
        preview =
          content.substring(0, 200) + (content.length > 200 ? "..." : "");
      }
    }

    // Prepare values for insert
    const aiInsights = null; // Skip AI for now
    const aiScore = null;

    console.log(">>> Inserting item into database...");
    console.log(">>> Final preview:", preview);

    // Insert item
    const insertQuery = `
      INSERT INTO memoryvault_items
      (project_id, folder_id, title, content, preview, type, tags, source, ai_insights, ai_score, source_metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const values = [
      projectId,
      folderId,
      title,
      content,
      preview,
      type,
      tags,
      source,
      aiInsights,
      aiScore,
      JSON.stringify(metadata),
    ];

    console.log(">>> Insert values:", {
      projectId,
      folderId,
      title: title.substring(0, 50) + "...",
      contentLength: content.length,
      type,
      tags,
      source,
      previewLength: preview.length,
    });

    const result = await pool.query(insertQuery, values);

    console.log(">>> Item saved successfully!");
    console.log(">>> Saved item ID:", result.rows[0].id);

    res.json({
      success: true,
      item: result.rows[0],
      message: "Content saved to MemoryVault",
    });
  } catch (error) {
    console.error(">>> ERROR in MemoryVault save:", error);
    console.error(">>> Error details:", error.message);
    console.error(">>> Error stack:", error.stack);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// Export the router
module.exports = router;
