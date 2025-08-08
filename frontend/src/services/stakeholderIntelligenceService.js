import axios from 'axios';
import STAKEHOLDER_API_BASE from '../config/api';

const STAKEHOLDER_API_BASE = `${STAKEHOLDER_API_BASE}/stakeholder-intelligence`;

// Get auth token from localStorage
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

class StakeholderIntelligenceService {
  // Organization Management
  async createOrUpdateOrganization(orgData) {
    try {
      const response = await axios.post(
        `${STAKEHOLDER_API_BASE}/organization`,
        orgData,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error creating organization:', error);
      throw error;
    }
  }

  // Generate AI-powered stakeholder suggestions
  async generateStakeholderSuggestions(orgData) {
    try {
      const response = await axios.post(
        `${STAKEHOLDER_API_BASE}/suggestions`,
        {
          company: orgData.company,
          url: orgData.url,
          strategicGoals: orgData.strategicGoals,
          priorityStakeholders: orgData.priorityStakeholders
        },
        { headers: getAuthHeaders() }
      );
      return response.data.suggestions;
    } catch (error) {
      console.error('Error generating suggestions:', error);
      // Fallback to local generation if API fails
      return this.generateLocalSuggestions(orgData);
    }
  }

  // Discover sources for a stakeholder using external APIs
  async discoverStakeholderSources(stakeholderName, stakeholderType) {
    try {
      const response = await axios.post(
        `${STAKEHOLDER_API_BASE}/discover-sources`,
        {
          stakeholderName,
          stakeholderType
        },
        { headers: getAuthHeaders() }
      );
      return response.data.sources;
    } catch (error) {
      console.error('Error discovering sources:', error);
      return [];
    }
  }

  // Validate a source URL
  async validateSource(url) {
    try {
      const response = await axios.post(
        `${STAKEHOLDER_API_BASE}/validate-source`,
        { url },
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error validating source:', error);
      return { valid: false, error: error.message };
    }
  }

  // Save stakeholder configuration
  async saveStakeholderConfiguration(organizationId, stakeholders) {
    try {
      const response = await axios.post(
        `${STAKEHOLDER_API_BASE}/configure`,
        {
          organizationId,
          stakeholders
        },
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error saving configuration:', error);
      throw error;
    }
  }

  // Get monitoring data for an organization
  async getStakeholderMonitoring(organizationId) {
    try {
      const response = await axios.get(
        `${STAKEHOLDER_API_BASE}/monitoring/${organizationId}`,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error getting monitoring data:', error);
      return { stakeholders: [], findings: [], predictions: [] };
    }
  }

  // Run monitoring scan
  async runMonitoringScan(organizationId) {
    try {
      const response = await axios.post(
        `${STAKEHOLDER_API_BASE}/scan`,
        { organizationId },
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error running scan:', error);
      throw error;
    }
  }

  // Get intelligence findings
  async getIntelligenceFindings(organizationId, options = {}) {
    try {
      const params = new URLSearchParams();
      if (options.limit) params.append('limit', options.limit);
      if (options.offset) params.append('offset', options.offset);
      if (options.unreadOnly) params.append('unreadOnly', options.unreadOnly);

      const response = await axios.get(
        `${STAKEHOLDER_API_BASE}/findings/${organizationId}?${params.toString()}`,
        { headers: getAuthHeaders() }
      );
      return response.data.findings;
    } catch (error) {
      console.error('Error getting findings:', error);
      return [];
    }
  }

  // Discover sources for a stakeholder
  async discoverSourcesForStakeholder(stakeholder) {
    try {
      console.log('Discovering sources for stakeholder:', stakeholder);
      const requestData = { 
        stakeholderName: stakeholder.name,
        stakeholderType: stakeholder.type 
      };
      console.log('Request data:', requestData);
      console.log('API URL:', `${STAKEHOLDER_API_BASE}/discover-sources`);
      
      const response = await axios.post(
        `${STAKEHOLDER_API_BASE}/discover-sources`,
        requestData,
        { headers: getAuthHeaders() }
      );
      
      console.log('Source discovery response:', response.data);
      
      if (response.data.success && response.data.sources) {
        console.log('Returning', response.data.sources.length, 'sources');
        return response.data.sources;
      }
      console.log('No sources in response');
      return [];
    } catch (error) {
      console.error('Error discovering sources:', error);
      console.error('Error details:', error.response?.data || error.message);
      return [];
    }
  }

  // Validate a source URL
  async validateSource(url) {
    try {
      const response = await axios.post(
        `${STAKEHOLDER_API_BASE}/validate-source`,
        { url },
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error validating source:', error);
      return { valid: false };
    }
  }

  // Batch validate multiple sources
  async batchValidateSources(urls) {
    const results = await Promise.allSettled(
      urls.map(url => this.validateSource(url))
    );
    return results.map(result => 
      result.status === 'fulfilled' ? result.value : { valid: false }
    );
  }

  // Mark finding as read
  async markFindingAsRead(findingId) {
    try {
      const response = await axios.put(
        `${STAKEHOLDER_API_BASE}/findings/${findingId}/read`,
        {},
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error marking finding as read:', error);
      throw error;
    }
  }

  // Archive finding
  async archiveFinding(findingId) {
    try {
      const response = await axios.put(
        `${STAKEHOLDER_API_BASE}/findings/${findingId}/archive`,
        {},
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error archiving finding:', error);
      throw error;
    }
  }

  // Get predictions
  async getPredictions(organizationId) {
    try {
      const response = await axios.get(
        `${STAKEHOLDER_API_BASE}/predictions/${organizationId}`,
        { headers: getAuthHeaders() }
      );
      return response.data.predictions;
    } catch (error) {
      console.error('Error getting predictions:', error);
      return [];
    }
  }

  // Get recommended actions
  async getRecommendedActions(organizationId, status = 'pending') {
    try {
      const response = await axios.get(
        `${STAKEHOLDER_API_BASE}/actions/${organizationId}?status=${status}`,
        { headers: getAuthHeaders() }
      );
      return response.data.actions;
    } catch (error) {
      console.error('Error getting actions:', error);
      return [];
    }
  }

  // Update action status
  async updateAction(actionId, updates) {
    try {
      const response = await axios.put(
        `${STAKEHOLDER_API_BASE}/actions/${actionId}`,
        updates,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating action:', error);
      throw error;
    }
  }

  // Get dashboard summary
  async getDashboardSummary(organizationId) {
    try {
      const response = await axios.get(
        `${STAKEHOLDER_API_BASE}/dashboard/${organizationId}`,
        { headers: getAuthHeaders() }
      );
      return response.data.summary;
    } catch (error) {
      console.error('Error getting dashboard summary:', error);
      return {
        stakeholders: {},
        findings: {},
        actions: {}
      };
    }
  }

  // Check for pre-indexed stakeholder
  async checkPreIndexedStakeholder(name) {
    try {
      const response = await axios.get(
        `${STAKEHOLDER_API_BASE}/pre-indexed/${encodeURIComponent(name)}`,
        { headers: getAuthHeaders() }
      );
      return response.data.stakeholders;
    } catch (error) {
      console.error('Error checking pre-indexed stakeholder:', error);
      return [];
    }
  }

  // Local fallback for suggestions if API fails
  generateLocalSuggestions(orgData) {
    const suggestions = [];
    const companyName = orgData.company?.toLowerCase() || '';
    const goals = orgData.strategicGoals?.toLowerCase() || '';
    
    // Check if it's a PR/marketing agency
    if (companyName.includes('karv') || companyName.includes('pr') || 
        companyName.includes('communications') || goals.includes('new business')) {
      
      if (goals.includes('tech')) {
        // PR Agency targeting tech
        suggestions.push(
          {
            name: 'Microsoft',
            type: 'Target Client',
            priority: 'critical',
            reason: 'Major tech company needing PR services',
            monitoringTopics: ['product launches', 'PR RFPs', 'crisis situations']
          },
          {
            name: 'Sequoia Capital',
            type: 'Referral Partner',
            priority: 'high',
            reason: 'Top VC that refers PR agencies to portfolio',
            monitoringTopics: ['new investments', 'portfolio needs']
          },
          {
            name: 'TechCrunch',
            type: 'Media Partner',
            priority: 'high',
            reason: 'Key tech media for client coverage',
            monitoringTopics: ['reporter beats', 'editorial calendar']
          }
        );
      }
    } else {
      // Default B2B suggestions
      suggestions.push(
        {
          name: 'Enterprise Customers',
          type: 'Revenue Drivers',
          priority: 'critical',
          reason: 'Key customers and prospects',
          monitoringTopics: ['RFPs', 'budget cycles', 'vendor evaluations']
        }
      );
    }
    
    return suggestions;
  }

  // Batch operations for efficiency
  async batchValidateSources(urls) {
    const validationPromises = urls.map(url => this.validateSource(url));
    const results = await Promise.allSettled(validationPromises);
    
    return results.map((result, index) => ({
      url: urls[index],
      valid: result.status === 'fulfilled' && result.value.valid,
      error: result.status === 'rejected' ? result.reason : null
    }));
  }

  // Analyze data with AI
  async analyzeWithAI(context) {
    try {
      // For now, return a basic analysis structure
      // In production, this would call the backend AI service
      return {
        analysis: {
          summary: `Analysis of ${context.stakeholderName}: ${context.dataPoints?.length || 0} data points analyzed`,
          sentiment: this.calculateSentiment(context.dataPoints),
          keyThemes: this.extractThemes(context.dataPoints),
          risks: this.identifyRisks(context.dataPoints),
          opportunities: this.identifyOpportunities(context.dataPoints)
        }
      };
    } catch (error) {
      console.error('Error in AI analysis:', error);
      return null;
    }
  }

  // Helper methods for AI analysis
  calculateSentiment(dataPoints) {
    if (!dataPoints || dataPoints.length === 0) return 'neutral';
    
    const positiveWords = ['growth', 'success', 'innovative', 'leading', 'partnership', 'expansion'];
    const negativeWords = ['concern', 'risk', 'decline', 'issue', 'problem', 'challenge'];
    
    let positiveCount = 0;
    let negativeCount = 0;
    
    dataPoints.forEach(point => {
      const text = (point.title + ' ' + point.content).toLowerCase();
      positiveWords.forEach(word => {
        if (text.includes(word)) positiveCount++;
      });
      negativeWords.forEach(word => {
        if (text.includes(word)) negativeCount++;
      });
    });
    
    if (positiveCount > negativeCount * 2) return 'positive';
    if (negativeCount > positiveCount * 2) return 'negative';
    return 'neutral';
  }

  extractThemes(dataPoints) {
    if (!dataPoints || dataPoints.length === 0) return [];
    
    const themes = [];
    const themeKeywords = {
      'innovation': ['innovation', 'new', 'launch', 'technology'],
      'growth': ['growth', 'expansion', 'increase', 'rising'],
      'partnership': ['partner', 'collaboration', 'alliance', 'deal'],
      'leadership': ['CEO', 'executive', 'leadership', 'appointment']
    };
    
    const allText = dataPoints.map(p => (p.title + ' ' + p.content).toLowerCase()).join(' ');
    
    Object.entries(themeKeywords).forEach(([theme, keywords]) => {
      if (keywords.some(keyword => allText.includes(keyword))) {
        themes.push(theme);
      }
    });
    
    return themes;
  }

  identifyRisks(dataPoints) {
    if (!dataPoints || dataPoints.length === 0) return [];
    
    const risks = [];
    const riskKeywords = ['risk', 'concern', 'issue', 'problem', 'challenge', 'threat'];
    
    dataPoints.forEach(point => {
      const text = (point.title + ' ' + point.content).toLowerCase();
      if (riskKeywords.some(keyword => text.includes(keyword))) {
        risks.push('Potential concerns identified in recent coverage');
        return;
      }
    });
    
    return [...new Set(risks)];
  }

  identifyOpportunities(dataPoints) {
    if (!dataPoints || dataPoints.length === 0) return [];
    
    const opportunities = [];
    const oppKeywords = ['opportunity', 'growth', 'expansion', 'partnership', 'innovation'];
    
    dataPoints.forEach(point => {
      const text = (point.title + ' ' + point.content).toLowerCase();
      if (oppKeywords.some(keyword => text.includes(keyword))) {
        opportunities.push('Positive developments detected');
        return;
      }
    });
    
    return [...new Set(opportunities)];
  }

  // Real-time monitoring subscription (for future WebSocket implementation)
  subscribeToMonitoring(organizationId, callback) {
    // This would be implemented with WebSockets for real-time updates
    console.log('Real-time monitoring subscription not yet implemented');
    // For now, poll every 5 minutes
    const interval = setInterval(async () => {
      const data = await this.getStakeholderMonitoring(organizationId);
      callback(data);
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }
}

export default new StakeholderIntelligenceService();