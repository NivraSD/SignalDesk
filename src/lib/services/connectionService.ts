import { supabase } from '@/lib/supabase/client'
import type {
  EntityConnection,
  ConnectionSignal,
  IndustryProfile,
  IntelligenceGraph,
  StrongConnection,
  SignalNeedingAttention,
  EntityNetworkActivity
} from '@/lib/types/connections'

export class ConnectionService {
  /**
   * Get all entity connections for an organization
   */
  static async getEntityConnections(
    organizationId: string,
    minStrength: number = 0
  ): Promise<EntityConnection[]> {
    const { data, error } = await supabase
      .from('entity_connections')
      .select('*')
      .eq('organization_id', organizationId)
      .gte('connection_strength', minStrength)
      .order('connection_strength', { ascending: false })

    if (error) {
      console.error('Failed to get entity connections:', error)
      return []
    }

    return data || []
  }

  /**
   * Get strong connections (strength >= 60)
   */
  static async getStrongConnections(organizationId: string): Promise<StrongConnection[]> {
    const { data, error } = await supabase
      .from('strong_connections_summary')
      .select('*')
      .eq('organization_id', organizationId)

    if (error) {
      console.error('Failed to get strong connections:', error)
      return []
    }

    return data || []
  }

  /**
   * Get connection signals for an organization
   */
  static async getConnectionSignals(
    organizationId: string,
    options?: {
      minStrength?: number;
      minConfidence?: number;
      impactLevel?: string;
      maturity?: string;
    }
  ): Promise<ConnectionSignal[]> {
    let query = supabase
      .from('connection_signals')
      .select('*')
      .eq('organization_id', organizationId)

    if (options?.minStrength) {
      query = query.gte('strength_score', options.minStrength)
    }

    if (options?.minConfidence) {
      query = query.gte('confidence_score', options.minConfidence)
    }

    if (options?.impactLevel) {
      query = query.eq('client_impact_level', options.impactLevel)
    }

    if (options?.maturity) {
      query = query.eq('signal_maturity', options.maturity)
    }

    query = query.order('strength_score', { ascending: false })

    const { data, error } = await query

    if (error) {
      console.error('Failed to get connection signals:', error)
      return []
    }

    return data || []
  }

  /**
   * Get signals needing attention (high priority, no prediction yet)
   */
  static async getSignalsNeedingAttention(organizationId: string): Promise<SignalNeedingAttention[]> {
    const { data, error } = await supabase
      .from('signals_needing_attention')
      .select('*')
      .eq('organization_id', organizationId)

    if (error) {
      console.error('Failed to get signals needing attention:', error)
      return []
    }

    return data || []
  }

  /**
   * Get entity network activity summary
   */
  static async getEntityNetworkActivity(organizationId: string): Promise<EntityNetworkActivity[]> {
    const { data, error } = await supabase
      .from('entity_network_activity')
      .select('*')
      .eq('organization_id', organizationId)

    if (error) {
      console.error('Failed to get entity network activity:', error)
      return []
    }

    return data || []
  }

  /**
   * Get industry profile for an organization
   */
  static async getIndustryProfile(industry: string): Promise<IndustryProfile | null> {
    const { data, error } = await supabase
      .from('industry_intelligence_profiles')
      .select('*')
      .eq('industry', industry)
      .single()

    if (error) {
      console.error('Failed to get industry profile:', error)
      return null
    }

    return data
  }

  /**
   * Get intelligence graph for an organization
   */
  static async getIntelligenceGraph(organizationId: string): Promise<IntelligenceGraph[]> {
    const { data, error } = await supabase
      .from('intelligence_graph')
      .select('*')
      .eq('organization_id', organizationId)
      .order('centrality_score', { ascending: false })

    if (error) {
      console.error('Failed to get intelligence graph:', error)
      return []
    }

    return data || []
  }

  /**
   * Get connection details with evidence
   */
  static async getConnectionDetails(connectionId: string): Promise<EntityConnection | null> {
    const { data, error } = await supabase
      .from('entity_connections')
      .select('*')
      .eq('id', connectionId)
      .single()

    if (error) {
      console.error('Failed to get connection details:', error)
      return null
    }

    return data
  }

  /**
   * Get signal details with evidence
   */
  static async getSignalDetails(signalId: string): Promise<ConnectionSignal | null> {
    const { data, error } = await supabase
      .from('connection_signals')
      .select('*')
      .eq('id', signalId)
      .single()

    if (error) {
      console.error('Failed to get signal details:', error)
      return null
    }

    return data
  }

  /**
   * Get connections for a specific entity
   */
  static async getEntityConnections_ByEntity(
    organizationId: string,
    entityId: string
  ): Promise<EntityConnection[]> {
    const { data, error } = await supabase
      .from('entity_connections')
      .select('*')
      .eq('organization_id', organizationId)
      .or(`entity_a_id.eq.${entityId},entity_b_id.eq.${entityId}`)
      .order('connection_strength', { ascending: false })

    if (error) {
      console.error('Failed to get entity connections:', error)
      return []
    }

    return data || []
  }

  /**
   * Get signals for a specific entity
   */
  static async getEntitySignals(
    organizationId: string,
    entityName: string
  ): Promise<ConnectionSignal[]> {
    const { data, error } = await supabase
      .from('connection_signals')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('primary_entity_name', entityName)
      .order('strength_score', { ascending: false })

    if (error) {
      console.error('Failed to get entity signals:', error)
      return []
    }

    return data || []
  }

  /**
   * Get connection statistics
   */
  static async getConnectionStats(organizationId: string) {
    const [connections, signals, strongConnections, needingAttention] = await Promise.all([
      this.getEntityConnections(organizationId),
      this.getConnectionSignals(organizationId),
      this.getStrongConnections(organizationId),
      this.getSignalsNeedingAttention(organizationId)
    ])

    const connectionTypes = new Map<string, number>()
    connections.forEach(conn => {
      connectionTypes.set(conn.connection_type, (connectionTypes.get(conn.connection_type) || 0) + 1)
    })

    const signalTypes = new Map<string, number>()
    signals.forEach(sig => {
      signalTypes.set(sig.signal_type, (signalTypes.get(sig.signal_type) || 0) + 1)
    })

    return {
      totalConnections: connections.length,
      strongConnections: strongConnections.length,
      totalSignals: signals.length,
      signalsNeedingAttention: needingAttention.length,
      avgConnectionStrength: connections.reduce((sum, c) => sum + c.connection_strength, 0) / (connections.length || 1),
      avgSignalStrength: signals.reduce((sum, s) => sum + s.strength_score, 0) / (signals.length || 1),
      connectionTypes: Object.fromEntries(connectionTypes),
      signalTypes: Object.fromEntries(signalTypes),
      highImpactSignals: signals.filter(s => s.client_impact_level === 'high' || s.client_impact_level === 'critical').length
    }
  }
}
