import React from 'react';
import { Info } from 'lucide-react';

const NVSExplainer = ({ calculation, score }) => {
  if (!calculation) return null;

  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981'; // green
    if (score >= 60) return '#3b82f6'; // blue
    if (score >= 40) return '#f59e0b'; // amber
    if (score >= 20) return '#dc2626'; // red
    return '#6b7280'; // gray
  };

  const getScoreEmoji = (score) => {
    if (score >= 80) return '🚀';
    if (score >= 60) return '✨';
    if (score >= 40) return '💡';
    if (score >= 20) return '⚡';
    return '🔒';
  };

  return (
    <div style={{
      background: '#f9fafb',
      border: '1px solid #e5e7eb',
      borderRadius: '0.5rem',
      padding: '1rem',
      marginTop: '0.5rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <Info size={16} color="#6b7280" />
        <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
          NVS Score Breakdown
        </h4>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
        <div style={{
          fontSize: '2rem',
          fontWeight: '700',
          color: getScoreColor(score)
        }}>
          {score}
          <span style={{ fontSize: '1rem', fontWeight: '400', color: '#6b7280' }}>/100</span>
        </div>
        <span style={{ fontSize: '1.5rem' }}>{getScoreEmoji(score)}</span>
      </div>

      <div style={{
        background: 'white',
        borderRadius: '0.375rem',
        padding: '0.75rem',
        fontFamily: 'monospace',
        fontSize: '0.813rem',
        marginBottom: '0.75rem'
      }}>
        <div style={{ color: '#6b7280', marginBottom: '0.25rem' }}>Formula:</div>
        <div style={{ color: '#111827', fontWeight: '500' }}>
          {calculation.formula}
        </div>
      </div>

      <div style={{ fontSize: '0.813rem', color: '#6b7280' }}>
        <div style={{ marginBottom: '0.5rem' }}>
          <strong>Components:</strong>
        </div>
        <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
          <li>
            <strong>Base Score ({calculation.baseScore}%):</strong> Percentage of weak/absent competitors
          </li>
          <li>
            <strong>Strong Penalty (-{calculation.strongPenalty}):</strong> Each strong competitor reduces opportunity by 15 points
          </li>
          <li>
            <strong>Absence Bonus (+{calculation.absenceBonus}):</strong> Each absent competitor adds 5 points
          </li>
        </ul>
      </div>

      <div style={{
        marginTop: '0.75rem',
        paddingTop: '0.75rem',
        borderTop: '1px solid #e5e7eb',
        fontSize: '0.813rem'
      }}>
        <strong>What this means:</strong>
        <p style={{ margin: '0.25rem 0 0 0', color: '#6b7280' }}>
          The NVS measures the "narrative vacuum" - how much opportunity exists based on competitor weakness. 
          Higher scores indicate topics where competitors are weak or absent, creating opportunity for leadership.
        </p>
      </div>

      {/* Score Range Guide */}
      <div style={{
        marginTop: '0.75rem',
        paddingTop: '0.75rem',
        borderTop: '1px solid #e5e7eb'
      }}>
        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.5rem' }}>
          <strong>Score Ranges:</strong>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '40px', height: '8px', background: '#10b981', borderRadius: '4px' }}></div>
            <span>80-100: Exceptional opportunity</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '40px', height: '8px', background: '#3b82f6', borderRadius: '4px' }}></div>
            <span>60-79: Strong opportunity</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '40px', height: '8px', background: '#f59e0b', borderRadius: '4px' }}></div>
            <span>40-59: Moderate opportunity</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '40px', height: '8px', background: '#dc2626', borderRadius: '4px' }}></div>
            <span>20-39: Limited opportunity</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '40px', height: '8px', background: '#6b7280', borderRadius: '4px' }}></div>
            <span>0-19: Minimal opportunity</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NVSExplainer;