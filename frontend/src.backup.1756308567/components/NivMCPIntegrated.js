import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  Shield, 
  TrendingUp,
  Users,
  FileText,
  AlertCircle,
  Network,
  Brain,
  Eye,
  Zap
} from 'lucide-react';
import mcpService from '../services/mcpIntegrationService';
import { supabase } from '../supabaseClient';

const NivMCPIntegrated = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeMCPs, setActiveMCPs] = useState([]);
  const [mcpStatus, setMcpStatus] = useState([]);
  const [currentWorkspace, setCurrentWorkspace] = useState(null);
  const [artifacts, setArtifacts] = useState([]);
  const messagesEndRef = useRef(null);

  // MCP Icons mapping
  const mcpIcons = {
    'signaldesk-crisis': Shield,
    'signaldesk-intelligence': Brain,
    'signaldesk-media': FileText,
    'signaldesk-social': TrendingUp,
    'signaldesk-stakeholder-groups': Users,
    'signaldesk-monitor': Eye,
    'signaldesk-orchestrator': Network,
    'signaldesk-entities': Zap
  };

  useEffect(() => {
    // Initialize MCP status
    const status = mcpService.getMCPStatus();
    setMcpStatus(status);
    
    // Load conversation history if exists
    loadConversationHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversationHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('niv_conversations')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(50);
      
      if (data) {
        setMessages(data.map(msg => ({
          role: msg.role,
          content: msg.content,
          mcps: msg.mcps_used || []
        })));
      }
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return;

    const userMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);

    try {
      // Detect relevant MCPs
      const relevantMCPs = mcpService.detectRelevantMCPs(message);
      setActiveMCPs(relevantMCPs);

      // If crisis detected, trigger orchestration
      if (relevantMCPs.includes('crisis')) {
        await handleCrisisMode(message);
      }

      // Call Niv API with MCP integration
      const response = await fetch(`${process.env.REACT_APP_SUPABASE_URL}/functions/v1/niv-mcp-integrated`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          message: message,
          conversationHistory: messages,
          userId: 'user-123',
          sessionId: 'session-' + Date.now()
        })
      });

      const data = await response.json();
      
      // Add assistant response
      const assistantMessage = {
        role: 'assistant',
        content: data.chatMessage,
        mcps: data.mcpCalls || relevantMCPs,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, assistantMessage]);

      // If artifact created, add to workspace
      if (data.artifact) {
        setArtifacts(prev => [...prev, data.artifact]);
        setCurrentWorkspace(data.artifact);
      }

      // Execute MCP tools if needed
      if (relevantMCPs.length > 0) {
        const mcpResults = await mcpService.orchestrateMCPCalls(message);
        console.log('MCP Results:', mcpResults);
      }

    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I encountered an error. Please try again.',
        error: true
      }]);
    } finally {
      setIsLoading(false);
      setActiveMCPs([]);
    }
  };

  const handleCrisisMode = async (situation) => {
    // Trigger crisis mode with orchestrator
    const urgencyResult = await mcpService.executeMCPTool('orchestrator', 'assessUrgency', {
      signal: situation
    });
    
    if (urgencyResult.result.data.urgency === 'critical') {
      // Coordinate response across MCPs
      await mcpService.executeMCPTool('orchestrator', 'coordinateResponse', {
        situation,
        urgency: 'critical'
      });
      
      // Alert user
      setMessages(prev => [...prev, {
        role: 'system',
        content: '🚨 CRISIS MODE ACTIVATED - All relevant MCPs mobilized',
        type: 'alert'
      }]);
    }
  };

  const getMCPBadgeColor = (mcpKey) => {
    const colors = {
      crisis: 'destructive',
      intelligence: 'default',
      media: 'secondary',
      social: 'outline'
    };
    return colors[mcpKey] || 'default';
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bot className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-semibold">Niv - AI PR Strategist</h1>
                <p className="text-sm text-gray-500">Powered by {mcpStatus.length} SignalDesk MCPs</p>
              </div>
            </div>
            
            {/* Active MCPs Display */}
            <div className="flex items-center space-x-2">
              {activeMCPs.map(mcp => {
                const Icon = mcpIcons[mcpService.mcpEndpoints[mcp]?.name] || Brain;
                return (
                  <Badge key={mcp} variant="outline" className="animate-pulse">
                    <Icon className="h-3 w-3 mr-1" />
                    {mcp}
                  </Badge>
                );
              })}
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-6">
          <div className="max-w-4xl mx-auto space-y-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-2xl rounded-lg px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : msg.error
                      ? 'bg-red-100 text-red-800'
                      : msg.type === 'alert'
                      ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                      : 'bg-white border border-gray-200'
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    {msg.role === 'assistant' && <Bot className="h-5 w-5 mt-0.5 text-gray-600" />}
                    {msg.role === 'user' && <User className="h-5 w-5 mt-0.5" />}
                    <div className="flex-1">
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      
                      {/* Show MCPs used */}
                      {msg.mcps && msg.mcps.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {msg.mcps.map((mcp, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {mcp}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
                  <div className="flex items-center space-x-2">
                    <Bot className="h-5 w-5 text-gray-600 animate-pulse" />
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="bg-white border-t px-6 py-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex space-x-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask Niv anything about PR strategy..."
                className="flex-1"
                disabled={isLoading}
              />
              <Button 
                onClick={handleSendMessage} 
                disabled={isLoading || !message.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Quick Actions */}
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMessage('Help me create a crisis response plan')}
              >
                <Shield className="h-3 w-3 mr-1" />
                Crisis Response
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMessage('Generate a media list for tech journalists')}
              >
                <FileText className="h-3 w-3 mr-1" />
                Media List
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMessage('Analyze social media sentiment')}
              >
                <TrendingUp className="h-3 w-3 mr-1" />
                Social Analysis
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMessage('Track competitor activities')}
              >
                <Brain className="h-3 w-3 mr-1" />
                Intelligence
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - MCP Status & Workspace */}
      <div className="w-96 bg-white border-l">
        <Tabs defaultValue="workspace" className="h-full">
          <TabsList className="w-full">
            <TabsTrigger value="workspace" className="flex-1">Workspace</TabsTrigger>
            <TabsTrigger value="mcps" className="flex-1">MCPs ({mcpStatus.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="workspace" className="p-4">
            <h3 className="font-semibold mb-3">Active Artifacts</h3>
            {artifacts.length === 0 ? (
              <p className="text-sm text-gray-500">No artifacts created yet</p>
            ) : (
              <div className="space-y-3">
                {artifacts.map((artifact) => (
                  <Card key={artifact.id} className="cursor-pointer hover:shadow-md">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">{artifact.title}</CardTitle>
                      <p className="text-xs text-gray-500">{artifact.type}</p>
                    </CardHeader>
                    <CardContent>
                      {artifact.mcpSources && (
                        <div className="flex flex-wrap gap-1">
                          {artifact.mcpSources.map((mcp, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {mcp}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="mcps" className="p-4">
            <h3 className="font-semibold mb-3">Available MCPs</h3>
            <ScrollArea className="h-[calc(100vh-150px)]">
              <div className="space-y-2">
                {mcpStatus.map((mcp) => {
                  const Icon = mcpIcons[mcp.name] || Brain;
                  return (
                    <Card key={mcp.key} className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Icon className="h-4 w-4 text-gray-600" />
                          <div>
                            <p className="text-sm font-medium">{mcp.name}</p>
                            <p className="text-xs text-gray-500">{mcp.toolCount} tools</p>
                          </div>
                        </div>
                        <Badge 
                          variant={mcp.priority >= 0.9 ? 'destructive' : mcp.priority >= 0.7 ? 'default' : 'secondary'}
                        >
                          {(mcp.priority * 100).toFixed(0)}%
                        </Badge>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default NivMCPIntegrated;