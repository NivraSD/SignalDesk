// Content Orchestrator Service
// Handles multi-step content generation through NIV Content Orchestrator

interface OrchestratorRequest {
  prompt: string;
  mode?: 'quick' | 'campaign' | 'companion' | 'presentation' | 'research';
  contentType?: string;
  conversation?: any[];
  organization?: any;
  organizationId?: string;
  framework?: any;
  metadata?: any;
}

// Detect if request needs orchestration (multiple content types)
export function needsOrchestration(prompt: string): boolean {
  const promptLower = prompt.toLowerCase();

  // Multi-content patterns that need orchestration
  const orchestrationPatterns = [
    'media plan',
    'media campaign',
    'pr campaign',
    'launch campaign',
    'crisis response',
    'announcement package',
    'content package',
    'multiple',
    'campaign',
    'complete plan',
    'all content',
    'full suite'
  ];

  // Check if prompt mentions multiple content types
  const contentTypes = [
    'press release',
    'social',
    'email',
    'blog',
    'media list',
    'pitch',
    'talking points'
  ];

  const mentionedTypes = contentTypes.filter(type => promptLower.includes(type));
  if (mentionedTypes.length >= 2) {
    return true;
  }

  // Check for orchestration patterns
  return orchestrationPatterns.some(pattern => promptLower.includes(pattern));
}

// Call the orchestrator API
export async function orchestrateContent(request: OrchestratorRequest) {
  try {
    const response = await fetch('/api/content/orchestrate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Orchestration failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Orchestration error:', error);
    throw error;
  }
}

// Generate single content type
export async function generateSingleContent(contentType: string, data: any) {
  try {
    // Map content types to API endpoints
    const endpointMap: { [key: string]: string } = {
      'press-release': '/api/content/press-release',
      'blog-post': '/api/content/blog-post',
      'social-post': '/api/content/social-post',
      'email-campaign': '/api/content/email-campaign',
      'media-pitch': '/api/content/media-pitch',
      'executive-statement': '/api/content/executive-statement',
      'thought-leadership': '/api/content/thought-leadership',
      'qa-document': '/api/content/qa-document',
      'crisis-response': '/api/content/crisis-response',
      'messaging-framework': '/api/content/messaging-framework'
    };

    const endpoint = endpointMap[contentType] || '/api/content/blog-post';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Content generation failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Content generation error:', error);
    throw error;
  }
}

// Main function to handle AI content generation
export async function generateAIContent(data: any) {
  const { prompt, type, ...rest } = data;

  // Check if this needs orchestration
  if (needsOrchestration(prompt)) {
    console.log('🎯 Detected multi-content request, using orchestrator...');

    return await orchestrateContent({
      prompt,
      contentType: type,
      organization: {
        name: data.companyName,
        industry: data.industry,
        description: data.companyDescription
      },
      organizationId: data.projectId,
      metadata: rest
    });
  } else {
    // Single content generation
    console.log('📝 Single content request, using direct generation...');
    return await generateSingleContent(type, data);
  }
}

// Export individual functions for backward compatibility
export { generateSingleContent as generateContent };
export default {
  orchestrateContent,
  generateSingleContent,
  generateAIContent,
  needsOrchestration
};