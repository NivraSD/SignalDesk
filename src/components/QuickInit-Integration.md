# QuickInit Component - Integration Guide

## Overview
QuickInit is a simple, reliable component that captures company names and properly passes them through the discovery pipeline.

## How It Works

### 1. User Input
- User enters company name in the input field
- Component validates the input (non-empty, trimmed)

### 2. Data Storage
The component saves data in THREE places for redundancy:

```javascript
// 1. localStorage - for frontend persistence
localStorage.setItem('selectedOrganization', companyName);
localStorage.setItem('organizationData', JSON.stringify(organizationData));

// 2. Edge Function Database (via intelligence-discovery-v3)
// This creates a request_id and stores the initial data

// 3. Claude Analysis (via organization-discovery)
// This enriches the data with AI-driven insights
```

### 3. Pipeline Flow
```
User Input → QuickInit Component
    ↓
Save to localStorage
    ↓
Call intelligence-discovery-v3 (generates request_id)
    ↓
Call organization-discovery (Claude analysis)
    ↓
Merge & Save Complete Data
    ↓
Trigger onComplete callback
```

## Integration Points

### Using QuickInit in Your Component

```javascript
import QuickInit from './components/QuickInit';

function YourComponent() {
  const handleInitComplete = (data) => {
    console.log('Company initialized:', data.organization.name);
    console.log('Request ID:', data.request_id);
    // Navigate or start your process
  };

  return <QuickInit onComplete={handleInitComplete} />;
}
```

### Accessing Saved Data

```javascript
// Get the company name
const companyName = localStorage.getItem('selectedOrganization');

// Get full organization data
const orgData = JSON.parse(localStorage.getItem('organizationData'));

// Get latest discovery results
const discovery = JSON.parse(localStorage.getItem('latestDiscovery'));
```

## Testing

### 1. React Component Test
Navigate to: `http://localhost:3000/test-quickinit`

### 2. Standalone HTML Test
Open: `http://localhost:3000/test-quickinit.html`

### 3. Direct Component Usage
Navigate to: `http://localhost:3000/quickinit`

## Troubleshooting

### Issue: Company name shows as "Default Organization"
**Solution:** Check that:
1. localStorage has 'selectedOrganization' key
2. The value is being read BEFORE calling edge functions
3. The organization object has a 'name' property

### Issue: Discovery pipeline fails
**Solution:** Verify:
1. Supabase URL and API key are correct
2. Edge functions are deployed and accessible
3. Network requests aren't being blocked

### Issue: Data not persisting
**Solution:** Ensure:
1. localStorage isn't being cleared
2. Component waits for async operations to complete
3. Error handling doesn't overwrite good data

## API Endpoints Used

1. **intelligence-discovery-v3**
   - URL: `${SUPABASE_URL}/functions/v1/intelligence-discovery-v3`
   - Purpose: Generate request_id and initial discovery
   - Input: `{ organization: { name: "Company Name" } }`

2. **organization-discovery**
   - URL: `${SUPABASE_URL}/functions/v1/organization-discovery`
   - Purpose: Claude AI analysis of company
   - Input: `{ organization_name: "Company Name", request_id: "xxx" }`

## Key Features

✅ **Simple & Clean** - Single input field, minimal UI
✅ **Reliable** - Multiple data storage points
✅ **Testable** - Built-in test button for localStorage verification
✅ **Error Handling** - Graceful fallbacks on API failures
✅ **Visual Feedback** - Status messages and results preview

## Code Location
- Component: `/src/components/QuickInit.js`
- Styles: `/src/components/QuickInit.css`
- Test Page: `/src/TestQuickInit.js`
- HTML Test: `/public/test-quickinit.html`