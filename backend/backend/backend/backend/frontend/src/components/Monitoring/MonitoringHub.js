import React, { useState } from 'react';
import { Bot, Activity, Target, Zap } from 'lucide-react';
import MonitoringStrategyChatbot from './MonitoringStrategyChatbot';
import SimpleMonitoring from './SimpleMonitoring';

const MonitoringHub = () => {
  const [activeTab, setActiveTab] = useState('strategy');
  const [currentStrategy, setCurrentStrategy] = useState(null);

  const handleStrategyCreated = (strategy) => {
    setCurrentStrategy(strategy);
    // Show notification or option to apply strategy
    console.log('Strategy created:', strategy);
  };

  const applyStrategy = () => {
    if (currentStrategy && currentStrategy.strategy) {
      // Switch to monitoring tab with the strategy
      setActiveTab('monitor');
      console.log('Applied strategy:', currentStrategy);
    }
  };

  const tabs = [
    {
      id: 'strategy',
      name: 'AI Strategy',
      icon: Bot,
      description: 'Create monitoring strategies with AI'
    },
    {
      id: 'monitor',
      name: 'Active Monitoring',
      icon: Activity,
      description: 'Monitor and analyze mentions'
    }
  ];

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header with tabs */}
      <div className="bg-white border-b">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">AI Monitoring System</h1>
          
          <div className="flex space-x-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="font-medium">{tab.name}</span>
              </button>
            ))}
          </div>
          
          {activeTab === 'strategy' && (
            <p className="text-sm text-gray-600 mt-2">
              Tell the AI what you want to monitor and it will create a comprehensive strategy
            </p>
          )}
          
          {activeTab === 'monitor' && (
            <p className="text-sm text-gray-600 mt-2">
              Fetch mentions, analyze sentiment, and track your monitoring targets
            </p>
          )}
        </div>

        {/* Strategy notification */}
        {currentStrategy && activeTab === 'strategy' && (
          <div className="px-6 pb-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-800">
                    Strategy created for {currentStrategy.profile?.company || 'your target'}
                  </span>
                </div>
                <button
                  onClick={applyStrategy}
                  className="flex items-center gap-2 px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  <Zap className="w-4 h-4" />
                  Apply & Start Monitoring
                </button>
              </div>
              <p className="text-sm text-green-700 mt-1">
                Keywords: {currentStrategy.strategy?.keywords?.join(', ') || 'None specified'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'strategy' && (
          <MonitoringStrategyChatbot onStrategyCreated={handleStrategyCreated} />
        )}
        
        {activeTab === 'monitor' && (
          <div className="h-full">
            <SimpleMonitoring strategy={currentStrategy} />
          </div>
        )}
      </div>
    </div>
  );
};

export default MonitoringHub;