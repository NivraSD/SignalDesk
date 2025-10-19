              {/* 1. Competitive Dynamics */}
              {executiveSynthesis.competitive_dynamics && (
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-green-400 mb-3">🏁 Competitive Intelligence</h4>
                  
                  {/* Key Competitor Moves */}
                  {executiveSynthesis.competitive_dynamics.key_competitor_moves?.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-green-300 mb-2">Competitor Actions:</p>
                      {executiveSynthesis.competitive_dynamics.key_competitor_moves.map((move: any, idx: number) => (
                        <div key={idx} className="mb-2 p-2 bg-gray-900/50 rounded border-l-2 border-green-500/30">
                          <p className="text-xs font-semibold text-cyan-300">{move.company}</p>
                          <p className="text-xs text-gray-300 mb-1">{move.action}</p>
                          <p className="text-xs text-yellow-400">{move.strategic_impact}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Market Positioning */}
                  {executiveSynthesis.competitive_dynamics.market_positioning?.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-green-300 mb-2">Positioning Changes:</p>
                      {executiveSynthesis.competitive_dynamics.market_positioning.map((position: string, idx: number) => (
                        <p key={idx} className="text-xs text-gray-300 ml-2">• {position}</p>
                      ))}
                    </div>
                  )}
                  
                  {/* Competitive Threats */}
                  {executiveSynthesis.competitive_dynamics.competitive_threats?.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-700">
                      <p className="text-xs font-medium text-red-400 mb-2">Threats to Monitor:</p>
                      {executiveSynthesis.competitive_dynamics.competitive_threats.map((threat: string, idx: number) => (
                        <p key={idx} className="text-xs text-red-300 ml-2">⚠️ {threat}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 2. Trending Narratives (Topics) */}
              {executiveSynthesis.trending_narratives && (
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-400 mb-3">📈 Topic Intelligence</h4>
                  
                  {/* Dominant Themes */}
                  {executiveSynthesis.trending_narratives.dominant_themes?.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-blue-300 mb-2">Key Topics:</p>
                      {executiveSynthesis.trending_narratives.dominant_themes.map((theme: any, idx: number) => (
                        <div key={idx} className="mb-2 p-2 bg-gray-900/50 rounded border-l-2 border-blue-500/30">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs font-semibold text-blue-300">{theme.topic}</p>
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              theme.momentum === 'high' ? 'bg-green-500/20 text-green-400' :
                              theme.momentum === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-gray-500/20 text-gray-400'
                            }`}>
                              {theme.momentum}
                            </span>
                          </div>
                          <p className="text-xs text-gray-300">{theme.strategic_relevance}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Narrative Shifts */}
                  {executiveSynthesis.trending_narratives.narrative_shifts?.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-blue-300 mb-2">Story Changes:</p>
                      {executiveSynthesis.trending_narratives.narrative_shifts.map((shift: string, idx: number) => (
                        <p key={idx} className="text-xs text-gray-300 ml-2">• {shift}</p>
                      ))}
                    </div>
                  )}
                  
                  {/* Topic Opportunities */}
                  {executiveSynthesis.trending_narratives.topic_opportunities?.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-700">
                      <p className="text-xs font-medium text-green-400 mb-2">Strategic Opportunities:</p>
                      {executiveSynthesis.trending_narratives.topic_opportunities.map((opp: string, idx: number) => (
                        <p key={idx} className="text-xs text-green-300 ml-2">💡 {opp}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 3. Stakeholder Intelligence */}
              {executiveSynthesis.stakeholder_intelligence && (
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-pink-400 mb-3">👥 Stakeholder Intelligence</h4>
                  
                  {/* Key Stakeholder Moves */}
                  {executiveSynthesis.stakeholder_intelligence.key_stakeholder_moves?.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-pink-300 mb-2">Stakeholder Actions:</p>
                      {executiveSynthesis.stakeholder_intelligence.key_stakeholder_moves.map((move: any, idx: number) => (
                        <div key={idx} className="mb-2 p-2 bg-gray-900/50 rounded border-l-2 border-pink-500/30">
                          <p className="text-xs font-semibold text-pink-300">{move.stakeholder}</p>
                          <p className="text-xs text-gray-300 mb-1">{move.action}</p>
                          <p className="text-xs text-yellow-400">{move.implication}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Power Dynamics */}
                  {executiveSynthesis.stakeholder_intelligence.power_dynamics?.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-pink-300 mb-2">Power Changes:</p>
                      {executiveSynthesis.stakeholder_intelligence.power_dynamics.map((dynamic: string, idx: number) => (
                        <p key={idx} className="text-xs text-gray-300 ml-2">• {dynamic}</p>
                      ))}
                    </div>
                  )}
                  
                  {/* Stakeholder Sentiment */}
                  {executiveSynthesis.stakeholder_intelligence.stakeholder_sentiment?.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-700">
                      <p className="text-xs font-medium text-orange-400 mb-2">Sentiment Shifts:</p>
                      {executiveSynthesis.stakeholder_intelligence.stakeholder_sentiment.map((sentiment: string, idx: number) => (
                        <p key={idx} className="text-xs text-orange-300 ml-2">📊 {sentiment}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Critical Threats (Keep this - no opportunities) */}
              {executiveSynthesis.critical_threats?.length > 0 && (
                <div className="bg-gradient-to-r from-red-900/30 to-orange-900/30 rounded-lg p-4 border border-red-500/30">
                  <h4 className="text-sm font-semibold text-red-400 mb-2 flex items-center gap-2">
                    🚨 Critical Threats
                  </h4>
                  {executiveSynthesis.critical_threats.map((threat: any, idx: number) => (
                    <div key={idx} className="mb-2 p-2 bg-gray-900/50 rounded border border-red-500/20">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-red-300">{threat.threat}</p>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          threat.urgency === 'Immediate' ? 'bg-red-500/30 text-red-300' :
                          threat.urgency === 'Near-term' ? 'bg-orange-500/30 text-orange-300' :
                          'bg-yellow-500/30 text-yellow-300'
                        }`}>
                          {threat.urgency}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Source: {threat.source}</p>
                      <p className="text-xs text-gray-300 mt-1">{threat.impact}</p>
                    </div>
                  ))}
                </div>
              )}