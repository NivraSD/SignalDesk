import React, { useState, useEffect } from 'react';
import { Clock, RotateCcw, GitBranch, FileText, User } from 'lucide-react';
import API_BASE_URL from '../../config/api';

const VersionHistory = ({ itemId, currentContent, onRestore }) => {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [showDiff, setShowDiff] = useState(false);

  useEffect(() => {
    if (itemId) {
      fetchVersionHistory();
    }
  }, [itemId]);

  const fetchVersionHistory = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/memoryvault/versions?itemId=${itemId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setVersions(data.versions);
      }
    } catch (error) {
      console.error('Error fetching version history:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveNewVersion = async (changeType = 'edit') => {
    try {
      const response = await fetch(`${API_BASE_URL}/memoryvault/versions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          item_id: itemId,
          content: currentContent,
          change_type: changeType,
          changed_by: 'current_user'
        })
      });
      
      if (response.ok) {
        fetchVersionHistory();
      }
    } catch (error) {
      console.error('Error saving version:', error);
    }
  };

  const getChangeTypeIcon = (type) => {
    switch (type) {
      case 'create': return <FileText className="w-4 h-4 text-green-500" />;
      case 'edit': return <GitBranch className="w-4 h-4 text-blue-500" />;
      case 'ai_enhance': return <span className="text-purple-500">✨</span>;
      case 'restore': return <RotateCcw className="w-4 h-4 text-orange-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hour${Math.floor(diffMins / 60) > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="version-history-panel bg-white border-l border-gray-200 w-80 h-full overflow-hidden flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Version History
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          {versions.length} version{versions.length !== 1 ? 's' : ''} saved
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-gray-500">
            Loading versions...
          </div>
        ) : versions.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No version history yet</p>
            <button
              onClick={() => saveNewVersion('create')}
              className="mt-2 text-sm text-blue-600 hover:text-blue-700"
            >
              Save first version
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {versions.map((version) => (
              <div
                key={version.id}
                className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                  selectedVersion?.id === version.id ? 'bg-blue-50' : ''
                }`}
                onClick={() => setSelectedVersion(version)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getChangeTypeIcon(version.change_type)}
                    <span className="font-medium text-sm">
                      Version {version.version_number}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatDate(version.created_at)}
                  </span>
                </div>
                
                <div className="mt-2 text-xs text-gray-600">
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {version.changed_by}
                  </div>
                  {version.change_type && (
                    <div className="mt-1 capitalize">
                      Type: {version.change_type.replace('_', ' ')}
                    </div>
                  )}
                </div>

                {selectedVersion?.id === version.id && (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRestore(version.content);
                        saveNewVersion('restore');
                      }}
                      className="flex-1 px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                    >
                      Restore
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDiff(!showDiff);
                      }}
                      className="flex-1 px-3 py-1 border border-gray-300 rounded text-xs hover:bg-gray-50"
                    >
                      {showDiff ? 'Hide' : 'Show'} Diff
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-3 border-t border-gray-200">
        <button
          onClick={() => saveNewVersion('edit')}
          className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm font-medium"
        >
          Save Current Version
        </button>
      </div>
    </div>
  );
};

export default VersionHistory;