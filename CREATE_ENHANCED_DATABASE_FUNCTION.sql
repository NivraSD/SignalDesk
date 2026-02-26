-- Enhanced Database Function for Niv Chat
-- This replaces Edge Functions with a reliable database-based solution
-- Run this ENTIRE script in Supabase SQL Editor

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS niv_chat(TEXT, TEXT);

-- Create the enhanced chat function
CREATE OR REPLACE FUNCTION niv_chat(
  user_message TEXT,
  session_id TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  response_json JSON;
  ai_response TEXT;
  actual_session_id TEXT;
  should_create_artifact BOOLEAN;
  artifact_type TEXT;
  artifact_title TEXT;
BEGIN
  -- Generate session ID if not provided
  actual_session_id := COALESCE(session_id, 'session-' || extract(epoch from now())::text);
  
  -- Determine if we should create an artifact based on keywords
  should_create_artifact := FALSE;
  artifact_type := 'general';
  artifact_title := '';
  
  -- Check for strategic keywords
  IF user_message ILIKE '%press release%' THEN
    should_create_artifact := TRUE;
    artifact_type := 'press-release';
    artifact_title := 'Press Release Draft';
    ai_response := E'I''ll help you create a compelling press release. Here''s a strategic framework:\n\n' ||
                   E'**HEADLINE**: [Your announcement in 10 words or less]\n\n' ||
                   E'**SUBHEADLINE**: [Supporting detail that expands the main news]\n\n' ||
                   E'**LEAD PARAGRAPH**: Answer the 5 W''s - Who, What, When, Where, Why\n' ||
                   E'- Start with the most newsworthy element\n' ||
                   E'- Keep it under 30 words\n' ||
                   E'- Include a compelling hook\n\n' ||
                   E'**BODY**: \n' ||
                   E'- Paragraph 2: Expand on the significance and impact\n' ||
                   E'- Paragraph 3: Include a powerful quote from leadership\n' ||
                   E'- Paragraph 4: Provide context and background\n' ||
                   E'- Paragraph 5: Future implications and next steps\n\n' ||
                   E'**BOILERPLATE**: Company description (100 words)\n\n' ||
                   E'**CONTACT**: Media relations contact information\n\n' ||
                   E'Based on: "' || user_message || '"\n\n' ||
                   E'Would you like me to draft specific sections or shall we refine the angle first?';
                   
  ELSIF user_message ILIKE '%media%' OR user_message ILIKE '%journalist%' THEN
    should_create_artifact := TRUE;
    artifact_type := 'media-strategy';
    artifact_title := 'Media Strategy';
    ai_response := E'Let me develop a targeted media strategy for you:\n\n' ||
                   E'**MEDIA TARGETING**:\n' ||
                   E'• Tier 1 (National): WSJ, NYT, Forbes, TechCrunch\n' ||
                   E'• Tier 2 (Trade): Industry-specific publications\n' ||
                   E'• Tier 3 (Regional): Local business journals\n\n' ||
                   E'**KEY MESSAGES**:\n' ||
                   E'1. Primary: Your main news angle\n' ||
                   E'2. Secondary: Supporting proof points\n' ||
                   E'3. Tertiary: Broader industry context\n\n' ||
                   E'**OUTREACH TIMELINE**:\n' ||
                   E'- T-7 days: Exclusive offers to Tier 1\n' ||
                   E'- T-3 days: Embargo to Tier 2\n' ||
                   E'- Launch day: Wide distribution\n' ||
                   E'- T+1: Follow-up with non-responders\n\n' ||
                   E'**PITCH ANGLES**:\n' ||
                   E'• Business impact story\n' ||
                   E'• Human interest angle\n' ||
                   E'• Industry trend piece\n\n' ||
                   E'Regarding: "' || user_message || '"\n\n' ||
                   E'What''s your primary objective with this media outreach?';
                   
  ELSIF user_message ILIKE '%announce%' OR user_message ILIKE '%launch%' THEN
    should_create_artifact := TRUE;
    artifact_type := 'announcement';
    artifact_title := 'Strategic Announcement';
    ai_response := E'I''ll help you craft a strategic announcement. Let''s structure it for maximum impact:\n\n' ||
                   E'**ANNOUNCEMENT FRAMEWORK**:\n\n' ||
                   E'**Core Message**: [One sentence that captures the essence]\n\n' ||
                   E'**Stakeholder Messaging**:\n' ||
                   E'• Customers: How this benefits them\n' ||
                   E'• Investors: Growth and value implications\n' ||
                   E'• Employees: Internal culture and pride points\n' ||
                   E'• Partners: Collaboration opportunities\n\n' ||
                   E'**Distribution Channels**:\n' ||
                   E'1. Press release via wire service\n' ||
                   E'2. Blog post with deeper context\n' ||
                   E'3. Social media campaign\n' ||
                   E'4. Email to stakeholders\n' ||
                   E'5. Executive LinkedIn posts\n\n' ||
                   E'**Supporting Assets**:\n' ||
                   E'• Executive quotes\n' ||
                   E'• Data points and metrics\n' ||
                   E'• Visuals and infographics\n' ||
                   E'• FAQ document\n\n' ||
                   E'For: "' || user_message || '"\n\n' ||
                   E'What''s the single most important outcome you want from this announcement?';
                   
  ELSIF user_message ILIKE '%strategy%' OR user_message ILIKE '%campaign%' THEN
    should_create_artifact := TRUE;
    artifact_type := 'strategy';
    artifact_title := 'PR Strategy Document';
    ai_response := E'Let me develop a comprehensive PR strategy:\n\n' ||
                   E'**STRATEGIC OBJECTIVES**:\n' ||
                   E'1. Build brand awareness\n' ||
                   E'2. Position as industry leader\n' ||
                   E'3. Drive stakeholder engagement\n\n' ||
                   E'**TARGET AUDIENCES**:\n' ||
                   E'• Primary: Decision makers in target market\n' ||
                   E'• Secondary: Industry influencers\n' ||
                   E'• Tertiary: General business community\n\n' ||
                   E'**KEY TACTICS**:\n' ||
                   E'• Thought leadership program\n' ||
                   E'• Strategic media relations\n' ||
                   E'• Executive visibility\n' ||
                   E'• Content marketing\n' ||
                   E'• Speaking opportunities\n\n' ||
                   E'**SUCCESS METRICS**:\n' ||
                   E'• Media coverage quality and reach\n' ||
                   E'• Message penetration\n' ||
                   E'• Stakeholder sentiment\n' ||
                   E'• Business impact metrics\n\n' ||
                   E'Based on: "' || user_message || '"\n\n' ||
                   E'What are your top 3 business priorities I should align this strategy with?';
                   
  ELSIF user_message ILIKE '%crisis%' OR user_message ILIKE '%damage control%' THEN
    should_create_artifact := TRUE;
    artifact_type := 'crisis-response';
    artifact_title := 'Crisis Response Plan';
    ai_response := E'**IMMEDIATE CRISIS RESPONSE PROTOCOL**:\n\n' ||
                   E'**HOUR 1 - ASSESS & CONTAIN**:\n' ||
                   E'☐ Assemble crisis team\n' ||
                   E'☐ Gather all facts\n' ||
                   E'☐ Assess severity (1-5 scale)\n' ||
                   E'☐ Implement holding statement\n' ||
                   E'☐ Monitor social/media channels\n\n' ||
                   E'**HOUR 2-4 - STRATEGIZE**:\n' ||
                   E'☐ Develop key messages\n' ||
                   E'☐ Identify stakeholders to address\n' ||
                   E'☐ Prepare Q&A document\n' ||
                   E'☐ Brief executives\n\n' ||
                   E'**HOUR 4-24 - EXECUTE**:\n' ||
                   E'☐ Release official statement\n' ||
                   E'☐ Conduct media outreach\n' ||
                   E'☐ Update employees\n' ||
                   E'☐ Engage with stakeholders\n\n' ||
                   E'**KEY MESSAGES**:\n' ||
                   E'1. Acknowledge the situation\n' ||
                   E'2. Express appropriate concern\n' ||
                   E'3. State concrete actions\n' ||
                   E'4. Commit to transparency\n\n' ||
                   E'Situation: "' || user_message || '"\n\n' ||
                   E'What''s the current status and who needs to be informed immediately?';
  ELSE
    -- General PR assistance
    ai_response := E'As your AI PR strategist with 20 years of experience, I can help you with:\n\n' ||
                   E'• **Press Releases**: Crafting newsworthy announcements\n' ||
                   E'• **Media Relations**: Building journalist relationships\n' ||
                   E'• **Crisis Management**: Rapid response strategies\n' ||
                   E'• **Executive Positioning**: Thought leadership programs\n' ||
                   E'• **Campaign Development**: Integrated PR campaigns\n' ||
                   E'• **Message Development**: Core messaging frameworks\n\n' ||
                   E'Regarding your request: "' || user_message || '"\n\n' ||
                   E'I''m here to provide strategic counsel. What specific PR challenge can I help you solve today?';
  END IF;
  
  -- Save user message to conversations
  INSERT INTO niv_conversations (session_id, role, content, created_at)
  VALUES (actual_session_id, 'user', user_message, NOW());
  
  -- Save AI response to conversations
  INSERT INTO niv_conversations (session_id, role, content, created_at)
  VALUES (actual_session_id, 'assistant', ai_response, NOW() + INTERVAL '1 second');
  
  -- Create artifact if needed
  IF should_create_artifact THEN
    INSERT INTO niv_artifacts (
      session_id,
      type,
      title,
      content,
      status,
      created_at
    ) VALUES (
      actual_session_id,
      artifact_type,
      artifact_title,
      json_build_object(
        'title', artifact_title,
        'type', artifact_type,
        'content', ai_response,
        'query', user_message,
        'timestamp', NOW(),
        'status', 'draft',
        'editable', true
      ),
      'draft',
      NOW()
    );
  END IF;
  
  -- Build response JSON
  response_json := json_build_object(
    'response', ai_response,
    'message', ai_response,
    'chatMessage', ai_response,
    'shouldSave', should_create_artifact,
    'artifactCreated', should_create_artifact,
    'artifactType', artifact_type,
    'sessionId', actual_session_id
  );
  
  RETURN response_json;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION niv_chat TO anon;
GRANT EXECUTE ON FUNCTION niv_chat TO authenticated;
GRANT EXECUTE ON FUNCTION niv_chat TO service_role;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_niv_conversations_session ON niv_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_niv_artifacts_session ON niv_artifacts(session_id);

-- Test the enhanced function
SELECT niv_chat('I need help with a press release for our Series B funding announcement', 'test-session-enhanced');