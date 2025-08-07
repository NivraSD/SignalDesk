const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const authMiddleware = require("../src/middleware/auth");

// Get all projects for a user
router.get("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log("Fetching projects for user:", userId);

    const query =
      "SELECT * FROM projects WHERE user_id = $1 ORDER BY created_at DESC";
    const result = await pool.query(query, [userId]);

    console.log("Found projects:", result.rows.length);
    res.json({ success: true, projects: result.rows });
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

// Get a single project
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const query = "SELECT * FROM projects WHERE id = $1 AND user_id = $2";
    const result = await pool.query(query, [id, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json({ success: true, project: result.rows[0] });
  } catch (error) {
    console.error("Error fetching project:", error);
    res.status(500).json({ error: "Failed to fetch project" });
  }
});

// Create a new project - FIXED VERSION
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { name, campaign, industry, description } = req.body;
    const userId = req.user.userId;

    console.log("Creating project for user:", userId);
    console.log("Project data:", { name, campaign, industry, description });

    // Create project with correct column names
    const result = await pool.query(
      "INSERT INTO projects (name, user_id, campaign_name, industry, status, description) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [name, userId, campaign, industry, "Active", description]
    );

    const project = result.rows[0];
    console.log("Project created successfully:", project.id);

    // Create default MemoryVault folders
    const folderTypes = [
      "Press Releases",
      "Media Coverage",
      "Social Media",
      "Reports",
      "Other",
    ];

    for (const folderType of folderTypes) {
      await pool.query(
        "INSERT INTO memoryvault_folders (project_id, folder_type, name, description) VALUES ($1, $2, $3, $4)",
        [
          project.id,
          folderType.toLowerCase().replace(" ", "_"),
          folderType,
          `Default ${folderType} folder`,
        ]
      );
    }

    res.json({ success: true, project });
  } catch (error) {
    console.error("Project creation error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Update a project
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, campaign, industry, status, description } = req.body;
    const userId = req.user.userId;

    const query = `
      UPDATE projects 
      SET name = $1, campaign_name = $2, industry = $3, status = $4, description = $5, updated_at = CURRENT_TIMESTAMP
      WHERE id = $6 AND user_id = $7
      RETURNING *
    `;
    const values = [name, campaign, industry, status, description, id, userId];

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json({ success: true, project: result.rows[0] });
  } catch (error) {
    console.error("Error updating project:", error);
    res.status(500).json({ error: "Failed to update project" });
  }
});

// Delete a project
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const query =
      "DELETE FROM projects WHERE id = $1 AND user_id = $2 RETURNING id";
    const result = await pool.query(query, [id, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json({ success: true, message: "Project deleted successfully" });
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({ error: "Failed to delete project" });
  }
});

module.exports = router;
