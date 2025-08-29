import React, { useState, useEffect } from 'react';
import {
  Package,
  FileText,
  Users,
  Calendar,
  MessageSquare,
  Target,
  CheckCircle,
  Clock,
  Sparkles,
  ArrowRight,
  Zap
} from 'lucide-react';

// Material creation progress and preview component
const NivMaterialCreationProgress = ({ 
  isCreating = false,
  materialsBeingCreated = [],
  createdMaterials = [],
  onMaterialClick,
  className = ''
}) => {
  const [animationStep, setAnimationStep] = useState(0);
  const [showPreview, setShowPreview] = useState(false);

  // Standard materials that Niv creates
  const standardMaterials = [
    {
      id: 'press-release',
      title: 'Press Release',
      icon: FileText,
      description: 'Professional announcement with headline, quotes, and boilerplate',
      estimatedTime: '2-3 minutes',
      color: '#3b82f6'
    },
    {
      id: 'media-list',
      title: 'Strategic Media Plan',
      icon: Users,
      description: '25+ targeted journalists with beats and pitch angles',
      estimatedTime: '3-4 minutes',
      color: '#8b5cf6'
    },
    {
      id: 'strategy-plan',
      title: 'Communications Plan',
      icon: Calendar,
      description: '6-8 week campaign timeline with phases and tactics',
      estimatedTime: '4-5 minutes',
      color: '#10b981'
    },
    {
      id: 'messaging-framework',
      title: 'Messaging Framework',
      icon: Target,
      description: 'Core messages, proof points, and audience angles',
      estimatedTime: '2-3 minutes',
      color: '#f59e0b'
    },
    {
      id: 'social-content',
      title: 'Social Media Content',
      icon: MessageSquare,
      description: 'Platform-specific posts with hashtags and visuals',
      estimatedTime: '2-3 minutes',
      color: '#ec4899'
    },
    {
      id: 'faq-document',
      title: 'FAQ Document',
      icon: FileText,
      description: '15+ anticipated questions with approved responses',
      estimatedTime: '3-4 minutes',
      color: '#6366f1'
    }
  ];

  // Animation for creation process
  useEffect(() => {
    if (isCreating) {
      const interval = setInterval(() => {
        setAnimationStep(prev => (prev + 1) % standardMaterials.length);
      }, 800);
      return () => clearInterval(interval);
    }
  }, [isCreating, standardMaterials.length]);

  // Auto-show preview when materials are created
  useEffect(() => {
    if (createdMaterials.length > 0) {
      setShowPreview(true);
    }
  }, [createdMaterials]);

  if (!isCreating && createdMaterials.length === 0) {
    return null;
  }

  return (
    <div className={`niv-material-creation-progress ${className}`}>
      {/* Creation in Progress */}
      {isCreating && (
        <div style={{
          background: 'rgba(0, 0, 0, 0.95)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '12px',
          padding: '24px',
          margin: '16px 0',
          animation: 'slideInUp 0.5s ease-out'
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '20px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'pulse 2s infinite'
            }}>
              <Package size={20} color="white" />
            </div>
            <div>
              <h3 style={{
                margin: 0,
                fontSize: '16px',
                fontWeight: '600',
                color: '#e8e8e8'
              }}>
                Niv is Creating Your PR Materials
              </h3>
              <p style={{
                margin: 0,
                fontSize: '12px',
                color: '#10b981'
              }}>
                Comprehensive package with 6 essential items
              </p>
            </div>
          </div>

          {/* Progress Indicator */}
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '20px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '12px'
            }}>
              <Zap size={16} color="#10b981" />
              <span style={{
                fontSize: '14px',
                color: '#6ee7b7',
                fontWeight: '500'
              }}>
                Creating materials with strategic precision
              </span>
            </div>
            
            {/* Animated progress bar */}
            <div style={{
              width: '100%',
              height: '4px',
              background: 'rgba(16, 185, 129, 0.2)',
              borderRadius: '2px',
              overflow: 'hidden',
              position: 'relative'
            }}>
              <div style={{
                width: '40%',
                height: '100%',
                background: 'linear-gradient(90deg, #10b981, #6ee7b7)',
                borderRadius: '2px',
                animation: 'shimmer 2s infinite ease-in-out'
              }} />
            </div>
          </div>

          {/* Materials Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '12px'
          }}>
            {standardMaterials.map((material, index) => {
              const Icon = material.icon;
              const isCurrentlyCreating = index === animationStep;
              const isCompleted = index < animationStep;
              
              return (
                <div
                  key={material.id}
                  style={{
                    background: isCurrentlyCreating 
                      ? 'rgba(16, 185, 129, 0.15)' 
                      : isCompleted 
                      ? 'rgba(16, 185, 129, 0.1)'
                      : 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${isCurrentlyCreating 
                      ? 'rgba(16, 185, 129, 0.4)' 
                      : isCompleted 
                      ? 'rgba(16, 185, 129, 0.3)'
                      : 'rgba(255, 255, 255, 0.1)'}`,
                    borderRadius: '8px',
                    padding: '12px',
                    transition: 'all 0.3s ease',
                    transform: isCurrentlyCreating ? 'scale(1.02)' : 'scale(1)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {/* Animated shimmer for current item */}
                  {isCurrentlyCreating && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: '-100%',
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.3), transparent)',
                      animation: 'slideRight 1.5s infinite'
                    }} />
                  )}

                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px'
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      background: isCompleted 
                        ? '#10b981' 
                        : isCurrentlyCreating 
                        ? material.color 
                        : 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative'
                    }}>
                      {isCompleted ? (
                        <CheckCircle size={16} color="white" />
                      ) : (
                        <Icon size={16} color={isCurrentlyCreating ? 'white' : '#9ca3af'} />
                      )}
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '13px',
                        fontWeight: '600',
                        color: isCurrentlyCreating || isCompleted ? '#e8e8e8' : '#9ca3af',
                        marginBottom: '4px'
                      }}>
                        {material.title}
                        {isCurrentlyCreating && (
                          <span style={{
                            marginLeft: '8px',
                            fontSize: '11px',
                            color: '#6ee7b7'
                          }}>
                            Creating...
                          </span>
                        )}
                        {isCompleted && (
                          <span style={{
                            marginLeft: '8px',
                            fontSize: '11px',
                            color: '#6ee7b7'
                          }}>
                            ✓ Complete
                          </span>
                        )}
                      </div>
                      <div style={{
                        fontSize: '11px',
                        color: '#6b7280',
                        lineHeight: 1.3,
                        marginBottom: '4px'
                      }}>
                        {material.description}
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '10px',
                        color: isCurrentlyCreating ? '#6ee7b7' : '#6b7280'
                      }}>
                        <Clock size={10} />
                        {material.estimatedTime}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Estimated completion time */}
          <div style={{
            marginTop: '16px',
            padding: '12px',
            background: 'rgba(59, 130, 246, 0.1)',
            borderRadius: '6px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '12px',
              color: '#60a5fa',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}>
              <Clock size={12} />
              Estimated completion: 15-20 minutes • Check sidebar for updates
            </div>
          </div>
        </div>
      )}

      {/* Created Materials Preview */}
      {!isCreating && createdMaterials.length > 0 && showPreview && (
        <div style={{
          background: 'rgba(0, 0, 0, 0.95)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '12px',
          padding: '20px',
          margin: '16px 0',
          animation: 'slideInUp 0.5s ease-out'
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <CheckCircle size={24} color="#10b981" />
              <div>
                <h3 style={{
                  margin: 0,
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#e8e8e8'
                }}>
                  PR Materials Created Successfully
                </h3>
                <p style={{
                  margin: 0,
                  fontSize: '12px',
                  color: '#6ee7b7'
                }}>
                  {createdMaterials.length} items ready for review and editing
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowPreview(false)}
              style={{
                background: 'none',
                border: 'none',
                color: '#9ca3af',
                cursor: 'pointer',
                fontSize: '20px',
                padding: '4px'
              }}
            >
              ×
            </button>
          </div>

          {/* Success message */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(59, 130, 246, 0.1))',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '16px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              color: '#6ee7b7'
            }}>
              <Sparkles size={14} />
              <span>All materials are now available in your workspace. Click any item to open and edit.</span>
              <ArrowRight size={14} />
            </div>
          </div>

          {/* Created materials grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '12px'
          }}>
            {createdMaterials.map((material, index) => {
              const standardMaterial = standardMaterials.find(s => s.id === material.type) || {
                icon: FileText,
                color: '#3b82f6'
              };
              const Icon = standardMaterial.icon;
              
              return (
                <button
                  key={material.id || index}
                  onClick={() => onMaterialClick?.(material)}
                  style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '8px',
                    padding: '12px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    color: 'inherit'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(16, 185, 129, 0.15)';
                    e.target.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(16, 185, 129, 0.1)';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px'
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      background: '#10b981',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Icon size={16} color="white" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#e8e8e8',
                        marginBottom: '4px'
                      }}>
                        {material.title}
                      </div>
                      <div style={{
                        fontSize: '11px',
                        color: '#6ee7b7'
                      }}>
                        Ready to edit • Click to open
                      </div>
                    </div>
                    <ArrowRight size={14} color="#6ee7b7" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }

        @keyframes slideRight {
          0% { left: -100%; }
          100% { left: 100%; }
        }
      `}</style>
    </div>
  );
};

export default NivMaterialCreationProgress;