// Enhanced MemoryVault Service with Versioning, Semantic Search, and Relationships
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const db = require('../../config/db');

class MemoryVaultService {
  constructor() {
    this.vectorDB = null;
    this.embeddingService = null;
    this.initializeServices();
  }

  async initializeServices() {
    // Initialize vector database
    const vectorConfig = require('../../config/vectordb');
    await vectorConfig.testConnection();
    
    // Initialize embedding service
    this.embeddingService = require('./EmbeddingService');
  }

  // ==================== VERSIONING SYSTEM ====================
  
  async createVersion(itemId, content, userId, changeType = 'update') {
    try {
      // Get current version number
      const currentVersion = await db.query(
        'SELECT MAX(version_number) as max_version FROM memoryvault_versions WHERE item_id = $1',
        [itemId]
      );
      
      const versionNumber = (currentVersion.rows[0]?.max_version || 0) + 1;
      
      // Generate diff if this is an update
      let diff = null;
      if (versionNumber > 1) {
        const previousVersion = await this.getVersion(itemId, versionNumber - 1);
        diff = this.generateDiff(previousVersion.content, content);
      }
      
      // Store version
      const result = await db.query(
        `INSERT INTO memoryvault_versions 
         (id, item_id, version_number, content, changed_by, change_type, diff, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
         RETURNING *`,
        [uuidv4(), itemId, versionNumber, content, userId, changeType, diff]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error creating version:', error);
      throw error;
    }
  }

  async getVersion(itemId, versionNumber) {
    const result = await db.query(
      'SELECT * FROM memoryvault_versions WHERE item_id = $1 AND version_number = $2',
      [itemId, versionNumber]
    );
    return result.rows[0];
  }

  async getVersionHistory(itemId, limit = 10) {
    const result = await db.query(
      `SELECT v.*, u.name as changed_by_name 
       FROM memoryvault_versions v
       LEFT JOIN users u ON v.changed_by = u.id
       WHERE v.item_id = $1
       ORDER BY v.version_number DESC
       LIMIT $2`,
      [itemId, limit]
    );
    return result.rows;
  }

  async rollbackToVersion(itemId, versionNumber, userId) {
    const version = await this.getVersion(itemId, versionNumber);
    if (!version) {
      throw new Error('Version not found');
    }
    
    // Create new version with rollback content
    await this.createVersion(itemId, version.content, userId, 'rollback');
    
    // Update main item
    await db.query(
      'UPDATE memoryvault_items SET content = $1, updated_at = NOW() WHERE id = $2',
      [version.content, itemId]
    );
    
    return version;
  }

  generateDiff(oldContent, newContent) {
    // Simple diff implementation - in production, use a proper diff library
    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');
    const diff = {
      additions: [],
      deletions: [],
      modifications: []
    };
    
    // Track changes (simplified)
    newLines.forEach((line, index) => {
      if (!oldLines.includes(line)) {
        diff.additions.push({ line: index + 1, content: line });
      }
    });
    
    oldLines.forEach((line, index) => {
      if (!newLines.includes(line)) {
        diff.deletions.push({ line: index + 1, content: line });
      }
    });
    
    return diff;
  }

  // ==================== SEMANTIC SEARCH ====================
  
  async semanticSearch(query, options = {}) {
    const {
      limit = 10,
      threshold = 0.7,
      projectId = null,
      documentType = null
    } = options;
    
    try {
      // Generate embedding for query
      const queryEmbedding = await this.embeddingService.generateEmbedding(query);
      
      // Search in vector database
      const results = await this.searchVectorDB(queryEmbedding, {
        limit,
        threshold,
        filter: this.buildSearchFilter(projectId, documentType)
      });
      
      // Enrich results with metadata
      const enrichedResults = await this.enrichSearchResults(results);
      
      // Rank by relevance
      return this.rankResults(enrichedResults, query);
    } catch (error) {
      console.error('Semantic search error:', error);
      throw error;
    }
  }

  async searchVectorDB(embedding, options) {
    // Implementation depends on vector DB provider
    // This is a placeholder - actual implementation will vary
    const vectorConfig = require('../../config/vectordb');
    
    switch (vectorConfig.provider) {
      case 'chromadb':
        return await this.searchChromaDB(embedding, options);
      case 'pinecone':
        return await this.searchPinecone(embedding, options);
      case 'weaviate':
        return await this.searchWeaviate(embedding, options);
      default:
        throw new Error('Vector DB provider not configured');
    }
  }

  async searchChromaDB(embedding, options) {
    // ChromaDB search implementation
    const { ChromaClient } = require('chromadb');
    const client = new ChromaClient();
    const collection = await client.getCollection('memoryvault');
    
    const results = await collection.query({
      queryEmbeddings: [embedding],
      nResults: options.limit,
      where: options.filter
    });
    
    return results;
  }

  buildSearchFilter(projectId, documentType) {
    const filter = {};
    if (projectId) filter.project_id = projectId;
    if (documentType) filter.type = documentType;
    return filter;
  }

  async enrichSearchResults(results) {
    // Add metadata from database
    const enriched = await Promise.all(results.map(async (result) => {
      const metadata = await db.query(
        'SELECT * FROM memoryvault_items WHERE id = $1',
        [result.id]
      );
      return {
        ...result,
        metadata: metadata.rows[0]
      };
    }));
    
    return enriched;
  }

  rankResults(results, query) {
    // Advanced ranking algorithm
    return results.sort((a, b) => {
      // Combine vector similarity with other factors
      const scoreA = this.calculateRelevanceScore(a, query);
      const scoreB = this.calculateRelevanceScore(b, query);
      return scoreB - scoreA;
    });
  }

  calculateRelevanceScore(result, query) {
    let score = result.similarity || 0;
    
    // Boost recent documents
    const age = Date.now() - new Date(result.metadata?.created_at).getTime();
    const recencyBoost = Math.max(0, 1 - (age / (30 * 24 * 60 * 60 * 1000))); // 30 days
    score += recencyBoost * 0.1;
    
    // Boost if query terms appear in title
    if (result.metadata?.name) {
      const titleMatch = query.toLowerCase().split(' ').some(term => 
        result.metadata.name.toLowerCase().includes(term)
      );
      if (titleMatch) score += 0.2;
    }
    
    return score;
  }

  // ==================== RELATIONSHIP MAPPING ====================
  
  async createRelationship(sourceId, targetId, relationshipType, metadata = {}) {
    try {
      const id = uuidv4();
      const result = await db.query(
        `INSERT INTO memoryvault_relationships 
         (id, source_item_id, target_item_id, relationship_type, metadata, strength, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         RETURNING *`,
        [id, sourceId, targetId, relationshipType, metadata, this.calculateRelationshipStrength(metadata)]
      );
      
      // Update vector embeddings to reflect relationship
      await this.updateRelationshipEmbeddings(sourceId, targetId);
      
      return result.rows[0];
    } catch (error) {
      console.error('Error creating relationship:', error);
      throw error;
    }
  }

  async getRelationships(itemId, options = {}) {
    const { type = null, direction = 'both', limit = 50 } = options;
    
    let query = `
      SELECT r.*, 
             s.name as source_name, s.type as source_type,
             t.name as target_name, t.type as target_type
      FROM memoryvault_relationships r
      JOIN memoryvault_items s ON r.source_item_id = s.id
      JOIN memoryvault_items t ON r.target_item_id = t.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (direction === 'outgoing' || direction === 'both') {
      query += ` AND r.source_item_id = $${++paramCount}`;
      params.push(itemId);
    }
    
    if (direction === 'incoming' || direction === 'both') {
      if (direction === 'both') query += ' OR';
      else query += ' AND';
      query += ` r.target_item_id = $${++paramCount}`;
      params.push(itemId);
    }
    
    if (type) {
      query += ` AND r.relationship_type = $${++paramCount}`;
      params.push(type);
    }
    
    query += ` ORDER BY r.strength DESC, r.created_at DESC LIMIT $${++paramCount}`;
    params.push(limit);
    
    const result = await db.query(query, params);
    return result.rows;
  }

  async getRelationshipGraph(itemId, depth = 2) {
    const visited = new Set();
    const graph = {
      nodes: [],
      edges: []
    };
    
    await this.buildGraph(itemId, depth, visited, graph);
    return graph;
  }

  async buildGraph(itemId, depth, visited, graph) {
    if (depth === 0 || visited.has(itemId)) return;
    
    visited.add(itemId);
    
    // Add node
    const item = await this.getItem(itemId);
    graph.nodes.push({
      id: itemId,
      name: item.name,
      type: item.type,
      metadata: item.metadata
    });
    
    // Get relationships
    const relationships = await this.getRelationships(itemId);
    
    for (const rel of relationships) {
      // Add edge
      graph.edges.push({
        source: rel.source_item_id,
        target: rel.target_item_id,
        type: rel.relationship_type,
        strength: rel.strength
      });
      
      // Recursively build graph
      const nextId = rel.source_item_id === itemId ? rel.target_item_id : rel.source_item_id;
      await this.buildGraph(nextId, depth - 1, visited, graph);
    }
  }

  calculateRelationshipStrength(metadata) {
    // Calculate strength based on various factors
    let strength = 0.5; // Base strength
    
    if (metadata.references_count) {
      strength += Math.min(metadata.references_count * 0.1, 0.3);
    }
    
    if (metadata.co_occurrence_count) {
      strength += Math.min(metadata.co_occurrence_count * 0.05, 0.2);
    }
    
    if (metadata.user_defined) {
      strength = Math.max(strength, 0.8);
    }
    
    return Math.min(strength, 1.0);
  }

  async updateRelationshipEmbeddings(sourceId, targetId) {
    // Update embeddings to reflect new relationship
    // This helps related documents appear in semantic search
    // Implementation depends on embedding strategy
  }

  async discoverRelationships(itemId) {
    // Automatically discover potential relationships
    const item = await this.getItem(itemId);
    const discoveries = [];
    
    // Find similar documents
    const similar = await this.semanticSearch(item.content, {
      limit: 10,
      threshold: 0.8
    });
    
    for (const sim of similar) {
      if (sim.id !== itemId) {
        discoveries.push({
          targetId: sim.id,
          type: 'similar_content',
          confidence: sim.similarity,
          metadata: {
            discovered_at: new Date(),
            discovery_method: 'semantic_similarity'
          }
        });
      }
    }
    
    // Find documents with shared entities
    const entities = await this.extractEntities(item.content);
    const sharedEntityDocs = await this.findDocumentsWithEntities(entities);
    
    for (const doc of sharedEntityDocs) {
      if (doc.id !== itemId) {
        discoveries.push({
          targetId: doc.id,
          type: 'shared_entity',
          confidence: doc.shared_count / entities.length,
          metadata: {
            shared_entities: doc.shared_entities,
            discovery_method: 'entity_extraction'
          }
        });
      }
    }
    
    return discoveries;
  }

  // ==================== CORE MEMORYVAULT OPERATIONS ====================
  
  async createItem(data) {
    const id = uuidv4();
    const { projectId, name, type, content, metadata = {} } = data;
    
    // Generate embedding
    const embedding = await this.embeddingService.generateEmbedding(content);
    
    // Store in database
    const result = await db.query(
      `INSERT INTO memoryvault_items 
       (id, project_id, name, type, content, metadata, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING *`,
      [id, projectId, name, type, content, metadata]
    );
    
    // Store in vector database
    await this.storeInVectorDB(id, embedding, metadata);
    
    // Create initial version
    await this.createVersion(id, content, metadata.userId || null, 'create');
    
    return result.rows[0];
  }

  async updateItem(itemId, updates, userId) {
    const { content, metadata } = updates;
    
    // Create version before updating
    if (content) {
      await this.createVersion(itemId, content, userId, 'update');
    }
    
    // Update database
    const result = await db.query(
      `UPDATE memoryvault_items 
       SET content = COALESCE($1, content),
           metadata = COALESCE($2, metadata),
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [content, metadata, itemId]
    );
    
    // Update vector database if content changed
    if (content) {
      const embedding = await this.embeddingService.generateEmbedding(content);
      await this.updateInVectorDB(itemId, embedding);
    }
    
    return result.rows[0];
  }

  async getItem(itemId) {
    const result = await db.query(
      'SELECT * FROM memoryvault_items WHERE id = $1',
      [itemId]
    );
    return result.rows[0];
  }

  async deleteItem(itemId, userId) {
    // Soft delete - create final version
    await this.createVersion(itemId, '', userId, 'delete');
    
    // Remove from vector database
    await this.deleteFromVectorDB(itemId);
    
    // Delete from database (cascades to versions and relationships)
    await db.query('DELETE FROM memoryvault_items WHERE id = $1', [itemId]);
  }

  // Placeholder methods for vector DB operations
  async storeInVectorDB(id, embedding, metadata) {
    // Implementation depends on vector DB provider
  }

  async updateInVectorDB(id, embedding) {
    // Implementation depends on vector DB provider
  }

  async deleteFromVectorDB(id) {
    // Implementation depends on vector DB provider
  }

  async extractEntities(content) {
    // Entity extraction logic
    return [];
  }

  async findDocumentsWithEntities(entities) {
    // Find documents containing specified entities
    return [];
  }
}

module.exports = new MemoryVaultService();