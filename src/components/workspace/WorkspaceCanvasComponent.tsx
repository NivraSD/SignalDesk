'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, useDragControls } from 'framer-motion';
import { Save, Folder, Sparkles, FileText, AlertCircle, CheckCircle, Loader2, Edit3, MessageSquare, Move, X, Maximize2, Minimize2 } from 'lucide-react';
import { useMemoryVault } from '@/hooks/useMemoryVault';

interface WorkspaceCanvasComponentProps {
  id: string;
  position: { x: number; y: number };
  onPositionChange?: (id: string, position: { x: number; y: number }) => void;
  initialContentId?: string;
}

export default function WorkspaceCanvasComponent({
  id,
  position,
  onPositionChange,
  initialContentId
}: WorkspaceCanvasComponentProps) {
  const { content: memoryVaultContent, loading: memoryLoading, saveContent } = useMemoryVault();
  const dragControls = useDragControls();
  const componentRef = useRef<HTMLDivElement>(null);

  const [currentContent, setCurrentContent] = useState<any>(null);
  const [editorContent, setEditorContent] = useState('');
  const [contentTitle, setContentTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [showMemoryVault, setShowMemoryVault] = useState(false);
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [localPosition, setLocalPosition] = useState(position);

  // Load initial content if provided
  useEffect(() => {
    if (initialContentId && memoryVaultContent.length > 0) {
      const content = memoryVaultContent.find(c => c.id === initialContentId);
      if (content) {
        loadContentFromMemoryVault(content);
      }
    }
  }, [initialContentId, memoryVaultContent]);

  // Listen for openInWorkspace events from Memory Vault
  useEffect(() => {
    const handleOpenInWorkspace = (event: any) => {
      console.log('📝 Workspace received content:', event.detail);
      const contentData = event.detail;

      // Create a content object compatible with loadContentFromMemoryVault
      const content = {
        id: contentData.id,
        title: contentData.title,
        content_type: contentData.type,
        content: contentData.content,
        metadata: contentData.metadata
      };

      loadContentFromMemoryVault(content);
    };

    window.addEventListener('openInWorkspace', handleOpenInWorkspace);

    return () => {
      window.removeEventListener('openInWorkspace', handleOpenInWorkspace);
    };
  }, []);

  const loadContentFromMemoryVault = (content: any) => {
    setCurrentContent(content);
    setContentTitle(content.title || 'Untitled');

    // Extract text content based on type
    let textContent = '';

    if (content.content_type === 'strategy') {
      // For strategic frameworks, format nicely
      const framework = content.content;
      textContent = `# ${content.title}\n\n`;

      if (framework.strategy?.objective) {
        textContent += `## Objective\n${framework.strategy.objective}\n\n`;
      }
      if (framework.strategy?.narrative) {
        textContent += `## Core Narrative\n${framework.strategy.narrative}\n\n`;
      }
      if (framework.strategy?.proof_points) {
        textContent += `## Proof Points\n`;
        framework.strategy.proof_points.forEach((point: string) => {
          textContent += `- ${point}\n`;
        });
        textContent += '\n';
      }
      if (framework.strategy?.key_messages) {
        textContent += `## Key Messages\n`;
        framework.strategy.key_messages.forEach((msg: string, idx: number) => {
          textContent += `${idx + 1}. ${msg}\n`;
        });
        textContent += '\n';
      }
    } else if (typeof content.content === 'string') {
      textContent = content.content;
    } else if (content.content?.text) {
      textContent = content.content.text;
    } else {
      textContent = JSON.stringify(content.content, null, 2);
    }

    setEditorContent(textContent);
    setShowMemoryVault(false);
  };

  const handleSaveToMemoryVault = async () => {
    if (!contentTitle.trim() || !editorContent.trim()) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2000);
      return;
    }

    setIsSaving(true);
    setSaveStatus('saving');

    try {
      const contentType = currentContent?.content_type || 'general';

      await saveContent({
        title: contentTitle,
        content: editorContent,
        content_type: contentType,
        tags: currentContent?.tags || []
      });

      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Error saving to Memory Vault:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAIAssist = async (mode: 'edit' | 'suggest') => {
    if (!aiPrompt.trim() && mode === 'suggest') return;

    setAiLoading(true);
    setAiResponse('');

    try {
      const contextText = selectedText || editorContent;

      let systemPrompt = '';
      let userMessage = '';

      if (mode === 'edit') {
        systemPrompt = 'You are an expert PR and marketing content editor. Edit the content to improve clarity, impact, and professional tone. Return ONLY the edited content, no explanations.';
        userMessage = `Edit this content:\n\n${contextText}`;
      } else {
        systemPrompt = 'You are an expert PR and marketing content strategist. Provide specific, actionable recommendations to improve this content. Be concise and practical.';
        userMessage = `${aiPrompt}\n\nContent:\n${contextText}`;
      }

      const response = await fetch('/api/claude-direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: userMessage
            }
          ],
          system: systemPrompt,
          max_tokens: 2000,
          temperature: 0.7
        }),
      });

      if (!response.ok) throw new Error('AI request failed');

      const data = await response.json();

      if (data.content) {
        setAiResponse(data.content);
      }
    } catch (error) {
      console.error('AI assist error:', error);
      setAiResponse('Error: Unable to get AI assistance. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      setSelectedText(selection.toString());
    }
  };

  const applyAIEdit = () => {
    if (aiResponse) {
      if (selectedText) {
        // Replace selected text with AI response
        setEditorContent(editorContent.replace(selectedText, aiResponse));
      } else {
        // No text selected - intelligently merge based on content type
        const isSchema = currentContent?.content_type === 'schema' ||
                        editorContent.trim().startsWith('{') ||
                        editorContent.trim().startsWith('[');

        if (isSchema) {
          // For schemas: Try to merge AI recommendations
          try {
            const existingSchema = JSON.parse(editorContent);
            const aiSuggestion = JSON.parse(aiResponse);

            // Merge strategies based on what AI returned
            let mergedSchema = { ...existingSchema };

            // If AI returned a full schema with @graph, merge the graphs
            if (aiSuggestion['@graph'] && existingSchema['@graph']) {
              // Find new entities in AI suggestion
              const existingIds = new Set(
                existingSchema['@graph'].map((e: any) => e['@id']).filter(Boolean)
              );

              const newEntities = aiSuggestion['@graph'].filter(
                (e: any) => !e['@id'] || !existingIds.has(e['@id'])
              );

              mergedSchema['@graph'] = [...existingSchema['@graph'], ...newEntities];

              // Also merge top-level properties from AI suggestion
              Object.keys(aiSuggestion).forEach(key => {
                if (key !== '@graph' && key !== '@context') {
                  mergedSchema[key] = aiSuggestion[key];
                }
              });
            } else if (aiSuggestion['@graph']) {
              // AI returned a new graph structure - append to existing
              mergedSchema['@graph'] = [...(existingSchema['@graph'] || []), ...aiSuggestion['@graph']];
            } else {
              // AI returned individual properties/enhancements - merge them
              mergedSchema = { ...existingSchema, ...aiSuggestion };
            }

            setEditorContent(JSON.stringify(mergedSchema, null, 2));
          } catch (e) {
            // If parsing fails, append AI response as comment/note
            setEditorContent(editorContent + '\n\n/* AI Suggestion:\n' + aiResponse + '\n*/');
          }
        } else {
          // For non-schema content: Append AI response
          setEditorContent(editorContent + '\n\n' + aiResponse);
        }
      }
      setAiResponse('');
      setSelectedText('');
    }
  };

  const startDrag = (e: React.PointerEvent) => {
    dragControls.start(e);
  };

  return (
    <motion.div
      ref={componentRef}
      drag
      dragControls={dragControls}
      dragMomentum={false}
      dragElastic={0}
      animate={{ x: localPosition.x, y: localPosition.y }}
      onDragEnd={(e, info) => {
        const newX = localPosition.x + info.offset.x;
        const newY = localPosition.y + info.offset.y;
        setLocalPosition({ x: newX, y: newY });
        if (onPositionChange) {
          onPositionChange(id, { x: newX, y: newY });
        }
      }}
      onKeyDown={(e) => e.stopPropagation()}
      className="absolute bg-gray-900/95 backdrop-blur-xl rounded-lg shadow-2xl border border-pink-500/30 flex flex-col overflow-hidden"
      style={{
        width: 900,
        height: isMinimized ? 'auto' : 700,
        boxShadow: '0 0 40px rgba(236, 72, 153, 0.3)',
        zIndex: 10,
        left: 0,
        top: 0
      }}
    >
      {/* Header - Draggable */}
      <div
        className="flex-shrink-0 bg-gradient-to-r from-pink-600 to-rose-600 p-3 rounded-t-lg cursor-move"
        onPointerDown={startDrag}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Move className="w-4 h-4 text-white/60" />
            <div className="relative">
              <FileText className="w-6 h-6 text-white" />
              <Sparkles className="w-3 h-3 text-yellow-300 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-white font-bold text-sm">Workspace</h3>
                <input
                  type="text"
                  value={contentTitle}
                  onChange={(e) => setContentTitle(e.target.value)}
                  placeholder="Untitled Document"
                  className="bg-white/20 text-white placeholder-white/60 px-2 py-1 rounded text-sm border-none outline-none"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <p className="text-white/80 text-xs">AI-Powered Content Editor</p>
            </div>
          </div>
          <div className="flex items-center gap-1" onPointerDown={(e) => e.stopPropagation()}>
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 hover:bg-white/20 rounded transition-colors"
            >
              {isMinimized ? (
                <Maximize2 className="w-4 h-4 text-white" />
              ) : (
                <Minimize2 className="w-4 h-4 text-white" />
              )}
            </button>
          </div>
        </div>
      </div>

      {!isMinimized && (
        <div className="flex flex-col flex-1 min-h-0">
          {/* Toolbar */}
          <div className="flex-shrink-0 bg-gray-800 border-b border-gray-700 px-3 py-2 flex items-center gap-2">
            <button
              onClick={() => setShowMemoryVault(!showMemoryVault)}
              className={`px-3 py-1.5 rounded-md flex items-center gap-2 text-sm transition-all ${
                showMemoryVault
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <Folder className="w-4 h-4" />
              Memory Vault
            </button>

            <button
              onClick={() => setAiAssistantOpen(!aiAssistantOpen)}
              className={`px-3 py-1.5 rounded-md flex items-center gap-2 text-sm transition-all ${
                aiAssistantOpen
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              AI Assistant
            </button>

            <div className="flex-1" />

            <button
              onClick={handleSaveToMemoryVault}
              disabled={isSaving}
              className={`px-4 py-1.5 rounded-md flex items-center gap-2 text-sm font-medium transition-all ${
                saveStatus === 'success'
                  ? 'bg-green-600 text-white'
                  : saveStatus === 'error'
                  ? 'bg-red-600 text-white'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : saveStatus === 'success' ? (
                <CheckCircle className="w-4 h-4" />
              ) : saveStatus === 'error' ? (
                <AlertCircle className="w-4 h-4" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isSaving ? 'Saving...' : saveStatus === 'success' ? 'Saved!' : saveStatus === 'error' ? 'Error' : 'Save'}
            </button>
          </div>

          {/* Main Content Area */}
          <div className="flex flex-1 min-h-0">
            {/* Memory Vault Panel */}
            {showMemoryVault && (
              <div className="w-72 border-r border-gray-700 overflow-y-auto bg-gray-800/50 p-3">
                <h3 className="font-semibold mb-3 text-gray-200 text-sm">Memory Vault</h3>

                {memoryLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  </div>
                ) : memoryVaultContent.length === 0 ? (
                  <p className="text-sm text-gray-500">No saved content yet</p>
                ) : (
                  <div className="space-y-2">
                    {memoryVaultContent.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => loadContentFromMemoryVault(item)}
                        className="w-full text-left p-3 rounded-lg bg-gray-900/50 hover:bg-pink-600/20 border border-gray-700 hover:border-pink-500/50 transition-all"
                      >
                        <div className="font-medium text-sm text-gray-200 truncate">
                          {item.title}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {item.content_type}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {new Date(item.created_at).toLocaleDateString()}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Editor */}
            <div className="flex-1 flex flex-col min-h-0">
              <textarea
                value={editorContent}
                onChange={(e) => setEditorContent(e.target.value)}
                onMouseUp={handleTextSelection}
                placeholder="Start writing or load content from Memory Vault..."
                className="flex-1 p-6 resize-none outline-none bg-gray-900 text-gray-200 font-mono text-sm leading-relaxed min-h-0"
                style={{ caretColor: '#ec4899' }}
              />
            </div>

            {/* AI Assistant Panel */}
            {aiAssistantOpen && (
              <div className="w-80 border-l border-gray-700 flex flex-col bg-gray-800/50">
                <div className="p-3 border-b border-gray-700 bg-purple-900/30">
                  <h3 className="font-semibold text-purple-300 flex items-center gap-2 text-sm">
                    <Sparkles className="w-4 h-4" />
                    AI Writing Assistant
                  </h3>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {selectedText && (
                    <div className="p-3 bg-yellow-900/20 border border-yellow-600/30 rounded-lg">
                      <p className="text-xs text-yellow-400 font-medium mb-1">Selected Text:</p>
                      <p className="text-sm text-gray-300 italic">"{selectedText.substring(0, 100)}..."</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Ask AI or describe your needs:</label>
                    <textarea
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="e.g., 'Make this more compelling' or 'Add statistics'"
                      className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-sm resize-none h-24 text-gray-200 outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleAIAssist('edit')}
                      disabled={aiLoading || !editorContent.trim()}
                      className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit
                    </button>

                    <button
                      onClick={() => handleAIAssist('suggest')}
                      disabled={aiLoading || !aiPrompt.trim()}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Suggest
                    </button>
                  </div>

                  {aiLoading && (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
                    </div>
                  )}

                  {aiResponse && (
                    <div className="space-y-2">
                      <div className="p-4 bg-gray-900 border border-purple-500/30 rounded-lg">
                        <div className="text-sm text-gray-200 whitespace-pre-wrap">
                          {aiResponse}
                        </div>
                      </div>

                      <button
                        onClick={applyAIEdit}
                        className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                      >
                        Apply This Edit
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer Status Bar */}
          <div className="flex-shrink-0 px-4 py-2 border-t border-gray-700 bg-gray-800/50 text-xs text-gray-400 flex items-center justify-between">
            <div>
              {editorContent.length} characters • {editorContent.split(/\s+/).filter(w => w.length > 0).length} words
            </div>
            {currentContent && (
              <div className="text-pink-400">
                Loaded from Memory Vault: {currentContent.content_type}
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
