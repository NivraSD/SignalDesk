// Embedding Service for Vector Generation
const axios = require('axios');

class EmbeddingService {
  constructor() {
    this.provider = process.env.EMBEDDING_PROVIDER || 'openai';
    this.apiKey = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY;
    this.model = this.getEmbeddingModel();
    this.cache = new Map(); // Simple in-memory cache
  }

  getEmbeddingModel() {
    const models = {
      openai: 'text-embedding-ada-002',
      anthropic: 'claude-3-haiku', // Anthropic doesn't have dedicated embedding models yet
      huggingface: 'sentence-transformers/all-MiniLM-L6-v2',
      local: 'all-MiniLM-L6-v2'
    };
    
    return models[this.provider] || models.openai;
  }

  async generateEmbedding(text, options = {}) {
    // Check cache first
    const cacheKey = this.getCacheKey(text);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      let embedding;
      
      switch (this.provider) {
        case 'openai':
          embedding = await this.generateOpenAIEmbedding(text);
          break;
        case 'anthropic':
          embedding = await this.generateAnthropicEmbedding(text);
          break;
        case 'huggingface':
          embedding = await this.generateHuggingFaceEmbedding(text);
          break;
        case 'local':
          embedding = await this.generateLocalEmbedding(text);
          break;
        default:
          throw new Error(`Unknown embedding provider: ${this.provider}`);
      }
      
      // Cache the result
      this.cache.set(cacheKey, embedding);
      
      // Limit cache size
      if (this.cache.size > 1000) {
        const firstKey = this.cache.keys().next().value;
        this.cache.delete(firstKey);
      }
      
      return embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      // Fallback to local embedding if API fails
      if (this.provider !== 'local') {
        console.log('Falling back to local embedding...');
        return await this.generateLocalEmbedding(text);
      }
      throw error;
    }
  }

  async generateOpenAIEmbedding(text) {
    const response = await axios.post(
      'https://api.openai.com/v1/embeddings',
      {
        input: text,
        model: this.model
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data.data[0].embedding;
  }

  async generateAnthropicEmbedding(text) {
    // Anthropic doesn't have a dedicated embedding API yet
    // We'll use a workaround by extracting features using Claude
    const Anthropic = require('@anthropic-ai/sdk');
    const anthropic = new Anthropic({
      apiKey: this.apiKey
    });
    
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 100,
      messages: [{
        role: 'user',
        content: `Generate a semantic embedding representation for: "${text}". Return only numbers separated by commas, no explanation.`
      }]
    });
    
    // Parse the response and convert to embedding vector
    const numbers = response.content[0].text.split(',').map(n => parseFloat(n.trim()));
    return this.normalizeVector(numbers);
  }

  async generateHuggingFaceEmbedding(text) {
    const response = await axios.post(
      `https://api-inference.huggingface.co/models/${this.model}`,
      {
        inputs: text
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data;
  }

  async generateLocalEmbedding(text) {
    // Use a local embedding model (requires additional setup)
    // This is a simplified version - in production, use a proper local model
    
    // Simple TF-IDF-like embedding (placeholder)
    const words = text.toLowerCase().split(/\s+/);
    const vocab = this.getVocabulary();
    const vector = new Array(384).fill(0); // Standard embedding size
    
    words.forEach(word => {
      const hash = this.hashWord(word);
      const index = Math.abs(hash) % vector.length;
      vector[index] += 1;
    });
    
    return this.normalizeVector(vector);
  }

  async generateBatchEmbeddings(texts, options = {}) {
    const batchSize = options.batchSize || 100;
    const embeddings = [];
    
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchEmbeddings = await Promise.all(
        batch.map(text => this.generateEmbedding(text))
      );
      embeddings.push(...batchEmbeddings);
    }
    
    return embeddings;
  }

  normalizeVector(vector) {
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return vector.map(val => val / magnitude);
  }

  getCacheKey(text) {
    const crypto = require('crypto');
    return crypto.createHash('md5').update(text).digest('hex');
  }

  hashWord(word) {
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
      const char = word.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash;
  }

  getVocabulary() {
    // In production, load a proper vocabulary
    return [];
  }

  async compareEmbeddings(embedding1, embedding2) {
    // Cosine similarity
    const dotProduct = embedding1.reduce((sum, val, i) => sum + val * embedding2[i], 0);
    const magnitude1 = Math.sqrt(embedding1.reduce((sum, val) => sum + val * val, 0));
    const magnitude2 = Math.sqrt(embedding2.reduce((sum, val) => sum + val * val, 0));
    
    return dotProduct / (magnitude1 * magnitude2);
  }

  async findSimilar(embedding, embeddings, threshold = 0.7) {
    const similarities = await Promise.all(
      embeddings.map(async (emb, index) => ({
        index,
        similarity: await this.compareEmbeddings(embedding, emb)
      }))
    );
    
    return similarities
      .filter(s => s.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity);
  }

  clearCache() {
    this.cache.clear();
  }
}

module.exports = new EmbeddingService();