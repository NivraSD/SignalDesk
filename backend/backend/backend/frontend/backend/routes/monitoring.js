const express = require('express');
const router = express.Router();
const { pool } = require('../server');
const cron = require('node-cron');

// Active monitoring jobs
const monitoringJobs = new Map();

// Start monitoring for an organization
router.post('/start', async (req, res) => {
  try {
    const { organizationId, frequency = '*/30 * * * *' } = req.body; // Default: every 30 minutes
    
    // Check if already monitoring
    if (monitoringJobs.has(organizationId)) {
      return res.status(400).json({ error: 'Already monitoring this organization' });
    }
    
    // Create cron job for monitoring
    const job = cron.schedule(frequency, async () => {
      console.log(`🔍 Running monitoring for organization ${organizationId}`);
      await runMonitoring(organizationId);
    });
    
    monitoringJobs.set(organizationId, job);
    job.start();
    
    // Update organization status
    await pool.query(
      'UPDATE organizations SET metadata = jsonb_set(metadata, \'{monitoring}\', \'true\') WHERE id = $1',
      [organizationId]
    );
    
    res.json({ 
      status: 'started', 
      organizationId, 
      frequency,
      nextRun: getNextRunTime(frequency)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stop monitoring
router.post('/stop', async (req, res) => {
  try {
    const { organizationId } = req.body;
    
    const job = monitoringJobs.get(organizationId);
    if (job) {
      job.stop();
      monitoringJobs.delete(organizationId);
    }
    
    // Update organization status
    await pool.query(
      'UPDATE organizations SET metadata = jsonb_set(metadata, \'{monitoring}\', \'false\') WHERE id = $1',
      [organizationId]
    );
    
    res.json({ status: 'stopped', organizationId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get monitoring status
router.get('/status/:orgId', async (req, res) => {
  try {
    const isMonitoring = monitoringJobs.has(req.params.orgId);
    
    // Get latest metrics
    const metricsQuery = `
      SELECT 
        COUNT(DISTINCT t.id) as active_targets,
        COUNT(DISTINCT s.id) as active_sources,
        COUNT(DISTINCT f.id) FILTER (WHERE f.created_at > NOW() - INTERVAL '24 hours') as findings_24h,
        COUNT(DISTINCT o.id) FILTER (WHERE o.created_at > NOW() - INTERVAL '24 hours') as opportunities_24h
      FROM intelligence_targets t
      LEFT JOIN monitoring_sources s ON t.id = s.target_id AND s.active = true
      LEFT JOIN intelligence_findings f ON t.id = f.target_id
      LEFT JOIN opportunities o ON t.organization_id = o.organization_id
      WHERE t.organization_id = $1 AND t.active = true
    `;
    
    const metrics = await pool.query(metricsQuery, [req.params.orgId]);
    
    res.json({
      monitoring: isMonitoring,
      ...metrics.rows[0],
      lastCheck: await getLastCheckTime(req.params.orgId),
      health: calculateHealth(metrics.rows[0])
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get monitoring metrics
router.get('/metrics/:orgId', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    
    const query = `
      SELECT 
        metric_date,
        findings_count,
        opportunities_identified,
        average_relevance,
        average_sentiment,
        source_coverage
      FROM monitoring_metrics
      WHERE organization_id = $1 
        AND metric_date > CURRENT_DATE - INTERVAL '${days} days'
      ORDER BY metric_date DESC
    `;
    
    const result = await pool.query(query, [req.params.orgId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Manually trigger monitoring
router.post('/trigger/:orgId', async (req, res) => {
  try {
    const findings = await runMonitoring(req.params.orgId);
    res.json({ 
      status: 'completed', 
      findings: findings.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function to run monitoring
async function runMonitoring(organizationId) {
  const findings = [];
  
  // Get active targets and sources
  const targetsQuery = `
    SELECT t.*, array_agg(s.*) as sources
    FROM intelligence_targets t
    LEFT JOIN monitoring_sources s ON t.id = s.target_id AND s.active = true
    WHERE t.organization_id = $1 AND t.active = true
    GROUP BY t.id
  `;
  
  const targets = await pool.query(targetsQuery, [organizationId]);
  
  // For each target, check sources (this would connect to real APIs)
  for (const target of targets.rows) {
    // Simulate finding discovery
    const newFindings = await checkSources(target);
    findings.push(...newFindings);
    
    // Store findings in database
    for (const finding of newFindings) {
      await storeFinding(finding, target.id);
    }
  }
  
  // Update metrics
  await updateMetrics(organizationId, findings.length);
  
  // Check for opportunities
  await pool.query('SELECT identify_opportunities() WHERE organization_id = $1', [organizationId]);
  
  return findings;
}

// Simulate checking sources
async function checkSources(target) {
  const findings = [];
  
  // This would connect to real news APIs, social media, etc.
  // For now, simulate with random data
  if (Math.random() > 0.5) {
    findings.push({
      title: `New development regarding ${target.name}`,
      content: `Recent activity detected for ${target.name}`,
      url: `https://example.com/news/${Date.now()}`,
      sentiment_score: (Math.random() * 2) - 1,
      relevance_score: Math.random(),
      importance: Math.random() > 0.7 ? 'high' : 'medium',
      finding_type: 'news'
    });
  }
  
  return findings;
}

// Store finding in database
async function storeFinding(finding, targetId) {
  const query = `
    INSERT INTO intelligence_findings 
    (target_id, title, content, url, published_at, sentiment_score, 
     relevance_score, importance, finding_type)
    VALUES ($1, $2, $3, $4, NOW(), $5, $6, $7, $8)
  `;
  
  await pool.query(query, [
    targetId,
    finding.title,
    finding.content,
    finding.url,
    finding.sentiment_score,
    finding.relevance_score,
    finding.importance,
    finding.finding_type
  ]);
}

// Update monitoring metrics
async function updateMetrics(organizationId, findingsCount) {
  const query = `
    INSERT INTO monitoring_metrics 
    (organization_id, metric_date, findings_count)
    VALUES ($1, CURRENT_DATE, $2)
    ON CONFLICT (organization_id, metric_date) 
    DO UPDATE SET findings_count = monitoring_metrics.findings_count + $2
  `;
  
  await pool.query(query, [organizationId, findingsCount]);
}

// Helper functions
function getNextRunTime(cronExpression) {
  // Parse cron expression to estimate next run
  const parts = cronExpression.split(' ');
  const minutes = parseInt(parts[0].replace('*/', '')) || 60;
  return new Date(Date.now() + minutes * 60000);
}

async function getLastCheckTime(organizationId) {
  const query = `
    SELECT MAX(last_checked) as last_check
    FROM monitoring_sources s
    JOIN intelligence_targets t ON s.target_id = t.id
    WHERE t.organization_id = $1
  `;
  const result = await pool.query(query, [organizationId]);
  return result.rows[0].last_check;
}

function calculateHealth(metrics) {
  let score = 0;
  if (metrics.active_targets > 0) score += 25;
  if (metrics.active_sources > 0) score += 25;
  if (metrics.findings_24h > 0) score += 25;
  if (metrics.opportunities_24h > 0) score += 25;
  return score;
}

module.exports = router;