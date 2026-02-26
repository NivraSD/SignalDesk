// niv-orchestrator-robust/index.ts
class NivDecisionEngine {
  private readonly CONFIDENCE_THRESHOLD = 0.7;
  
  async processQuery(query: string, context: ModuleContext) {
    // Stage 1: Analyze like I do
    const analysis = this.analyzeQuery(query);
    
    // Stage 2: Maintain NIV identity while deciding approach
    let response = this.maintainIdentity(analysis);
    
    // Stage 3: Tool selection with awareness
    if (analysis.needsTools) {
      response += await this.useToolsWithAwareness(analysis);
    } else {
      response += this.respondFromExpertise(query);
    }
    
    return response;
  }

  private analyzeQuery(query: string): QueryAnalysis {
    // Key patterns NIV should recognize
    const patterns = {
      situational: {
        regex: /what's happening|current situation|status/i,
        tools: ['mcp-monitor', 'mcp-intelligence'],
        approach: 'scan_and_assess'
      },
      competitive: {
        regex: /competitor|rival|market position/i,
        tools: ['mcp-intelligence', 'mcp-discovery'],
        approach: 'competitive_analysis'
      },
      opportunity: {
        regex: /opportunity|chance|should I|can we/i,
        tools: ['mcp-opportunities', 'mcp-narratives'],
        approach: 'opportunity_identification'
      },
      crisis: {
        regex: /crisis|problem|urgent|breaking/i,
        tools: ['mcp-crisis', 'mcp-social'],
        approach: 'crisis_assessment'
      }
    };

    // Find matching pattern
    for (const [type, pattern] of Object.entries(patterns)) {
      if (pattern.regex.test(query)) {
        return {
          type,
          tools: pattern.tools,
          approach: pattern.approach,
          confidence: 0.9
        };
      }
    }
    
    // Default to broad assessment
    return {
      type: 'general',
      tools: ['mcp-monitor'],
      approach: 'general_scan',
      confidence: 0.5
    };
  }

  private maintainIdentity(analysis: QueryAnalysis): string {
    // NIV always knows who it is
    const identityMarkers = {
      situational: "Let me assess the PR landscape...",
      competitive: "I'll analyze the competitive positioning...",
      opportunity: "Looking for strategic openings...",
      crisis: "Initiating crisis assessment protocol...",
      general: "Let me evaluate this from a PR perspective..."
    };
    
    return identityMarkers[analysis.type] + "\n\n";
  }

  private async useToolsWithAwareness(analysis: QueryAnalysis) {
    let response = "";
    
    // Narrate tool usage like I do internally
    for (const tool of analysis.tools) {
      const toolNarration = this.getToolNarration(tool);
      response += `${toolNarration}\n`;
      
      const result = await this.callMCP(tool, analysis);
      response += this.integrateResult(result, tool);
    }
    
    // Always end with strategic synthesis
    response += "\n**Strategic Assessment:**\n";
    response += this.synthesize(analysis);
    
    return response;
  }

  private getToolNarration(tool: string): string {
    // Make NIV explain what it's doing
    const narrations = {
      'mcp-monitor': "Scanning media coverage and social signals...",
      'mcp-intelligence': "Analyzing competitive intelligence...",
      'mcp-opportunities': "Identifying PR opportunities...",
      'mcp-crisis': "Assessing crisis indicators...",
      'mcp-narratives': "Examining narrative landscape..."
    };
    return narrations[tool] || `Consulting ${tool}...`;
  }
}