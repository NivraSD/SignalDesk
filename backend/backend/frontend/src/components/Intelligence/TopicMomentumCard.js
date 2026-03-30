import React from 'react';
import { TrendingUp, TrendingDown, Minus, AlertCircle, Clock, Target, Lightbulb } from 'lucide-react';

const TopicMomentumCard = ({ topic, idx, totalCompetitors }) => {
  const competitorActivity = topic.competitorActivity || {};
  
  const getMomentumIcon = (momentum) => {
    switch(momentum?.toLowerCase()) {
      case 'hot':
      case 'hot/growing':
        return <TrendingUp size={16} color="#dc2626" />;
      case 'growing':
        return <TrendingUp size={16} color="#f59e0b" />;
      case 'declining':
        return <TrendingDown size={16} color="#6b7280" />;
      default:
        return <Minus size={16} color="#6b7280" />;
    }
  };

  const getTimeWindowColor = (window) => {
    switch(window) {
      case 'immediate': return '#dc2626';
      case '3months': return '#f59e0b';
      case '6months': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const getStrengthColor = (strength) => {
    switch(strength) {
      case 'strong': return '#dc2626';
      case 'moderate': return '#f59e0b';
      case 'weak': return '#10b981';
      case 'none': return '#e5e7eb';
      default: return '#6b7280';
    }
  };

  const getStrengthIcon = (strength) => {
    switch(strength) {
      case 'strong': return '💪';
      case 'moderate': return '⚖️';
      case 'weak': return '⚠️';
      case 'none': return '—';
      default: return '?';
    }
  };

  // Get topic analysis from matrix data if available
  const getCompetitorTopicAnalysis = (competitorName) => {
    // This would come from the matrix data - placeholder for now
    const analyses = {
      'strong': 'Leading initiatives and significant investment',
      'moderate': 'Active participation with growing focus',
      'weak': 'Limited activity or early exploration',
      'none': 'No current presence or activity'
    };
    
    return analyses[competitorName] || 'Analysis pending';
  };

  return (
    <div
      style={{
        background: 'white',
        borderRadius: '0.75rem',
        padding: '1.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        border: '1px solid #e5e7eb',
        transition: 'all 0.2s'
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: '0', color: '#111827' }}>
          {topic.name}
        </h3>
      </div>

      {/* Media Trending */}
      <div style={{ marginBottom: '1rem' }}>
        <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', margin: '0 0 0.5rem 0' }}>
          Media Trending
        </h4>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '1rem',
          background: '#f9fafb', 
          borderRadius: '0.5rem', 
          padding: '0.75rem',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ 
            fontSize: '1.5rem',
            color: topic.mediaTrend === 'increasing' ? '#10b981' : 
                   topic.mediaTrend === 'decreasing' ? '#dc2626' : '#6b7280'
          }}>
            {topic.mediaTrend === 'increasing' ? '📈' : 
             topic.mediaTrend === 'decreasing' ? '📉' : 
             topic.mediaTrend === 'emerging' ? '✨' : '➡️'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#111827' }}>
              {topic.mediaTrend === 'increasing' ? 'Trending Up' :
               topic.mediaTrend === 'decreasing' ? 'Trending Down' :
               topic.mediaTrend === 'emerging' ? 'Emerging Coverage' : 
               topic.mediaTrend === 'quiet' ? 'Limited Coverage' : 'Stable Coverage'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
              {topic.recentNews?.length > 0 ? `${topic.recentNews.length} recent articles` : 'Minimal recent coverage'}
            </div>
          </div>
        </div>
      </div>

      {/* Competitive Landscape */}
      <div style={{ marginBottom: '1rem' }}>
        <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', margin: '0 0 0.5rem 0' }}>
          Competitive Landscape
        </h4>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gap: '0.5rem',
          padding: '0.75rem',
          background: '#f9fafb',
          borderRadius: '0.5rem',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#dc2626' }}>
              {competitorActivity.strong || 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Strong</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f59e0b' }}>
              {competitorActivity.moderate || 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Moderate</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#10b981' }}>
              {competitorActivity.weak || 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Weak</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#6b7280' }}>
              {competitorActivity.none || 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>None</div>
          </div>
        </div>
      </div>

      {/* Key Drivers */}
      <div style={{ marginBottom: '1rem' }}>
        <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', margin: '0 0 0.5rem 0' }}>
          Key Drivers
        </h4>
        <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.813rem', color: '#4b5563' }}>
          {topic.keyDrivers?.slice(0, 3).map((driver, idx) => (
            <li key={idx} style={{ marginBottom: '0.375rem', lineHeight: '1.5' }}>{driver}</li>
          ))}
          {(!topic.keyDrivers || topic.keyDrivers.length === 0) && (
            <li>Market momentum building</li>
          )}
        </ul>
      </div>

      {/* Key Barriers */}
      {topic.barriers && topic.barriers.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', margin: '0 0 0.5rem 0' }}>
            Key Barriers
          </h4>
          <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.813rem', color: '#dc2626' }}>
            {topic.barriers.slice(0, 3).map((barrier, idx) => (
              <li key={idx} style={{ marginBottom: '0.375rem', lineHeight: '1.5' }}>{barrier}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Competitor Positioning - Always Visible */}
      <div style={{
        marginTop: '1rem',
        paddingTop: '1rem',
        borderTop: '1px solid #e5e7eb'
      }}>
        <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', margin: '0 0 0.75rem 0' }}>
          Competitor Positioning
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {topic.competitorActivity.details
            ?.sort((a, b) => {
              const strengthOrder = { strong: 0, moderate: 1, weak: 2, none: 3 };
              return strengthOrder[a.strength] - strengthOrder[b.strength];
            })
            .map(comp => (
              <div key={comp.name} style={{
                padding: '0.75rem',
                background: '#f9fafb',
                borderRadius: '0.5rem',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '0.5rem'
                }}>
                  <span style={{ fontWeight: '600', color: '#111827', fontSize: '0.875rem' }}>
                    {comp.name}
                  </span>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <span style={{
                      fontSize: '1.25rem'
                    }}>
                      {getStrengthIcon(comp.strength)}
                    </span>
                    <span style={{
                      padding: '0.125rem 0.375rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      background: getStrengthColor(comp.strength) + '20',
                      color: getStrengthColor(comp.strength)
                    }}>
                      {comp.strength}
                    </span>
                  </div>
                </div>
                
                {/* Topic-specific analysis */}
                <div style={{ fontSize: '0.813rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                  {comp.position || getCompetitorTopicAnalysis(comp.strength)}
                </div>
                
                {/* Evidence if available */}
                {comp.evidence && comp.evidence.length > 0 && (
                  <div style={{ fontSize: '0.75rem', color: '#4b5563' }}>
                    <strong>Evidence:</strong>
                    <ul style={{ margin: '0.25rem 0 0 0', paddingLeft: '1.25rem' }}>
                      {comp.evidence.map((ev, evIdx) => (
                        <li key={evIdx}>{ev}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Trend if available */}
                {comp.trend && comp.trend !== 'stable' && (
                  <div style={{
                    marginTop: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    fontSize: '0.75rem',
                    color: comp.trend === 'growing' ? '#10b981' : 
                           comp.trend === 'declining' ? '#dc2626' : '#6b7280'
                  }}>
                    {comp.trend === 'growing' ? <TrendingUp size={12} /> : 
                     comp.trend === 'declining' ? <TrendingDown size={12} /> : <Minus size={12} />}
                    <span style={{ fontWeight: '500' }}>Trend: {comp.trend}</span>
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>


      {/* Data Quality Indicator */}
      {topic.analysisMetadata && (
        <div style={{
          marginTop: '1rem',
          paddingTop: '0.75rem',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.75rem',
          color: '#6b7280'
        }}>
          <span>
            Data Quality: <strong style={{ 
              color: topic.analysisMetadata.dataQuality === 'high' ? '#10b981' :
                     topic.analysisMetadata.dataQuality === 'medium' ? '#f59e0b' : '#dc2626'
            }}>{topic.analysisMetadata.dataQuality}</strong>
          </span>
          <span>Confidence: <strong>{topic.analysisMetadata.confidence}%</strong></span>
          <span>Updated: {new Date(topic.analysisMetadata.lastUpdated).toLocaleTimeString()}</span>
        </div>
      )}
    </div>
  );
};

export default TopicMomentumCard;