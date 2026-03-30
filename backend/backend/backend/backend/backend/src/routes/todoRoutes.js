// backend/routes/todoRoutes.js
const express = require("express");
const router = express.Router();
const pool = require("../config/database");

// Get all todos for user
router.get("/", async (req, res) => {
  try {
    const userId = req.userId || req.user?.id;

    const result = await pool.query(
      `SELECT t.*, p.name as project_name 
       FROM todos t
       LEFT JOIN projects p ON t.project_id = p.id
       WHERE t.user_id = $1
       ORDER BY t.created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      todos: result.rows,
    });
  } catch (error) {
    console.error("Error fetching todos:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch todos",
    });
  }
});

// Create todo
router.post("/", async (req, res) => {
  try {
    const userId = req.userId || req.user?.id;
    // Frontend sends 'text', but we store it as 'title'
    const {
      text,
      project_id,
      priority = "medium",
      description,
      due_date,
    } = req.body;

    if (project_id) {
      const projectCheck = await pool.query(
        "SELECT id FROM projects WHERE id = $1 AND user_id = $2",
        [project_id, userId]
      );

      if (projectCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          error: "Project not found or access denied",
        });
      }
    }

    const result = await pool.query(
      `INSERT INTO todos (user_id, project_id, title, description, priority, due_date, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *, 
       (SELECT name FROM projects WHERE id = $2) as project_name`,
      [
        userId,
        project_id || null,
        text,
        description || null,
        priority,
        due_date || null,
        "pending",
      ]
    );

    res.json({
      success: true,
      todo: result.rows[0],
    });
  } catch (error) {
    console.error("Error creating todo:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create todo",
    });
  }
});

// Update todo
router.put("/:id", async (req, res) => {
  try {
    const userId = req.userId || req.user?.id;
    const todoId = req.params.id;
    // Handle both 'completed' boolean and 'status' string
    const {
      completed,
      text,
      priority,
      project_id,
      status,
      description,
      due_date,
    } = req.body;

    const updates = [];
    const values = [];
    let valueIndex = 1;

    // Convert completed boolean to status
    if (completed !== undefined) {
      updates.push(`status = $${valueIndex++}`);
      values.push(completed ? "completed" : "pending");
    } else if (status !== undefined) {
      updates.push(`status = $${valueIndex++}`);
      values.push(status);
    }

    if (text !== undefined) {
      updates.push(`title = $${valueIndex++}`);
      values.push(text);
    }

    if (description !== undefined) {
      updates.push(`description = $${valueIndex++}`);
      values.push(description);
    }

    if (priority !== undefined) {
      updates.push(`priority = $${valueIndex++}`);
      values.push(priority);
    }

    if (project_id !== undefined) {
      updates.push(`project_id = $${valueIndex++}`);
      values.push(project_id);
    }

    if (due_date !== undefined) {
      updates.push(`due_date = $${valueIndex++}`);
      values.push(due_date);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No updates provided",
      });
    }

    values.push(todoId, userId);

    const result = await pool.query(
      `UPDATE todos 
       SET ${updates.join(", ")}
       WHERE id = $${valueIndex} AND user_id = $${valueIndex + 1}
       RETURNING *, 
       (SELECT name FROM projects WHERE id = todos.project_id) as project_name`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Todo not found",
      });
    }

    res.json({
      success: true,
      todo: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating todo:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update todo",
    });
  }
});

// Delete todo
router.delete("/:id", async (req, res) => {
  try {
    const userId = req.userId || req.user?.id;
    const todoId = req.params.id;

    const result = await pool.query(
      "DELETE FROM todos WHERE id = $1 AND user_id = $2 RETURNING id",
      [todoId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Todo not found",
      });
    }

    res.json({
      success: true,
      message: "Todo deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting todo:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete todo",
    });
  }
});

module.exports = router;
