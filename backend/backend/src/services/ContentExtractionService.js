const axios = require('axios');
const cheerio = require('cheerio');

class ContentExtractionService {
  constructor() {
    this.timeout = 5000;
  }

  /**
   * Extract full article content from URL
   */
  async extractContent(url) {
    try {
      // Skip if no URL
      if (!url) return null;

      // Make request with timeout
      const response = await axios.get(url, {
        timeout: this.timeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SignalDesk/1.0; +http://signaldesk.com/bot)'
        }
      });

      // Parse HTML
      const $ = cheerio.load(response.data);

      // Remove script and style elements
      $('script').remove();
      $('style').remove();
      $('nav').remove();
      $('header').remove();
      $('footer').remove();

      // Try common article selectors
      let content = '';
      
      // Try different content selectors
      const selectors = [
        'article',
        '[role="article"]',
        '.article-content',
        '.post-content',
        '.entry-content',
        '.content-body',
        'main',
        '.story-body',
        '.article-body'
      ];

      for (const selector of selectors) {
        const element = $(selector);
        if (element.length > 0) {
          content = element.text();
          break;
        }
      }

      // Fallback to body if no article found
      if (!content) {
        content = $('body').text();
      }

      // Clean up content
      content = content
        .replace(/\s+/g, ' ')  // Multiple spaces to single
        .replace(/\n{3,}/g, '\n\n')  // Multiple newlines to double
        .trim();

      // Limit to 5000 chars to avoid DB bloat
      if (content.length > 5000) {
        content = content.substring(0, 5000) + '...';
      }

      return content;

    } catch (error) {
      // Silently fail - we'll use title/description as fallback
      return null;
    }
  }

  /**
   * Batch extract content for multiple URLs
   */
  async extractBatch(articles, maxConcurrent = 5) {
    const results = [];
    
    // Process in batches to avoid overwhelming servers
    for (let i = 0; i < articles.length; i += maxConcurrent) {
      const batch = articles.slice(i, i + maxConcurrent);
      
      const batchResults = await Promise.all(
        batch.map(async (article) => {
          const content = await this.extractContent(article.url || article.link);
          return {
            ...article,
            fullContent: content || article.content || article.description
          };
        })
      );
      
      results.push(...batchResults);
      
      // Small delay between batches
      if (i + maxConcurrent < articles.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return results;
  }
}

module.exports = ContentExtractionService;