import React from 'react';

// Neon-styled SVG icons to replace emojis

export const IntelligenceIcon = ({ size = 24, color = '#00ffcc' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" opacity="0.3"/>
    <circle cx="12" cy="12" r="6" stroke={color} strokeWidth="2" opacity="0.6"/>
    <circle cx="12" cy="12" r="2" fill={color}/>
    <path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </svg>
);

export const OpportunityIcon = ({ size = 24, color = '#ff00ff' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L15 9L22 10L17 15L18 22L12 18L6 22L7 15L2 10L9 9L12 2Z" 
          stroke={color} strokeWidth="2" fill="none" opacity="0.8"/>
    <path d="M12 2L15 9L22 10L17 15L18 22L12 18L6 22L7 15L2 10L9 9L12 2Z" 
          fill={color} opacity="0.2"/>
  </svg>
);

export const ExecutionIcon = ({ size = 24, color = '#00ff88' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 12L4 8C4 6 6 4 8 4H16C18 4 20 6 20 8V12" stroke={color} strokeWidth="2" opacity="0.6"/>
    <path d="M7 12L12 17L17 12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 17V22" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <circle cx="12" cy="22" r="2" fill={color}/>
  </svg>
);

export const MemoryIcon = ({ size = 24, color = '#8800ff' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="4" width="16" height="16" rx="2" stroke={color} strokeWidth="2" opacity="0.4"/>
    <rect x="8" y="8" width="8" height="8" rx="1" stroke={color} strokeWidth="2" opacity="0.6"/>
    <rect x="10" y="10" width="4" height="4" rx="0.5" fill={color}/>
    <path d="M2 8h2M2 12h2M2 16h2M20 8h2M20 12h2M20 16h2" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
    <path d="M8 2v2M12 2v2M16 2v2M8 20v2M12 20v2M16 20v2" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
  </svg>
);

export const RefreshIcon = ({ size = 24, color = '#00ff88', spinning = false }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={spinning ? 'spinning' : ''}
    style={spinning ? { animation: 'spin 1s linear infinite' } : {}}
  >
    <path d="M21 12a9 9 0 01-9 9 9 9 0 01-9-9 9 9 0 019-9c2.52 0 4.8 1.03 6.44 2.7L21 8" 
          stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M21 3v5h-5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const SettingsIcon = ({ size = 24, color = '#00ffcc' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2"/>
    <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24" 
          stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
  </svg>
);

export const CompetitorIcon = ({ size = 24, color = '#ff00ff' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 8L4 12L8 16" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.8"/>
    <path d="M16 8L20 12L16 16" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.8"/>
    <circle cx="12" cy="12" r="2" fill={color}/>
    <line x1="10" y1="12" x2="6" y2="12" stroke={color} strokeWidth="2" opacity="0.5"/>
    <line x1="14" y1="12" x2="18" y2="12" stroke={color} strokeWidth="2" opacity="0.5"/>
  </svg>
);

export const StakeholderIcon = ({ size = 24, color = '#00ffcc' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="8" r="3" stroke={color} strokeWidth="2" opacity="0.8"/>
    <circle cx="6" cy="16" r="2" stroke={color} strokeWidth="2" opacity="0.6"/>
    <circle cx="18" cy="16" r="2" stroke={color} strokeWidth="2" opacity="0.6"/>
    <path d="M12 11v3M12 14l-6 2M12 14l6 2" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
  </svg>
);

export const MediaIcon = ({ size = 24, color = '#00ff88' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="18" height="18" rx="2" stroke={color} strokeWidth="2" opacity="0.4"/>
    <rect x="6" y="6" width="12" height="4" fill={color} opacity="0.3"/>
    <line x1="6" y1="13" x2="18" y2="13" stroke={color} strokeWidth="2" opacity="0.6"/>
    <line x1="6" y1="16" x2="14" y2="16" stroke={color} strokeWidth="2" opacity="0.5"/>
    <line x1="6" y1="19" x2="16" y2="19" stroke={color} strokeWidth="2" opacity="0.4"/>
  </svg>
);

export const PredictiveIcon = ({ size = 24, color = '#8800ff' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" opacity="0.3"/>
    <path d="M12 6C15.31 6 18 8.69 18 12" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.8"/>
    <circle cx="12" cy="12" r="1" fill={color}/>
    <path d="M12 2v4M22 12h-4" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
    <circle cx="18" cy="12" r="2" fill={color} opacity="0.8"/>
  </svg>
);

export const RocketIcon = ({ size = 24, color = '#00ff88' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L8 10H16L12 2Z" fill={color} opacity="0.8"/>
    <rect x="10" y="10" width="4" height="8" fill={color} opacity="0.6"/>
    <path d="M8 14L6 20L10 18" fill={color} opacity="0.5"/>
    <path d="M16 14L18 20L14 18" fill={color} opacity="0.5"/>
    <circle cx="12" cy="14" r="1" fill="white"/>
  </svg>
);

export const ScanIcon = ({ size = 24, color = '#00ffcc' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 7V3h4M21 7V3h-4M3 17v4h4M21 17v4h-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.8"/>
    <line x1="2" y1="12" x2="22" y2="12" stroke={color} strokeWidth="2" opacity="0.6" strokeDasharray="2 2">
      <animate attributeName="stroke-dashoffset" values="0;4" dur="1s" repeatCount="indefinite"/>
    </line>
  </svg>
);

export const AnalyzeIcon = ({ size = 24, color = '#00ff88' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="14" width="4" height="7" fill={color} opacity="0.6"/>
    <rect x="10" y="10" width="4" height="11" fill={color} opacity="0.7"/>
    <rect x="17" y="6" width="4" height="15" fill={color} opacity="0.8"/>
    <path d="M5 10l7-4l7 4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const SynthesizeIcon = ({ size = 24, color = '#8800ff' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="8" r="3" stroke={color} strokeWidth="2" opacity="0.6"/>
    <circle cx="16" cy="8" r="3" stroke={color} strokeWidth="2" opacity="0.6"/>
    <circle cx="12" cy="16" r="3" stroke={color} strokeWidth="2" opacity="0.8"/>
    <path d="M10 10l2 4M14 10l-2 4" stroke={color} strokeWidth="2" opacity="0.5"/>
  </svg>
);

export const TargetIcon = ({ size = 24, color = '#00ffcc' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" opacity="0.3"/>
    <circle cx="12" cy="12" r="6" stroke={color} strokeWidth="2" opacity="0.5"/>
    <circle cx="12" cy="12" r="2" fill={color}/>
    <path d="M12 2v2M12 20v2M2 12h2M20 12h2" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const BrainIcon = ({ size = 24, color = '#ff00ff' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C8 2 5 5 5 9c0 2 1 4 2 5v6h10v-6c1-1 2-3 2-5 0-4-3-7-7-7z" 
          stroke={color} strokeWidth="2" fill="none" opacity="0.8"/>
    <path d="M9 9c0-1 1-2 2-2s2 1 2 2M8 11h8M10 14h4" 
          stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
  </svg>
);

export const ShieldIcon = ({ size = 24, color = '#00ff88' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L4 7v6c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11V7l-8-5z" 
          stroke={color} strokeWidth="2" fill={color} fillOpacity="0.1"/>
    <path d="M9 12l2 2 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const TrendingUpIcon = ({ size = 24, color = '#00ffcc' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 17l6-6 4 4 8-8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14 7h7v7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const UsersIcon = ({ size = 24, color = '#00ff88' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="9" cy="7" r="3" stroke={color} strokeWidth="2" opacity="0.6"/>
    <circle cx="17" cy="7" r="3" stroke={color} strokeWidth="2" opacity="0.6"/>
    <path d="M4 20v-2c0-2 2-3 5-3s5 1 5 3v2M14 15c3 0 5 1 5 3v2" 
          stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const DollarSignIcon = ({ size = 24, color = '#00ffcc' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2v20" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" 
          stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const SwordIcon = ({ size = 24, color = '#ff00ff' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 3l7 7-10 10-1 3-3 1-4-4 1-3 3-1 10-10" 
          stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 21l4-4" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <circle cx="19" cy="5" r="2" fill={color} opacity="0.8"/>
  </svg>
);

export const AlertIcon = ({ size = 24, color = '#ff0064' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L2 20h20L12 2z" stroke={color} strokeWidth="2" fill={color} fillOpacity="0.1"/>
    <path d="M12 9v4M12 17h.01" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const InsightIcon = ({ size = 24, color = '#00ffcc' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="3" fill={color}/>
    <path d="M12 2v6M12 16v6M4.93 4.93l4.24 4.24M14.83 14.83l4.24 4.24M2 12h6M16 12h6M4.93 19.07l4.24-4.24M14.83 9.17l4.24-4.24" 
          stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
  </svg>
);

export const ActionIcon = ({ size = 24, color = '#00ff88' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="18" height="18" rx="2" stroke={color} strokeWidth="2" opacity="0.3"/>
    <path d="M9 12l2 2 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const ChartIcon = ({ size = 24, color = '#00ffcc' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="12" width="4" height="9" fill={color} opacity="0.6"/>
    <rect x="10" y="8" width="4" height="13" fill={color} opacity="0.8"/>
    <rect x="17" y="3" width="4" height="18" fill={color}/>
  </svg>
);

export const BuildingIcon = ({ size = 24, color = '#ff00ff' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="2" width="16" height="20" stroke={color} strokeWidth="2" fill={color} fillOpacity="0.05"/>
    <rect x="8" y="6" width="3" height="3" fill={color} opacity="0.6"/>
    <rect x="13" y="6" width="3" height="3" fill={color} opacity="0.6"/>
    <rect x="8" y="11" width="3" height="3" fill={color} opacity="0.6"/>
    <rect x="13" y="11" width="3" height="3" fill={color} opacity="0.6"/>
    <rect x="9" y="18" width="6" height="4" stroke={color} strokeWidth="2"/>
  </svg>
);