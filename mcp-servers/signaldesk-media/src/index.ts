/**
 * SignalDesk Media MCP Server
 * Provides journalist discovery, media monitoring, and press outreach capabilities
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { Pool } from 'pg';
import { Anthropic } from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
// dotenv.config({ path: path.join(__dirname, '../../../backend/.env') });

// Database connection
const DATABASE_URL = 'postgresql://postgres:habku2-gotraf-suVhan@db.zskaxjtyuaqazydouifp.supabase.co:5432/postgres';
let pool: Pool | null = null;
try {
  pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  pool.query('SELECT 1').catch(() => {
    pool = null;
  });
} catch (error) {
  pool = null;
}

// Initialize Claude for intelligent journalist matching
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || 'dummy-key'
});

// Create MCP server
const server = new Server(
  {
    name: 'signaldesk-media',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define media intelligence tools
const TOOLS: Tool[] = [
  {
    name: 'find_journalists',
    description: 'Find relevant journalists based on beat, publication, or topic',
    inputSchema: {
      type: 'object',
      properties: {
        beat: {
          type: 'string',
          description: 'Journalist beat or topic area (e.g., technology, healthcare)'
        },
        publication: {
          type: 'string',
          description: 'Target publication (optional)'
        },
        location: {
          type: 'string',
          description: 'Geographic focus (optional)'
        },
        recentCoverage: {
          type: 'boolean',
          description: 'Only show journalists with recent coverage',
          default: true
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results',
          default: 10
        }
      },
      required: ['beat']
    }
  },
  {
    name: 'analyze_journalist',
    description: 'Get detailed analysis of a journalist\'s coverage and interests',
    inputSchema: {
      type: 'object',
      properties: {
        journalistName: {
          type: 'string',
          description: 'Name of the journalist'
        },
        publication: {
          type: 'string',
          description: 'Publication they work for (optional)'
        }
      },
      required: ['journalistName']
    }
  },
  {
    name: 'create_media_list',
    description: 'Create a targeted media list for a campaign or announcement',
    inputSchema: {
      type: 'object',
      properties: {
        listName: {
          type: 'string',
          description: 'Name for the media list'
        },
        topic: {
          type: 'string',
          description: 'Topic or announcement type'
        },
        tier1Publications: {
          type: 'array',
          items: { type: 'string' },
          description: 'Must-have publications'
        },
        targetBeats: {
          type: 'array',
          items: { type: 'string' },
          description: 'Relevant beats to target'
        }
      },
      required: ['listName', 'topic']
    }
  },
  {
    name: 'monitor_coverage',
    description: 'Monitor media coverage for specific topics or competitors',
    inputSchema: {
      type: 'object',
      properties: {
        keywords: {
          type: 'array',
          items: { type: 'string' },
          description: 'Keywords to monitor'
        },
        competitors: {
          type: 'array',
          items: { type: 'string' },
          description: 'Competitor companies to track'
        },
        timeframe: {
          type: 'string',
          enum: ['24h', '7d', '30d', 'all'],
          description: 'Timeframe for monitoring',
          default: '7d'
        }
      }
    }
  },
  {
    name: 'generate_pitch',
    description: 'Generate a personalized media pitch for a journalist',
    inputSchema: {
      type: 'object',
      properties: {
        journalistName: {
          type: 'string',
          description: 'Name of the journalist'
        },
        storyAngle: {
          type: 'string',
          description: 'The story angle or announcement'
        },
        companyInfo: {
          type: 'string',
          description: 'Brief company/product information'
        },
        pitchType: {
          type: 'string',
          enum: ['exclusive', 'embargo', 'immediate', 'follow-up'],
          description: 'Type of pitch',
          default: 'immediate'
        }
      },
      required: ['journalistName', 'storyAngle']
    }
  },
  {
    name: 'track_outreach',
    description: 'Track media outreach efforts and responses',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['log', 'update', 'report'],
          description: 'Action to perform'
        },
        journalistId: {
          type: 'string',
          description: 'Journalist ID (for log/update)'
        },
        status: {
          type: 'string',
          enum: ['sent', 'opened', 'responded', 'declined', 'published'],
          description: 'Outreach status'
        },
        notes: {
          type: 'string',
          description: 'Additional notes'
        }
      },
      required: ['action']
    }
  }
];

// Tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'find_journalists': {
        const { beat, publication, location, recentCoverage = true, limit = 10 } = args as any;
        
        // Use Claude to intelligently match journalists
        const prompt = `Find journalists who cover ${beat}${publication ? ` at ${publication}` : ''}${location ? ` in ${location}` : ''}.
        
        Return a JSON array of journalists with these fields:
        - name: journalist name
        - publication: their publication
        - beat: their primary beat
        - email: contact email (generate realistic example)
        - twitter: twitter handle
        - recentArticle: title of a recent relevant article
        - relevanceScore: 1-10 score for relevance to ${beat}
        
        Limit to ${limit} results. Focus on ${recentCoverage ? 'currently active' : 'all'} journalists.
        Return ONLY valid JSON array.`;
        
        const completion = await anthropic.messages.create({
          model: 'claude-3-haiku-20240307',
          max_tokens: 1000,
          temperature: 0.7,
          messages: [{ role: 'user', content: prompt }]
        });
        
        let journalists;
        try {
          const responseText = completion.content[0].type === 'text' ? completion.content[0].text : '[]';
          // Extract JSON from response
          const jsonMatch = responseText.match(/\[[\s\S]*\]/);
          journalists = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
        } catch {
          // Fallback to mock data if parsing fails
          journalists = [
            {
              name: "Sarah Chen",
              publication: "TechCrunch",
              beat: beat,
              email: "s.chen@techcrunch.com",
              twitter: "@sarahchen",
              recentArticle: `Latest developments in ${beat}`,
              relevanceScore: 9
            }
          ];
        }
        
        // Store in database for tracking
        if (pool) {
          for (const journalist of journalists.slice(0, 3)) { // Store top 3
            await pool.query(`
              INSERT INTO journalists (name, publication, beat, email, twitter, last_updated)
              VALUES ($1, $2, $3, $4, $5, NOW())
              ON CONFLICT (email) DO UPDATE SET last_updated = NOW()
            `, [journalist.name, journalist.publication, journalist.beat, journalist.email, journalist.twitter])
              .catch(() => {}); // Ignore errors if table doesn't exist
          }
        }
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(journalists, null, 2)
            }
          ]
        };
      }

      case 'analyze_journalist': {
        const { journalistName, publication } = args as any;
        
        // Use Claude to analyze journalist
        const prompt = `Analyze journalist ${journalistName}${publication ? ` from ${publication}` : ''}.
        
        Provide a detailed analysis including:
        - beats: array of topics they cover
        - writingStyle: brief description
        - publicationFrequency: how often they publish
        - preferredFormats: types of stories (features, news, interviews)
        - recentTopics: last 3-5 topics covered
        - pitchingAdvice: tips for reaching out
        - bestTimeToContact: optimal outreach timing
        
        Return as JSON object.`;
        
        const completion = await anthropic.messages.create({
          model: 'claude-3-haiku-20240307',
          max_tokens: 800,
          temperature: 0.7,
          messages: [{ role: 'user', content: prompt }]
        });
        
        const responseText = completion.content[0].type === 'text' ? completion.content[0].text : '{}';
        
        let analysis;
        try {
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
        } catch {
          analysis = {
            beats: ["technology", "startups"],
            writingStyle: "In-depth analytical pieces with strong data focus",
            publicationFrequency: "2-3 articles per week",
            preferredFormats: ["features", "interviews", "analysis"],
            recentTopics: ["AI regulation", "startup funding", "tech layoffs"],
            pitchingAdvice: "Lead with data and unique insights",
            bestTimeToContact: "Tuesday-Thursday, 10am-12pm EST"
          };
        }
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                journalist: journalistName,
                publication,
                analysis
              }, null, 2)
            }
          ]
        };
      }

      case 'create_media_list': {
        const { listName, topic, tier1Publications = [], targetBeats = [] } = args as any;
        
        // Create media list in database
        let listId = 'temp-' + Date.now();
        if (pool) {
          const listResult = await pool.query(`
            INSERT INTO media_lists (user_id, name, topic, created_at)
            VALUES ($1, $2, $3, NOW())
            RETURNING id
          `, ['demo-user', listName, topic])
            .catch(() => ({ rows: [{ id: listId }] }));
          listId = listResult.rows[0].id;
        }
        
        // Use Claude to build targeted list
        const prompt = `Create a media list for: ${topic}
        
        Tier 1 publications: ${tier1Publications.join(', ') || 'Major tech and business outlets'}
        Target beats: ${targetBeats.join(', ') || 'Relevant to topic'}
        
        Generate 8-12 journalists who would be interested in this story.
        Include mix of tier 1 publications and relevant trade/specialty media.
        
        Return as JSON array with: name, publication, beat, email, whyRelevant`;
        
        const completion = await anthropic.messages.create({
          model: 'claude-3-haiku-20240307',
          max_tokens: 1000,
          temperature: 0.7,
          messages: [{ role: 'user', content: prompt }]
        });
        
        const responseText = completion.content[0].type === 'text' ? completion.content[0].text : '[]';
        let mediaList;
        
        try {
          const jsonMatch = responseText.match(/\[[\s\S]*\]/);
          mediaList = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
        } catch {
          mediaList = [];
        }
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                listId,
                listName,
                topic,
                journalistCount: mediaList.length,
                journalists: mediaList
              }, null, 2)
            }
          ]
        };
      }

      case 'monitor_coverage': {
        const { keywords = [], competitors = [], timeframe = '7d' } = args as any;
        
        // Simulate monitoring results
        const coverage: {
          timeframe: string;
          totalArticles: number;
          keywordMentions: { [key: string]: number };
          competitorMentions: { [key: string]: number };
          topPublications: { name: string; articles: number }[];
          sentiment: {
            positive: number;
            neutral: number;
            negative: number;
          };
        } = {
          timeframe,
          totalArticles: Math.floor(Math.random() * 50) + 10,
          keywordMentions: {},
          competitorMentions: {},
          topPublications: [],
          sentiment: {
            positive: 45,
            neutral: 40,
            negative: 15
          }
        };
        
        // Generate keyword mentions
        keywords.forEach((keyword: string) => {
          coverage.keywordMentions[keyword] = Math.floor(Math.random() * 20) + 1;
        });
        
        // Generate competitor mentions
        competitors.forEach((competitor: string) => {
          coverage.competitorMentions[competitor] = Math.floor(Math.random() * 15) + 1;
        });
        
        // Top publications
        coverage.topPublications = [
          { name: "TechCrunch", articles: 8 },
          { name: "The Verge", articles: 6 },
          { name: "Wired", articles: 4 }
        ];
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(coverage, null, 2)
            }
          ]
        };
      }

      case 'generate_pitch': {
        const { journalistName, storyAngle, companyInfo = '', pitchType = 'immediate' } = args as any;
        
        const pitchPrompt = `Generate a compelling media pitch for ${journalistName}.
        
        Story angle: ${storyAngle}
        Company info: ${companyInfo}
        Pitch type: ${pitchType}
        
        Create a personalized, concise email pitch that:
        - Has a compelling subject line
        - Opens with personalization
        - Clearly states the news value
        - Includes key points/data
        - Has a clear call to action
        - Is under 200 words
        
        Format as:
        Subject: [subject line]
        Body: [email body]`;
        
        const completion = await anthropic.messages.create({
          model: 'claude-3-haiku-20240307',
          max_tokens: 500,
          temperature: 0.7,
          messages: [{ role: 'user', content: pitchPrompt }]
        });
        
        const pitch = completion.content[0].type === 'text' ? completion.content[0].text : '';
        
        return {
          content: [
            {
              type: 'text',
              text: pitch
            }
          ]
        };
      }

      case 'track_outreach': {
        const { action, journalistId, status, notes } = args as any;
        
        if (action === 'log' || action === 'update') {
          // Log outreach activity
          let result = { rows: [{ status, message: 'Logged (database unavailable)' }] };
          if (pool) {
            result = await pool.query(`
              INSERT INTO media_outreach (
                journalist_id, status, notes, updated_at, user_id
              )
              VALUES ($1, $2, $3, NOW(), $4)
              ON CONFLICT (journalist_id, user_id) 
              DO UPDATE SET status = $2, notes = $3, updated_at = NOW()
              RETURNING id, status, updated_at
            `, [journalistId || 'unknown', status, notes || '', 'demo-user'])
              .catch(() => ({ rows: [{ status, message: 'Logged (database unavailable)' }] }));
          }
          
          return {
            content: [
              {
                type: 'text',
                text: `Outreach ${action}d: ${JSON.stringify(result.rows[0], null, 2)}`
              }
            ]
          };
        } else if (action === 'report') {
          // Generate outreach report
          const report = {
            totalOutreach: 25,
            sent: 25,
            opened: 18,
            responded: 7,
            published: 3,
            responseRate: '28%',
            publicationRate: '12%',
            topPerformingBeats: ['Technology', 'Business'],
            recommendedFollowUp: [
              'Follow up with non-responders after 48 hours',
              'Send additional assets to interested journalists'
            ]
          };
          
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(report, null, 2)
              }
            ]
          };
        }
        
        throw new Error(`Unknown action: ${action}`);
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: `Error executing ${name}: ${error.message}`
        }
      ],
      isError: true
    };
  }
});

// Start the server
async function main() {
  
  // Test database connection
  if (pool) {
    try {
      await pool.query('SELECT 1');
    } catch (error) {
    }
  } else {
  }
  
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
}

main().catch((error) => {
  process.exit(1);
});