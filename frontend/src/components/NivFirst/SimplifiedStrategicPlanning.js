import React, { useState, useEffect } from 'react';
import { Calendar, Target, Users, TrendingUp, Clock, CheckCircle, AlertCircle, Edit2, Save } from 'lucide-react';

const SimplifiedStrategicPlanning = ({ context }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [plan, setPlan] = useState({
    title: context?.title || 'Q2 Product Launch Strategy',
    objective: context?.objective || 'Successfully launch new product feature with maximum media coverage',
    timeline: {
      start: 'Week 1',
      end: 'Week 6',
      milestones: [
        { week: 1, task: 'Media list building & relationship warming', status: 'completed' },
        { week: 2, task: 'Content creation & embargo preparation', status: 'in-progress' },
        { week: 3, task: 'Tier 1 media briefings under embargo', status: 'pending' },
        { week: 4, task: 'Broad media outreach & social amplification', status: 'pending' },
        { week: 5, task: 'Launch day execution & rapid response', status: 'pending' },
        { week: 6, task: 'Post-launch momentum & follow-up stories', status: 'pending' }
      ]
    },
    keyMessages: [
      'Revolutionary approach to solving customer pain point',
      'First-to-market with this specific capability',
      'Backed by compelling customer success data'
    ],
    stakeholders: [
      { name: 'CEO', role: 'Spokesperson', status: 'confirmed' },
      { name: 'Product Lead', role: 'Technical briefings', status: 'confirmed' },
      { name: 'Customer Success', role: 'Case studies', status: 'pending' }
    ],
    metrics: {
      targetReach: '10M impressions',
      tierOneTargets: '5 major outlets',
      socialEngagement: '50K interactions'
    }
  });

  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return '#10b981';
      case 'in-progress': return '#f59e0b';
      case 'pending': return '#6b7280';
      case 'confirmed': return '#10b981';
      default: return '#6b7280';
    }
  };

  const handleSave = () => {
    setIsEditing(false);
    // In production, this would save to backend
    console.log('Saving strategic plan:', plan);
  };

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#0a0a0a',
      color: '#e5e7eb'
    }}>
      {/* Header */}
      <div style={{
        padding: '24px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{
              margin: 0,
              fontSize: '24px',
              fontWeight: '600',
              color: '#ffffff',
              marginBottom: '8px'
            }}>
              {plan.title}
            </h2>
            <p style={{
              margin: 0,
              fontSize: '14px',
              color: '#9ca3af'
            }}>
              {plan.objective}
            </p>
          </div>
          <button
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            style={{
              padding: '10px 20px',
              background: isEditing 
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {isEditing ? <Save size={16} /> : <Edit2 size={16} />}
            {isEditing ? 'Save Changes' : 'Edit Plan'}
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px'
      }}>
        {/* Timeline Section */}
        <div style={{
          marginBottom: '32px',
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px'
          }}>
            <Calendar size={20} color="#3b82f6" />
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
              Timeline & Milestones
            </h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {plan.timeline.milestones.map((milestone, index) => (
              <div key={index} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '12px',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}>
                <div style={{
                  width: '60px',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#60a5fa'
                }}>
                  Week {milestone.week}
                </div>
                <div style={{ flex: 1 }}>
                  {isEditing ? (
                    <input
                      type="text"
                      value={milestone.task}
                      onChange={(e) => {
                        const newMilestones = [...plan.timeline.milestones];
                        newMilestones[index].task = e.target.value;
                        setPlan({ ...plan, timeline: { ...plan.timeline, milestones: newMilestones }});
                      }}
                      style={{
                        width: '100%',
                        padding: '4px 8px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '4px',
                        color: '#e5e7eb',
                        fontSize: '14px'
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: '14px' }}>{milestone.task}</span>
                  )}
                </div>
                <div style={{
                  padding: '4px 8px',
                  background: `${getStatusColor(milestone.status)}22`,
                  color: getStatusColor(milestone.status),
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '500'
                }}>
                  {milestone.status}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Key Messages Section */}
        <div style={{
          marginBottom: '32px',
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px'
          }}>
            <Target size={20} color="#10b981" />
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
              Key Messages
            </h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {plan.keyMessages.map((message, index) => (
              <div key={index} style={{
                padding: '12px',
                background: 'rgba(16, 185, 129, 0.05)',
                borderLeft: '3px solid #10b981',
                borderRadius: '4px'
              }}>
                {isEditing ? (
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => {
                      const newMessages = [...plan.keyMessages];
                      newMessages[index] = e.target.value;
                      setPlan({ ...plan, keyMessages: newMessages });
                    }}
                    style={{
                      width: '100%',
                      padding: '4px 8px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '4px',
                      color: '#e5e7eb',
                      fontSize: '14px'
                    }}
                  />
                ) : (
                  <span style={{ fontSize: '14px' }}>{message}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Stakeholders Section */}
        <div style={{
          marginBottom: '32px',
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px'
          }}>
            <Users size={20} color="#8b5cf6" />
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
              Stakeholders
            </h3>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
            {plan.stakeholders.map((stakeholder, index) => (
              <div key={index} style={{
                padding: '12px',
                background: 'rgba(139, 92, 246, 0.05)',
                borderRadius: '8px',
                border: '1px solid rgba(139, 92, 246, 0.2)'
              }}>
                <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
                  {stakeholder.name}
                </div>
                <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '8px' }}>
                  {stakeholder.role}
                </div>
                <div style={{
                  display: 'inline-block',
                  padding: '2px 6px',
                  background: `${getStatusColor(stakeholder.status)}22`,
                  color: getStatusColor(stakeholder.status),
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: '500'
                }}>
                  {stakeholder.status}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Success Metrics */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px'
          }}>
            <TrendingUp size={20} color="#f59e0b" />
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
              Success Metrics
            </h3>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            <div style={{
              padding: '16px',
              background: 'rgba(245, 158, 11, 0.05)',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '24px', fontWeight: '600', color: '#f59e0b' }}>
                {plan.metrics.targetReach}
              </div>
              <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                Target Reach
              </div>
            </div>
            <div style={{
              padding: '16px',
              background: 'rgba(59, 130, 246, 0.05)',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '24px', fontWeight: '600', color: '#3b82f6' }}>
                {plan.metrics.tierOneTargets}
              </div>
              <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                Tier 1 Outlets
              </div>
            </div>
            <div style={{
              padding: '16px',
              background: 'rgba(16, 185, 129, 0.05)',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '24px', fontWeight: '600', color: '#10b981' }}>
                {plan.metrics.socialEngagement}
              </div>
              <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                Social Engagement
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimplifiedStrategicPlanning;