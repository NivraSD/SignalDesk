/**
 * Opportunity Engine Service
 * Manages opportunity data flow from intelligence pipeline
 */

import { saveToLocalStorage, loadFromLocalStorage } from '../utils/localStorage';

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

class OpportunityEngineService {
  constructor() {
    this.baseUrl = `${SUPABASE_URL}/functions/v1`;
    this.headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_KEY}`
    };
  }

  /**
   * Extract opportunities from pipeline results
   */
  extractOpportunitiesFromPipeline(pipelineResults) {
    console.log('🎯 Extracting opportunities from pipeline results');
    
    const opportunities = {
      fromStage2Media: [],
      fromStage3Regulatory: [],
      fromStage4Trends: [],
      fromStage5Synthesis: [],
      consolidated: []
    };

    try {
      // Extract from Stage 2 - Media
      if (pipelineResults?.stages?.media?.data?.opportunities) {
        opportunities.fromStage2Media = pipelineResults.stages.media.data.opportunities;
        console.log(`📰 Found ${opportunities.fromStage2Media.length} media opportunities`);
      }

      // Extract from Stage 3 - Regulatory
      if (pipelineResults?.stages?.regulatory?.data?.risks_and_opportunities?.opportunities) {
        opportunities.fromStage3Regulatory = pipelineResults.stages.regulatory.data.risks_and_opportunities.opportunities;
        console.log(`⚖️ Found ${opportunities.fromStage3Regulatory.length} regulatory opportunities`);
      }

      // Extract from Stage 4 - Trends
      if (pipelineResults?.stages?.trends?.data?.pr_opportunities) {
        opportunities.fromStage4Trends = pipelineResults.stages.trends.data.pr_opportunities;
        console.log(`📈 Found ${opportunities.fromStage4Trends.length} trend opportunities`);
      }

      // Extract from Stage 5 - Synthesis (consolidated)
      if (pipelineResults?.stages?.synthesis?.data?.consolidated_opportunities?.prioritized_list) {
        opportunities.fromStage5Synthesis = pipelineResults.stages.synthesis.data.consolidated_opportunities.prioritized_list;
        console.log(`🧩 Found ${opportunities.fromStage5Synthesis.length} synthesized opportunities`);
        opportunities.consolidated = opportunities.fromStage5Synthesis;
      }

      // If no synthesis, manually consolidate
      if (opportunities.consolidated.length === 0) {
        opportunities.consolidated = this.consolidateOpportunities(
          opportunities.fromStage2Media,
          opportunities.fromStage3Regulatory,
          opportunities.fromStage4Trends
        );
      }

      console.log(`✅ Total opportunities extracted: ${opportunities.consolidated.length}`);
      
      // DISABLED: No localStorage - Supabase is single source of truth
      // saveToLocalStorage('pipeline_opportunities', opportunities);
      
    } catch (error) {
      console.error('Error extracting opportunities:', error);
    }

    return opportunities;
  }

  /**
   * Manually consolidate opportunities from different stages
   */
  consolidateOpportunities(media = [], regulatory = [], trends = []) {
    const consolidated = [];
    
    // Add media opportunities
    media.forEach(opp => {
      consolidated.push({
        ...opp,
        source_stage: 'media',
        type: opp.type || 'media_opportunity',
        urgency: this.normalizeUrgency(opp.urgency || opp.timing),
        confidence: opp.confidence || 70
      });
    });

    // Add regulatory opportunities
    regulatory.forEach(opp => {
      consolidated.push({
        ...opp,
        source_stage: 'regulatory',
        type: opp.type || 'regulatory_opportunity',
        urgency: this.normalizeUrgency(opp.timeline),
        confidence: opp.confidence || 75
      });
    });

    // Add trend opportunities
    trends.forEach(opp => {
      consolidated.push({
        ...opp,
        source_stage: 'trends',
        type: opp.type || 'trend_opportunity',
        urgency: this.normalizeUrgency(opp.urgency || opp.timing),
        confidence: opp.confidence || opp.confidence_score || 65
      });
    });

    // Sort by urgency and confidence
    return consolidated.sort((a, b) => {
      const urgencyWeight = { 'URGENT': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
      const aScore = (urgencyWeight[a.urgency] || 1) * (a.confidence / 100);
      const bScore = (urgencyWeight[b.urgency] || 1) * (b.confidence / 100);
      return bScore - aScore;
    });
  }

  /**
   * Normalize urgency levels across different stages
   */
  normalizeUrgency(urgency) {
    if (!urgency) return 'MEDIUM';
    
    const urgent = ['immediate', 'urgent', 'critical', '24h', '24 hours', '48h', '48 hours'];
    const high = ['high', 'this week', '1 week', '7 days'];
    const medium = ['medium', 'this month', '2 weeks', '1 month'];
    const low = ['low', 'strategic', 'long-term', '3 months'];
    
    const lowerUrgency = urgency.toString().toLowerCase();
    
    if (urgent.some(term => lowerUrgency.includes(term))) return 'URGENT';
    if (high.some(term => lowerUrgency.includes(term))) return 'HIGH';
    if (medium.some(term => lowerUrgency.includes(term))) return 'MEDIUM';
    if (low.some(term => lowerUrgency.includes(term))) return 'LOW';
    
    return 'MEDIUM';
  }

  /**
   * Enhance opportunities with Claude (async)
   */
  async enhanceOpportunities(opportunities, organization, synthesisData = null) {
    console.log('🚀 Enhancing opportunities with Claude...');
    
    try {
      const response = await fetch(`${this.baseUrl}/opportunity-enhancer`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          organization,
          consolidated_opportunities: opportunities,
          intelligence_context: synthesisData
        })
      });

      if (!response.ok) {
        throw new Error(`Enhancement failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`✅ Opportunities enhanced successfully`);
      
      // DISABLED: No localStorage - Supabase is single source of truth
      // saveToLocalStorage('enhanced_opportunities', result.opportunities);
      
      return result.opportunities;
      
    } catch (error) {
      console.error('Error enhancing opportunities:', error);
      // Return original opportunities if enhancement fails
      return opportunities;
    }
  }

  /**
   * Generate execution package for an opportunity
   */
  async generateExecutionPackage(opportunity, organization) {
    console.log('📦 Generating execution package...');
    
    try {
      const response = await fetch(`${this.baseUrl}/opportunity-executor`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ opportunity, organization })
      });

      if (!response.ok) {
        throw new Error(`Execution package generation failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`✅ Execution package generated`);
      
      return result.execution_package;
      
    } catch (error) {
      console.error('Error generating execution package:', error);
      return null;
    }
  }

  /**
   * Get cached opportunities
   */
  getCachedOpportunities() {
    // DISABLED: No localStorage - Supabase is single source of truth
    // const pipelineOpps = loadFromLocalStorage('pipeline_opportunities');
    // const enhancedOpps = loadFromLocalStorage('enhanced_opportunities');
    const pipelineOpps = null;
    const enhancedOpps = null;
    
    return {
      pipeline: pipelineOpps,
      enhanced: enhancedOpps,
      hasEnhanced: !!enhancedOpps,
      lastUpdated: pipelineOpps?._timestamp || enhancedOpps?._timestamp
    };
  }

  /**
   * Clear opportunity cache
   */
  clearCache() {
    localStorage.removeItem('pipeline_opportunities');
    localStorage.removeItem('enhanced_opportunities');
    console.log('🧹 Opportunity cache cleared');
  }
}

export default new OpportunityEngineService();