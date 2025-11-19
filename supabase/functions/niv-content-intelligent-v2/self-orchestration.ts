// NIV Self-Orchestration Module
// Enables NIV to decompose complex queries and execute multi-step research autonomously
// Decompose a complex query into research steps
export async function decomposeQuery(userQuery, context, claudeApiKey) {
  // Get current date for temporal context
  const now = new Date();
  const currentDate = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const currentYear = now.getFullYear();
  const currentMonth = now.toLocaleDateString('en-US', {
    month: 'long'
  });
  const DECOMPOSITION_PROMPT = `You are NIV's query decomposition system.
Break down this complex request into specific research steps.

**CRITICAL - CURRENT DATE CONTEXT:**
Today is ${currentDate}
Current Year: ${currentYear}
Current Month: ${currentMonth} ${currentYear}

User Query: ${userQuery}
Current Context: We're researching for ${context.organizationId || 'a client'}

Analyze the query and create a research plan with:
1. Sequential steps for information that builds on previous findings
2. Parallel steps for independent research threads
3. Validation steps to verify critical information
4. Synthesis step to combine all findings

Consider:
- What information do we need first?
- What can be researched simultaneously?
- What needs validation from multiple sources?
- What competitive intelligence would be valuable?

**IMPORTANT - TEMPORAL CONTEXT IN SEARCH QUERIES:**
- For "recent" information: Use "last 2 weeks" or "last month" for specificity
- For "latest" queries: Include timeframe like "past 14 days" or "Q4 ${currentYear}"
- ALWAYS include "${currentYear}" to avoid old results from 2024/2023
- DON'T just search for "announcements" - tech news breaks via leaks, rumors, previews, API changes
- Example GOOD: "Gemini 3 leak rumor development last 2 weeks ${currentYear}"
- Example GOOD: "OpenAI regulatory changes past 30 days ${currentYear}"
- Example BAD: "Gemini 3 announcement ${currentMonth} ${currentYear}" (too formal, misses leaks)
- Example BAD: "OpenAI compliance ${currentYear}" (too broad, not specific timeframe)

Return a structured plan with specific queries for each step.`;
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20241022',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: `${DECOMPOSITION_PROMPT}

Respond with a JSON object:
{
  "objective": "Clear statement of what we're trying to achieve",
  "steps": [
    {
      "id": "step-1",
      "type": "initial-scan",
      "query": "Specific search query",
      "priority": "high",
      "dependencies": []
    },
    {
      "id": "step-2",
      "type": "competitor-analysis",
      "query": "Competitor research query",
      "priority": "high",
      "dependencies": ["step-1"]
    }
  ],
  "canParallelize": true,
  "estimatedDuration": "5-10 minutes",
  "informationGaps": ["What we might be missing"]
}`
          }
        ]
      })
    });
    if (response.ok) {
      const data = await response.json();
      const planText = data.content[0].text;
      // Extract JSON from response
      const jsonMatch = planText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const plan = JSON.parse(jsonMatch[0]);
        // Add status to each step
        plan.steps = plan.steps.map((step)=>({
            ...step,
            status: 'pending'
          }));
        return {
          originalQuery: userQuery,
          ...plan
        };
      }
    }
  } catch (error) {
    console.error('Query decomposition failed:', error);
  }
  // Fallback: single-step research
  return {
    originalQuery: userQuery,
    objective: userQuery,
    steps: [
      {
        id: 'step-1',
        type: 'initial-scan',
        query: userQuery,
        priority: 'high',
        status: 'pending',
        dependencies: []
      }
    ],
    canParallelize: false,
    estimatedDuration: '2-5 minutes'
  };
}
// Detect information gaps and generate self-queries
export async function detectInformationGaps(currentResearch, userObjective, claudeApiKey) {
  const GAP_DETECTION_PROMPT = `You are NIV's information gap detector.
Analyze what information we still need to fully address the user's objective.

User Objective: ${userObjective}

Current Research Collected:
${JSON.stringify(currentResearch, null, 2).substring(0, 3000)}

Identify:
1. Critical missing information that prevents us from achieving the objective
2. Areas where we need deeper investigation
3. Assumptions that need validation
4. Competitive intelligence we should gather
5. Related topics that would strengthen our analysis

For each gap, provide a specific follow-up query to fill it.`;
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20241022',
        max_tokens: 800,
        messages: [
          {
            role: 'user',
            content: `${GAP_DETECTION_PROMPT}

Respond with a JSON array of self-queries:
[
  {
    "type": "missing-info",
    "topic": "What's missing",
    "rationale": "Why we need this",
    "priority": "critical",
    "query": "Specific search query to fill this gap"
  }
]

If no gaps exist, return an empty array: []`
          }
        ]
      })
    });
    if (response.ok) {
      const data = await response.json();
      const gapsText = data.content[0].text;
      // Extract JSON array from response
      const jsonMatch = gapsText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    }
  } catch (error) {
    console.error('Gap detection failed:', error);
  }
  return [];
}
// Execute a research step
export async function executeResearchStep(step, tools) {
  console.log(`🔍 Executing research step: ${step.type} - ${step.query}`);
  step.status = 'in-progress';
  try {
    let results = null;
    // Route to appropriate research method based on step type
    switch(step.type){
      case 'initial-scan':
      case 'deep-dive':
        // Prefer FireSearch for validated, cited research
        if (tools.firesearch) {
          console.log(`🔬 Using FireSearch for ${step.type}`);
          results = await tools.firesearch(step.query);
        } else if (tools.fireplexity) {
          console.log(`🔍 Fallback to fireplexity for ${step.type}`);
          results = await tools.fireplexity(step.query);
        }
        break;
      case 'competitor-analysis':
        if (tools.intelligencePipeline) {
          results = await tools.intelligencePipeline(`competitor analysis ${step.query}`);
        }
        break;
      case 'validation':
        // Use multiple sources for validation - prefer FireSearch
        if (tools.firesearch) {
          const source1 = await tools.firesearch(step.query);
          const source2 = await tools.intelligencePipeline?.(step.query);
          results = {
            source1,
            source2
          };
        } else if (tools.fireplexity) {
          const source1 = await tools.fireplexity(step.query);
          const source2 = await tools.intelligencePipeline?.(step.query);
          results = {
            source1,
            source2
          };
        }
        break;
      case 'synthesis':
        // Synthesis doesn't need external research
        results = {
          type: 'synthesis',
          query: step.query
        };
        break;
    }
    step.results = results;
    step.status = 'completed';
    // Extract key insights
    if (results) {
      step.insights = extractKeyInsights(results);
    }
  } catch (error) {
    console.error(`Failed to execute step ${step.id}:`, error);
    step.status = 'failed';
  }
  return step;
}
// Extract key insights from research results
function extractKeyInsights(results) {
  const insights = [];
  // Extract from articles
  if (results.articles && Array.isArray(results.articles)) {
    results.articles.slice(0, 3).forEach((article)=>{
      if (article.summary) {
        insights.push(article.summary.substring(0, 150));
      }
    });
  }
  // Extract from synthesis
  if (results.synthesis) {
    insights.push(results.synthesis.substring(0, 200));
  }
  // Extract from research data (FireSearch or fireplexity)
  if (results.data && Array.isArray(results.data)) {
    results.data.slice(0, 2).forEach((item)=>{
      if (item.snippet) {
        insights.push(item.snippet.substring(0, 150));
      }
      if (item.content) {
        insights.push(item.content.substring(0, 150));
      }
    });
  }
  return insights;
}
// Orchestrate the complete research workflow
export async function orchestrateResearch(plan, tools, onStepComplete) {
  const completedSteps = [];
  const aggregatedResults = {};
  const keyFindings = [];
  // Group steps by dependencies for parallel execution
  const stepsByDependencyLevel = groupStepsByDependencies(plan.steps);
  // Execute each level of steps
  for (const level of stepsByDependencyLevel){
    if (plan.canParallelize && level.length > 1) {
      // Execute steps in parallel
      console.log(`🚀 Executing ${level.length} steps in parallel`);
      const promises = level.map((step)=>executeResearchStep(step, tools));
      const results = await Promise.all(promises);
      results.forEach((step)=>{
        completedSteps.push(step);
        aggregatedResults[step.id] = step.results;
        if (step.insights) {
          keyFindings.push(...step.insights);
        }
        onStepComplete?.(step);
      });
    } else {
      // Execute steps sequentially
      for (const step of level){
        const completed = await executeResearchStep(step, tools);
        completedSteps.push(completed);
        aggregatedResults[completed.id] = completed.results;
        if (completed.insights) {
          keyFindings.push(...completed.insights);
        }
        onStepComplete?.(completed);
      }
    }
  }
  return {
    completedSteps,
    aggregatedResults,
    keyFindings: [
      ...new Set(keyFindings)
    ] // Remove duplicates
  };
}
// Group steps by dependency level for parallel execution
function groupStepsByDependencies(steps) {
  const levels = [];
  const completed = new Set();
  while(completed.size < steps.length){
    const currentLevel = steps.filter((step)=>{
      // Skip if already completed
      if (completed.has(step.id)) return false;
      // Check if all dependencies are completed
      return step.dependencies.every((dep)=>completed.has(dep));
    });
    if (currentLevel.length === 0) {
      console.warn('Circular dependency detected or invalid dependencies');
      break;
    }
    levels.push(currentLevel);
    currentLevel.forEach((step)=>completed.add(step.id));
  }
  return levels;
}
// Self-messaging queue for autonomous research
export class SelfMessagingQueue {
  tools;
  claudeApiKey;
  queue;
  processing;
  context;
  constructor(tools, claudeApiKey){
    this.tools = tools;
    this.claudeApiKey = claudeApiKey;
    this.queue = [];
    this.processing = false;
    this.context = {};
  }
  async addQuery(trigger) {
    this.queue.push(trigger);
    if (!this.processing) {
      await this.processQueue();
    }
  }
  async processQueue() {
    this.processing = true;
    while(this.queue.length > 0){
      const trigger = this.queue.shift();
      console.log(`🤖 Self-query: ${trigger.type} - ${trigger.query}`);
      // Execute the self-query
      const step = {
        id: `self-${Date.now()}`,
        type: trigger.type === 'competitive-intel' ? 'competitor-analysis' : 'deep-dive',
        query: trigger.query,
        priority: trigger.priority === 'critical' ? 'high' : trigger.priority,
        status: 'pending',
        dependencies: []
      };
      const result = await executeResearchStep(step, this.tools);
      // Add to context
      this.context[trigger.topic] = result.results;
      // Check if this reveals new gaps
      if (trigger.priority === 'critical' || trigger.priority === 'high') {
        const newGaps = await detectInformationGaps(this.context, trigger.query, this.claudeApiKey);
        // Add new high-priority gaps to queue
        const criticalGaps = newGaps.filter((g)=>g.priority === 'critical' || g.priority === 'high');
        if (criticalGaps.length > 0) {
          console.log(`🔍 Found ${criticalGaps.length} new information gaps`);
          this.queue.push(...criticalGaps);
        }
      }
    }
    this.processing = false;
  }
  getContext() {
    return this.context;
  }
}
