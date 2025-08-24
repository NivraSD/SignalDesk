import React, { useState, useEffect } from 'react';
import AdaptiveNivAssistant from './AdaptiveNivAssistant';
import './NivCommandCenter.css';

const NivCommandCenter = ({ onFeatureRequest, onContentGenerated }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Add deployment verification
    console.log('🤖 Niv Command Center loaded at:', new Date().toISOString());
    if (window.BUILD_INFO) {
      console.log('📋 Build Info:', window.BUILD_INFO);
    }
  }, []);

  return (
    <div className="niv-command-center">
      <div className="command-header">
        <h1>🧠 Niv - Your AI PR Strategist</h1>
        <div className="status-indicator online">
          <span className="pulse"></span>
          20+ Years Experience • Always Learning
        </div>
      </div>
      
      <div className={`command-interface ${isExpanded ? 'expanded' : 'collapsed'}`}>
        <AdaptiveNivAssistant 
          onContentGenerated={onContentGenerated}
          onStrategyGenerated={(strategy) => {
            console.log('Strategy generated:', strategy);
            setNotifications(prev => [...prev, 'New strategy available']);
          }}
          initialMode="command"
        />
      </div>
      
      {notifications.length > 0 && (
        <div className="notifications-panel">
          {notifications.slice(-3).map((notification, idx) => (
            <div key={idx} className="notification">
              {notification}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NivCommandCenter;
