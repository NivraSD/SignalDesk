import React, { useState } from 'react';
import {
  TrendingUp,
  Eye,
  Megaphone,
  ChevronRight,
  AlertTriangle,
  Target,
  MessageSquare,
  Lightbulb
} from 'lucide-react';

interface IntelligenceSynthesisDisplayProps {
  synthesis: any;
  loading?: boolean;
}

// TEXTURE & MATERIAL SYSTEM
// ==========================

// SVG Noise Filter - Subtle film grain texture
const NoiseFilter = () => (
  <svg className="absolute w-0 h-0">
    <defs>
      <filter id="noise-texture">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
        <feComponentTransfer>
          <feFuncA type="discrete" tableValues="0 0.015" />
        </feComponentTransfer>
        <feBlend mode="overlay" in="SourceGraphic" />
      </filter>
      <filter id="noise-texture-subtle">
        <feTurbulence type="fractalNoise" baseFrequency="1.2" numOctaves="3" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
        <feComponentTransfer>
          <feFuncA type="discrete" tableValues="0 0.008" />
        </feComponentTransfer>
        <feBlend mode="overlay" in="SourceGraphic" />
      </filter>
    </defs>
  </svg>
);

// Scanline Pattern Generator
const ScanlinePattern = () => (
  <div
    className="absolute inset-0 pointer-events-none opacity-[0.03]"
    style={{
      backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(255, 255, 255, 0.03) 1px, rgba(255, 255, 255, 0.03) 2px)',
      mixBlendMode: 'overlay',
    }}
  />
);

// Dot Grid Pattern
const DotGridPattern = () => (
  <div
    className="absolute inset-0 pointer-events-none opacity-[0.02]"
    style={{
      backgroundImage: 'radial-gradient(circle, rgba(184, 160, 200, 0.15) 1px, transparent 1px)',
      backgroundSize: '16px 16px',
      mixBlendMode: 'overlay',
    }}
  />
);

// Edge Ticks - Bloomberg style markers
const EdgeTicks = ({ variant = 'default' }: { variant?: string }) => {
  const color = variant === 'accent' ? 'rgba(184, 160, 200, 0.2)' : 'rgba(255, 255, 255, 0.08)';
  return (
    <>
      {/* Top-left corner ticks */}
      <div className="absolute top-0 left-0 w-2 h-px" style={{ background: color }} />
      <div className="absolute top-0 left-0 w-px h-2" style={{ background: color }} />

      {/* Top-right corner ticks */}
      <div className="absolute top-0 right-0 w-2 h-px" style={{ background: color }} />
      <div className="absolute top-0 right-0 w-px h-2" style={{ background: color }} />

      {/* Bottom-left corner ticks */}
      <div className="absolute bottom-0 left-0 w-2 h-px" style={{ background: color }} />
      <div className="absolute bottom-0 left-0 w-px h-2" style={{ background: color }} />

      {/* Bottom-right corner ticks */}
      <div className="absolute bottom-0 right-0 w-2 h-px" style={{ background: color }} />
      <div className="absolute bottom-0 right-0 w-px h-2" style={{ background: color }} />
    </>
  );
};

// DESIGN SYSTEM COMPONENTS
// ========================

// Typography Scale - Bloomberg Editorial Style
const Typography = {
  // Level 1: Section Headers - Wide tracking, tight leading
  SectionHeader: ({ children, icon: Icon, className = '' }: any) => (
    <div className={`flex items-center gap-3 mb-5 ${className}`}>
      {Icon && <Icon className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--burnt-orange)' }} />}
      <h2 className="text-[10px] font-normal uppercase tracking-[0.15em] leading-none text-white">
        {children}
      </h2>
    </div>
  ),

  // Level 2: Subsection Headers
  SubsectionHeader: ({ children, className = '', color = 'white' }: any) => (
    <h3 className={`text-[9px] font-normal uppercase tracking-[0.12em] leading-none mb-3 ${className}`} style={{ color }}>
      {children}
    </h3>
  ),

  // Level 3: Card Titles - Tighter leading, more space
  CardTitle: ({ children, className = '', style: customStyle = {} }: any) => (
    <h4 className={`text-[15px] font-light leading-[1.3] mb-2 text-white ${className}`} style={customStyle}>
      {children}
    </h4>
  ),

  // Level 4: Primary Body
  BodyPrimary: ({ children, className = '' }: any) => (
    <p className={`text-[14px] font-light leading-[1.6] text-gray-200 ${className}`}>
      {children}
    </p>
  ),

  // Level 5: Secondary Body
  BodySecondary: ({ children, className = '' }: any) => (
    <p className={`text-[13px] font-light leading-[1.5] text-gray-300 ${className}`}>
      {children}
    </p>
  ),

  // Level 6: Caption/Meta
  Caption: ({ children, className = '' }: any) => (
    <p className={`text-[11px] font-light leading-[1.4] tracking-[0.02em] text-gray-400 ${className}`}>
      {children}
    </p>
  ),
};

// Shadow System - Depth hierarchy with inset shadows for material depth
const shadows = {
  low: '0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.02)',
  medium: '0 4px 6px rgba(0, 0, 0, 0.4), 0 2px 4px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
  high: '0 10px 20px rgba(0, 0, 0, 0.5), 0 6px 6px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.04)',
  raised: '0 20px 40px rgba(0, 0, 0, 0.6), 0 10px 10px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
  inset: 'inset 0 2px 4px rgba(0, 0, 0, 0.3), inset 0 1px 2px rgba(0, 0, 0, 0.2)',
};

// Card Component System - With depth and layering
const Card = {
  // Base container with depth
  Container: ({ children, variant = 'default', elevation = 'low', className = '', style: customStyle = {}, texture = true }: any) => {
    const variants = {
      default: {
        bg: 'linear-gradient(135deg, rgba(20, 20, 25, 0.65) 0%, rgba(20, 20, 25, 0.55) 100%)',
        border: 'linear-gradient(135deg, rgba(184, 160, 200, 0.18), rgba(184, 160, 200, 0.12))',
        innerGlow: 'rgba(184, 160, 200, 0.05)',
        glow: 'none',
        edgeLight: 'rgba(255, 255, 255, 0.04)',
      },
      accent: {
        bg: 'linear-gradient(135deg, rgba(184, 160, 200, 0.12) 0%, rgba(184, 160, 200, 0.06) 100%)',
        border: 'linear-gradient(135deg, rgba(184, 160, 200, 0.4), rgba(184, 160, 200, 0.25))',
        innerGlow: 'rgba(184, 160, 200, 0.08)',
        glow: '0 0 20px rgba(184, 160, 200, 0.1)',
        edgeLight: 'rgba(184, 160, 200, 0.15)',
      },
      critical: {
        bg: 'linear-gradient(135deg, rgba(255, 68, 68, 0.12) 0%, rgba(255, 68, 68, 0.06) 100%)',
        border: 'linear-gradient(135deg, rgba(255, 68, 68, 0.5), rgba(255, 68, 68, 0.3))',
        innerGlow: 'rgba(255, 68, 68, 0.1)',
        glow: '0 0 15px rgba(255, 68, 68, 0.15)',
        edgeLight: 'rgba(255, 68, 68, 0.2)',
      },
      warning: {
        bg: 'linear-gradient(135deg, rgba(255, 165, 0, 0.12) 0%, rgba(255, 165, 0, 0.06) 100%)',
        border: 'linear-gradient(135deg, rgba(255, 165, 0, 0.5), rgba(255, 165, 0, 0.3))',
        innerGlow: 'rgba(255, 165, 0, 0.08)',
        glow: '0 0 15px rgba(255, 165, 0, 0.12)',
        edgeLight: 'rgba(255, 165, 0, 0.18)',
      },
      glass: {
        bg: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
        border: 'linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.08))',
        innerGlow: 'rgba(255, 255, 255, 0.03)',
        glow: 'none',
        edgeLight: 'rgba(255, 255, 255, 0.06)',
      },
    };
    const variantStyle = variants[variant as keyof typeof variants];
    const shadow = shadows[elevation as keyof typeof shadows];

    return (
      <div
        className={`rounded-lg border relative overflow-hidden ${className}`}
        style={{
          background: variantStyle.bg,
          borderImage: `${variantStyle.border} 1`,
          boxShadow: `${shadow}, ${variantStyle.glow}`,
          
          ...customStyle
        }}
      >
        {/* Edge lighting - top and left highlight */}
        <div
          className="absolute top-0 left-0 right-0 h-px pointer-events-none"
          style={{
            background: `linear-gradient(90deg, transparent, ${variantStyle.edgeLight}, transparent)`,
          }}
        />
        <div
          className="absolute top-0 left-0 bottom-0 w-px pointer-events-none"
          style={{
            background: `linear-gradient(180deg, transparent, ${variantStyle.edgeLight}, transparent)`,
          }}
        />

        {/* Inner glow for depth */}
        <div
          className="absolute inset-0 pointer-events-none rounded-lg"
          style={{
            boxShadow: `inset 0 0 30px ${variantStyle.innerGlow}`,
            opacity: 0.6,
          }}
        />

        {/* Corner ticks for premium feel */}
        <EdgeTicks variant={variant} />

        {/* Subtle radial gradient overlay for spotlight effect */}
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            background: 'radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.03) 0%, transparent 50%)',
          }}
        />

        {/* Content with relative positioning */}
        <div className="relative z-10">
          {children}
        </div>
      </div>
    );
  },

  // Floating card with subtle rotation
  Floating: ({ children, rotation = 0, elevation = 'medium', className = '' }: any) => (
    <Card.Container
      elevation={elevation}
      variant="glass"
      className={className}
      style={{
        
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {children}
    </Card.Container>
  ),

  // List item with proper spacing
  ListItem: ({ children, icon: Icon, iconColor = 'var(--mauve-light)', className = '' }: any) => (
    <li className={`flex items-start gap-2.5 mb-2 last:mb-0 ${className}`}>
      {Icon && <Icon className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: iconColor }} />}
      <Typography.BodySecondary className="flex-1">{children}</Typography.BodySecondary>
    </li>
  ),
};

// Asymmetric Layout System - Break the grid
const Layout = {
  // Masonry-style asymmetric grid
  Masonry: ({ children, className = '' }: any) => (
    <div className={`grid gap-5 ${className}`} style={{
      gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
      gridAutoFlow: 'dense',
    }}>
      {children}
    </div>
  ),

  // Staggered columns with varying widths
  Staggered: ({ children, className = '' }: any) => (
    <div className={`flex flex-col lg:flex-row gap-6 ${className}`}>
      {children}
    </div>
  ),

  // Overlapping cards container
  Layered: ({ children, className = '' }: any) => (
    <div className={`relative ${className}`} style={{ minHeight: '100px' }}>
      {children}
    </div>
  ),
};

// Section Container - Glassmorphic with depth and texture
const Section = ({ children, className = '', variant = 'default' }: any) => {
  const variants = {
    default: {
      bg: 'linear-gradient(145deg, rgba(17, 17, 20, 0.75) 0%, rgba(17, 17, 20, 0.65) 100%)',
      border: 'linear-gradient(145deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.06))',
      innerGlow: 'rgba(184, 160, 200, 0.03)',
      edgeLight: 'rgba(255, 255, 255, 0.05)',
    },
    elevated: {
      bg: 'linear-gradient(145deg, rgba(17, 17, 20, 0.9) 0%, rgba(17, 17, 20, 0.8) 100%)',
      border: 'linear-gradient(145deg, rgba(184, 160, 200, 0.2), rgba(184, 160, 200, 0.12))',
      innerGlow: 'rgba(184, 160, 200, 0.05)',
      edgeLight: 'rgba(184, 160, 200, 0.08)',
    },
    minimal: {
      bg: 'transparent',
      border: 'transparent',
      innerGlow: 'transparent',
      edgeLight: 'transparent',
    },
  };
  const style = variants[variant as keyof typeof variants];

  return (
    <div
      className={`rounded-xl p-6 border relative overflow-hidden ${className}`}
      style={{
        background: style.bg,
        borderImage: variant !== 'minimal' ? `${style.border} 1` : 'none',
        boxShadow: variant !== 'minimal' ? shadows.low : 'none',
        
      }}
    >
      {/* Scanlines for terminal aesthetic */}
      {variant !== 'minimal' && <ScanlinePattern />}

      {/* Edge lighting */}
      {variant !== 'minimal' && (
        <>
          <div
            className="absolute top-0 left-0 right-0 h-px pointer-events-none"
            style={{
              background: `linear-gradient(90deg, transparent, ${style.edgeLight}, transparent)`,
            }}
          />
          <div
            className="absolute top-0 left-0 bottom-0 w-px pointer-events-none"
            style={{
              background: `linear-gradient(180deg, transparent, ${style.edgeLight}, transparent)`,
            }}
          />
        </>
      )}

      {/* Inner glow */}
      {variant !== 'minimal' && (
        <div
          className="absolute inset-0 pointer-events-none rounded-xl"
          style={{
            boxShadow: `inset 0 0 40px ${style.innerGlow}`,
            opacity: 0.5,
          }}
        />
      )}

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

// MAIN COMPONENT
// ==============

const IntelligenceSynthesisDisplay: React.FC<IntelligenceSynthesisDisplayProps> = ({ synthesis, loading }) => {
  const [expandedDevelopment, setExpandedDevelopment] = useState<number | null>(0);

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-xl p-8 animate-pulse">
        <div className="h-8 bg-gray-800 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-800 rounded w-full"></div>
          <div className="h-4 bg-gray-800 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  if (!synthesis?.synthesis) {
    return (
      <div className="bg-gray-900 rounded-lg p-8 text-center border border-gray-800">
        <Eye className="w-12 h-12 text-gray-600 mx-auto mb-3" />
        <Typography.SubsectionHeader className="text-gray-400 mb-2">
          No Intelligence Available
        </Typography.SubsectionHeader>
        <Typography.Caption>Run the pipeline to generate market intelligence</Typography.Caption>
      </div>
    );
  }

  const { synthesis: data } = synthesis;

  // Handle GEO format (key_findings, competitive_analysis, source_strategy)
  if (data.key_findings || data.competitive_analysis || data.source_strategy) {
    return (
      <div className="space-y-7">
        {/* Include noise filters globally */}
        <NoiseFilter />
        {/* Executive Summary - Hero with elevation */}
        {data.executive_summary && (
          <Section variant="elevated">
            <Typography.SectionHeader icon={Eye}>Executive Summary</Typography.SectionHeader>
            <Typography.BodyPrimary className="whitespace-pre-wrap">
              {data.executive_summary}
            </Typography.BodyPrimary>
          </Section>
        )}

        {/* Key Findings - Asymmetric layered cards */}
        {data.key_findings && data.key_findings.length > 0 && (
          <Section variant="minimal">
            <Typography.SectionHeader icon={Lightbulb}>Key Findings</Typography.SectionHeader>
            <Layout.Masonry className="mt-6">
              {data.key_findings.map((finding: any, i: number) => {
                const isCritical = finding.priority === 'critical';
                const rotation = i % 3 === 0 ? -0.5 : i % 3 === 1 ? 0.5 : 0;

                return (
                  <Card.Container
                    key={i}
                    variant={isCritical ? 'critical' : 'accent'}
                    elevation={isCritical ? 'medium' : 'low'}
                    className="p-5 hover:scale-[1.01] transition-transform duration-300"
                    style={{
                      
                      gridColumn: i === 0 ? 'span 1' : 'auto',
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <span
                        className="text-[20px] font-extralight leading-none flex-shrink-0 opacity-40"
                        style={{
                          color: isCritical ? '#ff4444' : 'var(--mauve)',
                          fontVariantNumeric: 'tabular-nums'
                        }}
                      >
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <div className="flex-1 min-w-0">
                        <Typography.CardTitle className="mb-3">{finding.title}</Typography.CardTitle>
                        <Typography.BodyPrimary className="mb-3">{finding.insight}</Typography.BodyPrimary>
                        <div
                          className="pt-3 mt-3"
                          style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}
                        >
                          <Typography.Caption>{finding.evidence}</Typography.Caption>
                        </div>
                      </div>
                    </div>
                  </Card.Container>
                );
              })}
            </Layout.Masonry>
          </Section>
        )}

        {/* Competitive Analysis - Staggered layout */}
        {data.competitive_analysis && (
          <Section variant="elevated">
            <Typography.SectionHeader icon={Target}>Competitive Analysis</Typography.SectionHeader>

            {data.competitive_analysis.dominant_players && data.competitive_analysis.dominant_players.length > 0 && (
              <div className="mb-6">
                <Typography.SubsectionHeader>Dominant Players</Typography.SubsectionHeader>
                <div className="grid gap-4 mt-4" style={{
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
                }}>
                  {data.competitive_analysis.dominant_players.map((player: any, i: number) => (
                    <Card.Container
                      key={i}
                      variant="glass"
                      elevation="low"
                      className="p-4"
                      style={{
                        transform: `translateY(${i % 2 === 0 ? '0' : '8px'})`,
                      }}
                    >
                      <div className="flex items-start gap-3 mb-2">
                        <span
                          className="text-[16px] font-extralight opacity-30"
                          style={{ fontVariantNumeric: 'tabular-nums' }}
                        >
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <Typography.CardTitle className="mb-0 flex-1">{player.name}</Typography.CardTitle>
                      </div>
                      {player.platforms && (
                        <Typography.Caption className="mb-2 ml-9">
                          {player.platforms.join(' / ')}
                        </Typography.Caption>
                      )}
                      <Typography.BodySecondary className="ml-9">{player.visibility}</Typography.BodySecondary>
                    </Card.Container>
                  ))}
                </div>
              </div>
            )}

            <Layout.Staggered>
              {data.competitive_analysis.success_patterns && (
                <Card.Container variant="accent" elevation="medium" className="p-5 flex-1">
                  <Typography.SubsectionHeader color="var(--mauve-light)">
                    Success Patterns
                  </Typography.SubsectionHeader>
                  <Typography.BodySecondary>{data.competitive_analysis.success_patterns}</Typography.BodySecondary>
                </Card.Container>
              )}

              {data.competitive_analysis.gaps_for_target && (
                <Card.Container variant="accent" elevation="medium" className="p-5 flex-1" style={{
                  transform: 'translateY(12px)',
                }}>
                  <Typography.SubsectionHeader color="var(--mauve)">
                    Gaps to Address
                  </Typography.SubsectionHeader>
                  <Typography.BodySecondary>{data.competitive_analysis.gaps_for_target}</Typography.BodySecondary>
                </Card.Container>
              )}
            </Layout.Staggered>
          </Section>
        )}

        {/* Source Strategy - Overlapping cards */}
        {data.source_strategy && (
          <Section variant="default">
            <Typography.SectionHeader icon={MessageSquare}>Source Strategy</Typography.SectionHeader>

            {data.source_strategy.priority_publications && data.source_strategy.priority_publications.length > 0 && (
              <div className="mb-6">
                <Typography.SubsectionHeader>Priority Publications</Typography.SubsectionHeader>
                <div className="grid gap-4 mt-4" style={{
                  gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
                }}>
                  {data.source_strategy.priority_publications.map((pub: any, i: number) => (
                    <Card.Container
                      key={i}
                      variant="glass"
                      elevation="low"
                      className="p-4 hover:scale-[1.02] transition-all duration-300"
                      style={{
                        
                      }}
                    >
                      <Typography.CardTitle style={{ color: 'var(--mauve)' }} className="mb-3">
                        {pub.name}
                      </Typography.CardTitle>
                      <Typography.BodySecondary className="mb-3">{pub.reasoning}</Typography.BodySecondary>
                      <div
                        className="pt-2 mt-2"
                        style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}
                      >
                        <Typography.Caption>Action: {pub.action}</Typography.Caption>
                      </div>
                    </Card.Container>
                  ))}
                </div>
              </div>
            )}

            {data.source_strategy.coverage_strategy && (
              <Card.Container variant="accent" elevation="medium" className="p-5">
                <Typography.SubsectionHeader>Coverage Strategy</Typography.SubsectionHeader>
                <Typography.BodySecondary>{data.source_strategy.coverage_strategy}</Typography.BodySecondary>
              </Card.Container>
            )}
          </Section>
        )}

        {/* Strategic Actions - Layered cards with depth */}
        {data.strategic_actions && data.strategic_actions.length > 0 && (
          <Section variant="minimal">
            <Typography.SectionHeader icon={Megaphone}>Strategic Actions</Typography.SectionHeader>
            <div className="space-y-4 mt-6">
              {data.strategic_actions.map((action: any, i: number) => {
                const isCritical = action.priority === 'critical';
                return (
                  <Card.Container
                    key={i}
                    variant={isCritical ? 'critical' : 'accent'}
                    elevation={isCritical ? 'high' : 'medium'}
                    className="p-5 hover:scale-[1.005] transition-all duration-300"
                    style={{
                      transform: `translateX(${i % 2 === 0 ? '-4px' : '4px'})`,
                    }}
                  >
                    <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
                      <div className="flex items-start gap-3 flex-1">
                        <span
                          className="text-[18px] font-extralight opacity-30 leading-none"
                          style={{ fontVariantNumeric: 'tabular-nums' }}
                        >
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <Typography.CardTitle
                          className="mb-0 flex-1"
                          style={{ color: isCritical ? '#ff4444' : 'var(--pearl)' }}
                        >
                          {action.action}
                        </Typography.CardTitle>
                      </div>
                      <span
                        className="text-[9px] font-normal uppercase tracking-[0.1em] px-3 py-1.5 rounded-full border"
                        style={{
                          background: 'rgba(255, 255, 255, 0.03)',
                          borderColor: 'rgba(255, 255, 255, 0.1)',
                          color: 'var(--mauve)',
                        }}
                      >
                        {action.category}
                      </span>
                    </div>
                    <Typography.BodySecondary className="mb-4 ml-9">{action.reasoning}</Typography.BodySecondary>
                    <div
                      className="flex flex-wrap gap-x-6 gap-y-2 ml-9 pt-3"
                      style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}
                    >
                      <Typography.Caption>Impact: {action.expected_impact}</Typography.Caption>
                      <Typography.Caption>Timeline: {action.timeline}</Typography.Caption>
                    </div>
                  </Card.Container>
                );
              })}
            </div>
          </Section>
        )}

        {/* Metadata */}
        {synthesis.meta && (
          <div
            className="relative overflow-hidden flex flex-wrap justify-between items-center gap-3 px-4 py-2.5 rounded-lg border"
            style={{
              background: 'linear-gradient(135deg, rgba(17, 17, 20, 0.5), rgba(17, 17, 20, 0.3))',
              borderImage: 'linear-gradient(135deg, rgba(184, 160, 200, 0.15), rgba(184, 160, 200, 0.08)) 1',
              boxShadow: `${shadows.inset}, inset 0 0 20px rgba(184, 160, 200, 0.02)`,
              
            }}
          >
            {/* Subtle dot grid */}
            <DotGridPattern />

            {/* Edge highlight */}
            <div
              className="absolute top-0 left-0 right-0 h-px pointer-events-none"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(184, 160, 200, 0.08), transparent)' }}
            />

            <Typography.Caption>
              Analysis Date: {new Date(synthesis.meta.generated_at).toLocaleString()}
            </Typography.Caption>
            <Typography.Caption>
              Scenarios: {synthesis.meta.scenarios_analyzed} | Platforms: {synthesis.meta.platforms_analyzed}
            </Typography.Caption>
          </div>
        )}
      </div>
    );
  }

  // Handle PR-focused format
  if (data.executive_summary || data.competitive_moves || data.key_developments) {
    return (
      <div className="space-y-7">
        {/* Include noise filters globally */}
        <NoiseFilter />
        {/* Executive Summary - Hero elevated */}
        {data.executive_summary && (
          <Section variant="elevated">
            <Typography.SectionHeader icon={Eye}>Executive PR Summary</Typography.SectionHeader>
            <Typography.BodyPrimary className="whitespace-pre-wrap">
              {data.executive_summary}
            </Typography.BodyPrimary>
          </Section>
        )}

        {/* Key Developments - NEW EVENT-FOCUSED FORMAT */}
        {data.key_developments && data.key_developments.length > 0 && (
          <Section variant="minimal">
            <Typography.SectionHeader icon={Target}>Key Developments</Typography.SectionHeader>
            <Layout.Masonry className="mt-6">
              {data.key_developments.map((dev: any, i: number) => (
                <Card.Container key={i} variant="default" elevation="medium" className="p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="px-2 py-1 text-xs font-medium rounded bg-cyan-500/20 text-cyan-400">
                      {dev.category?.replace(/_/g, ' ')}
                    </span>
                    {dev.recency && (
                      <span className="px-2 py-1 text-xs font-medium rounded bg-gray-700 text-gray-300">
                        {dev.recency}
                      </span>
                    )}
                  </div>
                  <Typography.SubsectionHeader>{dev.event}</Typography.SubsectionHeader>
                  <Typography.BodySecondary className="mt-2">{dev.impact}</Typography.BodySecondary>
                  {dev.entity && (
                    <div className="mt-2 text-xs text-gray-500">Entity: {dev.entity}</div>
                  )}
                  {dev.source && (
                    <div className="mt-2">
                      <a href={dev.url} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-400 hover:text-cyan-300">
                        Source: {dev.source}
                      </a>
                    </div>
                  )}
                </Card.Container>
              ))}
            </Layout.Masonry>
          </Section>
        )}

        {/* Strategic Implications - NEW FORMAT */}
        {data.strategic_implications && (
          <Section variant="elevated">
            <Typography.SectionHeader icon={Lightbulb}>Strategic Implications</Typography.SectionHeader>
            <Typography.BodyPrimary className="whitespace-pre-wrap">
              {data.strategic_implications}
            </Typography.BodyPrimary>
          </Section>
        )}

        {/* Watching Closely - NEW FORMAT */}
        {data.watching_closely && data.watching_closely.length > 0 && (
          <Section variant="minimal">
            <Typography.SectionHeader icon={Eye}>Watching Closely</Typography.SectionHeader>
            <ul className="space-y-2 mt-4">
              {data.watching_closely.map((item: string, i: number) => (
                <Card.ListItem key={i} icon={AlertTriangle} iconColor="#fbbf24">
                  {item}
                </Card.ListItem>
              ))}
            </ul>
          </Section>
        )}

        {/* Competitive Intelligence - Asymmetric masonry (OLD FORMAT - keep for backward compat) */}
        {data.competitive_moves && (
          <Section variant="minimal">
            <Typography.SectionHeader icon={Target}>Competitive Intelligence</Typography.SectionHeader>
            <Layout.Masonry className="mt-6">
              {data.competitive_moves.immediate_threats?.length > 0 && (
                <Card.Container variant="critical" elevation="high" className="p-5">
                  <Typography.SubsectionHeader color="#ff4444">
                    Immediate Threats
                  </Typography.SubsectionHeader>
                  <ul className="space-y-2.5 mt-3">
                    {data.competitive_moves.immediate_threats.map((threat: string, i: number) => (
                      <Card.ListItem key={i} icon={AlertTriangle} iconColor="#ff4444">
                        {threat}
                      </Card.ListItem>
                    ))}
                  </ul>
                </Card.Container>
              )}

              {data.competitive_moves.opportunities?.length > 0 && (
                <Card.Container
                  variant="accent"
                  elevation="medium"
                  className="p-5"
                  style={{  }}
                >
                  <Typography.SubsectionHeader color="var(--mauve-light)">
                    PR Opportunities
                  </Typography.SubsectionHeader>
                  <ul className="space-y-2.5 mt-3">
                    {data.competitive_moves.opportunities.map((opp: string, i: number) => (
                      <Card.ListItem key={i} icon={Lightbulb} iconColor="var(--mauve-light)">
                        {opp}
                      </Card.ListItem>
                    ))}
                  </ul>
                </Card.Container>
              )}

              {data.competitive_moves.narrative_gaps?.length > 0 && (
                <Card.Container
                  variant="accent"
                  elevation="medium"
                  className="p-5"
                  style={{  }}
                >
                  <Typography.SubsectionHeader color="var(--mauve)">
                    Narrative Gaps
                  </Typography.SubsectionHeader>
                  <ul className="space-y-2.5 mt-3">
                    {data.competitive_moves.narrative_gaps.map((gap: string, i: number) => (
                      <Card.ListItem key={i} icon={MessageSquare} iconColor="var(--mauve)">
                        {gap}
                      </Card.ListItem>
                    ))}
                  </ul>
                </Card.Container>
              )}
            </Layout.Masonry>
          </Section>
        )}

        {/* Stakeholder Dynamics - Staggered layout */}
        {data.stakeholder_dynamics && (
          <Section variant="elevated">
            <Typography.SectionHeader icon={TrendingUp}>Stakeholder Dynamics</Typography.SectionHeader>
            <Layout.Staggered className="mt-6">
              {data.stakeholder_dynamics.key_movements?.length > 0 && (
                <Card.Container variant="accent" elevation="medium" className="p-5 flex-1">
                  <Typography.SubsectionHeader color="var(--mauve)">
                    Key Movements
                  </Typography.SubsectionHeader>
                  <ul className="space-y-2.5 mt-3">
                    {data.stakeholder_dynamics.key_movements.map((movement: string, i: number) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className="text-gray-400 mt-1 flex-shrink-0 text-xs">•</span>
                        <Typography.BodySecondary className="flex-1">{movement}</Typography.BodySecondary>
                      </li>
                    ))}
                  </ul>
                </Card.Container>
              )}

              {data.stakeholder_dynamics.influence_shifts?.length > 0 && (
                <Card.Container
                  variant="accent"
                  elevation="medium"
                  className="p-5 flex-1"
                  style={{ transform: 'translateY(16px)' }}
                >
                  <Typography.SubsectionHeader color="var(--mauve-light)">
                    Influence Shifts
                  </Typography.SubsectionHeader>
                  <ul className="space-y-2.5 mt-3">
                    {data.stakeholder_dynamics.influence_shifts.map((shift: string, i: number) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className="text-gray-400 mt-1 flex-shrink-0 text-xs">•</span>
                        <Typography.BodySecondary className="flex-1">{shift}</Typography.BodySecondary>
                      </li>
                    ))}
                  </ul>
                </Card.Container>
              )}
            </Layout.Staggered>

            {data.stakeholder_dynamics.engagement_opportunities?.length > 0 && (
              <Card.Container variant="accent" elevation="medium" className="p-5 mt-5" style={{  }}>
                <Typography.SubsectionHeader color="var(--mauve)">
                  Engagement Opportunities
                </Typography.SubsectionHeader>
                <ul className="space-y-2.5 mt-3">
                  {data.stakeholder_dynamics.engagement_opportunities.map((opp: string, i: number) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="text-gray-400 mt-1 flex-shrink-0 text-xs">•</span>
                      <Typography.BodySecondary className="flex-1">{opp}</Typography.BodySecondary>
                    </li>
                  ))}
                </ul>
              </Card.Container>
            )}
          </Section>
        )}

        {/* Media Landscape - Masonry asymmetric */}
        {data.media_landscape && (
          <Section variant="minimal">
            <Typography.SectionHeader icon={MessageSquare}>Media Landscape</Typography.SectionHeader>
            <Layout.Masonry className="mt-6">
              {data.media_landscape.trending_narratives?.length > 0 && (
                <Card.Container
                  variant="accent"
                  elevation="medium"
                  className="p-5"
                  style={{  }}
                >
                  <Typography.SubsectionHeader color="var(--mauve)">
                    Trending Narratives
                  </Typography.SubsectionHeader>
                  <ul className="space-y-2.5 mt-3">
                    {data.media_landscape.trending_narratives.map((narrative: string, i: number) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className="mt-1 flex-shrink-0 opacity-50">→</span>
                        <Typography.BodySecondary className="flex-1">{narrative}</Typography.BodySecondary>
                      </li>
                    ))}
                  </ul>
                </Card.Container>
              )}

              {data.media_landscape.sentiment_shifts?.length > 0 && (
                <Card.Container
                  variant="accent"
                  elevation="medium"
                  className="p-5"
                  style={{  }}
                >
                  <Typography.SubsectionHeader color="var(--mauve-light)">
                    Sentiment Shifts
                  </Typography.SubsectionHeader>
                  <ul className="space-y-2.5 mt-3">
                    {data.media_landscape.sentiment_shifts.map((shift: string, i: number) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className="text-gray-400 mt-1 flex-shrink-0 text-xs">•</span>
                        <Typography.BodySecondary className="flex-1">{shift}</Typography.BodySecondary>
                      </li>
                    ))}
                  </ul>
                </Card.Container>
              )}

              {data.media_landscape.journalist_interests?.length > 0 && (
                <Card.Container
                  variant="accent"
                  elevation="medium"
                  className="p-5"
                  style={{  }}
                >
                  <Typography.SubsectionHeader color="var(--mauve)">
                    Journalist Interests
                  </Typography.SubsectionHeader>
                  <ul className="space-y-2.5 mt-3">
                    {data.media_landscape.journalist_interests.map((interest: string, i: number) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className="mt-1 flex-shrink-0 opacity-50">→</span>
                        <Typography.BodySecondary className="flex-1">{interest}</Typography.BodySecondary>
                      </li>
                    ))}
                  </ul>
                </Card.Container>
              )}
            </Layout.Masonry>
          </Section>
        )}

        {/* PR Action Items - Layered with elevation hierarchy */}
        {data.pr_actions && (
          <Section variant="elevated">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <Typography.SectionHeader icon={Megaphone} className="mb-0">
                PR Action Items
              </Typography.SectionHeader>
              <Typography.Caption>Time-Based Priorities</Typography.Caption>
            </div>

            <div className="space-y-5">
              {data.pr_actions.immediate?.length > 0 && (
                <Card.Container variant="critical" elevation="high" className="p-5" style={{ transform: 'translateX(-6px)' }}>
                  <Typography.SubsectionHeader color="#ff4444">
                    Next 24-48 Hours
                  </Typography.SubsectionHeader>
                  <ul className="space-y-2.5 mt-3">
                    {data.pr_actions.immediate.map((action: string, i: number) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className="text-gray-400 mt-1 flex-shrink-0 text-xs">•</span>
                        <Typography.BodySecondary className="flex-1">{action}</Typography.BodySecondary>
                      </li>
                    ))}
                  </ul>
                </Card.Container>
              )}

              <Layout.Staggered>
                {data.pr_actions.this_week?.length > 0 && (
                  <Card.Container variant="accent" elevation="medium" className="p-5 flex-1">
                    <Typography.SubsectionHeader color="var(--mauve)">
                      This Week
                    </Typography.SubsectionHeader>
                    <ul className="space-y-2.5 mt-3">
                      {data.pr_actions.this_week.map((action: string, i: number) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <span className="text-gray-400 mt-1 flex-shrink-0 text-xs">•</span>
                          <Typography.BodySecondary className="flex-1">{action}</Typography.BodySecondary>
                        </li>
                      ))}
                    </ul>
                  </Card.Container>
                )}

                {data.pr_actions.strategic?.length > 0 && (
                  <Card.Container
                    variant="accent"
                    elevation="medium"
                    className="p-5 flex-1"
                    style={{ transform: 'translateY(10px)' }}
                  >
                    <Typography.SubsectionHeader color="var(--mauve-light)">
                      Strategic
                    </Typography.SubsectionHeader>
                    <ul className="space-y-2.5 mt-3">
                      {data.pr_actions.strategic.map((action: string, i: number) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <span className="text-gray-400 mt-1 flex-shrink-0 text-xs">•</span>
                          <Typography.BodySecondary className="flex-1">{action}</Typography.BodySecondary>
                        </li>
                      ))}
                    </ul>
                  </Card.Container>
                )}
              </Layout.Staggered>
            </div>
          </Section>
        )}

        {/* Risk Monitoring - Asymmetric masonry with high elevation */}
        {data.risk_alerts && (
          <Section variant="minimal">
            <Typography.SectionHeader icon={AlertTriangle}>Risk Monitoring</Typography.SectionHeader>
            <Layout.Masonry className="mt-6">
              {data.risk_alerts.crisis_signals?.length > 0 && (
                <Card.Container
                  variant="warning"
                  elevation="high"
                  className="p-5"
                  style={{  }}
                >
                  <Typography.SubsectionHeader color="#ffa500">
                    Crisis Signals
                  </Typography.SubsectionHeader>
                  <ul className="space-y-2.5 mt-3">
                    {data.risk_alerts.crisis_signals.map((signal: string, i: number) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className="mt-1 flex-shrink-0 opacity-60">!</span>
                        <Typography.BodySecondary className="flex-1">{signal}</Typography.BodySecondary>
                      </li>
                    ))}
                  </ul>
                </Card.Container>
              )}

              {data.risk_alerts.reputation_threats?.length > 0 && (
                <Card.Container
                  variant="critical"
                  elevation="raised"
                  className="p-5"
                  style={{  }}
                >
                  <Typography.SubsectionHeader color="#ff4444">
                    Reputation Threats
                  </Typography.SubsectionHeader>
                  <ul className="space-y-2.5 mt-3">
                    {data.risk_alerts.reputation_threats.map((threat: string, i: number) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className="mt-1 flex-shrink-0 opacity-60">×</span>
                        <Typography.BodySecondary className="flex-1">{threat}</Typography.BodySecondary>
                      </li>
                    ))}
                  </ul>
                </Card.Container>
              )}

              {data.risk_alerts.mitigation_steps?.length > 0 && (
                <Card.Container
                  variant="accent"
                  elevation="medium"
                  className="p-5"
                  style={{  }}
                >
                  <Typography.SubsectionHeader color="var(--mauve-light)">
                    Mitigation Steps
                  </Typography.SubsectionHeader>
                  <ul className="space-y-2.5 mt-3">
                    {data.risk_alerts.mitigation_steps.map((step: string, i: number) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className="mt-1 flex-shrink-0 opacity-50">→</span>
                        <Typography.BodySecondary className="flex-1">{step}</Typography.BodySecondary>
                      </li>
                    ))}
                  </ul>
                </Card.Container>
              )}
            </Layout.Masonry>
          </Section>
        )}

        {/* Metadata - Frosted footer */}
        {synthesis.metadata && (
          <div
            className="relative overflow-hidden flex flex-wrap justify-between items-center gap-4 px-5 py-3 rounded-lg border"
            style={{
              background: 'linear-gradient(135deg, rgba(17, 17, 20, 0.5), rgba(17, 17, 20, 0.3))',
              borderImage: 'linear-gradient(135deg, rgba(184, 160, 200, 0.15), rgba(184, 160, 200, 0.08)) 1',
              boxShadow: `${shadows.inset}, inset 0 0 20px rgba(184, 160, 200, 0.02)`,
              
            }}
          >
            {/* Subtle dot grid */}
            <DotGridPattern />

            {/* Edge highlight */}
            <div
              className="absolute top-0 left-0 right-0 h-px pointer-events-none"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(184, 160, 200, 0.08), transparent)' }}
            />

            <Typography.Caption>
              Analysis Date: {new Date(synthesis.metadata.timestamp || synthesis.metadata.analysis_date).toLocaleString()}
            </Typography.Caption>
            <Typography.Caption>
              Events Analyzed: {synthesis.metadata.events_analyzed || synthesis.metadata.articles_analyzed || 0}
            </Typography.Caption>
          </div>
        )}
      </div>
    );
  }

  // Fall back to original display for old format
  return (
    <div className="space-y-7">
      {/* Include noise filters globally */}
      <NoiseFilter />
      {/* Top Developments - Interactive cards with depth */}
      {data.top_developments && data.top_developments.length > 0 && (
        <Section variant="elevated">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <Typography.SectionHeader icon={TrendingUp} className="mb-0">
              Top Developments
            </Typography.SectionHeader>
            <Typography.Caption>This Week's Key Events</Typography.Caption>
          </div>

          <div className="space-y-4">
            {data.top_developments.map((dev: any, i: number) => (
              <Card.Container
                key={i}
                variant={expandedDevelopment === i ? 'accent' : 'glass'}
                elevation={expandedDevelopment === i ? 'high' : 'medium'}
                className="cursor-pointer transition-all duration-300 hover:scale-[1.005]"
                style={{
                  transform: `translateX(${i % 2 === 0 ? '-3px' : '3px'})`,
                }}
                onClick={() => setExpandedDevelopment(expandedDevelopment === i ? null : i)}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3 flex-wrap">
                        <span
                          className="text-[18px] font-extralight opacity-30"
                          style={{ fontVariantNumeric: 'tabular-nums' }}
                        >
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        {dev.entity && (
                          <span
                            className="text-[9px] font-normal uppercase tracking-[0.1em] px-3 py-1.5 rounded-full border"
                            style={{
                              background: 'rgba(255, 255, 255, 0.03)',
                              borderColor: 'rgba(255, 255, 255, 0.1)',
                              color: 'var(--mauve)',
                            }}
                          >
                            {dev.entity}
                          </span>
                        )}
                      </div>
                      <Typography.CardTitle className="mb-3">{dev.headline}</Typography.CardTitle>

                      {expandedDevelopment === i && (
                        <>
                          <Typography.BodyPrimary className="mb-4">{dev.details}</Typography.BodyPrimary>
                          {dev.impact && (
                            <Card.Container variant="accent" elevation="low" className="p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <AlertTriangle className="w-3.5 h-3.5" style={{ color: 'var(--mauve)' }} />
                                <Typography.SubsectionHeader className="mb-0">Impact</Typography.SubsectionHeader>
                              </div>
                              <Typography.BodySecondary>{dev.impact}</Typography.BodySecondary>
                            </Card.Container>
                          )}
                        </>
                      )}
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 text-gray-500 flex-shrink-0 transform transition-transform mt-1 ${
                        expandedDevelopment === i ? 'rotate-90' : ''
                      }`}
                    />
                  </div>
                </div>
              </Card.Container>
            ))}
          </div>
        </Section>
      )}

      {/* Narratives and Insights - Asymmetric masonry */}
      {data.narratives_and_insights && (
        <Section variant="minimal">
          <Typography.SectionHeader icon={Lightbulb}>Narratives & Insights</Typography.SectionHeader>

          <Layout.Masonry className="mt-6">
            {data.narratives_and_insights.dominant_narrative && (
              <Card.Container
                variant="accent"
                elevation="medium"
                className="p-5"
                style={{  }}
              >
                <div className="flex items-center gap-2.5 mb-3">
                  <MessageSquare className="w-4 h-4" style={{ color: 'var(--mauve)' }} />
                  <Typography.SubsectionHeader className="mb-0" color="var(--mauve)">
                    Dominant Narrative
                  </Typography.SubsectionHeader>
                </div>
                <Typography.BodyPrimary>{data.narratives_and_insights.dominant_narrative}</Typography.BodyPrimary>
              </Card.Container>
            )}

            {data.narratives_and_insights.hidden_patterns && (
              <Card.Container
                variant="accent"
                elevation="medium"
                className="p-5"
                style={{  }}
              >
                <div className="flex items-center gap-2.5 mb-3">
                  <Eye className="w-4 h-4" style={{ color: 'var(--mauve-light)' }} />
                  <Typography.SubsectionHeader className="mb-0" color="var(--mauve-light)">
                    Hidden Patterns
                  </Typography.SubsectionHeader>
                </div>
                <Typography.BodyPrimary>{data.narratives_and_insights.hidden_patterns}</Typography.BodyPrimary>
              </Card.Container>
            )}

            {data.narratives_and_insights.market_direction && (
              <Card.Container
                variant="accent"
                elevation="medium"
                className="p-5"
                style={{  }}
              >
                <div className="flex items-center gap-2.5 mb-3">
                  <TrendingUp className="w-4 h-4" style={{ color: 'var(--mauve)' }} />
                  <Typography.SubsectionHeader className="mb-0" color="var(--mauve)">
                    Market Direction
                  </Typography.SubsectionHeader>
                </div>
                <Typography.BodyPrimary>{data.narratives_and_insights.market_direction}</Typography.BodyPrimary>
              </Card.Container>
            )}

            {data.narratives_and_insights.power_dynamics && (
              <Card.Container
                variant="accent"
                elevation="medium"
                className="p-5"
                style={{  }}
              >
                <Typography.SubsectionHeader color="var(--mauve)">Power Dynamics</Typography.SubsectionHeader>
                <Typography.BodyPrimary className="mt-3">{data.narratives_and_insights.power_dynamics}</Typography.BodyPrimary>
              </Card.Container>
            )}
          </Layout.Masonry>
        </Section>
      )}

      {/* PR Implications - Staggered and masonry mix */}
      {data.pr_implications && (
        <Section variant="elevated">
          <Typography.SectionHeader icon={Megaphone}>PR Implications</Typography.SectionHeader>

          <Layout.Masonry className="mt-6">
            {data.pr_implications.immediate_opportunities && data.pr_implications.immediate_opportunities.length > 0 && (
              <Card.Container variant="accent" elevation="high" className="p-5" style={{  }}>
                <div className="flex items-center gap-2.5 mb-3">
                  <Target className="w-4 h-4" style={{ color: 'var(--mauve-light)' }} />
                  <Typography.SubsectionHeader className="mb-0" color="var(--mauve-light)">
                    Immediate Opportunities
                  </Typography.SubsectionHeader>
                </div>
                <ul className="space-y-2.5">
                  {data.pr_implications.immediate_opportunities.map((opp: string, i: number) => (
                    <Card.ListItem key={i} icon={ChevronRight} iconColor="var(--mauve-light)">
                      {opp}
                    </Card.ListItem>
                  ))}
                </ul>
              </Card.Container>
            )}

            {data.pr_implications.narrative_threats && data.pr_implications.narrative_threats.length > 0 && (
              <Card.Container variant="critical" elevation="raised" className="p-5" style={{  }}>
                <div className="flex items-center gap-2.5 mb-3">
                  <AlertTriangle className="w-4 h-4" style={{ color: '#ff4444' }} />
                  <Typography.SubsectionHeader className="mb-0" color="#ff4444">
                    Narrative Threats
                  </Typography.SubsectionHeader>
                </div>
                <ul className="space-y-2.5">
                  {data.pr_implications.narrative_threats.map((threat: string, i: number) => (
                    <Card.ListItem key={i} icon={ChevronRight} iconColor="#ff4444">
                      {threat}
                    </Card.ListItem>
                  ))}
                </ul>
              </Card.Container>
            )}

            {data.pr_implications.positioning_recommendations && data.pr_implications.positioning_recommendations.length > 0 && (
              <Card.Container variant="accent" elevation="medium" className="p-5" style={{  }}>
                <Typography.SubsectionHeader color="var(--mauve)">
                  Positioning Recommendations
                </Typography.SubsectionHeader>
                <ul className="space-y-2.5 mt-3">
                  {data.pr_implications.positioning_recommendations.map((rec: string, i: number) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="text-gray-400 mt-1 flex-shrink-0 opacity-50">→</span>
                      <Typography.BodySecondary className="flex-1">{rec}</Typography.BodySecondary>
                    </li>
                  ))}
                </ul>
              </Card.Container>
            )}

            {data.pr_implications.key_messages && data.pr_implications.key_messages.length > 0 && (
              <Card.Container variant="accent" elevation="medium" className="p-5" style={{  }}>
                <Typography.SubsectionHeader color="var(--mauve)">Key Messages</Typography.SubsectionHeader>
                <div className="space-y-3 mt-3">
                  {data.pr_implications.key_messages.map((msg: string, i: number) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-lg border"
                      style={{
                        background: 'rgba(184, 160, 200, 0.06)',
                        borderColor: 'rgba(184, 160, 200, 0.15)',
                      }}
                    >
                      <Typography.BodySecondary className="italic">"{msg}"</Typography.BodySecondary>
                    </div>
                  ))}
                </div>
              </Card.Container>
            )}
          </Layout.Masonry>
        </Section>
      )}

      {/* Metadata - Frosted footer */}
      {synthesis.metadata && (
        <div
          className="relative overflow-hidden flex flex-wrap justify-between items-center gap-4 px-5 py-3 rounded-lg border"
          style={{
            background: 'linear-gradient(135deg, rgba(17, 17, 20, 0.5), rgba(17, 17, 20, 0.3))',
            borderImage: 'linear-gradient(135deg, rgba(184, 160, 200, 0.15), rgba(184, 160, 200, 0.08)) 1',
            boxShadow: `${shadows.inset}, inset 0 0 20px rgba(184, 160, 200, 0.02)`,
            
          }}
        >
          {/* Subtle dot grid */}
          <DotGridPattern />

          {/* Edge highlight */}
          <div
            className="absolute top-0 left-0 right-0 h-px pointer-events-none"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(184, 160, 200, 0.08), transparent)' }}
          />

          <Typography.Caption>
            Analysis Date: {new Date(synthesis.metadata.timestamp || synthesis.metadata.analysis_date).toLocaleString()}
          </Typography.Caption>
          <Typography.Caption>
            Events Analyzed: {synthesis.metadata.events_analyzed || synthesis.metadata.articles_analyzed || 0}
          </Typography.Caption>
        </div>
      )}
    </div>
  );
};

export default IntelligenceSynthesisDisplay;
