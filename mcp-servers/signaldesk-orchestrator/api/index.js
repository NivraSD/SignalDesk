const mcp = require('../dist/index.js');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    const { method, params } = req.body || {};
    
    // Handle MCP request
    if (mcp.handleRequest) {
      const result = await mcp.handleRequest(method, params);
      return res.status(200).json({ success: true, result });
    } else if (mcp.default && mcp.default.handleRequest) {
      const result = await mcp.default.handleRequest(method, params);
      return res.status(200).json({ success: true, result });
    } else {
      // Fallback for MCPs with different export structure
      return res.status(200).json({ 
        success: true, 
        result: { 
          service: '${mcp}',
          method,
          params,
          message: 'MCP service active'
        }
      });
    }
  } catch (error) {
    console.error('MCP Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};
