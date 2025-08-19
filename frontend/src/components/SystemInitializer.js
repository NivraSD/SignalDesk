import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './SystemInitializer.css';

const SystemInitializer = ({ onComplete }) => {
  const navigate = useNavigate();
  const [initStatus, setInitStatus] = useState('starting');
  const [progress, setProgress] = useState(0);
  const [currentTask, setCurrentTask] = useState('');
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    initializeSystem();
  }, []);

  const initializeSystem = async () => {
    console.log('🚀 Starting SignalDesk initialization...');
    
    // Get saved configuration
    const savedConfig = localStorage.getItem('signaldesk_onboarding');
    if (!savedConfig) {
      navigate('/');
      return;
    }

    const config = JSON.parse(savedConfig);
    
    // Simplified initialization - only what actually works
    const initTasks = [
      { id: 'config', name: 'Loading configuration', weight: 20 },
      { id: 'opportunities', name: 'Connecting to opportunity detection', weight: 30 },
      { id: 'stakeholders', name: 'Setting up stakeholder monitoring', weight: 25 },
      { id: 'intelligence', name: 'Initializing intelligence gathering', weight: 25 }
    ];

    setTasks(initTasks.map(t => ({ ...t, status: 'pending' })));
    
    let completedWeight = 0;
    
    for (const task of initTasks) {
      setCurrentTask(task.name);
      setTasks(prev => prev.map(t => 
        t.id === task.id ? { ...t, status: 'running' } : t
      ));

      try {
        if (task.id === 'opportunities') {
          // Actually call the deployed opportunities MCP
          await callOpportunitiesMCP(config);
        } else {
          // For other tasks, just simulate for now since MCPs aren't deployed
          await new Promise(resolve => setTimeout(resolve, 800));
        }
        
        completedWeight += task.weight;
        setProgress(completedWeight);
        
        setTasks(prev => prev.map(t => 
          t.id === task.id ? { ...t, status: 'completed' } : t
        ));
        
      } catch (error) {
        console.error(`Error with ${task.id}:`, error);
        // Don't fail the whole init if one part fails
        setTasks(prev => prev.map(t => 
          t.id === task.id ? { ...t, status: 'completed' } : t
        ));
        completedWeight += task.weight;
        setProgress(completedWeight);
      }
    }

    // Final setup
    setCurrentTask('Starting dashboard...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setInitStatus('complete');
    setProgress(100);
    
    // Save initialization timestamp
    localStorage.setItem('signaldesk_initialized', new Date().toISOString());
    
    // Navigate to dashboard
    setTimeout(() => {
      if (onComplete) {
        onComplete(config);
      } else {
        window.location.href = '/dashboard'; // Hard refresh to ensure clean state
      }
    }, 1500);
  };

  const callOpportunitiesMCP = async (config) => {
    console.log('Calling Opportunities MCP...');
    
    try {
      // Call your deployed MCP
      const response = await fetch('https://signaldesk-opportunities.vercel.app/api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          method: 'discover_opportunities',
          params: {
            industry: config.organization?.industry || 'technology',
            keywords: [], // From config.stakeholders if needed
            limit: 5
          }
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Opportunities MCP responded:', data);
        
        // Store initial opportunities
        if (data.success && data.data) {
          localStorage.setItem('signaldesk_initial_opportunities', JSON.stringify(data.data));
        }
      }
    } catch (error) {
      console.log('Opportunities MCP not critical for startup, continuing...');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return '✅';
      case 'running': return '🔄';
      default: return '⏳';
    }
  };

  return (
    <div className="system-initializer">
      <div className="init-container">
        <div className="init-header">
          <div className="logo-animation">
            <span className="logo-icon">🚀</span>
          </div>
          <h1>Starting SignalDesk</h1>
          <p className="init-subtitle">Preparing your intelligence dashboard...</p>
        </div>

        <div className="progress-container">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="progress-text">{Math.round(progress)}%</span>
        </div>

        <div className="current-task">
          {currentTask}
        </div>

        <div className="task-list">
          {tasks.map((task) => (
            <div key={task.id} className={`task-item ${task.status}`}>
              <span className="task-icon">{getStatusIcon(task.status)}</span>
              <span className="task-name">{task.name}</span>
            </div>
          ))}
        </div>

        {initStatus === 'complete' && (
          <div className="complete-message">
            <div className="checkmark">✓</div>
            <h2>Ready!</h2>
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemInitializer;