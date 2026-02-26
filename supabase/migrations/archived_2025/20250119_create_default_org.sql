-- Create a default organization for testing/development
-- This allows strategies to be saved when no organization is selected

-- First, check if the organization already exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM organizations WHERE id = '00000000-0000-0000-0000-000000000000') THEN
    INSERT INTO organizations (
      id,
      name,
      domain,
      industry,
      size,
      config,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      'Default Organization',
      'default.local',
      'Technology',
      'Small',
      '{}',
      NOW(),
      NOW()
    );
  END IF;
END $$;

-- Also create an OpenAI organization entry since that's being used throughout the flow
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM organizations WHERE name = 'OpenAI') THEN
    INSERT INTO organizations (
      name,
      domain,
      industry,
      size,
      config,
      created_at,
      updated_at
    ) VALUES (
      'OpenAI',
      'openai.com',
      'Technology',
      'Large',
      '{}',
      NOW(),
      NOW()
    );
  END IF;
END $$;

-- Also make the organization_id nullable if it isn't already
ALTER TABLE niv_strategies
ALTER COLUMN organization_id DROP NOT NULL;

-- Verify the organizations were created
SELECT * FROM organizations WHERE id = '00000000-0000-0000-0000-000000000000' OR name = 'OpenAI';