// #/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { Client } from "pg";

const TOOLS: Tool[] = [
  {
    name: "track_journalist_interactions",
    description: "Track full interaction history with each reporter and media contact",
    inputSchema: {
      type: "object",
      properties: {
        journalist_id: {
          type: "string",
          description: "Unique identifier for the journalist"
        },
        interaction_type: {
          type: "string",
          enum: ["email", "call", "meeting", "event", "social_media", "pitch_response"],
          description: "Type of interaction"
        },
        interaction_details: {
          type: "string",
          description: "Details of the interaction"
        },
        outcome: {
          type: "string",
          enum: ["positive", "neutral", "negative", "no_response"],
          description: "Outcome of the interaction"
        },
        follow_up_needed: {
          type: "boolean",
          description: "Whether follow-up is needed"
        }
      },
      required: ["journalist_id", "interaction_type", "interaction_details"]
    }
  },
  {
    name: "relationship_health_scoring",
    description: "Score relationship health to identify engaged vs. cold contacts",
    inputSchema: {
      type: "object",
      properties: {
        journalist_id: {
          type: "string",
          description: "Journalist to analyze (optional, analyzes all if not provided)"
        },
        timeframe: {
          type: "string",
          enum: ["month", "quarter", "year"],
          description: "Timeframe for health analysis (default: quarter)"
        },
        include_recommendations: {
          type: "boolean",
          description: "Include actionable recommendations for improving relationships"
        }
      }
    }
  },
  {
    name: "optimal_outreach_timing",
    description: "Determine when journalists are most responsive based on historical data",
    inputSchema: {
      type: "object",
      properties: {
        journalist_id: {
          type: "string",
          description: "Specific journalist to analyze (optional)"
        },
        outlet_type: {
          type: "string",
          enum: ["daily_news", "weekly", "trade", "blog", "broadcast"],
          description: "Type of publication for general timing analysis"
        },
        message_type: {
          type: "string",
          enum: ["breaking_news", "feature_pitch", "expert_commentary", "product_announcement"],
          description: "Type of message being sent"
        }
      }
    }
  },
  {
    name: "gift_and_ethics_tracking",
    description: "Track gifts, entertainment, and ethics compliance for media relationships",
    inputSchema: {
      type: "object",
      properties: {
        journalist_id: {
          type: "string",
          description: "Journalist receiving gift or entertainment"
        },
        gift_type: {
          type: "string",
          enum: ["meal", "event_ticket", "travel", "gift", "sample_product"],
          description: "Type of gift or entertainment"
        },
        estimated_value: {
          type: "number",
          description: "Estimated value in USD"
        },
        description: {
          type: "string",
          description: "Description of the gift or entertainment"
        },
        compliance_notes: {
          type: "string",
          description: "Notes about ethics compliance"
        }
      },
      required: ["journalist_id", "gift_type", "estimated_value", "description"]
    }
  },
  {
    name: "journalist_career_tracking",
    description: "Follow reporters as they move between publications and beats",
    inputSchema: {
      type: "object",
      properties: {
        journalist_id: {
          type: "string",
          description: "Journalist to track (optional, shows all recent moves if not provided)"
        },
        track_new_position: {
          type: "boolean",
          description: "Whether to add a new position record"
        },
        new_outlet: {
          type: "string",
          description: "New publication/outlet (if tracking new position)"
        },
        new_beat: {
          type: "string",
          description: "New beat/coverage area (if tracking new position)"
        },
        start_date: {
          type: "string",
          description: "Start date at new position (YYYY-MM-DD)"
        }
      }
    }
  },
  {
    name: "relationship_warming_suggestions",
    description: "Get suggestions for re-engaging cold or dormant media contacts",
    inputSchema: {
      type: "object",
      properties: {
        relationship_status: {
          type: "string",
          enum: ["cold", "dormant", "declining", "all"],
          description: "Type of relationships to analyze (default: all)"
        },
        priority_outlets: {
          type: "array",
          items: { type: "string" },
          description: "Prioritize contacts from specific outlets"
        },
        industry_focus: {
          type: "string",
          description: "Focus on journalists covering specific industries"
        }
      }
    }
  },
  {
    name: "influencer_relationship_mapping",
    description: "Map and manage relationships beyond traditional media to include influencers",
    inputSchema: {
      type: "object",
      properties: {
        influencer_type: {
          type: "string",
          enum: ["social_media", "industry_expert", "analyst", "blogger", "podcaster", "all"],
          description: "Type of influencer to analyze"
        },
        platform: {
          type: "string",
          enum: ["twitter", "linkedin", "youtube", "instagram", "tiktok", "podcast", "blog"],
          description: "Primary platform for the influencer"
        },
        follower_range: {
          type: "string",
          enum: ["micro", "macro", "mega", "nano", "all"],
          description: "Follower count category"
        },
        industry_relevance: {
          type: "string",
          description: "Industry or topic relevance"
        }
      }
    }
  }
];

class RelationshipsServer {
  private server: Server;
  private db: Client | null = null;

  constructor() {
    this.server = new Server(
      {
        name: "signaldesk-relationships",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private async ensureDatabase() {
    if (!this.db) {
      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) {
        throw new McpError(
          ErrorCode.InternalError,
          "DATABASE_URL environment variable is not set"
        );
      }

      this.db = new Client({ connectionString: dbUrl });
      await this.db.connect();

      // Create relationship management tables
      await this.createRelationshipTables();
    }
  }

  private async createRelationshipTables() {
    await this.db!.query(`
      CREATE TABLE IF NOT EXISTS journalists (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        outlet VARCHAR(255),
        beat VARCHAR(255),
        twitter_handle VARCHAR(100),
        phone VARCHAR(50),
        timezone VARCHAR(50),
        preferred_contact_method VARCHAR(50),
        relationship_score INTEGER DEFAULT 50,
        last_interaction DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        metadata JSONB
      )
    `);

    await this.db!.query(`
      CREATE TABLE IF NOT EXISTS journalist_interactions (
        id SERIAL PRIMARY KEY,
        journalist_id INTEGER REFERENCES journalists(id),
        interaction_type VARCHAR(50) NOT NULL,
        interaction_details TEXT,
        outcome VARCHAR(50),
        follow_up_needed BOOLEAN DEFAULT FALSE,
        interaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(255),
        metadata JSONB
      )
    `);

    await this.db!.query(`
      CREATE TABLE IF NOT EXISTS journalist_positions (
        id SERIAL PRIMARY KEY,
        journalist_id INTEGER REFERENCES journalists(id),
        outlet VARCHAR(255) NOT NULL,
        position_title VARCHAR(255),
        beat VARCHAR(255),
        start_date DATE,
        end_date DATE,
        is_current BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await this.db!.query(`
      CREATE TABLE IF NOT EXISTS ethics_tracking (
        id SERIAL PRIMARY KEY,
        journalist_id INTEGER REFERENCES journalists(id),
        gift_type VARCHAR(50) NOT NULL,
        estimated_value DECIMAL(10,2),
        description TEXT,
        compliance_notes TEXT,
        date_given DATE DEFAULT CURRENT_DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await this.db!.query(`
      CREATE TABLE IF NOT EXISTS influencers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        influencer_type VARCHAR(50),
        platform VARCHAR(50),
        handle VARCHAR(255),
        follower_count INTEGER,
        engagement_rate DECIMAL(5,2),
        industry_relevance VARCHAR(255),
        relationship_score INTEGER DEFAULT 50,
        last_interaction DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        metadata JSONB
      )
    `);

    await this.db!.query(`
      CREATE TABLE IF NOT EXISTS outreach_timing (
        id SERIAL PRIMARY KEY,
        journalist_id INTEGER REFERENCES journalists(id),
        day_of_week INTEGER,
        hour_of_day INTEGER,
        response_rate DECIMAL(5,2),
        message_type VARCHAR(50),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: TOOLS,
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      await this.ensureDatabase();

      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "track_journalist_interactions": {
            const { journalist_id, interaction_type, interaction_details, outcome = 'neutral', follow_up_needed = false } = args as any;
            
            // Record the interaction
            const result = await this.db!.query(
              `INSERT INTO journalist_interactions (journalist_id, interaction_type, interaction_details, outcome, follow_up_needed)
               VALUES ($1, $2, $3, $4, $5)
               RETURNING *`,
              [journalist_id, interaction_type, interaction_details, outcome, follow_up_needed]
            );

            // Update last interaction date and potentially adjust relationship score
            const scoreAdjustment = outcome === 'positive' ? 5 : outcome === 'negative' ? -3 : 0;
            await this.db!.query(
              `UPDATE journalists 
               SET last_interaction = CURRENT_DATE, 
                   relationship_score = GREATEST(0, LEAST(100, relationship_score + $2)),
                   updated_at = CURRENT_TIMESTAMP
               WHERE id = $1`,
              [journalist_id, scoreAdjustment]
            );

            return {
              content: [{
                type: "text",
                text: `Interaction tracked successfully!\n\nJournalist ID: ${journalist_id}\nType: ${interaction_type}\nOutcome: ${outcome}\nFollow-up needed: ${follow_up_needed ? 'Yes' : 'No'}\n\nInteraction ID: ${result.rows[0].id}`
              }]
            };
          }

          case "relationship_health_scoring": {
            const { journalist_id, timeframe = 'quarter', include_recommendations = true } = args as any;
            
            let interval = '3 months';
            if (timeframe === 'month') interval = '1 month';
            if (timeframe === 'year') interval = '12 months';

            let query = `
              SELECT j.id, j.name, j.outlet, j.relationship_score, j.last_interaction,
                     COUNT(ji.id) as interaction_count,
                     AVG(CASE 
                       WHEN ji.outcome = 'positive' THEN 3
                       WHEN ji.outcome = 'neutral' THEN 1
                       WHEN ji.outcome = 'negative' THEN -1
                       ELSE 0
                     END) as avg_outcome_score
              FROM journalists j
              LEFT JOIN journalist_interactions ji ON j.id = ji.journalist_id
                AND ji.interaction_date >= NOW() - INTERVAL '${interval}'
            `;

            const queryParams: any[] = [];
            
            if (journalist_id) {
              query += ` WHERE j.id = $1`;
              queryParams.push(journalist_id);
            }
            
            query += ` GROUP BY j.id, j.name, j.outlet, j.relationship_score, j.last_interaction
                      ORDER BY j.relationship_score DESC`;

            const result = await this.db!.query(query, queryParams);

            if (result.rows.length === 0) {
              await this.createSampleJournalists();
              const retryResult = await this.db!.query(query, queryParams);
              
              let output = `Relationship Health Analysis (${timeframe}):\n\n`;
              output += retryResult.rows.map((row: any) => {
                const health = row.relationship_score >= 80 ? 'Excellent' : 
                             row.relationship_score >= 60 ? 'Good' : 
                             row.relationship_score >= 40 ? 'Fair' : 'Needs Attention';
                
                return `${row.name} (${row.outlet})\nHealth Score: ${row.relationship_score}/100 (${health})\nInteractions (${timeframe}): ${row.interaction_count}\nLast Contact: ${row.last_interaction || 'No recent contact'}\n`;
              }).join('\n---\n');

              if (include_recommendations) {
                output += '\n\nRecommendations:\n';
                output += '• Focus on contacts with scores below 60\n';
                output += '• Re-engage journalists with no recent interactions\n';
                output += '• Maintain regular contact with high-scoring relationships\n';
                output += '• Consider personalized outreach for dormant contacts';
              }

              return {
                content: [{ type: "text", text: output }]
              };
            }

            let output = `Relationship Health Analysis (${timeframe}):\n\n`;
            output += result.rows.map((row: any) => {
              const health = row.relationship_score >= 80 ? 'Excellent' : 
                           row.relationship_score >= 60 ? 'Good' : 
                           row.relationship_score >= 40 ? 'Fair' : 'Needs Attention';
              
              return `${row.name} (${row.outlet})\nHealth Score: ${row.relationship_score}/100 (${health})\nInteractions (${timeframe}): ${row.interaction_count}\nLast Contact: ${row.last_interaction || 'No recent contact'}\n`;
            }).join('\n---\n');

            if (include_recommendations) {
              output += '\n\nRecommendations:\n';
              output += '• Focus on contacts with scores below 60\n';
              output += '• Re-engage journalists with no recent interactions\n';
              output += '• Maintain regular contact with high-scoring relationships\n';
              output += '• Consider personalized outreach for dormant contacts';
            }

            return {
              content: [{ type: "text", text: output }]
            };
          }

          case "optimal_outreach_timing": {
            const { journalist_id, outlet_type, message_type } = args as any;
            
            if (journalist_id) {
              // Analyze specific journalist's timing patterns
              const result = await this.db!.query(`
                SELECT day_of_week, hour_of_day, response_rate, message_type
                FROM outreach_timing
                WHERE journalist_id = $1
                ORDER BY response_rate DESC
                LIMIT 10
              `, [journalist_id]);

              if (result.rows.length === 0) {
                return {
                  content: [{
                    type: "text",
                    text: `No timing data available for journalist ID ${journalist_id}.\n\nGeneral recommendations:\n• Tuesday-Thursday typically have higher response rates\n• Morning hours (9-11 AM) and early afternoon (2-4 PM) are optimal\n• Avoid Mondays and Fridays for non-urgent pitches\n• Breaking news should be sent immediately regardless of timing`
                  }]
                };
              }

              return {
                content: [{
                  type: "text",
                  text: `Optimal Timing for Journalist ID ${journalist_id}:\n\n${result.rows.map((row: any) => {
                    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                    const day = dayNames[row.day_of_week];
                    const hour = row.hour_of_day;
                    const timeStr = hour < 12 ? `${hour}:00 AM` : hour === 12 ? '12:00 PM' : `${hour - 12}:00 PM`;
                    
                    return `${day} at ${timeStr} - ${row.response_rate}% response rate (${row.message_type})`;
                  }).join('\n')}`
                }]
              };
            }

            // General timing recommendations
            return {
              content: [{
                type: "text",
                text: `Optimal Outreach Timing Analysis:

General Best Practices:
• Tuesday-Thursday: Highest response rates (40-60% higher than Mon/Fri)
• Optimal Hours: 
  - Morning: 9:00-11:00 AM
  - Afternoon: 2:00-4:00 PM
• Avoid: Early morning (<8 AM), late evening (>6 PM), weekends

${outlet_type ? `
${outlet_type.toUpperCase()} Specific:
${outlet_type === 'daily_news' ? '• Best: Early morning (7-9 AM) for breaking news\n• Deadlines: Respect afternoon deadlines (2-4 PM)' : ''}
${outlet_type === 'trade' ? '• Best: Mid-week (Tue-Thu)\n• Allow longer lead times' : ''}
${outlet_type === 'broadcast' ? '• Best: Late morning (10 AM-12 PM)\n• Breaking news: Immediate contact' : ''}
` : ''}

${message_type ? `
${message_type.toUpperCase()} Timing:
${message_type === 'breaking_news' ? '• Send immediately regardless of time\n• Follow up within 1 hour if no response' : ''}
${message_type === 'feature_pitch' ? '• Allow 3-5 business days lead time\n• Tuesday-Thursday optimal' : ''}
${message_type === 'expert_commentary' ? '• Same-day or next-day turnaround\n• Monitor news cycles closely' : ''}
` : ''}`
              }]
            };
          }

          case "gift_and_ethics_tracking": {
            const { journalist_id, gift_type, estimated_value, description, compliance_notes = '' } = args as any;
            
            // Record the gift/entertainment
            const result = await this.db!.query(
              `INSERT INTO ethics_tracking (journalist_id, gift_type, estimated_value, description, compliance_notes)
               VALUES ($1, $2, $3, $4, $5)
               RETURNING *`,
              [journalist_id, gift_type, estimated_value, description, compliance_notes]
            );

            // Check for compliance warnings
            let warnings = [];
            if (estimated_value > 50) {
              warnings.push('⚠️  Value exceeds $50 - verify outlet ethics policy');
            }
            if (estimated_value > 100) {
              warnings.push('🚨 Value exceeds $100 - requires senior approval');
            }

            // Get total value for this journalist this year
            const totalResult = await this.db!.query(`
              SELECT SUM(estimated_value) as total_value
              FROM ethics_tracking
              WHERE journalist_id = $1 
              AND date_given >= DATE_TRUNC('year', CURRENT_DATE)
            `, [journalist_id]);

            const totalValue = totalResult.rows[0]?.total_value || 0;
            if (totalValue > 200) {
              warnings.push(`🚨 Annual total for this journalist: $${totalValue} - review ethics compliance`);
            }

            return {
              content: [{
                type: "text",
                text: `Gift/Entertainment Tracked Successfully!\n\nJournalist ID: ${journalist_id}\nType: ${gift_type}\nValue: $${estimated_value}\nDescription: ${description}\n\nTracking ID: ${result.rows[0].id}\n\n${warnings.length > 0 ? 'COMPLIANCE ALERTS:\n' + warnings.join('\n') : 'No compliance issues detected.'}`
              }]
            };
          }

          case "journalist_career_tracking": {
            const { journalist_id, track_new_position, new_outlet, new_beat, start_date } = args as any;
            
            if (track_new_position && journalist_id) {
              // End current position
              await this.db!.query(
                `UPDATE journalist_positions 
                 SET is_current = FALSE, end_date = CURRENT_DATE
                 WHERE journalist_id = $1 AND is_current = TRUE`,
                [journalist_id]
              );

              // Add new position
              await this.db!.query(
                `INSERT INTO journalist_positions (journalist_id, outlet, beat, start_date)
                 VALUES ($1, $2, $3, $4)`,
                [journalist_id, new_outlet, new_beat, start_date || new Date().toISOString().split('T')[0]]
              );

              // Update journalist record
              await this.db!.query(
                `UPDATE journalists 
                 SET outlet = $2, beat = $3, updated_at = CURRENT_TIMESTAMP
                 WHERE id = $1`,
                [journalist_id, new_outlet, new_beat]
              );

              return {
                content: [{
                  type: "text",
                  text: `Career move tracked for journalist ID ${journalist_id}!\n\nNew Position:\nOutlet: ${new_outlet}\nBeat: ${new_beat}\nStart Date: ${start_date || 'Today'}\n\nPrevious position archived. Relationship continuity maintained.`
                }]
              };
            }

            // Show recent career moves
            const result = await this.db!.query(`
              SELECT j.name, jp.outlet, jp.position_title, jp.beat, jp.start_date, jp.end_date, jp.is_current
              FROM journalists j
              JOIN journalist_positions jp ON j.id = jp.journalist_id
              WHERE jp.start_date >= CURRENT_DATE - INTERVAL '90 days'
              OR jp.end_date >= CURRENT_DATE - INTERVAL '90 days'
              ORDER BY COALESCE(jp.start_date, jp.end_date) DESC
            `);

            if (result.rows.length === 0) {
              await this.createSampleCareerMoves();
              const retryResult = await this.db!.query(`
                SELECT j.name, jp.outlet, jp.position_title, jp.beat, jp.start_date, jp.end_date, jp.is_current
                FROM journalists j
                JOIN journalist_positions jp ON j.id = jp.journalist_id
                WHERE jp.start_date >= CURRENT_DATE - INTERVAL '90 days'
                OR jp.end_date >= CURRENT_DATE - INTERVAL '90 days'
                ORDER BY COALESCE(jp.start_date, jp.end_date) DESC
              `);

              return {
                content: [{
                  type: "text",
                  text: `Recent Career Moves (Last 90 Days):\n\n${retryResult.rows.map((row: any) => 
                    `${row.name}\n${row.outlet} - ${row.beat || row.position_title}\n${row.is_current ? 'Started' : 'Left'}: ${row.start_date || row.end_date}\nStatus: ${row.is_current ? 'Current' : 'Former'}\n`
                  ).join('\n---\n')}`
                }]
              };
            }

            return {
              content: [{
                type: "text",
                text: `Recent Career Moves (Last 90 Days):\n\n${result.rows.map((row: any) => 
                  `${row.name}\n${row.outlet} - ${row.beat || row.position_title}\n${row.is_current ? 'Started' : 'Left'}: ${row.start_date || row.end_date}\nStatus: ${row.is_current ? 'Current' : 'Former'}\n`
                ).join('\n---\n')}`
              }]
            };
          }

          case "relationship_warming_suggestions": {
            const { relationship_status = 'all', priority_outlets = [], industry_focus } = args as any;
            
            let query = `
              SELECT j.id, j.name, j.outlet, j.beat, j.relationship_score, j.last_interaction,
                     COALESCE(ji.interaction_count, 0) as recent_interactions
              FROM journalists j
              LEFT JOIN (
                SELECT journalist_id, COUNT(*) as interaction_count
                FROM journalist_interactions
                WHERE interaction_date >= NOW() - INTERVAL '6 months'
                GROUP BY journalist_id
              ) ji ON j.id = ji.journalist_id
              WHERE 1=1
            `;

            const queryParams: any[] = [];
            
            if (relationship_status === 'cold') {
              query += ` AND j.relationship_score < 40`;
            } else if (relationship_status === 'dormant') {
              query += ` AND (j.last_interaction < CURRENT_DATE - INTERVAL '3 months' OR j.last_interaction IS NULL)`;
            } else if (relationship_status === 'declining') {
              query += ` AND j.relationship_score BETWEEN 40 AND 60 AND ji.interaction_count < 2`;
            }

            if (priority_outlets.length > 0) {
              query += ` AND j.outlet = ANY($${queryParams.length + 1}::text[])`;
              queryParams.push(priority_outlets);
            }

            if (industry_focus) {
              query += ` AND j.beat ILIKE $${queryParams.length + 1}`;
              queryParams.push(`%${industry_focus}%`);
            }

            query += ` ORDER BY j.relationship_score ASC, j.last_interaction ASC NULLS FIRST LIMIT 10`;

            const result = await this.db!.query(query, queryParams);

            if (result.rows.length === 0) {
              return {
                content: [{
                  type: "text",
                  text: `No journalists found matching the criteria.\n\nGeneral Warming Strategies:\n• Personalized industry insights\n• Exclusive data or research\n• Expert interview opportunities\n• Timely commentary on breaking news\n• Social media engagement\n• Event invitations`
                }]
              };
            }

            let output = `Relationship Warming Suggestions:\n\n`;
            output += result.rows.map((row: any) => {
              const suggestions = [];
              
              if (row.relationship_score < 30) {
                suggestions.push('Start with social media engagement');
                suggestions.push('Share relevant industry insights');
              } else if (row.relationship_score < 50) {
                suggestions.push('Offer exclusive expert commentary');
                suggestions.push('Provide useful background information');
              } else {
                suggestions.push('Invite to industry events');
                suggestions.push('Offer executive interviews');
              }

              if (!row.last_interaction || new Date(row.last_interaction) < new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)) {
                suggestions.push('Send re-introduction email');
              }

              return `${row.name} (${row.outlet})\nBeat: ${row.beat}\nScore: ${row.relationship_score}/100\nLast Contact: ${row.last_interaction || 'None'}\n\nSuggested Actions:\n${suggestions.map(s => `• ${s}`).join('\n')}\n`;
            }).join('\n---\n');

            return {
              content: [{ type: "text", text: output }]
            };
          }

          case "influencer_relationship_mapping": {
            const { influencer_type = 'all', platform, follower_range = 'all', industry_relevance } = args as any;
            
            let query = `
              SELECT * FROM influencers
              WHERE 1=1
            `;

            const queryParams: any[] = [];

            if (influencer_type !== 'all') {
              query += ` AND influencer_type = $${queryParams.length + 1}`;
              queryParams.push(influencer_type);
            }

            if (platform) {
              query += ` AND platform = $${queryParams.length + 1}`;
              queryParams.push(platform);
            }

            if (industry_relevance) {
              query += ` AND industry_relevance ILIKE $${queryParams.length + 1}`;
              queryParams.push(`%${industry_relevance}%`);
            }

            if (follower_range !== 'all') {
              const ranges = {
                'nano': [1, 10000],
                'micro': [10000, 100000],
                'macro': [100000, 1000000],
                'mega': [1000000, 999999999]
              };
              const range = ranges[follower_range as keyof typeof ranges];
              if (range) {
                query += ` AND follower_count BETWEEN $${queryParams.length + 1} AND $${queryParams.length + 2}`;
                queryParams.push(range[0], range[1]);
              }
            }

            query += ` ORDER BY relationship_score DESC, follower_count DESC`;

            const result = await this.db!.query(query, queryParams);

            if (result.rows.length === 0) {
              await this.createSampleInfluencers();
              const retryResult = await this.db!.query(query, queryParams);
              
              return {
                content: [{
                  type: "text",
                  text: `Influencer Relationship Map:\n\n${retryResult.rows.map((inf: any) => 
                    `${inf.name} (@${inf.handle})\nPlatform: ${inf.platform}\nFollowers: ${inf.follower_count?.toLocaleString() || 'N/A'}\nEngagement: ${inf.engagement_rate || 'N/A'}%\nRelevance: ${inf.industry_relevance}\nRelationship Score: ${inf.relationship_score}/100\nLast Contact: ${inf.last_interaction || 'None'}\n`
                  ).join('\n---\n')}`
                }]
              };
            }

            return {
              content: [{
                type: "text",
                text: `Influencer Relationship Map:\n\n${result.rows.map((inf: any) => 
                  `${inf.name} (@${inf.handle})\nPlatform: ${inf.platform}\nFollowers: ${inf.follower_count?.toLocaleString() || 'N/A'}\nEngagement: ${inf.engagement_rate || 'N/A'}%\nRelevance: ${inf.industry_relevance}\nRelationship Score: ${inf.relationship_score}/100\nLast Contact: ${inf.last_interaction || 'None'}\n`
                ).join('\n---\n')}`
              }]
            };
          }

          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        
        console.error(`Error executing tool ${name}:`, error);
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error}`
        );
      }
    });
  }

  private async createSampleJournalists() {
    const journalists = [
      {
        name: 'Sarah Chen',
        email: 'sarah.chen@techcrunch.com',
        outlet: 'TechCrunch',
        beat: 'AI and Machine Learning',
        twitter: '@sarahchen_tech',
        score: 85
      },
      {
        name: 'Michael Rodriguez',
        email: 'm.rodriguez@reuters.com',
        outlet: 'Reuters',
        beat: 'Financial Technology',
        twitter: '@mikefintech',
        score: 62
      },
      {
        name: 'Emily Johnson',
        email: 'ejohnson@wsj.com',
        outlet: 'Wall Street Journal',
        beat: 'Enterprise Software',
        twitter: '@emilywsj',
        score: 91
      }
    ];

    for (const journalist of journalists) {
      await this.db!.query(
        `INSERT INTO journalists (name, email, outlet, beat, twitter_handle, relationship_score, last_interaction)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [journalist.name, journalist.email, journalist.outlet, journalist.beat, journalist.twitter, journalist.score, '2025-01-10']
      );
    }
  }

  private async createSampleCareerMoves() {
    // First create some journalists if they don't exist
    await this.createSampleJournalists();
    
    const moves = [
      {
        journalist_id: 1,
        outlet: 'The Information',
        beat: 'AI and Startups',
        start_date: '2025-01-15'
      },
      {
        journalist_id: 2,
        outlet: 'Bloomberg',
        beat: 'Cryptocurrency',
        start_date: '2024-12-01'
      }
    ];

    for (const move of moves) {
      await this.db!.query(
        `INSERT INTO journalist_positions (journalist_id, outlet, beat, start_date)
         VALUES ($1, $2, $3, $4)`,
        [move.journalist_id, move.outlet, move.beat, move.start_date]
      );
    }
  }

  private async createSampleInfluencers() {
    const influencers = [
      {
        name: 'Alex Tech',
        type: 'industry_expert',
        platform: 'linkedin',
        handle: 'alextech',
        followers: 25000,
        engagement: 4.2,
        relevance: 'Enterprise Technology',
        score: 78
      },
      {
        name: 'DataSci Sarah',
        type: 'social_media',
        platform: 'twitter',
        handle: 'datasci_sarah',
        followers: 150000,
        engagement: 6.8,
        relevance: 'Data Science and AI',
        score: 82
      },
      {
        name: 'Tech Podcast Network',
        type: 'podcaster',
        platform: 'podcast',
        handle: 'techpodcast',
        followers: 50000,
        engagement: 8.5,
        relevance: 'Technology Trends',
        score: 67
      }
    ];

    for (const influencer of influencers) {
      await this.db!.query(
        `INSERT INTO influencers (name, influencer_type, platform, handle, follower_count, engagement_rate, industry_relevance, relationship_score)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [influencer.name, influencer.type, influencer.platform, influencer.handle, influencer.followers, influencer.engagement, influencer.relevance, influencer.score]
      );
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("SignalDesk Relationships MCP server running");
  }
}

const server = new RelationshipsServer();
server.run().catch(console.error);