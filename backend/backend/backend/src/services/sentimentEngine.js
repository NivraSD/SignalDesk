// SENTIMENT ANALYSIS ENGINE
// A rule-based sentiment analyzer that uses user-configured scenarios
// This replaces the unreliable Claude integration

class SentimentEngine {
  constructor() {
    this.debug = true;
  }

  // Main analysis function
  analyze(text, sentimentContext = null) {
    if (this.debug) {
      console.log('=== SENTIMENT ENGINE ANALYSIS ===');
      console.log('Text:', text.substring(0, 100) + '...');
      console.log('Has context:', !!sentimentContext);
    }

    // Normalize text for analysis
    const normalizedText = text.toLowerCase();
    const sentences = this.extractSentences(text);
    
    // Extract indicators from context or use defaults
    const indicators = this.extractIndicators(sentimentContext);
    
    // Analyze each aspect
    const positiveAnalysis = this.analyzeIndicators(normalizedText, sentences, indicators.positive, 'positive');
    const negativeAnalysis = this.analyzeIndicators(normalizedText, sentences, indicators.negative, 'negative');
    const criticalAnalysis = this.analyzeIndicators(normalizedText, sentences, indicators.critical, 'critical');
    
    // Calculate overall sentiment
    const sentimentResult = this.calculateSentiment(positiveAnalysis, negativeAnalysis, criticalAnalysis);
    
    // Build comprehensive analysis
    const analysis = {
      sentiment: sentimentResult.sentiment,
      sentiment_score: sentimentResult.score,
      confidence: sentimentResult.confidence,
      summary: this.generateSummary(sentimentResult, positiveAnalysis, negativeAnalysis, criticalAnalysis),
      rationale: this.generateRationale(positiveAnalysis, negativeAnalysis, criticalAnalysis),
      key_topics: this.extractKeyTopics(positiveAnalysis, negativeAnalysis, criticalAnalysis),
      urgency_level: this.determineUrgency(criticalAnalysis, negativeAnalysis),
      actionable_insights: this.generateInsights(sentimentResult, positiveAnalysis, negativeAnalysis, criticalAnalysis),
      recommended_action: this.recommendAction(sentimentResult, criticalAnalysis),
      analysis_engine: 'rule-based',
      matched_indicators: {
        positive: positiveAnalysis.matches,
        negative: negativeAnalysis.matches,
        critical: criticalAnalysis.matches
      }
    };

    if (this.debug) {
      console.log('Analysis result:', analysis);
    }

    return analysis;
  }

  // Extract sentences for context analysis
  extractSentences(text) {
    return text.match(/[^.!?]+[.!?]+/g) || [text];
  }

  // Extract indicators from sentiment context
  extractIndicators(sentimentContext) {
    const defaultIndicators = {
      positive: [
        'success', 'growth', 'innovation', 'improvement', 'achievement',
        'excellent', 'great', 'positive', 'increase', 'profit',
        'award', 'breakthrough', 'expansion', 'partnership', 'milestone'
      ],
      negative: [
        'failure', 'loss', 'issue', 'problem', 'concern',
        'decline', 'decrease', 'complaint', 'lawsuit', 'investigation',
        'breach', 'vulnerability', 'risk', 'threat', 'challenge'
      ],
      critical: [
        'scandal', 'fraud', 'breach', 'recall', 'bankruptcy',
        'criminal', 'arrest', 'indictment', 'collapse', 'crisis'
      ]
    };

    if (!sentimentContext) {
      return defaultIndicators;
    }

    const indicators = {
      positive: [...defaultIndicators.positive],
      negative: [...defaultIndicators.negative],
      critical: [...defaultIndicators.critical]
    };

    // Parse user-defined scenarios
    if (sentimentContext.positiveScenarios) {
      const customPositive = this.parseScenarios(sentimentContext.positiveScenarios);
      indicators.positive = [...new Set([...indicators.positive, ...customPositive])];
    }

    if (sentimentContext.negativeScenarios) {
      const customNegative = this.parseScenarios(sentimentContext.negativeScenarios);
      indicators.negative = [...new Set([...indicators.negative, ...customNegative])];
    }

    if (sentimentContext.criticalConcerns) {
      const customCritical = this.parseScenarios(sentimentContext.criticalConcerns);
      indicators.critical = [...new Set([...indicators.critical, ...customCritical])];
    }

    return indicators;
  }

  // Parse scenario text into indicator phrases
  parseScenarios(scenarioText) {
    const phrases = [];
    
    // Split by common delimiters
    const parts = scenarioText.split(/[,;\n•]/);
    
    for (const part of parts) {
      const cleaned = part.trim().toLowerCase();
      if (cleaned.length > 2) {
        // Add the full phrase
        phrases.push(cleaned);
        
        // Also add individual significant words (3+ chars)
        const words = cleaned.split(/\s+/).filter(w => w.length > 3);
        phrases.push(...words);
      }
    }
    
    return phrases;
  }

  // Analyze text for specific indicators
  analyzeIndicators(text, sentences, indicators, type) {
    const matches = [];
    const matchedSentences = [];
    let score = 0;

    for (const indicator of indicators) {
      if (text.includes(indicator)) {
        matches.push(indicator);
        
        // Find which sentences contain this indicator
        for (const sentence of sentences) {
          if (sentence.toLowerCase().includes(indicator)) {
            matchedSentences.push({
              sentence: sentence.trim(),
              indicator: indicator,
              type: type
            });
          }
        }
        
        // Score based on indicator length and specificity
        if (indicator.split(' ').length > 1) {
          score += 3; // Multi-word phrases are more specific
        } else {
          score += 1;
        }
      }
    }

    return {
      matches: matches,
      matchedSentences: matchedSentences,
      score: score,
      count: matches.length
    };
  }

  // Calculate overall sentiment from analysis
  calculateSentiment(positive, negative, critical) {
    // Critical indicators override everything
    if (critical.count > 0) {
      return {
        sentiment: 'negative',
        score: -80 - (critical.score * 5), // More critical = more negative
        confidence: 0.9
      };
    }

    const positiveScore = positive.score;
    const negativeScore = negative.score;
    const totalScore = positiveScore + negativeScore;

    if (totalScore === 0) {
      return {
        sentiment: 'neutral',
        score: 0,
        confidence: 0.3
      };
    }

    // Calculate net sentiment
    const netScore = positiveScore - negativeScore;
    const normalizedScore = Math.max(-100, Math.min(100, netScore * 10));

    let sentiment;
    if (Math.abs(netScore) < 2) {
      sentiment = 'mixed';
    } else if (netScore > 0) {
      sentiment = 'positive';
    } else {
      sentiment = 'negative';
    }

    // Confidence based on total matches
    const confidence = Math.min(0.9, 0.3 + (totalScore * 0.1));

    return {
      sentiment: sentiment,
      score: normalizedScore,
      confidence: confidence
    };
  }

  // Generate a summary of the analysis
  generateSummary(sentimentResult, positive, negative, critical) {
    if (critical.count > 0) {
      return `Critical concerns detected: ${critical.matches.join(', ')}`;
    }

    if (sentimentResult.sentiment === 'mixed') {
      return `Mixed sentiment with both positive (${positive.matches.length}) and negative (${negative.matches.length}) indicators`;
    }

    if (sentimentResult.sentiment === 'positive') {
      return `Positive sentiment detected with ${positive.matches.length} favorable indicators`;
    }

    if (sentimentResult.sentiment === 'negative') {
      return `Negative sentiment detected with ${negative.matches.length} concerning indicators`;
    }

    return 'Neutral sentiment - no clear indicators detected';
  }

  // Generate detailed rationale
  generateRationale(positive, negative, critical) {
    const parts = [];

    if (critical.matches.length > 0) {
      parts.push(`Critical issues identified: ${critical.matches.join(', ')}`);
    }

    if (positive.matches.length > 0) {
      parts.push(`Positive indicators: ${positive.matches.join(', ')}`);
    }

    if (negative.matches.length > 0) {
      parts.push(`Negative indicators: ${negative.matches.join(', ')}`);
    }

    if (parts.length === 0) {
      return 'No specific sentiment indicators were detected in the text';
    }

    return parts.join('. ');
  }

  // Extract key topics from matches
  extractKeyTopics(positive, negative, critical) {
    const allMatches = [
      ...positive.matches,
      ...negative.matches,
      ...critical.matches
    ];

    // Remove duplicates and sort by relevance
    return [...new Set(allMatches)].slice(0, 10);
  }

  // Determine urgency level
  determineUrgency(critical, negative) {
    if (critical.count > 0) {
      return 'critical';
    }
    if (negative.score > 5) {
      return 'high';
    }
    if (negative.score > 2) {
      return 'medium';
    }
    return 'low';
  }

  // Generate actionable insights
  generateInsights(sentimentResult, positive, negative, critical) {
    const insights = [];

    if (critical.count > 0) {
      insights.push('Immediate attention required for critical issues');
    }

    if (negative.score > positive.score * 2) {
      insights.push('Significant negative sentiment requires intervention');
    }

    if (positive.score > negative.score * 2) {
      insights.push('Strong positive sentiment - opportunity for amplification');
    }

    if (sentimentResult.sentiment === 'mixed') {
      insights.push('Mixed sentiment suggests need for balanced response');
    }

    return insights.length > 0 ? insights.join('; ') : null;
  }

  // Recommend action based on analysis
  recommendAction(sentimentResult, critical) {
    if (critical.count > 0) {
      return 'Escalate to crisis management team immediately';
    }

    switch (sentimentResult.sentiment) {
      case 'negative':
        return 'Monitor closely and prepare response strategy';
      case 'positive':
        return 'Consider amplifying positive message';
      case 'mixed':
        return 'Address concerns while highlighting positives';
      default:
        return null;
    }
  }
}

module.exports = new SentimentEngine();