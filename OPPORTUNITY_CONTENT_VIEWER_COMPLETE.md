# Opportunity Engine Content Viewer - Implementation Complete

## Summary
Implemented content viewing and enhanced content storage for the Opportunity Engine V2, allowing users to view and interact with generated content pieces.

## Features Implemented

### 1. Content Viewer Modal
- Full-screen modal overlay with dark theme
- Displays complete content with rich metadata
- Shows:
  - Content title
  - Content type (badge)
  - Stakeholder information
  - Channel (owned/media)
  - Purpose/topic
  - Generation timestamp
  - Full content body with formatted text

### 2. Enhanced Content Display
The Generated Content section now shows:
- **Title**: Full descriptive title (e.g., "Opportunity Title - blog_post - Stakeholder Name")
- **Type Badge**: Content type with color coding
- **Stakeholder**: Target stakeholder for the content
- **Channel Badge**: Owned or Media channel
- **Purpose**: Brief description of content purpose
- **View Button**: Opens the content viewer modal

### 3. Rich Content Storage
Content is automatically saved to `content_library` table by `niv-content-intelligent-v2` with:
- `organization_id`
- `content_type` (normalized)
- `title` (descriptive with phase, type, and stakeholder)
- `content` (full generated content)
- `folder` (organized by opportunity: `opportunity-{id}`)
- `metadata`:
  - `blueprint_id` (opportunity ID)
  - `campaign_folder`
  - `phase` and `phase_number`
  - `stakeholder`
  - `channel` (owned/media)
  - `purpose` or `story`
  - `generated_at` (timestamp)
  - `campaign_type` ('OPPORTUNITY_EXECUTION')
- `tags` (for filtering and search)
- `status` ('saved')

### 4. Content Fetching
- Automatically fetches content when viewing an executed opportunity
- Queries `content_library` by `blueprint_id` (opportunity ID)
- Excludes strategy documents to show only actual content pieces
- Orders by creation date (newest first)

### 5. User Interactions
- **View Button**: Opens modal with full content
- **Copy to Clipboard**: One-click copy of content text
- **Close Modal**: Click outside, X button, or Close button
- **Rich Metadata**: See all context about each piece

## Files Modified

### `/src/components/modules/OpportunitiesModule.tsx`
**Changes:**
1. Added `viewingContent` state for modal control
2. Added `useEffect` to fetch content when selecting executed opportunities
3. Created `fetchGeneratedContent()` function to query content_library
4. Updated opportunities query to include 'executed' status
5. Enhanced Generated Content display section with rich metadata
6. Added full Content Viewer Modal component with:
   - Modal header with title and metadata
   - Scrollable content area
   - Footer with timestamp and action buttons
   - Copy to clipboard functionality

**Key Code Sections:**
- Lines 86-99: State and effects for content viewing
- Lines 122-143: `fetchGeneratedContent()` function
- Lines 259-268: Content fetch after generation
- Lines 640-679: Enhanced content display
- Lines 728-812: Content viewer modal

## Content Structure

### From `niv-content-intelligent-v2`
Generated content includes:
```typescript
{
  type: string,           // Content type
  stakeholder: string,    // Target stakeholder
  content: string,        // Full generated content
  channel: string,        // 'owned' or 'media'
  purpose: string,        // Content purpose
  story?: string          // For media pieces
}
```

### Stored in `content_library`
```typescript
{
  id: uuid,
  organization_id: uuid,
  content_type: string,
  title: string,
  content: string,
  folder: string,
  metadata: {
    blueprint_id: string,      // Opportunity ID
    stakeholder: string,
    channel: string,
    purpose: string,
    generated_at: string,
    campaign_type: string
  },
  tags: string[],
  status: string,
  created_at: timestamp
}
```

## User Experience Flow

1. User executes an opportunity from Opportunity Engine
2. `niv-content-intelligent-v2` generates content based on execution plan
3. Content is automatically saved to `content_library` with rich metadata
4. OpportunitiesModule fetches the content using `blueprint_id`
5. Generated Content section displays all pieces with metadata
6. User clicks "View" button on any piece
7. Modal opens showing:
   - Full content with formatting
   - All metadata (type, stakeholder, channel, purpose)
   - Generation timestamp
   - Copy to clipboard button
8. User can copy content or close modal

## Benefits

1. **Rich Context**: Users see stakeholder, channel, purpose - not just type
2. **Full Content**: Modal displays complete generated text
3. **Easy Access**: One-click viewing from opportunity details
4. **Organized Storage**: Content organized by opportunity in folders
5. **Reusability**: Content saved to library for future reference
6. **Copy Functionality**: Quick clipboard copy for sharing
7. **Metadata Tracking**: Full audit trail of what was generated and when

## Testing

To test:
1. Add Opportunities module to canvas
2. Execute a V2 opportunity with execution plan
3. Wait for generation to complete
4. View the executed opportunity
5. See Generated Content section with all pieces
6. Click "View" on any piece
7. Verify modal shows full content and metadata
8. Test "Copy Content" button
9. Close modal and verify functionality

## Next Steps (Optional Enhancements)

1. Add download functionality (export as PDF/DOCX)
2. Add edit capability for generated content
3. Add sharing/publishing features
4. Add content versioning
5. Add search/filter within generated content
6. Add AI-powered content refinement
7. Add content performance tracking
