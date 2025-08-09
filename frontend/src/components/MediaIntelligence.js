import React from 'react';
import { useProject } from '../contexts/ProjectContext';

const MediaIntelligence = () => {
  const { activeProject } = useProject();
  const timestamp = new Date().toISOString();

  return (
    <div style={{ padding: '20px' }}>
      <div style={{
        background: 'linear-gradient(135deg, #ff6b6b 0%, #4ecdc4 100%)',
        color: 'white',
        padding: '60px',
        borderRadius: '20px',
        textAlign: 'center',
        fontSize: '48px',
        fontWeight: 'bold',
        marginBottom: '40px'
      }}>
        🚀 MEDIA INTELLIGENCE v3.0 FINAL
      </div>
      
      <div style={{
        background: '#28a745',
        color: 'white',
        padding: '30px',
        borderRadius: '15px',
        fontSize: '24px',
        textAlign: 'center',
        marginBottom: '30px'
      }}>
        ✅ IF YOU SEE THIS, IT'S WORKING!
        <br />
        <span style={{ fontSize: '16px', opacity: 0.9 }}>
          Deployed at: {timestamp}
        </span>
      </div>

      <div style={{
        background: 'white',
        border: '3px solid #28a745',
        padding: '30px',
        borderRadius: '15px'
      }}>
        <h2>New Features:</h2>
        <ul style={{ fontSize: '18px', lineHeight: '2' }}>
          <li>✨ Smart Search with AI</li>
          <li>📊 Media Landscape Analysis</li>
          <li>🎯 Opportunity Scoring</li>
          <li>🔥 Competitive Intelligence</li>
          <li>💡 AI Pitch Generation</li>
        </ul>
        <p style={{ marginTop: '20px', color: '#666' }}>
          Project: {activeProject?.name || 'No project selected'}
        </p>
      </div>
    </div>
  );
};

export default MediaIntelligence;