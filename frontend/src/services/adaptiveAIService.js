/**
 * SIMPLIFIED AI Service - Backend handles ALL conversation logic
 * NO LOCAL PROCESSING - Just API calls
 */

class AdaptiveAIService {
  constructor() {
    // Use Supabase functions for AI services
    this.apiUrl = process.env.REACT_APP_SUPABASE_URL || 'https://zskaxjtyuaqazydouifp.supabase.co';
    console.log('AdaptiveAIService initialized with Supabase URL:', this.apiUrl);
  }

  // Process message - just returns whatever type of response for compatibility
  processMessage(message, hasGeneratedContent = false) {
    console.log('AdaptiveAIService.processMessage - returning neutral response for:', message);
    
    // Return a neutral response that won't trigger any special handling
    return {
      action: 'chat',
      response: {
        type: 'natural',
        message: null // Let backend handle everything
      }
    };
  }

  // For any other methods that might be called
  formatTipsMessage() {
    return '';
  }

  detectContentType() {
    return null;
  }

  detectFeature() {
    return null;
  }
}

// Export singleton instance
const adaptiveAI = new AdaptiveAIService();
export default adaptiveAI;