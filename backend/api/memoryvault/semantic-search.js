// Simulated semantic search without vector database
// In production, this would use Pinecone/Weaviate

// Use global storage for demo
global.memoryVaultItems = global.memoryVaultItems || [];

// Simple text similarity function (for demo)
function calculateSimilarity(text1, text2) {
  const words1 = text1.toLowerCase().split(/\s+/);
  const words2 = text2.toLowerCase().split(/\s+/);
  
  const intersection = words1.filter(word => words2.includes(word));
  const union = [...new Set([...words1, ...words2])];
  
  return intersection.length / union.length;
}

// Extract keywords from text
function extractKeywords(text) {
  const stopWords = ['the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but', 'in', 'with', 'to', 'for'];
  return text
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.includes(word));
}

export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }
  
  const { 
    query, 
    project_id,
    limit = 10,
    threshold = 0.1,
    filters = {} 
  } = req.body;
  
  if (!query) {
    return res.status(400).json({
      success: false,
      error: 'Search query is required'
    });
  }
  
  // Get items to search (filter by project if provided)
  let searchItems = global.memoryVaultItems || [];
  if (project_id) {
    searchItems = searchItems.filter(item => item.project_id === project_id);
  }
  
  // Apply filters
  if (filters.folder_type) {
    searchItems = searchItems.filter(item => item.folder_type === filters.folder_type);
  }
  if (filters.tags && filters.tags.length > 0) {
    searchItems = searchItems.filter(item => 
      filters.tags.some(tag => item.tags.includes(tag))
    );
  }
  
  // Calculate similarity scores
  const results = searchItems.map(item => {
    const contentText = `${item.title} ${item.content} ${item.tags.join(' ')}`;
    const similarity = calculateSimilarity(query, contentText);
    
    // Boost score for exact matches
    const exactMatch = contentText.toLowerCase().includes(query.toLowerCase());
    const boostedScore = exactMatch ? similarity + 0.5 : similarity;
    
    return {
      ...item,
      similarity_score: Math.min(boostedScore, 1),
      matched_keywords: extractKeywords(query).filter(keyword => 
        contentText.toLowerCase().includes(keyword)
      )
    };
  });
  
  // Filter by threshold and sort by similarity
  const filteredResults = results
    .filter(item => item.similarity_score >= threshold)
    .sort((a, b) => b.similarity_score - a.similarity_score)
    .slice(0, limit);
  
  // Generate search insights
  const insights = {
    total_searched: searchItems.length,
    results_found: filteredResults.length,
    top_keywords: extractKeywords(query),
    average_score: filteredResults.length > 0 
      ? filteredResults.reduce((sum, item) => sum + item.similarity_score, 0) / filteredResults.length
      : 0
  };
  
  return res.status(200).json({
    success: true,
    query,
    results: filteredResults,
    insights,
    message: `Found ${filteredResults.length} relevant items`
  });
}