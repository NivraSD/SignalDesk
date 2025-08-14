#!/usr/bin/env node
/**
 * Fix Niv Command Center Integration
 * Ensures Niv is prominently featured as the main AI assistant
 */

const fs = require('fs');
const path = require('path');

console.log('🤖 Fixing Niv Command Center integration...');

// Read current RailwayDraggable to check Niv integration
const railwayPath = path.join(__dirname, 'src', 'components', 'RailwayDraggable.js');
if (fs.existsSync(railwayPath)) {
  const railwayContent = fs.readFileSync(railwayPath, 'utf8');
  
  // Check if Niv is properly positioned
  if (railwayContent.includes('niv-command-center')) {
    console.log('✅ Niv is configured as command center in RailwayDraggable');
  } else {
    console.log('⚠️  Niv may not be properly configured as command center');
  }
}

// Create Niv command center wrapper component
const nivWrapperContent = `import React, { useState, useEffect } from 'react';
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
      
      <div className={\`command-interface \${isExpanded ? 'expanded' : 'collapsed'}\`}>
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
`;

fs.writeFileSync(
  path.join(__dirname, 'src', 'components', 'NivCommandCenter.js'), 
  nivWrapperContent
);

// Create CSS for command center styling
const nivCssContent = `.niv-command-center {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  overflow: hidden;
}

.command-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.command-header h1 {
  color: white;
  font-size: 1.8rem;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 10px;
  color: white;
  font-size: 0.9rem;
  padding: 8px 16px;
  border-radius: 20px;
  background: rgba(0, 255, 0, 0.2);
  border: 1px solid rgba(0, 255, 0, 0.5);
}

.pulse {
  width: 10px;
  height: 10px;
  background: #00ff00;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(0, 255, 0, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(0, 255, 0, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(0, 255, 0, 0); }
}

.command-interface {
  flex: 1;
  background: rgba(255, 255, 255, 0.98);
  margin: 20px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
  transition: all 0.3s ease;
}

.command-interface.expanded {
  transform: scale(1);
}

.command-interface.collapsed {
  transform: scale(0.98);
  opacity: 0.9;
}

.notifications-panel {
  position: absolute;
  top: 80px;
  right: 20px;
  z-index: 1000;
}

.notification {
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 10px 15px;
  border-radius: 8px;
  margin-bottom: 10px;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
`;

fs.writeFileSync(
  path.join(__dirname, 'src', 'components', 'NivCommandCenter.css'),
  nivCssContent
);

console.log('✅ Created NivCommandCenter component');
console.log('✅ Created command center styling');
console.log('\n📋 Integration Check:');
console.log('1. Niv should be the FIRST item in the activities array');
console.log('2. It should use AdaptiveNivAssistant component');
console.log('3. It should be marked as the command center');
console.log('\n🎯 Manual verification needed in RailwayDraggable.js');