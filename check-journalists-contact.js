const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkJournalists() {
  const { data, error } = await supabase
    .from('journalist_registry')
    .select('name, outlet, email, twitter_handle, linkedin_url, beat')
    .or('industry.eq.artificial_intelligence,beat.ilike.%AI%')
    .limit(5);

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Sample journalists with contact info:\n');
    data.forEach((j, i) => {
      console.log(`${i + 1}. ${j.name} - ${j.outlet}`);
      console.log(`   Beat: ${j.beat}`);
      console.log(`   Email: ${j.email || 'N/A'}`);
      console.log(`   Twitter: ${j.twitter_handle || 'N/A'}`);
      console.log(`   LinkedIn: ${j.linkedin_url || 'N/A'}`);
      console.log('');
    });
  }
}

checkJournalists();
