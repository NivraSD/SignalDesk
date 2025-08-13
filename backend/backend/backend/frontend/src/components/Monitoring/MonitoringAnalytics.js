import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  BarChart3, 
  PieChart, 
  Activity,
  Calendar,
  Download,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import api from '../../services/api';
import './MonitoringAnalytics.css';

const MonitoringAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [analytics, setAnalytics] = useState({
    sentimentTrends: [],
    sourceDistribution: [],
    topKeywords: [],
    volumeByHour: [],
    urgencyBreakdown: [],
    weeklyComparison: null
  });
  const [dateRange, setDateRange] = useState('7d');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await api.get(`/monitoring/analytics?range=${dateRange}`);
      
      if (response.data.success) {
        setAnalytics(response.data.analytics);
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
  };

  const exportAnalytics = async (format) => {
    try {
      const response = await api.post('/monitoring/analytics/export', {
        format,
        dateRange,
        analytics
      });
      
      if (response.data.success) {
        const blob = new Blob([response.data.data], {
          type: format === 'csv' ? 'text/csv' : 'application/json'
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `monitoring-analytics-${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Error exporting analytics:', err);
      alert('Failed to export analytics');
    }
  };

  const getSentimentColor = (sentiment) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive': return '#10b981';
      case 'negative': return '#ef4444';
      case 'neutral': return '#6b7280';
      default: return '#94a3b8';
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency?.toLowerCase()) {
      case 'high': return '#dc2626';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div className="analytics-loading">
        <div className="spinner"></div>
        <p>Loading analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-error">
        <AlertCircle size={48} />
        <p>{error}</p>
        <button onClick={fetchAnalytics} className="retry-button">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="monitoring-analytics">
      <div className="analytics-header">
        <h2>Monitoring Analytics</h2>
        <div className="header-controls">
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
            className="date-range-select"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          <button 
            onClick={handleRefresh} 
            className="refresh-button"
            disabled={refreshing}
          >
            <RefreshCw size={16} className={refreshing ? 'spinning' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <div className="export-buttons">
            <button onClick={() => exportAnalytics('csv')} className="export-button">
              <Download size={16} /> CSV
            </button>
            <button onClick={() => exportAnalytics('json')} className="export-button">
              <Download size={16} /> JSON
            </button>
          </div>
        </div>
      </div>

      <div className="analytics-grid">
        {/* Sentiment Trends Chart */}
        <div className="analytics-card sentiment-trends">
          <div className="card-header">
            <TrendingUp size={20} />
            <h3>Sentiment Trends</h3>
          </div>
          <div className="chart-container">
            {analytics.sentimentTrends.length > 0 ? (
              <div className="line-chart">
                <div className="chart-labels">
                  {['100%', '75%', '50%', '25%', '0%'].map(label => (
                    <span key={label} className="y-label">{label}</span>
                  ))}
                </div>
                <div className="chart-area">
                  {analytics.sentimentTrends.map((point, index) => (
                    <div key={index} className="data-point">
                      <div 
                        className="positive-bar" 
                        style={{
                          height: `${point.positive}%`,
                          backgroundColor: getSentimentColor('positive')
                        }}
                      />
                      <div 
                        className="neutral-bar" 
                        style={{
                          height: `${point.neutral}%`,
                          backgroundColor: getSentimentColor('neutral')
                        }}
                      />
                      <div 
                        className="negative-bar" 
                        style={{
                          height: `${point.negative}%`,
                          backgroundColor: getSentimentColor('negative')
                        }}
                      />
                      <span className="x-label">{point.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="no-data">No trend data available</div>
            )}
          </div>
          <div className="chart-legend">
            <span><span className="dot positive"></span> Positive</span>
            <span><span className="dot neutral"></span> Neutral</span>
            <span><span className="dot negative"></span> Negative</span>
          </div>
        </div>

        {/* Source Distribution */}
        <div className="analytics-card source-distribution">
          <div className="card-header">
            <PieChart size={20} />
            <h3>Source Distribution</h3>
          </div>
          <div className="distribution-list">
            {analytics.sourceDistribution.map((source, index) => (
              <div key={index} className="distribution-item">
                <div className="item-info">
                  <span className="source-name">{source.name}</span>
                  <span className="source-count">{source.count} mentions</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${source.percentage}%` }}
                  />
                </div>
                <span className="percentage">{source.percentage}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Keywords */}
        <div className="analytics-card top-keywords">
          <div className="card-header">
            <BarChart3 size={20} />
            <h3>Top Keywords</h3>
          </div>
          <div className="keywords-cloud">
            {analytics.topKeywords.map((keyword, index) => (
              <span 
                key={index} 
                className="keyword-tag"
                style={{ 
                  fontSize: `${Math.max(12, Math.min(24, keyword.count * 2))}px`,
                  opacity: Math.max(0.6, Math.min(1, keyword.count / 10))
                }}
              >
                {keyword.word} ({keyword.count})
              </span>
            ))}
          </div>
        </div>

        {/* Volume by Hour */}
        <div className="analytics-card volume-chart">
          <div className="card-header">
            <Activity size={20} />
            <h3>Mention Volume by Hour</h3>
          </div>
          <div className="hourly-chart">
            {analytics.volumeByHour.map((hour, index) => (
              <div key={index} className="hour-bar">
                <div 
                  className="bar"
                  style={{ height: `${(hour.count / Math.max(...analytics.volumeByHour.map(h => h.count))) * 100}%` }}
                  title={`${hour.hour}: ${hour.count} mentions`}
                />
                <span className="hour-label">{hour.hour}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Urgency Breakdown */}
        <div className="analytics-card urgency-breakdown">
          <div className="card-header">
            <AlertCircle size={20} />
            <h3>Urgency Levels</h3>
          </div>
          <div className="urgency-stats">
            {analytics.urgencyBreakdown.map((level, index) => (
              <div key={index} className="urgency-item">
                <div 
                  className="urgency-indicator"
                  style={{ backgroundColor: getUrgencyColor(level.level) }}
                />
                <div className="urgency-info">
                  <span className="urgency-level">{level.level}</span>
                  <span className="urgency-count">{level.count} mentions</span>
                </div>
                <span className="urgency-percentage">{level.percentage}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Comparison */}
        {analytics.weeklyComparison && (
          <div className="analytics-card weekly-comparison">
            <div className="card-header">
              <Calendar size={20} />
              <h3>Week over Week</h3>
            </div>
            <div className="comparison-stats">
              <div className="stat-item">
                <span className="stat-label">Total Mentions</span>
                <span className="stat-value">{analytics.weeklyComparison.totalChange}%</span>
                <span className={`stat-trend ${analytics.weeklyComparison.totalChange >= 0 ? 'up' : 'down'}`}>
                  {analytics.weeklyComparison.totalChange >= 0 ? '↑' : '↓'}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Positive Sentiment</span>
                <span className="stat-value">{analytics.weeklyComparison.positiveChange}%</span>
                <span className={`stat-trend ${analytics.weeklyComparison.positiveChange >= 0 ? 'up' : 'down'}`}>
                  {analytics.weeklyComparison.positiveChange >= 0 ? '↑' : '↓'}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Urgency Score</span>
                <span className="stat-value">{analytics.weeklyComparison.urgencyChange}%</span>
                <span className={`stat-trend ${analytics.weeklyComparison.urgencyChange >= 0 ? 'down' : 'up'}`}>
                  {analytics.weeklyComparison.urgencyChange >= 0 ? '↑' : '↓'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MonitoringAnalytics;
