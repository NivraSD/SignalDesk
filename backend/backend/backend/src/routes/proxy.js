const express = require('express');
const router = express.Router();
const axios = require('axios');
const Parser = require('rss-parser');
const cheerio = require('cheerio');

const parser = new Parser();

/**
 * Proxy endpoint for fetching RSS feeds (avoids CORS issues)
 */
router.post('/rss', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    
    const feed = await parser.parseURL(url);
    
    res.json({
      title: feed.title,
      description: feed.description,
      link: feed.link,
      items: feed.items.map(item => ({
        title: item.title,
        description: item.contentSnippet || item.content,
        link: item.link,
        pubDate: item.pubDate,
        creator: item.creator,
        categories: item.categories
      }))
    });
  } catch (error) {
    console.error('RSS fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch RSS feed' });
  }
});

/**
 * Proxy endpoint for Google News search
 */
router.post('/google-news', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }
    
    // Use Google News RSS feed
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
    const feed = await parser.parseURL(url);
    
    const articles = feed.items.map(item => ({
      title: item.title,
      link: item.link,
      pubDate: item.pubDate,
      source: item.source ? item.source._ : 'Google News',
      snippet: item.contentSnippet || item.content
    }));
    
    res.json({ articles });
  } catch (error) {
    console.error('Google News fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch Google News' });
  }
});

/**
 * Proxy endpoint for Reddit search
 */
router.post('/reddit', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }
    
    const response = await axios.get(
      `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&sort=new&limit=25`,
      {
        headers: {
          'User-Agent': 'SignalDesk/1.0'
        }
      }
    );
    
    const posts = response.data.data.children.map(post => ({
      title: post.data.title,
      selftext: post.data.selftext,
      url: `https://reddit.com${post.data.permalink}`,
      subreddit: post.data.subreddit,
      author: post.data.author,
      score: post.data.score,
      num_comments: post.data.num_comments,
      created_utc: post.data.created_utc,
      link_flair_text: post.data.link_flair_text
    }));
    
    res.json({ posts });
  } catch (error) {
    console.error('Reddit fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch Reddit data' });
  }
});

/**
 * Proxy endpoint for financial news (using Yahoo Finance RSS)
 */
router.post('/financial-news', async (req, res) => {
  try {
    const { symbol } = req.body;
    
    if (!symbol) {
      return res.status(400).json({ error: 'Symbol is required' });
    }
    
    // Yahoo Finance RSS feed
    const url = `https://feeds.finance.yahoo.com/rss/2.0/headline?s=${symbol}&region=US&lang=en-US`;
    const feed = await parser.parseURL(url);
    
    const articles = feed.items.map(item => ({
      title: item.title,
      link: item.link,
      pubDate: item.pubDate,
      description: item.contentSnippet || item.content
    }));
    
    res.json({ articles });
  } catch (error) {
    console.error('Financial news fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch financial news' });
  }
});

/**
 * Proxy endpoint for PR Newswire
 */
router.post('/pr-newswire', async (req, res) => {
  try {
    const { category = 'news-releases' } = req.body;
    
    const url = `https://www.prnewswire.com/rss/${category}-list.rss`;
    const feed = await parser.parseURL(url);
    
    const releases = feed.items.map(item => ({
      title: item.title,
      link: item.link,
      pubDate: item.pubDate,
      description: item.contentSnippet || item.content,
      categories: item.categories
    }));
    
    res.json({ releases });
  } catch (error) {
    console.error('PR Newswire fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch PR Newswire' });
  }
});

/**
 * Proxy endpoint for web scraping (general purpose)
 */
router.post('/scrape', async (req, res) => {
  try {
    const { url, selector } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const $ = cheerio.load(response.data);
    
    // If selector provided, extract specific content
    if (selector) {
      const elements = [];
      $(selector).each((i, el) => {
        elements.push({
          text: $(el).text().trim(),
          html: $(el).html()
        });
      });
      res.json({ elements });
    } else {
      // Return page title and meta description
      res.json({
        title: $('title').text(),
        description: $('meta[name="description"]').attr('content'),
        h1: $('h1').first().text(),
        paragraphs: $('p').slice(0, 5).map((i, el) => $(el).text()).get()
      });
    }
  } catch (error) {
    console.error('Web scraping error:', error);
    res.status(500).json({ error: 'Failed to scrape website' });
  }
});

module.exports = router;