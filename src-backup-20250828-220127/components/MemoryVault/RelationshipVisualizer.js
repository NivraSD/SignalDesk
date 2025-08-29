import React, { useState, useEffect } from 'react';
import { 
  Link2, 
  GitFork, 
  ArrowRight, 
  FileText, 
  Plus, 
  X,
  ChevronRight,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import API_BASE_URL from '../../config/api';

const RelationshipVisualizer = ({ itemId, itemTitle }) => {
  const [relationships, setRelationships] = useState([]);
  const [grouped, setGrouped] = useState({});
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRelationship, setNewRelationship] = useState({
    target_item_id: '',
    relationship_type: 'related_to',
    bidirectional: false
  });

  const relationshipTypes = {
    references: { label: 'References', icon: Link2, color: 'blue' },
    derived_from: { label: 'Derived From', icon: GitFork, color: 'purple' },
    related_to: { label: 'Related To', icon: ArrowRight, color: 'gray' },
    parent_child: { label: 'Parent/Child', icon: ChevronRight, color: 'green' },
    alternative_version: { label: 'Alternative Version', icon: FileText, color: 'orange' },
    contradicts: { label: 'Contradicts', icon: AlertCircle, color: 'red' },
    supports: { label: 'Supports', icon: CheckCircle, color: 'emerald' }
  };

  useEffect(() => {
    if (itemId) {
      fetchRelationships();
    }
  }, [itemId]);

  const fetchRelationships = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/memoryvault/relationships?itemId=${itemId}&includeIndirect=true`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setRelationships(data.relationships);
        setGrouped(data.grouped);
      }
    } catch (error) {
      console.error('Error fetching relationships:', error);
    } finally {
      setLoading(false);
    }
  };

  const createRelationship = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/memoryvault/relationships`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          source_item_id: itemId,
          ...newRelationship
        })
      });
      
      if (response.ok) {
        fetchRelationships();
        setShowAddModal(false);
        setNewRelationship({
          target_item_id: '',
          relationship_type: 'related_to',
          bidirectional: false
        });
      }
    } catch (error) {
      console.error('Error creating relationship:', error);
    }
  };

  const deleteRelationship = async (relationshipId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/memoryvault/relationships`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ relationshipId })
      });
      
      if (response.ok) {
        fetchRelationships();
      }
    } catch (error) {
      console.error('Error deleting relationship:', error);
    }
  };

  const RelationshipGroup = ({ type, items }) => {
    const config = relationshipTypes[type] || relationshipTypes.related_to;
    const Icon = config.icon;
    
    return (
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Icon className={`w-4 h-4 text-${config.color}-500`} />
          <span className="font-medium text-sm">{config.label}</span>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {items.length}
          </span>
        </div>
        <div className="space-y-2 ml-6">
          {items.map((rel) => (
            <div
              key={rel.id}
              className={`flex items-center justify-between p-2 rounded border ${
                rel.indirect ? 'border-gray-200 bg-gray-50' : 'border-gray-300 bg-white'
              } hover:shadow-sm transition-shadow`}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-3 h-3 text-gray-400" />
                <span className="text-sm">
                  {rel.source_item_id === itemId 
                    ? `→ Item #${rel.target_item_id}`
                    : `← Item #${rel.source_item_id}`}
                </span>
                {rel.indirect && (
                  <span className="text-xs text-gray-500">(indirect)</span>
                )}
              </div>
              <button
                onClick={() => deleteRelationship(rel.id)}
                className="text-red-500 hover:text-red-700"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="relationship-visualizer bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Link2 className="w-5 h-5" />
          Document Relationships
        </h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          Add Link
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">
          Loading relationships...
        </div>
      ) : relationships.length === 0 ? (
        <div className="text-center py-8">
          <Link2 className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p className="text-gray-500">No relationships yet</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-2 text-sm text-blue-600 hover:text-blue-700"
          >
            Create first relationship
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([type, items]) => (
            <RelationshipGroup key={type} type={type} items={items} />
          ))}
        </div>
      )}

      {/* Add Relationship Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h4 className="text-lg font-semibold mb-4">Add Relationship</h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Target Item ID
                </label>
                <input
                  type="number"
                  value={newRelationship.target_item_id}
                  onChange={(e) => setNewRelationship({
                    ...newRelationship,
                    target_item_id: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter item ID to link"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Relationship Type
                </label>
                <select
                  value={newRelationship.relationship_type}
                  onChange={(e) => setNewRelationship({
                    ...newRelationship,
                    relationship_type: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(relationshipTypes).map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="bidirectional"
                  checked={newRelationship.bidirectional}
                  onChange={(e) => setNewRelationship({
                    ...newRelationship,
                    bidirectional: e.target.checked
                  })}
                  className="rounded"
                />
                <label htmlFor="bidirectional" className="text-sm">
                  Create bidirectional relationship
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={createRelationship}
                disabled={!newRelationship.target_item_id}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Create Relationship
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RelationshipVisualizer;