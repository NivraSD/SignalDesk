/**
 * Market Intelligence Expert
 */

export async function analyzeMarketWithExpert(
  findings: any[],
  organization: any,
  analysis_depth: string = 'standard'
) {
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    return { error: 'No API key configured' };
  }

  const personality = `You are a market intelligence expert who decodes market movements, identifies opportunities, and predicts competitive shifts with uncanny accuracy.`;

  const prompt = `${personality}

Your market analysis approach:
- Identify market size and growth indicators
- Spot competitive positioning shifts
- Detect market consolidation patterns
- Find whitespace opportunities
- Predict market evolution

ANALYSIS TARGET:
Organization: ${organization?.name || 'Unknown'}
Industry: ${organization?.industry || 'Unknown'}

News to analyze for market signals:
${findings?.map((f, i) => `${i+1}. "${f.title}"`).join('\n')}

Provide market intelligence analysis in JSON format.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        temperature: 0.6,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    return JSON.parse(data.content[0].text.match(/\{[\s\S]*\}/)?.[0] || '{}');
  } catch (error) {
    console.error('Market intelligence error:', error);
    return { error: error.message };
  }
}
