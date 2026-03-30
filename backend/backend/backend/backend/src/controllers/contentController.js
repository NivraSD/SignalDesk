const claudeService = require("../../config/claude");
const db = require("../../config/database");
const pool = require("../config/db");

const contentController = {
  // Generate content with form data
  generateContent: async (req, res) => {
    try {
      const {
        type,
        formData,
        tone,
        toneDescription,
        projectId,
        companyName,
        industry,
      } = req.body;
      const userId = req.user.id;

      if (!type || !formData) {
        return res.status(400).json({
          success: false,
          message: "Content type and form data are required",
        });
      }
      const toneInstructions =
        tone && toneDescription
          ? `
      
      IMPORTANT TONE REQUIREMENTS:
      Generate this content in a ${toneDescription.label} tone.
      ${toneDescription.description}
      
      Key characteristics to incorporate:
      ${toneDescription.characteristics.map((c) => `- ${c}`).join("\n")}
      `
          : "";

      // Build prompt based on content type
      const prompt = buildContentPrompt(type, formData, companyName, industry);

      // Generate with Claude

      const content = await claudeService.sendMessage(prompt);
      console.log("AI Generation - Response:", content);

      res.json({ content });
    } catch (error) {
      console.error("Content generation error:", error);
      res.status(500).json({ error: "Failed to generate content" });
    }
  },

  // Generate with AI assistant
  generateWithAI: async (req, res) => {
    try {
      const {
        prompt,
        type,
        tone,
        toneDescription,
        projectId,
        companyName,
        industry,
      } = req.body;
      const userId = req.user.id;

      const contentTypeContext = {
        "press-release":
          "Create a professional press release following AP style",
        "crisis-response":
          "Create a crisis response statement with empathy and accountability",
        "social-post": "Create an engaging social media post",
        "media-pitch": "Create a compelling media pitch",
        "exec-statement": "Create an executive statement with authority",
        "qa-doc": "Create a Q&A document with clear answers",
        messaging: "Create a messaging framework with clear value proposition",
        "thought-leadership": "Create a thought leadership article",
        presentation: "Create a presentation deck with clear slides",
      };
      const toneInstructions =
        tone && toneDescription
          ? `
    
        TONE REQUIREMENTS:
        Write in a ${toneDescription.label} tone.
        ${toneDescription.description}
        
        Ensure the content reflects these characteristics:
        ${toneDescription.characteristics.map((c) => `- ${c}`).join("\n")}
        `
          : "";

      const fullPrompt = `
    ${contentTypeContext[type] || `Create professional ${type} content`}
    
    User request: ${prompt}
    ${toneInstructions}
    
    Company: ${companyName}
    Industry: ${industry}
    
    Generate the content based on the user's request while maintaining the specified tone.`;

      console.log("AI Generation - Type:", type);
      console.log("AI Generation - Prompt:", prompt);
      console.log("AI Generation - Full Prompt:", fullPrompt);

      const content = await claudeService.sendMessage(fullPrompt);
      console.log("AI Generation - Response:", content);

      console.log("AI Generation - Type:", type);
      console.log("AI Generation - Prompt:", prompt);
      console.log("AI Generation - Full Prompt:", fullPrompt);

      res.json({
        success: true,
        content: content,
        message: "Content generated successfully with AI",
      });
    } catch (error) {
      console.error("AI generation error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to generate content with AI",
        message: error.message,
      });
    }
  },

  // Save content
  saveContent: async (req, res) => {
    try {
      const { title, type, content, projectId, formData } = req.body;
      const userId = req.user.id;

      const query = `
        INSERT INTO content (user_id, project_id, title, type, content, form_data, status)
        VALUES ($1, $2, $3, $4, $5, $6, 'draft')
        RETURNING *
      `;

      const values = [
        userId,
        projectId,
        title,
        type,
        content,
        JSON.stringify(formData),
      ];
      const result = await pool.query(query, values);

      res.json({
        message: "Content saved successfully",
        content: result.rows[0],
      });
    } catch (error) {
      console.error("Save content error:", error);
      res.status(500).json({ error: "Failed to save content" });
    }
  },

  // Get content history
  getContentHistory: async (req, res) => {
    try {
      const userId = req.user.id;
      const { type, projectId } = req.query;

      let query = `
        SELECT id, title, type, status, created_at, updated_at
        FROM content
        WHERE user_id = $1
      `;
      const values = [userId];

      if (type) {
        query += " AND type = $2";
        values.push(type);
      }

      if (projectId) {
        query +=
          values.length === 2 ? " AND project_id = $3" : " AND project_id = $2";
        values.push(projectId);
      }

      query += " ORDER BY created_at DESC LIMIT 50";

      const result = await pool.query(query, values);
      res.json(result.rows);
    } catch (error) {
      console.error("Get content history error:", error);
      res.status(500).json({ error: "Failed to get content history" });
    }
  },

  // Get single content
  getContent: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const query = "SELECT * FROM content WHERE id = $1 AND user_id = $2";
      const result = await pool.query(query, [id, userId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Content not found" });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error("Get content error:", error);
      res.status(500).json({ error: "Failed to get content" });
    }
  },

  // Update content
  updateContent: async (req, res) => {
    try {
      const { id } = req.params;
      const { title, content, status } = req.body;
      const userId = req.user.id;

      const query = `
        UPDATE content 
        SET title = $1, content = $2, status = $3, updated_at = CURRENT_TIMESTAMP
        WHERE id = $4 AND user_id = $5
        RETURNING *
      `;

      const result = await pool.query(query, [
        title,
        content,
        status,
        id,
        userId,
      ]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Content not found" });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error("Update content error:", error);
      res.status(500).json({ error: "Failed to update content" });
    }
  },

  // Delete content
  deleteContent: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const query =
        "DELETE FROM content WHERE id = $1 AND user_id = $2 RETURNING id";
      const result = await pool.query(query, [id, userId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Content not found" });
      }

      res.json({ message: "Content deleted successfully" });
    } catch (error) {
      console.error("Delete content error:", error);
      res.status(500).json({ error: "Failed to delete content" });
    }
  },

  // Get templates
  getTemplates: async (req, res) => {
    try {
      const userId = req.user.id;
      const { contentType } = req.query;

      let query = `
        SELECT id, name, content_type, file_type, size, placeholders, created_at
        FROM templates
        WHERE user_id = $1
      `;
      const values = [userId];

      if (contentType) {
        query += " AND (content_type = $2 OR content_type = 'universal')";
        values.push(contentType);
      }

      query += " ORDER BY created_at DESC";

      const result = await pool.query(query, values);
      res.json(result.rows);
    } catch (error) {
      console.error("Get templates error:", error);
      res.status(500).json({ error: "Failed to get templates" });
    }
  },

  // Upload templates
  uploadTemplates: async (req, res) => {
    try {
      const userId = req.user.id;
      const { contentType } = req.body;
      const files = req.files;

      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
      }

      const uploaded = [];

      for (const file of files) {
        const content = file.buffer.toString("utf8");
        const placeholders = detectPlaceholders(content);

        const query = `
          INSERT INTO templates (user_id, name, content, content_type, file_type, size, placeholders)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id, name
        `;

        const values = [
          userId,
          file.originalname,
          content,
          contentType || "universal",
          file.mimetype,
          file.size,
          JSON.stringify(placeholders),
        ];

        const result = await pool.query(query, values);
        uploaded.push(result.rows[0]);
      }

      res.json({
        message: "Templates uploaded successfully",
        uploaded: uploaded.length,
      });
    } catch (error) {
      console.error("Upload templates error:", error);
      res.status(500).json({ error: "Failed to upload templates" });
    }
  },

  // Delete template
  deleteTemplate: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const query =
        "DELETE FROM templates WHERE id = $1 AND user_id = $2 RETURNING id";
      const result = await pool.query(query, [id, userId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Template not found" });
      }

      res.json({ message: "Template deleted successfully" });
    } catch (error) {
      console.error("Delete template error:", error);
      res.status(500).json({ error: "Failed to delete template" });
    }
  },

  // Export content
  exportContent: async (req, res) => {
    try {
      const { content, format, templateId, type } = req.body;
      const userId = req.user.id;

      let exportedContent = content;
      let filename = `${type}_${Date.now()}`;
      let mimeType = "text/plain";

      if (templateId) {
        // Apply template
        const templateQuery =
          "SELECT * FROM templates WHERE id = $1 AND user_id = $2";
        const templateResult = await pool.query(templateQuery, [
          templateId,
          userId,
        ]);

        if (templateResult.rows.length > 0) {
          const template = templateResult.rows[0];
          exportedContent = applyTemplate(template.content, content);
          filename = template.name.replace(/\.[^/.]+$/, "") + "_filled";
        }
      }

      // Set appropriate mime type and extension
      switch (format) {
        case "word":
          mimeType =
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
          filename += ".docx";
          break;
        case "pdf":
          mimeType = "application/pdf";
          filename += ".pdf";
          break;
        case "powerpoint":
          mimeType =
            "application/vnd.openxmlformats-officedocument.presentationml.presentation";
          filename += ".pptx";
          break;
        case "google-docs":
          // Return instructions for Google Docs import
          exportedContent = `Copy this content and paste into Google Docs:\n\n${exportedContent}`;
          filename += ".txt";
          break;
        default:
          filename += ".txt";
      }

      res.json({
        content: exportedContent,
        filename,
        mimeType,
      });
    } catch (error) {
      console.error("Export error:", error);
      res.status(500).json({ error: "Failed to export content" });
    }
  },
};

// Helper function to build content prompt
function buildContentPrompt(type, formData, companyName, industry) {
  const prompts = {
    "press-release": `
      Create a professional press release for ${companyName}.
      Headline: ${formData.headline || "Company announcement"}
      Location: ${formData.location || "CITY, STATE"}
      Announcement: ${formData.announcement}
      Metrics: ${formData.metrics || "Include relevant metrics"}
      Quotes: ${formData.quotes || "Include executive quote"}
      Background: ${formData.background || "Company background"}
      Timeline: ${formData.timing || "Implementation timeline"}
      
      Follow AP style guidelines. Use inverted pyramid structure.
    `,
    // Add other content types...
  };

  return (
    prompts[type] || "Generate professional content following best practices."
  );
}

// Helper function to detect placeholders in templates
function detectPlaceholders(content) {
  const placeholders = new Set();
  const patterns = [/\{\{([^}]+)\}\}/g, /\[([^\]]+)\]/g, /\$\{([^}]+)\}/g];

  patterns.forEach((pattern) => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const placeholder = match[1].trim();
      if (placeholder.length < 50) {
        placeholders.add(placeholder);
      }
    }
  });

  return Array.from(placeholders);
}

// Helper function to apply template
function applyTemplate(template, content) {
  let result = template;

  // Extract title from content
  const title = content.split("\n")[0] || "Untitled";
  exports.generateWithAI = async (req, res) => {
    try {
      const {
        prompt,
        type,
        tone,
        toneDescription,
        projectId,
        companyName,
        industry,
      } = req.body;

      console.log("=== AI Content Generation ===");
      console.log("Prompt:", prompt);
      console.log("Type:", type);
      console.log("Tone:", tone);

      // Create a comprehensive prompt for Claude
      const aiPrompt = `
You are an expert PR content writer. Create a ${type} based on the following request:

User Request: ${prompt}

Content Type: ${type}
Tone: ${tone} - ${toneDescription?.description || ""}
Tone Characteristics: ${toneDescription?.characteristics?.join(", ") || ""}
Company: ${companyName}
Industry: ${industry}

Please write a complete, professional ${type} that:
1. Addresses the user's specific request
2. Follows best practices for ${type} writing
3. Maintains the ${tone} tone throughout
4. Is ready for immediate use

Do not include any explanations or meta-commentary. Only provide the actual content.`;

      const claudeResponse = await claudeService.sendMessage(aiPrompt);

      console.log("Claude response received, length:", claudeResponse.length);

      res.json({
        success: true,
        content: claudeResponse,
        metadata: {
          type,
          tone,
          generatedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("AI generation error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to generate content with AI",
        error: error.message,
      });
    }
  };

  // Get content history
  exports.getContentHistory = async (req, res) => {
    try {
      const userId = req.user?.userId || req.user?.id;

      const query = `
      SELECT 
        id,
        title,
        type,
        content,
        project_id,
        created_at,
        metadata
      FROM saved_content
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 50
    `;

      const result = await db.query(query, [userId]);

      res.json({
        success: true,
        data: result.rows,
      });
    } catch (error) {
      console.error("Error fetching content history:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch content history",
        error: error.message,
      });
    }
  };

  // Save content
  exports.saveContent = async (req, res) => {
    try {
      const userId = req.user?.userId || req.user?.id;
      const { title, type, content, projectId, formData } = req.body;

      const query = `
      INSERT INTO saved_content 
      (user_id, title, type, content, project_id, metadata, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING id
    `;

      const values = [
        userId,
        title,
        type,
        content,
        projectId || null,
        JSON.stringify({ formData }) || null,
      ];

      const result = await db.query(query, values);

      res.json({
        success: true,
        message: "Content saved successfully",
        id: result.rows[0].id,
      });
    } catch (error) {
      console.error("Error saving content:", error);
      res.status(500).json({
        success: false,
        message: "Failed to save content",
        error: error.message,
      });
    }
  };

  // Get templates
  exports.getTemplates = async (req, res) => {
    try {
      const userId = req.user?.userId || req.user?.id;

      const query = `
      SELECT 
        id,
        name,
        content_type,
        file_path,
        created_at
      FROM content_templates
      WHERE user_id = $1
      ORDER BY created_at DESC
    `;

      const result = await db.query(query, [userId]);

      res.json({
        success: true,
        data: result.rows,
      });
    } catch (error) {
      console.error("Error fetching templates:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch templates",
        error: error.message,
      });
    }
  };

  // Upload templates
  exports.uploadTemplates = async (req, res) => {
    try {
      const userId = req.user?.userId || req.user?.id;
      const { contentType } = req.body;
      const files = req.files;

      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No files uploaded",
        });
      }

      let uploadedCount = 0;

      for (const file of files) {
        const query = `
        INSERT INTO content_templates 
        (user_id, name, content_type, file_path, file_data, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
      `;

        const values = [
          userId,
          file.originalname,
          contentType || "general",
          file.originalname,
          file.buffer,
        ];

        await db.query(query, values);
        uploadedCount++;
      }

      res.json({
        success: true,
        data: {
          uploaded: uploadedCount,
        },
      });
    } catch (error) {
      console.error("Error uploading templates:", error);
      res.status(500).json({
        success: false,
        message: "Failed to upload templates",
        error: error.message,
      });
    }
  };

  // Delete template
  exports.deleteTemplate = async (req, res) => {
    try {
      const userId = req.user?.userId || req.user?.id;
      const { id } = req.params;

      const query = `
      DELETE FROM content_templates 
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `;

      const result = await db.query(query, [id, userId]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Template not found",
        });
      }

      res.json({
        success: true,
        message: "Template deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting template:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete template",
        error: error.message,
      });
    }
  };

  // Export content
  exports.exportContent = async (req, res) => {
    try {
      const { content, format, type, templateId } = req.body;

      // Simple export implementation - you can enhance this
      let exportedContent = content;
      let mimeType = "text/plain";
      let extension = "txt";

      switch (format) {
        case "word":
          mimeType =
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
          extension = "docx";
          break;
        case "pdf":
          mimeType = "application/pdf";
          extension = "pdf";
          break;
        case "google-docs":
          mimeType = "text/html";
          extension = "html";
          exportedContent = `<html><body>${content.replace(
            /\n/g,
            "<br>"
          )}</body></html>`;
          break;
        case "powerpoint":
          mimeType =
            "application/vnd.openxmlformats-officedocument.presentationml.presentation";
          extension = "pptx";
          break;
      }

      res.json({
        success: true,
        content: exportedContent,
        data: {
          mimeType,
          filename: `${type}-${Date.now()}.${extension}`,
        },
      });
    } catch (error) {
      console.error("Error exporting content:", error);
      res.status(500).json({
        success: false,
        message: "Failed to export content",
        error: error.message,
      });
    }
  };
  // Common replacements
  const replacements = {
    "{{title}}": title,
    "{{content}}": content,
    "{{date}}": new Date().toLocaleDateString(),
    "[TITLE]": title,
    "[CONTENT]": content,
    "[DATE]": new Date().toLocaleDateString(),
    "${title}": title,
    "${content}": content,
    "${date}": new Date().toLocaleDateString(),
  };

  Object.entries(replacements).forEach(([placeholder, value]) => {
    result = result.replace(
      new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"),
      value
    );
  });

  return result;
}

module.exports = contentController;
