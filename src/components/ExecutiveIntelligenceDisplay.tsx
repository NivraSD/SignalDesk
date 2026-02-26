import React, { useState } from 'react';
import {
  Eye,
  Zap,
  TrendingUp,
  AlertCircle,
  Lightbulb,
  Activity,
  Target,
  Clock,
  ChevronRight,
  Brain,
  Sparkles,
  Search
} from 'lucide-react';

interface ExecutiveIntelligenceDisplayProps {
  synthesis: any;
  loading?: boolean;
}

const ExecutiveIntelligenceDisplay: React.FC<ExecutiveIntelligenceDisplayProps> = ({ synthesis, loading }) => {
  const [expandedSection, setExpandedSection] = useState<string | null>('hidden_pattern');

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-xl p-8 animate-pulse">
        <div className="h-8 bg-gray-800 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-800 rounded w-full"></div>
          <div className="h-4 bg-gray-800 rounded w-5/6"></div>
          <div className="h-4 bg-gray-800 rounded w-4/6"></div>
        </div>
      </div>
    );
  }

  if (!synthesis?.synthesis) {
    return (
      <div className="bg-gray-900 rounded-xl p-12 text-center border border-gray-800">
        <Brain className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-400 mb-2">No Intelligence Available</h3>
        <p className="text-gray-500">Run the intelligence pipeline to generate executive insights</p>
      </div>
    );
  }

  const { synthesis: data } = synthesis;

  const sections = [
    {
      id: 'hidden_pattern',
      title: 'Hidden Pattern',
      subtitle: 'The story behind the story',
      icon: Eye,
      color: 'purple',
      content: data.hidden_pattern
    },
    {
      id: 'power_moves',
      title: 'Power Moves',
      subtitle: 'Strategic actions with hidden implications',
      icon: Zap,
      color: 'yellow',
      content: data.power_moves,
      isList: true
    },
    {
      id: 'weak_signals',
      title: 'Weak Signals',
      subtitle: 'Small events predicting major shifts',
      icon: Activity,
      color: 'orange',
      content: data.weak_signals,
      isList: true
    },
    {
      id: 'narrative_shift',
      title: 'Narrative Shift',
      subtitle: 'How the story is changing',
      icon: TrendingUp,
      color: 'green',
      content: data.narrative_shift
    },
    {
      id: 'non_obvious_insights',
      title: 'Non-Obvious Insights',
      subtitle: 'Connections others are missing',
      icon: Lightbulb,
      color: 'blue',
      content: data.non_obvious_insights,
      isList: true
    },
    {
      id: 'what_to_watch',
      title: 'Critical Watch Item',
      subtitle: 'The ONE thing that matters most',
      icon: Clock,
      color: 'red',
      content: data.what_to_watch,
      isHighlight: true
    }
  ];

  const getColorClasses = (color: string, isActive: boolean) => {
    const colors = {
      purple: {
        bg: isActive ? 'bg-purple-900/30' : 'bg-gray-900',
        border: isActive ? 'border-purple-600' : 'border-gray-800',
        icon: 'text-purple-400',
        title: 'text-purple-300',
        hover: 'hover:border-purple-700'
      },
      yellow: {
        bg: isActive ? 'bg-yellow-900/20' : 'bg-gray-900',
        border: isActive ? 'border-yellow-600' : 'border-gray-800',
        icon: 'text-yellow-400',
        title: 'text-yellow-300',
        hover: 'hover:border-yellow-700'
      },
      orange: {
        bg: isActive ? 'bg-orange-900/20' : 'bg-gray-900',
        border: isActive ? 'border-orange-600' : 'border-gray-800',
        icon: 'text-orange-400',
        title: 'text-orange-300',
        hover: 'hover:border-orange-700'
      },
      green: {
        bg: isActive ? 'bg-green-900/20' : 'bg-gray-900',
        border: isActive ? 'border-green-600' : 'border-gray-800',
        icon: 'text-green-400',
        title: 'text-green-300',
        hover: 'hover:border-green-700'
      },
      blue: {
        bg: isActive ? 'bg-blue-900/20' : 'bg-gray-900',
        border: isActive ? 'border-blue-600' : 'border-gray-800',
        icon: 'text-blue-400',
        title: 'text-blue-300',
        hover: 'hover:border-blue-700'
      },
      red: {
        bg: isActive ? 'bg-red-900/20' : 'bg-gray-900',
        border: isActive ? 'border-red-600' : 'border-gray-800',
        icon: 'text-red-400',
        title: 'text-red-300',
        hover: 'hover:border-red-700'
      }
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="space-y-6">
      {/* Executive Summary */}
      {data.executive_summary && (
        <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center mb-4">
            <Brain className="w-6 h-6 text-cyan-400 mr-3" />
            <h2 className="text-xl font-bold text-white">Executive Summary</h2>
          </div>
          <div className="prose prose-invert max-w-none">
            <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
              {data.executive_summary}
            </p>
          </div>
        </div>
      )}

      {/* Key Developments */}
      {data.key_developments && data.key_developments.length > 0 && (
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="flex items-center mb-4">
            <Sparkles className="w-6 h-6 text-cyan-400 mr-3" />
            <h2 className="text-xl font-bold text-white">Key Developments</h2>
          </div>
          <div className="grid gap-3">
            {data.key_developments.map((dev: string, i: number) => (
              <div key={i} className="flex items-start p-4 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-cyan-600 transition-colors">
                <ChevronRight className="w-5 h-5 text-cyan-400 mt-0.5 mr-3 flex-shrink-0" />
                <p className="text-gray-300">{dev}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Competitive Intelligence */}
      {data.competitive_intelligence && (
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="flex items-center mb-4">
            <Target className="w-6 h-6 text-cyan-400 mr-3" />
            <h2 className="text-xl font-bold text-white">Competitive Intelligence</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {data.competitive_intelligence.who_is_winning && (
              <div className="bg-green-900/20 p-4 rounded-lg border border-green-700">
                <h3 className="text-green-400 font-semibold mb-2 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Winning
                </h3>
                <p className="text-gray-300 text-sm">{data.competitive_intelligence.who_is_winning}</p>
              </div>
            )}
            {data.competitive_intelligence.who_is_losing && (
              <div className="bg-red-900/20 p-4 rounded-lg border border-red-700">
                <h3 className="text-red-400 font-semibold mb-2 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Losing
                </h3>
                <p className="text-gray-300 text-sm">{data.competitive_intelligence.who_is_losing}</p>
              </div>
            )}
            {data.competitive_intelligence.dark_horse && (
              <div className="bg-purple-900/20 p-4 rounded-lg border border-purple-700">
                <h3 className="text-purple-400 font-semibold mb-2 flex items-center">
                  <Search className="w-4 h-4 mr-2" />
                  Dark Horse
                </h3>
                <p className="text-gray-300 text-sm">{data.competitive_intelligence.dark_horse}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Insight Sections */}
      <div className="grid md:grid-cols-2 gap-4">
        {sections.map((section) => {
          const isExpanded = expandedSection === section.id;
          const colors = getColorClasses(section.color, isExpanded);
          const Icon = section.icon;

          if (!section.content) return null;

          return (
            <div
              key={section.id}
              className={`${section.isHighlight ? 'md:col-span-2' : ''} ${colors.bg} rounded-xl p-6 border-2 ${colors.border} ${colors.hover} transition-all cursor-pointer`}
              onClick={() => setExpandedSection(isExpanded ? null : section.id)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center">
                  <Icon className={`w-6 h-6 ${colors.icon} mr-3`} />
                  <div>
                    <h3 className={`text-lg font-bold ${colors.title}`}>{section.title}</h3>
                    {section.subtitle && (
                      <p className="text-xs text-gray-500 mt-0.5">{section.subtitle}</p>
                    )}
                  </div>
                </div>
                <ChevronRight className={`w-5 h-5 text-gray-500 transform transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
              </div>

              <div className={`${isExpanded ? 'block' : 'line-clamp-3'}`}>
                {section.isList && Array.isArray(section.content) ? (
                  <ul className="space-y-2">
                    {section.content.map((item: string, i: number) => (
                      <li key={i} className="flex items-start">
                        <span className={`${colors.icon} mr-2 mt-1`}>•</span>
                        <span className="text-gray-300 text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={`text-gray-300 ${section.isHighlight ? 'text-lg font-medium' : 'text-sm'} leading-relaxed`}>
                    {section.content}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Metadata */}
      {synthesis.metadata && (
        <div className="flex justify-between items-center px-4 py-2 bg-gray-900 rounded-lg border border-gray-800 text-xs text-gray-500">
          <span>Analysis Date: {new Date(synthesis.metadata.analysis_date).toLocaleString()}</span>
          <span>Events Analyzed: {synthesis.metadata.events_analyzed || 0}</span>
          <span className={`capitalize px-2 py-1 rounded ${
            synthesis.metadata.confidence === 'high' ? 'bg-green-900/50 text-green-400' :
            synthesis.metadata.confidence === 'medium' ? 'bg-yellow-900/50 text-yellow-400' :
            'bg-red-900/50 text-red-400'
          }`}>
            {synthesis.metadata.confidence || 'low'} confidence
          </span>
        </div>
      )}
    </div>
  );
};

export default ExecutiveIntelligenceDisplay;