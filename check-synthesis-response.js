// Check what synthesis is returning in the orchestrator logs
const logs = `intelligenceService.ts:126 intelligence-orchestrator-v2 response: Object`;

console.log(`
The orchestrator IS returning data but we need to check:
1. Is the synthesis getting real data from enrichment?
2. Is the synthesis actually analyzing it or using fallback?

Look for these patterns in the synthesis:
- Generic titles like "Immediate Action Required"
- Missing specific company/event references
- Template-like descriptions

The fact that ALL opportunities have the same title suggests
the synthesis is using fallback data, not analyzing real articles.
`);
