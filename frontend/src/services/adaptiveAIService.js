// Simplified Adaptive AI Service with minimal functionality
class AdaptiveAIService {
  constructor() {
    this.conversationState = {
      mode: 'general',
      activeFeature: null,
      contentContext: {
        type: null,
        topic: null,
        keyPoints: []
      }
    };
  }

  // Minimal reset
  reset() {
    this.conversationState = {
      mode: 'general',
      activeFeature: null,
      contentContext: {
        type: null,
        topic: null,
        keyPoints: []
      }
    };
  }

  // Only method to set active feature
  setActiveFeature(featureId) {
    this.conversationState.activeFeature = featureId;
  }

  // Minimal message processing - always default to natural conversation
  processMessage(message, hasGeneratedContent = false) {
    return {
      action: 'chat',
      response: {
        type: 'natural',
        message: null
      }
    };
  }
}

export default new AdaptiveAIService();