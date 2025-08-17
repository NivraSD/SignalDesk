import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import './NivStrategicOrchestrator.css';

/**
 * TWO-PHASE NIV SYSTEM
 * 
 * Phase 1: Consultation (niv-consultant)
 * - Pure conversation to build context
 * - No artifact generation
 * - Extracts and tracks context
 * 
 * Phase 2: Generation (niv-generator)
 * - Takes built context
 * - Generates ONE specific artifact
 * - Returns structured JSON
 * 
 * This solves the passthrough problem by separating concerns
 */

const NivTwoPhase = ({ onWorkCardCreate }) => {
  // Consultation state
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [context, setContext] = useState({});
  const [stage, setStage] = useState('discovery');
  
  // Generation state
  const [canGenerate, setCanGenerate] = useState(false);
  const [generationOptions, setGenerationOptions] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedArtifacts, setGeneratedArtifacts] = useState([]);

  // Phase 1: Consultation
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    // Add user message to chat
    const newUserMessage = { type: 'user', content: userMessage };
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);

    try {
      // Call consultation endpoint
      const { data, error } = await supabase.functions.invoke('niv-consultant', {
        body: {
          message: userMessage,
          messages: updatedMessages,
          context
        }
      });

      if (error) throw error;

      // Add Niv's response
      setMessages([...updatedMessages, { 
        type: 'assistant', 
        content: data.response 
      }]);

      // Update context and stage
      if (data.context) {
        setContext(data.context);
      }
      if (data.stage) {
        setStage(data.stage);
      }

      // Check if ready to generate
      if (data.readyToGenerate) {
        setCanGenerate(true);
        setGenerationOptions(data.generationOptions?.types || [
          'media-list',
          'press-release', 
          'strategy-plan'
        ]);
      }

    } catch (error) {
      console.error('Consultation error:', error);
      setMessages([...updatedMessages, {
        type: 'error',
        content: `Error: ${error.message}`
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Phase 2: Generation
  const handleGenerateContent = async (type) => {
    if (isGenerating) return;
    
    setIsGenerating(true);

    try {
      // Get the last user message for additional requirements
      const lastUserMessage = messages
        .filter(m => m.type === 'user')
        .pop();
      
      // Call generation endpoint with built context
      const { data, error } = await supabase.functions.invoke('niv-generator', {
        body: {
          type,
          context: {
            ...context,
            conversationSummary: messages
              .map(m => m.content)
              .join('\n')
          },
          requirements: lastUserMessage?.content || ''
        }
      });

      if (error) throw error;

      if (data.success && data.workItem) {
        // Add to generated artifacts
        setGeneratedArtifacts([...generatedArtifacts, data.workItem]);

        // Create work card with ACTUAL generated content
        if (onWorkCardCreate) {
          onWorkCardCreate({
            type: data.workItem.type,
            title: data.workItem.title,
            description: data.workItem.description,
            generatedContent: data.workItem.generatedContent, // Direct passthrough
            metadata: data.workItem.metadata
          });
        }

        // Add success message to chat
        setMessages([...messages, {
          type: 'system',
          content: `✅ Successfully generated ${type}. Click on the work card to view and edit.`
        }]);
      } else {
        throw new Error(data.error || 'Generation failed');
      }

    } catch (error) {
      console.error('Generation error:', error);
      setMessages([...messages, {
        type: 'error',
        content: `Failed to generate ${type}: ${error.message}`
      }]);
    } finally {
      setIsGenerating(false);
    }
  };

  // Helper to get stage color
  const getStageColor = () => {
    switch (stage) {
      case 'discovery': return '#dc2626';
      case 'refinement': return '#f59e0b';
      case 'ready': return '#10b981';
      default: return '#6b7280';
    }
  };

  // Helper to get stage description
  const getStageDescription = () => {
    switch (stage) {
      case 'discovery':
        return 'Tell Niv about your company and product';
      case 'refinement':
        return 'Define your goals and target audience';
      case 'ready':
        return 'Context complete - ready to generate content';
      default:
        return 'Building context...';
    }
  };

  return (
    <div className="niv-orchestrator">
      <div className="niv-header">
        <h2>Niv - Strategic PR Consultant</h2>
        <div style={{ 
          display: 'inline-block',
          padding: '4px 12px',
          borderRadius: '4px',
          backgroundColor: getStageColor(),
          color: 'white',
          fontSize: '12px',
          fontWeight: 'bold',
          marginLeft: '10px'
        }}>
          Stage: {stage.toUpperCase()}
        </div>
      </div>

      <div className="niv-description">
        <p>{getStageDescription()}</p>
      </div>

      {/* Context Summary */}
      {Object.keys(context).length > 0 && (
        <div className="context-summary">
          <h4>Current Context:</h4>
          <div className="context-items">
            {context.companyName && (
              <span className="context-item">Company: {context.companyName}</span>
            )}
            {context.productName && (
              <span className="context-item">Product: {context.productName}</span>
            )}
            {context.industry && (
              <span className="context-item">Industry: {context.industry}</span>
            )}
            {context.goals?.length > 0 && (
              <span className="context-item">Goals: {context.goals.length}</span>
            )}
          </div>
        </div>
      )}

      {/* Chat Messages */}
      <div className="niv-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.type}-message`}>
            {msg.type === 'assistant' && (
              <div className="message-avatar">Niv</div>
            )}
            <div className="message-content">
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message assistant-message">
            <div className="message-avatar">Niv</div>
            <div className="message-content typing-indicator">
              Thinking...
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="niv-input-area">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Tell Niv about your PR needs..."
          disabled={isLoading}
        />
        <button 
          onClick={handleSendMessage} 
          disabled={isLoading || !inputMessage.trim()}
          className="send-button"
        >
          Send
        </button>
      </div>

      {/* Generation Options - Only show when ready */}
      {canGenerate && (
        <div className="generation-panel">
          <h3>Ready to Generate Content</h3>
          <p>Choose what you'd like to create:</p>
          <div className="generation-buttons">
            <button
              onClick={() => handleGenerateContent('media-list')}
              disabled={isGenerating}
              className="generate-button"
            >
              Generate Media List
            </button>
            <button
              onClick={() => handleGenerateContent('press-release')}
              disabled={isGenerating}
              className="generate-button"
            >
              Generate Press Release
            </button>
            <button
              onClick={() => handleGenerateContent('strategy-plan')}
              disabled={isGenerating}
              className="generate-button"
            >
              Generate Strategy Plan
            </button>
          </div>
          {isGenerating && (
            <div className="generating-indicator">
              Generating content with your context...
            </div>
          )}
        </div>
      )}

      {/* Generated Artifacts Summary */}
      {generatedArtifacts.length > 0 && (
        <div className="artifacts-summary">
          <h4>Generated Content:</h4>
          <ul>
            {generatedArtifacts.map((artifact, idx) => (
              <li key={idx}>
                ✅ {artifact.title} - {artifact.type}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default NivTwoPhase;