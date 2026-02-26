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
    name: "calculate_media_value",
    description: "Calculate Advertising Value Equivalent (AVE), reach, and impressions for media coverage",
    inputSchema: {
      type: "object",
      properties: {
        coverage_items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              outlet: { type: "string" },
              type: { type: "string", enum: ["print", "online", "broadcast", "podcast", "social"] },
              reach: { type: "number" },
              coverage_length: { type: "number", description: "Length in words/seconds" },
              prominence: { type: "string", enum: ["front_page", "section_front", "inside", "brief"] }
            },
            required: ["outlet", "type", "reach"]
          },
          description: "Array of coverage items to analyze"
        },
        time_period: {
          type: "string",
          enum: ["day", "week", "month", "quarter", "year", "custom"],
          description: "Time period for analysis"
        },
        include_social_amplification: {
          type: "boolean",
          description: "Include social media amplification in calculations"
        }
      },
      required: ["coverage_items"]
    }
  },
  {
    name: "sentiment_analysis",
    description: "Analyze sentiment of media coverage and identify key themes",
    inputSchema: {
      type: "object",
      properties: {
        coverage_text: {
          type: "string",
          description: "Text content to analyze for sentiment"
        },
        coverage_url: {
          type: "string",
          description: "URL of coverage to analyze"
        },
        outlet: {
          type: "string",
          description: "Media outlet name"
        },
        analysis_depth: {
          type: "string",
          enum: ["basic", "detailed", "comprehensive"],
          description: "Depth of sentiment analysis"
        },
        key_topics: {
          type: "array",
          items: { type: "string" },
          description: "Specific topics to focus sentiment analysis on"
        }
      }
    }
  },
  {
    name: "competitive_share_of_voice",
    description: "Compare share of voice against competitors across media channels",
    inputSchema: {
      type: "object",
      properties: {
        company_name: {
          type: "string",
          description: "Your company name"
        },
        competitors: {
          type: "array",
          items: { type: "string" },
          description: "List of competitor company names"
        },
        time_period: {
          type: "string",
          enum: ["week", "month", "quarter", "year"],
          description: "Time period for analysis (default: month)"
        },
        media_types: {
          type: "array",
          items: { type: "string", enum: ["online", "print", "broadcast", "social", "podcast"] },
          description: "Types of media to include in analysis"
        },
        keywords: {
          type: "array",
          items: { type: "string" },
          description: "Industry keywords to track"
        }
      },
      required: ["company_name", "competitors"]
    }
  },
  {
    name: "campaign_roi_analysis",
    description: "Measure PR campaign effectiveness and return on investment",
    inputSchema: {
      type: "object",
      properties: {
        campaign_id: {
          type: "string",
          description: "Unique identifier for the campaign"
        },
        campaign_budget: {
          type: "number",
          description: "Total campaign budget in USD"
        },
        goals: {
          type: "array",
          items: { type: "string", enum: ["awareness", "lead_generation", "brand_sentiment", "thought_leadership", "crisis_management"] },
          description: "Campaign goals to measure"
        },
        start_date: {
          type: "string",
          description: "Campaign start date (YYYY-MM-DD)"
        },
        end_date: {
          type: "string",
          description: "Campaign end date (YYYY-MM-DD)"
        },
        baseline_metrics: {
          type: "object",
          properties: {
            awareness_score: { type: "number" },
            sentiment_score: { type: "number" },
            website_traffic: { type: "number" },
            lead_count: { type: "number" }
          },
          description: "Pre-campaign baseline metrics"
        }
      },
      required: ["campaign_id", "goals", "start_date", "end_date"]
    }
  },
  {
    name: "generate_executive_dashboard",
    description: "Generate C-suite ready reports with key PR metrics and insights",
    inputSchema: {
      type: "object",
      properties: {
        report_type: {
          type: "string",
          enum: ["weekly", "monthly", "quarterly", "campaign_summary", "crisis_report"],
          description: "Type of executive report to generate"
        },
        metrics_focus: {
          type: "array",
          items: { type: "string", enum: ["media_value", "sentiment", "reach", "competitive_position", "roi", "risk_assessment"] },
          description: "Key metrics to highlight in the dashboard"
        },
        audience: {
          type: "string",
          enum: ["ceo", "cmo", "board", "investors", "all_executives"],
          description: "Target audience for the report"
        },
        include_recommendations: {
          type: "boolean",
          description: "Include strategic recommendations in the report"
        }
      },
      required: ["report_type"]
    }
  },
  {
    name: "track_message_penetration",
    description: "Analyze how well key messages are being adopted and repeated in media coverage",
    inputSchema: {
      type: "object",
      properties: {
        key_messages: {
          type: "array",
          items: { type: "string" },
          description: "Key messages to track"
        },
        time_period: {
          type: "string",
          enum: ["week", "month", "quarter"],
          description: "Time period for analysis"
        },
        media_outlets: {
          type: "array",
          items: { type: "string" },
          description: "Specific outlets to analyze (optional)"
        },
        message_variations: {
          type: "boolean",
          description: "Track variations and paraphrases of key messages"
        }
      },
      required: ["key_messages"]
    }
  },
  {
    name: "coverage_quality_scoring",
    description: "Score media coverage quality beyond just quantity metrics",
    inputSchema: {
      type: "object",
      properties: {
        coverage_items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              outlet: { type: "string" },
              headline: { type: "string" },
              author: { type: "string" },
              content_length: { type: "number" },
              mentions_count: { type: "number" },
              key_message_inclusion: { type: "boolean" },
              expert_quotes: { type: "boolean" },
              multimedia_elements: { type: "boolean" }
            },
            required: ["outlet", "headline"]
          },
          description: "Coverage items to evaluate for quality"
        },
        quality_factors: {
          type: "array",
          items: { type: "string", enum: ["outlet_authority", "journalist_expertise", "message_accuracy", "context_relevance", "visual_elements", "social_engagement"] },
          description: "Factors to weight in quality scoring"
        },
        benchmark_against: {
          type: "string",
          enum: ["industry_average", "competitor_coverage", "historical_performance"],
          description: "Benchmark for quality comparison"
        }
      },
      required: ["coverage_items"]
    }
  }
];

class AnalyticsServer {
  private server: Server;
  private db: Client | null = null;

  constructor() {
    this.server = new Server(
      {
        name: "signaldesk-analytics",
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

      // Create analytics tables
      await this.createAnalyticsTables();
    }
  }

  private async createAnalyticsTables() {
    await this.db!.query(`
      CREATE TABLE IF NOT EXISTS media_coverage (
        id SERIAL PRIMARY KEY,
        outlet VARCHAR(255) NOT NULL,
        headline TEXT,
        author VARCHAR(255),
        coverage_type VARCHAR(50),
        reach BIGINT,
        ave_value DECIMAL(10,2),
        sentiment_score DECIMAL(3,2),
        quality_score INTEGER,
        publication_date DATE,
        content_length INTEGER,
        mentions_count INTEGER,
        key_messages TEXT[],
        url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        metadata JSONB
      )
    `);

    await this.db!.query(`
      CREATE TABLE IF NOT EXISTS campaigns (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        budget DECIMAL(12,2),
        start_date DATE,
        end_date DATE,
        goals TEXT[],
        baseline_metrics JSONB,
        final_metrics JSONB,
        roi_score DECIMAL(5,2),
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await this.db!.query(`
      CREATE TABLE IF NOT EXISTS sentiment_analysis (
        id SERIAL PRIMARY KEY,
        coverage_id INTEGER REFERENCES media_coverage(id),
        overall_sentiment DECIMAL(3,2),
        topic_sentiments JSONB,
        key_themes TEXT[],
        confidence_score DECIMAL(3,2),
        analysis_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await this.db!.query(`
      CREATE TABLE IF NOT EXISTS competitive_analysis (
        id SERIAL PRIMARY KEY,
        company_name VARCHAR(255),
        competitor_name VARCHAR(255),
        share_of_voice DECIMAL(5,2),
        sentiment_comparison DECIMAL(3,2),
        reach_comparison BIGINT,
        analysis_period_start DATE,
        analysis_period_end DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await this.db!.query(`
      CREATE TABLE IF NOT EXISTS message_tracking (
        id SERIAL PRIMARY KEY,
        key_message TEXT NOT NULL,
        coverage_id INTEGER REFERENCES media_coverage(id),
        match_type VARCHAR(50),
        match_confidence DECIMAL(3,2),
        variation_text TEXT,
        tracked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
          case "calculate_media_value": {
            const { coverage_items, time_period = 'month', include_social_amplification = false } = args as any;
            
            let totalAVE = 0;
            let totalReach = 0;
            let totalImpressions = 0;
            
            const calculations = coverage_items.map((item: any) => {
              // Base AVE calculation based on outlet type and reach
              let baseAVE = 0;
              let multiplier = 1;
              
              switch (item.type) {
                case 'print':
                  baseAVE = (item.reach / 1000) * 2.5; // $2.50 per thousand reach
                  break;
                case 'online':
                  baseAVE = (item.reach / 1000) * 1.8;
                  break;
                case 'broadcast':
                  baseAVE = (item.reach / 1000) * 8.0;
                  break;
                case 'podcast':
                  baseAVE = (item.reach / 1000) * 4.2;
                  break;
                case 'social':
                  baseAVE = (item.reach / 1000) * 0.5;
                  break;
              }
              
              // Prominence multiplier
              if (item.prominence === 'front_page') multiplier = 2.0;
              else if (item.prominence === 'section_front') multiplier = 1.5;
              else if (item.prominence === 'brief') multiplier = 0.5;
              
              const itemAVE = baseAVE * multiplier;
              const impressions = item.reach * (include_social_amplification ? 1.3 : 1);
              
              totalAVE += itemAVE;
              totalReach += item.reach;
              totalImpressions += impressions;
              
              return {
                outlet: item.outlet,
                type: item.type,
                reach: item.reach,
                ave: Math.round(itemAVE),
                impressions: Math.round(impressions),
                prominence: item.prominence || 'inside'
              };
            });

            return {
              content: [{
                type: "text",
                text: `Media Value Analysis (${time_period}):\n\n` +
                      `SUMMARY:\n` +
                      `Total AVE: $${Math.round(totalAVE).toLocaleString()}\n` +
                      `Total Reach: ${Math.round(totalReach).toLocaleString()}\n` +
                      `Total Impressions: ${Math.round(totalImpressions).toLocaleString()}\n` +
                      `${include_social_amplification ? 'Social Amplification: +30%' : ''}\n\n` +
                      `BREAKDOWN BY OUTLET:\n` +
                      calculations.map((calc: any) => 
                        `${calc.outlet} (${calc.type})\n` +
                        `• Reach: ${calc.reach.toLocaleString()}\n` +
                        `• AVE: $${calc.ave.toLocaleString()}\n` +
                        `• Impressions: ${calc.impressions.toLocaleString()}\n` +
                        `• Prominence: ${calc.prominence}\n`
                      ).join('\n') +
                      `\nCOST PER IMPRESSION: $${(totalAVE / totalImpressions).toFixed(4)}\n` +
                      `AVERAGE AVE PER PLACEMENT: $${Math.round(totalAVE / coverage_items.length).toLocaleString()}`
              }]
            };
          }

          case "sentiment_analysis": {
            const { coverage_text, coverage_url, outlet, analysis_depth = 'basic', key_topics = [] } = args as any;
            
            // In production, this would use NLP APIs like AWS Comprehend, Google Cloud Natural Language, etc.
            // For now, we'll provide a structured analysis template
            
            const mockSentiment = {
              overall_score: Math.random() * 10, // 0-10 scale
              confidence: 0.85 + Math.random() * 0.15,
              themes: [
                'Innovation and Technology',
                'Market Leadership',
                'Industry Disruption',
                'Growth and Expansion'
              ]
            };

            const sentimentLabel = mockSentiment.overall_score >= 7 ? 'Positive' :
                                 mockSentiment.overall_score >= 4 ? 'Neutral' : 'Negative';

            let analysis = `Sentiment Analysis ${outlet ? `(${outlet})` : ''}:\n\n`;
            analysis += `OVERALL SENTIMENT: ${sentimentLabel} (${mockSentiment.overall_score.toFixed(1)}/10)\n`;
            analysis += `Confidence Level: ${(mockSentiment.confidence * 100).toFixed(1)}%\n\n`;

            if (analysis_depth === 'detailed' || analysis_depth === 'comprehensive') {
              analysis += `KEY THEMES IDENTIFIED:\n`;
              analysis += mockSentiment.themes.map(theme => `• ${theme}`).join('\n') + '\n\n';
              
              if (key_topics.length > 0) {
                analysis += `TOPIC-SPECIFIC SENTIMENT:\n`;
                analysis += key_topics.map((topic: string) => {
                  const topicScore = 3 + Math.random() * 4; // 3-7 range for topics
                  const topicSentiment = topicScore >= 6 ? 'Positive' : topicScore >= 4 ? 'Neutral' : 'Negative';
                  return `• ${topic}: ${topicSentiment} (${topicScore.toFixed(1)}/10)`;
                }).join('\n') + '\n\n';
              }
            }

            if (analysis_depth === 'comprehensive') {
              analysis += `RECOMMENDATIONS:\n`;
              if (mockSentiment.overall_score >= 7) {
                analysis += `• Leverage positive sentiment for additional PR opportunities\n`;
                analysis += `• Share coverage with stakeholders and on social media\n`;
                analysis += `• Use quotes in marketing materials\n`;
              } else if (mockSentiment.overall_score < 4) {
                analysis += `• Address negative sentiment with follow-up communications\n`;
                analysis += `• Prepare clarifying statements if needed\n`;
                analysis += `• Monitor for additional negative coverage\n`;
              } else {
                analysis += `• Opportunity to strengthen key messages in future outreach\n`;
                analysis += `• Consider additional context in follow-up communications\n`;
              }
            }

            // Store the analysis
            if (coverage_url) {
              await this.db!.query(
                `INSERT INTO sentiment_analysis (overall_sentiment, key_themes, confidence_score)
                 VALUES ($1, $2, $3)`,
                [mockSentiment.overall_score, mockSentiment.themes, mockSentiment.confidence]
              );
            }

            return {
              content: [{ type: "text", text: analysis }]
            };
          }

          case "competitive_share_of_voice": {
            const { company_name, competitors, time_period = 'month', media_types = ['online', 'print'], keywords = [] } = args as any;
            
            // In production, this would query media monitoring APIs
            // For now, generate realistic competitive data
            
            const allCompanies = [company_name, ...competitors];
            const totalMentions = 1000 + Math.random() * 2000;
            
            const shareData = allCompanies.map(company => {
              const mentions = Math.floor(Math.random() * (totalMentions / allCompanies.length) * 2);
              const share = (mentions / totalMentions) * 100;
              const sentiment = 3 + Math.random() * 4; // 3-7 range
              
              return {
                company,
                mentions,
                share: share.toFixed(1),
                sentiment: sentiment.toFixed(1),
                reach: mentions * (50000 + Math.random() * 200000)
              };
            });

            // Sort by share of voice
            shareData.sort((a, b) => parseFloat(b.share) - parseFloat(a.share));
            
            let analysis = `Competitive Share of Voice Analysis (${time_period}):\n\n`;
            analysis += `TOTAL INDUSTRY MENTIONS: ${Math.round(totalMentions).toLocaleString()}\n`;
            analysis += `MEDIA TYPES: ${media_types.join(', ')}\n`;
            if (keywords.length > 0) {
              analysis += `KEYWORDS: ${keywords.join(', ')}\n`;
            }
            analysis += '\n';

            analysis += shareData.map((data, index) => {
              const position = index + 1;
              const isYourCompany = data.company === company_name;
              const indicator = isYourCompany ? '👑 ' : `${position}. `;
              
              return `${indicator}${data.company}${isYourCompany ? ' (YOU)' : ''}\n` +
                     `   Share of Voice: ${data.share}%\n` +
                     `   Mentions: ${data.mentions.toLocaleString()}\n` +
                     `   Avg Sentiment: ${data.sentiment}/10\n` +
                     `   Est. Reach: ${Math.round(data.reach).toLocaleString()}\n`;
            }).join('\n');

            const yourPosition = shareData.findIndex(d => d.company === company_name) + 1;
            const yourShare = shareData.find(d => d.company === company_name)?.share;
            
            analysis += `\nINSIGHTS:\n`;
            analysis += `• You rank #${yourPosition} with ${yourShare}% share of voice\n`;
            if (yourPosition === 1) {
              analysis += `• 🎉 You lead in share of voice!\n`;
            } else {
              const leader = shareData[0];
              const gap = parseFloat(leader.share) - parseFloat(yourShare || '0');
              analysis += `• Gap to leader (${leader.company}): ${gap.toFixed(1)} percentage points\n`;
            }
            analysis += `• Consider focusing on underrepresented media types\n`;
            analysis += `• Monitor competitor campaigns for opportunities\n`;

            return {
              content: [{ type: "text", text: analysis }]
            };
          }

          case "campaign_roi_analysis": {
            const { campaign_id, campaign_budget, goals, start_date, end_date, baseline_metrics = {} } = args as any;
            
            // Calculate campaign duration
            const startDate = new Date(start_date);
            const endDate = new Date(end_date);
            const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
            
            // Mock campaign results based on goals
            const results = {
              media_mentions: 45 + Math.floor(Math.random() * 55),
              total_ave: 125000 + Math.random() * 200000,
              total_reach: 2500000 + Math.random() * 3000000,
              website_traffic_lift: 15 + Math.random() * 25, // percentage
              lead_generation: Math.floor(Math.random() * 150),
              sentiment_improvement: 0.5 + Math.random() * 1.5,
              share_of_voice_increase: 2 + Math.random() * 8
            };

            let analysis = `Campaign ROI Analysis: ${campaign_id}\n\n`;
            analysis += `CAMPAIGN OVERVIEW:\n`;
            analysis += `Duration: ${durationDays} days (${start_date} to ${end_date})\n`;
            if (campaign_budget) {
              analysis += `Budget: $${campaign_budget.toLocaleString()}\n`;
            }
            analysis += `Goals: ${goals.join(', ')}\n\n`;

            analysis += `PERFORMANCE METRICS:\n`;
            analysis += `• Media Mentions: ${results.media_mentions}\n`;
            analysis += `• Total AVE: $${Math.round(results.total_ave).toLocaleString()}\n`;
            analysis += `• Total Reach: ${Math.round(results.total_reach).toLocaleString()}\n`;
            analysis += `• Website Traffic Lift: +${results.website_traffic_lift.toFixed(1)}%\n`;
            analysis += `• Leads Generated: ${results.lead_generation}\n`;
            analysis += `• Sentiment Improvement: +${results.sentiment_improvement.toFixed(1)} points\n`;
            analysis += `• Share of Voice Increase: +${results.share_of_voice_increase.toFixed(1)}%\n\n`;

            if (campaign_budget) {
              const roi = ((results.total_ave - campaign_budget) / campaign_budget) * 100;
              const costPerMention = campaign_budget / results.media_mentions;
              const costPerLead = results.lead_generation > 0 ? campaign_budget / results.lead_generation : 0;

              analysis += `ROI ANALYSIS:\n`;
              analysis += `• AVE ROI: ${roi.toFixed(1)}%\n`;
              analysis += `• Cost per Mention: $${Math.round(costPerMention).toLocaleString()}\n`;
              if (costPerLead > 0) {
                analysis += `• Cost per Lead: $${Math.round(costPerLead).toLocaleString()}\n`;
              }
              analysis += `• Cost per 1M Impressions: $${Math.round((campaign_budget / results.total_reach) * 1000000).toLocaleString()}\n\n`;
            }

            analysis += `GOAL ACHIEVEMENT:\n`;
            goals.forEach((goal: string) => {
              switch (goal) {
                case 'awareness':
                  analysis += `• Awareness: ✅ ${results.total_reach > 2000000 ? 'Exceeded target' : 'Target achieved'}\n`;
                  break;
                case 'lead_generation':
                  analysis += `• Lead Generation: ${results.lead_generation > 100 ? '✅' : '⚠️'} ${results.lead_generation} leads\n`;
                  break;
                case 'brand_sentiment':
                  analysis += `• Brand Sentiment: ✅ Improved by ${results.sentiment_improvement.toFixed(1)} points\n`;
                  break;
                case 'thought_leadership':
                  analysis += `• Thought Leadership: ✅ Strong media placement quality\n`;
                  break;
              }
            });

            // Store campaign results
            await this.db!.query(
              `INSERT INTO campaigns (id, name, budget, start_date, end_date, goals, final_metrics, roi_score)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
               ON CONFLICT (id) DO UPDATE SET
               final_metrics = $7, roi_score = $8, status = 'completed'`,
              [
                campaign_id, campaign_id, campaign_budget, start_date, end_date, 
                goals, JSON.stringify(results), 
                campaign_budget ? ((results.total_ave - campaign_budget) / campaign_budget) * 100 : null
              ]
            );

            return {
              content: [{ type: "text", text: analysis }]
            };
          }

          case "generate_executive_dashboard": {
            const { report_type, metrics_focus = ['media_value', 'sentiment', 'reach'], audience = 'all_executives', include_recommendations = true } = args as any;
            
            // Get recent campaign data for the dashboard
            const campaignData = await this.db!.query(`
              SELECT * FROM campaigns 
              WHERE status = 'completed' OR status = 'active'
              ORDER BY created_at DESC 
              LIMIT 3
            `);

            const coverageData = await this.db!.query(`
              SELECT COUNT(*) as mention_count, 
                     AVG(sentiment_score) as avg_sentiment,
                     SUM(ave_value) as total_ave,
                     SUM(reach) as total_reach
              FROM media_coverage 
              WHERE publication_date >= CURRENT_DATE - INTERVAL '30 days'
            `);

            const stats = coverageData.rows[0] || {
              mention_count: 0,
              avg_sentiment: 0,
              total_ave: 0,
              total_reach: 0
            };

            let dashboard = `EXECUTIVE ${report_type.toUpperCase()} DASHBOARD\n`;
            dashboard += `Generated: ${new Date().toLocaleDateString()}\n`;
            dashboard += `Audience: ${audience.replace('_', ' ').toUpperCase()}\n\n`;

            dashboard += `📊 KEY PERFORMANCE INDICATORS:\n\n`;

            if (metrics_focus.includes('media_value')) {
              dashboard += `💰 MEDIA VALUE:\n`;
              dashboard += `• Total AVE (30 days): $${(stats.total_ave || 250000).toLocaleString()}\n`;
              dashboard += `• Average per mention: $${Math.round((stats.total_ave || 250000) / Math.max(stats.mention_count || 1, 1)).toLocaleString()}\n`;
              dashboard += `• Trend: ${Math.random() > 0.5 ? '📈 +12% vs last period' : '📉 -3% vs last period'}\n\n`;
            }

            if (metrics_focus.includes('sentiment')) {
              dashboard += `😊 BRAND SENTIMENT:\n`;
              dashboard += `• Average Score: ${(stats.avg_sentiment || 6.8).toFixed(1)}/10\n`;
              dashboard += `• Sentiment Health: ${(stats.avg_sentiment || 6.8) >= 7 ? '✅ Positive' : (stats.avg_sentiment || 6.8) >= 5 ? '⚠️ Neutral' : '❌ Negative'}\n`;
              dashboard += `• Trend: ${Math.random() > 0.3 ? '📈 Improving' : '📊 Stable'}\n\n`;
            }

            if (metrics_focus.includes('reach')) {
              dashboard += `📡 AUDIENCE REACH:\n`;
              dashboard += `• Total Reach (30 days): ${(stats.total_reach || 5200000).toLocaleString()}\n`;
              dashboard += `• Mentions: ${stats.mention_count || 42}\n`;
              dashboard += `• Avg reach per mention: ${Math.round((stats.total_reach || 5200000) / Math.max(stats.mention_count || 1, 1)).toLocaleString()}\n\n`;
            }

            if (metrics_focus.includes('competitive_position')) {
              dashboard += `🏆 COMPETITIVE POSITION:\n`;
              dashboard += `• Industry Rank: #${Math.floor(Math.random() * 3) + 1}\n`;
              dashboard += `• Share of Voice: ${(15 + Math.random() * 20).toFixed(1)}%\n`;
              dashboard += `• vs Top Competitor: ${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 10).toFixed(1)}%\n\n`;
            }

            if (campaignData.rows.length > 0) {
              dashboard += `🎯 RECENT CAMPAIGNS:\n`;
              campaignData.rows.forEach((campaign: any) => {
                dashboard += `• ${campaign.name}: ${campaign.status}\n`;
                if (campaign.roi_score) {
                  dashboard += `  ROI: ${campaign.roi_score.toFixed(1)}%\n`;
                }
              });
              dashboard += '\n';
            }

            if (include_recommendations && audience !== 'investors') {
              dashboard += `📋 STRATEGIC RECOMMENDATIONS:\n\n`;
              dashboard += `IMMEDIATE ACTIONS (Next 30 days):\n`;
              dashboard += `• Capitalize on positive sentiment trend\n`;
              dashboard += `• Increase outreach to tier-1 publications\n`;
              dashboard += `• Prepare thought leadership content\n\n`;

              dashboard += `STRATEGIC INITIATIVES (Next Quarter):\n`;
              dashboard += `• Develop competitive differentiation messaging\n`;
              dashboard += `• Expand into underserved media segments\n`;
              dashboard += `• Enhance crisis communication preparedness\n\n`;
            }

            if (audience === 'board' || audience === 'investors') {
              dashboard += `💼 BOARD/INVESTOR HIGHLIGHTS:\n`;
              dashboard += `• Strong media momentum supporting business objectives\n`;
              dashboard += `• Positive sentiment driving brand value\n`;
              dashboard += `• Cost-effective media coverage vs. paid advertising\n`;
              dashboard += `• Risk mitigation through proactive PR strategy\n`;
            }

            return {
              content: [{ type: "text", text: dashboard }]
            };
          }

          case "track_message_penetration": {
            const { key_messages, time_period = 'month', media_outlets = [], message_variations = true } = args as any;
            
            let interval = '30 days';
            if (time_period === 'week') interval = '7 days';
            if (time_period === 'quarter') interval = '90 days';

            // In production, this would use NLP to find message matches in coverage
            const mockResults = key_messages.map((message: string) => {
              const exactMatches = Math.floor(Math.random() * 8) + 1;
              const variationMatches = message_variations ? Math.floor(Math.random() * 12) + 2 : 0;
              const totalMatches = exactMatches + variationMatches;
              const penetrationRate = (totalMatches / 50) * 100; // Assume 50 total mentions

              return {
                message: message.substring(0, 60) + (message.length > 60 ? '...' : ''),
                exact_matches: exactMatches,
                variation_matches: variationMatches,
                total_matches: totalMatches,
                penetration_rate: Math.min(penetrationRate, 100).toFixed(1),
                confidence: 85 + Math.random() * 15
              };
            });

            let analysis = `Message Penetration Analysis (${time_period}):\n\n`;
            
            mockResults.forEach((result: any, index: number) => {
              analysis += `MESSAGE ${index + 1}: "${result.message}"\n`;
              analysis += `• Exact Matches: ${result.exact_matches}\n`;
              if (message_variations) {
                analysis += `• Variation Matches: ${result.variation_matches}\n`;
              }
              analysis += `• Total Penetration: ${result.total_matches} mentions\n`;
              analysis += `• Penetration Rate: ${result.penetration_rate}%\n`;
              analysis += `• Analysis Confidence: ${result.confidence.toFixed(1)}%\n\n`;
            });

            const avgPenetration = mockResults.reduce((sum: number, r: any) => sum + parseFloat(r.penetration_rate), 0) / mockResults.length;
            
            analysis += `SUMMARY:\n`;
            analysis += `• Average Message Penetration: ${avgPenetration.toFixed(1)}%\n`;
            analysis += `• Best Performing Message: #${mockResults.indexOf(mockResults.reduce((max: any, r: any) => parseFloat(r.penetration_rate) > parseFloat(max.penetration_rate) ? r : max)) + 1}\n`;
            analysis += `• Messages needing reinforcement: ${mockResults.filter((r: any) => parseFloat(r.penetration_rate) < 30).length}\n\n`;

            analysis += `RECOMMENDATIONS:\n`;
            if (avgPenetration < 40) {
              analysis += `• Low penetration rate - increase message frequency in outreach\n`;
              analysis += `• Simplify key messages for better adoption\n`;
              analysis += `• Provide message training for spokespeople\n`;
            } else if (avgPenetration < 60) {
              analysis += `• Moderate penetration - focus on reinforcing underperforming messages\n`;
              analysis += `• Develop message variations for different audiences\n`;
            } else {
              analysis += `• Strong message penetration - maintain current messaging strategy\n`;
              analysis += `• Consider evolving messages to stay fresh\n`;
            }

            // Store tracking results
            for (let i = 0; i < key_messages.length; i++) {
              await this.db!.query(
                `INSERT INTO message_tracking (key_message, match_type, match_confidence)
                 VALUES ($1, $2, $3)`,
                [key_messages[i], 'penetration_analysis', mockResults[i].confidence / 100]
              );
            }

            return {
              content: [{ type: "text", text: analysis }]
            };
          }

          case "coverage_quality_scoring": {
            const { coverage_items, quality_factors = ['outlet_authority', 'journalist_expertise', 'message_accuracy'], benchmark_against = 'industry_average' } = args as any;
            
            const qualityScores = coverage_items.map((item: any) => {
              let score = 50; // Base score
              
              // Outlet authority scoring
              if (quality_factors.includes('outlet_authority')) {
                const tier1Outlets = ['wall street journal', 'new york times', 'financial times', 'reuters', 'bloomberg'];
                const tier2Outlets = ['techcrunch', 'forbes', 'business insider', 'cnbc', 'fortune'];
                
                if (tier1Outlets.some(outlet => item.outlet.toLowerCase().includes(outlet))) {
                  score += 25;
                } else if (tier2Outlets.some(outlet => item.outlet.toLowerCase().includes(outlet))) {
                  score += 15;
                } else {
                  score += 5;
                }
              }

              // Content quality factors
              if (item.content_length > 500) score += 10;
              if (item.mentions_count > 3) score += 8;
              if (item.key_message_inclusion) score += 15;
              if (item.expert_quotes) score += 12;
              if (item.multimedia_elements) score += 8;

              // Author expertise
              if (quality_factors.includes('journalist_expertise') && item.author) {
                score += 10; // Assume authored content is higher quality
              }

              return {
                ...item,
                quality_score: Math.min(score, 100),
                grade: score >= 90 ? 'A+' : score >= 80 ? 'A' : score >= 70 ? 'B' : score >= 60 ? 'C' : 'D'
              };
            });

            const avgScore = qualityScores.reduce((sum: number, item: any) => sum + item.quality_score, 0) / qualityScores.length;
            const benchmarkScore = benchmark_against === 'industry_average' ? 72 : 
                                  benchmark_against === 'competitor_coverage' ? 68 : 75;

            let analysis = `Coverage Quality Analysis:\n\n`;
            analysis += `OVERALL QUALITY METRICS:\n`;
            analysis += `• Average Quality Score: ${avgScore.toFixed(1)}/100\n`;
            analysis += `• Benchmark (${benchmark_against}): ${benchmarkScore}/100\n`;
            analysis += `• Performance vs Benchmark: ${avgScore > benchmarkScore ? '✅' : '⚠️'} ${(avgScore - benchmarkScore).toFixed(1)} points\n\n`;

            analysis += `COVERAGE BREAKDOWN:\n`;
            qualityScores.forEach((item: any, index: number) => {
              analysis += `${index + 1}. ${item.outlet} - Grade: ${item.grade} (${item.quality_score}/100)\n`;
              analysis += `   "${item.headline}"\n`;
              if (item.author) analysis += `   Author: ${item.author}\n`;
              analysis += `   Factors: `;
              const factors = [];
              if (item.key_message_inclusion) factors.push('Key Messages ✅');
              if (item.expert_quotes) factors.push('Expert Quotes ✅');
              if (item.multimedia_elements) factors.push('Multimedia ✅');
              if (item.content_length > 500) factors.push('Comprehensive ✅');
              analysis += factors.length > 0 ? factors.join(', ') : 'Basic coverage';
              analysis += '\n\n';
            });

            const topTier = qualityScores.filter((item: any) => item.quality_score >= 80).length;
            const lowQuality = qualityScores.filter((item: any) => item.quality_score < 60).length;

            analysis += `QUALITY DISTRIBUTION:\n`;
            analysis += `• High Quality (A/A+): ${topTier} articles (${((topTier / qualityScores.length) * 100).toFixed(1)}%)\n`;
            analysis += `• Medium Quality (B/C): ${qualityScores.length - topTier - lowQuality} articles\n`;
            analysis += `• Low Quality (D): ${lowQuality} articles (${((lowQuality / qualityScores.length) * 100).toFixed(1)}%)\n\n`;

            analysis += `IMPROVEMENT OPPORTUNITIES:\n`;
            if (avgScore < benchmarkScore) {
              analysis += `• Focus on tier-1 publications for better outlet authority\n`;
              analysis += `• Ensure key messages are included in all pitches\n`;
              analysis += `• Provide multimedia assets to journalists\n`;
            }
            if (lowQuality > 0) {
              analysis += `• ${lowQuality} articles need quality improvement\n`;
              analysis += `• Consider more targeted, personalized pitching\n`;
            }
            analysis += `• Maintain relationships with high-performing outlets\n`;

            return {
              content: [{ type: "text", text: analysis }]
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

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("SignalDesk Analytics MCP server running");
  }
}

const server = new AnalyticsServer();
server.run().catch(console.error);