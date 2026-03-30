import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Play, 
  Pause, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  TrendingUp,
  Users,
  FileText,
  BarChart3,
  ArrowLeft,
  RefreshCw,
  Target,
  Zap
} from 'lucide-react';

const CampaignExecutionDashboard = () => {
  const { campaignId } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadCampaignData();
  }, [campaignId]);

  const loadCampaignData = async () => {
    setLoading(true);
    try {
      // Load campaign data from localStorage or API
      const storedCampaigns = JSON.parse(localStorage.getItem('strategic_campaigns') || '[]');
      const campaignData = storedCampaigns.find(c => c.id === campaignId);
      
      if (campaignData) {
        setCampaign(campaignData);
        
        // Generate tasks based on campaign pillars
        const generatedTasks = campaignData.pillars?.map((pillar, index) => ({
          id: `task-${index}`,
          name: pillar.title,
          description: pillar.description,
          status: pillar.status || 'pending',
          progress: pillar.progress || 0,
          assignee: pillar.assignee || 'Unassigned',
          dueDate: pillar.dueDate || 'TBD',
          mcp: pillar.mcp || 'Content Generator'
        })) || [];
        
        setTasks(generatedTasks);
        
        // Mock metrics
        setMetrics({
          completion: Math.round((generatedTasks.filter(t => t.status === 'completed').length / generatedTasks.length) * 100) || 0,
          activeTasksCount: generatedTasks.filter(t => t.status === 'in_progress').length,
          completedTasksCount: generatedTasks.filter(t => t.status === 'completed').length,
          totalTasksCount: generatedTasks.length,
          engagement: 85,
          reach: '12.5K',
          sentiment: 92
        });
      }
    } catch (error) {
      console.error('Error loading campaign:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    );
    
    // Update metrics
    const updatedTasks = tasks.map(task => 
      task.id === taskId ? { ...task, status: newStatus } : task
    );
    
    setMetrics(prev => ({
      ...prev,
      completion: Math.round((updatedTasks.filter(t => t.status === 'completed').length / updatedTasks.length) * 100),
      activeTasksCount: updatedTasks.filter(t => t.status === 'in_progress').length,
      completedTasksCount: updatedTasks.filter(t => t.status === 'completed').length
    }));
  };

  const executeTask = async (task) => {
    updateTaskStatus(task.id, 'in_progress');
    
    // Simulate task execution
    setTimeout(() => {
      updateTaskStatus(task.id, 'completed');
    }, 3000);
    
    // In production, this would trigger the appropriate MCP
    console.log(`Executing task ${task.name} with MCP: ${task.mcp}`);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'in_progress':
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-gray-400" />;
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <AlertCircle className="w-16 h-16 text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Campaign Not Found</h2>
        <button
          onClick={() => navigate('/projects/demo-project/strategic-planning')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Back to Strategic Planning
        </button>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50 overflow-auto">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/projects/demo-project/strategic-planning')}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold">{campaign.objective || 'Campaign Execution'}</h1>
              <p className="text-gray-600">Real-time campaign monitoring and control</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
              <Play className="w-4 h-4" />
              Execute All
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="bg-white border-b px-6 py-4">
        <div className="grid grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Completion</p>
              <p className="text-2xl font-bold">{metrics.completion}%</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold">{metrics.completedTasksCount}/{metrics.totalTasksCount}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Engagement</p>
              <p className="text-2xl font-bold">{metrics.engagement}%</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Reach</p>
              <p className="text-2xl font-bold">{metrics.reach}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b px-6">
        <div className="flex gap-6">
          {['overview', 'tasks', 'timeline', 'analytics'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-1 border-b-2 capitalize ${
                activeTab === tab 
                  ? 'border-blue-600 text-blue-600 font-medium' 
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Campaign Summary */}
            <div className="bg-white rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Campaign Summary</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Objective</p>
                  <p className="font-medium">{campaign.objective}</p>
                </div>
                {campaign.context && (
                  <div>
                    <p className="text-sm text-gray-600">Context</p>
                    <p className="text-gray-800">{campaign.context}</p>
                  </div>
                )}
                {campaign.timeline && (
                  <div>
                    <p className="text-sm text-gray-600">Timeline</p>
                    <p className="text-gray-800">{campaign.timeline}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Progress Overview */}
            <div className="bg-white rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Progress Overview</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">Overall Progress</span>
                    <span className="text-sm font-medium">{metrics.completion}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${metrics.completion}%` }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 pt-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{metrics.completedTasksCount}</p>
                    <p className="text-sm text-gray-600">Completed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{metrics.activeTasksCount}</p>
                    <p className="text-sm text-gray-600">Active</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-400">
                      {metrics.totalTasksCount - metrics.completedTasksCount - metrics.activeTasksCount}
                    </p>
                    <p className="text-sm text-gray-600">Pending</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="bg-white rounded-lg">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold">Execution Tasks</h3>
              <p className="text-gray-600">Manage and monitor campaign tasks</p>
            </div>
            <div className="divide-y">
              {tasks.map(task => (
                <div key={task.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      {getStatusIcon(task.status)}
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{task.name}</h4>
                        <p className="text-gray-600 mt-1">{task.description}</p>
                        <div className="flex items-center gap-4 mt-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(task.status)}`}>
                            {task.status.replace('_', ' ')}
                          </span>
                          <span className="text-sm text-gray-600 flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            {task.mcp}
                          </span>
                          <span className="text-sm text-gray-600 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {task.dueDate}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {task.status === 'pending' && (
                        <button
                          onClick={() => executeTask(task)}
                          className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                        >
                          Execute
                        </button>
                      )}
                      {task.status === 'in_progress' && (
                        <button
                          onClick={() => updateTaskStatus(task.id, 'completed')}
                          className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                        >
                          Mark Complete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="bg-white rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Execution Timeline</h3>
            <div className="space-y-4">
              {tasks.map((task, index) => (
                <div key={task.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      task.status === 'completed' ? 'bg-green-100' :
                      task.status === 'in_progress' ? 'bg-blue-100' :
                      'bg-gray-100'
                    }`}>
                      {getStatusIcon(task.status)}
                    </div>
                    {index < tasks.length - 1 && (
                      <div className="w-0.5 h-16 bg-gray-300 mt-2" />
                    )}
                  </div>
                  <div className="flex-1 pb-8">
                    <h4 className="font-semibold">{task.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                    <p className="text-xs text-gray-500 mt-2">Due: {task.dueDate}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Performance Metrics
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600">Engagement Rate</span>
                    <span className="text-sm font-medium">{metrics.engagement}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${metrics.engagement}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600">Sentiment Score</span>
                    <span className="text-sm font-medium">{metrics.sentiment}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${metrics.sentiment}%` }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Key Insights
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <span className="text-gray-700">Campaign performing above target metrics</span>
                </li>
                <li className="flex items-start gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-500 mt-0.5" />
                  <span className="text-gray-700">Engagement increasing by 15% week-over-week</span>
                </li>
                <li className="flex items-start gap-2">
                  <Users className="w-5 h-5 text-purple-500 mt-0.5" />
                  <span className="text-gray-700">Audience reach expanded to new demographics</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignExecutionDashboard;