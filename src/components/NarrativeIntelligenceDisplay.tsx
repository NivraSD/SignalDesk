import React, { useState } from 'react';
import {
  MessageSquare,
  TrendingUp,
  Shield,
  Users,
  AlertTriangle,
  Target,
  Zap,
  Eye,
  ChevronRight,
  Megaphone,
  Award,
  AlertCircle
} from 'lucide-react';

interface NarrativeIntelligenceDisplayProps {
  synthesis: any;
  loading?: boolean;
}

const NarrativeIntelligenceDisplay: React.FC<NarrativeIntelligenceDisplayProps> = ({ synthesis, loading }) => {
  const [expandedSection, setExpandedSection] = useState<string | null>('narrative_landscape');

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
        <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-400 mb-2">No PR/Narrative Intelligence Available</h3>
        <p className="text-gray-500">Run the intelligence pipeline to generate narrative insights</p>
      </div>
    );
  }

  const { synthesis: data } = synthesis;

  return (
    <div className="space-y-6">
      {/* Executive Summary */}
      {data.executive_summary && (
        <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center mb-4">
            <Megaphone className="w-6 h-6 text-cyan-400 mr-3" />
            <h2 className="text-xl font-bold text-white">PR & Narrative Intelligence Overview</h2>
          </div>
          <div className="prose prose-invert max-w-none">
            <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
              {data.executive_summary}
            </p>
          </div>
        </div>
      )}

      {/* Narrative Landscape */}
      {data.narrative_landscape && (
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="flex items-center mb-4">
            <MessageSquare className="w-6 h-6 text-purple-400 mr-3" />
            <h2 className="text-xl font-bold text-white">Narrative Landscape</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {data.narrative_landscape.dominant_narratives?.length > 0 && (
              <div className="bg-purple-900/20 p-4 rounded-lg border border-purple-700">
                <h3 className="text-purple-400 font-semibold mb-3">Dominant Narratives</h3>
                {data.narrative_landscape.dominant_narratives.map((narrative: string, i: number) => (
                  <div key={i} className="mb-2 text-sm text-gray-300">• {narrative}</div>
                ))}
              </div>
            )}

            {data.narrative_landscape.narrative_battles?.length > 0 && (
              <div className="bg-orange-900/20 p-4 rounded-lg border border-orange-700">
                <h3 className="text-orange-400 font-semibold mb-3">Narrative Battles</h3>
                {data.narrative_landscape.narrative_battles.map((battle: string, i: number) => (
                  <div key={i} className="mb-2 text-sm text-gray-300">⚔️ {battle}</div>
                ))}
              </div>
            )}

            {data.narrative_landscape.narrative_winners && (
              <div className="bg-green-900/20 p-4 rounded-lg border border-green-700">
                <h3 className="text-green-400 font-semibold mb-2">Winning the Narrative</h3>
                <p className="text-sm text-gray-300">{data.narrative_landscape.narrative_winners}</p>
              </div>
            )}

            {data.narrative_landscape.narrative_risks?.length > 0 && (
              <div className="bg-red-900/20 p-4 rounded-lg border border-red-700">
                <h3 className="text-red-400 font-semibold mb-3">Narrative Risks</h3>
                {data.narrative_landscape.narrative_risks.map((risk: string, i: number) => (
                  <div key={i} className="mb-2 text-sm text-red-300">⚠️ {risk}</div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* PR Positioning Analysis */}
      {data.pr_positioning_analysis && (
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="flex items-center mb-4">
            <Target className="w-6 h-6 text-blue-400 mr-3" />
            <h2 className="text-xl font-bold text-white">PR & Positioning Analysis</h2>
          </div>

          <div className="space-y-4">
            {data.pr_positioning_analysis.positioning_moves?.length > 0 && (
              <div>
                <h3 className="text-blue-400 font-semibold mb-2">Positioning Moves</h3>
                {data.pr_positioning_analysis.positioning_moves.map((move: string, i: number) => (
                  <div key={i} className="mb-2 p-3 bg-gray-800/50 rounded-lg border-l-2 border-blue-500">
                    <p className="text-sm text-gray-300">{move}</p>
                  </div>
                ))}
              </div>
            )}

            {data.pr_positioning_analysis.reputation_impacts?.length > 0 && (
              <div>
                <h3 className="text-yellow-400 font-semibold mb-2">Reputation Impacts</h3>
                {data.pr_positioning_analysis.reputation_impacts.map((impact: string, i: number) => (
                  <div key={i} className="mb-2 p-3 bg-yellow-900/20 rounded-lg">
                    <p className="text-sm text-gray-300">{impact}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Key Developments */}
      {data.key_developments && data.key_developments.length > 0 && (
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="flex items-center mb-4">
            <Zap className="w-6 h-6 text-cyan-400 mr-3" />
            <h2 className="text-xl font-bold text-white">Key Developments</h2>
          </div>
          <div className="space-y-3">
            {data.key_developments.map((dev: string, i: number) => (
              <div key={i} className="flex items-start p-4 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-cyan-600 transition-colors">
                <ChevronRight className="w-5 h-5 text-cyan-400 mt-0.5 mr-3 flex-shrink-0" />
                <p className="text-gray-300">{dev}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Competitive Narrative Dynamics */}
      {data.competitive_narrative_dynamics && (
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="flex items-center mb-4">
            <Award className="w-6 h-6 text-green-400 mr-3" />
            <h2 className="text-xl font-bold text-white">Competitive Narrative Dynamics</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {data.competitive_narrative_dynamics.who_is_winning_narrative && (
              <div className="bg-green-900/20 p-4 rounded-lg border border-green-700">
                <h3 className="text-green-400 font-semibold mb-2 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Winning
                </h3>
                <p className="text-gray-300 text-sm">{data.competitive_narrative_dynamics.who_is_winning_narrative}</p>
              </div>
            )}
            {data.competitive_narrative_dynamics.who_is_losing_narrative && (
              <div className="bg-red-900/20 p-4 rounded-lg border border-red-700">
                <h3 className="text-red-400 font-semibold mb-2 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Losing
                </h3>
                <p className="text-gray-300 text-sm">{data.competitive_narrative_dynamics.who_is_losing_narrative}</p>
              </div>
            )}
            {data.competitive_narrative_dynamics.narrative_momentum && (
              <div className="bg-purple-900/20 p-4 rounded-lg border border-purple-700">
                <h3 className="text-purple-400 font-semibold mb-2 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Momentum
                </h3>
                <p className="text-gray-300 text-sm">{data.competitive_narrative_dynamics.narrative_momentum}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Opportunities & Threats Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Media Opportunities */}
        {data.media_opportunities && data.media_opportunities.length > 0 && (
          <div className="bg-green-900/10 rounded-xl p-6 border border-green-800">
            <div className="flex items-center mb-4">
              <Target className="w-6 h-6 text-green-400 mr-3" />
              <h3 className="text-lg font-bold text-green-400">Media Opportunities</h3>
            </div>
            <div className="space-y-2">
              {data.media_opportunities.map((opp: string, i: number) => (
                <div key={i} className="p-3 bg-green-900/20 rounded-lg">
                  <p className="text-sm text-gray-300">{opp}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reputation Threats */}
        {data.reputation_threats && data.reputation_threats.length > 0 && (
          <div className="bg-red-900/10 rounded-xl p-6 border border-red-800">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-400 mr-3" />
              <h3 className="text-lg font-bold text-red-400">Reputation Threats</h3>
            </div>
            <div className="space-y-2">
              {data.reputation_threats.map((threat: string, i: number) => (
                <div key={i} className="p-3 bg-red-900/20 rounded-lg">
                  <p className="text-sm text-red-300">{threat}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Strategic PR Recommendations */}
      {data.strategic_pr_recommendations && data.strategic_pr_recommendations.length > 0 && (
        <div className="bg-gradient-to-r from-cyan-900/20 to-blue-900/20 rounded-xl p-6 border border-cyan-700">
          <div className="flex items-center mb-4">
            <Shield className="w-6 h-6 text-cyan-400 mr-3" />
            <h3 className="text-lg font-bold text-cyan-400">Strategic PR Recommendations</h3>
          </div>
          <div className="space-y-3">
            {data.strategic_pr_recommendations.map((rec: string, i: number) => (
              <div key={i} className="flex items-start">
                <span className="text-cyan-400 mr-3 mt-1">→</span>
                <p className="text-gray-300">{rec}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Critical Watch Item */}
      {data.what_to_watch && (
        <div className="bg-gradient-to-r from-red-900/30 to-orange-900/30 rounded-xl p-6 border-2 border-red-600">
          <div className="flex items-center mb-3">
            <Eye className="w-6 h-6 text-red-400 mr-3 animate-pulse" />
            <h3 className="text-lg font-bold text-red-400">Critical Watch Item</h3>
          </div>
          <p className="text-gray-200 font-medium">{data.what_to_watch}</p>
        </div>
      )}

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

export default NarrativeIntelligenceDisplay;