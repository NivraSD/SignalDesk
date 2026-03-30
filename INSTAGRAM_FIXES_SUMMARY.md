# Instagram Post Generation Fixes

## Issues Fixed

### 1. **Multi-Content Support**
**Problem:** When requesting an Instagram post, the system tried to combine text and image into a single message, which wasn't working properly.

**Solution:** Implemented a multi-content approach that creates **2 separate messages**:
1. Instagram Caption (text message)
2. Instagram Image (image message with prompt)

This mirrors the media plan multi-content capability and provides a better user experience.

### 2. **Image Generation False Negatives**
**Problem:** Vertex AI edge function successfully generated images (`success: true, hasFallback: false`), but the system reported image generation as failed.

**Solution:**
- Added comprehensive logging to track image generation response
- Improved imageUrl extraction to handle all response formats from vertex-ai-visual:
  - Direct `imageUrl` field (added for compatibility)
  - Images array: `images[0].url`, `images[0].uri`, `images[0].gcsUri`
  - Top-level `url` field
- Added validation to verify both `success` flag AND imageUrl presence
- Clear error messages when image generation truly fails

## Files Modified

### Backend (`supabase/functions/niv-content-intelligent-v2/index.ts`)

**Location:** Lines 2829-2939

**Changes:**
1. Refactored `generate_instagram_post_with_image` tool handler
2. Now returns `mode: 'multi_content_instagram'` instead of `instagram_post_complete`
3. Response includes `contentItems` array with separate caption and image items:
   ```json
   {
     "mode": "multi_content_instagram",
     "contentItems": [
       {
         "type": "instagram-caption",
         "content": "Caption text...",
         "message": "📝 Instagram Caption"
       },
       {
         "type": "instagram-image",
         "imageUrl": "data:image/png;base64,...",
         "imagePrompt": "Professional...",
         "message": "🖼️ Instagram Image"
       }
     ]
   }
   ```
4. Added comprehensive logging for debugging:
   - Full image generation response (JSON)
   - Image URL extraction steps
   - Success/failure validation

### Frontend (`src/components/execute/NIVContentOrchestratorProduction.tsx`)

**Location:** Lines 1140-1193

**Changes:**
1. Added handler for `multi_content_instagram` mode
2. Creates separate message objects for each content item:
   - Caption message with `type: 'instagram-caption'`
   - Image message with `type: 'instagram-image'` and metadata
   - Error message if image generation fails
3. Each message has unique ID using timestamp + index
4. Maintains existing `instagram_post_complete` handler for backward compatibility

## How It Works

### Flow:
1. User requests Instagram post
2. NIV uses `generate_instagram_post_with_image` tool
3. Backend:
   - Generates caption via MCP content service
   - Generates image via Vertex AI Visual
   - Logs full response for debugging
   - Extracts imageUrl using multiple fallback patterns
   - Validates success AND imageUrl presence
   - Returns multi-content response with separate items
4. Frontend:
   - Receives `multi_content_instagram` mode
   - Creates 2 separate message bubbles:
     - **Message 1:** Instagram Caption with formatted text
     - **Message 2:** Instagram Image with markdown image and prompt

### Benefits:
- **Clearer UX:** Caption and image are visually separated
- **Better debugging:** Comprehensive logging tracks every step
- **Resilient:** Multiple extraction patterns handle API variations
- **Accurate status:** No more false negatives on successful generation
- **Consistent:** Matches media plan multi-content pattern

## Testing

To test the fixes:

1. Go to Execute module
2. Request an Instagram post (e.g., "create an Instagram post about Homeaglow celebrating 3 million cleans")
3. Verify:
   - ✅ Caption appears in first message
   - ✅ Image appears in second message (if generation succeeds)
   - ✅ Clear error message if image fails (with suggestion to try separately)
   - ✅ Edge function logs show full response and extraction steps

## Debugging

Check Vertex AI Edge Function logs:
```
✅ image generation result: { success: true, hasFallback: false }
📸 Image generation response: { ... full JSON ... }
✅ Found imageUrl in imageData.imageUrl: data:image/png;base64,...
📸 Final imageUrl: data:image/png;base64,...
📸 Image generation success: true
```

If you see the logs above but still get "image failed", the issue is in the URL extraction logic (now fixed).

## Related Files

- `/supabase/functions/vertex-ai-visual/index.ts` - Image generation service (returns format documented above)
- `/supabase/functions/mcp-content/index.ts` - Caption generation service
- `/src/components/execute/NIVContentOrchestratorProduction.tsx` - Execute UI component
- `/supabase/functions/niv-content-intelligent-v2/system-prompt.ts` - Tool descriptions and usage guidelines

## Next Steps

For testing, try:
1. ✅ Basic Instagram post request
2. ✅ Instagram post with specific topic
3. ✅ Request just image after caption is generated
4. ✅ Verify logs show successful extraction
5. ✅ Verify separate messages appear in UI
