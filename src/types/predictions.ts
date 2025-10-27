/**
 * Prediction system types with intelligence targets integration
 */

export interface IntelligenceTarget {
  id: string
  organization_id: string
  name: string
  type: 'competitor' | 'topic' | 'keyword' | 'influencer'
  priority: 'low' | 'medium' | 'high'
  threat_level?: number
  keywords?: string[]
  metadata?: Record<string, any>
  active: boolean
  created_at: string
  updated_at: string
}

export interface Prediction {
  id: string
  organization_id: string

  // Core prediction
  title: string
  description: string
  category: 'competitive' | 'regulatory' | 'market' | 'technology' | 'partnership' | 'crisis' | 'strategic'

  // Confidence and timing
  confidence_score: number // 0-100
  time_horizon: '1-week' | '1-month' | '3-months' | '6-months' | '1-year'
  impact_level: 'high' | 'medium' | 'low'

  // Target integration (NEW)
  target_id?: string | null
  target_name?: string | null
  target_type?: 'competitor' | 'topic' | 'keyword' | 'influencer' | null

  // Additional data
  data?: {
    evidence?: string[]
    implications?: string[]
    recommended_actions?: string[]
    related_signals?: any[]
    trigger_events?: string[]
  }

  // Status
  status: 'active' | 'validated' | 'invalidated' | 'expired'

  // Timestamps
  created_at: string
  updated_at: string
}

export interface PredictionWithTarget extends Prediction {
  target?: IntelligenceTarget
  target_name_full?: string
  target_type_full?: string
  target_priority?: string
  threat_level?: number
  target_keywords?: string[]
  target_active?: boolean
}

export interface PredictionFilters {
  target_id?: string
  target_type?: 'competitor' | 'topic' | 'keyword' | 'influencer'
  target_name?: string
  category?: Prediction['category']
  impact_level?: Prediction['impact_level']
  time_horizon?: Prediction['time_horizon']
  status?: Prediction['status']
  confidence_min?: number
  confidence_max?: number
}

export interface PredictionStats {
  total: number
  by_target_type: {
    competitor: number
    topic: number
    keyword: number
    influencer: number
    unlinked: number
  }
  by_impact: {
    high: number
    medium: number
    low: number
  }
  by_status: {
    active: number
    validated: number
    invalidated: number
    expired: number
  }
  avg_confidence: number
}

export interface CreatePredictionRequest {
  organization_id: string
  target_id?: string
  title: string
  description: string
  category: Prediction['category']
  confidence_score: number
  time_horizon: Prediction['time_horizon']
  impact_level: Prediction['impact_level']
  data?: Prediction['data']
}

export interface UpdatePredictionRequest {
  id: string
  title?: string
  description?: string
  category?: Prediction['category']
  confidence_score?: number
  time_horizon?: Prediction['time_horizon']
  impact_level?: Prediction['impact_level']
  target_id?: string
  status?: Prediction['status']
  data?: Prediction['data']
}
