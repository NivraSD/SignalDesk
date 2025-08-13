import React from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();

  const features = [
    { title: 'AI Assistant', path: '/ai-assistant', color: '#007bff', desc: 'Get AI-powered PR advice' },
    { title: 'Content Generator', path: '/content-generator', color: '#28a745', desc: 'Create PR content' },
    { title: 'Media List Builder', path: '/media-list', color: '#17a2b8', desc: 'Manage contacts' },
    { title: 'Campaign Intelligence', path: '/campaign-intelligence', color: '#ffc107', desc: 'Plan campaigns' },
    { title: 'MemoryVault', path: '/memory-vault', color: '#6f42c1', desc: 'Store brand content' },
    { title: 'Crisis Command', path: '/crisis-command', color: '#dc3545', desc: 'Crisis management' },
    { title: 'AI Monitoring', path: '/monitoring', color: '#00bcd4', desc: 'Sentiment analysis & alerts' }
  ];

  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ marginBottom: '2rem' }}>Welcome to SignalDesk!</h1>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
        gap: '1.5rem' 
      }}>
        {features.map((feature) => (
          <div
            key={feature.path}
            onClick={() => navigate(feature.path)}
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '2rem',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              border: `3px solid ${feature.color}20`
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
            }}
          >
            <h3 style={{ color: feature.color, marginBottom: '0.5rem' }}>{feature.title}</h3>
            <p style={{ color: '#666', margin: 0 }}>{feature.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
