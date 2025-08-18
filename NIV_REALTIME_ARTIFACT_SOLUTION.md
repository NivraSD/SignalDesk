# Niv Artifact System - Realtime Solution with MCP Integration

## Problem Summary
The core issue is coordinating artifact creation between:
1. Edge Function (generates content)
2. Chat UI (displays conversation)
3. Artifact Panel (shows created artifacts)
4. Workspace (edits artifacts)

## Proposed Solution: Supabase Realtime + Database-First Approach

### Architecture Overview

```
User Message → Edge Function → Creates Artifact in DB → Realtime Broadcast
                     ↓                                          ↓
              Chat Response                            All UI Components Update
```

### Key Changes

1. **Database-First Artifact Creation**
   - Edge function writes artifacts directly to Supabase tables
   - UI components subscribe to realtime changes
   - No prop passing needed - all components read from same source

2. **Separation of Concerns**
   - Chat only shows conversation
   - Artifacts always appear in right panel via subscription
   - Workspace loads artifacts directly from database

## Implementation Plan

### Step 1: Database Schema

```sql
-- Artifacts table with realtime enabled
CREATE TABLE niv_artifacts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id TEXT,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  content JSONB NOT NULL,
  metadata JSONB,
  mcp_sources TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  status TEXT DEFAULT 'draft'
);

-- Enable realtime
ALTER TABLE niv_artifacts REPLICA IDENTITY FULL;

-- Conversations table for chat history
CREATE TABLE niv_conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id TEXT,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  mcps_used TEXT[],
  artifact_id UUID REFERENCES niv_artifacts(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable realtime
ALTER TABLE niv_conversations REPLICA IDENTITY FULL;

-- Workspace edits table
CREATE TABLE niv_workspace_edits (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  artifact_id UUID REFERENCES niv_artifacts(id),
  user_id TEXT,
  changes JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Step 2: Enhanced Edge Function with Direct DB Writes

```typescript
// /supabase/functions/niv-realtime/index.ts
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

serve(async (req) => {
  const { message, sessionId, userId, conversationHistory } = await req.json();
  
  // Initialize Supabase client with service role for DB writes
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')! // Service role for DB access
  );
  
  // 1. Save user message to conversations table
  await supabase.from('niv_conversations').insert({
    session_id: sessionId,
    user_id: userId,
    role: 'user',
    content: message
  });
  
  // 2. Detect intent and relevant MCPs
  const mcps = detectRelevantMCPs(message);
  
  // 3. Generate response with Claude
  const response = await callClaude(message, conversationHistory);
  
  // 4. Check if artifact should be created
  const shouldCreateArtifact = detectArtifactNeed(message, conversationHistory);
  
  let artifactId = null;
  if (shouldCreateArtifact) {
    // 5. Generate artifact content
    const artifactContent = await generateArtifactContent(
      detectContentType(message),
      conversationHistory,
      mcps
    );
    
    // 6. Save artifact to database - this triggers realtime update
    const { data: artifact } = await supabase
      .from('niv_artifacts')
      .insert({
        session_id: sessionId,
        user_id: userId,
        type: artifactContent.type,
        title: artifactContent.title,
        content: artifactContent.content,
        mcp_sources: mcps,
        metadata: {
          conversation_length: conversationHistory.length,
          trigger_message: message
        }
      })
      .select()
      .single();
    
    artifactId = artifact.id;
  }
  
  // 7. Save assistant response with artifact reference
  await supabase.from('niv_conversations').insert({
    session_id: sessionId,
    user_id: userId,
    role: 'assistant',
    content: response,
    mcps_used: mcps,
    artifact_id: artifactId // Links to artifact if created
  });
  
  // 8. Return only the response - artifacts handled via realtime
  return new Response(
    JSON.stringify({
      message: response,
      mcpsUsed: mcps,
      artifactCreated: !!artifactId
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
```

### Step 3: React Components with Realtime Subscriptions

```javascript
// NivRealtimeChat.js
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const NivRealtimeChat = () => {
  const [messages, setMessages] = useState([]);
  const [artifacts, setArtifacts] = useState([]);
  const [sessionId] = useState(`session-${Date.now()}`);
  
  useEffect(() => {
    // Subscribe to conversations table for this session
    const conversationSub = supabase
      .channel(`conversations:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'niv_conversations',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          // New message added - update UI
          setMessages(prev => [...prev, payload.new]);
        }
      )
      .subscribe();
    
    // Subscribe to artifacts table for this session
    const artifactSub = supabase
      .channel(`artifacts:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'niv_artifacts',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            // New artifact created - add to panel
            setArtifacts(prev => [...prev, payload.new]);
            
            // Show notification
            showNotification('New artifact created!');
          } else if (payload.eventType === 'UPDATE') {
            // Artifact updated (from workspace) - update local state
            setArtifacts(prev => 
              prev.map(a => a.id === payload.new.id ? payload.new : a)
            );
          }
        }
      )
      .subscribe();
    
    // Load existing messages and artifacts for session
    loadSessionData();
    
    return () => {
      conversationSub.unsubscribe();
      artifactSub.unsubscribe();
    };
  }, [sessionId]);
  
  const loadSessionData = async () => {
    // Load conversations
    const { data: convos } = await supabase
      .from('niv_conversations')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at');
    
    if (convos) setMessages(convos);
    
    // Load artifacts
    const { data: arts } = await supabase
      .from('niv_artifacts')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at');
    
    if (arts) setArtifacts(arts);
  };
  
  const sendMessage = async (message) => {
    // Call edge function
    const response = await fetch(
      `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/niv-realtime`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          message,
          sessionId,
          userId: 'user-123',
          conversationHistory: messages
        })
      }
    );
    
    // Response handling is minimal - realtime handles UI updates
    const data = await response.json();
    console.log('MCPs used:', data.mcpsUsed);
  };
  
  return (
    <div className="flex h-screen">
      {/* Chat Area */}
      <div className="flex-1">
        <div className="messages">
          {messages.map((msg, i) => (
            <div key={i} className={`message ${msg.role}`}>
              {msg.content}
              {msg.artifact_id && (
                <Badge>Artifact Created</Badge>
              )}
            </div>
          ))}
        </div>
        <ChatInput onSend={sendMessage} />
      </div>
      
      {/* Artifacts Panel - Always in sync via realtime */}
      <div className="w-96 border-l">
        <h3>Artifacts ({artifacts.length})</h3>
        {artifacts.map(artifact => (
          <ArtifactCard
            key={artifact.id}
            artifact={artifact}
            onClick={() => openInWorkspace(artifact.id)}
          />
        ))}
      </div>
    </div>
  );
};
```

### Step 4: Workspace with Realtime Collaboration

```javascript
// NivWorkspace.js
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const NivWorkspace = ({ artifactId }) => {
  const [artifact, setArtifact] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    if (!artifactId) return;
    
    // Load artifact
    loadArtifact();
    
    // Subscribe to changes (for collaboration)
    const sub = supabase
      .channel(`artifact:${artifactId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'niv_artifacts',
          filter: `id=eq.${artifactId}`
        },
        (payload) => {
          // Another user edited - update local state
          setArtifact(payload.new);
          showNotification('Artifact updated by another user');
        }
      )
      .subscribe();
    
    return () => sub.unsubscribe();
  }, [artifactId]);
  
  const loadArtifact = async () => {
    const { data } = await supabase
      .from('niv_artifacts')
      .select('*')
      .eq('id', artifactId)
      .single();
    
    setArtifact(data);
  };
  
  const saveChanges = async (updatedContent) => {
    setIsSaving(true);
    
    // Update in database - triggers realtime for all subscribers
    const { error } = await supabase
      .from('niv_artifacts')
      .update({
        content: updatedContent,
        updated_at: new Date().toISOString()
      })
      .eq('id', artifactId);
    
    if (!error) {
      // Also save edit history
      await supabase.from('niv_workspace_edits').insert({
        artifact_id: artifactId,
        user_id: 'user-123',
        changes: { content: updatedContent }
      });
      
      showNotification('Changes saved!');
    }
    
    setIsSaving(false);
  };
  
  if (!artifact) return <div>Loading...</div>;
  
  return (
    <div className="workspace">
      <h2>{artifact.title}</h2>
      <Editor
        content={artifact.content}
        onChange={saveChanges}
        disabled={isSaving}
      />
      {artifact.mcp_sources && (
        <div className="mcp-sources">
          <h4>MCP Sources Used:</h4>
          {artifact.mcp_sources.map(mcp => (
            <Badge key={mcp}>{mcp}</Badge>
          ))}
        </div>
      )}
    </div>
  );
};
```

## Key Benefits of This Approach

### 1. **Separation of Concerns**
- Edge function only handles AI logic and DB writes
- UI components only handle display via subscriptions
- No complex prop passing or state management

### 2. **Real-time Synchronization**
- All components stay in sync automatically
- Multiple users can collaborate on same artifact
- Changes propagate instantly

### 3. **Reliability**
- Database is single source of truth
- No data loss if UI crashes
- Can resume sessions easily

### 4. **Scalability**
- Works with multiple browser tabs
- Supports team collaboration
- Easy to add new UI components

### 5. **MCP Integration Maintained**
- All MCP calls still work
- MCP sources tracked with artifacts
- Can enhance artifacts with MCP data

## Migration Path

### Phase 1: Database Setup (30 min)
1. Create tables with SQL above
2. Enable realtime in Supabase dashboard
3. Set up RLS policies if needed

### Phase 2: Edge Function (1 hour)
1. Deploy new `niv-realtime` function
2. Test database writes work
3. Verify realtime triggers

### Phase 3: Update UI Components (2 hours)
1. Add realtime subscriptions to NivChat
2. Update artifact panel to use subscriptions
3. Modify workspace for realtime updates

### Phase 4: Testing (1 hour)
1. Test artifact creation flow
2. Verify realtime updates work
3. Test workspace editing

## Avoiding Previous Issues

### Issue 1: Content in Chat
**Solution**: Edge function returns only chat message. Artifacts appear via realtime subscription in panel.

### Issue 2: Empty Artifacts
**Solution**: Content saved directly to DB by edge function. UI loads from DB, not props.

### Issue 3: Save Button Not Appearing
**Solution**: Not needed - artifacts auto-created in DB when appropriate.

### Issue 4: State Management Complexity
**Solution**: Supabase realtime handles all state synchronization.

## Configuration Needed

### Supabase Dashboard
1. Enable Realtime for tables
2. Configure RLS policies
3. Add service role key to edge function

### Environment Variables
```env
# Frontend
REACT_APP_SUPABASE_URL=https://zskaxjtyuaqazydouifp.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key

# Edge Function Secrets
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
CLAUDE_API_KEY=your-claude-key
```

## Testing Checklist

- [ ] User sends message
- [ ] Message appears in chat via realtime
- [ ] Edge function processes with MCPs
- [ ] Response appears in chat via realtime
- [ ] If artifact created, appears in panel via realtime
- [ ] Clicking artifact opens in workspace
- [ ] Editing artifact triggers realtime updates
- [ ] Multiple tabs stay synchronized

## Summary

This approach solves your artifact challenges by:
1. **Eliminating prop passing** - Everything flows through database
2. **Using realtime subscriptions** - Automatic UI synchronization
3. **Maintaining MCP integration** - All capabilities preserved
4. **Simplifying state management** - Database is single source of truth

The key insight is that Supabase Realtime turns your database into a real-time event bus, eliminating the need for complex client-side state coordination.