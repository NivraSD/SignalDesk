import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './OrganizationSettings.css';

const OrganizationSettings = ({ onClose, onOrganizationChange }) => {
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState([]);
  const [currentOrg, setCurrentOrg] = useState(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newOrgData, setNewOrgData] = useState({
    name: '',
    type: 'company',
    description: ''
  });

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = () => {
    // Load saved organizations from localStorage
    const savedOrgs = localStorage.getItem('signaldesk_organizations');
    const orgs = savedOrgs ? JSON.parse(savedOrgs) : [];
    
    // Add some default organizations if none exist
    if (orgs.length === 0) {
      const defaults = [
        { id: 'openai', name: 'OpenAI', type: 'company', description: 'AI research company' },
        { id: 'test-org', name: 'Test Organization', type: 'company', description: 'Testing and development' }
      ];
      localStorage.setItem('signaldesk_organizations', JSON.stringify(defaults));
      setOrganizations(defaults);
    } else {
      setOrganizations(orgs);
    }

    // Get current organization
    const currentOrgData = localStorage.getItem('signaldesk_organization');
    if (currentOrgData) {
      setCurrentOrg(JSON.parse(currentOrgData));
    }
  };

  const switchOrganization = (org) => {
    // Save the selected organization
    localStorage.setItem('signaldesk_organization', JSON.stringify(org));
    localStorage.setItem('signaldesk_onboarding', JSON.stringify({
      organizationName: org.name,
      organizationType: org.type,
      organizationDescription: org.description
    }));
    
    setCurrentOrg(org);
    
    // Notify parent component
    if (onOrganizationChange) {
      onOrganizationChange(org);
    }

    // Close the settings modal
    setTimeout(() => {
      if (onClose) {
        onClose();
      }
    }, 500);
  };

  const createNewOrganization = () => {
    if (!newOrgData.name) return;

    const newOrg = {
      id: newOrgData.name.toLowerCase().replace(/\s+/g, '-'),
      name: newOrgData.name,
      type: newOrgData.type,
      description: newOrgData.description
    };

    // Add to organizations list
    const updatedOrgs = [...organizations, newOrg];
    localStorage.setItem('signaldesk_organizations', JSON.stringify(updatedOrgs));
    setOrganizations(updatedOrgs);

    // Switch to the new organization
    switchOrganization(newOrg);
    
    // Reset form
    setIsCreatingNew(false);
    setNewOrgData({ name: '', type: 'company', description: '' });
  };

  const runFullOnboarding = () => {
    // Clear current organization to trigger onboarding
    localStorage.removeItem('signaldesk_organization');
    localStorage.removeItem('signaldesk_onboarding');
    navigate('/initialize');
  };

  return (
    <div className="org-settings-overlay">
      <div className="org-settings-modal">
        <div className="org-settings-header">
          <h2>Organization Settings</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="org-settings-content">
          {/* Current Organization */}
          {currentOrg && (
            <div className="current-org-section">
              <h3>Current Organization</h3>
              <div className="current-org-card">
                <div className="org-icon">🏢</div>
                <div className="org-info">
                  <h4>{currentOrg.name}</h4>
                  <p>{currentOrg.description || 'No description'}</p>
                  <span className="org-type">{currentOrg.type}</span>
                </div>
              </div>
            </div>
          )}

          {/* Switch Organization */}
          <div className="switch-org-section">
            <h3>Switch Organization</h3>
            <div className="org-list">
              {organizations.filter(org => org.id !== currentOrg?.id).map(org => (
                <div 
                  key={org.id} 
                  className="org-option"
                  onClick={() => switchOrganization(org)}
                >
                  <div className="org-icon">🏢</div>
                  <div className="org-info">
                    <h4>{org.name}</h4>
                    <p>{org.description}</p>
                  </div>
                  <button className="switch-btn">Switch</button>
                </div>
              ))}
            </div>
          </div>

          {/* Create New Organization */}
          <div className="new-org-section">
            <h3>Create New Organization</h3>
            {!isCreatingNew ? (
              <button 
                className="create-org-btn"
                onClick={() => setIsCreatingNew(true)}
              >
                + Add New Organization
              </button>
            ) : (
              <div className="new-org-form">
                <input
                  type="text"
                  placeholder="Organization Name"
                  value={newOrgData.name}
                  onChange={(e) => setNewOrgData({...newOrgData, name: e.target.value})}
                  className="org-input"
                />
                <select
                  value={newOrgData.type}
                  onChange={(e) => setNewOrgData({...newOrgData, type: e.target.value})}
                  className="org-select"
                >
                  <option value="company">Company</option>
                  <option value="nonprofit">Non-Profit</option>
                  <option value="government">Government</option>
                  <option value="personal">Personal Brand</option>
                </select>
                <textarea
                  placeholder="Description (optional)"
                  value={newOrgData.description}
                  onChange={(e) => setNewOrgData({...newOrgData, description: e.target.value})}
                  className="org-textarea"
                  rows="3"
                />
                <div className="form-actions">
                  <button 
                    className="cancel-btn"
                    onClick={() => setIsCreatingNew(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    className="save-btn"
                    onClick={createNewOrganization}
                    disabled={!newOrgData.name}
                  >
                    Create Organization
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Advanced Options */}
          <div className="advanced-section">
            <h3>Advanced</h3>
            <button 
              className="onboarding-btn"
              onClick={runFullOnboarding}
            >
              Run Full Onboarding Setup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizationSettings;