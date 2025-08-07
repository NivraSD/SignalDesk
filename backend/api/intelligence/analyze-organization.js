export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { organization, url } = req.body;
  
  // Mock AI analysis response
  return res.status(200).json({
    success: true,
    organization,
    analysis: {
      industry: "Technology & Innovation",
      mainFocus: "Digital transformation and market expansion",
      competitors: [
        { name: "Competitor Alpha", relevance: 0.95, description: "Direct market competitor" },
        { name: "Competitor Beta", relevance: 0.85, description: "Adjacent market player" },
        { name: "Competitor Gamma", relevance: 0.75, description: "Emerging challenger" },
        { name: "Competitor Delta", relevance: 0.65, description: "International competitor" }
      ],
      topics: [
        { name: "Digital Transformation", importance: "critical", category: "Technology" },
        { name: "Market Expansion", importance: "high", category: "Business" },
        { name: "Customer Experience", importance: "high", category: "Operations" },
        { name: "Sustainability", importance: "medium", category: "ESG" },
        { name: "Innovation Strategy", importance: "high", category: "R&D" },
        { name: "Talent Acquisition", importance: "medium", category: "HR" }
      ],
      suggestedKeywords: [
        organization.toLowerCase(),
        "industry news",
        "market trends",
        "innovation",
        "competition"
      ]
    }
  });
}