'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAppStore } from '@/stores/useAppStore'
import {
  Brain,
  Loader2,
  CheckCircle,
  XCircle,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Clock,
  Database,
  Zap,
  Shield,
  Eye,
  Target,
  User,
  Building2,
  Users,
  Sparkles,
  Search,
  Plus,
  Check,
  X,
  Landmark,
  Newspaper,
  Lightbulb,
  Scale,
  TreePine,
  GraduationCap,
  Layers,
  Factory
} from 'lucide-react'

// ==================== ENTITY DATABASE ====================
const ENTITY_DATABASE: Record<string, { icon: string; categories: Record<string, string[]> }> = {
  // Government & Politics
  us_government: {
    icon: 'landmark',
    categories: {
      executive_branch: ['White House', 'Department of State', 'Department of Defense', 'Department of Treasury', 'Department of Justice', 'Department of Commerce', 'EPA', 'FDA', 'FTC', 'SEC'],
      key_regulators: ['SEC', 'FTC', 'FDA', 'EPA', 'FCC', 'CFPB', 'OSHA', 'NHTSA', 'FAA', 'CFTC'],
      intelligence_agencies: ['CIA', 'NSA', 'FBI', 'DHS', 'DNI', 'NRO', 'DIA', 'Secret Service', 'ATF', 'DEA']
    }
  },
  us_congress: {
    icon: 'landmark',
    categories: {
      senate_leadership: ['Chuck Schumer', 'Mitch McConnell', 'John Thune', 'Dick Durbin', 'John Barrasso', 'Shelley Moore Capito', 'Patty Murray', 'Tom Cotton'],
      senate_tech_commerce: ['Maria Cantwell', 'Ted Cruz', 'Amy Klobuchar', 'Marsha Blackburn', 'Brian Schatz', 'John Hickenlooper', 'Cynthia Lummis', 'Mark Warner'],
      senate_finance: ['Ron Wyden', 'Mike Crapo', 'Elizabeth Warren', 'Tim Scott', 'Sherrod Brown', 'Bob Menendez', 'Bill Hagerty', 'Catherine Cortez Masto'],
      house_leadership: ['Mike Johnson', 'Hakeem Jeffries', 'Steve Scalise', 'Katherine Clark', 'Tom Emmer', 'Pete Aguilar', 'Elise Stefanik', 'James Clyburn']
    }
  },
  international_leaders: {
    icon: 'landmark',
    categories: {
      g7_leaders: ['Joe Biden (US)', 'Keir Starmer (UK)', 'Emmanuel Macron (France)', 'Olaf Scholz (Germany)', 'Giorgia Meloni (Italy)', 'Justin Trudeau (Canada)', 'Shigeru Ishiba (Japan)'],
      tech_policy_leaders: ['Ursula von der Leyen (EU)', 'Thierry Breton (EU)', 'Margrethe Vestager (EU)', 'Narendra Modi (India)', 'Xi Jinping (China)']
    }
  },

  // Media & Journalism
  tech_journalists: {
    icon: 'newspaper',
    categories: {
      ai_reporters: ['Kara Swisher', 'Casey Newton', 'Will Oremus', 'Kevin Roose', 'Cade Metz', 'Karen Hao', 'James Vincent', 'Zoe Schiffer', 'Alex Kantrowitz', 'Emily Chang'],
      tech_columnists: ['Ben Thompson', 'John Gruber', 'MG Siegler', 'Om Malik', 'Joanna Stern', 'Nilay Patel', 'Marques Brownlee', 'Dieter Bohn', 'David Pierce', 'Lauren Goode']
    }
  },
  business_journalists: {
    icon: 'newspaper',
    categories: {
      financial_press: ['Andrew Ross Sorkin', 'David Faber', 'Jim Cramer', 'Sara Eisen', 'Becky Quick', 'Joe Kernen', 'Scott Wapner', 'Carl Quintanilla'],
      investigative: ['Ronan Farrow', 'Matt Taibbi', 'Bethany McLean', 'Jesse Eisinger', 'Gretchen Morgenson', 'David Enrich', 'Emily Steel', 'Kate Kelly']
    }
  },
  media_outlets: {
    icon: 'newspaper',
    categories: {
      mainstream: ['New York Times', 'Wall Street Journal', 'Washington Post', 'Bloomberg', 'Reuters', 'Associated Press', 'CNN', 'MSNBC', 'Fox News', 'NBC News'],
      tech_focused: ['TechCrunch', 'The Verge', 'Wired', 'Ars Technica', 'The Information', 'Platformer', 'Stratechery', 'Semafor', '404 Media', 'Rest of World']
    }
  },

  // Tech Executives & Influencers
  tech_executives: {
    icon: 'lightbulb',
    categories: {
      ai_leaders: ['Sam Altman', 'Dario Amodei', 'Demis Hassabis', 'Satya Nadella', 'Sundar Pichai', 'Mark Zuckerberg', 'Elon Musk', 'Jensen Huang', 'Arvind Krishna', 'Thomas Kurian'],
      startup_founders: ['Brian Chesky', 'Patrick Collison', 'Drew Houston', 'Stewart Butterfield', 'Daniel Ek', 'Whitney Wolfe Herd', 'Vlad Tenev', 'Tobi Lutke', 'Melanie Perkins', 'Dylan Field'],
      vc_investors: ['Marc Andreessen', 'Ben Horowitz', 'Reid Hoffman', 'Peter Thiel', 'Mary Meeker', 'John Doerr', 'Vinod Khosla', 'Bill Gurley', 'Aileen Lee', 'Kirsten Green']
    }
  },
  tech_influencers: {
    icon: 'lightbulb',
    categories: {
      twitter_tech: ['Paul Graham', 'Naval Ravikant', 'Balaji Srinivasan', 'Jason Calacanis', 'Benedict Evans', 'Chamath Palihapitiya', 'David Sacks', 'Garry Tan', 'Packy McCormick', 'Lenny Rachitsky'],
      ai_researchers: ['Andrej Karpathy', 'Yann LeCun', 'Andrew Ng', 'Fei-Fei Li', 'Geoffrey Hinton', 'Ilya Sutskever', 'Gary Marcus', 'Yoshua Bengio', 'Ian Goodfellow', 'Sebastian Thrun']
    }
  },

  // Advocacy & Activism
  tech_advocacy: {
    icon: 'scale',
    categories: {
      ai_safety: ['Center for AI Safety', 'Future of Life Institute', 'Machine Intelligence Research Institute', 'AI Now Institute', 'Partnership on AI', 'Center for Human-Compatible AI', 'Alignment Forum', 'EleutherAI', 'Conjecture', 'Redwood Research'],
      digital_rights: ['Electronic Frontier Foundation', 'ACLU', 'Access Now', 'Fight for the Future', 'Public Knowledge', 'Free Press', 'Demand Progress', 'Mozilla Foundation', 'Internet Archive', 'Creative Commons'],
      tech_accountability: ['Tech Transparency Project', 'Accountable Tech', 'Center for Humane Technology', 'Data & Society', 'AI Policy Institute', 'Integrity Institute', 'Stanford Internet Observatory', 'Tech Oversight Project', 'Foxglove', 'AlgorithmWatch']
    }
  },
  environmental: {
    icon: 'tree',
    categories: {
      major_ngos: ['Sierra Club', 'Greenpeace', 'Environmental Defense Fund', 'Natural Resources Defense Council', 'World Wildlife Fund', 'The Nature Conservancy', 'Earthjustice', '350.org', 'Sunrise Movement', 'Climate Reality Project'],
      climate_activists: ['Greta Thunberg', 'Bill McKibben', 'Vanessa Nakate', 'Xiye Bastida', 'Jamie Margolin', 'Alexandria Villaseñor', 'Jerome Foster II', 'Isra Hirsi', 'Luisa Neubauer', 'Licypriya Kangujam'],
      climate_scientists: ['Michael Mann', 'Katharine Hayhoe', 'James Hansen', 'Gavin Schmidt', 'Peter Kalmus', 'Kim Cobb', 'Leah Stokes', 'Ayana Elizabeth Johnson', 'Jonathan Foley', 'Marshall Burke']
    }
  },

  // Think Tanks & Research
  think_tanks: {
    icon: 'graduation',
    categories: {
      tech_policy: ['Brookings Institution', 'RAND Corporation', 'Center for Strategic and International Studies', 'New America', 'Information Technology and Innovation Foundation', 'R Street Institute', 'Aspen Institute', 'Wilson Center', 'German Marshall Fund', 'Atlantic Council'],
      economic: ['Peterson Institute', 'American Enterprise Institute', 'Cato Institute', 'Heritage Foundation', 'Economic Policy Institute', 'Center on Budget and Policy Priorities', 'Tax Foundation', 'Mercatus Center', 'Roosevelt Institute', 'Niskanen Center']
    }
  },
  academic: {
    icon: 'graduation',
    categories: {
      ai_research_labs: ['Stanford HAI', 'MIT CSAIL', 'Berkeley AI Research', 'CMU AI', 'Google Brain', 'DeepMind', 'Meta AI Research', 'Microsoft Research', 'OpenAI Research', 'Anthropic Research'],
      tech_policy_centers: ['Stanford Cyber Policy Center', 'Berkman Klein Center (Harvard)', 'Oxford Internet Institute', 'MIT Media Lab', 'Princeton CITP', 'Georgetown Law Tech Institute', 'NYU Tandon', 'UC Berkeley CLTC', 'Cambridge CFI', 'Montreal AI Ethics Institute']
    }
  },

  // Industries
  technology: {
    icon: 'building',
    categories: {
      big_tech: ['Apple', 'Microsoft', 'Google', 'Amazon', 'Meta', 'NVIDIA', 'Tesla', 'Oracle', 'IBM', 'Salesforce'],
      ai_companies: ['OpenAI', 'Anthropic', 'Google DeepMind', 'xAI', 'Mistral AI', 'Cohere', 'Inflection AI', 'Perplexity', 'Stability AI', 'Hugging Face'],
      cybersecurity: ['Palo Alto Networks', 'CrowdStrike', 'Fortinet', 'Zscaler', 'SentinelOne', 'CyberArk', 'Okta', 'Cloudflare', 'Check Point', 'Rapid7'],
      fintech: ['Stripe', 'Square', 'PayPal', 'Adyen', 'Klarna', 'Plaid', 'Chime', 'Robinhood', 'Coinbase', 'Revolut'],
      semiconductors: ['NVIDIA', 'Intel', 'AMD', 'Qualcomm', 'Broadcom', 'TSMC', 'ASML', 'Applied Materials', 'Micron', 'Texas Instruments']
    }
  },
  healthcare: {
    icon: 'building',
    categories: {
      big_pharma: ['Pfizer', 'Johnson & Johnson', 'Roche', 'Novartis', 'Merck', 'AbbVie', 'Bristol Myers Squibb', 'AstraZeneca', 'Sanofi', 'GSK'],
      biotech: ['Moderna', 'Regeneron', 'Vertex', 'Biogen', 'Illumina', 'BioNTech', 'Amgen', 'Gilead', 'CRISPR Therapeutics', 'Alnylam'],
      health_insurance: ['UnitedHealth', 'Anthem', 'CVS Health (Aetna)', 'Cigna', 'Humana', 'Centene', 'Kaiser Permanente', 'Blue Cross Blue Shield', 'Molina', 'Oscar Health']
    }
  },
  finance: {
    icon: 'building',
    categories: {
      major_banks: ['JPMorgan Chase', 'Bank of America', 'Wells Fargo', 'Citigroup', 'Goldman Sachs', 'Morgan Stanley', 'US Bank', 'PNC', 'Truist', 'Capital One'],
      asset_managers: ['BlackRock', 'Vanguard', 'Fidelity', 'State Street', 'Charles Schwab', 'T. Rowe Price', 'Franklin Templeton', 'Invesco', 'PIMCO', 'Wellington'],
      venture_capital: ['Sequoia Capital', 'Andreessen Horowitz', 'Accel', 'Benchmark', 'Greylock', 'Kleiner Perkins', 'GV', 'Insight Partners', 'NEA', 'Tiger Global']
    }
  },
  energy: {
    icon: 'building',
    categories: {
      oil_majors: ['ExxonMobil', 'Chevron', 'Shell', 'BP', 'TotalEnergies', 'ConocoPhillips', 'Equinor', 'Eni', 'Petrobras', 'Saudi Aramco'],
      renewable: ['NextEra Energy', 'Iberdrola', 'Orsted', 'Enel', 'Vestas', 'First Solar', 'Enphase Energy', 'SunPower', 'Brookfield Renewable', 'Canadian Solar']
    }
  },
  automotive: {
    icon: 'building',
    categories: {
      legacy_oems: ['Toyota', 'Volkswagen', 'General Motors', 'Ford', 'Stellantis', 'Honda', 'Nissan', 'Hyundai-Kia', 'BMW', 'Mercedes-Benz'],
      ev_companies: ['Tesla', 'Rivian', 'Lucid Motors', 'NIO', 'BYD', 'XPeng', 'Li Auto', 'Polestar', 'VinFast', 'Fisker'],
      autonomous: ['Waymo', 'Cruise', 'Aurora', 'Motional', 'Nuro', 'Zoox', 'TuSimple', 'Pony.ai', 'Mobileye', 'Argo AI']
    }
  },
  media_entertainment: {
    icon: 'building',
    categories: {
      streaming: ['Netflix', 'Disney+', 'Amazon Prime Video', 'HBO Max', 'Hulu', 'Paramount+', 'Peacock', 'Apple TV+', 'YouTube Premium', 'Spotify'],
      studios: ['Walt Disney', 'Warner Bros Discovery', 'Paramount', 'NBCUniversal', 'Sony Pictures', 'Lionsgate', 'A24', 'Netflix Studios', 'Amazon Studios', 'Apple Studios'],
      gaming: ['Microsoft (Xbox)', 'Sony (PlayStation)', 'Nintendo', 'Tencent', 'Activision Blizzard', 'Electronic Arts', 'Take-Two', 'Ubisoft', 'Epic Games', 'Roblox']
    }
  },
  retail: {
    icon: 'building',
    categories: {
      ecommerce: ['Amazon', 'Shopify', 'eBay', 'Etsy', 'Wayfair', 'Chewy', 'Alibaba', 'JD.com', 'Pinduoduo', 'MercadoLibre'],
      big_box: ['Walmart', 'Target', 'Costco', 'Home Depot', 'Lowes', 'Best Buy', 'Kroger', 'CVS', 'Walgreens', 'Dollar General']
    }
  }
}

// Format category names for display
function formatName(name: string): string {
  return name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}

// Get icon component
function getIcon(iconName: string) {
  switch (iconName) {
    case 'landmark': return Landmark
    case 'newspaper': return Newspaper
    case 'lightbulb': return Lightbulb
    case 'scale': return Scale
    case 'tree': return TreePine
    case 'users': return Users
    case 'graduation': return GraduationCap
    case 'building': return Building2
    default: return Factory
  }
}

interface ProfileMetadata {
  data_tier: 'rich' | 'medium' | 'cold_start'
  data_sources: string[]
  confidence: number
  cached: boolean
  build_time_ms: number
  model_used: string
  version: number
  expires_at: string
}

interface ProfileResult {
  success: boolean
  profile?: any
  metadata?: ProfileMetadata
  error?: string
}

interface IntelligenceTarget {
  id: string
  name: string
  target_type: string
  priority: string
  accumulated_context: any
  is_active: boolean
}

interface ExistingProfile {
  entity_name: string
  entity_type: string
  data_tier: string
  data_sources: string[]
  confidence_score: number
  model_used: string
  version: number
  expires_at: string
  built_at: string
  profile: any
}

interface EntityBuildStatus {
  name: string
  status: 'pending' | 'building' | 'success' | 'error'
  error?: string
}

const ENTITY_TYPES = [
  'company',
  'person',
  'organization',
  'competitor',
  'regulator',
  'reporter',
  'analyst',
  'stakeholder',
  'influencer'
] as const

export default function EntityProfileTester() {
  const organization = useAppStore(s => s.organization)
  const [entityName, setEntityName] = useState('')
  const [entityType, setEntityType] = useState<string>('company')
  const [forceRefresh, setForceRefresh] = useState(false)
  const [ttlHours, setTtlHours] = useState(24)
  const [skipFireplexity, setSkipFireplexity] = useState(false)

  const [loading, setLoading] = useState(false)
  const [buildingId, setBuildingId] = useState<string | null>(null)
  const [result, setResult] = useState<ProfileResult | null>(null)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['identity', 'metadata']))

  // Org intelligence targets + existing LP profiles
  const [targets, setTargets] = useState<IntelligenceTarget[]>([])
  const [existingProfiles, setExistingProfiles] = useState<ExistingProfile[]>([])
  const [loadingTargets, setLoadingTargets] = useState(false)

  // Entity database browser state
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [selectedEntities, setSelectedEntities] = useState<Set<string>>(new Set())
  const [databaseBuildStatuses, setDatabaseBuildStatuses] = useState<Map<string, EntityBuildStatus>>(new Map())
  const [isBuildingDatabase, setIsBuildingDatabase] = useState(false)

  // AI search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<string[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Show/hide entity database section
  const [showDatabase, setShowDatabase] = useState(false)

  // Global profiles (all orgs — for checking if a profile exists anywhere)
  const [globalProfiles, setGlobalProfiles] = useState<Set<string>>(new Set())
  const [globalProfileData, setGlobalProfileData] = useState<ExistingProfile[]>([])
  const [loadingGlobalProfiles, setLoadingGlobalProfiles] = useState(false)

  // Profile viewer modal
  const [viewingProfile, setViewingProfile] = useState<any>(null)
  const [loadingProfileView, setLoadingProfileView] = useState(false)

  const groups = useMemo(() => Object.keys(ENTITY_DATABASE).sort(), [])

  // Load intelligence targets and existing LP profiles when org changes
  useEffect(() => {
    if (!organization?.id) {
      setTargets([])
      setExistingProfiles([])
      return
    }

    const loadOrgEntities = async () => {
      setLoadingTargets(true)
      try {
        // Load intelligence targets and existing LP profiles in parallel
        const [targetsRes, profilesRes] = await Promise.all([
          supabase
            .from('intelligence_targets')
            .select('id, name, target_type, priority, accumulated_context, is_active')
            .eq('organization_id', organization.id)
            .eq('is_active', true)
            .order('priority', { ascending: true })
            .limit(50),
          supabase
            .from('lp_entity_profiles')
            .select('entity_name, entity_type, data_tier, data_sources, confidence_score, model_used, version, expires_at, built_at, profile')
            .order('built_at', { ascending: false })
        ])

        if (targetsRes.data) setTargets(targetsRes.data)
        if (profilesRes.data) setExistingProfiles(profilesRes.data)
      } catch (err) {
        console.error('Failed to load org entities:', err)
      } finally {
        setLoadingTargets(false)
      }
    }

    loadOrgEntities()
  }, [organization?.id])

  // Load all existing profiles globally — lightweight check (no profile JSONB)
  useEffect(() => {
    const loadAllProfiles = async () => {
      setLoadingGlobalProfiles(true)
      try {
        // Only fetch metadata — NOT the huge profile JSONB column
        const { data, error } = await supabase
          .from('lp_entity_profiles')
          .select('entity_name, entity_type, data_tier, data_sources, confidence_score, model_used, version, expires_at, built_at')
          .order('built_at', { ascending: false })

        console.log(`[LP] Global profiles loaded: ${data?.length || 0} entities${error ? ` (error: ${error.message})` : ''}`)

        if (data) {
          setGlobalProfiles(new Set(data.map(p => p.entity_name.toLowerCase())))
          setGlobalProfileData(data.map(p => ({ ...p, profile: null })) as any)
        }
      } catch (err) {
        console.error('Failed to load profiles:', err)
      } finally {
        setLoadingGlobalProfiles(false)
      }
    }

    loadAllProfiles()
  }, [])

  const getExistingProfile = (name: string, _type: string): ExistingProfile | undefined => {
    // Check org-specific profiles first (these have full profile data)
    const orgProfile = existingProfiles.find(
      p => p.entity_name.toLowerCase() === name.toLowerCase()
    )
    if (orgProfile) return orgProfile

    // Check global profiles (built by any org) — name match is sufficient
    return globalProfileData.find(
      p => p.entity_name.toLowerCase() === name.toLowerCase()
    )
  }

  // Load full profile on-demand for viewing
  const loadFullProfile = async (entityName: string): Promise<ExistingProfile | null> => {
    const { data } = await supabase
      .from('lp_entity_profiles')
      .select('entity_name, entity_type, data_tier, data_sources, confidence_score, model_used, version, expires_at, built_at, profile')
      .ilike('entity_name', entityName)
      .order('built_at', { ascending: false })
      .limit(1)
      .single()
    return data
  }

  const refreshGlobalProfiles = async () => {
    const { data } = await supabase
      .from('lp_entity_profiles')
      .select('entity_name, entity_type, data_tier, data_sources, confidence_score, model_used, version, expires_at, built_at')
      .order('built_at', { ascending: false })
    if (data) {
      setGlobalProfiles(new Set(data.map(p => p.entity_name.toLowerCase())))
      setGlobalProfileData(data.map(p => ({ ...p, profile: null })) as any)
    }
  }

  const isProfileFresh = (_profile: ExistingProfile): boolean => {
    // Profiles don't expire — if it exists, it's usable
    return true
  }

  const totalFacts = (target: IntelligenceTarget): number => {
    return target.accumulated_context?.total_facts || 0
  }

  // View an already-built profile directly from DB — no edge function call
  const viewProfile = async (existing: ExistingProfile) => {
    setEntityName(existing.entity_name)
    setEntityType(existing.entity_type)

    // If profile data wasn't loaded (global lightweight query), fetch it now
    let profileData = existing.profile
    if (!profileData) {
      setLoading(true)
      const full = await loadFullProfile(existing.entity_name)
      profileData = full?.profile || null
      setLoading(false)
    }

    setResult({
      success: true,
      profile: profileData,
      metadata: {
        data_tier: existing.data_tier as 'rich' | 'medium' | 'cold_start',
        data_sources: existing.data_sources || [],
        confidence: existing.confidence_score,
        cached: true,
        build_time_ms: 0,
        model_used: existing.model_used || 'unknown',
        version: existing.version,
        expires_at: existing.expires_at
      }
    })
  }

  // Parallel orchestrated build — batches of CONCURRENCY to avoid rate limits
  const CONCURRENCY = 5
  const [buildingAll, setBuildingAll] = useState(false)
  const [buildAllProgress, setBuildAllProgress] = useState({ done: 0, total: 0, failed: 0 })
  const [activeBuilds, setActiveBuilds] = useState<Set<string>>(new Set())

  const buildAllMissing = async () => {
    if (!organization?.id) return
    const missing = targets.filter(t => {
      const existing = getExistingProfile(t.name, t.target_type)
      return !existing || !isProfileFresh(existing)
    })
    if (missing.length === 0) return

    setBuildingAll(true)
    setBuildAllProgress({ done: 0, total: missing.length, failed: 0 })
    setActiveBuilds(new Set())

    let done = 0
    let failed = 0

    // Process in batches of CONCURRENCY
    for (let i = 0; i < missing.length; i += CONCURRENCY) {
      const batch = missing.slice(i, i + CONCURRENCY)

      // Mark all in batch as active
      setActiveBuilds(new Set(batch.map(t => t.id)))

      const results = await Promise.allSettled(
        batch.map(target =>
          supabase.functions.invoke('entity-context-manager', {
            body: {
              entity_id: target.id,
              name: target.name,
              entity_type: target.target_type,
              organization_id: organization.id,
              skip_fireplexity: skipFireplexity
            }
          }).then(res => {
            if (res.error) throw res.error
            return { target, data: res.data }
          })
        )
      )

      // Count results
      for (const r of results) {
        done++
        if (r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.data?.success)) {
          failed++
          const name = r.status === 'fulfilled' ? r.value.target.name : 'unknown'
          console.error(`Failed to build profile for ${name}`)
        }
      }
      setBuildAllProgress({ done, total: missing.length, failed })
    }

    setActiveBuilds(new Set())

    // Refresh profiles list
    await refreshGlobalProfiles()
    const { data: refreshed } = await supabase
      .from('lp_entity_profiles')
      .select('entity_name, entity_type, data_tier, data_sources, confidence_score, model_used, version, expires_at, built_at, profile')
      .order('built_at', { ascending: false })
    if (refreshed) setExistingProfiles(refreshed)

    setBuildingAll(false)
    setBuildingId(null)
  }

  // Entity database browser functions
  const toggleGroup = (group: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(group)) {
      newExpanded.delete(group)
    } else {
      newExpanded.add(group)
    }
    setExpandedGroups(newExpanded)
  }

  const toggleEntity = (entity: string) => {
    const newSelected = new Set(selectedEntities)
    if (newSelected.has(entity)) {
      newSelected.delete(entity)
    } else {
      newSelected.add(entity)
    }
    setSelectedEntities(newSelected)
  }

  const selectAllInCategory = (entities: string[]) => {
    const newSelected = new Set(selectedEntities)
    entities.forEach(e => newSelected.add(e))
    setSelectedEntities(newSelected)
  }

  const clearSelection = () => {
    setSelectedEntities(new Set())
    setDatabaseBuildStatuses(new Map())
  }

  // View an existing profile from the database
  const viewDatabaseProfile = async (entityName: string) => {
    setLoadingProfileView(true)
    try {
      const { data } = await supabase
        .from('lp_entity_profiles')
        .select('*')
        .ilike('entity_name', entityName)
        .order('built_at', { ascending: false })
        .limit(1)
        .single()

      if (data) {
        setViewingProfile(data)
      }
    } catch (err) {
      console.error('Failed to load profile:', err)
    } finally {
      setLoadingProfileView(false)
    }
  }

  // AI search - uses a simple edge function to call Gemini
  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    setSearchResults([])

    try {
      // Use the entity-search edge function (or fall back to a direct Gemini call via simple-ai-call)
      const { data, error } = await supabase.functions.invoke('simple-ai-call', {
        body: {
          prompt: `List 15 notable ${searchQuery}. Return ONLY a valid JSON array of names, no explanation or other text. Example format: ["Name 1", "Name 2", "Name 3"]`,
          model: 'gemini'
        }
      })

      if (!error && data?.result) {
        // Parse the result - it should be a JSON array
        const text = data.result
        // Try direct parse first
        try {
          const parsed = JSON.parse(text)
          if (Array.isArray(parsed)) {
            setSearchResults(parsed.filter((n: any) => typeof n === 'string').slice(0, 15))
            return
          }
        } catch {}

        // Try to extract JSON array from text
        const match = text.match(/\[[\s\S]*?\]/)
        if (match) {
          const names = JSON.parse(match[0])
          setSearchResults(names.filter((n: any) => typeof n === 'string').slice(0, 15))
        }
      } else if (error) {
        console.error('Search error:', error)
      }
    } catch (err) {
      console.error('Search failed:', err)
    }

    setIsSearching(false)
  }

  // Build selected database entities
  const buildSelectedEntities = async () => {
    if (selectedEntities.size === 0) return

    setIsBuildingDatabase(true)
    const entities = Array.from(selectedEntities)

    // Initialize statuses
    const initialStatuses = new Map<string, EntityBuildStatus>()
    entities.forEach(name => {
      initialStatuses.set(name, { name, status: 'pending' })
    })
    setDatabaseBuildStatuses(initialStatuses)

    // Process in batches of 3
    const batchSize = 3
    for (let i = 0; i < entities.length; i += batchSize) {
      const batch = entities.slice(i, i + batchSize)

      await Promise.all(batch.map(async (entityName) => {
        setDatabaseBuildStatuses(prev => {
          const newMap = new Map(prev)
          newMap.set(entityName, { name: entityName, status: 'building' })
          return newMap
        })

        try {
          const { data: result, error } = await supabase.functions.invoke('entity-context-manager', {
            body: {
              name: entityName,
              entity_type: 'company',
              force_refresh: false
            }
          })

          if (error) throw new Error(error.message)

          if (result?.success) {
            setDatabaseBuildStatuses(prev => {
              const newMap = new Map(prev)
              newMap.set(entityName, { name: entityName, status: 'success' })
              return newMap
            })
          } else {
            throw new Error(result.error || 'Unknown error')
          }
        } catch (err: any) {
          setDatabaseBuildStatuses(prev => {
            const newMap = new Map(prev)
            newMap.set(entityName, { name: entityName, status: 'error', error: err.message })
            return newMap
          })
        }
      }))

      if (i + batchSize < entities.length) {
        await new Promise(r => setTimeout(r, 1000))
      }
    }

    // Refresh profiles to show newly built ones
    await refreshGlobalProfiles()

    setIsBuildingDatabase(false)
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(section)) next.delete(section)
      else next.add(section)
      return next
    })
  }

  const buildProfile = async (name?: string, type?: string, targetId?: string) => {
    const targetName = name || entityName.trim()
    const targetType = type || entityType
    if (!targetName) return

    if (!organization?.id) {
      setResult({ success: false, error: 'No organization selected. Go to Settings to select an org.' })
      return
    }

    setLoading(true)
    setBuildingId(targetId || null)
    setResult(null)

    try {
      const body: any = {
        name: targetName,
        entity_type: targetType,
        organization_id: organization.id,
        force_refresh: forceRefresh,
        ttl_hours: ttlHours,
        skip_fireplexity: skipFireplexity
      }
      // If we have the target ID, pass it for richer data loading
      if (targetId) body.entity_id = targetId

      const { data, error } = await supabase.functions.invoke('entity-context-manager', { body })

      if (error) {
        setResult({ success: false, error: error.message })
      } else {
        setResult(data as ProfileResult)
        // Refresh profiles list after successful build
        if (data?.success) {
          await refreshGlobalProfiles()
          const { data: refreshed } = await supabase
            .from('lp_entity_profiles')
            .select('entity_name, entity_type, data_tier, data_sources, confidence_score, model_used, version, expires_at, built_at, profile')
            .order('built_at', { ascending: false })
          if (refreshed) setExistingProfiles(refreshed)
        }
      }
    } catch (err: any) {
      setResult({ success: false, error: err.message })
    } finally {
      setLoading(false)
      setBuildingId(null)
    }
  }

  const tierColor = (tier: string) => {
    switch (tier) {
      case 'rich': return 'text-green-400'
      case 'medium': return 'text-yellow-400'
      case 'cold_start': return 'text-orange-400'
      default: return 'text-gray-400'
    }
  }

  const confidenceColor = (conf: number) => {
    if (conf >= 0.7) return 'text-green-400'
    if (conf >= 0.5) return 'text-yellow-400'
    return 'text-orange-400'
  }

  const Section = ({ id, icon: Icon, title, children }: {
    id: string
    icon: any
    title: string
    children: React.ReactNode
  }) => {
    const expanded = expandedSections.has(id)
    return (
      <div className="border border-[var(--grey-800)] rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection(id)}
          className="w-full flex items-center gap-2 px-3 py-2 bg-[var(--grey-900)] hover:bg-[var(--grey-800)] transition-colors text-left"
        >
          <Icon className="w-4 h-4 text-[var(--burnt-orange)]" />
          <span className="text-sm font-medium text-[var(--cream)] flex-1">{title}</span>
          {expanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
        </button>
        {expanded && (
          <div className="px-3 py-2 bg-[var(--charcoal)] text-sm">
            {children}
          </div>
        )}
      </div>
    )
  }

  // Count successes/failures for database build
  const dbSuccessCount = Array.from(databaseBuildStatuses.values()).filter(s => s.status === 'success').length
  const dbErrorCount = Array.from(databaseBuildStatuses.values()).filter(s => s.status === 'error').length

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Brain className="w-6 h-6 text-[var(--burnt-orange)]" />
        <div>
          <h2 className="font-semibold" style={{ fontSize: '1.125rem', color: 'var(--charcoal)' }}>LP Entity Profile Builder</h2>
          <p className="text-sm text-gray-500">
            Build behavioral profiles for the Liminal Propagation simulation engine
          </p>
        </div>
      </div>

      {/* Org context */}
      <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
        <Building2 className="w-4 h-4" />
        <span>Org: <strong className="text-[var(--charcoal)]">{organization?.name || 'None selected'}</strong></span>
        {organization?.id && <span className="text-xs text-gray-400">({organization.id.substring(0, 8)}...)</span>}
        {targets.length > 0 && (
          <span className="ml-auto text-xs text-gray-400">{targets.length} targets monitored</span>
        )}
      </div>

      {/* Your Entities — loaded from intelligence_targets */}
      {organization?.id && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[var(--burnt-orange)]" />
            <h3 className="text-sm font-semibold text-[var(--charcoal)]">Your Intelligence Targets</h3>
            {loadingTargets && <Loader2 className="w-3 h-3 animate-spin text-gray-400" />}
            {targets.length > 0 && (() => {
              const missingCount = targets.filter(t => {
                const ex = getExistingProfile(t.name, t.target_type)
                return !ex || !isProfileFresh(ex)
              }).length
              const freshCount = targets.length - missingCount
              return (
                <div className="ml-auto flex items-center gap-2">
                  <span className="text-[10px] text-gray-400">
                    {freshCount}/{targets.length} profiled
                  </span>
                  {missingCount > 0 && (
                    <button
                      onClick={buildAllMissing}
                      disabled={loading || buildingAll}
                      className="px-2.5 py-1 text-[11px] font-medium bg-[var(--burnt-orange)] text-white rounded-md hover:bg-[var(--terracotta)] disabled:opacity-50 flex items-center gap-1"
                    >
                      {buildingAll ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          {buildAllProgress.done}/{buildAllProgress.total}
                          {buildAllProgress.failed > 0 && (
                            <span className="text-red-300">({buildAllProgress.failed} failed)</span>
                          )}
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3" />
                          Build All ({missingCount})
                        </>
                      )}
                    </button>
                  )}
                </div>
              )
            })()}
          </div>

          {targets.length === 0 && !loadingTargets && (
            <p className="text-xs text-gray-400">No intelligence targets found for this org. Add them in the Intelligence tab.</p>
          )}

          {targets.length > 0 && (
            <div className="space-y-1.5">
              {targets.map(target => {
                const existing = getExistingProfile(target.name, target.target_type)
                const fresh = existing && isProfileFresh(existing)
                const facts = totalFacts(target)
                const isBuilding = buildingId === target.id || activeBuilds.has(target.id)

                return (
                  <div
                    key={target.id}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors group"
                  >
                    {/* Entity info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[var(--charcoal)] truncate">{target.name}</span>
                        <span className="px-1.5 py-0.5 text-[10px] rounded bg-gray-100 text-gray-500">{target.target_type}</span>
                        {target.priority === 'critical' && (
                          <span className="px-1.5 py-0.5 text-[10px] rounded bg-red-50 text-red-600">critical</span>
                        )}
                        {target.priority === 'high' && (
                          <span className="px-1.5 py-0.5 text-[10px] rounded bg-orange-50 text-orange-600">high</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-[10px] text-gray-400">
                        <span>{facts} facts</span>
                        {existing && (
                          <span className="text-green-500 flex items-center gap-0.5">
                            <CheckCircle className="w-3 h-3" />
                            LP profile v{existing.version} ({existing.data_tier}) — {(existing.confidence_score * 100).toFixed(0)}% conf
                          </span>
                        )}
                        {!existing && (
                          <span className="text-gray-400">No LP profile yet</span>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="shrink-0 flex items-center gap-1.5">
                      {existing && fresh && (
                        <button
                          onClick={() => viewProfile(existing)}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 text-[var(--charcoal)] hover:bg-gray-200 transition-colors flex items-center gap-1.5"
                        >
                          <Eye className="w-3 h-3" />
                          View
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setEntityName(target.name)
                          setEntityType(target.target_type)
                          buildProfile(target.name, target.target_type, target.id)
                        }}
                        disabled={loading}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
                        style={{
                          background: existing && fresh ? 'transparent' : 'var(--burnt-orange)',
                          color: existing && fresh ? 'var(--burnt-orange)' : 'white',
                          border: existing && fresh ? '1px solid var(--burnt-orange)' : 'none'
                        }}
                      >
                        {isBuilding ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : existing && fresh ? (
                          <RefreshCw className="w-3 h-3" />
                        ) : (
                          <Sparkles className="w-3 h-3" />
                        )}
                        {isBuilding ? 'Building...' : existing && fresh ? 'Rebuild' : 'Build'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Entity Database — collapsible section */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <button
          onClick={() => setShowDatabase(!showDatabase)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[var(--burnt-orange)]" />
            <h3 className="text-sm font-semibold text-[var(--charcoal)]">Entity Database</h3>
            <span className="text-[10px] text-gray-400">Browse or search for entities to build</span>
          </div>
          {showDatabase ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
        </button>

        {showDatabase && (
          <div className="border-t border-gray-100 p-4 space-y-4">
            {/* AI Search */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-600">
                Search Any Category
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="e.g., climate scientists, EU regulators, AI ethicists..."
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--burnt-orange)] focus:border-transparent"
                />
                <button
                  onClick={handleSearch}
                  disabled={isSearching || !searchQuery.trim()}
                  className="px-3 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-gray-800 disabled:opacity-50"
                >
                  {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  Search
                </button>
              </div>

              {/* Search results */}
              {searchResults.length > 0 && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-600">Results for "{searchQuery}"</span>
                    <button
                      onClick={() => selectAllInCategory(searchResults)}
                      className="text-[10px] text-[var(--burnt-orange)] hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Add all
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {searchResults.map(entity => {
                      const hasExistingProfile = globalProfiles.has(entity.toLowerCase())
                      return (
                        <button
                          key={entity}
                          onClick={() => hasExistingProfile ? viewDatabaseProfile(entity) : toggleEntity(entity)}
                          title={hasExistingProfile ? 'Click to view profile' : 'Click to select for building'}
                          className={`px-2 py-1 text-[11px] rounded-full border transition-all ${
                            selectedEntities.has(entity)
                              ? 'bg-[var(--burnt-orange)] border-[var(--burnt-orange)] text-white'
                              : hasExistingProfile
                              ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                              : 'bg-white border-gray-200 text-gray-600 hover:border-[var(--burnt-orange)] hover:text-[var(--burnt-orange)]'
                          }`}
                        >
                          {hasExistingProfile && <Eye className="w-2.5 h-2.5 inline mr-0.5" />}
                          {entity}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Selection summary + build */}
            {selectedEntities.size > 0 && (
              <div className="p-3 bg-[var(--burnt-orange)]/5 rounded-lg border border-[var(--burnt-orange)]/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[var(--burnt-orange)]" />
                  <span className="text-sm font-medium text-gray-900">
                    {selectedEntities.size} entities selected
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={clearSelection}
                    className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800"
                  >
                    Clear
                  </button>
                  <button
                    onClick={buildSelectedEntities}
                    disabled={isBuildingDatabase}
                    className="px-3 py-1.5 bg-[var(--burnt-orange)] text-white rounded-lg text-xs font-medium flex items-center gap-1.5 hover:bg-[var(--burnt-orange)]/90 disabled:opacity-50"
                  >
                    {isBuildingDatabase ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Building...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3" />
                        Build Profiles
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Build progress */}
            {databaseBuildStatuses.size > 0 && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-700">Build Progress</span>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1 text-green-600">
                      <Check className="w-3 h-3" /> {dbSuccessCount}
                    </span>
                    <span className="flex items-center gap-1 text-red-600">
                      <X className="w-3 h-3" /> {dbErrorCount}
                    </span>
                  </div>
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {Array.from(databaseBuildStatuses.values()).map(status => (
                    <div key={status.name} className="flex items-center justify-between py-1 px-2 rounded bg-white text-xs">
                      <span className="text-gray-700 truncate">{status.name}</span>
                      <span className="flex items-center gap-1">
                        {status.status === 'pending' && <span className="text-gray-400">Waiting</span>}
                        {status.status === 'building' && <Loader2 className="w-3 h-3 animate-spin text-[var(--burnt-orange)]" />}
                        {status.status === 'success' && <Check className="w-3 h-3 text-green-600" />}
                        {status.status === 'error' && <X className="w-3 h-3 text-red-600" />}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Entity browser */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <span className="text-xs font-medium text-gray-700">Browse Categories</span>
                <div className="flex items-center gap-3 text-[10px] text-gray-500">
                  {loadingGlobalProfiles ? (
                    <span className="flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Loading...</span>
                  ) : (
                    <>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-200 border border-green-300"></span>
                        Built ({globalProfiles.size})
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-white border border-gray-200"></span>
                        Not built
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
                {groups.map(group => {
                  const isExpanded = expandedGroups.has(group)
                  const groupData = ENTITY_DATABASE[group]
                  const categories = Object.keys(groupData.categories)
                  const IconComponent = getIcon(groupData.icon)

                  return (
                    <div key={group}>
                      <button
                        onClick={() => toggleGroup(group)}
                        className="w-full px-3 py-2 flex items-center justify-between hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          {isExpanded ? <ChevronDown className="w-3 h-3 text-gray-400" /> : <ChevronRight className="w-3 h-3 text-gray-400" />}
                          <IconComponent className="w-3.5 h-3.5 text-[var(--burnt-orange)]" />
                          <span className="text-xs font-medium text-gray-900">{formatName(group)}</span>
                        </div>
                        <span className="text-[10px] text-gray-400">{categories.length} categories</span>
                      </button>

                      {isExpanded && (
                        <div className="bg-gray-50/50 pl-6 pr-3 py-2 space-y-3">
                          {categories.map(category => {
                            const entities = groupData.categories[category]
                            return (
                              <div key={category} className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-[11px] font-medium text-gray-600">{formatName(category)}</span>
                                  <button
                                    onClick={() => selectAllInCategory(entities)}
                                    className="text-[10px] text-[var(--burnt-orange)] hover:underline flex items-center gap-0.5"
                                  >
                                    <Plus className="w-2.5 h-2.5" />
                                    Add all
                                  </button>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {entities.map(entity => {
                                    const isSelected = selectedEntities.has(entity)
                                    const buildStatus = databaseBuildStatuses.get(entity)
                                    const hasExistingProfile = globalProfiles.has(entity.toLowerCase())
                                    return (
                                      <button
                                        key={entity}
                                        onClick={() => hasExistingProfile ? viewDatabaseProfile(entity) : toggleEntity(entity)}
                                        disabled={isBuildingDatabase && buildStatus?.status === 'building'}
                                        title={hasExistingProfile ? 'Click to view profile' : 'Click to select for building'}
                                        className={`px-2 py-0.5 text-[10px] rounded-full border transition-all ${
                                          buildStatus?.status === 'success'
                                            ? 'bg-green-100 border-green-300 text-green-700'
                                            : buildStatus?.status === 'error'
                                            ? 'bg-red-100 border-red-300 text-red-700'
                                            : buildStatus?.status === 'building'
                                            ? 'bg-[var(--burnt-orange)]/10 border-[var(--burnt-orange)]/30 text-[var(--burnt-orange)]'
                                            : isSelected
                                            ? 'bg-[var(--burnt-orange)] border-[var(--burnt-orange)] text-white'
                                            : hasExistingProfile
                                            ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                                            : 'bg-white border-gray-200 text-gray-600 hover:border-[var(--burnt-orange)] hover:text-[var(--burnt-orange)]'
                                        }`}
                                      >
                                        {buildStatus?.status === 'building' && <Loader2 className="w-2.5 h-2.5 inline animate-spin mr-0.5" />}
                                        {(buildStatus?.status === 'success' || hasExistingProfile) && <Eye className="w-2.5 h-2.5 inline mr-0.5" />}
                                        {entity}
                                      </button>
                                    )
                                  })}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Manual input — for entities not in intelligence_targets */}
      <div className="space-y-3 bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-1">
          <Zap className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-[var(--charcoal)]">Custom Entity</h3>
          <span className="text-[10px] text-gray-400">For entities not in your targets or database</span>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={entityName}
            onChange={e => setEntityName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && buildProfile()}
            placeholder="Entity name (e.g., OpenAI, FTC, Reuters)"
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--burnt-orange)] focus:border-transparent"
          />
          <select
            value={entityType}
            onChange={e => setEntityType(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--burnt-orange)]"
          >
            {ENTITY_TYPES.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Options */}
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={forceRefresh}
              onChange={e => setForceRefresh(e.target.checked)}
              className="rounded border-gray-300 accent-[var(--burnt-orange)]"
            />
            Force refresh
          </label>
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={skipFireplexity}
              onChange={e => setSkipFireplexity(e.target.checked)}
              className="rounded border-gray-300 accent-[var(--burnt-orange)]"
            />
            Skip web search
          </label>
          <label className="flex items-center gap-1">
            TTL:
            <input
              type="number"
              value={ttlHours}
              onChange={e => setTtlHours(Number(e.target.value))}
              min={1}
              max={168}
              className="w-14 px-1 py-0.5 border border-gray-200 rounded text-center"
            />
            h
          </label>
        </div>

        <button
          onClick={() => buildProfile()}
          disabled={loading || !entityName.trim()}
          className="w-full px-4 py-2 bg-[var(--burnt-orange)] hover:bg-[var(--terracotta)] disabled:bg-gray-300 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          {loading && !buildingId ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Building profile...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Build Profile
            </>
          )}
        </button>
      </div>

      {/* Error */}
      {result && !result.success && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-700">Profile build failed</p>
            <p className="text-xs text-red-600 mt-0.5">{result.error}</p>
          </div>
        </div>
      )}

      {/* Success — Metadata Bar */}
      {result?.success && result.metadata && (
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="bg-white rounded-lg border border-gray-200 p-2">
            <Database className="w-4 h-4 mx-auto text-gray-400 mb-1" />
            <p className={`text-sm font-semibold ${tierColor(result.metadata.data_tier)}`}>
              {result.metadata.data_tier}
            </p>
            <p className="text-[10px] text-gray-400">Data Tier</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-2">
            <Target className="w-4 h-4 mx-auto text-gray-400 mb-1" />
            <p className={`text-sm font-semibold ${confidenceColor(result.metadata.confidence)}`}>
              {(result.metadata.confidence * 100).toFixed(0)}%
            </p>
            <p className="text-[10px] text-gray-400">Confidence</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-2">
            <Clock className="w-4 h-4 mx-auto text-gray-400 mb-1" />
            <p className="text-sm font-semibold text-[var(--charcoal)]">
              {result.metadata.cached ? 'cached' : `${(result.metadata.build_time_ms / 1000).toFixed(1)}s`}
            </p>
            <p className="text-[10px] text-gray-400">{result.metadata.cached ? 'From cache' : 'Build time'}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-2">
            <Zap className="w-4 h-4 mx-auto text-gray-400 mb-1" />
            <p className="text-sm font-semibold text-[var(--charcoal)]">
              {result.metadata.model_used}
            </p>
            <p className="text-[10px] text-gray-400">v{result.metadata.version}</p>
          </div>
        </div>
      )}

      {/* Success — Profile */}
      {result?.success && result.profile && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <CheckCircle className="w-4 h-4 text-green-500" />
            Sources: {result.metadata?.data_sources.join(', ')}
            {result.metadata?.expires_at && (
              <span className="ml-auto">
                Expires: {new Date(result.metadata.expires_at).toLocaleString()}
              </span>
            )}
          </div>

          <Section id="identity" icon={User} title={`Identity — ${result.profile.identity?.name || 'Unknown'}`}>
            <p className="text-gray-400"><strong className="text-[var(--cream)]">Role:</strong> {result.profile.identity?.role}</p>
            {result.profile.identity?.relationships?.length > 0 && (
              <div className="mt-1">
                <strong className="text-[var(--cream)]">Relationships:</strong>
                <ul className="list-disc list-inside text-gray-400 mt-0.5">
                  {result.profile.identity.relationships.map((r: string, i: number) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            )}
          </Section>

          <Section id="voice" icon={Eye} title="Voice">
            <div className="space-y-1 text-gray-400">
              <p><strong className="text-[var(--cream)]">Tone:</strong> {result.profile.voice?.tone}</p>
              <p><strong className="text-[var(--cream)]">Style:</strong> {result.profile.voice?.style}</p>
              <p><strong className="text-[var(--cream)]">Avoids:</strong> {result.profile.voice?.avoids}</p>
              {result.profile.voice?.signature_phrases?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {result.profile.voice.signature_phrases.map((p: string, i: number) => (
                    <span key={i} className="px-1.5 py-0.5 bg-[var(--grey-800)] rounded text-xs text-[var(--burnt-orange-light)]">
                      &ldquo;{p}&rdquo;
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Section>

          <Section id="priorities" icon={Target} title="Priorities">
            <div className="space-y-2 text-gray-400">
              {result.profile.priorities?.stated?.length > 0 && (
                <div>
                  <strong className="text-[var(--cream)]">Stated:</strong>
                  <ul className="list-disc list-inside mt-0.5">
                    {result.profile.priorities.stated.map((s: string, i: number) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              )}
              {result.profile.priorities?.inferred?.length > 0 && (
                <div>
                  <strong className="text-[var(--cream)]">Inferred:</strong>
                  <ul className="list-disc list-inside mt-0.5">
                    {result.profile.priorities.inferred.map((s: string, i: number) => <li key={i} className="italic">{s}</li>)}
                  </ul>
                </div>
              )}
              {result.profile.priorities?.weights && (
                <div>
                  <strong className="text-[var(--cream)]">Weights:</strong>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {Object.entries(result.profile.priorities.weights).map(([k, v]: [string, any]) => (
                      <span key={k} className="text-xs">
                        {k}: <strong className="text-[var(--burnt-orange)]">{(v * 100).toFixed(0)}%</strong>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Section>

          <Section id="perspective" icon={Eye} title="Perspective">
            <div className="space-y-1 text-gray-400">
              <p><strong className="text-[var(--cream)]">Worldview:</strong> {result.profile.perspective?.worldview}</p>
              {result.profile.perspective?.biases?.length > 0 && (
                <div>
                  <strong className="text-[var(--cream)]">Biases:</strong>
                  <ul className="list-disc list-inside mt-0.5">
                    {result.profile.perspective.biases.map((b: string, i: number) => <li key={i}>{b}</li>)}
                  </ul>
                </div>
              )}
              {result.profile.perspective?.blind_spots?.length > 0 && (
                <div>
                  <strong className="text-[var(--cream)]">Blind spots:</strong>
                  <ul className="list-disc list-inside mt-0.5">
                    {result.profile.perspective.blind_spots.map((b: string, i: number) => <li key={i}>{b}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </Section>

          <Section id="patterns" icon={RefreshCw} title="Response Patterns">
            <div className="space-y-1 text-gray-400">
              <p><strong className="text-[var(--cream)]">Crisis:</strong> {result.profile.patterns?.crisis_response}</p>
              <p><strong className="text-[var(--cream)]">Competitive:</strong> {result.profile.patterns?.competitive_response}</p>
              <p><strong className="text-[var(--cream)]">Market shift:</strong> {result.profile.patterns?.market_shift_response}</p>
              <p><strong className="text-[var(--cream)]">Timing:</strong> {result.profile.patterns?.timing_tendencies}</p>
            </div>
          </Section>

          <Section id="vulnerabilities" icon={Shield} title="Vulnerabilities">
            <div className="space-y-2 text-gray-400">
              {result.profile.vulnerabilities?.known?.length > 0 && (
                <div>
                  <strong className="text-[var(--cream)]">Known:</strong>
                  <ul className="list-disc list-inside mt-0.5">
                    {result.profile.vulnerabilities.known.map((v: string, i: number) => <li key={i}>{v}</li>)}
                  </ul>
                </div>
              )}
              {result.profile.vulnerabilities?.sensitivities?.length > 0 && (
                <div>
                  <strong className="text-[var(--cream)]">Sensitivities:</strong>
                  <ul className="list-disc list-inside mt-0.5">
                    {result.profile.vulnerabilities.sensitivities.map((v: string, i: number) => <li key={i}>{v}</li>)}
                  </ul>
                </div>
              )}
              {result.profile.vulnerabilities?.past_mistakes?.length > 0 && (
                <div>
                  <strong className="text-[var(--cream)]">Past mistakes:</strong>
                  <ul className="list-disc list-inside mt-0.5">
                    {result.profile.vulnerabilities.past_mistakes.map((v: string, i: number) => <li key={i}>{v}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </Section>

          <Section id="context" icon={Clock} title="Current Context">
            <div className="space-y-2 text-gray-400">
              {result.profile.current_context?.recent_positions?.length > 0 && (
                <div>
                  <strong className="text-[var(--cream)]">Recent positions:</strong>
                  {result.profile.current_context.recent_positions.map((p: any, i: number) => (
                    <div key={i} className="ml-2 mt-1 text-xs border-l-2 border-[var(--burnt-orange)] pl-2">
                      <span className="text-[var(--cream)]">{p.topic}:</span> {p.stance}
                      {p.date && <span className="text-gray-500 ml-1">({p.date})</span>}
                    </div>
                  ))}
                </div>
              )}
              {result.profile.current_context?.active_pressures?.length > 0 && (
                <div>
                  <strong className="text-[var(--cream)]">Active pressures:</strong>
                  <ul className="list-disc list-inside mt-0.5">
                    {result.profile.current_context.active_pressures.map((p: string, i: number) => <li key={i}>{p}</li>)}
                  </ul>
                </div>
              )}
              {result.profile.current_context?.recent_events?.length > 0 && (
                <div>
                  <strong className="text-[var(--cream)]">Recent events:</strong>
                  <ul className="list-disc list-inside mt-0.5">
                    {result.profile.current_context.recent_events.map((e: string, i: number) => <li key={i}>{e}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </Section>

          {/* Raw JSON toggle */}
          <Section id="raw" icon={Database} title="Raw JSON">
            <pre className="text-xs text-gray-400 overflow-auto max-h-96 whitespace-pre-wrap">
              {JSON.stringify(result.profile, null, 2)}
            </pre>
          </Section>
        </div>
      )}

      {/* Profile Viewer Modal */}
      {(viewingProfile || loadingProfileView) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-[var(--burnt-orange)]" />
                <h3 className="font-semibold text-gray-900">
                  {loadingProfileView ? 'Loading...' : viewingProfile?.entity_name}
                </h3>
                {viewingProfile && (
                  <span className="px-2 py-0.5 text-[10px] rounded bg-gray-100 text-gray-600">
                    {viewingProfile.entity_type}
                  </span>
                )}
              </div>
              <button
                onClick={() => setViewingProfile(null)}
                className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal content */}
            <div className="flex-1 overflow-y-auto p-4">
              {loadingProfileView ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-[var(--burnt-orange)]" />
                </div>
              ) : viewingProfile?.profile ? (
                <div className="space-y-4">
                  {/* Identity */}
                  {viewingProfile.profile.identity && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <User className="w-4 h-4 text-[var(--burnt-orange)]" />
                        Identity
                      </h4>
                      <p className="text-sm text-gray-600"><strong>Role:</strong> {viewingProfile.profile.identity.role}</p>
                      {viewingProfile.profile.identity.relationships?.length > 0 && (
                        <div className="mt-2">
                          <strong className="text-sm text-gray-700">Relationships:</strong>
                          <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                            {viewingProfile.profile.identity.relationships.slice(0, 5).map((r: string, i: number) => (
                              <li key={i}>{r}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Voice */}
                  {viewingProfile.profile.voice && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <Eye className="w-4 h-4 text-[var(--burnt-orange)]" />
                        Voice
                      </h4>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p><strong>Tone:</strong> {viewingProfile.profile.voice.tone}</p>
                        <p><strong>Style:</strong> {viewingProfile.profile.voice.style}</p>
                        {viewingProfile.profile.voice.signature_phrases?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {viewingProfile.profile.voice.signature_phrases.slice(0, 4).map((p: string, i: number) => (
                              <span key={i} className="px-2 py-0.5 bg-white rounded text-xs text-gray-700 border">
                                "{p}"
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Priorities */}
                  {viewingProfile.profile.priorities && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <Target className="w-4 h-4 text-[var(--burnt-orange)]" />
                        Priorities
                      </h4>
                      <div className="space-y-2 text-sm text-gray-600">
                        {viewingProfile.profile.priorities.stated?.length > 0 && (
                          <div>
                            <strong>Stated:</strong>
                            <ul className="list-disc list-inside mt-1">
                              {viewingProfile.profile.priorities.stated.slice(0, 4).map((s: string, i: number) => (
                                <li key={i}>{s}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {viewingProfile.profile.priorities.inferred?.length > 0 && (
                          <div>
                            <strong>Inferred:</strong>
                            <ul className="list-disc list-inside mt-1 italic">
                              {viewingProfile.profile.priorities.inferred.slice(0, 3).map((s: string, i: number) => (
                                <li key={i}>{s}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Vulnerabilities */}
                  {viewingProfile.profile.vulnerabilities && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-[var(--burnt-orange)]" />
                        Vulnerabilities
                      </h4>
                      <div className="space-y-2 text-sm text-gray-600">
                        {viewingProfile.profile.vulnerabilities.known?.length > 0 && (
                          <div>
                            <strong>Known:</strong>
                            <ul className="list-disc list-inside mt-1">
                              {viewingProfile.profile.vulnerabilities.known.slice(0, 3).map((v: string, i: number) => (
                                <li key={i}>{v}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {viewingProfile.profile.vulnerabilities.sensitivities?.length > 0 && (
                          <div>
                            <strong>Sensitivities:</strong>
                            <ul className="list-disc list-inside mt-1">
                              {viewingProfile.profile.vulnerabilities.sensitivities.slice(0, 3).map((v: string, i: number) => (
                                <li key={i}>{v}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Response Patterns */}
                  {viewingProfile.profile.patterns && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 text-[var(--burnt-orange)]" />
                        Response Patterns
                      </h4>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p><strong>Crisis:</strong> {viewingProfile.profile.patterns.crisis_response}</p>
                        <p><strong>Competitive:</strong> {viewingProfile.profile.patterns.competitive_response}</p>
                        <p><strong>Timing:</strong> {viewingProfile.profile.patterns.timing_tendencies}</p>
                      </div>
                    </div>
                  )}

                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  No profile data available
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
