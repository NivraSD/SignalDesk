import React from 'react';
import { HelpCircle } from 'lucide-react';

const AIAdvisorHelp = ({ 
  showQueryHelp, 
  setShowQueryHelp, 
  setChatInput, 
  selectedScenario, 
  chatMessages 
}) => {
  return (
    <>
      {/* Dynamic prompts */}
      {selectedScenario && chatMessages.length === 0 && (
        <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
          <p className="text-xs font-semibold text-purple-800 mb-2">
            Quick actions for: {selectedScenario.title}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setChatInput("What's the immediate priority?")}
              className="text-xs px-2 py-1 bg-white border border-purple-300 rounded hover:bg-purple-100"
            >
              Immediate priority?
            </button>
            <button
              onClick={() => setChatInput("Who needs to be notified?")}
              className="text-xs px-2 py-1 bg-white border border-purple-300 rounded hover:bg-purple-100"
            >
              Notification list?
            </button>
          </div>
        </div>
      )}

      {/* Help Button */}
      <button
        onClick={() => setShowQueryHelp(!showQueryHelp)}
        className="absolute top-2 right-2 p-2 bg-purple-100 rounded-full hover:bg-purple-200 transition-colors z-10"
      >
        <HelpCircle className="w-4 h-4 text-purple-600" />
      </button>
      
      {/* Help Popup */}
      {showQueryHelp && (
        <div className="absolute top-12 right-2 w-80 bg-white border border-gray-200 rounded-lg shadow-xl p-4 z-50">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-semibold text-gray-800">Example Questions:</h4>
            <button onClick={() => setShowQueryHelp(false)} className="text-gray-400">×</button>
          </div>
          <div className="space-y-2 text-sm">
            <button
              onClick={() => { setChatInput("What should I do right now?"); setShowQueryHelp(false); }}
              className="block w-full text-left px-3 py-2 hover:bg-purple-50 rounded"
            >
              🚨 "What should I do right now?"
            </button>
            <button
              onClick={() => { setChatInput("Who should I call first?"); setShowQueryHelp(false); }}
              className="block w-full text-left px-3 py-2 hover:bg-purple-50 rounded"
            >
              📞 "Who should I call first?"
            </button>
            <button
              onClick={() => { setChatInput("What do I tell worried employees?"); setShowQueryHelp(false); }}
              className="block w-full text-left px-3 py-2 hover:bg-purple-50 rounded"
            >
              💬 "What do I tell worried employees?"
            </button>
          </div>
        </div>
      )}
    </>
  );
};
export const CrisisSeverityMeter = ({ messages }) => {
  const calculateSeverity = () => {
    const keywords = {
      critical: ['viral', 'lawsuit', 'injured', 'death', 'breach', 'hacked', 'police', 'arrest'],
      high: ['angry', 'protest', 'media', 'reporter', 'spreading', 'boycott', 'outrage'],
      medium: ['concerned', 'questions', 'worried', 'confused', 'complaints']
    };
    
    const text = messages.map(m => m.content).join(' ').toLowerCase();
    
    if (keywords.critical.some(word => text.includes(word))) return 'critical';
    if (keywords.high.some(word => text.includes(word))) return 'high';
    if (keywords.medium.some(word => text.includes(word))) return 'medium';
    return 'low';
  };

  const severity = calculateSeverity();
  const colors = {
    critical: 'bg-red-500',
    high: 'bg-orange-500',
    medium: 'bg-yellow-500',
    low: 'bg-green-500'
  };

  return (
    <div className="mb-4 p-3 bg-gray-900 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-white">CRISIS SEVERITY</span>
        <span className={`text-xs px-2 py-1 rounded text-white font-bold ${colors[severity]}`}>
          {severity.toUpperCase()}
        </span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-500 ${colors[severity]}`}
          style={{ 
            width: severity === 'critical' ? '100%' : 
                   severity === 'high' ? '75%' : 
                   severity === 'medium' ? '50%' : '25%' 
          }}
        />
      </div>
    </div>
  );
};
export default AIAdvisorHelp;
