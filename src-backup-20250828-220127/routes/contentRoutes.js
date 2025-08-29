const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const contentController = require("../controllers/contentController");
const multer = require("multer");
const claudeService = require("../../config/claude");
const db = require("../../config/database");

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "text/html",
      "text/plain",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// All routes require authentication
router.use(authMiddleware);

// Content generation
router.post("/generate", contentController.generateContent);
router.post("/ai-generate", contentController.generateWithAI);

// Content management
router.post("/save", contentController.saveContent);
router.get("/history", contentController.getContentHistory);

// Template management - MUST COME BEFORE /:id route
router.get("/templates", contentController.getTemplates);
router.post(
  "/templates/upload",
  upload.array("templates", 10),
  contentController.uploadTemplates
);
router.delete("/templates/:id", contentController.deleteTemplate);

// Export
router.post("/export", contentController.exportContent);

// Analyze route with full Claude AI analysis
router.post("/analyze", async (req, res) => {
  console.log("=== ANALYZE ENDPOINT HIT ===");
  console.log("1. req.user:", req.user);

  try {
    const {
      content,
      contentType,
      tone,
      toneDescription,
      targetAudience,
      context,
    } = req.body;

    // Get userId from the authenticated user
    const userId = req.user?.userId || req.user?.id;

    console.log("2. userId extracted:", userId);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication failed - no userId found",
        debug: {
          reqUser: req.user,
          availableKeys: req.user ? Object.keys(req.user) : [],
        },
      });
    }

    if (!content || !contentType) {
      return res.status(400).json({
        success: false,
        message: "Content and contentType are required",
      });
    }

    // Create analysis prompt for Claude
    const analysisPrompt = `
You are an expert PR content analyst. Analyze the following ${contentType} content and provide a comprehensive performance assessment.

Content Type: ${contentType}
Target Tone: ${tone} - ${toneDescription?.description || ""}
Target Audience: ${targetAudience || "general business audience"}
Company: ${context?.company || "unknown"}
Industry: ${context?.industry || "technology"}

CONTENT TO ANALYZE:
${content}

Provide a detailed analysis in the following JSON structure:
{
  "overallScore": [0-100 score based on overall quality],
  "scores": {
    "clarity": [0-100 score for message clarity],
    "resonance": [0-100 score for audience resonance],
    "credibility": [0-100 score for credibility and authority],
    "shareability": [0-100 score for viral/share potential],
    "riskLevel": [0-100 where 0 is no risk, 100 is high risk],
    "brandAlignment": [0-100 score for brand voice consistency]
  },
  "toneAlignment": {
    "score": [0-100 score for how well it matches target tone],
    "feedback": "Detailed feedback on tone alignment",
    "matches": ["List of elements that match the target tone well"],
    "improvements": ["List of areas where tone could be better aligned"]
  },
  "insights": {
    "strengths": ["List 3-5 key strengths of this content"],
    "improvements": ["List 3-5 areas for improvement"],
    "risks": ["List any potential risks or concerns"]
  },
  "predictions": {
    "mediaPickup": "Prediction about media interest (High/Medium/Low with reasoning)",
    "socialEngagement": "Prediction about social media performance",
    "investorInterest": "Prediction about investor/stakeholder interest"
  },
  "recommendations": {
    "immediate": ["Actions to take before publishing"],
    "followUp": ["Post-publication strategies"]
  }
}

Be specific, actionable, and base scores on PR industry best practices.`;

    // Call Claude for analysis
    const claudeResponse = await claudeService.sendMessage(analysisPrompt);

    console.log("3. Claude response received");

    // Parse Claude's response
    let analysis;
    try {
      // Extract JSON from Claude's response
      const jsonMatch = claudeResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in Claude response");
      }
    } catch (parseError) {
      console.error("Failed to parse Claude response:", parseError);
      // Fallback to a basic analysis
      analysis = {
        overallScore: 75,
        scores: {
          clarity: 80,
          resonance: 75,
          credibility: 78,
          shareability: 72,
          riskLevel: 20,
          brandAlignment: 75,
        },
        toneAlignment: {
          score: 75,
          feedback:
            "Content analysis completed but detailed parsing failed. Please try again.",
          matches: ["Structure is appropriate for content type"],
          improvements: ["Full analysis temporarily unavailable"],
        },
        insights: {
          strengths: [
            "Content follows standard format",
            "Clear message structure",
          ],
          improvements: ["Detailed analysis pending"],
          risks: ["None identified"],
        },
        predictions: {
          mediaPickup: "Medium - Standard content quality",
          socialEngagement: "Medium - Typical engagement expected",
          investorInterest: "Medium - Standard messaging",
        },
        recommendations: {
          immediate: ["Review content before publishing"],
          followUp: ["Monitor engagement metrics"],
        },
      };
    }

    // Save analysis to database
    try {
      const query = `
        INSERT INTO content_analyses 
        (user_id, content_type, content_preview, analysis_data, overall_score, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING id
      `;

      const values = [
        userId,
        contentType,
        content.substring(0, 500), // First 500 chars as preview
        JSON.stringify(analysis),
        analysis.overallScore,
      ];

      const result = await db.query(query, values);
      console.log("4. Analysis saved to database, ID:", result.rows[0].id);
    } catch (dbError) {
      console.error("Failed to save analysis to database:", dbError);
      // Continue anyway - we can still return the analysis
    }

    // Return successful analysis
    res.json({
      success: true,
      analysis: analysis,
      metadata: {
        analyzedAt: new Date().toISOString(),
        contentType: contentType,
        tone: tone,
        contentLength: content.length,
      },
    });
  } catch (error) {
    console.error("Error in analyze route:", error);
    res.status(500).json({
      success: false,
      message: "Failed to analyze content",
      error: error.message,
    });
  }
});

// Single content routes - MUST COME LAST
router.get("/:id", contentController.getContent);
router.put("/:id", contentController.updateContent);
router.delete("/:id", contentController.deleteContent);

module.exports = router;
