-- Niv System Database Schema
-- Comprehensive schema for PR strategist conversation management and work item persistence

-- ============= CONVERSATION MANAGEMENT =============

-- Niv Conversations - Main conversation sessions
CREATE TABLE IF NOT EXISTS niv_conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL DEFAULT 'New Conversation',
    description TEXT,
    conversation_phase VARCHAR(50) DEFAULT 'discovery' CHECK (conversation_phase IN ('discovery', 'strategy', 'creation', 'completed')),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'archived')),
    context_summary JSONB DEFAULT '{}', -- Strategic insights, company info, objectives
    conversation_metadata JSONB DEFAULT '{}', -- Settings, preferences, flags
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversation Messages - Individual chat messages
CREATE TABLE IF NOT EXISTS niv_conversation_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES niv_conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'chat' CHECK (message_type IN ('chat', 'insight', 'recommendation', 'creation_trigger')),
    metadata JSONB DEFAULT '{}', -- Additional context, timestamps, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Strategic Context - Extracted insights and context from conversations
CREATE TABLE IF NOT EXISTS niv_strategic_context (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES niv_conversations(id) ON DELETE CASCADE,
    context_type VARCHAR(100) NOT NULL, -- 'company_info', 'announcement', 'objectives', 'constraints'
    extracted_data JSONB NOT NULL, -- Structured data extracted from conversation
    confidence_score DECIMAL(3,2) DEFAULT 0.0, -- AI confidence in extraction
    validated BOOLEAN DEFAULT FALSE, -- User confirmed accuracy
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============= WORK ITEM MANAGEMENT =============

-- Niv Work Items - Generated materials and deliverables
CREATE TABLE IF NOT EXISTS niv_work_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES niv_conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Basic Info
    title VARCHAR(255) NOT NULL,
    description TEXT,
    work_item_type VARCHAR(100) NOT NULL, -- 'media-list', 'content-draft', 'strategy-plan', etc.
    
    -- Content and Generation
    generated_content JSONB NOT NULL, -- The actual generated material
    generation_prompt TEXT, -- What user requested
    generation_context JSONB DEFAULT '{}', -- Context used for generation
    
    -- Status and Workflow
    status VARCHAR(50) DEFAULT 'generated' CHECK (status IN ('generated', 'reviewed', 'edited', 'approved', 'used')),
    priority INTEGER DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
    
    -- Version Control
    version INTEGER DEFAULT 1,
    parent_item_id UUID REFERENCES niv_work_items(id), -- For versioning/iterations
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Work Item Revisions - Track edits and improvements
CREATE TABLE IF NOT EXISTS niv_work_item_revisions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    work_item_id UUID REFERENCES niv_work_items(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    revision_type VARCHAR(50) NOT NULL, -- 'edit', 'ai_improvement', 'user_feedback'
    changes_made JSONB NOT NULL, -- What was changed
    previous_content JSONB, -- Backup of previous version
    new_content JSONB NOT NULL, -- New version
    change_reason TEXT, -- Why this change was made
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============= USER PREFERENCES & ANALYTICS =============

-- User Niv Preferences - Personal settings and learned preferences
CREATE TABLE IF NOT EXISTS niv_user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    
    -- Communication Style
    communication_style JSONB DEFAULT '{}', -- Tone, formality, detail level
    preferred_outputs JSONB DEFAULT '{}', -- Which materials user typically wants
    
    -- Industry and Context
    default_industry VARCHAR(100),
    typical_audiences JSONB DEFAULT '[]', -- Common target audiences
    company_context JSONB DEFAULT '{}', -- Default company information
    
    -- AI Preferences
    ai_assistance_level VARCHAR(50) DEFAULT 'balanced' CHECK (ai_assistance_level IN ('minimal', 'balanced', 'comprehensive')),
    auto_generation_enabled BOOLEAN DEFAULT TRUE,
    
    -- Analytics
    total_conversations INTEGER DEFAULT 0,
    total_work_items INTEGER DEFAULT 0,
    preferred_conversation_length INTEGER DEFAULT 3, -- Typical exchanges before creation
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversation Analytics - Track effectiveness and patterns
CREATE TABLE IF NOT EXISTS niv_conversation_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES niv_conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Conversation Metrics
    message_count INTEGER DEFAULT 0,
    discovery_exchanges INTEGER DEFAULT 0,
    strategy_exchanges INTEGER DEFAULT 0,
    creation_triggered BOOLEAN DEFAULT FALSE,
    
    -- Outcome Metrics
    work_items_generated INTEGER DEFAULT 0,
    user_satisfaction_score INTEGER CHECK (user_satisfaction_score BETWEEN 1 AND 5),
    conversation_rating INTEGER CHECK (conversation_rating BETWEEN 1 AND 5),
    
    -- Time Metrics
    time_to_strategy_phase INTERVAL,
    time_to_creation INTERVAL,
    total_conversation_time INTERVAL,
    
    -- Quality Metrics
    context_extraction_accuracy DECIMAL(3,2),
    strategic_value_score DECIMAL(3,2),
    
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============= ORGANIZATIONAL CONTEXT =============

-- Organization Niv Context - Company-wide strategic context and guidelines
CREATE TABLE IF NOT EXISTS niv_organization_context (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Company Information
    company_profile JSONB NOT NULL, -- Industry, size, stage, key info
    brand_guidelines JSONB DEFAULT '{}', -- Voice, tone, messaging principles
    standard_audiences JSONB DEFAULT '[]', -- Common target audiences
    
    -- Strategic Context
    competitive_landscape JSONB DEFAULT '{}', -- Key competitors and positioning
    key_differentiators JSONB DEFAULT '[]', -- What makes company unique
    typical_announcements JSONB DEFAULT '[]', -- Common types of news/announcements
    
    -- Communication Preferences
    preferred_media_outlets JSONB DEFAULT '[]', -- Target publications
    messaging_frameworks JSONB DEFAULT '{}', -- Standard messaging approaches
    content_templates JSONB DEFAULT '{}', -- Reusable templates and formats
    
    -- Constraints and Guidelines
    legal_constraints JSONB DEFAULT '[]', -- What to avoid or be careful about
    approval_requirements JSONB DEFAULT '{}', -- Who needs to approve what
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============= PERFORMANCE AND OPTIMIZATION =============

-- Indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_niv_conversations_user_id ON niv_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_niv_conversations_org_id ON niv_conversations(organization_id);
CREATE INDEX IF NOT EXISTS idx_niv_conversations_status ON niv_conversations(status);
CREATE INDEX IF NOT EXISTS idx_niv_conversations_phase ON niv_conversations(conversation_phase);
CREATE INDEX IF NOT EXISTS idx_niv_conversations_updated ON niv_conversations(updated_at);

CREATE INDEX IF NOT EXISTS idx_niv_messages_conversation_id ON niv_conversation_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_niv_messages_created_at ON niv_conversation_messages(created_at);

CREATE INDEX IF NOT EXISTS idx_niv_work_items_conversation_id ON niv_work_items(conversation_id);
CREATE INDEX IF NOT EXISTS idx_niv_work_items_user_id ON niv_work_items(user_id);
CREATE INDEX IF NOT EXISTS idx_niv_work_items_type ON niv_work_items(work_item_type);
CREATE INDEX IF NOT EXISTS idx_niv_work_items_status ON niv_work_items(status);
CREATE INDEX IF NOT EXISTS idx_niv_work_items_updated ON niv_work_items(updated_at);

CREATE INDEX IF NOT EXISTS idx_niv_context_conversation_id ON niv_strategic_context(conversation_id);
CREATE INDEX IF NOT EXISTS idx_niv_context_type ON niv_strategic_context(context_type);

-- Full-text search indexes for content discovery
CREATE INDEX IF NOT EXISTS idx_niv_messages_content_search ON niv_conversation_messages USING gin(to_tsvector('english', content));
CREATE INDEX IF NOT EXISTS idx_niv_work_items_search ON niv_work_items USING gin(to_tsvector('english', title || ' ' || description));

-- ============= ROW LEVEL SECURITY (RLS) =============

-- Enable RLS on all tables
ALTER TABLE niv_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE niv_conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE niv_strategic_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE niv_work_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE niv_work_item_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE niv_user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE niv_conversation_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE niv_organization_context ENABLE ROW LEVEL SECURITY;

-- Conversations: Users can access their own conversations or ones in their organization
CREATE POLICY "Users can access own conversations" ON niv_conversations
    FOR ALL USING (
        auth.uid() = user_id OR 
        organization_id IN (
            SELECT org_id FROM user_organizations 
            WHERE user_id = auth.uid()
        )
    );

-- Messages: Users can access messages from conversations they have access to
CREATE POLICY "Users can access messages from accessible conversations" ON niv_conversation_messages
    FOR ALL USING (
        conversation_id IN (
            SELECT id FROM niv_conversations 
            WHERE auth.uid() = user_id OR 
            organization_id IN (
                SELECT org_id FROM user_organizations 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Work Items: Users can access work items they created or from their organization
CREATE POLICY "Users can access own work items" ON niv_work_items
    FOR ALL USING (
        auth.uid() = user_id OR 
        organization_id IN (
            SELECT org_id FROM user_organizations 
            WHERE user_id = auth.uid()
        )
    );

-- Strategic Context: Same access as conversations
CREATE POLICY "Users can access strategic context from accessible conversations" ON niv_strategic_context
    FOR ALL USING (
        conversation_id IN (
            SELECT id FROM niv_conversations 
            WHERE auth.uid() = user_id OR 
            organization_id IN (
                SELECT org_id FROM user_organizations 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Work Item Revisions: Users can access revisions of work items they can access
CREATE POLICY "Users can access work item revisions" ON niv_work_item_revisions
    FOR ALL USING (
        work_item_id IN (
            SELECT id FROM niv_work_items 
            WHERE auth.uid() = user_id OR 
            organization_id IN (
                SELECT org_id FROM user_organizations 
                WHERE user_id = auth.uid()
            )
        )
    );

-- User Preferences: Users can only access their own preferences
CREATE POLICY "Users can access own preferences" ON niv_user_preferences
    FOR ALL USING (auth.uid() = user_id);

-- Conversation Analytics: Same access as conversations
CREATE POLICY "Users can access conversation analytics" ON niv_conversation_analytics
    FOR ALL USING (auth.uid() = user_id);

-- Organization Context: Users can access context from organizations they belong to
CREATE POLICY "Users can access organization context" ON niv_organization_context
    FOR ALL USING (
        organization_id IN (
            SELECT org_id FROM user_organizations 
            WHERE user_id = auth.uid()
        )
    );

-- ============= HELPER FUNCTIONS =============

-- Function to update conversation updated_at timestamp
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE niv_conversations 
    SET updated_at = NOW(), last_message_at = NOW() 
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update conversation timestamp when messages are added
CREATE TRIGGER update_conversation_on_message
    AFTER INSERT ON niv_conversation_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_timestamp();

-- Function to automatically update user preferences stats
CREATE OR REPLACE FUNCTION update_user_preferences_stats()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO niv_user_preferences (user_id, total_conversations, total_work_items)
    VALUES (NEW.user_id, 1, 0)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        total_conversations = niv_user_preferences.total_conversations + 1,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update user stats when conversations are created
CREATE TRIGGER update_user_stats_on_conversation
    AFTER INSERT ON niv_conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_user_preferences_stats();

-- Function to update work item stats
CREATE OR REPLACE FUNCTION update_user_work_item_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE niv_user_preferences 
    SET total_work_items = total_work_items + 1,
        updated_at = NOW()
    WHERE user_id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update user stats when work items are created
CREATE TRIGGER update_user_stats_on_work_item
    AFTER INSERT ON niv_work_items
    FOR EACH ROW
    EXECUTE FUNCTION update_user_work_item_stats();