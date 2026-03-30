// Database types based on V3 schema

export interface Organization {
  id: string
  name: string
  industry?: string
  description?: string
  keywords?: string[]
  competitors?: string[]
  created_at: string
  updated_at: string
}

export interface IntelligenceReport {
  id: string
  organization_id: string
  pipeline_run_id?: string
  stage: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  data: any
  created_at: string
  updated_at: string
}

export interface Opportunity {
  id: string
  organization_id: string
  title: string
  description: string
  type: 'crisis' | 'competitive' | 'market' | 'regulatory' | 'strategic'
  priority: 'critical' | 'high' | 'medium' | 'low'
  score: number
  time_window?: string
  action_items?: string[]
  source_articles?: any[]
  analyst_persona?: string
  status: 'new' | 'in_progress' | 'executed' | 'archived'
  created_at: string
  expires_at?: string
}

export interface Campaign {
  id: string
  organization_id: string
  opportunity_id?: string
  name: string
  type: string
  status: 'draft' | 'active' | 'completed' | 'archived'
  content?: any
  media_list?: any[]
  metrics?: any
  created_at: string
  updated_at: string
}

export interface MediaContact {
  id: string
  name: string
  outlet: string
  beat?: string
  email?: string
  twitter?: string
  linkedin?: string
  notes?: string
  last_contacted?: string
  created_at: string
  updated_at: string
}

export interface Pattern {
  id: string
  organization_id: string
  type: string
  name: string
  description?: string
  pattern_data: any
  success_rate?: number
  usage_count: number
  created_at: string
  updated_at: string
}

export interface PipelineRun {
  id: string
  organization_id: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  started_at: string
  completed_at?: string
  stages_completed: string[]
  error?: string
  metadata?: any
}

export interface ExecutiveSynthesis {
  id: string
  pipeline_run_id: string
  organization_id: string
  competitive_intelligence?: any
  market_trends?: any
  stakeholder_analysis?: any
  cascade_detection?: any
  recommendations?: string[]
  created_at: string
}