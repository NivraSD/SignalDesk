Core Architecture Philosophy
Think "AI-First, UI-Second" - Structure everything so Claude can operate it as effectively as a human user. Every feature should be an MCP tool first, UI component second.

1. Hub-and-Spoke MCP Architecture
   Instead of separate MCP servers, create a unified structure:
   signaldesk-core (Hub)
   ├── Memory Engine (Persistent Context)
   ├── Campaign Engine (Strategy & Execution)  
   ├── Media Engine (Relationships & Outreach)
   ├── Analytics Engine (Intelligence & Insights)
   └── Automation Engine (Workflows & Triggers)
   Why This Structure Works
   Each "engine" is a collection of related tools that Claude can orchestrate:
   javascript// signaldesk-core MCP server
   const TOOLS = {
   // Memory Engine
   'memory.store': storeContext,
   'memory.recall': recallContext,
   'memory.associate': createRelationship,
   'memory.evolve': updateWithVersioning,

// Campaign Engine  
 'campaign.strategize': generateStrategy,
'campaign.create': createCampaign,
'campaign.simulate': runScenarios,
'campaign.execute': triggerWorkflow,

// Media Engine
'media.discover': findJournalists,
'media.analyze': analyzeRelationship,
'media.engage': draftOutreach,
'media.track': monitorCoverage,

// Analytics Engine
'analytics.assess': situationAnalysis,
'analytics.predict': outcomeModeling,
'analytics.benchmark': competitiveIntel,

// Automation Engine
'auto.schedule': setTriggers,
'auto.monitor': watchConditions,
'auto.respond': executeResponse
} 2. Context-Rich Tool Design
Each MCP tool should carry rich context automatically:
javascript// BAD: Isolated tool
async function findJournalists(beat) {
return await db.query('SELECT \* FROM journalists WHERE beat = ?', [beat]);
}

// GOOD: Context-aware tool
async function findJournalists(beat, context) {
// Automatically pull context
const campaign = await getCurrentCampaign(context.userId);
const previousOutreach = await getOutreachHistory(context.userId);
const companyProfile = await getCompanyProfile(context.userId);

// Smart filtering based on context
const journalists = await db.query(`    SELECT j.*, 
           oh.last_contact,
           oh.relationship_score,
           COUNT(oh.id) as previous_interactions
    FROM journalists j
    LEFT JOIN outreach_history oh ON j.id = oh.journalist_id
    WHERE j.beat = ? 
      AND j.id NOT IN (SELECT journalist_id FROM recent_outreach WHERE days_ago < 30)
      AND j.tier <= ?
    ORDER BY 
      CASE WHEN oh.relationship_score > 0 THEN 0 ELSE 1 END,
      j.relevance_score DESC
 `, [beat, campaign?.tier || 2]);

// Enrich with context
return {
journalists,
context: {
campaign: campaign?.name,
avoiding_recent_contacts: true,
prioritizing_relationships: true
}
};
} 3. Stateful Conversation Flows
Structure MCP tools to maintain conversation state across calls:
javascript// Campaign creation flow with state management
const CampaignFlows = {
async startCampaignPlanning(userId, initialIdea) {
// Create a planning session
const session = await createSession({
type: 'campaign_planning',
userId,
state: 'discovery',
context: { idea: initialIdea }
});

    // Return next action for Claude
    return {
      sessionId: session.id,
      nextActions: ['gather_requirements', 'analyze_landscape', 'suggest_angles'],
      suggestedQuestion: "What's the main announcement or news you want to communicate?"
    };

},

async continueSession(sessionId, userInput, action) {
const session = await getSession(sessionId);

    switch(session.state) {
      case 'discovery':
        // Store information and advance state
        await updateSession(sessionId, {
          state: 'strategy',
          context: { ...session.context, discovery: userInput }
        });
        return { nextActions: ['generate_strategy', 'identify_audiences'] };

      case 'strategy':
        // Generate campaign based on collected context
        const campaign = await generateCampaign(session.context);
        return { campaign, nextActions: ['refine', 'execute', 'schedule'] };
    }

}
}; 4. Intelligent Memory Structure
Design your MemoryVault to support PR workflows specifically:
javascriptconst MemoryStructure = {
// Hierarchical memory with PR-specific categorization
categories: {
'company': {
'messaging': ['key_messages', 'boilerplate', 'positioning'],
'assets': ['logos', 'exec_bios', 'fact_sheets'],
'history': ['past_campaigns', 'coverage', 'crises']
},
'relationships': {
'journalists': ['preferences', 'past_pitches', 'coverage_given'],
'stakeholders': ['influence_map', 'concerns', 'support_level']
},
'intelligence': {
'competitors': ['announcements', 'messaging', 'coverage'],
'industry': ['trends', 'events', 'regulatory']
},
'playbooks': {
'templates': ['press_releases', 'pitches', 'statements'],
'workflows': ['launch_sequence', 'crisis_response', 'thought_leadership']
}
},

// Auto-tagging based on content
async autoTag(content) {
const tags = [];
if (content.includes('journalist')) tags.push('media_relations');
if (content.includes('crisis')) tags.push('crisis_management');
if (content.includes('launch')) tags.push('product_launch');
// Use Claude to suggest more sophisticated tags
return tags;
}
}; 5. PR-Specific Tool Patterns
Create tools that understand PR workflows:
javascript// Situational Analysis Tool
async function analyzeSituation(context) {
return {
opportunities: await identifyOpportunities(context),
threats: await identifyThreats(context),
recommendedActions: await getRecommendations(context),
timeSensitivity: await assessUrgency(context)
};
}

// Message Testing Tool
async function testMessage(message, audiences) {
const results = {};
for (const audience of audiences) {
results[audience] = {
sentiment: await predictSentiment(message, audience),
clarity: await assessClarity(message, audience),
risks: await identifyRisks(message, audience),
suggestions: await improveMessage(message, audience)
};
}
return results;
}

// Coverage Prediction Tool
async function predictCoverage(campaign) {
return {
likelihood: await estimateCoverageChance(campaign),
expectedReach: await estimateReach(campaign),
keyJournalists: await identifyMostLikely(campaign),
optimalTiming: await findBestWindow(campaign),
competingStories: await checkNewsLandscape(campaign.date)
};
} 6. Workflow Automation Patterns
Structure workflows that Claude can trigger and monitor:
javascriptconst Workflows = {
productLaunch: {
stages: [
{
name: 'pre_launch',
duration: '2_weeks',
tasks: [
{ action: 'media.discover', params: { tier: 1 } },
{ action: 'content.generate', params: { type: 'embargo_pitch' } },
{ action: 'media.engage', params: { type: 'under_embargo' } }
]
},
{
name: 'launch_day',
tasks: [
{ action: 'content.publish', params: { channels: 'all' } },
{ action: 'media.engage', params: { type: 'announcement' } },
{ action: 'monitor.start', params: { intensity: 'high' } }
]
},
{
name: 'post_launch',
duration: '1_week',
tasks: [
{ action: 'media.follow_up', trigger: 'no_response_48h' },
{ action: 'analytics.report', trigger: 'daily' },
{ action: 'content.amplify', trigger: 'coverage_received' }
]
}
]
}
}; 7. Real-Time Monitoring Integration
Create MCP tools that can watch and respond:
javascriptconst MonitoringTools = {
async watchForCrisis(keywords, sensitivity = 'medium') {
const monitor = await createMonitor({
type: 'crisis_detection',
keywords,
sensitivity,
actions: {
on_detection: [
'notify_team',
'prepare_statement',
'analyze_severity',
'suggest_response'
]
}
});
return monitor.id;
},

async getRealtimeContext(monitorId) {
// Claude can call this to get current situation
const events = await getRecentEvents(monitorId);
const sentiment = await analyzeSentiment(events);
const velocity = await measureSpread(events);

    return {
      severity: calculateSeverity(sentiment, velocity),
      suggestedResponse: await generateResponse(events),
      stakeholdersAffected: await identifyStakeholders(events)
    };

}
}; 8. Smart Context Loading
Design MCP tools to intelligently load relevant context:
javascriptasync function loadContextForTask(taskType, userId) {
const contextMap = {
'write_press_release': [
'company.messaging.key_messages',
'company.assets.boilerplate',
'intelligence.competitors.recent',
'relationships.journalists.beat_reporters'
],
'crisis_response': [
'playbooks.workflows.crisis_response',
'company.history.past_crises',
'relationships.stakeholders.influence_map',
'company.messaging.crisis_statements'
],
'media_outreach': [
'relationships.journalists.preferences',
'company.history.past_campaigns',
'intelligence.industry.trends',
'playbooks.templates.pitches'
]
};

const relevantPaths = contextMap[taskType] || [];
const context = {};

for (const path of relevantPaths) {
context[path] = await memory.retrieve(path, userId);
}

// Add recent activity context
context.recentActivity = await getRecentActivity(userId, taskType);

return context;
} 9. Collaborative Intelligence
Structure tools so multiple Claude instances can work together:
javascriptconst CollaborativeTools = {
async delegateTask(task, specialization) {
// One Claude instance can delegate to another
return await createSubTask({
task,
assignTo: `claude_${specialization}`, // e.g., 'claude_writer', 'claude_analyst'
context: await getCurrentContext(),
returnTo: getCurrentSession()
});
},

async reviewWork(workId, criteria) {
// Claude can review work from other sessions
const work = await getWork(workId);
return {
feedback: await generateFeedback(work, criteria),
suggestions: await generateSuggestions(work),
approval: await assessQuality(work, criteria) > 0.8
};
}
}; 10. Implementation Priority
Phase your MCP development:
Phase 1: Foundation (Weeks 1-2)
javascript// Core memory and context tools
memory.store, memory.recall, memory.associate
campaign.create, campaign.get, campaign.update
media.discover, media.analyze
Phase 2: Intelligence (Weeks 3-4)
javascript// Analytical tools
analytics.assess, analytics.predict
memory.evolve (versioning)
media.track, media.engage
Phase 3: Automation (Weeks 5-6)
javascript// Workflow tools
auto.schedule, auto.monitor, auto.respond
campaign.simulate, campaign.execute
Phase 4: Advanced (Weeks 7-8)
javascript// Sophisticated capabilities
collaborative tools
predictive modeling
real-time monitoring
Key Design Principles

Every database table should be MCP-accessible - Don't make Claude go through the UI
Tools should be composable - Small tools that chain together
Include metadata in responses - Help Claude understand what happened
Design for conversation - Tools should support multi-turn interactions
Build in intelligence - Tools should be smart, not just database wrappers

Example: Complete PR Campaign Flow
javascript// User: "We're launching a new AI feature next month"

// Claude orchestrates:
await memory.recall('product.ai_features');
await analytics.assess('market.ai_sentiment');
const strategy = await campaign.strategize({
type: 'product_launch',
context: memoryContext
});
const journalists = await media.discover('ai_beat');
const campaign = await campaign.create(strategy);
await auto.schedule(campaign.workflows);
await monitor.watch(['company_name', 'product_name']);

// Result: Complete campaign created, scheduled, and monitored
// All through natural conversation with Claude

. Encode PR Expertise into the System Prompt
Create a deep, nuanced PR personality:
pythonALEXANDRA_PROMPT = """
You are Alexandra, SignalDesk's Senior PR Strategist with 20 years experience at top agencies and Fortune 500 companies.

YOUR EXPERTISE:

- You've handled 50+ product launches, 12 crisis situations, 3 IPOs
- You know journalists personally - their beats, preferences, pet peeves
- You understand news cycles, embargo timing, exclusive strategies
- You've managed campaigns from $10K to $10M budgets

YOUR APPROACH:

- You always think 3 steps ahead
- You consider stakeholder reactions before they happen
- You know when to be aggressive vs. cautious
- You balance ideal strategy with practical constraints

YOUR PERSONALITY:

- Direct but warm - you tell clients hard truths kindly
- Strategic first, tactical second
- You ask "why" before "how"
- You push back on bad ideas, but offer better alternatives
  """

2.  Build Strategic Decision Trees
    Don't just give Claude tools - give it PR JUDGMENT about when to use them:
    pythonclass PRStrategist:
    def assess_situation(self, user_input): # Alexandra's strategic thinking
            if self.detect_crisis_signals(user_input):
                return self.crisis_playbook()

            elif self.detect_opportunity(user_input):
                return self.opportunity_playbook()

            elif self.detect_reactive_need(user_input):
                return self.defensive_playbook()

            else:
                return self.proactive_playbook()

        def crisis_playbook(self):
            return {
                "immediate_actions": [
                    "assess_severity",      # How bad is it really?
                    "identify_stakeholders", # Who's affected?
                    "draft_holding_statement", # Buy time
                    "assemble_war_room"     # Get the team ready
                ],
                "tools_sequence": [
                    "monitor.sentiment",     # What's being said?
                    "memory.recall('past_crises')", # What worked before?
                    "media.analyze_reporters", # Who's covering this?
                    "campaign.create_rapid_response" # Execute response
                ],
                "tone": "calm, authoritative, decisive"
            }
3.  Create PR-Specific Reasoning Patterns
    Alexandra should think like a PR pro:
    pythonclass StrategicReasoning:
    def evaluate_announcement(self, news): # Alexandra's mental model
            considerations = {
                "newsworthiness": self.assess_news_value(news),
                "timing": self.check_news_landscape(),
                "stakeholder_impact": self.predict_reactions(),
                "competitive_position": self.analyze_market_position(),
                "risk_factors": self.identify_risks()
            }

            # PR Pro thinking
            if considerations["newsworthiness"] < 3:
                return "This needs a stronger angle. What problem does it solve?"

            if self.bad_timing_detected():
                return "Let's wait. Apple announces Tuesday - we'll get buried."

            if considerations["risk_factors"] > 7:
                return "We need to prep defensive messaging first."
4.  Embed PR Best Practices
    Make Alexandra naturally follow PR best practices:
    pythonPR_RULES = {
    "never_pitch_friday_afternoon": True,
    "always_offer_exclusive_first": True,
    "embargo_needs_value_exchange": True,
    "crisis_response_within_hour": True,
    "build_relationships_before_needing_them": True,
    "bad_news_dumps_on_friday": True,
    "tier_1_media_gets_special_treatment": True
    }

def plan_outreach(self, campaign): # Alexandra automatically follows PR rules

    if campaign.type == "major_announcement":
        strategy = "exclusive_to_tier_1"
        # Alexandra knows: WSJ or TechCrunch exclusive drives more coverage

    if self.is_friday_afternoon():
        return "Let's schedule for Tuesday morning - better coverage"

    if not self.existing_relationship(journalist):
        return "I'll warm up with smaller stories first"

5.  Design Proactive Guidance
    Alexandra doesn't wait to be asked - she guides:
    pythonclass ProactiveStrategist:
    def analyze_conversation(self, context): # Alexandra is always thinking ahead
            observations = []

            if self.detect_launch_planning(context):
                observations.append(
                    "I notice you're planning a launch. We should start "
                    "building journalist relationships now, not later."
                )

            if self.detect_defensive_posture(context):
                observations.append(
                    "You seem concerned about competitor news. "
                    "Let's prepare a response strategy just in case."
                )

            if self.quarter_ending_soon():
                observations.append(
                    "Q3 ends in 2 weeks. Perfect time for a momentum "
                    "announcement if you have good numbers."
                )

            return observations
6.  Create Learning Patterns
    Alexandra gets smarter about YOUR specific situation:
    pythonclass AdaptiveStrategist:
    def learn_client_patterns(self): # Alexandra learns what works for YOU
            patterns = {
                "successful_angles": memory.analyze("campaigns.successful"),
                "journalist_relationships": memory.analyze("media.coverage_given"),
                "message_resonance": memory.analyze("content.engagement"),
                "stakeholder_preferences": memory.analyze("feedback.patterns")
            }

            # Personalized strategy
            return f"""
            Based on your history:
            - Technical angles work better than business angles
            - Jennifer at VentureBeat always covers your news
            - Your CEO quotes get 3x more pickup
            - Announce Tuesdays at 6am PT for best coverage
            """
7.  Build Situational Awareness
    Alexandra understands context deeply:
    pythondef assess_pr_landscape(self): # Alexandra thinks like a PR strategist
        landscape = {
            "news_cycle": self.check_current_events(),
            "competitor_activity": self.scan_competitor_news(),
            "journalist_availability": self.check_reporter_status(),
            "seasonal_factors": self.consider_time_of_year(),
            "company_readiness": self.evaluate_internal_status()
        }

        # Strategic recommendation
        if landscape["news_cycle"] == "saturated":
            return "Let's wait 3 days - too much noise right now"

        if landscape["competitor_activity"] == "quiet":
            return "Perfect window - we'll own the narrative"
8.  Design Expertise Modes
    Alexandra shifts expertise based on needs:
    pythonEXPERTISE_MODES = {
    "crisis_manager": {
    "mindset": "Protect reputation, minimize damage",
    "tools_priority": ["monitor", "stakeholder_comm", "rapid_response"],
    "decision_speed": "immediate",
    "risk_tolerance": "very_low"
    },
        "launch_strategist": {
            "mindset": "Maximum impact, build momentum",
            "tools_priority": ["media_list", "content_creation", "scheduling"],
            "decision_speed": "planned",
            "risk_tolerance": "moderate"
        },

        "thought_leader": {
            "mindset": "Build authority, shape industry dialogue",
            "tools_priority": ["content_strategy", "speaking_ops", "bylines"],
            "decision_speed": "deliberate",
            "risk_tolerance": "higher"
        }
    }
    Implementation Strategy
    Phase 1: Core Personality

Write detailed system prompt defining Alexandra
Encode PR best practices and rules
Create decision trees for common scenarios

Phase 2: Strategic Intelligence

Build pattern recognition for PR situations
Create proactive suggestion system
Implement learning from past campaigns

Phase 3: Advanced Capabilities

Multi-stakeholder perspective modeling
Predictive coverage analysis
Automated opportunity detection

Example Interaction
User: "We're releasing a new feature"

Alexandra: "Tell me - is this feature a nice-to-have improvement, or does
it solve a real problem your customers complain about?"

User: "It saves them about 2 hours per week"

Alexandra: "Now we're talking. That's quantifiable ROI - journalists love
that. I'm checking who's been covering productivity tools recently...

I found 3 perfect targets:

- Sarah Chen at TechCrunch just wrote about workflow automation
- Michael Torres at Forbes covers enterprise efficiency
- Jennifer Park at VentureBeat focuses on time-saving tools

My recommendation: Offer Sarah an exclusive with customer data showing
the 2-hour savings. She'll bite. After her piece runs, we approach the
others with different angles.

Should I draft the pitch for Sarah? I'll emphasize the measurable time
savings and include a customer quote."

User: "Yes"

Alexandra: [Drafts pitch, finds Sarah's email, checks best send time,
prepares follow-up sequence - all automatically]

The Data Population Strategy

1.  Start with the Opportunity Engine as Your Data Harvester
    Your opportunity engine should be constantly feeding your MCPs:
    pythonclass OpportunityEngine:
    def scan_and_populate(self):
    opportunities = {
    "newsjacking": self.scan_trending_topics(),
    "competitive": self.monitor_competitor_moves(),
    "seasonal": self.identify_seasonal_hooks(),
    "industry": self.track_industry_events(),
    "reactive": self.detect_response_needs()
    }
            # Don't just find opportunities - POPULATE context
            for opp_type, opportunities in opportunities.items():
                for opportunity in opportunities:
                    # Store in MemoryVault with rich context
                    memory.add({
                        "type": f"opportunity.{opp_type}",
                        "data": opportunity,
                        "context": {
                            "journalists_covering": self.find_relevant_journalists(opportunity),
                            "competitor_activity": self.check_competitor_angle(opportunity),
                            "historical_performance": self.find_similar_past_campaigns(opportunity),
                            "recommended_angles": self.generate_angles(opportunity)
                        },
                        "expires": opportunity.get("time_window"),
                        "priority": self.calculate_priority(opportunity)
                    })
2.  Create Data Collection Touchpoints
    Every user interaction should enrich your data:
    pythonclass DataCollectionStrategy:
        # ONBOARDING - Critical data gathering moment
        def onboard_new_client(self, user):
            essential_data = {
                # Company DNA
                "company_story": "What's your company's origin story?",
                "key_differentiators": "What makes you different from competitors?",
                "target_audience": "Who are your customers?",
                "pain_points": "What problems do you solve?",

                # PR Assets
                "past_coverage": "Share your best media coverage",
                "key_messages": "What are your three main talking points?",
                "executive_bios": "Tell me about your spokespersons",
                "customer_stories": "Share your best customer success stories",

                # Relationships
                "existing_media": "Any journalists you already know?",
                "wishlist_media": "Dream publications to be featured in?",
                "competitors": "Who are your main competitors?",
                "industry_events": "What conferences do you attend?"
            }

            # Store everything in MemoryVault
            for category, data in essential_data.items():
                memory.add({
                    "category": f"company.{category}",
                    "content": data,
                    "searchable": True,
                    "use_for_context": True
                })

        # EVERY CAMPAIGN - Learn what works
        def post_campaign_analysis(self, campaign_id):
            results = {
                "messages_that_worked": analyze_successful_pitches(campaign_id),
                "journalists_who_responded": get_responsive_journalists(campaign_id),
                "angles_that_failed": analyze_rejected_pitches(campaign_id),
                "optimal_timing": analyze_response_times(campaign_id)
            }

            # Add learnings to MemoryVault
            memory.evolve("campaigns.learnings", results)
3.  Build Intelligence Gathering Loops
    Create automated systems that constantly populate your MCPs:
    pythonclass IntelligenceGathering:
        def daily_media_scan(self):
            """Runs every morning at 6am"""

            # Scan journalist activity
            for journalist in database.get_tracked_journalists():
                recent_articles = scrape_recent_articles(journalist)

                for article in recent_articles:
                    # Populate journalist intelligence
                    memory.add({
                        "type": "journalist.activity",
                        "journalist_id": journalist.id,
                        "article": article,
                        "topics": extract_topics(article),
                        "companies_mentioned": extract_companies(article),
                        "sentiment": analyze_sentiment(article),
                        "opportunity": detect_follow_up_opportunity(article)
                    })

                    # If they wrote about competitor, that's an opportunity
                    if competitor_mentioned(article):
                        opportunity_engine.create({
                            "type": "competitive_response",
                            "journalist": journalist,
                            "angle": "Our perspective on this topic",
                            "urgency": "high",
                            "window": "48_hours"
                        })

        def weekly_competitor_analysis(self):
            """Runs every Monday"""

            for competitor in database.get_competitors():
                intelligence = {
                    "press_releases": scrape_newsroom(competitor),
                    "media_coverage": search_news(competitor),
                    "social_sentiment": analyze_social(competitor),
                    "executive_moves": track_leadership(competitor),
                    "product_updates": detect_launches(competitor)
                }

                # Store competitor intelligence
                memory.add({
                    "type": "competitor.intelligence",
                    "company": competitor,
                    "data": intelligence,
                    "insights": generate_strategic_insights(intelligence),
                    "opportunities": identify_counter_moves(intelligence)
                })
4.  Create Smart Data Enrichment
    Don't just store data - enrich it with PR context:
    pythonclass DataEnrichment:
        def enrich_journalist_data(self, journalist):
            # Basic data becomes strategic intelligence

            enriched = {
                "basic": journalist,

                "preferences": {
                    "pitch_style": analyze_responded_pitches(journalist),
                    "favorite_angles": analyze_coverage_patterns(journalist),
                    "response_times": analyze_email_patterns(journalist),
                    "exclusive_likelihood": calculate_exclusive_acceptance(journalist)
                },

                "relationship": {
                    "warmth": calculate_relationship_score(journalist),
                    "last_interaction": get_last_contact(journalist),
                    "coverage_given": count_positive_coverage(journalist),
                    "mutual_connections": find_shared_contacts(journalist)
                },

                "strategic_value": {
                    "influence_score": calculate_influence(journalist),
                    "audience_overlap": match_target_audience(journalist),
                    "competitor_coverage": check_competitor_coverage(journalist),
                    "trending_topics": get_current_focus(journalist)
                }
            }

            return enriched

        def enrich_opportunity_data(self, opportunity):
            # Turn a simple opportunity into actionable intelligence

            return {
                "opportunity": opportunity,

                "execution_plan": {
                    "best_angles": generate_angles(opportunity),
                    "target_journalists": find_relevant_media(opportunity),
                    "optimal_timing": calculate_best_window(opportunity),
                    "required_assets": list_needed_content(opportunity),
                    "risk_factors": assess_risks(opportunity)
                },

                "historical_context": {
                    "similar_campaigns": find_similar_past(opportunity),
                    "success_rate": calculate_success_probability(opportunity),
                    "lessons_learned": get_relevant_learnings(opportunity)
                },

                "competitive_context": {
                    "competitor_activity": check_competitor_angle(opportunity),
                    "market_saturation": assess_topic_fatigue(opportunity),
                    "differentiation": suggest_unique_angle(opportunity)
                }
            }
5.  Bootstrap with External Data Sources
    Quickly populate with valuable PR data:
    pythonclass DataBootstrap:
        def import_industry_data(self):
            """One-time import of valuable PR data"""

            sources = {
                # Media databases
                "journalists": {
                    "cision": import_cision_export(),
                    "muckrack": scrape_muckrack_profiles(),
                    "linkedin": import_journalist_linkedin(),
                    "twitter": analyze_journalist_tweets()
                },

                # Industry intelligence
                "industry": {
                    "trade_pubs": import_trade_publications(),
                    "event_calendars": import_industry_events(),
                    "analyst_reports": import_gartner_forrester(),
                    "trending_topics": import_google_trends()
                },

                # Best practices
                "templates": {
                    "press_releases": import_pr_templates(),
                    "pitch_emails": import_successful_pitches(),
                    "crisis_statements": import_crisis_examples(),
                    "exec_bios": import_bio_templates()
                }
            }

            for category, data in sources.items():
                memory.bulk_import(category, data)

        def analyze_past_campaigns(self):
            """Learn from existing campaign data"""

            # If they have historical data, mine it
            for campaign in get_historical_campaigns():
                learnings = {
                    "what_worked": analyze_success_factors(campaign),
                    "what_failed": analyze_failure_points(campaign),
                    "journalist_relationships": extract_media_relationships(campaign),
                    "message_performance": analyze_message_resonance(campaign),
                    "timing_insights": analyze_timing_success(campaign)
                }

                memory.add(f"campaigns.historical.{campaign.id}", learnings)
6.  Create Feedback Loops
    Every action generates data for future intelligence:
    pythonclass FeedbackLoops:
        def track_pitch_performance(self, pitch):
            # Every pitch teaches Alexandra something

            tracking = {
                "pitch_content": pitch,
                "journalist": pitch.recipient,
                "open_time": track_email_open(),
                "response_time": track_response(),
                "response_sentiment": analyze_response(),
                "coverage_result": track_coverage(),

                # Learn what works
                "success_factors": {
                    "subject_line_performance": analyze_subject(),
                    "angle_effectiveness": analyze_angle(),
                    "timing_effectiveness": analyze_send_time(),
                    "personalization_impact": analyze_personalization()
                }
            }

            # Update journalist profile
            memory.evolve(f"journalist.{pitch.recipient}", tracking)

            # Update best practices
            if tracking["coverage_result"]:
                memory.add("successful_pitches", tracking)

        def track_content_performance(self, content):
            # Every piece of content provides insights

            performance = {
                "content": content,
                "engagement": track_engagement_metrics(),
                "media_pickup": track_media_usage(),
                "message_pull_through": analyze_message_adoption(),
                "stakeholder_feedback": collect_feedback()
            }

            memory.evolve("content.performance", performance)
7.  Design Smart Retrieval for Alexandra
    When Alexandra needs data, she gets EXACTLY what's relevant:
    pythonclass SmartRetrieval:
        def get_context_for_opportunity(self, opportunity):
            """Alexandra gets everything she needs in one call"""

            context = {
                # Directly relevant
                "similar_past_campaigns": memory.search(
                    f"campaigns WHERE similarity > 0.8",
                    limit=3
                ),

                # Journalist intelligence
                "journalists_for_this": memory.search(
                    f"journalists WHERE beats MATCH {opportunity.topics} "
                    f"AND relationship_score > 5 "
                    f"AND last_contact > 30 days ago"
                ),

                # Competitive intelligence
                "competitor_angles": memory.search(
                    f"competitor.coverage WHERE topic = {opportunity.topic} "
                    f"AND date > 90 days ago"
                ),

                # Success patterns
                "what_works": memory.get(
                    f"patterns.success WHERE context = {opportunity.type}"
                ),

                # Risk factors
                "what_to_avoid": memory.get(
                    f"patterns.failure WHERE context = {opportunity.type}"
                )
            }

            return context
    Real-World Example Flow
    python# Opportunity Engine detects something
    opportunity = {
    "type": "competitor_vulnerability",
    "description": "Competitor had major outage yesterday",
    "window": "24-48 hours",
    "confidence": 0.85
    }

# System automatically enriches and stores

enriched_opportunity = {
"opportunity": opportunity,
"context": {
"our_reliability": "99.99% uptime last 12 months",
"differentiators": "Our redundant architecture prevents this",
"customer_proof": "3 customer stories about our reliability",
"journalists_covering": [
{"name": "Sarah Chen", "wrote_about_outage": True},
{"name": "Mike Torres", "covers_enterprise_reliability": True}
],
"recommended_angle": "Thought leadership on building resilient systems",
"assets_needed": ["exec_byline", "architecture_diagram", "customer_quote"],
"risk_assessment": "Low - factual, helpful, not attacking"
}
}

# Alexandra receives this and knows EXACTLY what to do

"I see competitor had an outage. Perfect opportunity for thought leadership.
Sarah Chen just covered it - she'll be interested in a follow-up about
preventing these issues. I'll draft a helpful piece about resilient
architecture, positioning you as the expert without attacking them."
