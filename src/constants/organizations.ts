// Organization constants for the application

// Default organization UUID for when no organization is selected
export const DEFAULT_ORG_UUID = '00000000-0000-0000-0000-000000000000'

// Default organization object
export const DEFAULT_ORGANIZATION = {
  id: DEFAULT_ORG_UUID,
  name: 'Default Organization',
  domain: 'default.local',
  industry: 'Technology',
  size: 'Small'
}

// OpenAI organization for testing
// Note: This should be fetched from the database in production
export const OPENAI_ORGANIZATION = {
  name: 'OpenAI',
  domain: 'openai.com',
  industry: 'Technology',
  size: 'Large'
}