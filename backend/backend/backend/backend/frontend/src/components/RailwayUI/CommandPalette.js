// Command Palette Component for Railway UI
import React, { useState, useEffect, useCallback } from 'react';
import { Search, Command, FileText, Users, Settings, BarChart, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CommandPalette = ({ isOpen, onClose }) => {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();

  const commands = [
    {
      id: 'new-campaign',
      name: 'New Campaign',
      description: 'Create a new campaign brief',
      icon: <FileText size={16} />,
      shortcut: ['⌘', 'N'],
      action: () => {
        console.log('New campaign');
        onClose();
      }
    },
    {
      id: 'search-memory',
      name: 'Search MemoryVault',
      description: 'Semantic search across all documents',
      icon: <Search size={16} />,
      shortcut: ['⌘', 'K'],
      action: () => {
        console.log('Search memory');
        onClose();
      }
    },
    {
      id: 'view-collaborators',
      name: 'View Collaborators',
      description: 'See who is currently working',
      icon: <Users size={16} />,
      action: () => {
        console.log('View collaborators');
        onClose();
      }
    },
    {
      id: 'monitoring-status',
      name: 'Monitoring Status',
      description: 'Check real-time monitoring alerts',
      icon: <AlertCircle size={16} />,
      action: () => {
        console.log('Monitoring status');
        onClose();
      }
    },
    {
      id: 'analytics',
      name: 'Open Analytics',
      description: 'View campaign performance metrics',
      icon: <BarChart size={16} />,
      shortcut: ['⌘', 'A'],
      action: () => {
        navigate('/analytics');
        onClose();
      }
    },
    {
      id: 'settings',
      name: 'Settings',
      description: 'Configure platform settings',
      icon: <Settings size={16} />,
      shortcut: ['⌘', ','],
      action: () => {
        navigate('/settings');
        onClose();
      }
    }
  ];

  const filteredCommands = commands.filter(cmd =>
    cmd.name.toLowerCase().includes(search.toLowerCase()) ||
    cmd.description.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  const handleKeyDown = useCallback((e) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, filteredCommands.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
      default:
        break;
    }
  }, [isOpen, selectedIndex, filteredCommands, onClose]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div className="command-palette-overlay" onClick={onClose}>
      <div className="command-palette" onClick={e => e.stopPropagation()}>
        <div className="command-input-wrapper">
          <Search size={20} />
          <input
            type="text"
            className="command-input"
            placeholder="Type a command or search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>
        
        <div className="command-list">
          {filteredCommands.length === 0 ? (
            <div className="command-item">
              <div className="command-info">
                <div className="command-details">
                  <div className="command-name">No commands found</div>
                  <div className="command-description">Try a different search term</div>
                </div>
              </div>
            </div>
          ) : (
            filteredCommands.map((cmd, index) => (
              <div
                key={cmd.id}
                className={`command-item ${index === selectedIndex ? 'selected' : ''}`}
                onClick={() => cmd.action()}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="command-info">
                  <div className="command-icon">{cmd.icon}</div>
                  <div className="command-details">
                    <div className="command-name">{cmd.name}</div>
                    <div className="command-description">{cmd.description}</div>
                  </div>
                </div>
                {cmd.shortcut && (
                  <div className="command-shortcut">
                    {cmd.shortcut.map((key, i) => (
                      <span key={i} className="key">{key}</span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;