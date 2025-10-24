// Memory Vault V2: Realtime Subscriptions
// Purpose: Listen for intelligence completion and update UI
// Performance: Real-time updates without polling

import { createClient } from '@supabase/supabase-js'
import type { RealtimeChannel } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface ContentIntelligenceUpdate {
  id: string
  intelligence_status: 'pending' | 'processing' | 'complete' | 'failed'
  folder?: string
  themes?: string[]
  topics?: string[]
  entities?: any
  content_signature?: string
}

export interface BrandAssetUpdate {
  id: string
  status: 'uploading' | 'analyzing' | 'active' | 'failed'
  extracted_guidelines?: any
  brand_voice_profile?: any
}

/**
 * Subscribe to intelligence updates for content library
 * Notifies when background intelligence processing completes
 */
export function subscribeToContentIntelligence(
  callback: (update: ContentIntelligenceUpdate) => void,
  organizationId?: string
): RealtimeChannel {
  let channel = supabase
    .channel('content-intelligence-updates')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'content_library',
        filter: organizationId ? `organization_id=eq.${organizationId}` : undefined
      },
      (payload) => {
        const update = payload.new as Content IntelligenceUpdate

        // Only notify if intelligence status changed
        if (
          update.intelligence_status === 'complete' ||
          update.intelligence_status === 'failed'
        ) {
          callback(update)
        }
      }
    )

  channel.subscribe((status) => {
    console.log('📡 Realtime connection status:', status)
  })

  return channel
}

/**
 * Subscribe to brand asset analysis updates
 * Notifies when uploaded brand assets finish analyzing
 */
export function subscribeToBrandAssetAnalysis(
  callback: (update: BrandAssetUpdate) => void,
  organizationId?: string
): RealtimeChannel {
  let channel = supabase
    .channel('brand-asset-updates')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'brand_assets',
        filter: organizationId ? `organization_id=eq.${organizationId}` : undefined
      },
      (payload) => {
        const update = payload.new as BrandAssetUpdate

        // Notify on status changes
        if (update.status === 'active' || update.status === 'failed') {
          callback(update)
        }
      }
    )

  channel.subscribe((status) => {
    console.log('📡 Brand asset Realtime status:', status)
  })

  return channel
}

/**
 * Subscribe to job queue updates for monitoring
 */
export function subscribeToJobQueue(
  callback: (job: any) => void
): RealtimeChannel {
  let channel = supabase
    .channel('job-queue-updates')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'job_queue'
      },
      (payload) => {
        callback(payload.new)
      }
    )

  channel.subscribe()
  return channel
}

/**
 * Unsubscribe from a channel
 */
export function unsubscribe(channel: RealtimeChannel): void {
  supabase.removeChannel(channel)
}

// Example usage in a React component:
/*
import { useEffect, useState } from 'react'
import { subscribeToContentIntelligence, unsubscribe } from '@/lib/memory-vault/realtime-subscriptions'

function ContentLibrary() {
  const [content, setContent] = useState([])

  useEffect(() => {
    // Subscribe to intelligence updates
    const channel = subscribeToContentIntelligence((update) => {
      console.log('🎉 Intelligence complete for:', update.id)
      console.log('📁 Suggested folder:', update.folder)
      console.log('🏷️ Themes:', update.themes)

      // Update UI with new intelligence
      setContent(prev => prev.map(item =>
        item.id === update.id
          ? { ...item, ...update }
          : item
      ))
    }, 'your-org-id')

    // Cleanup on unmount
    return () => unsubscribe(channel)
  }, [])

  return <div>Content with real-time intelligence updates!</div>
}
*/
