// Railway-Inspired Draggable Panel Component
import React, { useState, useRef, useEffect } from 'react';
import { GripVertical, Minimize2, Maximize2, X } from 'lucide-react';
import './RailwayPanel.css';

const RailwayPanel = ({ 
  id, 
  title, 
  children, 
  defaultWidth = '30%',
  minWidth = 200,
  maxWidth = 800,
  position = 'left',
  collapsible = true,
  resizable = true,
  closable = false,
  onClose,
  className = ''
}) => {
  const [width, setWidth] = useState(defaultWidth);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const panelRef = useRef(null);
  const dragHandleRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;

      const panel = panelRef.current;
      if (!panel) return;

      const parent = panel.parentElement;
      const parentWidth = parent.offsetWidth;
      let newWidth;

      if (position === 'left') {
        newWidth = e.clientX;
      } else if (position === 'right') {
        newWidth = parentWidth - e.clientX;
      }

      // Apply constraints
      newWidth = Math.max(minWidth, Math.min(newWidth, maxWidth));
      setWidth(`${newWidth}px`);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, position, minWidth, maxWidth]);

  const handleDragStart = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div
      ref={panelRef}
      className={`railway-panel railway-panel-${position} ${isCollapsed ? 'collapsed' : ''} ${className}`}
      style={{ 
        width: isCollapsed ? '48px' : width,
        transition: isDragging ? 'none' : 'width 0.3s ease'
      }}
    >
      <div className="railway-panel-header">
        {!isCollapsed && (
          <>
            <h3 className="railway-panel-title">{title}</h3>
            <div className="railway-panel-controls">
              {collapsible && (
                <button 
                  onClick={toggleCollapse}
                  className="railway-panel-control"
                  title={isCollapsed ? "Expand" : "Collapse"}
                >
                  {isCollapsed ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
                </button>
              )}
              {closable && (
                <button 
                  onClick={onClose}
                  className="railway-panel-control"
                  title="Close"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </>
        )}
        {isCollapsed && (
          <button 
            onClick={toggleCollapse}
            className="railway-panel-expand-button"
            title="Expand"
          >
            <Maximize2 size={16} />
          </button>
        )}
      </div>

      {!isCollapsed && (
        <>
          <div className="railway-panel-content">
            {children}
          </div>

          {resizable && (
            <div
              ref={dragHandleRef}
              className={`railway-panel-resize-handle railway-panel-resize-${position}`}
              onMouseDown={handleDragStart}
            >
              <GripVertical size={16} />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RailwayPanel;