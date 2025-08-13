import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AIAssistant from '../components/AIAssistant/AIAssistant';
import QuickActions from '../components/common/QuickActions';
import RecentProjects from '../components/common/RecentProjects';

const Homepage = () => {
  const navigate = useNavigate();
  const [assistantResponse, setAssistantResponse] = useState('');

  const quickActions = [
    {
      title: 'Create New Project',
      description: 'Start a new PR campaign or project',
      icon: '📁',
      action: () => navigate('/projects?action=new')
    },
    {
      title: 'Generate Press Release',
      description: 'AI-powered press release generator',
      icon: '📝',
      action: () => navigate('/projects?action=content&type=press_release')
    },
    {
      title: 'Media List Builder',
      description: 'Find and organize media contacts',
      icon: '📋',
      action: () => navigate('/projects?action=media_list')
    },
    {
      title: 'Crisis Management',
      description: 'Access crisis command center',
      icon: '🚨',
      action: () => navigate('/projects?action=crisis')
    }
  ];

  const handleAssistantAction = (action, data) => {
    console.log('Assistant action:', action, data);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to SignalDesk
        </h1>
        <p className="text-xl text-gray-600">
          Your AI-powered PR command center
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4">AI Assistant</h2>
        <AIAssistant 
          onAction={handleAssistantAction}
          onResponse={setAssistantResponse}
        />
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <QuickActions key={index} {...action} />
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4">Recent Projects</h2>
        <RecentProjects />
      </div>
    </div>
  );
};

export default Homepage;
