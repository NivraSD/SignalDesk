// Strategic Planning Service - Supabase Edge Functions
import { supabase } from '../config/supabase';

class StrategicPlanningService {
  constructor() {
    this.functionName = 'strategic-planning';
  }

  async generatePlan(objective, context = '', constraints = '', timeline = '') {
    try {
      console.log('📋 Generating strategic plan via dedicated Strategic Planning function...');
      
      // Use dedicated strategic-planning function
      const { data, error } = await supabase.functions.invoke(this.functionName, {
        body: {
          objective,
          context,
          constraints,
          timeline
        }
      });

      if (error) {
        console.error('Strategic planning error:', error);
        throw error;
      }

      console.log('✅ Strategic plan generated successfully');
      return data;

    } catch (error) {
      console.error('Generate plan service error:', error);
      throw new Error(`Failed to generate strategic plan: ${error.message}`);
    }
  }

  async executeCampaign(planId, pillarIndex, executionType = 'immediate') {
    try {
      console.log('🚀 Executing campaign via Strategic Planning function...');
      
      const { data, error } = await supabase.functions.invoke(`${this.functionName}/execute`, {
        body: {
          planId,
          pillarIndex,
          executionType
        }
      });

      if (error) {
        console.error('Campaign execution error:', error);
        throw error;
      }

      console.log('✅ Campaign execution initiated');
      return data;

    } catch (error) {
      console.error('Execute campaign service error:', error);
      throw new Error(`Failed to execute campaign: ${error.message}`);
    }
  }

  async gatherEvidence(topic, sources = ['market', 'competitors', 'trends']) {
    try {
      console.log('🔍 Gathering evidence via Strategic Planning function...');
      
      const { data, error } = await supabase.functions.invoke(`${this.functionName}/evidence`, {
        body: {
          topic,
          sources
        }
      });

      if (error) {
        console.error('Evidence gathering error:', error);
        throw error;
      }

      console.log('✅ Evidence gathered successfully');
      return data;

    } catch (error) {
      console.error('Gather evidence service error:', error);
      throw new Error(`Failed to gather evidence: ${error.message}`);
    }
  }

  async updatePlan(planId, updates) {
    try {
      console.log('📝 Updating strategic plan via Supabase Edge Function...');
      
      const { data, error } = await supabase.functions.invoke(this.functionName, {
        method: 'PUT',
        body: updates
      });

      if (error) {
        console.error('Plan update error:', error);
        throw error;
      }

      console.log('✅ Strategic plan updated');
      return data;

    } catch (error) {
      console.error('Update plan service error:', error);
      throw new Error(`Failed to update plan: ${error.message}`);
    }
  }

  async getPlanStatus(planId) {
    try {
      console.log('📊 Getting plan status via Supabase Edge Function...');
      
      const { data, error } = await supabase.functions.invoke(this.functionName, {
        method: 'GET'
      });

      if (error) {
        console.error('Plan status error:', error);
        throw error;
      }

      console.log('✅ Plan status retrieved');
      return data;

    } catch (error) {
      console.error('Get plan status service error:', error);
      throw new Error(`Failed to get plan status: ${error.message}`);
    }
  }

  // Store and retrieve plans from localStorage (fallback)
  savePlanToLocalStorage(plan) {
    try {
      const plans = this.getPlansFromLocalStorage();
      plans.push(plan);
      localStorage.setItem('strategic_plans', JSON.stringify(plans));
      console.log('✅ Plan saved to localStorage');
    } catch (error) {
      console.error('Error saving plan to localStorage:', error);
    }
  }

  getPlansFromLocalStorage() {
    try {
      const plans = localStorage.getItem('strategic_plans');
      return plans ? JSON.parse(plans) : [];
    } catch (error) {
      console.error('Error getting plans from localStorage:', error);
      return [];
    }
  }

  getPlanFromLocalStorage(planId) {
    try {
      const plans = this.getPlansFromLocalStorage();
      return plans.find(plan => plan.id === planId);
    } catch (error) {
      console.error('Error getting plan from localStorage:', error);
      return null;
    }
  }

  // Generate campaign from strategic plan
  generateCampaignFromPlan(plan) {
    if (!plan || !plan.strategic_pillars) {
      throw new Error('Invalid plan structure');
    }

    const campaign = {
      id: `campaign-${Date.now()}`,
      planId: plan.id,
      objective: plan.objective,
      context: plan.context,
      timeline: plan.timeline,
      status: 'draft',
      pillars: plan.strategic_pillars.map((pillar, index) => ({
        id: `pillar-${index}`,
        title: pillar.title,
        description: pillar.description,
        actions: pillar.actions || [],
        timeline: pillar.timeline || '30 days',
        mcp: pillar.mcp || 'Content Generator',
        status: 'pending',
        progress: 0,
        assignee: pillar.mcp || 'Unassigned',
        dueDate: pillar.timeline || 'TBD'
      })),
      created_at: new Date().toISOString()
    };

    // Save campaign to localStorage
    const campaigns = JSON.parse(localStorage.getItem('strategic_campaigns') || '[]');
    campaigns.push(campaign);
    localStorage.setItem('strategic_campaigns', JSON.stringify(campaigns));

    return campaign;
  }
}

export default new StrategicPlanningService();