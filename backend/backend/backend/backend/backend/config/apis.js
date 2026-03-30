// Store your API keys and configurations
module.exports = {
  googleCustomSearch: {
    apiKey: process.env.GOOGLE_API_KEY,
    searchEngineId: process.env.GOOGLE_SEARCH_ENGINE_ID,
    baseUrl: "https://www.googleapis.com/customsearch/v1",
  },
  newsApi: {
    apiKey: process.env.NEWS_API_KEY,
    baseUrl: "https://newsapi.org/v2",
  },
  twitter: {
    bearerToken: process.env.TWITTER_BEARER_TOKEN,
    baseUrl: "https://api.twitter.com/2",
  },
};
