const pool = require("../config/db");
const claudeService = require("../../config/claude");
const csv = require("csv-parser");
const fs = require("fs");

// Enhanced search with multiple sources
const searchMultiSource = async (req, res) => {
  try {
    const { query, mode, sources, projectContext, enrichmentLevel } = req.body;
    const userId = req.user.id;

    if (!query || !query.trim()) {
      return res.status(400).json({ error: "Search query is required" });
    }

    // Build a comprehensive search prompt for Claude
    const prompt = `
You are an expert media researcher. Search for journalists and reporters based on this query: "${query}"

Search Context:
- Mode: ${mode || "smart"}
- Sources to search: ${
      sources
        ? Object.keys(sources)
            .filter((k) => sources[k])
            .join(", ")
        : "all available"
    }
- Industry: ${projectContext?.industry || "general"}
- Project: ${projectContext?.projectName || "unspecified"}

Your task:
1. Find journalists/reporters matching the query
2. Prioritize those covering ${projectContext?.industry || "relevant topics"}
3. Include contact information when available
4. Verify credibility indicators
5. Note recent activity and coverage areas

Return a JSON response with this EXACT format:
{
  "reporters": [
    {
      "name": "Full Name",
      "publication": "Publication Name",
      "beat": "Technology/Healthcare/Business/Finance/etc",
      "specialty": "Specific expertise area",
      "email": "email@example.com or null",
      "emailConfidence": 0.9,
      "twitter": "@handle or null",
      "linkedin": "profile URL or null",
      "bio": "Brief professional bio",
      "location": "City, State/Country",
      "verified": true,
      "recentArticles": [
        {"title": "Article Title", "date": "2024-01-01", "url": "https://..."}
      ],
      "responseRate": 0.3,
      "lastActive": "2024-01-15",
      "topics": ["AI", "startups", "cybersecurity"]
    }
  ],
  "stats": {
    "totalFound": 10,
    "verified": 8,
    "enriched": 5,
    "sources": {
      "web": 5,
      "linkedin": 3,
      "twitter": 2
    }
  },
  "patterns": {
    "publication.com": "firstname.lastname@publication.com"
  },
  "suggestions": [
    "Consider searching for 'enterprise technology' for more B2B reporters",
    "Add location filters to find local reporters"
  ]
}

IMPORTANT: Return ONLY valid JSON. No other text or formatting.`;

    const response = await claudeService.sendMessage(prompt);

    let parsedData;
    try {
      parsedData = JSON.parse(response);
    } catch (parseError) {
      console.error("Failed to parse Claude response:", parseError);
      return res.status(500).json({ error: "Failed to parse search results" });
    }

    res.json(parsedData);
  } catch (error) {
    console.error("Error in multi-source search:", error);
    res.status(500).json({ error: "Failed to search reporters" });
  }
};

// Analyze reporter with AI
const analyzeReporter = async (req, res) => {
  try {
    const { reporter, projectContext, analysisDepth } = req.body;

    const prompt = `
Analyze this reporter for PR outreach potential:

Reporter: ${reporter.name}
Publication: ${reporter.publication}
Beat: ${reporter.beat}
Bio: ${reporter.bio || "Not available"}
Recent Articles: ${JSON.stringify(reporter.recentArticles || [])}

Project Context:
- Industry: ${projectContext?.industry}
- Campaign: ${projectContext?.campaign}
- Company: ${projectContext?.projectName}

Provide a comprehensive analysis in JSON format:
{
  "summary": "Brief analysis summary",
  "strengths": ["strength1", "strength2"],
  "topics": ["topic1", "topic2"],
  "pitchAdvice": "Specific advice for pitching this reporter",
  "recentCoverage": ["Recent story angles they've covered"],
  "competitorCoverage": ["Competitors they've written about"],
  "engagementTips": ["Best practices for this reporter"],
  "warningFlags": ["Any concerns or things to avoid"],
  "relationshipPotential": "high/medium/low",
  "outreachScore": 85
}`;

    const response = await claudeService.sendMessage(prompt);
    const analysis = JSON.parse(response);

    res.json(analysis);
  } catch (error) {
    console.error("Error analyzing reporter:", error);
    res.status(500).json({ error: "Failed to analyze reporter" });
  }
};

// Enrich reporter data
const enrichReporter = async (req, res) => {
  try {
    const { reporter, enrichmentLevel, projectContext } = req.body;

    const prompt = `
Enrich this reporter's profile with additional information:

Current Data:
${JSON.stringify(reporter, null, 2)}

Find and add:
1. Missing contact information
2. Social media profiles
3. Recent articles and coverage
4. Speaking engagements or awards
5. Professional background
6. Preferred communication methods
7. Response patterns

Return enriched data in this format:
{
  "success": true,
  "data": {
    "email": "verified email or null",
    "emailConfidence": 0.95,
    "twitter": "@handle",
    "linkedin": "profile URL",
    "additionalEmails": ["other@email.com"],
    "phone": "phone if available",
    "preferredContact": "email/twitter/linkedin",
    "timezone": "EST/PST/etc",
    "responseTime": "typically responds within 24-48 hours",
    "pitchPreferences": {
      "bestTime": "Weekday mornings",
      "format": "Brief bullet points",
      "interests": ["exclusive data", "expert sources"]
    },
    "recentActivity": "Last article published 3 days ago",
    "influence": {
      "followerCount": 15000,
      "engagementRate": "high",
      "industryInfluence": "thought leader in fintech"
    }
  }
}`;

    const response = await claudeService.sendMessage(prompt);
    const enrichment = JSON.parse(response);

    res.json(enrichment);
  } catch (error) {
    console.error("Error enriching reporter:", error);
    res.status(500).json({ error: "Failed to enrich reporter data" });
  }
};

// Generate personalized pitch
const generatePitch = async (req, res) => {
  try {
    const { reporter, projectContext, insights, pitchStyle } = req.body;

    const prompt = `
Generate a personalized pitch for this reporter:

Reporter: ${reporter.name} at ${reporter.publication}
Beat: ${reporter.beat}
Recent Coverage: ${JSON.stringify(reporter.recentArticles || [])}
Insights: ${JSON.stringify(insights || {})}

Campaign Context:
- Company: ${projectContext?.projectName}
- Industry: ${projectContext?.industry}
- Campaign: ${projectContext?.campaign}
- Message: ${projectContext?.campaignContext}

Generate a ${pitchStyle || "personalized"} pitch with:
{
  "pitch": "Complete email pitch text here...",
  "strategy": {
    "approach": "How to approach this reporter",
    "timing": "Best time to send",
    "followUp": "Follow-up strategy"
  },
  "subjectLines": [
    "Subject line option 1",
    "Subject line option 2",
    "Subject line option 3"
  ],
  "hooks": [
    "Key hook 1",
    "Key hook 2"
  ],
  "dataPoints": [
    "Relevant data point 1",
    "Relevant data point 2"
  ],
  "callToAction": "Specific CTA for this reporter"
}`;

    const response = await claudeService.sendMessage(prompt);
    const pitch = JSON.parse(response);

    res.json(pitch);
  } catch (error) {
    console.error("Error generating pitch:", error);
    res.status(500).json({ error: "Failed to generate pitch" });
  }
};

// AI-powered reporter discovery
const aiDiscoverReporters = async (req, res) => {
  try {
    const {
      projectId,
      industry,
      campaign,
      currentReporters,
      expansionStrategy,
    } = req.body;

    const prompt = `
Based on these current reporters, discover similar journalists:

Current Reporters:
${JSON.stringify(currentReporters.slice(0, 5), null, 2)}

Industry: ${industry}
Campaign: ${campaign}

Use these strategies: ${expansionStrategy.join(", ")}

Find reporters who:
1. Cover similar beats
2. Work at competitor publications  
3. Have co-authored articles
4. Share social connections
5. Cover overlapping topics

Return:
{
  "reporters": [
    // Same reporter format as before
  ],
  "insights": [
    "Found 5 reporters who frequently cover your competitors",
    "Identified 3 journalists who often cite similar experts",
    "Discovered 2 reporters transitioning to cover your industry"
  ]
}`;

    const response = await claudeService.sendMessage(prompt);
    const discoveries = JSON.parse(response);

    res.json(discoveries);
  } catch (error) {
    console.error("Error discovering reporters:", error);
    res.status(500).json({ error: "Failed to discover reporters" });
  }
};

// Get database statistics
const getDatabaseStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const { projectId } = req.query;

    const stats = await pool.query(
      `
      SELECT 
        COUNT(DISTINCT mc.id) as totalContacts,
        COUNT(DISTINCT CASE WHEN mc.email IS NOT NULL THEN mc.id END) as verifiedEmails,
        COUNT(DISTINCT CASE WHEN mc.twitter IS NOT NULL OR mc.linkedin IS NOT NULL THEN mc.id END) as socialProfiles,
        COUNT(DISTINCT CASE WHEN mc.updated_at > NOW() - INTERVAL '7 days' THEN mc.id END) as recentlyActive
      FROM media_contacts mc
      WHERE mc.user_id = $1
    `,
      [userId]
    );

    res.json(stats.rows[0]);
  } catch (error) {
    console.error("Error getting database stats:", error);
    res.status(500).json({ error: "Failed to get statistics" });
  }
};

// Bulk import from CSV
const bulkImport = async (req, res) => {
  try {
    const userId = req.user.id;
    const { projectId } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const reporters = [];

    // Parse CSV file
    fs.createReadStream(file.path)
      .pipe(csv())
      .on("data", (row) => {
        reporters.push({
          name: row.name || row.Name || row.NAME,
          publication: row.publication || row.Publication || row.PUBLICATION,
          beat: row.beat || row.Beat || row.BEAT || "General",
          email: row.email || row.Email || row.EMAIL,
          twitter: row.twitter || row.Twitter || row.TWITTER,
          linkedin: row.linkedin || row.LinkedIn || row.LINKEDIN,
          bio: row.bio || row.Bio || row.BIO || "",
          specialty: row.specialty || row.Specialty || row.SPECIALTY || "",
          source: "csv_import",
        });
      })
      .on("end", async () => {
        // Clean up uploaded file
        fs.unlinkSync(file.path);

        // Save reporters to database
        const savedReporters = [];
        for (const reporter of reporters) {
          if (reporter.name) {
            try {
              const result = await pool.query(
                `INSERT INTO media_contacts 
                 (user_id, name, publication, beat, specialty, email, twitter, linkedin, bio, source) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                 ON CONFLICT (user_id, email) 
                 DO UPDATE SET 
                   name = EXCLUDED.name,
                   publication = EXCLUDED.publication,
                   updated_at = CURRENT_TIMESTAMP
                 RETURNING *`,
                [
                  userId,
                  reporter.name,
                  reporter.publication,
                  reporter.beat,
                  reporter.specialty,
                  reporter.email,
                  reporter.twitter,
                  reporter.linkedin,
                  reporter.bio,
                  reporter.source,
                ]
              );
              savedReporters.push(result.rows[0]);
            } catch (err) {
              console.error("Error saving reporter:", err);
            }
          }
        }

        res.json({
          success: true,
          reporters: savedReporters,
          count: savedReporters.length,
        });
      })
      .on("error", (error) => {
        fs.unlinkSync(file.path);
        console.error("CSV parsing error:", error);
        res.status(500).json({ error: "Failed to parse CSV file" });
      });
  } catch (error) {
    console.error("Error in bulk import:", error);
    res.status(500).json({ error: "Failed to import file" });
  }
};

// Keep all the original functions
const searchReporters = async (req, res) => {
  // ... keep the original searchReporters function
  try {
    const { query } = req.body;
    const userId = req.user.id;

    if (!query || !query.trim()) {
      return res.status(400).json({ error: "Search query is required" });
    }

    const prompt = `
You are helping to find journalist and reporter information. Search the web for reporters based on this query: "${query}"

If the query mentions a specific beat, publication, or topic, focus on finding reporters in that area.

Your task:
1. Search for journalists/reporters matching the query
2. Extract their information
3. Return ONLY a valid JSON response

Respond with a JSON object in this EXACT format:
{
  "reporters": [
    {
      "name": "Full Name",
      "publication": "Publication Name",
      "beat": "One of: Technology, Healthcare, Business, Finance, Crisis/Breaking, or General",
      "specialty": "Their specific area of expertise",
      "email": "email if found, or null",
      "twitter": "twitter handle if found, or null",
      "bio": "Brief bio or description"
    }
  ],
  "search_summary": "Brief summary of what you found"
}

IMPORTANT: Your ENTIRE response must be ONLY valid JSON. Do not include any other text, markdown formatting, or backticks.`;

    const response = await claudeService.sendMessage(prompt);

    let parsedData;
    try {
      parsedData = JSON.parse(response);
    } catch (parseError) {
      console.error("Failed to parse Claude response:", parseError);
      return res.status(500).json({ error: "Failed to parse search results" });
    }

    res.json(parsedData);
  } catch (error) {
    console.error("Error searching reporters:", error);
    res.status(500).json({ error: "Failed to search reporters" });
  }
};

// Keep all other original functions (getContacts, saveContacts, getLists, etc.)
const getContacts = async (req, res) => {
  try {
    const userId = req.user.id;
    const { projectId, listId } = req.query;

    let query = "SELECT * FROM media_contacts WHERE user_id = $1";
    const params = [userId];

    if (listId) {
      query = `
        SELECT mc.* FROM media_contacts mc
        JOIN media_list_contacts mlc ON mc.id = mlc.contact_id
        WHERE mc.user_id = $1 AND mlc.list_id = $2
      `;
      params.push(listId);
    }

    query += " ORDER BY created_at DESC";

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching contacts:", error);
    res.status(500).json({ error: "Failed to fetch contacts" });
  }
};

const saveContacts = async (req, res) => {
  try {
    const { contacts, projectId } = req.body;
    const userId = req.user.id;

    const savedContacts = [];

    for (const contact of contacts) {
      try {
        const result = await pool.query(
          `INSERT INTO media_contacts 
           (user_id, name, publication, beat, specialty, email, twitter, linkedin, bio, source, project_id) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           ON CONFLICT (user_id, email) 
           DO UPDATE SET 
             name = EXCLUDED.name,
             publication = EXCLUDED.publication,
             beat = EXCLUDED.beat,
             specialty = EXCLUDED.specialty,
             twitter = EXCLUDED.twitter,
             linkedin = EXCLUDED.linkedin,
             bio = EXCLUDED.bio,
             updated_at = CURRENT_TIMESTAMP
           RETURNING *`,
          [
            userId,
            contact.name,
            contact.publication,
            contact.beat,
            contact.specialty,
            contact.email,
            contact.twitter,
            contact.linkedin,
            contact.bio,
            contact.source || "manual",
            projectId,
          ]
        );
        savedContacts.push(result.rows[0]);
      } catch (err) {
        console.error("Error saving contact:", err);
      }
    }

    res.json(savedContacts);
  } catch (error) {
    console.error("Error saving contacts:", error);
    res.status(500).json({ error: "Failed to save contacts" });
  }
};

const getLists = async (req, res) => {
  try {
    const userId = req.user.id;
    const { projectId } = req.query;

    const result = await pool.query(
      `
      SELECT 
        ml.*,
        COUNT(mlc.contact_id) as contact_count,
        json_agg(
          json_build_object(
            'id', mc.id,
            'name', mc.name,
            'publication', mc.publication,
            'beat', mc.beat,
            'email', mc.email,
            'twitter', mc.twitter,
            'linkedin', mc.linkedin,
            'bio', mc.bio
          )
        ) FILTER (WHERE mc.id IS NOT NULL) as contacts
      FROM media_lists ml
      LEFT JOIN media_list_contacts mlc ON ml.id = mlc.list_id
      LEFT JOIN media_contacts mc ON mlc.contact_id = mc.id
      WHERE ml.user_id = $1
      GROUP BY ml.id
      ORDER BY ml.updated_at DESC
    `,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching lists:", error);
    res.status(500).json({ error: "Failed to fetch lists" });
  }
};

const saveList = async (req, res) => {
  const client = await pool.connect();

  try {
    const { name, contactIds, projectId, metadata } = req.body;
    const userId = req.user.id;

    await client.query("BEGIN");

    // Create the list with metadata
    const listResult = await client.query(
      "INSERT INTO media_lists (user_id, name, project_id, metadata) VALUES ($1, $2, $3, $4) RETURNING *",
      [userId, name, projectId, metadata || {}]
    );
    const list = listResult.rows[0];

    // Add contacts to the list
    if (contactIds && contactIds.length > 0) {
      for (const contactId of contactIds) {
        await client.query(
          "INSERT INTO media_list_contacts (list_id, contact_id) VALUES ($1, $2)",
          [list.id, contactId]
        );
      }
    }

    await client.query("COMMIT");

    res.json(list);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error saving list:", error);
    res.status(500).json({ error: "Failed to save list" });
  } finally {
    client.release();
  }
};

const updateList = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const { name, contactIds, projectId, metadata } = req.body;
    const userId = req.user.id;

    await client.query("BEGIN");

    // Update list
    await client.query(
      "UPDATE media_lists SET name = $1, metadata = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 AND user_id = $4",
      [name, metadata || {}, id, userId]
    );

    // Remove all existing contacts
    await client.query("DELETE FROM media_list_contacts WHERE list_id = $1", [
      id,
    ]);

    // Add new contacts
    if (contactIds && contactIds.length > 0) {
      for (const contactId of contactIds) {
        await client.query(
          "INSERT INTO media_list_contacts (list_id, contact_id) VALUES ($1, $2)",
          [id, contactId]
        );
      }
    }

    await client.query("COMMIT");

    res.json({ success: true });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error updating list:", error);
    res.status(500).json({ error: "Failed to update list" });
  } finally {
    client.release();
  }
};

const deleteList = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await pool.query("DELETE FROM media_lists WHERE id = $1 AND user_id = $2", [
      id,
      userId,
    ]);

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting list:", error);
    res.status(500).json({ error: "Failed to delete list" });
  }
};

const exportContacts = async (req, res) => {
  try {
    const { contactIds } = req.body;
    const userId = req.user.id;

    const result = await pool.query(
      "SELECT * FROM media_contacts WHERE id = ANY($1) AND user_id = $2",
      [contactIds, userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error exporting contacts:", error);
    res.status(500).json({ error: "Failed to export contacts" });
  }
};

module.exports = {
  searchReporters,
  searchMultiSource,
  getContacts,
  saveContacts,
  getLists,
  saveList,
  updateList,
  deleteList,
  exportContacts,
  analyzeReporter,
  enrichReporter,
  generatePitch,
  aiDiscoverReporters,
  getDatabaseStats,
  bulkImport,
};
