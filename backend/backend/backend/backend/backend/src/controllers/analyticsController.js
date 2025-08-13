const pool = require('../../config/database');

// Get monitoring analytics
exports.getAnalytics = async (req, res) => {
  try {
    const userId = req.userId;
    const { range = '7d' } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch(range) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
    
    // Get sentiment trends
    const sentimentTrendsQuery = `
      SELECT 
        DATE(publish_date) as date,
        COUNT(CASE WHEN sentiment = 'positive' THEN 1 END) * 100.0 / COUNT(*) as positive,
        COUNT(CASE WHEN sentiment = 'neutral' THEN 1 END) * 100.0 / COUNT(*) as neutral,
        COUNT(CASE WHEN sentiment = 'negative' THEN 1 END) * 100.0 / COUNT(*) as negative
      FROM monitoring_mentions
      WHERE user_id = $1 AND publish_date >= $2
      GROUP BY DATE(publish_date)
      ORDER BY date ASC
    `;
    const sentimentTrends = await pool.query(sentimentTrendsQuery, [userId, startDate]);
    
    // Get source distribution
    const sourceDistQuery = `
      SELECT 
        source,
        COUNT(*) as count,
        COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() as percentage
      FROM monitoring_mentions
      WHERE user_id = $1 AND publish_date >= $2
      GROUP BY source
      ORDER BY count DESC
      LIMIT 10
    `;
    const sourceDistribution = await pool.query(sourceDistQuery, [userId, startDate]);
    
    // Get top keywords from analyses
    const keywordsQuery = `
      SELECT 
        keyword,
        COUNT(*) as count
      FROM (
        SELECT unnest(string_to_array(lower(content), ' ')) as keyword
        FROM monitoring_mentions
        WHERE user_id = $1 AND publish_date >= $2
      ) words
      WHERE length(keyword) > 4
      GROUP BY keyword
      ORDER BY count DESC
      LIMIT 20
    `;
    const topKeywords = await pool.query(keywordsQuery, [userId, startDate]);
    
    // Get volume by hour
    const volumeQuery = `
      SELECT 
        EXTRACT(HOUR FROM publish_date) as hour,
        COUNT(*) as count
      FROM monitoring_mentions
      WHERE user_id = $1 AND publish_date >= $2
      GROUP BY EXTRACT(HOUR FROM publish_date)
      ORDER BY hour
    `;
    const volumeByHour = await pool.query(volumeQuery, [userId, startDate]);
    
    // Get urgency breakdown
    const urgencyQuery = `
      SELECT 
        COALESCE(analysis->>'urgencyLevel', 'low') as level,
        COUNT(*) as count,
        COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() as percentage
      FROM monitoring_mentions
      WHERE user_id = $1 AND publish_date >= $2
      GROUP BY COALESCE(analysis->>'urgencyLevel', 'low')
      ORDER BY 
        CASE 
          WHEN COALESCE(analysis->>'urgencyLevel', 'low') = 'high' THEN 1
          WHEN COALESCE(analysis->>'urgencyLevel', 'low') = 'medium' THEN 2
          ELSE 3
        END
    `;
    const urgencyBreakdown = await pool.query(urgencyQuery, [userId, startDate]);
    
    // Get weekly comparison
    const currentWeekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const previousWeekStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    
    const comparisonQuery = `
      WITH current_week AS (
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN sentiment = 'positive' THEN 1 END) as positive,
          AVG(CASE 
            WHEN analysis->>'urgencyLevel' = 'high' THEN 3
            WHEN analysis->>'urgencyLevel' = 'medium' THEN 2
            ELSE 1
          END) as avg_urgency
        FROM monitoring_mentions
        WHERE user_id = $1 AND publish_date >= $2 AND publish_date < $3
      ),
      previous_week AS (
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN sentiment = 'positive' THEN 1 END) as positive,
          AVG(CASE 
            WHEN analysis->>'urgencyLevel' = 'high' THEN 3
            WHEN analysis->>'urgencyLevel' = 'medium' THEN 2
            ELSE 1
          END) as avg_urgency
        FROM monitoring_mentions
        WHERE user_id = $1 AND publish_date >= $4 AND publish_date < $2
      )
      SELECT 
        CASE 
          WHEN p.total = 0 THEN 0 
          ELSE ROUND(((c.total - p.total) * 100.0 / p.total)::numeric, 1)
        END as total_change,
        CASE 
          WHEN p.positive = 0 THEN 0 
          ELSE ROUND(((c.positive - p.positive) * 100.0 / p.positive)::numeric, 1)
        END as positive_change,
        CASE 
          WHEN p.avg_urgency = 0 THEN 0 
          ELSE ROUND(((c.avg_urgency - p.avg_urgency) * 100.0 / p.avg_urgency)::numeric, 1)
        END as urgency_change
      FROM current_week c, previous_week p
    `;
    const weeklyComparison = await pool.query(comparisonQuery, [
      userId, 
      currentWeekStart, 
      now, 
      previousWeekStart
    ]);
    
    res.json({
      success: true,
      analytics: {
        sentimentTrends: sentimentTrends.rows.map(row => ({
          date: new Date(row.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          positive: parseFloat(row.positive) || 0,
          neutral: parseFloat(row.neutral) || 0,
          negative: parseFloat(row.negative) || 0
        })),
        sourceDistribution: sourceDistribution.rows.map(row => ({
          name: row.source,
          count: parseInt(row.count),
          percentage: parseFloat(row.percentage).toFixed(1)
        })),
        topKeywords: topKeywords.rows.map(row => ({
          word: row.keyword,
          count: parseInt(row.count)
        })),
        volumeByHour: Array.from({ length: 24 }, (_, i) => {
          const hourData = volumeByHour.rows.find(row => parseInt(row.hour) === i);
          return {
            hour: i.toString().padStart(2, '0'),
            count: hourData ? parseInt(hourData.count) : 0
          };
        }),
        urgencyBreakdown: urgencyBreakdown.rows.map(row => ({
          level: row.level,
          count: parseInt(row.count),
          percentage: parseFloat(row.percentage).toFixed(1)
        })),
        weeklyComparison: weeklyComparison.rows[0] || null
      }
    });
    
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics'
    });
  }
};

// Export analytics data
exports.exportAnalytics = async (req, res) => {
  try {
    const { format, dateRange, analytics } = req.body;
    
    if (format === 'csv') {
      // Convert analytics to CSV format
      let csv = 'Monitoring Analytics Report\n';
      csv += `Date Range: ${dateRange}\n\n`;
      
      // Sentiment Trends
      csv += 'Sentiment Trends\n';
      csv += 'Date,Positive %,Neutral %,Negative %\n';
      analytics.sentimentTrends.forEach(trend => {
        csv += `${trend.date},${trend.positive},${trend.neutral},${trend.negative}\n`;
      });
      csv += '\n';
      
      // Source Distribution
      csv += 'Source Distribution\n';
      csv += 'Source,Count,Percentage\n';
      analytics.sourceDistribution.forEach(source => {
        csv += `${source.name},${source.count},${source.percentage}%\n`;
      });
      csv += '\n';
      
      // Top Keywords
      csv += 'Top Keywords\n';
      csv += 'Keyword,Count\n';
      analytics.topKeywords.forEach(keyword => {
        csv += `${keyword.word},${keyword.count}\n`;
      });
      
      res.json({
        success: true,
        data: csv
      });
    } else {
      // Return JSON format
      res.json({
        success: true,
        data: JSON.stringify(analytics, null, 2)
      });
    }
    
  } catch (error) {
    console.error('Error exporting analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export analytics'
    });
  }
};
