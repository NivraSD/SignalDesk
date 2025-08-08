// In-memory storage for document relationships
let relationships = [];
let nextRelationshipId = 1;

const RELATIONSHIP_TYPES = {
  REFERENCES: 'references',
  DERIVED_FROM: 'derived_from',
  RELATED_TO: 'related_to',
  PARENT_CHILD: 'parent_child',
  ALTERNATIVE_VERSION: 'alternative_version',
  CONTRADICTS: 'contradicts',
  SUPPORTS: 'supports'
};

module.exports = function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // GET - Get relationships for an item
  if (req.method === 'GET') {
    const { itemId, includeIndirect = false } = req.query;
    
    if (!itemId) {
      return res.status(400).json({
        success: false,
        error: 'Item ID is required'
      });
    }
    
    const id = parseInt(itemId);
    
    // Direct relationships (item is source or target)
    let itemRelationships = relationships.filter(
      r => r.source_item_id === id || r.target_item_id === id
    );
    
    // Include indirect relationships (2nd degree connections)
    if (includeIndirect === 'true') {
      const relatedIds = itemRelationships.map(r => 
        r.source_item_id === id ? r.target_item_id : r.source_item_id
      );
      
      const indirectRelationships = relationships.filter(r => 
        (relatedIds.includes(r.source_item_id) || relatedIds.includes(r.target_item_id)) &&
        r.source_item_id !== id && r.target_item_id !== id
      ).map(r => ({ ...r, indirect: true }));
      
      itemRelationships = [...itemRelationships, ...indirectRelationships];
    }
    
    // Group by relationship type
    const grouped = itemRelationships.reduce((acc, rel) => {
      const type = rel.relationship_type;
      if (!acc[type]) acc[type] = [];
      acc[type].push(rel);
      return acc;
    }, {});
    
    return res.status(200).json({
      success: true,
      relationships: itemRelationships,
      grouped,
      count: itemRelationships.length,
      relationship_types: Object.keys(grouped)
    });
  }
  
  // POST - Create a relationship
  if (req.method === 'POST') {
    const { 
      source_item_id, 
      target_item_id, 
      relationship_type,
      metadata = {},
      bidirectional = false 
    } = req.body;
    
    // Validation
    if (!source_item_id || !target_item_id || !relationship_type) {
      return res.status(400).json({
        success: false,
        error: 'Source ID, target ID, and relationship type are required'
      });
    }
    
    if (!Object.values(RELATIONSHIP_TYPES).includes(relationship_type)) {
      return res.status(400).json({
        success: false,
        error: `Invalid relationship type. Must be one of: ${Object.values(RELATIONSHIP_TYPES).join(', ')}`
      });
    }
    
    // Check for existing relationship
    const exists = relationships.find(r => 
      r.source_item_id === source_item_id &&
      r.target_item_id === target_item_id &&
      r.relationship_type === relationship_type
    );
    
    if (exists) {
      return res.status(409).json({
        success: false,
        error: 'This relationship already exists'
      });
    }
    
    // Create the relationship
    const newRelationship = {
      id: nextRelationshipId++,
      source_item_id: parseInt(source_item_id),
      target_item_id: parseInt(target_item_id),
      relationship_type,
      metadata,
      created_at: new Date().toISOString()
    };
    
    relationships.push(newRelationship);
    
    // Create reverse relationship if bidirectional
    if (bidirectional) {
      const reverseRelationship = {
        id: nextRelationshipId++,
        source_item_id: parseInt(target_item_id),
        target_item_id: parseInt(source_item_id),
        relationship_type,
        metadata: { ...metadata, reverse: true },
        created_at: new Date().toISOString()
      };
      relationships.push(reverseRelationship);
    }
    
    return res.status(201).json({
      success: true,
      relationship: newRelationship,
      message: bidirectional 
        ? 'Bidirectional relationship created successfully'
        : 'Relationship created successfully'
    });
  }
  
  // DELETE - Remove a relationship
  if (req.method === 'DELETE') {
    const { relationshipId } = req.body;
    
    if (!relationshipId) {
      return res.status(400).json({
        success: false,
        error: 'Relationship ID is required'
      });
    }
    
    const index = relationships.findIndex(r => r.id === parseInt(relationshipId));
    
    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: 'Relationship not found'
      });
    }
    
    const deleted = relationships.splice(index, 1)[0];
    
    return res.status(200).json({
      success: true,
      deleted,
      message: 'Relationship deleted successfully'
    });
  }
  
  return res.status(405).json({
    success: false,
    error: 'Method not allowed'
  });
}