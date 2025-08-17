import React, { useState } from 'react';
import { Users, Mail, Star, Filter, Edit2, Save, Plus, Trash2 } from 'lucide-react';

const SimplifiedMediaList = ({ context }) => {
  const [isEditing, setIsEditing] = useState(false);
  
  // Extract media list from Niv's generated structure
  const getNivMediaList = () => {
    // Check if we have generated content from Niv
    if (context?.generatedContent) {
      const generated = context.generatedContent;
      
      // Handle media list format
      if (generated.journalists && Array.isArray(generated.journalists)) {
        return {
          title: generated.title || context?.title || 'Media Target List',
          journalists: generated.journalists,
          totalContacts: generated.totalContacts,
          byTier: generated.byTier,
          outreachStrategy: generated.outreachStrategy
        };
      }
    }
    
    // Fallback to default journalists
    return {
      title: context?.title || 'Media Target List',
      journalists: context?.journalists || [
        { name: 'Katie Roof', outlet: 'Bloomberg', beat: 'Venture Capital & AI', priority: 'Tier 1', email: '', notes: '' },
        { name: 'Cade Metz', outlet: 'New York Times', beat: 'AI & Technology', priority: 'Tier 1', email: '', notes: '' },
        { name: 'Gillian Tan', outlet: 'Bloomberg', beat: 'Private Equity', priority: 'Tier 1', email: '', notes: '' },
        { name: 'Ryan Mac', outlet: 'Forbes', beat: 'Tech & Investment', priority: 'Tier 2', email: '', notes: '' },
        { name: 'Berber Jin', outlet: 'Wall Street Journal', beat: 'AI & Markets', priority: 'Tier 1', email: '', notes: '' }
      ]
    };
  };
  
  const [mediaList, setMediaList] = useState(getNivMediaList());

  const getPriorityColor = (priority) => {
    if (priority === 'Tier 1') return '#ef4444';
    if (priority === 'Tier 2') return '#f59e0b';
    return '#10b981';
  };

  const handleSave = () => {
    setIsEditing(false);
    console.log('Saving media list:', mediaList);
  };

  const addJournalist = () => {
    setMediaList({
      ...mediaList,
      journalists: [...mediaList.journalists, {
        name: '',
        outlet: '',
        beat: '',
        priority: 'Tier 3',
        email: '',
        notes: ''
      }]
    });
  };

  const removeJournalist = (index) => {
    const newJournalists = mediaList.journalists.filter((_, i) => i !== index);
    setMediaList({ ...mediaList, journalists: newJournalists });
  };

  const updateJournalist = (index, field, value) => {
    const newJournalists = [...mediaList.journalists];
    newJournalists[index][field] = value;
    setMediaList({ ...mediaList, journalists: newJournalists });
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
              {mediaList.title}
            </h2>
            <p style={{
              margin: 0,
              fontSize: '14px',
              color: '#9ca3af'
            }}>
              {mediaList.journalists.length} journalists • {mediaList.journalists.filter(j => j.priority === 'Tier 1').length} Tier 1 targets
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            {isEditing && (
              <button
                onClick={addJournalist}
                style={{
                  padding: '10px 20px',
                  background: 'transparent',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '8px',
                  color: '#10b981',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Plus size={16} />
                Add Journalist
              </button>
            )}
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
              {isEditing ? 'Save Changes' : 'Edit List'}
            </button>
          </div>
        </div>
      </div>

      {/* Journalists List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px'
      }}>
        <div style={{
          display: 'grid',
          gap: '16px'
        }}>
          {mediaList.journalists.map((journalist, index) => (
            <div key={index} style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              padding: '20px',
              transition: 'all 0.2s'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '12px'
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Users size={20} color="white" />
                    </div>
                    <div style={{ flex: 1 }}>
                      {isEditing ? (
                        <input
                          type="text"
                          value={journalist.name}
                          onChange={(e) => updateJournalist(index, 'name', e.target.value)}
                          placeholder="Journalist Name"
                          style={{
                            fontSize: '16px',
                            fontWeight: '600',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            color: '#ffffff',
                            width: '100%'
                          }}
                        />
                      ) : (
                        <div style={{
                          fontSize: '16px',
                          fontWeight: '600',
                          color: '#ffffff'
                        }}>
                          {journalist.name}
                        </div>
                      )}
                      <div style={{
                        display: 'flex',
                        gap: '12px',
                        marginTop: '4px'
                      }}>
                        {isEditing ? (
                          <>
                            <input
                              type="text"
                              value={journalist.outlet}
                              onChange={(e) => updateJournalist(index, 'outlet', e.target.value)}
                              placeholder="Outlet"
                              style={{
                                fontSize: '14px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '4px',
                                padding: '2px 6px',
                                color: '#9ca3af'
                              }}
                            />
                            <input
                              type="text"
                              value={journalist.beat}
                              onChange={(e) => updateJournalist(index, 'beat', e.target.value)}
                              placeholder="Beat"
                              style={{
                                fontSize: '14px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '4px',
                                padding: '2px 6px',
                                color: '#9ca3af'
                              }}
                            />
                          </>
                        ) : (
                          <>
                            <span style={{ fontSize: '14px', color: '#60a5fa' }}>
                              {journalist.outlet}
                            </span>
                            <span style={{ fontSize: '14px', color: '#9ca3af' }}>
                              • {journalist.beat}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  {isEditing && (
                    <div style={{
                      marginTop: '12px',
                      paddingTop: '12px',
                      borderTop: '1px solid rgba(255, 255, 255, 0.05)'
                    }}>
                      <input
                        type="email"
                        value={journalist.email}
                        onChange={(e) => updateJournalist(index, 'email', e.target.value)}
                        placeholder="Email address"
                        style={{
                          width: '100%',
                          padding: '8px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '4px',
                          color: '#e5e7eb',
                          fontSize: '13px',
                          marginBottom: '8px'
                        }}
                      />
                      <textarea
                        value={journalist.notes}
                        onChange={(e) => updateJournalist(index, 'notes', e.target.value)}
                        placeholder="Notes about this journalist..."
                        style={{
                          width: '100%',
                          padding: '8px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '4px',
                          color: '#e5e7eb',
                          fontSize: '13px',
                          resize: 'vertical',
                          minHeight: '60px'
                        }}
                      />
                    </div>
                  )}
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  {isEditing ? (
                    <select
                      value={journalist.priority}
                      onChange={(e) => updateJournalist(index, 'priority', e.target.value)}
                      style={{
                        padding: '6px 12px',
                        background: `${getPriorityColor(journalist.priority)}22`,
                        color: getPriorityColor(journalist.priority),
                        border: `1px solid ${getPriorityColor(journalist.priority)}44`,
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="Tier 1">Tier 1</option>
                      <option value="Tier 2">Tier 2</option>
                      <option value="Tier 3">Tier 3</option>
                    </select>
                  ) : (
                    <div style={{
                      padding: '6px 12px',
                      background: `${getPriorityColor(journalist.priority)}22`,
                      color: getPriorityColor(journalist.priority),
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {journalist.priority}
                    </div>
                  )}
                  
                  {isEditing && (
                    <button
                      onClick={() => removeJournalist(index)}
                      style={{
                        padding: '6px',
                        background: 'transparent',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '4px',
                        color: '#ef4444',
                        cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SimplifiedMediaList;