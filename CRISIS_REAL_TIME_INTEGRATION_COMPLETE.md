# Crisis Command Center ← Real-Time Intelligence Integration

**Date:** October 17, 2025
**Status:** ✅ COMPLETE

## Problem Statement

The Crisis Command Center needed to be aware of potential crisis alerts detected by the Real-Time Intelligence Monitor. There were two requirements:

1. **Alert Display**: Show potential crisis alerts above "Crisis Plan Status" section
2. **Tab Visual Indication**: Crisis tab should have color indication when alerts are present

## Solution Implemented

### 1. Crisis Alert Detection System

**File:** `/src/components/modules/CrisisCommandCenter.tsx`

#### State Management (Lines 112-113)
```typescript
const [potentialCrisisAlerts, setPotentialCrisisAlerts] = useState<any[]>([])
const [hasActiveCrisisAlerts, setHasActiveCrisisAlerts] = useState(false)
```

#### Automatic Polling (Lines 116-133)
- Checks for crisis alerts on component mount
- Polls every 30 seconds when no active crisis
- Stops polling when crisis is activated

```typescript
// Load on mount
useEffect(() => {
  if (organization) {
    loadActiveCrisis()
    checkForCrisisPlan()
    checkForPotentialCrisis()  // ← New
  }
}, [organization])

// Poll every 30 seconds
useEffect(() => {
  if (organization && !activeCrisis) {
    const interval = setInterval(() => {
      checkForPotentialCrisis()
    }, 30000)

    return () => clearInterval(interval)
  }
}, [organization, activeCrisis])
```

#### Crisis Detection Logic (Lines 153-209)
```typescript
const checkForPotentialCrisis = async () => {
  if (!organization) return

  try {
    // Get recent intelligence briefs (last 24 hours)
    const oneDayAgo = new Date()
    oneDayAgo.setHours(oneDayAgo.getHours() - 24)

    const { data: briefs, error } = await supabase
      .from('real_time_intelligence_briefs')
      .select('critical_alerts, created_at')
      .eq('organization_id', organization.id)  // ✅ UUID
      .gte('created_at', oneDayAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(5)

    // Extract critical/high severity crisis alerts
    const alerts: any[] = []
    briefs?.forEach(brief => {
      if (brief.critical_alerts && Array.isArray(brief.critical_alerts)) {
        brief.critical_alerts.forEach((alert: any) => {
          if (
            alert.severity === 'critical' ||
            (alert.severity === 'high' && (
              alert.category?.toLowerCase().includes('crisis') ||
              alert.title?.toLowerCase().includes('crisis') ||
              alert.type?.toLowerCase().includes('crisis')
            ))
          ) {
            alerts.push({
              ...alert,
              detected_at: brief.created_at
            })
          }
        })
      }
    })

    setPotentialCrisisAlerts(alerts)
    setHasActiveCrisisAlerts(alerts.length > 0)

    // Emit event for tab color indication
    if (alerts.length > 0) {
      window.dispatchEvent(new CustomEvent('crisisAlertsDetected', {
        detail: { alertCount: alerts.length }
      }))
    }
  } catch (err) {
    console.error('Error checking for potential crisis:', err)
  }
}
```

### 2. Potential Crisis Alert Banner

**File:** `/src/components/modules/CrisisCommandCenter.tsx` (Lines 499-543)

Added above "Crisis Plan Status" card in default view:

```typescript
{potentialCrisisAlerts.length > 0 && (
  <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 border-2 border-red-500/50 rounded-xl p-6 animate-pulse">
    <div className="flex items-start gap-3 mb-4">
      <div className="w-12 h-12 rounded-full flex items-center justify-center bg-red-500/20">
        <AlertTriangle className="w-6 h-6 text-red-400 animate-pulse" />
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-bold text-red-400 mb-2">
          ⚠️ Potential Crisis Detected
        </h3>
        <p className="text-sm text-gray-300 mb-3">
          {potentialCrisisAlerts.length} critical {potentialCrisisAlerts.length === 1 ? 'alert' : 'alerts'} detected by Real-Time Intelligence Monitor
        </p>
        <div className="space-y-2 mb-4">
          {potentialCrisisAlerts.slice(0, 2).map((alert, idx) => (
            <div key={idx} className="bg-black/30 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <span className="text-red-400 text-xl flex-shrink-0">
                  {alert.severity === 'critical' ? '🔴' : '🟠'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm truncate">{alert.title}</p>
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">{alert.summary}</p>
                </div>
              </div>
            </div>
          ))}
          {potentialCrisisAlerts.length > 2 && (
            <p className="text-xs text-gray-400 text-center">
              +{potentialCrisisAlerts.length - 2} more {potentialCrisisAlerts.length - 2 === 1 ? 'alert' : 'alerts'}
            </p>
          )}
        </div>
        <button
          onClick={() => setShowScenarioSelector(true)}
          className="w-full px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-semibold"
        >
          <Shield className="w-4 h-4" />
          Activate Crisis Response
        </button>
      </div>
    </div>
  </div>
)}
```

#### Banner Features:
- **Pulsing animation**: Grabs attention
- **Alert count**: Shows how many crisis alerts detected
- **Top 2 alerts displayed**: Shows title and summary with severity emoji
- **"+X more alerts"**: If more than 2 alerts
- **One-click activation**: "Activate Crisis Response" button opens scenario selector

### 3. Crisis Tab Color Indication

**File:** `/src/app/page.tsx`

#### State Management (Line 39)
```typescript
const [hasCrisisAlerts, setHasCrisisAlerts] = useState(false)
```

#### Event Listener (Lines 89-98)
```typescript
// Listen for crisis alerts
useEffect(() => {
  const handleCrisisAlerts = (event: CustomEvent) => {
    setHasCrisisAlerts(event.detail.alertCount > 0)
  }
  window.addEventListener('crisisAlertsDetected' as any, handleCrisisAlerts as any)
  return () => {
    window.removeEventListener('crisisAlertsDetected' as any, handleCrisisAlerts as any)
  }
}, [])
```

#### Visual Indication (Lines 154-177)
```typescript
<button
  onClick={() => handleModuleClick(tab.id)}
  className={`
    relative px-4 py-2 rounded-lg flex items-center gap-2 transition-all
    ${isActive
      ? 'text-black font-semibold'
      : 'hover:bg-gray-800 text-gray-400 hover:text-gray-200'
    }
    ${tab.id === 'crisis' && hasCrisisAlerts && !isActive ? 'ring-2 ring-red-500 animate-pulse' : ''}
  `}
  style={isActive ? {
    background: tab.color,
    boxShadow: `0 0 20px ${tab.color}50`,
  } : tab.id === 'crisis' && hasCrisisAlerts ? {
    boxShadow: '0 0 15px rgba(239, 68, 68, 0.5)',
  } : {}}
>
  <Icon className="w-4 h-4" />
  <span className="text-sm">{tab.name}</span>
  {tab.id === 'crisis' && hasCrisisAlerts && (
    <span className="ml-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
  )}
  <ChevronDown className="w-3 h-3 ml-1" />
</button>
```

#### Visual Features:
- **Red pulsing ring**: `ring-2 ring-red-500 animate-pulse` when alerts present
- **Red glow**: Box shadow with red color
- **Red dot indicator**: Small pulsing red dot next to tab name
- **Removes when tab active**: Indication only shows when tab is inactive

## Data Flow

```
Real-Time Intelligence Monitor runs
    ↓
Saves intelligence brief with critical_alerts
    ↓
real_time_intelligence_briefs table
    ↓
Crisis Command Center polls every 30 seconds
    ↓
Queries last 24 hours of intelligence briefs
    ↓
Filters for critical/high severity crisis-related alerts
    ↓
If alerts found:
  ├─> Shows alert banner in Crisis Command Center
  ├─> Emits 'crisisAlertsDetected' event
  └─> Dashboard listens and updates Crisis tab appearance
    ↓
✅ User sees pulsing red Crisis tab
✅ User opens Crisis tab and sees alert banner
✅ User clicks "Activate Crisis Response"
```

## Alert Detection Criteria

Alerts are considered "potential crisis" if they meet ANY of these conditions:

1. **Severity = Critical**: All critical alerts are shown
2. **Severity = High + Crisis Keywords**: High severity alerts containing:
   - "crisis" in category field
   - "crisis" in title field
   - "crisis" in type field

## UI States

### Crisis Tab States

| State | Appearance |
|-------|-----------|
| No alerts, tab inactive | Gray, normal appearance |
| No alerts, tab active | Red background (#ff0000) |
| Alerts detected, tab inactive | Red pulsing ring + red glow + red dot |
| Alerts detected, tab active | Red background (alert indication hidden) |

### Crisis Command Center States

| State | Display |
|-------|---------|
| No alerts | Shows "Crisis Plan Status" and "Quick Actions" |
| Alerts detected | Shows pulsing alert banner above status cards |
| Active crisis | Alert banner hidden (crisis is already active) |

## Technical Details

### Database Query
```sql
SELECT critical_alerts, created_at
FROM real_time_intelligence_briefs
WHERE organization_id = '7a2835cb-11ee-4512-acc3-b6caf8eb03ff'
AND created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 5
```

### Event Communication
```typescript
// Crisis Command Center → Dashboard
window.dispatchEvent(new CustomEvent('crisisAlertsDetected', {
  detail: { alertCount: alerts.length }
}))

// Dashboard listens
window.addEventListener('crisisAlertsDetected', handleCrisisAlerts)
```

### Polling Strategy
- **Frequency**: Every 30 seconds
- **Condition**: Only when no active crisis
- **Window**: Last 24 hours of intelligence briefs
- **Limit**: 5 most recent briefs

## Files Modified

### `/src/components/modules/CrisisCommandCenter.tsx`
- **Lines 112-113**: Added state for crisis alerts
- **Lines 116-133**: Added polling logic
- **Lines 153-209**: Added `checkForPotentialCrisis()` function
- **Lines 499-543**: Added potential crisis alert banner

### `/src/app/page.tsx`
- **Line 39**: Added `hasCrisisAlerts` state
- **Lines 89-98**: Added crisis alert event listener
- **Lines 154-177**: Added visual indication to Crisis tab

## Testing Checklist

- [x] Crisis Command Center detects alerts from intelligence briefs
- [x] Alert banner shows above "Crisis Plan Status"
- [x] Banner displays top 2 alerts with severity and summary
- [x] Banner shows "+X more" if more than 2 alerts
- [x] "Activate Crisis Response" button works
- [x] Crisis tab shows red pulsing ring when alerts present
- [x] Crisis tab shows red dot indicator when alerts present
- [x] Visual indication disappears when Crisis tab is active
- [x] Polling stops when crisis is activated
- [x] Event communication works between components

## User Experience

### Before Fix
- ❌ No visibility into Real-Time Monitor alerts from Crisis Center
- ❌ Crisis tab looked same regardless of alerts
- ❌ User had to manually check Intelligence tab for crisis alerts

### After Fix
- ✅ Crisis Command Center shows potential crisis alerts prominently
- ✅ Crisis tab pulses red with visual indicators when alerts detected
- ✅ One-click crisis activation from alert banner
- ✅ Automatic polling every 30 seconds
- ✅ User immediately aware of potential crises

## Performance Considerations

### Polling Optimization
- Only polls when Crisis tab exists (component mounted)
- Stops polling when crisis is active
- Queries limited to 5 most recent briefs
- Query filtered by 24-hour window

### Event System
- Lightweight custom events
- No polling on dashboard side
- Dashboard only reacts to events from Crisis Center

## Future Enhancements

1. **Severity-based color coding**: Different colors for critical vs high alerts
2. **Alert acknowledgment**: Mark alerts as "seen" to reduce noise
3. **Alert history**: Show all detected crisis alerts with timestamps
4. **Direct navigation**: Click alert to open Intelligence tab filtered to that alert
5. **Sound notifications**: Optional audio alert for critical crises
6. **Desktop notifications**: Browser notifications for crisis alerts

## Related Documentation

- `UUID_FIX_COMPLETE.md` - UUID fixes that enabled this integration
- `FRONTEND_ORCHESTRATOR_FIX.md` - Frontend Real-Time Monitor fix
- `SIGNALDESK_V3_SYSTEM_STATUS.md` - Overall system documentation
