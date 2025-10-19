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
      <div className="bg-gray-900 rounded-xl p-12 text-center border border-gray-800">
        <Eye className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-400 mb-2">No Intelligence Available</h3>
        <p className="text-gray-500">Run the pipeline to generate market intelligence</p>
      </div>
    );
  }

  const { synthesis: data } = synthesis;

  // Debug logging
  console.log('🔍 IntelligenceSynthesisDisplay received:', {
    hasExecutiveSummary: !!data.executive_summary,
    executiveSummaryLength: data.executive_summary?.length,
    executiveSummaryPreview: data.executive_summary?.substring(0, 200),
    hasCompetitiveMoves: !!data.competitive_moves,
    hasStakeholderDynamics: !!data.stakeholder_dynamics,
    hasMediaLandscape: !!data.media_landscape,
    hasPrActions: !!data.pr_actions,
    hasRiskAlerts: !!data.risk_alerts,
    allKeys: Object.keys(data || {})
  });

  // Handle new PR-focused format
  if (data.executive_summary || data.competitive_moves) {
    return (
      <div className="space-y-6">
        {/* Executive Summary */}
        {data.executive_summary && (
          <div className="bg-gray-900 rounded-xl p-6 border-2 border-purple-800">
            <div className="flex items-center mb-4">
              <Eye className="w-6 h-6 text-purple-400 mr-3" />
              <h2 className="text-xl font-bold text-white">Executive PR Summary</h2>
            </div>
            <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{data.executive_summary}</p>
          </div>
        )}

        {/* Competitive Moves */}
        {data.competitive_moves && (
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <div className="flex items-center mb-6">
              <Target className="w-6 h-6 text-red-400 mr-3" />
              <h2 className="text-xl font-bold text-white">Competitive Intelligence</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {data.competitive_moves.immediate_threats?.length > 0 && (
                <div className="bg-red-900/20 p-4 rounded-lg border border-red-700">
                  <h3 className="text-red-400 font-semibold mb-3">Immediate Threats</h3>
                  <ul className="space-y-2">
                    {data.competitive_moves.immediate_threats.map((threat: string, i: number) => (
                      <li key={i} className="text-gray-300 text-sm flex items-start">
                        <AlertTriangle className="w-4 h-4 text-red-400 mr-2 mt-0.5 flex-shrink-0" />
                        <span>{threat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {data.competitive_moves.opportunities?.length > 0 && (
                <div className="bg-green-900/20 p-4 rounded-lg border border-green-700">
                  <h3 className="text-green-400 font-semibold mb-3">PR Opportunities</h3>
                  <ul className="space-y-2">
                    {data.competitive_moves.opportunities.map((opp: string, i: number) => (
                      <li key={i} className="text-gray-300 text-sm flex items-start">
                        <Lightbulb className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                        <span>{opp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {data.competitive_moves.narrative_gaps?.length > 0 && (
                <div className="bg-blue-900/20 p-4 rounded-lg border border-blue-700">
                  <h3 className="text-blue-400 font-semibold mb-3">Narrative Gaps</h3>
                  <ul className="space-y-2">
                    {data.competitive_moves.narrative_gaps.map((gap: string, i: number) => (
                      <li key={i} className="text-gray-300 text-sm flex items-start">
                        <MessageSquare className="w-4 h-4 text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
                        <span>{gap}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stakeholder Dynamics */}
        {data.stakeholder_dynamics && (
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <div className="flex items-center mb-6">
              <TrendingUp className="w-6 h-6 text-yellow-400 mr-3" />
              <h2 className="text-xl font-bold text-white">Stakeholder Dynamics</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {data.stakeholder_dynamics.key_movements?.length > 0 && (
                <div className="bg-yellow-900/20 p-4 rounded-lg border border-yellow-700">
                  <h3 className="text-yellow-400 font-semibold mb-3">Key Movements</h3>
                  <ul className="space-y-2">
                    {data.stakeholder_dynamics.key_movements.map((movement: string, i: number) => (
                      <li key={i} className="text-gray-300 text-sm">• {movement}</li>
                    ))}
                  </ul>
                </div>
              )}
              {data.stakeholder_dynamics.influence_shifts?.length > 0 && (
                <div className="bg-orange-900/20 p-4 rounded-lg border border-orange-700">
                  <h3 className="text-orange-400 font-semibold mb-3">Influence Shifts</h3>
                  <ul className="space-y-2">
                    {data.stakeholder_dynamics.influence_shifts.map((shift: string, i: number) => (
                      <li key={i} className="text-gray-300 text-sm">• {shift}</li>
                    ))}
                  </ul>
                </div>
              )}
              {data.stakeholder_dynamics.engagement_opportunities?.length > 0 && (
                <div className="bg-green-900/20 p-4 rounded-lg border border-green-700">
                  <h3 className="text-green-400 font-semibold mb-3">Engagement Opportunities</h3>
                  <ul className="space-y-2">
                    {data.stakeholder_dynamics.engagement_opportunities.map((opp: string, i: number) => (
                      <li key={i} className="text-gray-300 text-sm">• {opp}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Media Landscape */}
        {data.media_landscape && (
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <div className="flex items-center mb-6">
              <MessageSquare className="w-6 h-6 text-blue-400 mr-3" />
              <h2 className="text-xl font-bold text-white">Media Landscape</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {data.media_landscape.trending_narratives?.length > 0 && (
                <div className="bg-blue-900/20 p-4 rounded-lg border border-blue-700">
                  <h3 className="text-blue-400 font-semibold mb-3">Trending Narratives</h3>
                  <ul className="space-y-2">
                    {data.media_landscape.trending_narratives.map((narrative: string, i: number) => (
                      <li key={i} className="text-gray-300 text-sm">📈 {narrative}</li>
                    ))}
                  </ul>
                </div>
              )}
              {data.media_landscape.sentiment_shifts?.length > 0 && (
                <div className="bg-purple-900/20 p-4 rounded-lg border border-purple-700">
                  <h3 className="text-purple-400 font-semibold mb-3">Sentiment Shifts</h3>
                  <ul className="space-y-2">
                    {data.media_landscape.sentiment_shifts.map((shift: string, i: number) => (
                      <li key={i} className="text-gray-300 text-sm">• {shift}</li>
                    ))}
                  </ul>
                </div>
              )}
              {data.media_landscape.journalist_interests?.length > 0 && (
                <div className="bg-cyan-900/20 p-4 rounded-lg border border-cyan-700">
                  <h3 className="text-cyan-400 font-semibold mb-3">Journalist Interests</h3>
                  <ul className="space-y-2">
                    {data.media_landscape.journalist_interests.map((interest: string, i: number) => (
                      <li key={i} className="text-gray-300 text-sm">📰 {interest}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PR Actions */}
        {data.pr_actions && (
          <div className="bg-gray-900 rounded-xl p-6 border-2 border-cyan-800">
            <div className="flex items-center mb-6">
              <Megaphone className="w-6 h-6 text-cyan-400 mr-3" />
              <h2 className="text-xl font-bold text-white">PR Action Items</h2>
              <span className="ml-auto text-xs bg-cyan-900/50 text-cyan-300 px-3 py-1 rounded-full">
                Time-Based Priorities
              </span>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {data.pr_actions.immediate?.length > 0 && (
                <div className="bg-red-900/10 rounded-lg p-4 border border-red-600">
                  <h3 className="text-red-400 font-semibold mb-3">🔥 Next 24-48 Hours</h3>
                  <ul className="space-y-2">
                    {data.pr_actions.immediate.map((action: string, i: number) => (
                      <li key={i} className="text-gray-300 text-sm">• {action}</li>
                    ))}
                  </ul>
                </div>
              )}
              {data.pr_actions.this_week?.length > 0 && (
                <div className="bg-yellow-900/10 rounded-lg p-4 border border-yellow-600">
                  <h3 className="text-yellow-400 font-semibold mb-3">📅 This Week</h3>
                  <ul className="space-y-2">
                    {data.pr_actions.this_week.map((action: string, i: number) => (
                      <li key={i} className="text-gray-300 text-sm">• {action}</li>
                    ))}
                  </ul>
                </div>
              )}
              {data.pr_actions.strategic?.length > 0 && (
                <div className="bg-purple-900/10 rounded-lg p-4 border border-purple-600">
                  <h3 className="text-purple-400 font-semibold mb-3">🎯 Strategic</h3>
                  <ul className="space-y-2">
                    {data.pr_actions.strategic.map((action: string, i: number) => (
                      <li key={i} className="text-gray-300 text-sm">• {action}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Risk Alerts */}
        {data.risk_alerts && (
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <div className="flex items-center mb-6">
              <AlertTriangle className="w-6 h-6 text-orange-400 mr-3" />
              <h2 className="text-xl font-bold text-white">Risk Monitoring</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {data.risk_alerts.crisis_signals?.length > 0 && (
                <div className="bg-orange-900/20 p-4 rounded-lg border border-orange-700">
                  <h3 className="text-orange-400 font-semibold mb-3">Crisis Signals</h3>
                  <ul className="space-y-2">
                    {data.risk_alerts.crisis_signals.map((signal: string, i: number) => (
                      <li key={i} className="text-gray-300 text-sm">⚠️ {signal}</li>
                    ))}
                  </ul>
                </div>
              )}
              {data.risk_alerts.reputation_threats?.length > 0 && (
                <div className="bg-red-900/20 p-4 rounded-lg border border-red-700">
                  <h3 className="text-red-400 font-semibold mb-3">Reputation Threats</h3>
                  <ul className="space-y-2">
                    {data.risk_alerts.reputation_threats.map((threat: string, i: number) => (
                      <li key={i} className="text-gray-300 text-sm">🎯 {threat}</li>
                    ))}
                  </ul>
                </div>
              )}
              {data.risk_alerts.mitigation_steps?.length > 0 && (
                <div className="bg-green-900/20 p-4 rounded-lg border border-green-700">
                  <h3 className="text-green-400 font-semibold mb-3">Mitigation Steps</h3>
                  <ul className="space-y-2">
                    {data.risk_alerts.mitigation_steps.map((step: string, i: number) => (
                      <li key={i} className="text-gray-300 text-sm">✓ {step}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Metadata */}
        {synthesis.metadata && (
          <div className="flex justify-between items-center px-4 py-2 bg-gray-900 rounded-lg border border-gray-800 text-xs text-gray-500">
            <span>Analysis Date: {new Date(synthesis.metadata.timestamp || synthesis.metadata.analysis_date).toLocaleString()}</span>
            <span>Events Analyzed: {synthesis.metadata.events_analyzed || synthesis.metadata.articles_analyzed || 0}</span>
          </div>
        )}
      </div>
    );
  }

  // Fall back to original display for old format
  return (
    <div className="space-y-6">
      {/* Section 1: Top Developments */}
      {data.top_developments && data.top_developments.length > 0 && (
        <div className="bg-gray-900 rounded-xl p-6 border-2 border-cyan-800">
          <div className="flex items-center mb-6">
            <TrendingUp className="w-6 h-6 text-cyan-400 mr-3" />
            <h2 className="text-xl font-bold text-white">Top Developments</h2>
            <span className="ml-auto text-xs bg-cyan-900/50 text-cyan-300 px-3 py-1 rounded-full">
              This Week's Key Events
            </span>
          </div>

          <div className="space-y-4">
            {data.top_developments.map((dev: any, i: number) => (
              <div
                key={i}
                className={`bg-gray-800/50 rounded-lg border transition-all cursor-pointer ${
                  expandedDevelopment === i ? 'border-cyan-600 bg-gray-800' : 'border-gray-700 hover:border-gray-600'
                }`}
                onClick={() => setExpandedDevelopment(expandedDevelopment === i ? null : i)}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-cyan-400 font-bold">#{i + 1}</span>
                        {dev.entity && (
                          <span className="text-xs bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded">
                            {dev.entity}
                          </span>
                        )}
                      </div>
                      <h3 className="text-white font-semibold text-lg mb-2">{dev.headline}</h3>

                      {expandedDevelopment === i && (
                        <>
                          <p className="text-gray-300 mb-3">{dev.details}</p>
                          {dev.impact && (
                            <div className="bg-gray-900/50 rounded p-3 border border-gray-700">
                              <div className="flex items-center text-yellow-400 text-sm mb-1">
                                <AlertTriangle className="w-4 h-4 mr-2" />
                                Impact
                              </div>
                              <p className="text-gray-300 text-sm">{dev.impact}</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    <ChevronRight className={`w-5 h-5 text-gray-500 transform transition-transform ${
                      expandedDevelopment === i ? 'rotate-90' : ''
                    }`} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 2: Narratives and Insights */}
      {data.narratives_and_insights && (
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="flex items-center mb-6">
            <Lightbulb className="w-6 h-6 text-yellow-400 mr-3" />
            <h2 className="text-xl font-bold text-white">Narratives & Insights</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {data.narratives_and_insights.dominant_narrative && (
              <div className="bg-purple-900/20 p-4 rounded-lg border border-purple-700">
                <h3 className="text-purple-400 font-semibold mb-2 flex items-center">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Dominant Narrative
                </h3>
                <p className="text-gray-300">{data.narratives_and_insights.dominant_narrative}</p>
              </div>
            )}

            {data.narratives_and_insights.hidden_patterns && (
              <div className="bg-blue-900/20 p-4 rounded-lg border border-blue-700">
                <h3 className="text-blue-400 font-semibold mb-2 flex items-center">
                  <Eye className="w-4 h-4 mr-2" />
                  Hidden Patterns
                </h3>
                <p className="text-gray-300">{data.narratives_and_insights.hidden_patterns}</p>
              </div>
            )}

            {data.narratives_and_insights.market_direction && (
              <div className="bg-green-900/20 p-4 rounded-lg border border-green-700">
                <h3 className="text-green-400 font-semibold mb-2 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Market Direction
                </h3>
                <p className="text-gray-300">{data.narratives_and_insights.market_direction}</p>
              </div>
            )}

            {data.narratives_and_insights.power_dynamics && (
              <div className="bg-orange-900/20 p-4 rounded-lg border border-orange-700">
                <h3 className="text-orange-400 font-semibold mb-2">Power Dynamics</h3>
                <p className="text-gray-300">{data.narratives_and_insights.power_dynamics}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Section 3: PR Implications */}
      {data.pr_implications && (
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="flex items-center mb-6">
            <Megaphone className="w-6 h-6 text-red-400 mr-3" />
            <h2 className="text-xl font-bold text-white">PR Implications</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Opportunities */}
            {data.pr_implications.immediate_opportunities && data.pr_implications.immediate_opportunities.length > 0 && (
              <div className="bg-green-900/10 rounded-lg p-4 border border-green-800">
                <h3 className="text-green-400 font-semibold mb-3 flex items-center">
                  <Target className="w-4 h-4 mr-2" />
                  Immediate Opportunities
                </h3>
                <div className="space-y-2">
                  {data.pr_implications.immediate_opportunities.map((opp: string, i: number) => (
                    <div key={i} className="flex items-start">
                      <ChevronRight className="w-4 h-4 text-green-400 mt-0.5 mr-2 flex-shrink-0" />
                      <p className="text-gray-300 text-sm">{opp}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Threats */}
            {data.pr_implications.narrative_threats && data.pr_implications.narrative_threats.length > 0 && (
              <div className="bg-red-900/10 rounded-lg p-4 border border-red-800">
                <h3 className="text-red-400 font-semibold mb-3 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Narrative Threats
                </h3>
                <div className="space-y-2">
                  {data.pr_implications.narrative_threats.map((threat: string, i: number) => (
                    <div key={i} className="flex items-start">
                      <ChevronRight className="w-4 h-4 text-red-400 mt-0.5 mr-2 flex-shrink-0" />
                      <p className="text-gray-300 text-sm">{threat}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Positioning */}
            {data.pr_implications.positioning_recommendations && data.pr_implications.positioning_recommendations.length > 0 && (
              <div className="bg-cyan-900/10 rounded-lg p-4 border border-cyan-800">
                <h3 className="text-cyan-400 font-semibold mb-3">Positioning Recommendations</h3>
                <div className="space-y-2">
                  {data.pr_implications.positioning_recommendations.map((rec: string, i: number) => (
                    <div key={i} className="flex items-start">
                      <span className="text-cyan-400 mr-2">→</span>
                      <p className="text-gray-300 text-sm">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Key Messages */}
            {data.pr_implications.key_messages && data.pr_implications.key_messages.length > 0 && (
              <div className="bg-purple-900/10 rounded-lg p-4 border border-purple-800">
                <h3 className="text-purple-400 font-semibold mb-3">Key Messages</h3>
                <div className="space-y-2">
                  {data.pr_implications.key_messages.map((msg: string, i: number) => (
                    <div key={i} className="p-2 bg-purple-900/20 rounded">
                      <p className="text-gray-300 text-sm italic">"{msg}"</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Metadata */}
      {synthesis.metadata && (
        <div className="flex justify-between items-center px-4 py-2 bg-gray-900 rounded-lg border border-gray-800 text-xs text-gray-500">
          <span>Analysis Date: {new Date(synthesis.metadata.timestamp || synthesis.metadata.analysis_date).toLocaleString()}</span>
          <span>Events Analyzed: {synthesis.metadata.events_analyzed || synthesis.metadata.articles_analyzed || 0}</span>
        </div>
      )}
    </div>
  );
};

export default IntelligenceSynthesisDisplay;