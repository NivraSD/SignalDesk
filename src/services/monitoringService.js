/**
 * Monitoring Service
 * Handles intelligence monitoring through Supabase Edge Functions
 */

import { supabase } from '../config/supabase';

class MonitoringService {
  constructor() {
    this.activeSubscriptions = new Map();
  }

  /**
   * Start monitoring for an organization
   * @param {string} organizationId - Organization ID
   * @param {Object} options - Monitoring options
   * @returns {Promise<Object>} Monitoring result
   */
  async startMonitoring(organizationId, options = {}) {
    try {
      const { data, error } = await supabase.functions.invoke('monitor-intelligence', {
        body: {
          organizationId,
          targetId: options.targetId,
          targetIds: options.targetIds,
          mode: options.mode || 'comprehensive',
          sources: options.sources || ['web', 'social', 'news'],
          includeAnalysis: options.includeAnalysis !== false
        }
      });

      if (error) throw error;

      return {
        success: true,
        ...data
      };
    } catch (error) {
      console.error('Monitoring service error:', error);
      return {
        success: false,
        error: error.message || 'Failed to start monitoring'
      };
    }
  }

  /**
   * Get monitoring status
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Object>} Current monitoring status
   */
  async getMonitoringStatus(organizationId) {
    try {
      const { data, error } = await supabase
        .from('monitoring_runs')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Get running monitors
      const runningMonitors = data.filter(run => run.status === 'running');
      const latestRun = data[0];

      return {
        success: true,
        isMonitoring: runningMonitors.length > 0,
        runningMonitors,
        latestRun,
        recentRuns: data
      };
    } catch (error) {
      console.error('Failed to get monitoring status:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get intelligence findings
   * @param {string} organizationId - Organization ID
   * @param {Object} filters - Query filters
   * @returns {Promise<Object>} Findings data
   */
  async getFindings(organizationId, filters = {}) {
    try {
      let query = supabase
        .from('intelligence_findings')
        .select(`
          *,
          target:intelligence_targets(name, type)
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.targetId) {
        query = query.eq('target_id', filters.targetId);
      }
      if (filters.sentiment) {
        query = query.eq('sentiment', filters.sentiment);
      }
      if (filters.minRelevance) {
        query = query.gte('relevance_score', filters.minRelevance);
      }
      if (filters.limit) {
        query = query.limit(filters.limit);
      } else {
        query = query.limit(50);
      }

      const { data, error } = await query;

      if (error) throw error;

      return {
        success: true,
        findings: data
      };
    } catch (error) {
      console.error('Failed to get findings:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Subscribe to real-time findings
   * @param {string} organizationId - Organization ID
   * @param {Function} callback - Callback for new findings
   * @returns {Object} Subscription object
   */
  subscribeToFindings(organizationId, callback) {
    const channel = supabase
      .channel(`findings-${organizationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'intelligence_findings',
          filter: `organization_id=eq.${organizationId}`
        },
        (payload) => {
          console.log('New finding:', payload);
          callback(payload.new);
        }
      )
      .subscribe();

    // Store subscription
    this.activeSubscriptions.set(`findings-${organizationId}`, channel);

    return channel;
  }

  /**
   * Subscribe to monitoring run updates
   * @param {string} organizationId - Organization ID
   * @param {Function} callback - Callback for updates
   * @returns {Object} Subscription object
   */
  subscribeToMonitoringRuns(organizationId, callback) {
    const channel = supabase
      .channel(`monitoring-${organizationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'monitoring_runs',
          filter: `organization_id=eq.${organizationId}`
        },
        (payload) => {
          console.log('Monitoring update:', payload);
          callback(payload);
        }
      )
      .subscribe();

    // Store subscription
    this.activeSubscriptions.set(`monitoring-${organizationId}`, channel);

    return channel;
  }

  /**
   * Unsubscribe from a channel
   * @param {string} channelName - Channel name
   */
  async unsubscribe(channelName) {
    const channel = this.activeSubscriptions.get(channelName);
    if (channel) {
      await supabase.removeChannel(channel);
      this.activeSubscriptions.delete(channelName);
    }
  }

  /**
   * Unsubscribe from all channels
   */
  async unsubscribeAll() {
    for (const [name, channel] of this.activeSubscriptions) {
      await supabase.removeChannel(channel);
    }
    this.activeSubscriptions.clear();
  }

  /**
   * Get intelligence targets
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Object>} Targets data
   */
  async getTargets(organizationId) {
    try {
      const { data, error } = await supabase
        .from('intelligence_targets')
        .select(`
          *,
          sources:target_sources(*)
        `)
        .eq('organization_id', organizationId)
        .eq('active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        success: true,
        targets: data
      };
    } catch (error) {
      console.error('Failed to get targets:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create a new intelligence target
   * @param {Object} target - Target data
   * @returns {Promise<Object>} Created target
   */
  async createTarget(target) {
    try {
      const { data, error } = await supabase
        .from('intelligence_targets')
        .insert(target)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        target: data
      };
    } catch (error) {
      console.error('Failed to create target:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update an intelligence target
   * @param {string} targetId - Target ID
   * @param {Object} updates - Updates to apply
   * @returns {Promise<Object>} Updated target
   */
  async updateTarget(targetId, updates) {
    try {
      const { data, error } = await supabase
        .from('intelligence_targets')
        .update(updates)
        .eq('id', targetId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        target: data
      };
    } catch (error) {
      console.error('Failed to update target:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Delete an intelligence target
   * @param {string} targetId - Target ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteTarget(targetId) {
    try {
      const { error } = await supabase
        .from('intelligence_targets')
        .delete()
        .eq('id', targetId);

      if (error) throw error;

      return {
        success: true
      };
    } catch (error) {
      console.error('Failed to delete target:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get monitoring metrics
   * @param {string} organizationId - Organization ID
   * @param {number} days - Number of days to look back
   * @returns {Promise<Object>} Metrics data
   */
  async getMetrics(organizationId, days = 7) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get findings count
      const { count: findingsCount } = await supabase
        .from('intelligence_findings')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .gte('created_at', startDate.toISOString());

      // Get monitoring runs
      const { data: runs } = await supabase
        .from('monitoring_runs')
        .select('*')
        .eq('organization_id', organizationId)
        .gte('created_at', startDate.toISOString());

      // Calculate metrics
      const metrics = {
        totalFindings: findingsCount || 0,
        totalRuns: runs?.length || 0,
        successfulRuns: runs?.filter(r => r.status === 'completed').length || 0,
        failedRuns: runs?.filter(r => r.status === 'failed').length || 0,
        averageFindings: runs?.length ? (findingsCount || 0) / runs.length : 0,
        period: `${days} days`
      };

      return {
        success: true,
        metrics
      };
    } catch (error) {
      console.error('Failed to get metrics:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default new MonitoringService();