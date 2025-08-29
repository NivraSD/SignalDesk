// Enhanced Monitoring Service - Real-time Integration
const EventEmitter = require('events');
const cron = require('node-cron');
const MemoryVaultService = require('../memoryvault/MemoryVaultService');
const AdaptiveAIAssistant = require('../ai-assistant/AdaptiveAIAssistant');
const ContextManager = require('../context/ContextManager');
const db = require('../../config/db');

class EnhancedMonitoringService extends EventEmitter {
  constructor(io) {
    super();
    this.io = io;
    this.aiAssistant = new AdaptiveAIAssistant();
    this.activeMonitors = new Map();
    this.alertThresholds = new Map();
    this.monitoringJobs = new Map();
    
    this.initializeMonitoring();
  }

  async initializeMonitoring() {
    console.log('🚀 Initializing Enhanced Monitoring Service');
    
    // Load active monitoring targets
    await this.loadActiveTargets();
    
    // Set up monitoring schedules
    this.setupMonitoringSchedules();
    
    // Initialize AI in Intelligence mode
    await this.aiAssistant.morphTo('intelligence');
    
    // Set up real-time event handlers
    this.setupEventHandlers();
  }

  async loadActiveTargets() {
    try {
      const targets = await db.query(
        `SELECT t.*, o.name as org_name 
         FROM intelligence_targets t
         JOIN organizations o ON t.organization_id = o.id
         WHERE t.active = true`
      );

      targets.rows.forEach(target => {
        this.activeMonitors.set(target.id, {
          target,
          lastCheck: null,
          findings: [],
          status: 'active'
        });

        // Set default thresholds
        this.alertThresholds.set(target.id, {
          sentimentDrop: -0.2,
          volumeSpike: 2.0,
          competitorMention: 1,
          crisisKeywords: ['crisis', 'scandal', 'lawsuit', 'breach']
        });
      });

      console.log(`📊 Loaded ${targets.rows.length} active monitoring targets`);
    } catch (error) {
      console.error('Error loading monitoring targets:', error);
    }
  }

  setupMonitoringSchedules() {
    // Real-time monitoring (every 5 minutes)
    const realtimeJob = cron.schedule('*/5 * * * *', async () => {
      await this.performRealtimeMonitoring();
    });
    this.monitoringJobs.set('realtime', realtimeJob);

    // Hourly analysis
    const hourlyJob = cron.schedule('0 * * * *', async () => {
      await this.performHourlyAnalysis();
    });
    this.monitoringJobs.set('hourly', hourlyJob);

    // Daily summary
    const dailyJob = cron.schedule('0 9 * * *', async () => {
      await this.generateDailySummary();
    });
    this.monitoringJobs.set('daily', dailyJob);
  }

  async performRealtimeMonitoring() {
    console.log('🔄 Performing real-time monitoring check');
    
    for (const [targetId, monitor] of this.activeMonitors) {
      try {
        // Gather data from sources
        const data = await this.gatherTargetData(monitor.target);
        
        // Analyze with AI
        const analysis = await this.analyzeWithAI(data, monitor.target);
        
        // Check for alerts
        const alerts = this.checkAlertConditions(analysis, targetId);
        
        // Store findings
        if (analysis.findings.length > 0) {
          await this.storeFindings(targetId, analysis.findings);
          
          // Save to MemoryVault
          await this.saveToMemoryVault(targetId, analysis);
        }
        
        // Emit real-time updates
        this.emitMonitoringUpdate(targetId, {
          analysis,
          alerts,
          timestamp: new Date()
        });
        
        // Update monitor status
        monitor.lastCheck = new Date();
        monitor.findings.push(...analysis.findings);
        
      } catch (error) {
        console.error(`Error monitoring target ${targetId}:`, error);
        monitor.status = 'error';
      }
    }
  }

  async gatherTargetData(target) {
    const data = {
      mentions: [],
      sentiment: null,
      volume: 0,
      sources: []
    };

    try {
      // Simulate data gathering (in production, this would call actual APIs)
      const keywords = target.keywords || [];
      
      // Search for mentions
      data.mentions = await this.searchMentions(target.name, keywords);
      
      // Calculate sentiment
      data.sentiment = await this.calculateSentiment(data.mentions);
      
      // Track volume
      data.volume = data.mentions.length;
      
      // Identify sources
      data.sources = this.extractSources(data.mentions);
      
    } catch (error) {
      console.error('Error gathering data:', error);
    }

    return data;
  }

  async analyzeWithAI(data, target) {
    try {
      // Build analysis prompt
      const prompt = `
        Analyze the following monitoring data for ${target.name}:
        
        Mentions: ${data.mentions.length}
        Sentiment: ${data.sentiment}
        Volume: ${data.volume}
        Key Sources: ${data.sources.slice(0, 5).join(', ')}
        
        Recent Mentions:
        ${data.mentions.slice(0, 5).map(m => `- ${m.text}`).join('\n')}
        
        Provide:
        1. Key findings and insights
        2. Trend analysis
        3. Risk assessment
        4. Recommended actions
        5. Priority level (low/medium/high/critical)
      `;

      const response = await this.aiAssistant.processMessage(prompt, {
        feature: 'monitoring',
        forceMode: 'intelligence'
      });

      // Parse AI response
      const analysis = this.parseAIAnalysis(response.content);
      analysis.raw = data;
      analysis.suggestions = response.suggestions;

      return analysis;
    } catch (error) {
      console.error('AI analysis error:', error);
      return {
        findings: [],
        trends: [],
        risks: [],
        actions: [],
        priority: 'low',
        raw: data
      };
    }
  }

  checkAlertConditions(analysis, targetId) {
    const alerts = [];
    const thresholds = this.alertThresholds.get(targetId);
    
    // Sentiment alert
    if (analysis.raw.sentiment < thresholds.sentimentDrop) {
      alerts.push({
        type: 'sentiment_drop',
        severity: 'high',
        message: `Sentiment dropped to ${analysis.raw.sentiment.toFixed(2)}`,
        data: analysis.raw.sentiment
      });
    }
    
    // Volume spike alert
    const avgVolume = this.getAverageVolume(targetId);
    if (analysis.raw.volume > avgVolume * thresholds.volumeSpike) {
      alerts.push({
        type: 'volume_spike',
        severity: 'medium',
        message: `Volume spike detected: ${analysis.raw.volume} mentions`,
        data: analysis.raw.volume
      });
    }
    
    // Crisis keyword alert
    const crisisFound = thresholds.crisisKeywords.some(keyword =>
      analysis.raw.mentions.some(m => 
        m.text.toLowerCase().includes(keyword.toLowerCase())
      )
    );
    
    if (crisisFound) {
      alerts.push({
        type: 'crisis_keyword',
        severity: 'critical',
        message: 'Crisis keywords detected in mentions',
        data: thresholds.crisisKeywords
      });
    }
    
    // AI-detected risks
    if (analysis.priority === 'critical' || analysis.priority === 'high') {
      alerts.push({
        type: 'ai_risk',
        severity: analysis.priority,
        message: 'AI detected high-priority situation',
        data: analysis.risks
      });
    }
    
    return alerts;
  }

  async storeFindings(targetId, findings) {
    try {
      const target = this.activeMonitors.get(targetId).target;
      
      for (const finding of findings) {
        await db.query(
          `INSERT INTO intelligence_findings 
           (organization_id, target_id, type, content, metadata, severity, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
          [
            target.organization_id,
            targetId,
            finding.type || 'general',
            finding.content,
            finding.metadata || {},
            finding.severity || 'low'
          ]
        );
      }
    } catch (error) {
      console.error('Error storing findings:', error);
    }
  }

  async saveToMemoryVault(targetId, analysis) {
    try {
      const target = this.activeMonitors.get(targetId).target;
      
      // Create MemoryVault item for this monitoring session
      const vaultItem = await MemoryVaultService.createItem({
        projectId: target.project_id,
        name: `Monitoring - ${target.name} - ${new Date().toISOString()}`,
        type: 'monitoring_analysis',
        content: JSON.stringify(analysis),
        metadata: {
          targetId,
          targetName: target.name,
          priority: analysis.priority,
          findingsCount: analysis.findings.length,
          alertsCount: analysis.alerts?.length || 0
        }
      });

      // Create relationships to previous monitoring sessions
      const previousSessions = await db.query(
        `SELECT id FROM memoryvault_items 
         WHERE type = 'monitoring_analysis' 
         AND metadata->>'targetId' = $1
         ORDER BY created_at DESC
         LIMIT 1`,
        [targetId.toString()]
      );

      if (previousSessions.rows[0]) {
        await MemoryVaultService.createRelationship(
          vaultItem.id,
          previousSessions.rows[0].id,
          'follows',
          { type: 'temporal_sequence' }
        );
      }

      return vaultItem;
    } catch (error) {
      console.error('Error saving to MemoryVault:', error);
    }
  }

  emitMonitoringUpdate(targetId, data) {
    const target = this.activeMonitors.get(targetId).target;
    
    // Emit to specific monitoring room
    this.io.to(`monitoring:${targetId}`).emit('monitoring:update', {
      targetId,
      targetName: target.name,
      ...data
    });
    
    // Emit alerts to organization room
    if (data.alerts && data.alerts.length > 0) {
      this.io.to(`org:${target.organization_id}`).emit('monitoring:alert', {
        targetId,
        targetName: target.name,
        alerts: data.alerts,
        timestamp: data.timestamp
      });
      
      // If critical, emit to all users of the organization
      const criticalAlerts = data.alerts.filter(a => a.severity === 'critical');
      if (criticalAlerts.length > 0) {
        this.emit('critical:alert', {
          targetId,
          organization: target.organization_id,
          alerts: criticalAlerts
        });
      }
    }
  }

  async performHourlyAnalysis() {
    console.log('📊 Performing hourly analysis');
    
    for (const [targetId, monitor] of this.activeMonitors) {
      try {
        // Aggregate findings from the last hour
        const hourlyFindings = monitor.findings.filter(f => 
          new Date() - new Date(f.timestamp) < 3600000
        );
        
        if (hourlyFindings.length === 0) continue;
        
        // Generate hourly summary with AI
        const summary = await this.generateHourlySummary(targetId, hourlyFindings);
        
        // Update context for other features
        await ContextManager.setGlobalContext(`monitoring:${targetId}:hourly`, summary);
        
        // Emit hourly report
        this.io.to(`monitoring:${targetId}`).emit('monitoring:hourly', {
          targetId,
          summary,
          timestamp: new Date()
        });
        
      } catch (error) {
        console.error(`Error in hourly analysis for ${targetId}:`, error);
      }
    }
  }

  async generateDailySummary() {
    console.log('📈 Generating daily monitoring summary');
    
    const summaries = [];
    
    for (const [targetId, monitor] of this.activeMonitors) {
      try {
        const summary = await this.createDailySummary(targetId, monitor);
        summaries.push(summary);
        
        // Save daily summary to MemoryVault
        await MemoryVaultService.createItem({
          projectId: monitor.target.project_id,
          name: `Daily Summary - ${monitor.target.name} - ${new Date().toLocaleDateString()}`,
          type: 'monitoring_summary',
          content: JSON.stringify(summary),
          metadata: {
            targetId,
            type: 'daily',
            date: new Date().toISOString()
          }
        });
      } catch (error) {
        console.error(`Error generating daily summary for ${targetId}:`, error);
      }
    }
    
    // Emit consolidated daily report
    this.io.emit('monitoring:daily', {
      summaries,
      timestamp: new Date()
    });
  }

  // Helper methods
  async searchMentions(name, keywords) {
    // Simulate mention search
    return [
      { text: `${name} announces new product launch`, source: 'TechCrunch', timestamp: new Date() },
      { text: `Industry report mentions ${name} growth`, source: 'Forbes', timestamp: new Date() }
    ];
  }

  async calculateSentiment(mentions) {
    // Simulate sentiment calculation
    return Math.random() * 2 - 1; // Random between -1 and 1
  }

  extractSources(mentions) {
    return [...new Set(mentions.map(m => m.source))];
  }

  parseAIAnalysis(aiResponse) {
    // Parse AI response into structured analysis
    return {
      findings: [],
      trends: [],
      risks: [],
      actions: [],
      priority: 'medium'
    };
  }

  getAverageVolume(targetId) {
    const monitor = this.activeMonitors.get(targetId);
    if (!monitor.findings.length) return 10;
    
    const volumes = monitor.findings.map(f => f.raw?.volume || 0);
    return volumes.reduce((a, b) => a + b, 0) / volumes.length;
  }

  async generateHourlySummary(targetId, findings) {
    const prompt = `
      Summarize the following monitoring findings from the last hour:
      ${findings.map(f => f.content).join('\n')}
      
      Provide a concise summary with key takeaways and any action items.
    `;
    
    const response = await this.aiAssistant.processMessage(prompt, {
      feature: 'monitoring_summary'
    });
    
    return response.content;
  }

  async createDailySummary(targetId, monitor) {
    return {
      targetId,
      targetName: monitor.target.name,
      totalFindings: monitor.findings.length,
      alerts: [],
      keyInsights: [],
      recommendations: []
    };
  }

  setupEventHandlers() {
    // Handle critical alerts
    this.on('critical:alert', async (data) => {
      console.log('🚨 CRITICAL ALERT:', data);
      
      // Switch AI to crisis mode
      await this.aiAssistant.morphTo('crisis');
      
      // Generate crisis response plan
      const response = await this.aiAssistant.processMessage(
        `Critical alert for ${data.targetId}: ${JSON.stringify(data.alerts)}. Provide immediate response plan.`,
        { feature: 'crisis_response' }
      );
      
      // Emit crisis response
      this.io.emit('crisis:response', {
        ...data,
        responsePlan: response.content
      });
    });
  }

  // Public API
  async addMonitoringTarget(target) {
    this.activeMonitors.set(target.id, {
      target,
      lastCheck: null,
      findings: [],
      status: 'active'
    });
    
    // Set default thresholds
    this.alertThresholds.set(target.id, {
      sentimentDrop: -0.2,
      volumeSpike: 2.0,
      competitorMention: 1,
      crisisKeywords: ['crisis', 'scandal', 'lawsuit', 'breach']
    });
    
    console.log(`➕ Added monitoring target: ${target.name}`);
  }

  async removeMonitoringTarget(targetId) {
    this.activeMonitors.delete(targetId);
    this.alertThresholds.delete(targetId);
    console.log(`➖ Removed monitoring target: ${targetId}`);
  }

  updateAlertThresholds(targetId, thresholds) {
    this.alertThresholds.set(targetId, {
      ...this.alertThresholds.get(targetId),
      ...thresholds
    });
  }

  getMonitoringStatus() {
    const status = {
      active: this.activeMonitors.size,
      targets: [],
      jobs: []
    };
    
    this.activeMonitors.forEach((monitor, targetId) => {
      status.targets.push({
        id: targetId,
        name: monitor.target.name,
        status: monitor.status,
        lastCheck: monitor.lastCheck,
        findingsCount: monitor.findings.length
      });
    });
    
    this.monitoringJobs.forEach((job, name) => {
      status.jobs.push({
        name,
        running: job.running || false
      });
    });
    
    return status;
  }

  async stop() {
    console.log('🛑 Stopping monitoring service');
    
    // Stop all cron jobs
    this.monitoringJobs.forEach(job => job.stop());
    this.monitoringJobs.clear();
    
    // Clear monitors
    this.activeMonitors.clear();
    this.alertThresholds.clear();
  }
}

module.exports = EnhancedMonitoringService;