/**
 * SIMPLIFIED AI Service - Backend handles ALL conversation logic
 * NO LOCAL PROCESSING - Just API calls
 */

class AdaptiveAIService {
  constructor() {
    // Hardcoded URL - no more environment variable issues
    this.apiUrl = 'https://signaldesk-production.up.railway.app/api';
    console.log('AdaptiveAIService initialized with:', this.apiUrl);
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