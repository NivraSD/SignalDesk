// Real-time Monitoring Component with Supabase
import React, { useState, useEffect } from 'react';
import { 
  Activity, AlertCircle, TrendingUp, Clock, Zap, 
  RefreshCw, CheckCircle, Info, Eye, Database, Circle 
} from 'lucide-react';
import { supabase } from '../config/supabase';

const RealtimeMonitoring = () => {
  const [findings, setFindings] = useState([]);
  const [monitoringRuns, setMonitoringRuns] = useState([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting');

  // Initialize Supabase if not already configured
  useEffect(() => {
    if (!supabase) {
      console.warn('Supabase not configured. Add REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY to .env');
      setConnectionStatus('error');
      return;
    }
    loadInitialData();
    setupRealtimeSubscriptions();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  // Load initial findings
  const loadInitialData = async () => {
    try {
      // Get recent findings
      const { data: findingsData, error: findingsError } = await supabase
        .from('intelligence_findings')
        .select(`
          *,
          target:intelligence_targets(name, type)
        `)
        .eq('organization_id', 'demo-org')
        .order('created_at', { ascending: false })
        .limit(20);

      if (findingsError) throw findingsError;
      setFindings(findingsData || []);

      // Get recent monitoring runs
      const { data: runsData, error: runsError } = await supabase
        .from('monitoring_runs')
        .select('*')
        .eq('organization_id', 'demo-org')
        .order('started_at', { ascending: false })
        .limit(5);

      if (runsError) throw runsError;
      setMonitoringRuns(runsData || []);
      
      setConnectionStatus('connected');
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading initial data:', error);
      setConnectionStatus('error');
    }
  };

  // Set up real-time subscriptions
  const setupRealtimeSubscriptions = () => {
    const channel = supabase
      .channel('monitoring-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'intelligence_findings',
          filter: 'organization_id=eq.demo-org'
        },
        async (payload) => {
          console.log('📡 New finding received:', payload);
          
          // Get the full finding with target info
          const { data, error } = await supabase
            .from('intelligence_findings')
            .select(`
              *,
              target:intelligence_targets(name, type)
            `)
            .eq('id', payload.new.id)
            .single();

          if (!error && data) {
            setFindings(prev => [data, ...prev].slice(0, 20));
            setLastUpdate(new Date());
            
            // Show notification
            showNotification('New Intelligence Finding', data.title);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'monitoring_runs',
          filter: 'organization_id=eq.demo-org'
        },
        (payload) => {
          console.log('📊 Monitoring run update:', payload);
          
          if (payload.eventType === 'INSERT') {
            setMonitoringRuns(prev => [payload.new, ...prev].slice(0, 5));
          } else if (payload.eventType === 'UPDATE') {
            setMonitoringRuns(prev => 
              prev.map(run => run.id === payload.new.id ? payload.new : run)
            );
          }
          
          setLastUpdate(new Date());
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
        setConnectionStatus(status === 'SUBSCRIBED' ? 'connected' : 'connecting');
      });

    setSubscription(channel);
  };

  // Trigger monitoring manually
  const triggerMonitoring = async () => {
    setIsMonitoring(true);
    
    try {
      const response = await fetch(
        'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/monitor-intelligence',
        {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ organizationId: 'demo-org' })
        }
      );
      
      const data = await response.json();
      console.log('Monitoring triggered:', data);
      
      showNotification(
        'Monitoring Complete', 
        `Found ${data.findings_count || 0} new findings`
      );
    } catch (error) {
      console.error('Error triggering monitoring:', error);
      showNotification('Error', 'Failed to trigger monitoring', 'error');
    } finally {
      setIsMonitoring(false);
    }
  };

  // Show notification
  const showNotification = (title, message, type = 'success') => {
    // You can integrate with a toast library here
    console.log(`🔔 ${title}: ${message}`);
    
    // Browser notification if permitted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body: message,
        icon: '/favicon.ico',
        tag: 'signaldesk-monitoring'
      });
    }
  };

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'connected': return '#10b981';
      case 'connecting': return '#f59e0b';
      case 'error': return '#ef4444';
      default: return '#6b7280';
    }
  };

  // Get sentiment color
  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'positive': return '#10b981';
      case 'negative': return '#ef4444';
      case 'neutral': return '#6b7280';
      default: return '#6b7280';
    }
  };

  return (
    <div style={{
      padding: '20px',
      backgroundColor: '#0a0a0a',
      borderRadius: '12px',
      color: '#e5e5e5',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        borderBottom: '1px solid #262626',
        paddingBottom: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Activity size={24} color="#8b5cf6" />
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>
            Real-time Intelligence Monitoring
          </h2>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 8px',
            borderRadius: '6px',
            backgroundColor: connectionStatus === 'connected' ? '#10b98120' : '#f59e0b20'
          }}>
            <Circle 
              size={8} 
              fill={getStatusColor(connectionStatus)}
              color={getStatusColor(connectionStatus)}
            />
            <span style={{ 
              fontSize: '12px', 
              color: getStatusColor(connectionStatus),
              fontWeight: '500'
            }}>
              {connectionStatus === 'connected' ? 'Live' : 
               connectionStatus === 'connecting' ? 'Connecting...' : 'Offline'}
            </span>
          </div>
        </div>
        
        <button
          onClick={triggerMonitoring}
          disabled={isMonitoring}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            backgroundColor: '#8b5cf6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: isMonitoring ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            opacity: isMonitoring ? 0.5 : 1,
            transition: 'all 0.2s'
          }}
        >
          <RefreshCw size={16} className={isMonitoring ? 'spin' : ''} />
          {isMonitoring ? 'Monitoring...' : 'Run Monitor Now'}
        </button>
      </div>

      {/* Stats Bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          padding: '16px',
          backgroundColor: '#171717',
          borderRadius: '8px',
          border: '1px solid #262626'
        }}>
          <div style={{ fontSize: '12px', color: '#737373', marginBottom: '4px' }}>
            Total Findings
          </div>
          <div style={{ fontSize: '24px', fontWeight: '600', color: '#e5e5e5' }}>
            {findings.length}
          </div>
        </div>
        
        <div style={{
          padding: '16px',
          backgroundColor: '#171717',
          borderRadius: '8px',
          border: '1px solid #262626'
        }}>
          <div style={{ fontSize: '12px', color: '#737373', marginBottom: '4px' }}>
            Last Update
          </div>
          <div style={{ fontSize: '14px', fontWeight: '500', color: '#e5e5e5' }}>
            {lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : 'Never'}
          </div>
        </div>
        
        <div style={{
          padding: '16px',
          backgroundColor: '#171717',
          borderRadius: '8px',
          border: '1px solid #262626'
        }}>
          <div style={{ fontSize: '12px', color: '#737373', marginBottom: '4px' }}>
            Active Monitors
          </div>
          <div style={{ fontSize: '24px', fontWeight: '600', color: '#10b981' }}>
            2
          </div>
        </div>
        
        <div style={{
          padding: '16px',
          backgroundColor: '#171717',
          borderRadius: '8px',
          border: '1px solid #262626'
        }}>
          <div style={{ fontSize: '12px', color: '#737373', marginBottom: '4px' }}>
            Recent Runs
          </div>
          <div style={{ fontSize: '24px', fontWeight: '600', color: '#f59e0b' }}>
            {monitoringRuns.length}
          </div>
        </div>
      </div>

      {/* Recent Findings */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ 
          fontSize: '16px', 
          fontWeight: '600', 
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Eye size={18} />
          Latest Intelligence Findings
        </h3>
        
        <div style={{
          maxHeight: '400px',
          overflowY: 'auto',
          backgroundColor: '#171717',
          borderRadius: '8px',
          border: '1px solid #262626'
        }}>
          {findings.length === 0 ? (
            <div style={{
              padding: '32px',
              textAlign: 'center',
              color: '#737373'
            }}>
              <Database size={48} style={{ marginBottom: '12px', opacity: 0.5 }} />
              <p>No findings yet. Click "Run Monitor Now" to start monitoring.</p>
            </div>
          ) : (
            findings.map((finding) => (
              <div
                key={finding.id}
                style={{
                  padding: '16px',
                  borderBottom: '1px solid #262626',
                  transition: 'background-color 0.2s',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1f1f1f'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '8px'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#e5e5e5',
                      marginBottom: '4px'
                    }}>
                      {finding.title}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#737373',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <span>{finding.target?.name || 'Unknown Target'}</span>
                      <span>•</span>
                      <span>{finding.finding_type}</span>
                      <span>•</span>
                      <span style={{ color: getSentimentColor(finding.sentiment) }}>
                        {finding.sentiment}
                      </span>
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <div style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      backgroundColor: '#8b5cf620',
                      color: '#a78bfa',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                      {Math.round((finding.relevance_score || 0) * 100)}%
                    </div>
                    {finding.action_required && (
                      <AlertCircle size={16} color="#f59e0b" />
                    )}
                  </div>
                </div>
                
                {finding.ai_analysis && (
                  <div style={{
                    marginTop: '8px',
                    padding: '8px',
                    backgroundColor: '#0a0a0a',
                    borderRadius: '4px',
                    fontSize: '12px',
                    color: '#a3a3a3',
                    lineHeight: '1.5'
                  }}>
                    <strong style={{ color: '#8b5cf6' }}>AI Analysis:</strong> {finding.ai_analysis.substring(0, 200)}...
                  </div>
                )}
                
                <div style={{
                  marginTop: '8px',
                  fontSize: '11px',
                  color: '#525252'
                }}>
                  {new Date(finding.created_at).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Monitoring Runs Status */}
      <div>
        <h3 style={{ 
          fontSize: '16px', 
          fontWeight: '600', 
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Clock size={18} />
          Recent Monitoring Runs
        </h3>
        
        <div style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap'
        }}>
          {monitoringRuns.map((run) => (
            <div
              key={run.id}
              style={{
                padding: '8px 12px',
                backgroundColor: '#171717',
                borderRadius: '6px',
                border: '1px solid #262626',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {run.status === 'completed' ? (
                <CheckCircle size={14} color="#10b981" />
              ) : run.status === 'running' ? (
                <RefreshCw size={14} color="#f59e0b" className="spin" />
              ) : (
                <AlertCircle size={14} color="#ef4444" />
              )}
              <span style={{ color: '#a3a3a3' }}>
                {run.findings_count || 0} findings
              </span>
              <span style={{ color: '#525252' }}>
                {run.execution_time ? `${run.execution_time}ms` : 'Running...'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default RealtimeMonitoring;