# Gamma Presentation Export Fix Plan

## Current Problem

When Gamma presentations are generated, we:
1. ✅ Get back a `gammaUrl` (web link to view the presentation)
2. ❌ Do NOT request PPTX/PDF exports
3. ❌ Do NOT download or store the actual presentation content
4. ❌ Do NOT save to Memory Vault for NIV access

The code comment at line 235-237 says "exportPdfPptx is not supported in Gamma API v0.2" but this is incorrect - the API does support exports via the `exportAs` parameter.

## Root Cause

In `supabase/functions/gamma-presentation/index.ts`:

```typescript
const requestBody: any = {
  inputText: inputText,
  textMode: request.content ? 'preserve' : 'generate',
  format: request.format || 'presentation',
  numCards: request.options?.numCards || request.slideCount || (request.framework ? 12 : 10),
  cardSplit: request.options?.cardSplit || 'auto'
  // NOTE: exportPdfPptx is not supported in Gamma API v0.2  <-- WRONG!
  // We'll capture metadata only for now
}
```

The `exportAs` parameter is NOT being sent, so Gamma doesn't provide download URLs.

## Solution

### Phase 1: Request Exports (IMMEDIATE FIX)

Update the Gamma API request to include:

```typescript
const requestBody: any = {
  inputText: inputText,
  textMode: request.content ? 'preserve' : 'generate',
  format: request.format || 'presentation',
  numCards: request.options?.numCards || request.slideCount || (request.framework ? 12 : 10),
  cardSplit: request.options?.cardSplit || 'auto',

  // REQUEST EXPORTS
  exportAs: 'pptx'  // Can be 'pdf', 'pptx', or both
}
```

### Phase 2: Download and Store PPTX (CORE FIX)

When `checkGenerationStatus()` receives a completed response:

1. Check for `pptxDownloadUrl` or `pdfDownloadUrl` in response (already coded at lines 382-388)
2. Download the file from Gamma's URL
3. Upload to Supabase Storage at `presentations/{organization_id}/{gamma_id}.pptx`
4. Get permanent Supabase Storage URL
5. Update `campaign_presentations` table with the storage URL

### Phase 3: Extract Content for Memory Vault

1. Download the PPTX file
2. Extract text content using a PPTX parser (existing placeholder at lines 118-136)
3. Extract slide structure
4. Store in `campaign_presentations.full_text` and `campaign_presentations.slides`

### Phase 4: Integrate with Memory Vault

Save presentations to `content_library` table:

```typescript
await supabase
  .from('content_library')
  .insert({
    organization_id: request.organization_id,
    session_id: request.campaign_id,
    content_type: 'presentation',
    title: presentationTitle,
    content: fullText,  // Extracted text from PPTX
    metadata: {
      gamma_id: generationId,
      gamma_url: gammaUrl,
      slide_count: slides.length,
      format: 'pptx',
      slides: slides  // Structured slide data
    },
    tags: ['gamma', 'presentation', 'auto-generated'],
    status: 'final',
    folder_path: `presentations/${presentationTitle}`,
    file_url: supabaseStorageUrl  // Link to stored PPTX
  })
```

## Implementation Steps

### 1. Add Export Request Parameter

**File**: `supabase/functions/gamma-presentation/index.ts`
**Lines**: ~230-238

```typescript
const requestBody: any = {
  inputText: inputText,
  textMode: request.content ? 'preserve' : 'generate',
  format: request.format || 'presentation',
  numCards: request.options?.numCards || request.slideCount || (request.framework ? 12 : 10),
  cardSplit: request.options?.cardSplit || 'auto',
  exportAs: 'pptx'  // ADD THIS
}
```

### 2. Implement File Download

Add new function after `extractPptxContent`:

```typescript
async function downloadFile(url: string): Promise<Uint8Array> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.status}`)
  }
  const arrayBuffer = await response.arrayBuffer()
  return new Uint8Array(arrayBuffer)
}
```

### 3. Implement Supabase Storage Upload

Add new function:

```typescript
async function uploadToStorage(
  file: Uint8Array,
  organizationId: string,
  gammaId: string,
  extension: string
): Promise<string> {
  const filePath = `presentations/${organizationId}/${gammaId}.${extension}`

  const { data, error } = await supabase.storage
    .from('presentations')  // Create this bucket if not exists
    .upload(filePath, file, {
      contentType: extension === 'pptx'
        ? 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        : 'application/pdf',
      upsert: true
    })

  if (error) throw error

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('presentations')
    .getPublicUrl(filePath)

  return publicUrl
}
```

### 4. Improve PPTX Text Extraction

Replace the placeholder function with a real PPTX parser. We can use JSZip since PPTX is a ZIP file:

```typescript
async function extractPptxContent(pptxBuffer: Uint8Array): Promise<{ fullText: string; slides: any[] }> {
  try {
    // Import JSZip dynamically
    const JSZip = await import('https://esm.sh/jszip@3.10.1')
    const zip = await JSZip.default.loadAsync(pptxBuffer)

    const slides: any[] = []
    let fullText = ''

    // Extract slide XMLs from ppt/slides/ folder
    const slideFiles = Object.keys(zip.files)
      .filter(name => name.startsWith('ppt/slides/slide') && name.endsWith('.xml'))
      .sort()

    for (const slideFile of slideFiles) {
      const xmlContent = await zip.files[slideFile].async('text')

      // Extract text from XML (very simplified - just get text between tags)
      const textMatches = xmlContent.match(/<a:t>([^<]+)<\/a:t>/g) || []
      const slideText = textMatches
        .map(match => match.replace(/<\/?a:t>/g, ''))
        .join(' ')

      slides.push({
        number: slides.length + 1,
        text: slideText
      })

      fullText += slideText + '\n\n'
    }

    return { fullText, slides }
  } catch (error) {
    console.error('Error extracting PPTX content:', error)
    return { fullText: '', slides: [] }
  }
}
```

### 5. Update capturePresentation Function

**File**: `supabase/functions/gamma-presentation/index.ts`
**Lines**: 138-201

Replace the current implementation to:

1. Check if pptxDownloadUrl exists
2. Download the file
3. Upload to Supabase Storage
4. Extract text content
5. Save to both `campaign_presentations` AND `content_library`

## Testing Plan

1. Generate a test presentation with `capture: true`
2. Poll status until completed
3. Verify `pptxDownloadUrl` is in the response
4. Verify file is downloaded and uploaded to Supabase Storage
5. Verify text content is extracted
6. Verify entry exists in both `campaign_presentations` and `content_library`
7. Test NIV can access the presentation content

## Expected Outcome

After implementing this fix:

1. ✅ Gamma presentations will be exported as PPTX
2. ✅ PPTX files will be stored in Supabase Storage
3. ✅ Text content will be extracted and searchable
4. ✅ NIV will have access to presentation content via Memory Vault
5. ✅ Users will be able to download the PPTX file
6. ✅ Presentations will be fully integrated into the SignalDesk ecosystem
