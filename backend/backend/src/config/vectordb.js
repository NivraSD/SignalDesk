// Vector Database Configuration
// Supports multiple providers: ChromaDB, Pinecone, Weaviate

const dotenv = require('dotenv');
dotenv.config();

class VectorDBConfig {
  constructor() {
    this.provider = process.env.VECTOR_DB_PROVIDER || 'chromadb';
    this.config = this.getProviderConfig();
  }

  getProviderConfig() {
    const configs = {
      chromadb: {
        name: 'ChromaDB',
        host: process.env.CHROMADB_HOST || 'http://localhost:8000',
        apiKey: process.env.CHROMADB_API_KEY,
        collection: process.env.CHROMADB_COLLECTION || 'signaldesk_memoryvault',
        embeddingModel: 'all-MiniLM-L6-v2',
        dimensions: 384,
        settings: {
          anonymized_telemetry: false,
          allow_reset: process.env.NODE_ENV === 'development'
        }
      },
      pinecone: {
        name: 'Pinecone',
        apiKey: process.env.PINECONE_API_KEY,
        environment: process.env.PINECONE_ENVIRONMENT || 'us-east-1',
        indexName: process.env.PINECONE_INDEX || 'signaldesk-memoryvault',
        namespace: process.env.PINECONE_NAMESPACE || 'default',
        dimensions: 1536, // OpenAI embeddings
        metric: 'cosine',
        settings: {
          replicas: 1,
          shards: 1
        }
      },
      weaviate: {
        name: 'Weaviate',
        host: process.env.WEAVIATE_HOST || 'http://localhost:8080',
        apiKey: process.env.WEAVIATE_API_KEY,
        className: 'MemoryVaultDocument',
        vectorizer: 'text2vec-openai',
        dimensions: 1536,
        settings: {
          vectorIndexType: 'hnsw',
          vectorIndexConfig: {
            distance: 'cosine',
            efConstruction: 128,
            maxConnections: 64
          }
        }
      }
    };

    return configs[this.provider] || configs.chromadb;
  }

  async testConnection() {
    console.log(`🔍 Testing connection to ${this.config.name}...`);
    
    try {
      switch (this.provider) {
        case 'chromadb':
          return await this.testChromaDB();
        case 'pinecone':
          return await this.testPinecone();
        case 'weaviate':
          return await this.testWeaviate();
        default:
          throw new Error(`Unknown vector DB provider: ${this.provider}`);
      }
    } catch (error) {
      console.error(`❌ Vector DB connection failed:`, error.message);
      return false;
    }
  }

  async testChromaDB() {
    const { ChromaClient } = require('chromadb');
    const client = new ChromaClient({
      path: this.config.host
    });
    
    try {
      const heartbeat = await client.heartbeat();
      console.log(`✅ ChromaDB connected: ${heartbeat}`);
      return true;
    } catch (error) {
      console.error('ChromaDB connection error:', error);
      return false;
    }
  }

  async testPinecone() {
    const { PineconeClient } = require('@pinecone-database/pinecone');
    const client = new PineconeClient();
    
    try {
      await client.init({
        apiKey: this.config.apiKey,
        environment: this.config.environment
      });
      
      const indexes = await client.listIndexes();
      console.log(`✅ Pinecone connected. Indexes: ${indexes.join(', ')}`);
      return true;
    } catch (error) {
      console.error('Pinecone connection error:', error);
      return false;
    }
  }

  async testWeaviate() {
    const weaviate = require('weaviate-ts-client');
    const client = weaviate.client({
      scheme: 'http',
      host: this.config.host.replace('http://', ''),
      apiKey: this.config.apiKey ? new weaviate.ApiKey(this.config.apiKey) : null
    });
    
    try {
      const schema = await client.schema.getter().do();
      console.log(`✅ Weaviate connected. Classes: ${schema.classes?.length || 0}`);
      return true;
    } catch (error) {
      console.error('Weaviate connection error:', error);
      return false;
    }
  }

  getEmbeddingDimensions() {
    return this.config.dimensions;
  }

  getProviderName() {
    return this.config.name;
  }
}

module.exports = new VectorDBConfig();