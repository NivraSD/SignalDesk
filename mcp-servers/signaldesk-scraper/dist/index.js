// #/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import { chromium } from 'playwright';
import { Pool } from 'pg';
import * as cron from 'node-cron';
import { CascadePredictor } from './cascadePredictor.js';
// Initialize stable cascade predictor
const cascadePredictor = new CascadePredictor();
// Database connection (optional - will work without it)
let pool = null;
try {
    if (process.env.DATABASE_URL) {
        pool = new Pool({
            connectionString: process.env.DATABASE_URL
        });
    }
}
catch (error) {
    console.error('Database connection optional - continuing without persistence:', error);
}
// Browser instance management
let browser = null;
async function getBrowser() {
    if (!browser) {
        browser = await chromium.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
    }
    return browser;
}
// Signal detection patterns
const OPPORTUNITY_PATTERNS = {
    competitorWeakness: {
        indicators: ['layoffs', 'executive departure', 'product recall', 'data breach', 'lawsuit', 'negative review'],
        confidence: 0.7
    },
    narrativeVacuum: {
        indicators: ['breaking news', 'trending topic', 'no expert commentary', 'seeking comment'],
        confidence: 0.6
    },
    cascadeEvent: {
        indicators: ['supply chain', 'regulatory change', 'market disruption', 'acquisition', 'bankruptcy'],
        confidence: 0.8
    }
};
// Main scraping functions
async function scrapeCompetitorWebsite(url) {
    const browser = await getBrowser();
    const page = await browser.newPage();
    try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
        const signals = {
            // Check for leadership changes
            leadership: await scrapeLeadershipSection(page),
            // Look for press releases
            press: await scrapePressReleases(page),
            // Monitor product updates
            products: await scrapeProductUpdates(page),
            // Check job postings (growth indicator)
            jobs: await scrapeJobPostings(page),
            // Extract recent blog posts
            blog: await scrapeBlogPosts(page),
            // Detect visual changes
            visualChanges: await detectVisualChanges(page, url)
        };
        return signals;
    }
    finally {
        await page.close();
    }
}
async function scrapeLeadershipSection(page) {
    const leadershipData = await page.evaluate(() => {
        const sections = ['leadership', 'team', 'about', 'executives', 'board'];
        const results = [];
        for (const section of sections) {
            // Try multiple selectors - fixed CSS syntax
            const elements = document.querySelectorAll(`[class*="${section}"], [id*="${section}"], h2, h3`);
            elements.forEach(el => {
                const text = el.textContent || '';
                // Check if the element text contains the section keyword
                if (text.toLowerCase().includes(section) && text.length > 50) {
                    results.push({
                        section,
                        content: text.substring(0, 500),
                        hasChanges: false // Will be compared with previous snapshot
                    });
                }
            });
        }
        return results;
    });
    return leadershipData;
}
async function scrapePressReleases(page) {
    const pressData = await page.evaluate(() => {
        const sections = ['press', 'news', 'media', 'announcements'];
        const results = [];
        for (const section of sections) {
            const links = document.querySelectorAll(`a[href*="${section}"]`);
            links.forEach(link => {
                const href = link.getAttribute('href');
                const text = link.textContent || '';
                const date = link.closest('article')?.querySelector('time')?.textContent ||
                    link.closest('div')?.querySelector('[class*="date"]')?.textContent || '';
                if (href && text) {
                    results.push({
                        url: href,
                        title: text,
                        date,
                        type: section
                    });
                }
            });
        }
        return results.slice(0, 10); // Latest 10 items
    });
    return pressData;
}
async function scrapeProductUpdates(page) {
    const productData = await page.evaluate(() => {
        const sections = ['product', 'features', 'updates', 'changelog', 'releases'];
        const results = [];
        for (const section of sections) {
            const elements = document.querySelectorAll(`[class*="${section}"], [href*="${section}"], article`);
            elements.forEach(el => {
                const text = el.textContent || '';
                // Check if element contains the section keyword
                if (text.toLowerCase().includes(section) && text.length > 30) {
                    results.push({
                        section,
                        content: text.substring(0, 300),
                        timestamp: new Date().toISOString()
                    });
                }
            });
        }
        return results;
    });
    return productData;
}
async function scrapeJobPostings(page) {
    // Check careers page
    const careersLink = await page.$('a[href*="careers"], a[href*="jobs"], a[href*="hiring"]');
    if (careersLink) {
        await careersLink.click();
        await page.waitForLoadState('networkidle');
        const jobCount = await page.evaluate(() => {
            const jobElements = document.querySelectorAll('[class*="job"], [class*="position"], [class*="opening"]');
            return jobElements.length;
        });
        return {
            activePostings: jobCount,
            growthIndicator: jobCount > 10 ? 'high' : jobCount > 5 ? 'medium' : 'low',
            timestamp: new Date().toISOString()
        };
    }
    return { activePostings: 0, growthIndicator: 'unknown' };
}
async function scrapeBlogPosts(page) {
    const blogData = await page.evaluate(() => {
        const posts = document.querySelectorAll('article, [class*="post"], [class*="blog"]');
        const results = [];
        posts.forEach(post => {
            const title = post.querySelector('h1, h2, h3')?.textContent || '';
            const date = post.querySelector('time, [class*="date"]')?.textContent || '';
            const excerpt = post.querySelector('p')?.textContent || '';
            if (title) {
                results.push({
                    title,
                    date,
                    excerpt: excerpt.substring(0, 200),
                    signals: [] // Will be analyzed for opportunity patterns
                });
            }
        });
        return results.slice(0, 5); // Latest 5 posts
    });
    return blogData;
}
async function detectVisualChanges(page, url) {
    // Take screenshot for comparison
    const screenshot = await page.screenshot({ fullPage: true });
    // Load previous screenshot from database if exists
    const previousScreenshot = await loadPreviousScreenshot(url);
    if (previousScreenshot) {
        // Simple change detection (in production, use proper image diff)
        const hasChanges = screenshot.length !== previousScreenshot.length;
        if (hasChanges) {
            await saveScreenshot(url, screenshot);
            return { hasChanges: true, changeDetected: new Date().toISOString() };
        }
    }
    else {
        await saveScreenshot(url, screenshot);
    }
    return { hasChanges: false };
}
async function loadPreviousScreenshot(url) {
    if (!pool) {
        // No database - can't load previous screenshots
        return null;
    }
    try {
        const result = await pool.query('SELECT screenshot FROM webpage_snapshots WHERE url = $1 ORDER BY created_at DESC LIMIT 1', [url]);
        return result.rows[0]?.screenshot || null;
    }
    catch (error) {
        console.error('Error loading screenshot (non-critical):', error);
        return null;
    }
}
async function saveScreenshot(url, screenshot) {
    if (!pool) {
        // No database - skip saving
        return;
    }
    try {
        await pool.query('INSERT INTO webpage_snapshots (url, screenshot, created_at) VALUES ($1, $2, NOW())', [url, screenshot]);
    }
    catch (error) {
        console.error('Error saving screenshot (non-critical):', error);
    }
}
// Pattern detection
async function detectOpportunityPatterns(content) {
    const detectedPatterns = [];
    for (const [patternName, pattern] of Object.entries(OPPORTUNITY_PATTERNS)) {
        const contentText = JSON.stringify(content).toLowerCase();
        const matchCount = pattern.indicators.filter(indicator => contentText.includes(indicator.toLowerCase())).length;
        const confidence = matchCount / pattern.indicators.length;
        if (confidence >= pattern.confidence) {
            detectedPatterns.push({
                pattern: patternName,
                confidence,
                indicators: pattern.indicators.filter(i => contentText.includes(i.toLowerCase())),
                timestamp: new Date().toISOString()
            });
        }
    }
    return detectedPatterns;
}
// Social media monitoring (without API)
async function monitorSocialMedia(handle, platform) {
    const browser = await getBrowser();
    const page = await browser.newPage();
    try {
        let url = '';
        switch (platform) {
            case 'linkedin':
                url = `https://www.linkedin.com/company/${handle}`;
                break;
            case 'twitter':
                url = `https://twitter.com/${handle}`;
                break;
            default:
                throw new Error(`Unsupported platform: ${platform}`);
        }
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
        // Extract recent posts
        const posts = await page.evaluate(() => {
            const postElements = document.querySelectorAll('[data-testid="tweet"], [class*="feed-shared-update"]');
            const results = [];
            postElements.forEach(post => {
                const text = post.textContent || '';
                results.push({
                    content: text.substring(0, 500),
                    timestamp: new Date().toISOString()
                });
            });
            return results.slice(0, 10);
        });
        // Analyze for patterns
        const patterns = await detectOpportunityPatterns(posts);
        return {
            platform,
            handle,
            posts,
            patterns,
            timestamp: new Date().toISOString()
        };
    }
    finally {
        await page.close();
    }
}
// Cascade detection
async function detectCascadeIndicators(keywords) {
    const browser = await getBrowser();
    const page = await browser.newPage();
    try {
        // Search for cascade indicators on news sites
        const newsUrls = [
            'https://news.google.com',
            'https://techmeme.com',
            'https://news.ycombinator.com'
        ];
        const cascadeSignals = [];
        for (const newsUrl of newsUrls) {
            await page.goto(newsUrl, { waitUntil: 'networkidle', timeout: 30000 });
            for (const keyword of keywords) {
                const hasKeyword = await page.evaluate((kw) => {
                    return document.body?.textContent?.toLowerCase().includes(kw.toLowerCase()) || false;
                }, keyword);
                if (hasKeyword) {
                    cascadeSignals.push({
                        source: newsUrl,
                        keyword,
                        detected: true,
                        timestamp: new Date().toISOString()
                    });
                }
            }
        }
        return cascadeSignals;
    }
    finally {
        await page.close();
    }
}
// MCP Server setup
const server = new Server({
    name: 'signaldesk-scraper',
    version: '1.0.0',
}, {
    capabilities: {
        tools: {},
    },
});
// Register tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
        {
            name: 'scrape_competitor',
            description: 'Scrape competitor website for signals',
            inputSchema: {
                type: 'object',
                properties: {
                    url: { type: 'string', description: 'Competitor website URL' },
                    sections: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Specific sections to scrape',
                        default: ['all']
                    }
                },
                required: ['url']
            }
        },
        {
            name: 'monitor_social',
            description: 'Monitor social media for signals',
            inputSchema: {
                type: 'object',
                properties: {
                    handle: { type: 'string', description: 'Social media handle' },
                    platform: {
                        type: 'string',
                        enum: ['linkedin', 'twitter'],
                        description: 'Social platform to monitor'
                    }
                },
                required: ['handle', 'platform']
            }
        },
        {
            name: 'detect_cascades',
            description: 'Detect cascade event indicators',
            inputSchema: {
                type: 'object',
                properties: {
                    keywords: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Keywords to search for cascade indicators'
                    }
                },
                required: ['keywords']
            }
        },
        {
            name: 'monitor_changes',
            description: 'Monitor webpage for changes',
            inputSchema: {
                type: 'object',
                properties: {
                    url: { type: 'string', description: 'URL to monitor' },
                    frequency: {
                        type: 'string',
                        enum: ['hourly', 'daily', 'weekly'],
                        description: 'Monitoring frequency',
                        default: 'daily'
                    }
                },
                required: ['url']
            }
        },
        {
            name: 'predict_cascade',
            description: 'Predict cascade effects from an event using stable predictor',
            inputSchema: {
                type: 'object',
                properties: {
                    event: { type: 'string', description: 'Event description or news' },
                    eventType: {
                        type: 'string',
                        enum: ['regulatory_change', 'competitor_crisis', 'technology_breakthrough', 'supply_chain_disruption', 'data_breach', 'auto'],
                        description: 'Type of event (auto-detect if not specified)',
                        default: 'auto'
                    },
                    source: {
                        type: 'string',
                        enum: ['official', 'media', 'social', 'internal'],
                        description: 'Source of the event information',
                        default: 'media'
                    },
                    magnitude: {
                        type: 'string',
                        enum: ['major', 'significant', 'minor'],
                        description: 'Magnitude of the event',
                        default: 'significant'
                    }
                },
                required: ['event']
            }
        }
    ],
}));
// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
        switch (name) {
            case 'scrape_competitor': {
                const { url, sections = ['all'] } = args;
                const signals = await scrapeCompetitorWebsite(url);
                const patterns = await detectOpportunityPatterns(signals);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                url,
                                signals,
                                patterns,
                                timestamp: new Date().toISOString()
                            }, null, 2)
                        }
                    ]
                };
            }
            case 'monitor_social': {
                const { handle, platform } = args;
                const data = await monitorSocialMedia(handle, platform);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(data, null, 2)
                        }
                    ]
                };
            }
            case 'detect_cascades': {
                const { keywords } = args;
                const cascades = await detectCascadeIndicators(keywords);
                // Use stable cascade predictor for enhanced predictions
                const cascadePredictions = cascades.map(cascade => {
                    const eventType = cascadePredictor.detectEventType({ text: cascade.keyword });
                    return cascadePredictor.predictCascade(eventType, {
                        source: cascade.source,
                        magnitude: cascades.length > 3 ? 'major' : 'significant',
                        geographic: 'global'
                    });
                });
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                keywords,
                                cascades,
                                cascadePotential: cascades.length > 3 ? 'high' : cascades.length > 1 ? 'medium' : 'low',
                                predictions: cascadePredictions,
                                topOpportunities: cascadePredictions
                                    .flatMap(p => p.opportunities)
                                    .sort((a, b) => b.confidence - a.confidence)
                                    .slice(0, 5)
                            }, null, 2)
                        }
                    ]
                };
            }
            case 'monitor_changes': {
                const { url, frequency = 'daily' } = args;
                // Set up monitoring schedule
                const cronPattern = frequency === 'hourly' ? '0 * * * *' :
                    frequency === 'daily' ? '0 0 * * *' :
                        '0 0 * * 0';
                cron.schedule(cronPattern, async () => {
                    const signals = await scrapeCompetitorWebsite(url);
                    const patterns = await detectOpportunityPatterns(signals);
                    // Save to database if available
                    if (pool) {
                        try {
                            await pool.query('INSERT INTO monitoring_results (url, signals, patterns, created_at) VALUES ($1, $2, $3, NOW())', [url, JSON.stringify(signals), JSON.stringify(patterns)]);
                        }
                        catch (error) {
                            console.error('Could not save to database (non-critical):', error);
                        }
                    }
                });
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Monitoring scheduled for ${url} at ${frequency} intervals`
                        }
                    ]
                };
            }
            case 'predict_cascade': {
                const { event, eventType = 'auto', source = 'media', magnitude = 'significant' } = args;
                // Auto-detect event type if needed
                const type = eventType === 'auto' ?
                    cascadePredictor.detectEventType({ text: event }) :
                    eventType;
                // Get cascade prediction
                const prediction = cascadePredictor.predictCascade(type, {
                    source,
                    magnitude,
                    geographic: 'global',
                    description: event
                });
                // Format response with actionable insights
                const response = {
                    event,
                    detectedType: type,
                    confidence: `${(prediction.confidence * 100).toFixed(0)}%`,
                    cascadeEffects: {
                        immediate: prediction.prediction.firstOrder,
                        nearTerm: prediction.prediction.secondOrder,
                        longTerm: prediction.prediction.thirdOrder
                    },
                    opportunities: prediction.opportunities,
                    recommendations: {
                        urgent: prediction.opportunities.filter((o) => o.priority === 'high').map((o) => o.action),
                        strategic: prediction.opportunities.filter((o) => o.priority === 'medium').map((o) => o.action),
                        monitoring: prediction.opportunities.filter((o) => o.priority === 'low').map((o) => o.action)
                    },
                    timestamp: prediction.timestamp
                };
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(response, null, 2)
                        }
                    ]
                };
            }
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    }
    catch (error) {
        return {
            content: [
                {
                    type: 'text',
                    text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
                }
            ]
        };
    }
});
// Start server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('SignalDesk Scraper MCP Server running...');
}
// Cleanup on exit
process.on('SIGINT', async () => {
    if (browser) {
        await browser.close();
    }
    if (pool) {
        await pool.end();
    }
    process.exit(0);
});
main().catch(console.error);
//# sourceMappingURL=index.js.map