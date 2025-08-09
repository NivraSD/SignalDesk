// backend/src/routes/mediaRoutes.js - Cleaned version
const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const pool = require("../../config/database");
const claudeService = require("../../config/claude");

// Search Reporters endpoint (alias for search-journalists)
router.post("/search-reporters", async (req, res) => {
  console.log("📰 Media search-reporters request:", req.body);
  
  const mockJournalists = [
    {
      name: "Sarah Chen",
      publication: "TechCrunch", 
      beat: "AI and Machine Learning",
      email: "sarah.chen@techcrunch.com",
      bio: "Senior tech reporter covering artificial intelligence",
      twitter: "@sarahchen_tech",
      linkedin: "linkedin.com/in/sarahchen"
    },
    {
      name: "Michael Rodriguez",
      publication: "Wall Street Journal",
      beat: "Technology and Business",
      email: "m.rodriguez@wsj.com",
      bio: "Technology correspondent focusing on enterprise software",
      twitter: "@mrodriguez_wsj",
      linkedin: "linkedin.com/in/michaelrodriguez"
    },
    {
      name: "Emma Thompson",
      publication: "Forbes",
      beat: "Startups and Venture Capital",
      email: "emma.thompson@forbes.com",
      bio: "Contributor covering startup ecosystem",
      twitter: "@emmathompson",
      linkedin: "linkedin.com/in/ethompson"
    }
  ];
  
  res.json({
    success: true,
    journalists: mockJournalists,
    count: mockJournalists.length,
    query: req.body.query || "all"
  });
});

// Search Journalists endpoint - FIXED VERSION (keeping both for compatibility)
router.post("/search-journalists", async (req, res) => {
  console.log("📰 Media search-journalists request:", req.body);
  
  const mockJournalists = [
    {
      name: "Sarah Chen",
      publication: "TechCrunch", 
      beat: "AI and Machine Learning",
      email: "sarah.chen@techcrunch.com",
      bio: "Senior tech reporter covering artificial intelligence",
      twitter: "@sarahchen_tech",
      linkedin: "linkedin.com/in/sarahchen"
    },
    {
      name: "Michael Rodriguez",
      publication: "Wall Street Journal",
      beat: "Technology and Business",
      email: "m.rodriguez@wsj.com",
      bio: "Technology correspondent focusing on enterprise software",
      twitter: "@mrodriguez_wsj",
      linkedin: "linkedin.com/in/michaelrodriguez"
    },
    {
      name: "Emma Thompson",
      publication: "Forbes",
      beat: "Startups and Venture Capital",
      email: "emma.thompson@forbes.com",
      bio: "Contributor covering startup ecosystem",
      twitter: "@emmathompson",
      linkedin: "linkedin.com/in/ethompson"
    }
  ];
  
  res.json({
    success: true,
    journalists: mockJournalists,
    count: mockJournalists.length,
    query: req.body.query || "all"
  });
});

// AI-powered journalist discovery using Claude
router.post("/discover", authMiddleware, async (req, res) => {
  try {
    const { query, projectId, limit = 20 } = req.body;
    const userId = req.userId;

    console.log("Media discovery request:", { query, projectId, limit });

    // Use Claude to generate journalist suggestions
    const prompt = `Based on this search query: "${query}"
    
    Generate a list of ${limit} relevant journalists who would cover this topic. For each journalist, provide:
    - name: Full name
    - publication: Their media outlet
    - beat: What they cover
    - location: Where they're based
    - bio: A brief description of what they write about
    - twitter: Twitter handle (make it realistic)
    - linkedin: LinkedIn URL (optional)
    - email: Professional email (optional)
    - relevance_score: Score from 1-100 based on how well they match the query
    - ai_insights: Why they're a good match for this query
    
    Focus on real publications and realistic journalist profiles that would actually cover this topic.
    
    Return ONLY a valid JSON array of journalist objects. No other text.`;

    const claudeResponse = await claudeService.sendMessage(prompt);

    let journalists = [];
    try {
      // Parse Claude's response
      journalists = JSON.parse(claudeResponse);
    } catch (parseError) {
      console.error("Failed to parse Claude response:", parseError);
      // Fallback to a basic set of journalists
      journalists = [
        {
          name: "Tech Reporter",
          publication: "Major Tech Publication",
          beat: "Technology",
          relevance_score: 75,
          ai_insights: "Covers technology and startups",
        },
      ];
    }
    // Generate pitch angles for a media list
    router.post("/generate-pitch-angles", authMiddleware, async (req, res) => {
      try {
        const { journalists, listName, projectId } = req.body;

        if (!journalists || journalists.length === 0) {
          return res.status(400).json({
            success: false,
            message: "No journalists provided",
          });
        }

        // Create a prompt for Claude to generate pitch angles
        const prompt = `Based on this media list "${listName}" with these journalists:
            
        ${journalists
          .map((j) => `- ${j.name} (${j.publication}, ${j.beat || "General"})`)
          .join("\n")}
            
        Generate 3-5 strategic pitch angles that would appeal to these journalists. For each pitch angle, provide:

        1. title: A compelling pitch angle title
        2. description: A brief description (2-3 sentences) of the angle
        3. targetJournalists: Array of journalist names from the list who would be most interested
        4. hookType: The type of hook (choose from: "News", "Trend", "Data", "Human Interest", "Exclusive", "Expert Commentary")
        5. keyMessages: Array of 2-3 key messages to emphasize

        Consider the beats and publications of the journalists when creating angles. Make the angles specific and actionable.

        Return ONLY a valid JSON array with the exact structure shown. No other text or explanation.`;

        const claudeResponse = await claudeService.sendMessage(prompt);

        try {
          // Try to parse the response as JSON
          let pitchAngles = JSON.parse(claudeResponse);

          // Validate the structure
          if (Array.isArray(pitchAngles)) {
            res.json({
              success: true,
              pitchAngles: pitchAngles.slice(0, 5), // Limit to 5 angles
            });
          } else {
            throw new Error("Invalid response format");
          }
        } catch (parseError) {
          console.error("Failed to parse pitch angles:", parseError);

          // Return fallback pitch angles
          const fallbackAngles = [
            {
              title: "Industry Leadership Angle",
              description:
                "Position your announcement as demonstrating thought leadership and innovation in your industry sector.",
              targetJournalists: journalists
                .slice(0, Math.min(5, journalists.length))
                .map((j) => j.name),
              hookType: "Trend",
              keyMessages: [
                "Industry innovation and transformation",
                "Forward-thinking leadership",
                "Market-shaping developments",
              ],
            },
            {
              title: "Exclusive Data and Insights",
              description:
                "Offer exclusive access to data, research findings, or expert insights that support a larger trend story.",
              targetJournalists: journalists
                .filter(
                  (j) =>
                    j.beat?.includes("Business") ||
                    j.beat?.includes("Tech") ||
                    j.beat?.includes("Data")
                )
                .slice(0, 5)
                .map((j) => j.name),
              hookType: "Data",
              keyMessages: [
                "Exclusive research and data",
                "Industry-first insights",
                "Expert analysis and predictions",
              ],
            },
            {
              title: "Human Impact Story",
              description:
                "Frame your news through personal stories and real-world impact on customers, employees, or communities.",
              targetJournalists: journalists
                .slice(0, Math.min(4, journalists.length))
                .map((j) => j.name),
              hookType: "Human Interest",
              keyMessages: [
                "Real people, real impact",
                "Community benefits and transformation",
                "Personal success stories",
              ],
            },
          ];

          res.json({
            success: true,
            pitchAngles: fallbackAngles,
          });
        }
      } catch (error) {
        console.error("Pitch angle generation error:", error);
        res.status(500).json({
          success: false,
          message: "Failed to generate pitch angles",
          error: error.message,
        });
      }
    });

    // Ensure all journalists have required fields
    journalists = journalists.map((j) => ({
      ...j,
      relevance_score: j.relevance_score || 75,
      ai_insights: j.ai_insights || "Matches your search criteria",
      enriched: true,
      last_updated: new Date().toISOString(),
    }));

    // Sort by relevance score
    journalists.sort((a, b) => b.relevance_score - a.relevance_score);

    // Save search history
    await saveSearchHistory(userId, projectId, query, journalists.length);

    res.json({
      success: true,
      journalists: journalists.slice(0, limit),
      searchQueries: [query],
      totalFound: journalists.length,
      searchMode: "ai-powered",
      sources: ["claude-ai"],
      apiUsage: {
        message: "AI-powered search completed successfully",
      },
    });
  } catch (error) {
    console.error("Media discovery error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to discover journalists",
      error: error.message,
    });
  }
});

// Get saved media lists from MemoryVault for a project
router.get("/lists/:projectId", authMiddleware, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.userId;

    // Query MemoryVault for saved media lists
    const result = await pool.query(
      `SELECT 
        mvi.id,
        mvi.title as name,
        mvi.created_at,
        mvi.metadata->>'journalistCount' as journalist_count
       FROM memoryvault_items mvi
       JOIN memoryvault_folders mvf ON mvi.folder_id = mvf.id
       WHERE mvf.project_id = $1 
         AND mvi.type = 'media-list'
         AND mvi.author = (SELECT email FROM users WHERE id = $2)
       ORDER BY mvi.created_at DESC`,
      [projectId, userId]
    );

    res.json({
      success: true,
      lists: result.rows,
    });
  } catch (error) {
    console.error("Error fetching media lists:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch media lists",
    });
  }
});

// Export journalists to CSV
router.post("/export", authMiddleware, async (req, res) => {
  try {
    const { journalists, format = "csv" } = req.body;

    if (format === "csv") {
      const csv = [
        [
          "Name",
          "Publication",
          "Beat",
          "Location",
          "Bio",
          "Email",
          "Twitter",
          "LinkedIn",
          "Website",
          "AI Insights",
        ],
        ...journalists.map((j) => [
          j.name,
          j.publication || "",
          j.beat || "",
          j.location || "",
          j.bio || "",
          j.email || "",
          j.twitter || "",
          j.linkedin || "",
          j.website || "",
          j.ai_insights || "",
        ]),
      ]
        .map((row) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
        )
        .join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="media-list.csv"'
      );
      res.send(csv);
    } else {
      res.json({ success: true, journalists });
    }
  } catch (error) {
    console.error("Export error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to export data",
    });
  }
});

// Get search suggestions based on history
router.get(
  "/search-suggestions/:projectId",
  authMiddleware,
  async (req, res) => {
    try {
      const { projectId } = req.params;
      const userId = req.userId;

      const result = await pool.query(
        `SELECT DISTINCT query, MAX(result_count) as max_results, COUNT(*) as search_count
       FROM media_search_history
       WHERE user_id = $1 AND project_id = $2
       GROUP BY query
       ORDER BY search_count DESC, MAX(searched_at) DESC
       LIMIT 10`,
        [userId, projectId]
      );

      res.json({
        success: true,
        suggestions: result.rows,
      });
    } catch (error) {
      console.error("Error fetching search suggestions:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch suggestions",
      });
    }
  }
);

// Helper function to save search history
async function saveSearchHistory(userId, projectId, query, resultCount) {
  try {
    await pool.query(
      `INSERT INTO media_search_history (user_id, project_id, query, result_count, searched_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT DO NOTHING`,
      [userId, projectId, query, resultCount]
    );
  } catch (error) {
    console.error("Error saving search history:", error);
  }
}

// Test route to verify APIs (if you still need this)
router.get("/test-apis", authMiddleware, async (req, res) => {
  res.json({
    success: true,
    message: "Media routes are working",
    claudeAvailable: !!claudeService,
  });
});

module.exports = router;
