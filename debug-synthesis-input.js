// Debug script to see what synthesis is actually receiving
const fs = require('fs');

async function debugSynthesisInput() {
  try {
    // Read the most recent console logs
    const logs = fs.readFileSync('console.md', 'utf8');

    // Find the synthesis input section
    const synthesisSectionMatch = logs.match(/INTELLIGENCE SYNTHESIS BRIEFING[\s\S]*?REMEMBER:/);

    if (synthesisSectionMatch) {
      const synthesisSection = synthesisSectionMatch[0];

      // Extract key parts
      const eventsMatch = synthesisSection.match(/THE ACTUAL EVENTS.*?\n([\s\S]*?)KEY QUOTES/);
      const entitiesMatch = synthesisSection.match(/Events are about: (.*)/);
      const competitorsMatch = synthesisSection.match(/Key competitors mentioned: (.*)/);

      console.log('\n🔍 DEBUGGING SYNTHESIS INPUT:\n');
      console.log('=' .repeat(80));

      if (entitiesMatch) {
        console.log('ENTITIES MENTIONED IN EVENTS:');
        console.log(entitiesMatch[1]);
        console.log('\n');
      }

      if (competitorsMatch) {
        console.log('COMPETITORS IDENTIFIED:');
        console.log(competitorsMatch[1]);
        console.log('\n');
      }

      if (eventsMatch) {
        const events = eventsMatch[1].trim().split('\n').slice(0, 10);
        console.log('FIRST 10 EVENTS:');
        events.forEach(event => {
          console.log(event);
        });
      }

      // Check what entities the events are actually about
      console.log('\n' + '=' .repeat(80));
      console.log('ENTITY ANALYSIS:');

      if (eventsMatch) {
        const allEvents = eventsMatch[1];
        const teslaCount = (allEvents.match(/Tesla/gi) || []).length;
        const fordCount = (allEvents.match(/Ford/gi) || []).length;
        const gmCount = (allEvents.match(/GM|General Motors/gi) || []).length;
        const rivianCount = (allEvents.match(/Rivian/gi) || []).length;
        const bydCount = (allEvents.match(/BYD/gi) || []).length;

        console.log(`Tesla mentions: ${teslaCount}`);
        console.log(`Ford mentions: ${fordCount}`);
        console.log(`GM mentions: ${gmCount}`);
        console.log(`Rivian mentions: ${rivianCount}`);
        console.log(`BYD mentions: ${bydCount}`);

        console.log('\nPROBLEM IDENTIFIED:');
        if (teslaCount > (fordCount + gmCount + rivianCount + bydCount)) {
          console.log('❌ EVENTS ARE MOSTLY ABOUT TESLA, NOT COMPETITORS!');
          console.log('This is why synthesis analyzes Tesla instead of the competitive landscape.');
        } else {
          console.log('✅ Events are properly focused on competitors');
        }
      }

    } else {
      console.log('Could not find synthesis section in logs');
    }

    // Also check what enrichment is outputting
    const enrichmentMatch = logs.match(/📊 Synthesis Context Prepared:[\s\S]*?totalEvents: (\d+)/);
    if (enrichmentMatch) {
      console.log('\n' + '=' .repeat(80));
      console.log('ENRICHMENT OUTPUT:');
      console.log(`Total events prepared: ${enrichmentMatch[1]}`);
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

debugSynthesisInput();