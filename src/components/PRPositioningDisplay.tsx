import React, { useState } from 'react';
import { 
  TrendingUp, 
  Shield, 
  Users, 
  Zap, 
  AlertTriangle,
  Target,
  MessageSquare,
  Brain,
  Eye
} from 'lucide-react';

interface PRPositioningDisplayProps {
  synthesis: any;
}

const PRPositioningDisplay: React.FC<PRPositioningDisplayProps> = ({ synthesis }) => {
  const [activeTab, setActiveTab] = useState('competitive');
  
  if (!synthesis) {
    return (
      <div className="p-8 text-center text-gray-500">
        No PR/Positioning analysis available. Run the intelligence pipeline to generate insights.
      </div>
    );
  }

  // Extract the 5 persona analyses
  const {
    executive_synthesis,
    competitive_dynamics,
    narrative_intelligence,
    power_dynamics,
    cultural_context,
    contrarian_analysis,
    immediate_opportunities,
    critical_threats,
    developments_context
  } = synthesis;

  const tabs = [
    { id: 'competitive', label: 'Competitive Dynamics', icon: Shield },
    { id: 'narrative', label: 'Narrative Intelligence', icon: MessageSquare },
    { id: 'power', label: 'Power Dynamics', icon: Users },
    { id: 'cultural', label: 'Cultural Context', icon: TrendingUp },
    { id: 'contrarian', label: 'Contrarian View', icon: Eye },
    { id: 'opportunities', label: 'Opportunities & Threats', icon: Target }
  ];

  const renderCompetitiveDynamics = () => (
    <div className="space-y-6">
      {competitive_dynamics?.perspective && (
        <div className="text-sm text-cyan-400 font-semibold mb-2">
          {competitive_dynamics.perspective}
        </div>
      )}
      
      {competitive_dynamics?.key_competitor_moves?.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 text-cyan-300">Key Competitor Moves</h3>
          <div className="space-y-3">
            {competitive_dynamics.key_competitor_moves.map((move: any, i: number) => (
              <div key={i} className="bg-gray-800 p-4 rounded-lg border border-cyan-900">
                <div className="font-semibold text-cyan-400">{move.company || move.competitor}</div>
                <div className="text-gray-300 mt-1">{move.move || move.action}</div>
                {move.impact && (
                  <div className="text-sm text-gray-400 mt-2">Impact: {move.impact}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {competitive_dynamics?.urgent_pr_actions?.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 text-red-400">🚨 Urgent PR Actions (24-48h)</h3>
          <div className="space-y-2">
            {competitive_dynamics.urgent_pr_actions.map((action: string, i: number) => (
              <div key={i} className="bg-red-900/20 p-3 rounded border border-red-800">
                <Zap className="inline w-4 h-4 text-red-400 mr-2" />
                {action}
              </div>
            ))}
          </div>
        </div>
      )}

      {competitive_dynamics?.market_positioning?.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 text-green-400">Market Positioning</h3>
          <ul className="space-y-2">
            {competitive_dynamics.market_positioning.map((position: string, i: number) => (
              <li key={i} className="flex items-start">
                <span className="text-green-400 mr-2">•</span>
                <span className="text-gray-300">{position}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  const renderNarrativeIntelligence = () => (
    <div className="space-y-6">
      {narrative_intelligence?.perspective && (
        <div className="text-sm text-purple-400 font-semibold mb-2">
          {narrative_intelligence.perspective}
        </div>
      )}

      {narrative_intelligence?.evolving_narratives?.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 text-purple-300">Evolving Narratives</h3>
          <div className="space-y-3">
            {narrative_intelligence.evolving_narratives.map((narrative: any, i: number) => (
              <div key={i} className="bg-gray-800 p-4 rounded-lg border border-purple-900">
                <div className="text-purple-400 font-semibold">{narrative.story || narrative}</div>
                {narrative.opportunity && (
                  <div className="text-green-400 text-sm mt-2">
                    <Target className="inline w-3 h-3 mr-1" />
                    Opportunity: {narrative.opportunity}
                  </div>
                )}
                {narrative.threat && (
                  <div className="text-red-400 text-sm mt-2">
                    <AlertTriangle className="inline w-3 h-3 mr-1" />
                    Threat: {narrative.threat}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {narrative_intelligence?.pr_opportunities?.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 text-green-400">PR Opportunities</h3>
          <div className="space-y-2">
            {narrative_intelligence.pr_opportunities.map((opp: string, i: number) => (
              <div key={i} className="bg-green-900/20 p-3 rounded border border-green-800">
                {opp}
              </div>
            ))}
          </div>
        </div>
      )}

      {narrative_intelligence?.unspoken_implications && (
        <div className="bg-yellow-900/20 p-4 rounded-lg border border-yellow-800">
          <h3 className="text-lg font-semibold mb-2 text-yellow-400">Unspoken Implications</h3>
          <p className="text-gray-300">{narrative_intelligence.unspoken_implications}</p>
        </div>
      )}
    </div>
  );

  const renderPowerDynamics = () => (
    <div className="space-y-6">
      {power_dynamics?.perspective && (
        <div className="text-sm text-orange-400 font-semibold mb-2">
          {power_dynamics.perspective}
        </div>
      )}

      {power_dynamics?.power_movements?.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 text-orange-300">Power Movements</h3>
          <div className="space-y-3">
            {power_dynamics.power_movements.map((movement: any, i: number) => (
              <div key={i} className="bg-gray-800 p-4 rounded-lg border border-orange-900">
                <div className="text-orange-400 font-semibold">
                  {movement.entity || movement.who || movement}
                </div>
                {movement.change && (
                  <div className="text-gray-300 mt-1">{movement.change}</div>
                )}
                {movement.impact && (
                  <div className="text-sm text-gray-400 mt-2">Impact: {movement.impact}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {power_dynamics?.alliance_formations && (
        <div className="bg-blue-900/20 p-4 rounded-lg border border-blue-800">
          <h3 className="text-lg font-semibold mb-2 text-blue-400">Alliance Formations</h3>
          <p className="text-gray-300">{power_dynamics.alliance_formations}</p>
        </div>
      )}

      {power_dynamics?.influence_opportunities?.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 text-green-400">Influence Opportunities</h3>
          <ul className="space-y-2">
            {power_dynamics.influence_opportunities.map((opp: string, i: number) => (
              <li key={i} className="flex items-start">
                <span className="text-green-400 mr-2">→</span>
                <span className="text-gray-300">{opp}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  const renderCulturalContext = () => (
    <div className="space-y-6">
      {cultural_context?.perspective && (
        <div className="text-sm text-pink-400 font-semibold mb-2">
          {cultural_context.perspective}
        </div>
      )}

      {cultural_context?.cultural_alignments?.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 text-pink-300">Cultural Alignments</h3>
          <div className="space-y-2">
            {cultural_context.cultural_alignments.map((trend: string, i: number) => (
              <div key={i} className="bg-gray-800 p-3 rounded-lg">
                <TrendingUp className="inline w-4 h-4 text-pink-400 mr-2" />
                {trend}
              </div>
            ))}
          </div>
        </div>
      )}

      {cultural_context?.zeitgeist_analysis && (
        <div className="bg-purple-900/20 p-4 rounded-lg border border-purple-800">
          <h3 className="text-lg font-semibold mb-2 text-purple-400">Zeitgeist Analysis</h3>
          <p className="text-gray-300">{cultural_context.zeitgeist_analysis}</p>
        </div>
      )}

      {cultural_context?.values_positioning?.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 text-blue-400">Values Positioning</h3>
          <ul className="space-y-2">
            {cultural_context.values_positioning.map((value: string, i: number) => (
              <li key={i} className="text-gray-300">• {value}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  const renderContrarianAnalysis = () => (
    <div className="space-y-6">
      {contrarian_analysis?.perspective && (
        <div className="text-sm text-red-400 font-semibold mb-2">
          {contrarian_analysis.perspective}
        </div>
      )}

      {contrarian_analysis?.uncomfortable_truths && (
        <div className="bg-red-900/20 p-4 rounded-lg border border-red-800">
          <h3 className="text-lg font-semibold mb-2 text-red-400">
            <Eye className="inline w-5 h-5 mr-2" />
            Uncomfortable Truths
          </h3>
          <p className="text-gray-300">{contrarian_analysis.uncomfortable_truths}</p>
        </div>
      )}

      {contrarian_analysis?.challenged_assumptions?.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 text-yellow-400">Challenged Assumptions</h3>
          <div className="space-y-2">
            {contrarian_analysis.challenged_assumptions.map((assumption: string, i: number) => (
              <div key={i} className="bg-yellow-900/20 p-3 rounded border border-yellow-800">
                <AlertTriangle className="inline w-4 h-4 text-yellow-400 mr-2" />
                {assumption}
              </div>
            ))}
          </div>
        </div>
      )}

      {contrarian_analysis?.counter_consensus_plays?.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 text-green-400">Counter-Consensus Plays</h3>
          <div className="space-y-2">
            {contrarian_analysis.counter_consensus_plays.map((play: string, i: number) => (
              <div key={i} className="bg-green-900/20 p-3 rounded border border-green-800">
                <Brain className="inline w-4 h-4 text-green-400 mr-2" />
                {play}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderOpportunitiesThreats = () => (
    <div className="space-y-6">
      {immediate_opportunities?.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 text-green-400">
            <Target className="inline w-5 h-5 mr-2" />
            Immediate Opportunities
          </h3>
          <div className="space-y-3">
            {immediate_opportunities.map((opp: any, i: number) => (
              <div key={i} className="bg-green-900/20 p-4 rounded-lg border border-green-800">
                <div className="font-semibold text-green-400">{opp.opportunity || opp}</div>
                {opp.trigger && (
                  <div className="text-sm text-gray-400 mt-1">Trigger: {opp.trigger}</div>
                )}
                {opp.action && (
                  <div className="text-sm text-gray-300 mt-2">Action: {opp.action}</div>
                )}
                {opp.window && (
                  <div className="text-sm text-yellow-400 mt-1">Window: {opp.window}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {critical_threats?.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 text-red-400">
            <AlertTriangle className="inline w-5 h-5 mr-2" />
            Critical Threats
          </h3>
          <div className="space-y-3">
            {critical_threats.map((threat: any, i: number) => (
              <div key={i} className="bg-red-900/20 p-4 rounded-lg border border-red-800">
                <div className="font-semibold text-red-400">{threat.threat || threat}</div>
                {threat.impact && (
                  <div className="text-sm text-gray-400 mt-1">Impact: {threat.impact}</div>
                )}
                {threat.mitigation && (
                  <div className="text-sm text-gray-300 mt-2">Mitigation: {threat.mitigation}</div>
                )}
                {threat.urgency && (
                  <div className="text-sm text-yellow-400 mt-1">Urgency: {threat.urgency}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'competitive':
        return renderCompetitiveDynamics();
      case 'narrative':
        return renderNarrativeIntelligence();
      case 'power':
        return renderPowerDynamics();
      case 'cultural':
        return renderCulturalContext();
      case 'contrarian':
        return renderContrarianAnalysis();
      case 'opportunities':
        return renderOpportunitiesThreats();
      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-900 rounded-lg p-6">
      {/* Executive Summary */}
      {executive_synthesis && (
        <div className="mb-6 bg-gradient-to-r from-cyan-900/20 to-purple-900/20 p-6 rounded-lg border border-cyan-800">
          <h2 className="text-xl font-bold mb-3 text-cyan-300">Executive Synthesis</h2>
          <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">{executive_synthesis}</p>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap
                ${activeTab === tab.id 
                  ? 'bg-cyan-600 text-white' 
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {renderContent()}
      </div>

      {/* Context Footer */}
      {developments_context && (
        <div className="mt-6 pt-6 border-t border-gray-800">
          <div className="text-sm text-gray-500">
            Analysis based on {developments_context.analyzed_articles?.length || 0} articles • 
            {' '}{developments_context.immediate_actions?.length || 0} immediate actions • 
            {' '}{developments_context.strategic_opportunities?.length || 0} opportunities identified
          </div>
        </div>
      )}
    </div>
  );
};

export default PRPositioningDisplay;