// backend/src/services/mediaSearchService.js
const axios = require("axios");
const apiConfig = require("../../config/apis");

class MediaSearchService {
  constructor() {
    this.googleApiKey = apiConfig.googleCustomSearch.apiKey;
    this.googleSearchEngineId = "f1ef859bcfaa84749"; // Extracted from your script tag
    this.newsApiKey = apiConfig.newsApi.apiKey;
    this.twitterBearerToken = apiConfig.twitter.bearerToken;
  }

  // Google Custom Search for journalists
  async searchGoogleJournalists(query, limit = 10) {
    try {
      console.log("Searching Google for:", query);

      const response = await axios.get(apiConfig.googleCustomSearch.baseUrl, {
        params: {
          key: this.googleApiKey,
          cx: this.googleSearchEngineId,
          q: `${query} journalist OR reporter OR writer site:linkedin.com OR site:twitter.com OR site:muckrack.com`,
          num: Math.min(limit, 10), // Google limits to 10 per request
        },
      });

      const journalists = [];

      if (response.data.items) {
        for (const item of response.data.items) {
          const journalist = this.parseGoogleResult(item);
          if (journalist.name) {
            journalists.push(journalist);
          }
        }
      }

      return journalists;
    } catch (error) {
      console.error(
        "Google search error:",
        error.response?.data || error.message
      );
      return [];
    }
  }

  // Parse Google search results
  parseGoogleResult(item) {
    const journalist = {
      name: "",
      publication: "",
      beat: "",
      bio: item.snippet || "",
      source: "google",
      website: item.link,
    };

    // Extract name from title
    const nameMatch = item.title.match(/^([^-–|]+)/);
    if (nameMatch) {
      journalist.name = nameMatch[1].trim();
    }

    // Extract LinkedIn
    if (item.link.includes("linkedin.com")) {
      journalist.linkedin = item.link;
    }

    // Extract Twitter
    if (item.link.includes("twitter.com") || item.link.includes("x.com")) {
      const twitterMatch = item.link.match(/(?:twitter|x)\.com\/([^\/\?]+)/);
      if (twitterMatch) {
        journalist.twitter = `@${twitterMatch[1]}`;
      }
    }

    // Try to extract publication from snippet
    const pubMatch = item.snippet.match(/(?:at|for|with)\s+([A-Z][^.,]+)/);
    if (pubMatch) {
      journalist.publication = pubMatch[1].trim();
    }

    return journalist;
  }

  // News API search
  async searchNewsArticles(query, limit = 20) {
    try {
      console.log("Searching News API for:", query);

      const response = await axios.get(
        `${apiConfig.newsApi.baseUrl}/everything`,
        {
          params: {
            apiKey: this.newsApiKey,
            q: query,
            sortBy: "relevancy",
            pageSize: Math.min(limit, 100),
            language: "en",
          },
        }
      );

      const journalists = new Map();

      if (response.data.articles) {
        for (const article of response.data.articles) {
          if (article.author && article.author !== "null") {
            const authorNames = this.parseAuthors(article.author);

            for (const authorName of authorNames) {
              if (!journalists.has(authorName)) {
                journalists.set(authorName, {
                  name: authorName,
                  publication: article.source.name || "",
                  beat: this.extractBeatFromText(
                    article.title + " " + article.description
                  ),
                  source: "news_api",
                  recent_articles: [
                    {
                      title: article.title,
                      date: article.publishedAt,
                      url: article.url,
                    },
                  ],
                });
              } else {
                // Add article to existing journalist
                const existing = journalists.get(authorName);
                if (existing.recent_articles.length < 5) {
                  existing.recent_articles.push({
                    title: article.title,
                    date: article.publishedAt,
                    url: article.url,
                  });
                }
              }
            }
          }
        }
      }

      return Array.from(journalists.values());
    } catch (error) {
      console.error("News API error:", error.response?.data || error.message);
      return [];
    }
  }

  // Parse author names (handle multiple authors)
  parseAuthors(authorString) {
    const authors = [];

    // Clean the author string
    const cleaned = authorString
      .replace(/^By\s+/i, "")
      .replace(/\s*\([^)]*\)/g, "") // Remove parenthetical info
      .replace(/\s*<[^>]*>/g, ""); // Remove HTML tags

    // Split by common separators
    const parts = cleaned.split(/\s*(?:,|;|&|and)\s*/);

    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed && trimmed.length > 2 && trimmed.length < 50) {
        authors.push(trimmed);
      }
    }

    return authors;
  }

  // Twitter search (optional - requires elevated access)
  async searchTwitterJournalists(query, limit = 15) {
    try {
      console.log("Searching Twitter for:", query);

      // Note: Twitter API v2 requires elevated access for user search
      // This is a basic implementation that searches tweets instead
      const response = await axios.get(
        `${apiConfig.twitter.baseUrl}/tweets/search/recent`,
        {
          headers: {
            Authorization: `Bearer ${this.twitterBearerToken}`,
          },
          params: {
            query: `${query} (journalist OR reporter OR writer) -is:retweet`,
            max_results: Math.min(limit, 100),
            "tweet.fields": "author_id,created_at",
            "user.fields": "name,username,description,verified,public_metrics",
            expansions: "author_id",
          },
        }
      );

      const journalists = [];

      if (response.data.includes?.users) {
        for (const user of response.data.includes.users) {
          if (this.looksLikeJournalist(user.description)) {
            journalists.push({
              name: user.name,
              twitter: `@${user.username}`,
              bio: user.description || "",
              verified: user.verified || false,
              twitter_followers: user.public_metrics?.followers_count || 0,
              source: "twitter",
              beat: this.extractBeatFromText(user.description),
            });
          }
        }
      }

      return journalists;
    } catch (error) {
      console.error(
        "Twitter API error:",
        error.response?.data || error.message
      );
      return [];
    }
  }

  // Check if Twitter bio looks like a journalist
  looksLikeJournalist(bio) {
    if (!bio) return false;
    const journalistKeywords =
      /journalist|reporter|writer|editor|correspondent|producer|columnist|news|media/i;
    return journalistKeywords.test(bio);
  }

  // Combined search across all sources
  async searchAllSources(query, limit = 20) {
    console.log("Searching all sources for:", query);

    const [googleResults, newsResults, twitterResults] = await Promise.all([
      this.searchGoogleJournalists(query, Math.ceil(limit / 3)),
      this.searchNewsArticles(query, Math.ceil(limit / 3)),
      this.searchTwitterJournalists(query, Math.ceil(limit / 3)).catch(
        () => []
      ), // Graceful fail for Twitter
    ]);

    const allResults = [...googleResults, ...newsResults, ...twitterResults];
    return this.deduplicateJournalists(allResults).slice(0, limit);
  }

  // Remove duplicate journalists
  deduplicateJournalists(journalists) {
    const seen = new Map();

    for (const journalist of journalists) {
      const key = journalist.name.toLowerCase();
      if (!seen.has(key)) {
        seen.set(key, journalist);
      } else {
        // Merge data if duplicate
        const existing = seen.get(key);
        seen.set(key, {
          ...existing,
          ...journalist,
          twitter: existing.twitter || journalist.twitter,
          linkedin: existing.linkedin || journalist.linkedin,
          email: existing.email || journalist.email,
          recent_articles: [
            ...(existing.recent_articles || []),
            ...(journalist.recent_articles || []),
          ].slice(0, 5),
        });
      }
    }

    return Array.from(seen.values());
  }

  // Extract beat from text content
  extractBeatFromText(text) {
    if (!text) return "General";

    const beats = {
      Technology: /tech|digital|cyber|software|startup|AI|gadget|innovation/i,
      Business: /business|finance|economy|market|trade|corporate|investment/i,
      Politics: /politic|government|policy|election|congress|senate|minister/i,
      Health: /health|medical|medicine|healthcare|pharma|covid|vaccine/i,
      Science: /science|research|space|climate|environment|physics|biology/i,
      Sports: /sport|athlete|game|league|championship|football|basketball/i,
      Entertainment: /entertainment|movie|film|music|celebrity|hollywood/i,
      Education: /education|school|university|college|student|academic/i,
      Crime: /crime|police|investigation|court|justice|law enforcement/i,
      Lifestyle: /lifestyle|fashion|food|travel|culture|arts/i,
    };

    for (const [beat, regex] of Object.entries(beats)) {
      if (regex.test(text)) {
        return beat;
      }
    }

    return "General";
  }

  // Enrich with LinkedIn data (placeholder for future implementation)
  async enrichWithLinkedIn(journalist) {
    // This would require LinkedIn API access
    // For now, we'll just return the journalist as-is
    return journalist;
  }
}

module.exports = new MediaSearchService();
