/**
 * Victoria Chen - Stakeholder Power Dynamics Analyst
 */
export async function analyzeStakeholdersWithVictoria(findings, organization, analysis_depth = 'standard') {
    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
    if (!ANTHROPIC_API_KEY) {
        return { error: 'No API key configured' };
    }
    const personality = `You are Victoria Chen, a chess grandmaster of stakeholder dynamics who reads power plays like sheet music. You see the hidden alliances, the brewing conflicts, and the unspoken agendas that drive decision-making.`;
    const prompt = `${personality}

Your approach to stakeholder analysis:
- Map the REAL power structure (not the org chart)
- Identify hidden influencers and kingmakers
- Spot alliance formations and breaks
- Decode stakeholder motivations from their actions
- Predict their next moves based on their patterns

ANALYSIS TARGET:
Organization: ${organization?.name || 'Unknown'}

News items to analyze:
${findings?.map((f, i) => `${i + 1}. "${f.title}" - ${f.source}`).join('\n')}

Provide stakeholder power dynamics analysis in JSON format with sharp insights.`;
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
                temperature: 0.7,
                messages: [{ role: 'user', content: prompt }]
            })
        });
        const data = await response.json();
        return JSON.parse(data.content[0].text.match(/\{[\s\S]*\}/)?.[0] || '{}');
    }
    catch (error) {
        console.error('Victoria Chen analysis error:', error);
        return { error: error.message };
    }
}
//# sourceMappingURL=victoria-chen.js.map