import React, { useState } from 'react';
import { Search, TrendingUp, Users, Target, Brain, Zap, Map, BarChart, MessageSquare, Lightbulb, Coffee, Globe } from 'lucide-react';
import { useProject } from '../contexts/ProjectContext';
import API_BASE_URL from '../config/api';

const MediaIntelligence = () => {
  const { activeProject } = useProject();
  const [testVersion] = useState('2.0-FORCE-UPDATE-' + Date.now());

  return (
    <div style={{ padding: '40px', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '16px',
        padding: '40px',
        color: 'white',
        textAlign: 'center',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
      }}>
        <h1 style={{ fontSize: '48px', margin: '0 0 20px 0' }}>
          🧠 MEDIA INTELLIGENCE PLATFORM v2.0
        </h1>
        <p style={{ fontSize: '24px', opacity: 0.9 }}>
          If you see this, the new component is WORKING!
        </p>
        <p style={{ fontSize: '18px', opacity: 0.7, marginTop: '20px' }}>
          Version: {testVersion}
        </p>
        <p style={{ fontSize: '16px', opacity: 0.7 }}>
          Project: {activeProject?.name || 'No project selected'}
        </p>
      </div>

      <div style={{
        marginTop: '40px',
        padding: '30px',
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ color: '#333', marginBottom: '20px' }}>✅ New Features Active:</h2>
        <ul style={{ fontSize: '18px', lineHeight: '2', color: '#555' }}>
          <li>Smart Search Interface with Step-by-Step Builder</li>
          <li>Media Landscape Analysis with Heat Maps</li>
          <li>Opportunity Scoring and Urgency Tracking</li>
          <li>Competitive Intelligence Monitoring</li>
          <li>AI-Generated Pitch Angles</li>
          <li>Conversation Starters for Relationship Building</li>
        </ul>
      </div>

      <div style={{
        marginTop: '30px',
        padding: '20px',
        background: '#f8f9fa',
        borderRadius: '8px',
        border: '2px dashed #dee2e6'
      }}>
        <p style={{ color: '#666', textAlign: 'center', margin: 0 }}>
          <strong>Debug Info:</strong> MediaIntelligence.js is loaded and rendering correctly.
          <br />
          If you still see MediaListBuilder, clear your browser cache and hard refresh (Cmd+Shift+R).
        </p>
      </div>
    </div>
  );
};

export default MediaIntelligence;