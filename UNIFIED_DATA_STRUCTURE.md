# Unified Data Structure for Niv Passthrough

## Problem Solved

Previously, `generatedContent` was being lost during handoffs between:
1. NivStrategicOrchestrator → NivFirstLayout 
2. NivFirstLayout → WorkspaceContainer
3. WorkspaceContainer → Workspace Components

## Solution: One Simple Structure

### 1. NivStrategicOrchestrator Output (FIXED)
```javascript
// OLD (Double-nested):
onWorkCardCreate({
  type: item.type,
  data: {
    title: item.title,
    description: item.description,
    generatedContent: item.generatedContent
  }
});

// NEW (Flat structure):
onWorkCardCreate({
  type: item.type,
  title: item.title,
  description: item.description,
  generatedContent: item.generatedContent,
  details: getDetailsFromType(item.type)
});
```

### 2. NivFirstLayout Storage (FIXED)
```javascript
// OLD (Nested in data property):
const newItem = {
  type: workCard.type,
  title: workCard.data?.title,
  data: {
    generatedContent: workCard.data?.generatedContent
  }
};

// NEW (Everything at root level):
const newItem = {
  type: workCard.type,
  title: workCard.title,
  description: workCard.description,
  generatedContent: workCard.generatedContent,
  details: workCard.details
};
```

### 3. WorkspaceContainer Context (FIXED)
```javascript
// OLD (Extracting from nested data):
const workspaceContext = {
  generatedContent: item.data?.generatedContent
};

// NEW (Direct access):
const workspaceContext = {
  title: item.title,
  description: item.description,
  generatedContent: item.generatedContent,
  details: item.details
};
```

### 4. Workspace Components (FIXED)
```javascript
// All workspace components now use:
const rawContent = context?.generatedContent || context;
const standardized = standardizeContentType(rawContent);
```

## Key Benefits

1. **No Data Loss**: `generatedContent` is preserved at every step
2. **Simple Structure**: Everything is at the root level, no nested extraction
3. **Consistent Access**: All components use the same pattern
4. **Backward Compatible**: Falls back gracefully if structure changes

## Data Flow

```
Niv Response
    ↓ (flat structure)
NivStrategicOrchestrator.onWorkCardCreate()
    ↓ (flat structure) 
NivFirstLayout.handleWorkCardCreate()
    ↓ (flat structure)
WorkspaceContainer.context
    ↓ (generatedContent preserved)
Workspace Components (SimplifiedContentDraft, etc.)
```

## Testing

After these changes:
1. Ask Niv to create any material
2. Check the sidebar shows the item
3. Click to open in workspace
4. Verify the generated content appears correctly
5. Check console logs show `generatedContent` is preserved at each step

## Files Modified

- `/frontend/src/components/NivStrategicOrchestrator.js` (lines 378-388)
- `/frontend/src/components/NivFirst/NivFirstLayout.js` (lines 12-39, 74-95)
- `/frontend/src/components/NivFirst/SimplifiedContentDraft.js` (lines 9-22)
- `/frontend/src/components/NivFirst/SimplifiedMediaList.js` (lines 9-16)
- `/frontend/src/components/NivFirst/SimplifiedStrategicPlanning.js` (lines 9-16)