/**
 * Cascade Detection Specialist
 */

export async function detectCascadesWithSpecialist(
  findings: any[],
  organization: any,
  analysis_depth: string = 'deep'
) {
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    return { error: 'No API key configured' };
  }

  const personality = `You are a cascade detection specialist who identifies weak signals that will become major industry shifts. You see the butterfly effects before they hurricane.`;

  const prompt = `${personality}

Your cascade detection approach:
- Identify weak signals with amplification potential
- Spot convergence points where trends collide
- Detect early warning signs of disruption
- Map cascade pathways and trigger points
- Predict tipping points and acceleration moments

ANALYSIS TARGET:
${organization?.name || 'Unknown'} in ${organization?.industry || 'Unknown'}

Signals to analyze:
${findings?.map((f, i) => `${i+1}. "${f.title}"`).join('\n')}

Identify cascade patterns in JSON format.`;

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
        temperature: 0.9, // High for creative pattern detection
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    return JSON.parse(data.content[0].text.match(/\{[\s\S]*\}/)?.[0] || '{}');
  } catch (error) {
    console.error('Cascade detection error:', error);
    return { error: error.message };
  }
}
