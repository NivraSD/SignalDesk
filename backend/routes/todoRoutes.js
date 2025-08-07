const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const authMiddleware = require("../src/middleware/auth");

// Get all todos for a user
router.get("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log("Fetching todos for user:", userId);

    const query = `
      SELECT t.*, p.name as project_name 
      FROM todos t
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE t.user_id = $1
      ORDER BY t.created_at DESC
    `;
    const result = await pool.query(query, [userId]);

    console.log("Found todos:", result.rows.length);
    res.json({ success: true, todos: result.rows });
  } catch (error) {
    console.error("Error fetching todos:", error);
    res.status(500).json({ error: "Failed to fetch todos" });
  }
});

// Create a new todo
router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      title,
      description,
      project_id,
      priority = "medium",
      status = "pending",
      due_date,
    } = req.body;
    const userId = req.user.userId;

    console.log("Creating todo:", { title, project_id, userId });

    // Validate that title is provided
    if (!title || !title.trim()) {
      return res.status(400).json({
        error: "Title is required",
        success: false,
      });
    }

    // If project_id is provided, verify it exists and belongs to user
    if (project_id) {
      const projectCheck = await pool.query(
        "SELECT id FROM projects WHERE id = $1 AND user_id = $2",
        [project_id, userId]
      );

      if (projectCheck.rows.length === 0) {
        console.log("Project not found:", project_id, "for user:", userId);
        return res.status(400).json({
          error:
            "Selected project not found. Please select a valid project or none.",
          success: false,
        });
      }
    }

    // Create the todo
    const query = `
      INSERT INTO todos (user_id, project_id, title, description, priority, status, due_date) 
      VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING *
    `;

    const values = [
      userId,
      project_id || null,
      title.trim(),
      description || "",
      priority,
      status,
      due_date || null,
    ];

    const result = await pool.query(query, values);
    console.log("Todo created successfully:", result.rows[0].id);

    res.json({ success: true, todo: result.rows[0] });
  } catch (error) {
    console.error("Todo creation error:", error);
    res
      .status(500)
      .json({ error: "Failed to create todo", details: error.message });
  }
});

// Update a todo
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, status, priority, due_date, project_id, description } =
      req.body;
    const userId = req.user.userId;

    console.log("Updating todo:", id, "with data:", {
      title,
      status,
      priority,
    });

    // Build dynamic update query based on provided fields
    const updateFields = [];
    const values = [];
    let valueIndex = 1;

    if (title !== undefined) {
      updateFields.push(`title = $${valueIndex}`);
      values.push(title);
      valueIndex++;
    }

    if (status !== undefined) {
      updateFields.push(`status = $${valueIndex}`);
      values.push(status);
      valueIndex++;
    }

    if (priority !== undefined) {
      updateFields.push(`priority = $${valueIndex}`);
      values.push(priority);
      valueIndex++;
    }

    if (due_date !== undefined) {
      updateFields.push(`due_date = $${valueIndex}`);
      values.push(due_date);
      valueIndex++;
    }

    if (project_id !== undefined) {
      updateFields.push(`project_id = $${valueIndex}`);
      values.push(project_id);
      valueIndex++;
    }

    if (description !== undefined) {
      updateFields.push(`description = $${valueIndex}`);
      values.push(description);
      valueIndex++;
    }

    // Always update the updated_at timestamp
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

    // Add id and user_id to values array
    values.push(id, userId);

    const query = `
      UPDATE todos 
      SET ${updateFields.join(", ")}
      WHERE id = $${valueIndex} AND user_id = $${valueIndex + 1}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Todo not found" });
    }

    console.log("Todo updated successfully:", result.rows[0].id);
    res.json({ success: true, todo: result.rows[0] });
  } catch (error) {
    console.error("Error updating todo:", error);
    res
      .status(500)
      .json({ error: "Failed to update todo", details: error.message });
  }
});

// Delete a todo
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    console.log("Deleting todo:", id, "for user:", userId);

    const query =
      "DELETE FROM todos WHERE id = $1 AND user_id = $2 RETURNING id";
    const result = await pool.query(query, [id, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Todo not found" });
    }

    console.log("Todo deleted successfully:", id);
    res.json({ success: true, message: "Todo deleted successfully" });
  } catch (error) {
    console.error("Error deleting todo:", error);
    res.status(500).json({ error: "Failed to delete todo" });
  }
});

module.exports = router;
