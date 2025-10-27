/**
 * Service for managing predictions linked to intelligence targets
 */

import { supabase } from '@/lib/supabase/client'
import type { Prediction, PredictionWithTarget, PredictionFilters, IntelligenceTarget } from '@/types/predictions'

export class PredictionTargetService {
  /**
   * Get all predictions for a specific target
   */
  static async getPredictionsByTarget(
    organizationId: string,
    targetId: string
  ): Promise<PredictionWithTarget[]> {
    const { data, error } = await supabase
      .from('predictions_with_targets')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('target_id', targetId)
      .order('confidence_score', { ascending: false })

    if (error) throw new Error(`Failed to fetch predictions: ${error.message}`)
    return data || []
  }

  /**
   * Get predictions filtered by target type
   */
  static async getPredictionsByTargetType(
    organizationId: string,
    targetType: 'competitor' | 'topic' | 'keyword' | 'influencer'
  ): Promise<PredictionWithTarget[]> {
    const { data, error } = await supabase
      .from('predictions_with_targets')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('target_type', targetType)
      .order('confidence_score', { ascending: false })

    if (error) throw new Error(`Failed to fetch predictions: ${error.message}`)
    return data || []
  }

  /**
   * Get all predictions with optional filters
   */
  static async getFilteredPredictions(
    organizationId: string,
    filters: PredictionFilters = {}
  ): Promise<PredictionWithTarget[]> {
    let query = supabase
      .from('predictions_with_targets')
      .select('*')
      .eq('organization_id', organizationId)

    if (filters.target_id) {
      query = query.eq('target_id', filters.target_id)
    }
    if (filters.target_type) {
      query = query.eq('target_type', filters.target_type)
    }
    if (filters.target_name) {
      query = query.ilike('target_name', `%${filters.target_name}%`)
    }
    if (filters.category) {
      query = query.eq('category', filters.category)
    }
    if (filters.impact_level) {
      query = query.eq('impact_level', filters.impact_level)
    }
    if (filters.time_horizon) {
      query = query.eq('time_horizon', filters.time_horizon)
    }
    if (filters.status) {
      query = query.eq('status', filters.status)
    }
    if (filters.confidence_min) {
      query = query.gte('confidence_score', filters.confidence_min)
    }
    if (filters.confidence_max) {
      query = query.lte('confidence_score', filters.confidence_max)
    }

    const { data, error } = await query.order('confidence_score', { ascending: false })

    if (error) throw new Error(`Failed to fetch predictions: ${error.message}`)
    return data || []
  }

  /**
   * Create a prediction linked to a target
   */
  static async createPrediction(
    organizationId: string,
    targetId: string | null,
    predictionData: {
      title: string
      description: string
      category: Prediction['category']
      confidence_score: number
      time_horizon: Prediction['time_horizon']
      impact_level: Prediction['impact_level']
      data?: any
    }
  ): Promise<Prediction> {
    // If target_id provided, fetch target details for denormalization
    let target_name = null
    let target_type = null

    if (targetId) {
      const { data: target } = await supabase
        .from('intelligence_targets')
        .select('name, type')
        .eq('id', targetId)
        .single()

      if (target) {
        target_name = target.name
        target_type = target.type
      }
    }

    const { data, error } = await supabase
      .from('predictions')
      .insert({
        organization_id: organizationId,
        target_id: targetId,
        target_name,
        target_type,
        ...predictionData
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to create prediction: ${error.message}`)
    return data
  }

  /**
   * Update prediction's target link
   */
  static async updatePredictionTarget(
    predictionId: string,
    targetId: string | null
  ): Promise<Prediction> {
    // Fetch target details if provided
    let target_name = null
    let target_type = null

    if (targetId) {
      const { data: target } = await supabase
        .from('intelligence_targets')
        .select('name, type')
        .eq('id', targetId)
        .single()

      if (target) {
        target_name = target.name
        target_type = target.type
      }
    }

    const { data, error } = await supabase
      .from('predictions')
      .update({
        target_id: targetId,
        target_name,
        target_type
      })
      .eq('id', predictionId)
      .select()
      .single()

    if (error) throw new Error(`Failed to update prediction: ${error.message}`)
    return data
  }

  /**
   * Get target summary with prediction counts
   */
  static async getTargetWithPredictionCount(
    organizationId: string,
    targetId: string
  ): Promise<IntelligenceTarget & { prediction_count: number }> {
    const { data: target, error: targetError } = await supabase
      .from('intelligence_targets')
      .select('*')
      .eq('id', targetId)
      .eq('organization_id', organizationId)
      .single()

    if (targetError) throw new Error(`Failed to fetch target: ${targetError.message}`)

    const { count, error: countError } = await supabase
      .from('predictions')
      .select('id', { count: 'exact', head: true })
      .eq('target_id', targetId)
      .eq('status', 'active')

    if (countError) throw new Error(`Failed to count predictions: ${countError.message}`)

    return {
      ...target,
      prediction_count: count || 0
    }
  }

  /**
   * Get all targets with their prediction counts
   */
  static async getTargetsWithPredictionCounts(
    organizationId: string
  ): Promise<Array<IntelligenceTarget & { prediction_count: number }>> {
    const { data: targets, error: targetsError } = await supabase
      .from('intelligence_targets')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('active', true)
      .order('name')

    if (targetsError) throw new Error(`Failed to fetch targets: ${targetsError.message}`)

    // Get prediction counts for all targets
    const targetsWithCounts = await Promise.all(
      (targets || []).map(async (target) => {
        const { count } = await supabase
          .from('predictions')
          .select('id', { count: 'exact', head: true })
          .eq('target_id', target.id)
          .eq('status', 'active')

        return {
          ...target,
          prediction_count: count || 0
        }
      })
    )

    return targetsWithCounts
  }

  /**
   * Get prediction statistics by target
   */
  static async getPredictionStatsByTarget(
    organizationId: string
  ): Promise<Record<string, { total: number; avg_confidence: number; high_impact: number }>> {
    const { data: predictions, error } = await supabase
      .from('predictions')
      .select('target_id, target_name, confidence_score, impact_level, status')
      .eq('organization_id', organizationId)
      .eq('status', 'active')

    if (error) throw new Error(`Failed to fetch predictions: ${error.message}`)

    const stats: Record<string, { total: number; avg_confidence: number; high_impact: number }> = {}

    predictions?.forEach((pred) => {
      if (!pred.target_id) return

      if (!stats[pred.target_id]) {
        stats[pred.target_id] = {
          total: 0,
          avg_confidence: 0,
          high_impact: 0
        }
      }

      stats[pred.target_id].total++
      stats[pred.target_id].avg_confidence += pred.confidence_score
      if (pred.impact_level === 'high') {
        stats[pred.target_id].high_impact++
      }
    })

    // Calculate averages
    Object.keys(stats).forEach((targetId) => {
      stats[targetId].avg_confidence = Math.round(
        stats[targetId].avg_confidence / stats[targetId].total
      )
    })

    return stats
  }
}
