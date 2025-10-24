From the API docs, Gamma has an exportPdfPptx parameter that lets you get the .pptx file directly:
typescript// When creating presentation
const response = await fetch('https://api.gamma.app/public-api/v0.1/generate', {
method: 'POST',
headers: {
'X-API-KEY': process.env.GAMMA_API_KEY,
'Content-Type': 'application/json'
},
body: JSON.stringify({
inputText: prompt,
format: 'presentation',
exportPdfPptx: true, // ← This is the key!
// ... other params
})
});

// Response includes:
{
"success": true,
"generationId": "unique-id",
"gammaUrl": "https://gamma.app/docs/your-presentation",
"pptxDownloadUrl": "https://...", // ← Download link!
"pdfDownloadUrl": "https://...", // ← Optional PDF too
"summary": {
"title": "Your Presentation Title",
"cards": 10,
"status": "completed"
}
}
Important: The download links expire after a period, so grab them immediately!
🔧 Your Complete Solution (4 Hours of Work)
Step 1: Modify Your Gamma API Call (30 mins)
typescript// supabase/functions/gamma-presentation-with-capture/index.ts

export async function createGammaWithCapture(
prompt: string,
campaignId: string
) {
// 1. Create with Gamma - request export
const gammaResponse = await fetch(
'https://api.gamma.app/public-api/v0.1/generate',
{
method: 'POST',
headers: {
'X-API-KEY': Deno.env.get('GAMMA_API_KEY'),
'Content-Type': 'application/json',
},
body: JSON.stringify({
inputText: prompt,
format: 'presentation',
exportPdfPptx: true, // Get .pptx file!
// ... your other params
}),
}
);

const data = await gammaResponse.json();

// 2. Download the .pptx immediately (before link expires)
const pptxResponse = await fetch(data.pptxDownloadUrl);
const pptxBuffer = await pptxResponse.arrayBuffer();

// 3. Extract text content
const textContent = await extractPptxContent(pptxBuffer);

// 4. Store everything in SignalDesk
const { data: stored, error } = await supabase
.from('campaign_presentations')
.insert({
campaign_id: campaignId,
gamma_id: data.generationId,
gamma_url: data.gammaUrl,
gamma_edit_url: data.summary.editUrl,
title: data.summary.title,
slide_count: data.summary.cards,
full_text: textContent.allText, // Searchable!
slides: textContent.slides, // Structured!
pptx_file: pptxBuffer, // Original file!
created_at: new Date(),
});

return {
gammaUrl: data.gammaUrl,
signaldeskId: stored.id,
captured: true,
};
}
Step 2: Add Content Extraction (1 hour)
typescript// Use markitdown to extract text
async function extractPptxContent(pptxBuffer: ArrayBuffer) {
// Save to temp file
const tempPath = `/tmp/${crypto.randomUUID()}.pptx`;
await Deno.writeFile(tempPath, new Uint8Array(pptxBuffer));

// Extract with markitdown
const process = Deno.run({
cmd: ['python', '-m', 'markitdown', tempPath],
stdout: 'piped',
});

const output = await process.output();
const text = new TextDecoder().decode(output);

// Parse markdown to structure
const slides = parseMarkdownSlides(text);

return {
allText: text,
slides: slides,
};
}

function parseMarkdownSlides(markdown: string) {
// Split by slide markers (markitdown outputs "Page X")
const slideTexts = markdown.split(/Page \d+/);

return slideTexts.map((text, i) => ({
slideNumber: i + 1,
content: text.trim(),
// Extract title (first line usually)
title: text.split('\n')[0]?.replace(/^#+ /, '') || `Slide ${i + 1}`,
}));
}
Step 3: Database Schema (30 mins)
sql-- Store Gamma presentations with full content
CREATE TABLE campaign_presentations (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
campaign_id UUID REFERENCES campaigns(id),

-- Gamma references
gamma_id TEXT UNIQUE NOT NULL,
gamma_url TEXT NOT NULL,
gamma_edit_url TEXT,

-- Content (searchable!)
title TEXT NOT NULL,
slide_count INTEGER NOT NULL,
full_text TEXT NOT NULL,
slides JSONB NOT NULL,

-- Original file
pptx_file BYTEA, -- Store actual .pptx file

-- Metadata
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Full-text search
CREATE INDEX idx_presentation_search
ON campaign_presentations
USING GIN(to_tsvector('english', full_text));

-- Search by title
CREATE INDEX idx_presentation_title
ON campaign_presentations
USING GIN(to_tsvector('english', title));
Step 4: Search & Retrieval (1 hour)
typescript// Search presentations
export async function searchPresentations(query: string) {
const { data } = await supabase
.from('campaign_presentations')
.select('\*')
.textSearch('full_text', query)
.limit(10);

return data;
}

// Get presentation for a campaign
export async function getCampaignPresentations(campaignId: string) {
const { data } = await supabase
.from('campaign_presentations')
.select('\*')
.eq('campaign_id', campaignId)
.order('created_at', { ascending: false });

return data;
}

// Reference in NIV
export async function getPresentationContext(topic: string) {
const results = await searchPresentations(topic);

return results.map(p => ({
title: p.title,
relevantSlides: p.slides.filter(s =>
s.content.toLowerCase().includes(topic.toLowerCase())
),
url: p.gamma_url,
}));
}
Step 5: NIV Integration (1 hour)
typescript// When generating new presentations, reference past work
export async function generateIntelligentPresentation(
prompt: string,
campaignId: string
) {
// 1. Find relevant past presentations
const pastContext = await getPresentationContext(prompt);

// 2. Enhance prompt with context
const enhancedPrompt = `
${prompt}

Context from past presentations:
${pastContext.map(p => `

- ${p.title}
  ${p.relevantSlides.map(s => `  • ${s.title}`).join('\n')}
  `).join('\n')}

Build on these insights while creating something fresh and relevant.
`;

// 3. Create with Gamma (with capture)
return await createGammaWithCapture(enhancedPrompt, campaignId);
}

```

## 🎯 What This Gives You

**Before (current state):**
```

Prompt → Gamma → Beautiful presentation ✅
↓
(black box ❌)

```

**After (4 hours of work):**
```

Prompt → Gamma → Beautiful presentation ✅
↓
Download .pptx ✅
↓
Extract content ✅
↓
Store in SignalDesk ✅
↓
Searchable ✅
Referenceable ✅
NIV-aware ✅
