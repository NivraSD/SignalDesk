/**
 * API Service for SignalDesk Frontend
 * Handles all communication with the backend intelligence monitoring system
 */

// Force the correct API URL
const API_BASE_URL = 'http://localhost:5001/api';
console.log('API_BASE_URL in apiService:', API_BASE_URL);

class ApiService {
  constructor() {
    this.updateToken();
  }

  updateToken() {
    this.token = localStorage.getItem('token');
    return this.token;
  }

  /**
   * Make authenticated API request
   */
  async request(endpoint, options = {}) {
    console.log('API_BASE_URL at request time:', API_BASE_URL);
    console.log('Endpoint:', endpoint);
    const url = `${API_BASE_URL}${endpoint}`;
    console.log('Full URL:', url);
    
    // Always get the latest token
    this.updateToken();
    
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
        ...options.headers
      }
    };

    if (options.body && typeof options.body === 'object') {
      config.body = JSON.stringify(options.body);
    }

    console.log('API Request:', config.method || 'GET', url);
    console.log('Request body:', config.body);

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        console.error(`API error at ${url}:`, response.status);
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      console.error('Failed URL:', url);
      throw error;
    }
  }

  /**
   * Convenience methods for common HTTP methods
   */
  async get(endpoint, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'GET'
    });
  }

  async post(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body
    });
  }

  async put(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body
    });
  }

  async delete(endpoint, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'DELETE'
    });
  }

  // ============================================
  // Intelligence Pipeline
  // ============================================

  /**
   * Process intelligence request through the full pipeline
   */
  async analyzeIntelligence(query, organizationId, targetType = 'mixed') {
    return this.request('/intelligence/analyze', {
      method: 'POST',
      body: { query, organizationId, targetType }
    });
  }

  /**
   * Clarify an ambiguous query
   */
  async clarifyQuery(query, answers = null, projectId = null) {
    return this.request('/intelligence/clarify', {
      method: 'POST',
      body: { query, answers, projectId }
    });
  }

  /**
   * Get research project by ID
   */
  async getProject(projectId) {
    return this.request(`/intelligence/projects/${projectId}`);
  }

  /**
   * Get all projects for an organization
   */
  async getOrganizationProjects(organizationId) {
    return this.request(`/intelligence/organizations/${organizationId}/projects`);
  }

  // ============================================
  // Intelligence Targets
  // ============================================

  /**
   * Create a new intelligence target
   */
  async createTarget(target) {
    return this.request('/intelligence/targets', {
      method: 'POST',
      body: target
    });
  }

  /**
   * Get intelligence targets for an organization
   */
  async getOrganizationTargets(organizationId, filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return this.request(`/intelligence/organizations/${organizationId}/targets?${params}`);
  }

  /**
   * Update an intelligence target
   */
  async updateTarget(targetId, updates) {
    return this.request(`/intelligence/targets/${targetId}`, {
      method: 'PUT',
      body: updates
    });
  }

  /**
   * Delete an intelligence target
   */
  async deleteTarget(targetId) {
    return this.request(`/intelligence/targets/${targetId}`, {
      method: 'DELETE'
    });
  }

  // ============================================
  // Findings
  // ============================================

  /**
   * Get intelligence findings
   */
  async getFindings(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return this.request(`/intelligence/findings?${params}`);
  }

  /**
   * Get single finding
   */
  async getFinding(findingId) {
    return this.request(`/intelligence/findings/${findingId}`);
  }

  /**
   * Create a new finding
   */
  async createFinding(finding) {
    return this.request('/intelligence/findings', {
      method: 'POST',
      body: finding
    });
  }

  // ============================================
  // Opportunities
  // ============================================

  /**
   * Get opportunities for an organization
   */
  async getOpportunities(organizationId, filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return this.request(`/opportunities/organization/${organizationId}?${params}`);
  }

  /**
   * Get single opportunity
   */
  async getOpportunity(opportunityId) {
    return this.request(`/opportunities/${opportunityId}`);
  }

  /**
   * Update opportunity status
   */
  async updateOpportunityStatus(opportunityId, status) {
    return this.request(`/opportunities/${opportunityId}/status`, {
      method: 'PATCH',
      body: { status }
    });
  }

  /**
   * Auto-identify opportunities
   */
  async identifyOpportunities(organizationId) {
    return this.request('/opportunities/identify', {
      method: 'POST',
      body: { organizationId }
    });
  }

  // ============================================
  // Monitoring
  // ============================================

  /**
   * Start monitoring for an organization
   */
  async startMonitoring(organizationId, targetIds = null) {
    return this.request('/intelligence/monitor/start', {
      method: 'POST',
      body: { organizationId, targetIds }
    });
  }

  /**
   * Stop monitoring
   */
  async stopMonitoring(organizationId, targetIds = null) {
    return this.request('/intelligence/monitor/stop', {
      method: 'POST',
      body: { organizationId, targetIds }
    });
  }

  /**
   * Get monitoring status
   */
  async getMonitoringStatus(organizationId) {
    return this.request(`/intelligence/monitor/status/${organizationId}`);
  }

  /**
   * Get monitoring metrics
   */
  async getMonitoringMetrics(organizationId, days = 7) {
    return this.request(`/monitoring/metrics/${organizationId}?days=${days}`);
  }

  /**
   * Manually trigger monitoring
   */
  async triggerMonitoring(organizationId) {
    return this.request('/intelligence/monitor/trigger', {
      method: 'POST',
      body: { organizationId }
    });
  }

  /**
   * Analyze a specific competitor
   */
  async analyzeCompetitor(data) {
    return this.request('/intelligence/analysis/competitor', {
      method: 'POST',
      body: data
    });
  }

  /**
   * Analyze a specific topic
   */
  async analyzeTopic(data) {
    return this.request('/intelligence/analysis/topic', {
      method: 'POST',
      body: data
    });
  }

  /**
   * Get overview analysis for all targets
   */
  async getOverviewAnalysis(organizationId) {
    return this.request(`/intelligence/analysis/overview/${organizationId}`);
  }

  /**
   * Get sources for a specific target
   */
  async getTargetSources(targetId) {
    return this.request(`/intelligence/targets/${targetId}/sources`);
  }

  /**
   * Add a source to a target
   */
  async addTargetSource(targetId, sourceData) {
    return this.request(`/intelligence/targets/${targetId}/sources`, {
      method: 'POST',
      body: sourceData
    });
  }

  /**
   * Update a source
   */
  async updateTargetSource(sourceId, updates) {
    return this.request(`/intelligence/sources/${sourceId}`, {
      method: 'PUT',
      body: updates
    });
  }

  /**
   * Delete a source
   */
  async deleteTargetSource(sourceId) {
    return this.request(`/intelligence/sources/${sourceId}`, {
      method: 'DELETE'
    });
  }

  /**
   * Discover sources for a target using AI
   */
  async discoverSourcesForTarget(targetId) {
    return this.request(`/intelligence/targets/${targetId}/discover-sources`, {
      method: 'POST'
    });
  }

  /**
   * Test a source URL
   */
  async testSource(sourceData) {
    return this.request('/intelligence/sources/test', {
      method: 'POST',
      body: sourceData
    });
  }

  /**
   * Bulk add sources to a target
   */
  async bulkAddTargetSources(targetId, sources) {
    return this.request(`/intelligence/targets/${targetId}/sources/bulk`, {
      method: 'POST',
      body: { sources }
    });
  }

  // ============================================
  // Organizations
  // ============================================

  /**
   * Get all organizations
   */
  async getOrganizations() {
    return this.request('/organizations');
  }

  /**
   * Get single organization
   */
  async getOrganization(organizationId) {
    return this.request(`/organizations/${organizationId}`);
  }

  /**
   * Create organization
   */
  async createOrganization(organization) {
    return this.request('/organizations', {
      method: 'POST',
      body: organization
    });
  }

  /**
   * Update organization
   */
  async updateOrganization(organizationId, updates) {
    return this.request(`/organizations/${organizationId}`, {
      method: 'PUT',
      body: updates
    });
  }

  /**
   * Delete organization
   */
  async deleteOrganization(organizationId) {
    return this.request(`/organizations/${organizationId}`, {
      method: 'DELETE'
    });
  }

  // ============================================
  // Real-time Updates (WebSocket)
  // ============================================

  /**
   * Connect to real-time updates (Mock for now - WebSocket pending)
   */
  connectToRealtime(organizationId, callbacks) {
    // Mock WebSocket connection until real implementation
    console.log('Mock real-time connection for organization:', organizationId);
    
    // Simulate connection
    setTimeout(() => {
      callbacks.onConnect && callbacks.onConnect();
    }, 100);
    
    // Return mock connection object with close method
    return {
      close: () => {
        console.log('Closing mock real-time connection');
      }
    };
  }

  // Intelligence Analysis endpoints for Opportunity Execution
  async analyzeCompetitor(params) {
    return this.request('/intelligence/analysis/competitor', {
      method: 'POST',
      body: params
    });
  }

  async analyzeTopic(params) {
    return this.request('/intelligence/analysis/topic', {
      method: 'POST',
      body: params
    });
  }
  
  async getUnifiedIntelligence(organizationId) {
    return this.request(`/intelligence/analysis/unified/${organizationId}`);
  }

  async getTopicMomentum(organizationId) {
    return this.request(`/intelligence/analysis/topic-momentum/${organizationId}`);
  }

  async analyzeOpportunityPosition(data) {
    return this.request('/opportunity/analyze-position', {
      method: 'POST',
      body: data
    });
  }
}

export default new ApiService();