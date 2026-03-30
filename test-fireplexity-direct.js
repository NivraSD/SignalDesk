const response = await fetch(
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/niv-fireplexity`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({
      query: "sora 2 launch market landscape competitors news",
      organizationId: "OpenAI"
    })
  }
)

const data = await response.json()
console.log('Response status:', response.status)
console.log('Articles found:', data.articles?.length || 0)
console.log('Full response:', JSON.stringify(data, null, 2))
