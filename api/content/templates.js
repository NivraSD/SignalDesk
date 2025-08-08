// Content templates endpoint
module.exports = function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }
  
  // Return content templates
  return res.status(200).json({
    success: true,
    data: [
      {
        id: 1,
        name: 'Standard Press Release',
        type: 'press-release',
        template: `FOR IMMEDIATE RELEASE

[HEADLINE]

[CITY, STATE] – [DATE] – [Lead paragraph with WHO, WHAT, WHERE, WHEN, WHY]

[Body paragraph with details]

[Quote from executive]

[Additional information]

About [Company]
[Boilerplate]

Contact:
[Contact information]`,
        category: 'PR'
      },
      {
        id: 2,
        name: 'Crisis Response',
        type: 'crisis-response',
        template: `[Company] Statement on [Issue]

We are aware of [situation] and take this matter seriously.

[What we're doing]

[Our commitment]

[Next steps]

For more information, contact [contact].`,
        category: 'Crisis'
      }
    ]
  });
}