// Strategic Planning Service - Supabase Edge Functions
import { supabase } from '../config/supabase';

class StrategicPlanningService {
  constructor() {
    this.functionName = 'strategic-planning';
  }

  async generatePlan(objective, context = '', constraints = '', timeline = '') {
    try {
      console.log('📋 Generating strategic plan via dedicated Strategic Planning function...');
      
      // Try Supabase Edge Function first
      try {
        const { data, error } = await supabase.functions.invoke(this.functionName, {
          body: {
            objective,
            context,
            constraints,
            timeline
          }
        });

        if (data && !error) {
          console.log('✅ Strategic plan generated successfully via Supabase');
          return data;
        }
      } catch (supabaseError) {
        console.warn('Supabase function failed, using fallback:', supabaseError);
      }

      // Fallback: Generate strategic plan locally
      console.log('📋 Using local fallback for strategic plan generation...');
      const plan = this.generateFallbackPlan(objective, context, constraints, timeline);
      
      console.log('✅ Strategic plan generated successfully via fallback');
      return { success: true, data: plan };

    } catch (error) {
      console.error('Generate plan service error:', error);
      throw new Error(`Failed to generate strategic plan: ${error.message}`);
    }
  }

  async executeCampaign(planId, pillarIndex, executionType = 'immediate') {
    try {
      console.log('🚀 Executing campaign via Strategic Planning function...');
      
      const { data, error } = await supabase.functions.invoke(`${this.functionName}/execute-campaign`, {
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
      
      const { data, error } = await supabase.functions.invoke(`${this.functionName}/gather-evidence`, {
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

  // Fallback strategic plan generator
  generateFallbackPlan(objective, context, constraints, timeline) {
    const plan = {
      id: `plan-${Date.now()}`,
      objective,
      context,
      constraints,
      timeline,
      created_at: new Date().toISOString(),
      status: 'draft',
      executive_summary: `Strategic plan to ${objective}. ${context ? 'Context: ' + context : ''} This comprehensive approach will address key objectives through coordinated strategic pillars and measurable outcomes.`,
      strategic_pillars: [
        {
          title: 'Strategic Foundation',
          description: 'Establish the foundational elements required to achieve the objective',
          actions: [
            'Conduct stakeholder analysis',
            'Define success criteria',
            'Establish baseline metrics',
            'Create communication framework'
          ],
          timeline: timeline || '4-6 weeks',
          mcp: 'Intelligence MCP'
        },
        {
          title: 'Content & Messaging',
          description: 'Develop compelling content and messaging strategy',
          actions: [
            'Create core messaging framework',
            'Develop content calendar',
            'Produce strategic content assets',
            'Align messaging across channels'
          ],
          timeline: timeline || '3-4 weeks',
          mcp: 'Content Generator'
        },
        {
          title: 'Media & Outreach',
          description: 'Execute targeted media and stakeholder outreach',
          actions: [
            'Identify key media targets',
            'Develop media relations strategy',
            'Execute outreach campaigns',
            'Monitor media coverage'
          ],
          timeline: timeline || '6-8 weeks',
          mcp: 'Media Intelligence'
        },
        {
          title: 'Monitoring & Optimization',
          description: 'Track performance and optimize strategy based on results',
          actions: [
            'Implement tracking systems',
            'Monitor key metrics',
            'Analyze performance data',
            'Optimize strategy based on insights'
          ],
          timeline: timeline || 'Ongoing',
          mcp: 'Analytics MCP'
        }
      ],
      implementation_phases: [
        {
          phase: 'Planning & Preparation',
          duration: '2 weeks',
          tasks: ['Strategic research', 'Stakeholder mapping', 'Resource allocation']
        },
        {
          phase: 'Content Development',
          duration: '3 weeks',
          tasks: ['Content creation', 'Message testing', 'Asset production']
        },
        {
          phase: 'Launch & Execution',
          duration: '4 weeks',
          tasks: ['Campaign launch', 'Media outreach', 'Stakeholder engagement']
        },
        {
          phase: 'Optimization & Scale',
          duration: '3 weeks',
          tasks: ['Performance analysis', 'Strategy refinement', 'Scaling successful tactics']
        }
      ],
      success_metrics: [
        'Media mention volume and sentiment',
        'Stakeholder engagement rates',
        'Share of voice in target conversations',
        'Website traffic and conversion',
        'Social media engagement and reach',
        'Brand awareness and perception metrics'
      ],
      risk_mitigation: [
        {
          risk: 'Timeline delays due to resource constraints',
          strategy: 'Build buffer time into critical path activities and maintain flexible resource allocation'
        },
        {
          risk: 'Negative media coverage or stakeholder reaction',
          strategy: 'Develop crisis communication protocols and maintain proactive monitoring systems'
        },
        {
          risk: 'Competitive response or market changes',
          strategy: 'Implement agile planning processes and maintain competitive intelligence monitoring'
        }
      ]
    };

    return plan;
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