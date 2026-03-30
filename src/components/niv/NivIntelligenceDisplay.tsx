import React from 'react';
import { Clock, AlertCircle, TrendingUp, Users, Target, ChevronRight } from 'lucide-react';

interface NivResponseProps {
  response: {
    message: string;
    structured?: any;
    queryType?: string;
    hasIntelligence?: boolean;
  };
}

export const NivIntelligenceDisplay: React.FC<NivResponseProps> = ({ response }) => {
  // If we have structured intelligence report
  if (response.structured?.type === 'intelligence_report' && response.structured?.formatted) {
    return <IntelligenceReport content={response.structured.content} />;
  }

  // If we have media list
  if (response.structured?.type === 'media_list' && response.structured?.journalists) {
    return <MediaListDisplay journalists={response.structured.journalists} />;
  }

  // If we have press release
  if (response.structured?.type === 'press_release') {
    return <PressReleaseDisplay content={response.structured.content} />;
  }

  // If we have strategy plan
  if (response.structured?.type === 'strategy_plan') {
    return <StrategyPlanDisplay content={response.structured.content} />;
  }

  // Fallback to formatted message display
  return <FormattedMessage message={response.message} />;
};

// Intelligence Report Component
const IntelligenceReport: React.FC<{ content: string }> = ({ content }) => {
  // Parse the markdown content into sections
  const sections = parseIntelligenceContent(content);

  return (
    <div className="niv-intelligence-report space-y-6">
      {/* Executive Summary */}
      {sections.executiveSummary && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded-r">
          <h3 className="text-lg font-semibold mb-2 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            Executive Summary
          </h3>
          <p className="text-gray-700 dark:text-gray-300">{sections.executiveSummary}</p>
        </div>
      )}

      {/* Key Developments */}
      {sections.keyDevelopments && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Key Developments (Last 48 Hours)
          </h3>

          {/* Critical/Breaking */}
          {sections.keyDevelopments.critical && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-red-600 dark:text-red-400">
                🔴 Critical/Breaking
              </h4>
              <div className="space-y-2">
                {sections.keyDevelopments.critical.map((item, idx) => (
                  <NewsItem key={idx} item={item} priority="critical" />
                ))}
              </div>
            </div>
          )}

          {/* Important Updates */}
          {sections.keyDevelopments.important && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                🟡 Important Updates
              </h4>
              <div className="space-y-2">
                {sections.keyDevelopments.important.map((item, idx) => (
                  <NewsItem key={idx} item={item} priority="important" />
                ))}
              </div>
            </div>
          )}

          {/* Market Context */}
          {sections.keyDevelopments.context && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-blue-600 dark:text-blue-400">
                🔵 Market Context
              </h4>
              <div className="space-y-2">
                {sections.keyDevelopments.context.map((item, idx) => (
                  <NewsItem key={idx} item={item} priority="context" />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Competitive Intelligence */}
      {sections.competitiveIntelligence && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Competitive Intelligence
          </h3>
          <div className="space-y-2">
            {sections.competitiveIntelligence.map((item, idx) => (
              <div key={idx} className="flex items-start">
                <ChevronRight className="w-4 h-4 mt-1 mr-2 text-gray-400" />
                <div>
                  <span className="font-medium">{item.competitor}:</span>
                  <span className="ml-2 text-gray-600 dark:text-gray-400">{item.intel}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strategic Implications */}
      {sections.strategicImplications && (
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Strategic Implications
          </h3>
          <div className="space-y-3">
            {sections.strategicImplications.map((item, idx) => (
              <div key={idx}>
                <h4 className="font-medium text-purple-700 dark:text-purple-300">
                  {item.title}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Actions */}
      {sections.recommendedActions && (
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <Target className="w-5 h-5 mr-2" />
            Recommended Actions
          </h3>
          <div className="space-y-2">
            {sections.recommendedActions.map((action, idx) => (
              <label key={idx} className="flex items-start cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1 mr-3 rounded border-gray-300"
                />
                <span className="text-sm">{action}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// News Item Component
const NewsItem: React.FC<{ item: any; priority: string }> = ({ item, priority }) => {
  const priorityColors = {
    critical: 'bg-red-50 dark:bg-red-900/20 border-red-200',
    important: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200',
    context: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200'
  };

  return (
    <div className={`p-3 rounded border ${priorityColors[priority]}`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h5 className="font-medium text-sm mb-1">{item.headline}</h5>
          <p className="text-xs text-gray-600 dark:text-gray-400">{item.description}</p>
        </div>
        <div className="text-xs text-gray-500 ml-3 whitespace-nowrap">
          {item.source && <span className="block">{item.source}</span>}
          {item.time && <span className="block">{item.time}</span>}
        </div>
      </div>
    </div>
  );
};

// Media List Display Component
const MediaListDisplay: React.FC<{ journalists: any[] }> = ({ journalists }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Journalist
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Outlet
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Beat
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Contact
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Recent Coverage
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {journalists.map((journalist, idx) => (
            <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800">
              <td className="px-4 py-3 text-sm font-medium">{journalist.name}</td>
              <td className="px-4 py-3 text-sm">{journalist.outlet}</td>
              <td className="px-4 py-3 text-sm">{journalist.beat}</td>
              <td className="px-4 py-3 text-sm">
                <a
                  href={`mailto:${journalist.contact}`}
                  className="text-blue-600 hover:underline"
                >
                  {journalist.contact}
                </a>
              </td>
              <td className="px-4 py-3 text-sm text-gray-500">
                {journalist.recentCoverage}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Press Release Display Component
const PressReleaseDisplay: React.FC<{ content: string }> = ({ content }) => {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
      <div className="prose dark:prose-invert max-w-none">
        <div dangerouslySetInnerHTML={{ __html: formatMarkdown(content) }} />
      </div>
    </div>
  );
};

// Strategy Plan Display Component
const StrategyPlanDisplay: React.FC<{ content: string }> = ({ content }) => {
  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg p-6">
      <div className="prose dark:prose-invert max-w-none">
        <div dangerouslySetInnerHTML={{ __html: formatMarkdown(content) }} />
      </div>
    </div>
  );
};

// Fallback Formatted Message Component
const FormattedMessage: React.FC<{ message: string }> = ({ message }) => {
  return (
    <div className="prose dark:prose-invert max-w-none">
      <div dangerouslySetInnerHTML={{ __html: formatMarkdown(message) }} />
    </div>
  );
};

// Helper Functions

function parseIntelligenceContent(content: string) {
  const sections: any = {};

  // Extract Executive Summary
  const summaryMatch = content.match(/## Executive Summary\n([\s\S]*?)(?=##|\[END|$)/);
  if (summaryMatch) {
    sections.executiveSummary = summaryMatch[1].trim();
  }

  // Extract Key Developments
  const developmentsMatch = content.match(/## Key Developments[\s\S]*?(?=## Competitive|## Strategic|## Recommended|\[END|$)/);
  if (developmentsMatch) {
    sections.keyDevelopments = {
      critical: extractNewsItems(developmentsMatch[0], '🔴 Critical/Breaking'),
      important: extractNewsItems(developmentsMatch[0], '🟡 Important Updates'),
      context: extractNewsItems(developmentsMatch[0], '🔵 Market Context')
    };
  }

  // Extract Competitive Intelligence
  const competitiveMatch = content.match(/## Competitive Intelligence\n([\s\S]*?)(?=##|\[END|$)/);
  if (competitiveMatch) {
    sections.competitiveIntelligence = extractCompetitiveItems(competitiveMatch[1]);
  }

  // Extract Strategic Implications
  const strategicMatch = content.match(/## Strategic Implications\n([\s\S]*?)(?=##|\[END|$)/);
  if (strategicMatch) {
    sections.strategicImplications = extractStrategicItems(strategicMatch[1]);
  }

  // Extract Recommended Actions
  const actionsMatch = content.match(/## Recommended Actions\n([\s\S]*?)(?=\[END|$)/);
  if (actionsMatch) {
    sections.recommendedActions = extractActionItems(actionsMatch[1]);
  }

  return sections;
}

function extractNewsItems(content: string, section: string) {
  const items = [];
  const sectionPattern = new RegExp(`### ${section}([\\s\\S]*?)(?=###|##|$)`);
  const sectionMatch = content.match(sectionPattern);

  if (sectionMatch) {
    const lines = sectionMatch[1].trim().split('\n');
    for (const line of lines) {
      const match = line.match(/- \*\*(.+?)\*\*:\s*(.+?)(?:\((.+?)\))?$/);
      if (match) {
        items.push({
          headline: match[1],
          description: match[2].trim(),
          source: match[3] ? match[3].split(',')[0] : '',
          time: match[3] ? match[3].split(',')[1]?.trim() : ''
        });
      }
    }
  }

  return items;
}

function extractCompetitiveItems(content: string) {
  const items = [];
  const lines = content.trim().split('\n');

  for (const line of lines) {
    const match = line.match(/- \*\*(.+?)\*\*:\s*(.+)$/);
    if (match) {
      items.push({
        competitor: match[1],
        intel: match[2]
      });
    }
  }

  return items;
}

function extractStrategicItems(content: string) {
  const items = [];
  const matches = content.matchAll(/\d+\.\s*\*\*(.+?)\*\*:\s*(.+)/g);

  for (const match of matches) {
    items.push({
      title: match[1],
      description: match[2]
    });
  }

  return items;
}

function extractActionItems(content: string) {
  const items = [];
  const lines = content.trim().split('\n');

  for (const line of lines) {
    const match = line.match(/- \[ \]\s*(.+)/);
    if (match) {
      items.push(match[1]);
    }
  }

  return items;
}

function formatMarkdown(text: string) {
  // Convert markdown to HTML for display
  return text
    .replace(/## (.+)/g, '<h2 class="text-xl font-bold mt-4 mb-2">$1</h2>')
    .replace(/### (.+)/g, '<h3 class="text-lg font-semibold mt-3 mb-2">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/- (.+)/g, '<li>$1</li>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>');
}