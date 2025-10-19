# How to Generate Real Opportunities from Intelligence Pipeline

## Quick Steps:

1. **Open SignalDesk** at http://localhost:3002

2. **Select an Organization** (e.g., Tesla, OpenAI) from the dropdown in the header

3. **Open the Intelligence Module:**
   - Click on "Intelligence" tab in the header
   - Select "Add to Dashboard" or "Open in New Window"

4. **Enable Real Pipeline:**
   - In the Intelligence module, toggle "Use Real Pipeline" to ON
   - This will connect to the actual Supabase edge functions

5. **Click "Run Intelligence Pipeline"**
   - This will start the full 7-stage pipeline
   - It takes about 30-60 seconds to complete
   - You'll see each stage progress in real-time

6. **What Happens:**
   - Stage 1-4: Discovery, filtering, relevance scoring, entity extraction
   - Stage 5: Intelligence Orchestrator runs
   - Stage 6: Executive Synthesis generates insights
   - **Stage 7: mcp-opportunity-detector** generates opportunities based on the intelligence

7. **Check the Opportunities:**
   - Once the pipeline completes, open the Opportunities module
   - You should see NEW opportunities generated from the real intelligence data
   - These will be different from the test data - they're based on actual news!

## What Gets Generated:

The mcp-opportunity-detector will analyze the intelligence and create opportunities like:
- **CRISIS_RESPONSE**: If competitors have negative news
- **THOUGHT_LEADERSHIP**: If trending topics align with your organization
- **COMPETITIVE**: If competitors show weakness
- **REGULATORY**: If new regulations create opportunities
- **MILESTONE**: If your organization has achievements to amplify

## Troubleshooting:

If opportunities aren't showing up:
1. Check the browser console for the pipeline response
2. Look for "opportunities" in the response data
3. Verify the opportunities table has new entries

The key is that opportunities are now generated DYNAMICALLY based on real intelligence data, not static test data!