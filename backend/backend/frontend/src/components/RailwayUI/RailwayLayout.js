// Railway-Inspired Layout System
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { Command, Menu, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import RailwayPanel from './RailwayPanel';
import CommandPalette from './CommandPalette';
import './RailwayLayout.css';

const RailwayLayout = ({ 
  children, 
  memoryVault,
  aiAssistant,
  leftPanel = null,
  rightPanel = null,
  bottomPanel = null,
  onLayoutChange,
  defaultLayout = 'default'
}) => {
  const [layout, setLayout] = useState(defaultLayout);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [panels, setPanels] = useState({
    left: { visible: true, width: '20%', collapsed: false },
    center: { visible: true, width: 'auto' },
    right: { visible: true, width: '25%', collapsed: false },
    bottom: { visible: false, height: '200px', collapsed: false }
  });
  
  const [isDragging, setIsDragging] = useState(null);
  const layoutRef = useRef(null);

  // Predefined layouts
  const layouts = {
    default: {
      left: { visible: true, width: '20%', collapsed: false },
      center: { visible: true, width: 'auto' },
      right: { visible: true, width: '25%', collapsed: false },
      bottom: { visible: false }
    },
    focus: {
      left: { visible: true, width: '5%', collapsed: true },
      center: { visible: true, width: 'auto' },
      right: { visible: true, width: '5%', collapsed: true },
      bottom: { visible: false }
    },
    command: {
      left: { visible: true, width: '15%', collapsed: false },
      center: { visible: true, width: 'auto' },
      right: { visible: true, width: '35%', collapsed: false },
      bottom: { visible: true, height: '250px' }
    },
    analysis: {
      left: { visible: true, width: '25%', collapsed: false },
      center: { visible: true, width: 'auto' },
      right: { visible: true, width: '30%', collapsed: false },
      bottom: { visible: true, height: '300px' }
    }
  };

  // Keyboard shortcuts
  useHotkeys('cmd+k, ctrl+k', () => setShowCommandPalette(true));
  useHotkeys('cmd+\\, ctrl+\\', () => togglePanel('left'));
  useHotkeys('cmd+/, ctrl+/', () => togglePanel('right'));
  useHotkeys('cmd+b, ctrl+b', () => togglePanel('bottom'));
  useHotkeys('cmd+1', () => switchLayout('default'));
  useHotkeys('cmd+2', () => switchLayout('focus'));
  useHotkeys('cmd+3', () => switchLayout('command'));
  useHotkeys('cmd+4', () => switchLayout('analysis'));

  const togglePanel = (panelName) => {
    setPanels(prev => ({
      ...prev,
      [panelName]: {
        ...prev[panelName],
        collapsed: !prev[panelName].collapsed
      }
    }));
  };

  const switchLayout = (layoutName) => {
    if (layouts[layoutName]) {
      setLayout(layoutName);
      setPanels(layouts[layoutName]);
      if (onLayoutChange) {
        onLayoutChange(layoutName);
      }
    }
  };

  const saveCustomLayout = () => {
    const customLayout = { ...panels };
    localStorage.setItem('signaldesk-custom-layout', JSON.stringify(customLayout));
  };

  const loadCustomLayout = () => {
    const saved = localStorage.getItem('signaldesk-custom-layout');
    if (saved) {
      setPanels(JSON.parse(saved));
      setLayout('custom');
    }
  };

  useEffect(() => {
    // Load saved layout on mount
    const savedLayout = localStorage.getItem('signaldesk-layout');
    if (savedLayout && layouts[savedLayout]) {
      switchLayout(savedLayout);
    }
  }, []);

  useEffect(() => {
    // Save layout changes
    localStorage.setItem('signaldesk-layout', layout);
  }, [layout]);

  const handlePanelResize = (panelName, newSize) => {
    setPanels(prev => ({
      ...prev,
      [panelName]: {
        ...prev[panelName],
        width: panelName === 'bottom' ? prev[panelName].width : newSize,
        height: panelName === 'bottom' ? newSize : prev[panelName].height
      }
    }));
  };

  const LayoutPresets = () => (
    <div className="railway-layout-presets">
      <button 
        className={`preset-btn ${layout === 'default' ? 'active' : ''}`}
        onClick={() => switchLayout('default')}
        title="Default Layout (⌘1)"
      >
        <span className="preset-icon">⊞</span>
        Default
      </button>
      <button 
        className={`preset-btn ${layout === 'focus' ? 'active' : ''}`}
        onClick={() => switchLayout('focus')}
        title="Focus Layout (⌘2)"
      >
        <span className="preset-icon">□</span>
        Focus
      </button>
      <button 
        className={`preset-btn ${layout === 'command' ? 'active' : ''}`}
        onClick={() => switchLayout('command')}
        title="Command Layout (⌘3)"
      >
        <span className="preset-icon">⊡</span>
        Command
      </button>
      <button 
        className={`preset-btn ${layout === 'analysis' ? 'active' : ''}`}
        onClick={() => switchLayout('analysis')}
        title="Analysis Layout (⌘4)"
      >
        <span className="preset-icon">⊟</span>
        Analysis
      </button>
      <div className="preset-divider" />
      <button 
        className="preset-btn"
        onClick={saveCustomLayout}
        title="Save Current Layout"
      >
        💾
      </button>
      <button 
        className="preset-btn"
        onClick={loadCustomLayout}
        title="Load Custom Layout"
      >
        📂
      </button>
    </div>
  );

  return (
    <div className="railway-layout" ref={layoutRef}>
      {/* Top Bar */}
      <div className="railway-top-bar">
        <div className="railway-top-bar-left">
          <button 
            className="railway-cmd-btn"
            onClick={() => setShowCommandPalette(true)}
          >
            <Command size={14} />
            <span>⌘K</span>
          </button>
          <LayoutPresets />
        </div>
        
        <div className="railway-top-bar-center">
          <span className="railway-brand">SignalDesk</span>
        </div>
        
        <div className="railway-top-bar-right">
          <button className="railway-icon-btn">
            <Settings size={16} />
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="railway-main-layout">
        {/* Left Panel - MemoryVault */}
        {panels.left.visible && (
          <RailwayPanel
            id="memory-vault"
            title="Memory Vault"
            position="left"
            defaultWidth={panels.left.width}
            isCollapsed={panels.left.collapsed}
            onResize={(width) => handlePanelResize('left', width)}
            className="railway-memory-vault"
          >
            {memoryVault || (
              <div className="panel-placeholder">
                <p>Memory Vault</p>
                <small>Drag files here to add to context</small>
              </div>
            )}
          </RailwayPanel>
        )}

        {/* Center Panel - Main Content */}
        <div className="railway-center-panel">
          <div className="railway-workspace">
            {children}
          </div>
          
          {/* Bottom Panel - Optional */}
          {panels.bottom?.visible && (
            <RailwayPanel
              id="bottom-panel"
              title="Console"
              position="bottom"
              defaultHeight={panels.bottom.height}
              isCollapsed={panels.bottom.collapsed}
              onResize={(height) => handlePanelResize('bottom', height)}
              className="railway-bottom-panel"
            >
              {bottomPanel || (
                <div className="panel-placeholder">
                  <p>Console / Analytics</p>
                </div>
              )}
            </RailwayPanel>
          )}
        </div>

        {/* Right Panel - AI Assistant */}
        {panels.right.visible && (
          <RailwayPanel
            id="ai-assistant"
            title="AI Assistant"
            position="right"
            defaultWidth={panels.right.width}
            isCollapsed={panels.right.collapsed}
            onResize={(width) => handlePanelResize('right', width)}
            className="railway-ai-assistant"
          >
            {aiAssistant || (
              <div className="panel-placeholder">
                <div className="ai-avatar">🎯</div>
                <p>AI Assistant</p>
                <small>I'm here to help with your campaign</small>
                <input 
                  type="text" 
                  placeholder="Type or ask me anything..."
                  className="ai-input"
                />
              </div>
            )}
          </RailwayPanel>
        )}
      </div>

      {/* Command Palette */}
      {showCommandPalette && (
        <CommandPalette
          onClose={() => setShowCommandPalette(false)}
          onCommand={(command) => {
            console.log('Execute command:', command);
            setShowCommandPalette(false);
          }}
        />
      )}

      {/* Floating Action Buttons */}
      <div className="railway-fab-container">
        <button 
          className="railway-fab railway-fab-primary"
          onClick={() => togglePanel('right')}
          title="Toggle AI Assistant"
        >
          🎯
        </button>
      </div>
    </div>
  );
};

export default RailwayLayout;