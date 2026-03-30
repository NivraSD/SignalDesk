-- Update AI model keywords to track latest and upcoming releases
-- Date: October 24, 2025

-- OpenAI: Add GPT-5 (released), o3, Sora 2.0
UPDATE mcp_discovery
SET keywords = ARRAY[
  'OpenAI',
  'ChatGPT',
  'GPT-4o',
  'GPT-4o-mini',
  'GPT-4.5',
  'GPT-5', -- RELEASED
  'o1',
  'o1-preview',
  'o1-mini',
  'o3', -- Upcoming
  'Sora',
  'Sora 2.0',
  'Sora video model',
  'DALL-E',
  'Whisper'
]
WHERE organization_name = 'OpenAI';

-- Anthropic: Focus on Claude 4 family only (remove legacy 3.5 models)
UPDATE mcp_discovery
SET keywords = ARRAY[
  'Anthropic',
  'Claude',
  'Claude 3.7 Sonnet', -- Recent
  'Claude Sonnet 4', -- Recent
  'Claude Sonnet 4.5', -- LATEST
  'Claude Opus 4', -- Upcoming
  'Claude 4',
  'Claude AI',
  'Constitutional AI'
]
WHERE organization_name = 'Anthropic';

-- Google/DeepMind: Add Gemini 2.0 (released), Gemini 3.0 (upcoming)
UPDATE mcp_discovery
SET keywords = ARRAY[
  'Google',
  'Google AI',
  'DeepMind',
  'Gemini',
  'Gemini 1.5',
  'Gemini 1.5 Pro',
  'Gemini 1.5 Flash',
  'Gemini 2.0', -- RELEASED
  'Gemini 2.0 Pro',
  'Gemini 2.0 Flash',
  'Gemini 2.0 Ultra',
  'Gemini 3.0', -- UPCOMING - track for announcements
  'Gemini Ultra',
  'Gemini Pro',
  'Gemini Flash',
  'Gemini Nano',
  'PaLM',
  'Bard'
]
WHERE organization_name = 'Google';

-- Meta: Add Llama 4 tracking
UPDATE mcp_discovery
SET keywords = ARRAY[
  'Meta',
  'Meta AI',
  'Llama',
  'Llama 3',
  'Llama 3.1',
  'Llama 3.2',
  'Llama 3.3',
  'Llama 4', -- Upcoming - track for announcements
  'Llama-4',
  'Meta Llama',
  'PyTorch'
]
WHERE organization_name = 'Meta';

-- Microsoft: Add Copilot updates
UPDATE mcp_discovery
SET keywords = ARRAY[
  'Microsoft',
  'Microsoft AI',
  'Copilot',
  'GitHub Copilot',
  'Microsoft 365 Copilot',
  'Azure OpenAI',
  'Azure AI',
  'Bing Chat',
  'Microsoft Designer'
]
WHERE organization_name = 'Microsoft' OR organization_name LIKE '%Microsoft%';

-- Amazon: Add latest Bedrock models
UPDATE mcp_discovery
SET keywords = ARRAY[
  'Amazon',
  'AWS',
  'Amazon Bedrock',
  'Titan',
  'Amazon Q',
  'AWS AI',
  'SageMaker',
  'CodeWhisperer'
]
WHERE organization_name = 'Amazon' OR organization_name LIKE '%Amazon%';

-- Verify updates
SELECT
  organization_name,
  array_length(keywords, 1) as keyword_count,
  keywords[1:5] as sample_keywords
FROM mcp_discovery
WHERE organization_name IN ('OpenAI', 'Anthropic', 'Google', 'Meta', 'Microsoft', 'Amazon')
ORDER BY organization_name;
