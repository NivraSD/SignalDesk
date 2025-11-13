# Media List Save Button Fix

## Problem
When NIV generated media lists in the Execute module, there was no save button visible. Users couldn't tell if the media list had been saved or had any way to save it.

## Root Cause
NIV automatically saves media lists to the content library (Memory Vault) when generating them. However, the Execute module's ContentWorkspace component wasn't aware that the content had already been saved, so it was showing neither:
- A "Saved" badge (to indicate it's already in the library)
- A "Save to Library" button (to let users save it)

The ContentWorkspace shows a save button only when `content.saved === false`, but NIV-generated content items were being created with `saved: false` by default, even when NIV had already saved them.

## Solution
Updated `ExecuteTabProduction.tsx` to check if NIV included `saved_to` in the content metadata (which indicates NIV auto-saved the content). When `saved_to` is present:
- Set `content.saved = true`
- Log a message confirming auto-save
- ContentWorkspace will then display the "Saved" badge and hide the redundant save button

### Code Change
In `handleContentGenerated()` function (line 157-174):

```typescript
// Check if NIV auto-saved this content (indicated by saved_to in metadata)
const autoSaved = content.metadata?.saved_to !== undefined

// Ensure content has required fields
const completeContent = {
  ...content,
  id: content.id || `content-${Date.now()}`,
  saved: content.saved !== undefined ? content.saved : autoSaved,  // ← Use autoSaved as default
  timestamp: content.timestamp || Date.now()
}

if (autoSaved) {
  console.log('✅ Content was auto-saved by NIV to:', content.metadata?.saved_to)
}
```

## How It Works

### Before:
1. User asks NIV to generate media list
2. NIV generates list and auto-saves to Memory Vault
3. NIV returns response with `metadata.saved_to = "Media Lists/"`
4. Execute module creates ContentItem with `saved: false` (default)
5. ContentWorkspace shows neither saved badge nor save button
6. User is confused about where the media list went

### After:
1. User asks NIV to generate media list
2. NIV generates list and auto-saves to Memory Vault
3. NIV returns response with `metadata.saved_to = "Media Lists/"`
4. Execute module detects `saved_to` and sets `saved: true`
5. ContentWorkspace shows green "Saved" badge
6. User knows the media list is already in the content library

## Impact
This fix applies to any content type that NIV auto-saves:
- ✅ Media lists
- ✅ Press releases (if auto-saved)
- ✅ Social posts (if auto-saved)
- ✅ Any other content with `metadata.saved_to`

## Testing
1. Open Execute module
2. Ask NIV to generate a media list (e.g., "Create a media list for PR technology journalists")
3. Wait for NIV to generate the list
4. Check ContentWorkspace header - should see green "Saved" badge
5. Check action bar - should NOT see "Save to Library" button (since it's already saved)
6. Verify the media list appears in Memory Vault under "Media Lists/" folder

## Files Changed
- `/src/components/execute/ExecuteTabProduction.tsx` - Added auto-save detection logic
