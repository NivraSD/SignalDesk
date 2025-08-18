# NIV ARTIFACT SYSTEM - EXACT SPECIFICATION
## The ONLY Source of Truth for Implementation

---

## 1. CORE CONCEPT

**WHAT THIS SYSTEM DOES:**
- User talks to Niv (AI PR strategist) in a chat interface
- Niv helps with PR strategy through conversation
- When user needs materials created, Niv generates them
- Generated materials appear as artifacts in a right panel
- User clicks artifacts to open them in a workspace for editing

**WHAT THIS SYSTEM DOES NOT DO:**
- Does NOT show generated content in the chat
- Does NOT create inline work cards
- Does NOT mix conversation with content
- Does NOT require complex state management
- Does NOT need to be complicated

---

## 2. USER JOURNEY - STEP BY STEP

### Phase 1: Initial Conversation
1. User opens Niv interface
2. User types: "I need help with PR for my startup"
3. Message appears in chat (left side)
4. Niv responds in chat: "I'd be happy to help. Tell me about your startup..."

### Phase 2: Consultation (2-3 exchanges minimum)
1. User: "We're TechCo, an AI platform for developers"
2. Niv: "What's your target audience and upcoming announcements?"
3. User: "We're launching next month, targeting tech media"
4. Niv: "I understand. You'll need strategic media outreach..."

### Phase 3: Content Request
1. User: "Can you create a media list for us?"
2. Niv: "I'll create a targeted media list based on our discussion"

### Phase 4: Content Generation
1. Niv generates the content internally
2. Chat shows ONLY: "I've created a media list for your TechCo launch. The list is now available in the right panel where you can review and edit it."
3. NO journalists names, NO outlet details, NO content preview in chat

### Phase 5: Artifact Appearance
1. Right panel updates with new artifact card:
   - Title: "Media List - TechCo Launch"
   - Timestamp: "2:34 PM"
   - Status indicator: "Ready"
   - Click action: Opens workspace

### Phase 6: Workspace Interaction
1. User clicks artifact in right panel
2. Right side transforms into workspace view
3. Full media list is displayed (NOW we see the journalists)
4. User can edit, copy, export, save

---

## 3. EXACT LAYOUT

```
NORMAL VIEW:
+------------------------+------------------------+
|   NIV CHAT (60%)      |   ARTIFACTS (40%)      |
|                       |                        |
| Niv: How can I help?  |   📄 Media List       |
| User: I need PR help  |      2:34 PM          |
| Niv: Tell me more...  |                        |
| User: We're TechCo    |   📄 Press Release    |
| Niv: I'll create...   |      1:20 PM          |
| Niv: List is ready →  |                        |
|                       |   📄 Strategy Plan     |
| [Input box........]   |      Yesterday         |
+------------------------+------------------------+

WORKSPACE VIEW (when artifact clicked):
+------------------------+------------------------+
|   NIV CHAT (40%)      |   WORKSPACE (60%)      |
|                       |                        |
| [Previous chat        |   Media List           |
|  still visible]       |   ─────────────        |
|                       |   TIER 1 TECH          |
|                       |   • Jane Smith         |
|                       |     TechCrunch         |
|                       |     jane@tech.com      |
|                       |                        |
|                       |   • Bob Jones          |
|                       |     Wired              |
|                       |                        |
|                       |   [Edit] [Copy] [Save] |
+------------------------+------------------------+
```

---

## 4. DATA STRUCTURES

### Frontend → Backend Request
```json
{
  "message": "create a media list for our tech startup launch",
  "conversationHistory": [
    {"role": "user", "content": "I need PR help"},
    {"role": "assistant", "content": "Tell me about your company"},
    {"role": "user", "content": "We're TechCo, AI for developers"}
  ],
  "userId": "user_123",
  "sessionId": "session_456"
}
```

### Backend → Frontend Response
```json
{
  "chatMessage": "I've created a comprehensive media list for your TechCo launch. The list is now available in the right panel where you can review and edit it.",
  "artifact": {
    "id": "artifact_789",
    "type": "media-list",
    "title": "Media List - TechCo Launch",
    "created": "2024-01-15T14:34:00Z",
    "content": {
      "journalists": [
        {
          "name": "Jane Smith",
          "outlet": "TechCrunch",
          "email": "jane@techcrunch.com",
          "beat": "AI/Developer Tools"
        }
      ]
    }
  }
}
```

### Frontend State Management
```javascript
// Simple state - no complexity
const [chatMessages, setChatMessages] = useState([]);
const [artifacts, setArtifacts] = useState([]);
const [selectedArtifact, setSelectedArtifact] = useState(null);

// When response received:
setChatMessages([...chatMessages, response.chatMessage]);
if (response.artifact) {
  setArtifacts([...artifacts, response.artifact]);
}

// When artifact clicked:
setSelectedArtifact(artifact);
```

---

## 5. CRITICAL RULES

### MUST HAPPEN:
1. ✅ Niv MUST complete consultation before creating content (2+ exchanges)
2. ✅ Generated content MUST only appear in artifacts, NEVER in chat
3. ✅ Chat response MUST be brief (2-3 sentences max) when creating
4. ✅ Artifacts MUST appear in right panel immediately after creation
5. ✅ Clicking artifact MUST open full content in workspace

### MUST NOT HAPPEN:
1. ❌ NO content details in chat messages
2. ❌ NO work cards in chat interface
3. ❌ NO undefined/null errors
4. ❌ NO duplicate artifacts
5. ❌ NO content leakage between chat and artifacts

---

## 6. SUPPORTED CONTENT TYPES

1. **Media List**
   - List of journalists with contact info
   - Organized by tier/outlet
   
2. **Press Release**
   - Full press release draft
   - Headline, body, boilerplate
   
3. **Strategic Plan**
   - Campaign timeline
   - Key messages
   - Target audiences
   
4. **Social Content**
   - Platform-specific posts
   - Hashtags and timing
   
5. **Key Messaging**
   - Core messages
   - Supporting points
   - Audience-specific variations
   
6. **FAQ Document**
   - Common questions
   - Approved answers
   - Internal/external versions

---

## 7. IMPLEMENTATION REQUIREMENTS

### Backend (Supabase Edge Function)
- Function name: `niv-simple` (NEW - not the broken one)
- Consults for 2+ exchanges before creating
- Returns clean JSON with separated chat/artifact
- NEVER includes content in chat response

### Frontend Components Needed
1. `NivSimpleChat.js` - Chat interface (left side)
2. `NivArtifactPanel.js` - Artifact list (right side)
3. `NivWorkspace.js` - Content editor (replaces right side)
4. `NivLayout.js` - Container managing the split view

### State Flow
```
User types → NivSimpleChat → Supabase Function → Response
                                                ↓
                        ←─────────────── Chat message
                                                ↓
                        NivArtifactPanel ← Artifact data
                                ↓
                        User clicks artifact
                                ↓
                        NivWorkspace ← Full content display
```

---

## 8. SUCCESS CRITERIA

### Test Case 1: Basic Flow
1. User: "I need a media list"
2. Niv: "What industry and announcement?"
3. User: "Tech startup, Series A funding"
4. Niv: "I'll create a targeted media list"
5. Chat shows: "Media list created - see right panel"
6. Right panel shows: New artifact card
7. Click artifact: Full list displays
8. ✅ SUCCESS: Content only in workspace, not in chat

### Test Case 2: Multiple Artifacts
1. Complete consultation
2. User: "Create a press release and media list"
3. Chat shows: "I've created both - see right panel"
4. Right panel shows: TWO artifact cards
5. Each opens independently
6. ✅ SUCCESS: Both artifacts work correctly

### Test Case 3: No Premature Creation
1. User: "Create a media list"
2. Niv: "I need more information first..."
3. User provides context
4. Then Niv creates
5. ✅ SUCCESS: Consultation enforced

---

## 9. WHAT TO BUILD

### Step 1: New Supabase Function
- Create `niv-simple` function
- Clean implementation
- Proper chat/artifact separation

### Step 2: New Frontend Route
- Add `/niv-simple` route
- Fresh components
- No legacy code

### Step 3: Simple State Management
- Just useState
- No complex stores
- Direct prop passing

### Step 4: Test Everything
- Follow success criteria
- Verify no content in chat
- Ensure artifacts display

---

## 10. FAILURE MODES TO PREVENT

1. **JavaScript Errors**
   - Check all properties before access
   - Handle null/undefined gracefully
   - Console.log for debugging

2. **Content Leakage**
   - Backend strips content from chat
   - Frontend never displays artifact content in chat
   - Strict separation

3. **State Issues**
   - Simple state updates
   - No complex reducers
   - Clear data flow

---

## THIS IS THE SPECIFICATION. BUILD EXACTLY THIS. NOTHING MORE, NOTHING LESS.

If anything is unclear, ASK before implementing.
If tempted to add complexity, DON'T.
If it seems too simple, IT'S CORRECT.

**The goal: A working system where Niv creates artifacts that appear in the right panel and open in workspaces.**