import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Play, 
  Pause, 
  AlertCircle, 
  CheckCircle,
  Clock,
  TrendingUp,
  Eye,
  RefreshCw,
  Zap
} from 'lucide-react';
import axios from 'axios';

const UltimateMonitoringDashboard = () => {
  const [monitoringStatus, setMonitoringStatus] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [capabilities, setCapabilities] = useState({
    query_clarification: false,
    source_discovery: false,
    data_collection: false,
    research_orchestration: false,
    deep_analysis: false,
    intelligence_synthesis: false,
    report_generation: false
  });

  // Get organization ID from localStorage or use default
  const getOrgId = () => {
    const storedOrg = localStorage.getItem('selectedOrganization');
    return storedOrg ? JSON.parse(storedOrg).id : 'org-1754316188606';
  };

  const runComprehensiveAnalysis = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(
        'http://localhost:5001/api/ultimate-monitoring/analyze',
        { organizationId: getOrgId() },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-token'}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      setLastAnalysis(response.data.results);
      console.log('Analysis complete:', response.data);
    } catch (err) {
      console.error('Analysis failed:', err);
      setError(err.response?.data?.details || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const startContinuousMonitoring = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(
        'http://localhost:5001/api/ultimate-monitoring/start',
        { 
          organizationId: getOrgId(),
          options: {
            interval: 15 * 60 * 1000, // 15 minutes
            priority: 'high',
            alertThreshold: 'medium'
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-token'}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      setMonitoringStatus(response.data);
      setIsRunning(true);
      localStorage.setItem('monitoringId', response.data.monitoringId);
    } catch (err) {
      console.error('Failed to start monitoring:', err);
      setError(err.response?.data?.details || 'Failed to start monitoring');
    } finally {
      setLoading(false);
    }
  };

  const stopMonitoring = async () => {
    const monitoringId = localStorage.getItem('monitoringId');
    if (!monitoringId) return;
    
    setLoading(true);
    try {
      await axios.post(
        `http://localhost:5001/api/ultimate-monitoring/stop/${monitoringId}`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-token'}`
          }
        }
      );
      
      setIsRunning(false);
      setMonitoringStatus(null);
      localStorage.removeItem('monitoringId');
    } catch (err) {
      console.error('Failed to stop monitoring:', err);
      setError('Failed to stop monitoring');
    } finally {
      setLoading(false);
    }
  };

  const testCapability = async (capability) => {
    setLoading(true);
    
    try {
      const testData = {
        organization: { name: 'Nike', industry: 'Athletic Apparel' },
        competitors: [
          { name: 'Adidas', priority: 'high' },
          { name: 'Puma', priority: 'high' }
        ],
        topics: [
          { name: 'Sustainable Manufacturing', priority: 'high' },
          { name: 'Direct-to-Consumer Sales', priority: 'medium' }
        ]
      };
      
      const response = await axios.post(
        'http://localhost:5001/api/ultimate-monitoring/test-capability',
        { 
          capability, 
          testData 
        },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-token'}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      setCapabilities(prev => ({
        ...prev,
        [capability]: true
      }));
      
      console.log(`${capability} test successful:`, response.data);
    } catch (err) {
      console.error(`${capability} test failed:`, err);
      setCapabilities(prev => ({
        ...prev,
        [capability]: false
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Zap size={28} />
              Ultimate Monitoring Agent
            </h1>
            <p className="text-purple-100 mt-2">
              World-class AI-powered intelligence monitoring & analysis system
            </p>
          </div>
          
          <div className="flex gap-3">
            {!isRunning ? (
              <button
                onClick={startContinuousMonitoring}
                disabled={loading}
                className="px-6 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition-colors flex items-center gap-2"
              >
                <Play size={20} />
                Start Monitoring
              </button>
            ) : (
              <button
                onClick={stopMonitoring}
                disabled={loading}
                className="px-6 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors flex items-center gap-2"
              >
                <Pause size={20} />
                Stop Monitoring
              </button>
            )}
            
            <button
              onClick={runComprehensiveAnalysis}
              disabled={loading}
              className="px-6 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors flex items-center gap-2"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
              Run Analysis Now
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="text-red-500 mt-0.5" size={20} />
          <div>
            <h3 className="font-semibold text-red-800">Error</h3>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Status</p>
              <p className="text-2xl font-bold mt-1">
                {isRunning ? 'Active' : 'Inactive'}
              </p>
            </div>
            <div className={`p-3 rounded-full ${isRunning ? 'bg-green-100' : 'bg-gray-100'}`}>
              <Activity size={24} className={isRunning ? 'text-green-600' : 'text-gray-400'} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Last Analysis</p>
              <p className="text-2xl font-bold mt-1">
                {lastAnalysis ? new Date(lastAnalysis.metadata?.endTime).toLocaleTimeString() : 'Never'}
              </p>
            </div>
            <div className="p-3 rounded-full bg-blue-100">
              <Clock size={24} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Data Points</p>
              <p className="text-2xl font-bold mt-1">
                {lastAnalysis?.metadata?.dataPointsCollected || 0}
              </p>
            </div>
            <div className="p-3 rounded-full bg-purple-100">
              <TrendingUp size={24} className="text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Pipeline Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Agent Pipeline Status</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(capabilities).map(([capability, status]) => (
            <button
              key={capability}
              onClick={() => testCapability(capability)}
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                {status ? (
                  <CheckCircle size={20} className="text-green-500" />
                ) : (
                  <AlertCircle size={20} className="text-gray-400" />
                )}
              </div>
              <p className="text-sm font-medium text-left">
                {capability.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </p>
              <p className="text-xs text-gray-500 mt-1">Click to test</p>
            </button>
          ))}
        </div>
      </div>

      {/* Latest Intelligence */}
      {lastAnalysis && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Eye size={20} />
            Latest Intelligence
          </h2>
          
          <div className="space-y-4">
            {/* Executive Summary */}
            {lastAnalysis.intelligence?.executiveSummary && (
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Executive Summary</h3>
                <ul className="space-y-2">
                  {lastAnalysis.intelligence.executiveSummary.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span className="text-gray-600">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Critical Alerts */}
            {lastAnalysis.intelligence?.criticalAlerts?.length > 0 && (
              <div>
                <h3 className="font-medium text-red-600 mb-2">Critical Alerts</h3>
                <div className="space-y-2">
                  {lastAnalysis.intelligence.criticalAlerts.map((alert, i) => (
                    <div key={i} className="bg-red-50 border border-red-200 rounded p-3">
                      <p className="text-sm text-red-700">{alert}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Opportunities */}
            {lastAnalysis.intelligence?.opportunities?.length > 0 && (
              <div>
                <h3 className="font-medium text-green-600 mb-2">Opportunities</h3>
                <div className="space-y-2">
                  {lastAnalysis.intelligence.opportunities.map((opp, i) => (
                    <div key={i} className="bg-green-50 border border-green-200 rounded p-3">
                      <p className="text-sm text-green-700">{opp}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="pt-4 border-t">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Sources Monitored</p>
                  <p className="font-semibold">{lastAnalysis.metadata?.sourcesMonitored || 0}</p>
                </div>
                <div>
                  <p className="text-gray-500">Processing Time</p>
                  <p className="font-semibold">
                    {lastAnalysis.metadata?.duration ? 
                      `${(lastAnalysis.metadata.duration / 1000).toFixed(1)}s` : 
                      'N/A'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Confidence</p>
                  <p className="font-semibold capitalize">{lastAnalysis.metadata?.confidence || 'Medium'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Last Updated</p>
                  <p className="font-semibold">
                    {lastAnalysis.metadata?.endTime ? 
                      new Date(lastAnalysis.metadata.endTime).toLocaleString() : 
                      'N/A'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UltimateMonitoringDashboard;