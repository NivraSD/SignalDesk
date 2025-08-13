# Production Issues Fix Guide

## Issues Identified

### 1. Content Generation Failing in Production
**Root Cause**: The API URL is not properly configured in the Vercel deployment. The frontend is likely trying to call `localhost:3001` instead of the Railway backend URL.

### 2. AI Chat Restarting After 2 Messages
**Root Cause**: The AI Assistant component doesn't maintain session state properly. Each message is sent without proper conversation history.

## Immediate Fixes

### Fix 1: Set Environment Variables in Vercel

Run these commands in your terminal:

```bash
# Set the Railway backend URL in Vercel
vercel env add REACT_APP_API_URL production

# When prompted, enter your Railway backend URL (without /api):
# Example: https://signaldesk-backend.railway.app
```

### Fix 2: Set Environment Variables in Railway

```bash
# Set the Claude API key in Railway
railway variables set ANTHROPIC_API_KEY=your_actual_api_key_here

# Deploy the changes
railway up
```

### Fix 3: Update AI Assistant Component

The AI Assistant needs to maintain conversation history. Here's the fix:

```javascript
// frontend/src/components/AIAssistant.js
// Add this to maintain conversation history

import React, { useState, useEffect } from "react";
import SaveToMemoryVaultButton from "./MemoryVault/SaveToMemoryVaultButton";
import { useProject } from "../contexts/ProjectContext";
import API_BASE_URL from '../config/api';

const AIAssistant = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [conversationHistory, setConversationHistory] = useState([]);
  const { activeProject } = useProject();

  // Initialize session on component mount
  useEffect(() => {
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setSessionId(newSessionId);
    
    // Load saved conversation from localStorage if exists
    const savedConversation = localStorage.getItem(`ai_conversation_${activeProject?.id}`);
    if (savedConversation) {
      try {
        const parsed = JSON.parse(savedConversation);
        setMessages(parsed.messages || []);
        setConversationHistory(parsed.history || []);
      } catch (e) {
        console.error('Failed to load saved conversation:', e);
      }
    }
  }, [activeProject]);

  // Save conversation to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(`ai_conversation_${activeProject?.id}`, JSON.stringify({
        messages: messages,
        history: conversationHistory,
        timestamp: new Date().toISOString()
      }));
    }
  }, [messages, conversationHistory, activeProject]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    // Add user message to chat
    const userMessage = { role: "user", content: message };
    setMessages((prev) => [...prev, userMessage]);
    
    // Update conversation history for API
    const newHistory = [...conversationHistory, userMessage];
    setConversationHistory(newHistory);
    
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/content/ai-generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
        body: JSON.stringify({
          prompt: message,
          type: "consultation",
          tone: "helpful",
          projectId: activeProject?.id || "1",
          sessionId: sessionId,
          conversationHistory: newHistory, // Send full history
          previousMessages: newHistory.slice(-10) // Send last 10 messages for context
        }),
      });

      const data = await res.json();

      // Add AI response to chat
      const aiMessage = {
        role: "assistant",
        content: data.content || "No response received",
      };
      setMessages((prev) => [...prev, aiMessage]);
      
      // Update conversation history
      setConversationHistory(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Error: Failed to get response. Please check your connection.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Clear conversation
  const clearConversation = () => {
    setMessages([]);
    setConversationHistory([]);
    localStorage.removeItem(`ai_conversation_${activeProject?.id}`);
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setSessionId(newSessionId);
  };

  // ... rest of the component remains the same
};
```

### Fix 4: Update Content Generation API Call

The content generation is failing because the API endpoint path might be incorrect. Update the RailwayDraggable component:

```javascript
// frontend/src/components/RailwayDraggable.js
// Update the generateContentInFeature function

const generateContentInFeature = async (params) => {
  // ... existing code ...
  
  try {
    // Build prompt from guided flow context
    const prompt = `Create a ${params.type} about ${params.topic} for ${params.audience} audience with a ${params.tone} tone. ${params.keyPoints || ''}`;
    
    // CRITICAL FIX: Use the correct endpoint
    const response = await fetch(`${API_BASE_URL}/content/ai-generate`, {  // Changed from /ai/chat
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        prompt: prompt,
        type: params.type,  // This should match backend expectations
        contentType: params.type,
        contentTypeId: params.type,
        tone: params.tone || 'professional',
        projectId: '1',  // Or get from context
        companyName: params.company || '',
        industry: params.industry || ''
      })
    });

    const data = await response.json();
    
    if (data.success && data.content) {  // Changed from data.response
      // Set the generated content directly
      setGeneratedContent(data.content);  // Changed from data.response
      setCurrentContentType(params.type);
      
      // ... rest of the code
    }
  } catch (error) {
    console.error('Error generating content:', error);
  } finally {
    setLoading(false);
  }
};
```

## Verification Steps

1. **Test the diagnostic page**:
   - Open `/diagnose-production-issues.html` in your browser
   - Enter your Vercel frontend URL and Railway backend URL
   - Run all tests to verify the fixes

2. **Check environment variables**:
   ```bash
   # Verify Vercel has the correct API URL
   vercel env ls production
   
   # Verify Railway has the Claude API key
   railway variables
   ```

3. **Test content generation**:
   - Go to your production site
   - Try generating content
   - Check browser console for any errors

4. **Test AI chat persistence**:
   - Send 3-4 messages to the AI Assistant
   - Verify the conversation continues without resetting

## Long-term Solutions

1. **Add health check endpoint** to quickly verify all services are running
2. **Implement proper session management** with Redis or database storage
3. **Add error reporting** to catch production issues early
4. **Set up monitoring** for API endpoints
5. **Create deployment checklist** to prevent missing environment variables

## Quick Deploy Commands

After making the fixes:

```bash
# Deploy frontend to Vercel
cd frontend
vercel --prod

# Deploy backend to Railway
cd ../backend
railway up
```

## Environment Variables Checklist

### Vercel (Frontend):
- [ ] `REACT_APP_API_URL` - Your Railway backend URL (e.g., https://your-app.railway.app)

### Railway (Backend):
- [ ] `ANTHROPIC_API_KEY` - Your Claude API key
- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `NODE_ENV` - Set to "production"
- [ ] `PORT` - Usually auto-set by Railway

## Contact for Help

If issues persist after these fixes:
1. Check Railway logs: `railway logs`
2. Check Vercel logs: `vercel logs`
3. Use the diagnostic tool to identify specific failures