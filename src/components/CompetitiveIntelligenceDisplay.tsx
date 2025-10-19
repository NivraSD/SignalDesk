import React, { useState } from 'react';
import {
  Eye,
  TrendingUp,
  Shield,
  Zap,
  AlertTriangle,
  Target,
  Link,
  Crosshair,
  Activity,
  ChevronRight,
  AlertCircle,
  Lightbulb,
  Search
} from 'lucide-react';

interface CompetitiveIntelligenceDisplayProps {
  synthesis: any;
  loading?: boolean;
}

const CompetitiveIntelligenceDisplay: React.FC<CompetitiveIntelligenceDisplayProps> = ({ synthesis, loading }) => {
  const [expandedSection, setExpandedSection] = useState<string | null>('pattern_analysis');

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
      <div className="bg-gray-900 rounded-xl p-12 text-center border border-gray-800">
        <Eye className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-400 mb-2">No Competitive Intelligence Available</h3>
        <p className="text-gray-500">Run the intelligence pipeline to analyze your competitive landscape</p>
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
            <Eye className="w-6 h-6 text-cyan-400 mr-3" />
            <h2 className="text-xl font-bold text-white">Competitive Landscape Intelligence</h2>
          </div>
          <div className="prose prose-invert max-w-none">
            <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
              {data.executive_summary}
            </p>
          </div>
        </div>
      )}

      {/* Pattern Analysis - The Core Insights */}
      {data.pattern_analysis && (
        <div className="bg-gray-900 rounded-xl p-6 border-2 border-purple-800">
          <div className="flex items-center mb-4">
            <Link className="w-6 h-6 text-purple-400 mr-3" />
            <h2 className="text-xl font-bold text-white">Pattern Analysis</h2>
            <span className="ml-auto text-xs bg-purple-900/50 text-purple-300 px-2 py-1 rounded">
              Cross-Event Intelligence
            </span>
          </div>

          <div className="space-y-4">
            {data.pattern_analysis.hidden_connections?.length > 0 && (
              <div>
                <h3 className="text-purple-400 font-semibold mb-3 flex items-center">
                  <Search className="w-4 h-4 mr-2" />
                  Hidden Connections
                </h3>
                {data.pattern_analysis.hidden_connections.map((connection: string, i: number) => (
                  <div key={i} className="mb-3 p-4 bg-purple-900/20 rounded-lg border-l-4 border-purple-500">
                    <p className="text-gray-300">{connection}</p>
                  </div>
                ))}
              </div>
            )}

            {data.pattern_analysis.emerging_trends?.length > 0 && (
              <div>
                <h3 className="text-blue-400 font-semibold mb-3 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Emerging Trends
                </h3>
                {data.pattern_analysis.emerging_trends.map((trend: string, i: number) => (
                  <div key={i} className="mb-2 p-3 bg-blue-900/20 rounded-lg">
                    <p className="text-gray-300">{trend}</p>
                  </div>
                ))}
              </div>
            )}

            {data.pattern_analysis.coordination_signals?.length > 0 && (
              <div>
                <h3 className="text-orange-400 font-semibold mb-3 flex items-center">
                  <Activity className="w-4 h-4 mr-2" />
                  Coordination Signals
                </h3>
                {data.pattern_analysis.coordination_signals.map((signal: string, i: number) => (
                  <div key={i} className="mb-2 p-3 bg-orange-900/20 rounded-lg">
                    <p className="text-gray-300">{signal}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Competitive Movements */}
      {data.competitive_movements && (
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="flex items-center mb-4">
            <Crosshair className="w-6 h-6 text-red-400 mr-3" />
            <h2 className="text-xl font-bold text-white">Competitive Movements</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {data.competitive_movements.aggressive_plays?.length > 0 && (
              <div className="bg-red-900/10 rounded-lg p-4 border border-red-800">
                <h3 className="text-red-400 font-semibold mb-3 flex items-center">
                  <Zap className="w-4 h-4 mr-2" />
                  Aggressive Plays
                </h3>
                {data.competitive_movements.aggressive_plays.map((play: string, i: number) => (
                  <div key={i} className="mb-2 text-sm text-gray-300">
                    <span className="text-red-400 mr-2">→</span>
                    {play}
                  </div>
                ))}
              </div>
            )}

            {data.competitive_movements.defensive_moves?.length > 0 && (
              <div className="bg-yellow-900/10 rounded-lg p-4 border border-yellow-800">
                <h3 className="text-yellow-400 font-semibold mb-3 flex items-center">
                  <Shield className="w-4 h-4 mr-2" />
                  Defensive Moves
                </h3>
                {data.competitive_movements.defensive_moves.map((move: string, i: number) => (
                  <div key={i} className="mb-2 text-sm text-gray-300">
                    <span className="text-yellow-400 mr-2">→</span>
                    {move}
                  </div>
                ))}
              </div>
            )}

            {data.competitive_movements.market_reshaping?.length > 0 && (
              <div className="bg-green-900/10 rounded-lg p-4 border border-green-800">
                <h3 className="text-green-400 font-semibold mb-3 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Market Reshaping
                </h3>
                {data.competitive_movements.market_reshaping.map((reshape: string, i: number) => (
                  <div key={i} className="mb-2 text-sm text-gray-300">
                    <span className="text-green-400 mr-2">→</span>
                    {reshape}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Strategic Implications */}
      {data.strategic_implications && (
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="flex items-center mb-4">
            <Target className="w-6 h-6 text-cyan-400 mr-3" />
            <h2 className="text-xl font-bold text-white">Strategic Implications</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-4">
              {data.strategic_implications.immediate_concerns?.length > 0 && (
                <div className="bg-red-900/20 rounded-lg p-4 border border-red-700">
                  <h3 className="text-red-400 font-semibold mb-3 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Immediate Concerns
                  </h3>
                  {data.strategic_implications.immediate_concerns.map((concern: string, i: number) => (
                    <div key={i} className="mb-2 p-2 bg-red-900/30 rounded">
                      <p className="text-sm text-gray-300">{concern}</p>
                    </div>
                  ))}
                </div>
              )}

              {data.strategic_implications.opportunity_windows?.length > 0 && (
                <div className="bg-green-900/20 rounded-lg p-4 border border-green-700">
                  <h3 className="text-green-400 font-semibold mb-3 flex items-center">
                    <Target className="w-4 h-4 mr-2" />
                    Opportunity Windows
                  </h3>
                  {data.strategic_implications.opportunity_windows.map((opp: string, i: number) => (
                    <div key={i} className="mb-2 p-2 bg-green-900/30 rounded">
                      <p className="text-sm text-gray-300">{opp}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {data.strategic_implications.strategic_recommendations?.length > 0 && (
              <div className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 rounded-lg p-4 border border-cyan-700">
                <h3 className="text-cyan-400 font-semibold mb-3 flex items-center">
                  <Lightbulb className="w-4 h-4 mr-2" />
                  Strategic Recommendations
                </h3>
                {data.strategic_implications.strategic_recommendations.map((rec: string, i: number) => (
                  <div key={i} className="mb-3">
                    <div className="flex items-start">
                      <ChevronRight className="w-4 h-4 text-cyan-400 mt-0.5 mr-2 flex-shrink-0" />
                      <p className="text-sm text-gray-300">{rec}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Insight Highlights */}
      {data.insight_highlights && data.insight_highlights.length > 0 && (
        <div className="grid md:grid-cols-3 gap-4">
          {data.insight_highlights.map((insight: string, i: number) => {
            const isSuprising = insight.toLowerCase().includes('surprising');
            const isThreat = insight.toLowerCase().includes('threat');
            const isOpportunity = insight.toLowerCase().includes('opportunity');

            return (
              <div
                key={i}
                className={`p-4 rounded-lg border ${
                  isSuprising ? 'bg-purple-900/20 border-purple-700' :
                  isThreat ? 'bg-red-900/20 border-red-700' :
                  isOpportunity ? 'bg-green-900/20 border-green-700' :
                  'bg-gray-800 border-gray-700'
                }`}
              >
                <div className="flex items-start">
                  {isSuprising ? <Eye className="w-5 h-5 text-purple-400 mr-2 flex-shrink-0" /> :
                   isThreat ? <AlertTriangle className="w-5 h-5 text-red-400 mr-2 flex-shrink-0" /> :
                   isOpportunity ? <Target className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" /> :
                   <Lightbulb className="w-5 h-5 text-gray-400 mr-2 flex-shrink-0" />}
                  <p className="text-sm text-gray-300">{insight}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Forward Indicators */}
      {data.forward_indicators && (
        <div className="bg-gradient-to-r from-orange-900/20 to-red-900/20 rounded-xl p-6 border border-orange-700">
          <div className="flex items-center mb-4">
            <Activity className="w-6 h-6 text-orange-400 mr-3" />
            <h2 className="text-xl font-bold text-orange-400">Forward Indicators</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {data.forward_indicators.watch_for?.length > 0 && (
              <div>
                <h3 className="text-yellow-400 font-semibold mb-3">Watch For</h3>
                {data.forward_indicators.watch_for.map((indicator: string, i: number) => (
                  <div key={i} className="mb-2 p-3 bg-yellow-900/20 rounded-lg">
                    <p className="text-sm text-gray-300">{indicator}</p>
                  </div>
                ))}
              </div>
            )}

            {data.forward_indicators.early_warnings?.length > 0 && (
              <div>
                <h3 className="text-red-400 font-semibold mb-3">Early Warnings</h3>
                {data.forward_indicators.early_warnings.map((warning: string, i: number) => (
                  <div key={i} className="mb-2 p-3 bg-red-900/20 rounded-lg">
                    <p className="text-sm text-gray-300">{warning}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
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
            {synthesis.metadata.confidence || 'medium'} confidence
          </span>
        </div>
      )}
    </div>
  );
};

export default CompetitiveIntelligenceDisplay;