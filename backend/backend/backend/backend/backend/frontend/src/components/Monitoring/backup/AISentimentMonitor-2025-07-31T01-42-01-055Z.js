import React, { useState, useEffect, useCallback, useMemo } from "react";
import apiService from "../../services/api";
import Papa from "papaparse";
import { useProject } from "../../contexts/ProjectContext";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
// Add these new icon imports for the AI Agent UI
import {
  Bot,
  Settings,
  Globe,
  Rss,
  Search,
  Brain,
  Activity,
  Bell,
  Zap,
  Target,
  Shield,
  Plus,
  X,
  Hash,
  Edit2,
  Trash2,
  Power,
  RefreshCw,
  ExternalLink,
  Share2,
  Bookmark,
  ChevronDown,
  ThumbsUp,
  ThumbsDown,
  GitBranch,
  Minus,
  Lightbulb,
  TrendingUp,
  AlertCircle,
  Users,
  BarChart3,
} from "lucide-react";

const AISentimentMonitor = () => {
  const [activeTab, setActiveTab] = useState("monitor");
  const [monitoringFeed, setMonitoringFeed] = useState([]);
  const [loading, setLoading] = useState(false);
  const [analyzingItems, setAnalyzingItems] = useState(new Set());
  const [metricsTimeRange, setMetricsTimeRange] = useState("24h");
  const [exportFormat, setExportFormat] = useState("csv");
  const [expandedSummaries, setExpandedSummaries] = useState(new Set());
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isAutoRefresh, setIsAutoRefresh] = useState(false);
  const [showQuickStart, setShowQuickStart] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  // AI Agent specific state
  const [isAgentActive, setIsAgentActive] = useState(true);
  const [showAgentConfig, setShowAgentConfig] = useState(false);
  const [agentActivities, setAgentActivities] = useState([]);
  const [showWebsiteModal, setShowWebsiteModal] = useState(false);
  const [showKeywordModal, setShowKeywordModal] = useState(false);
  const [showAddTargetModal, setShowAddTargetModal] = useState(false);

  // New state for enhancements
  const [analysisProgress, setAnalysisProgress] = useState({
    current: 0,
    total: 0,
  });
  const [searchHistory, setSearchHistory] = useState([]);
  const [scheduledExport, setScheduledExport] = useState(null);
  const [sentimentHeatmap, setSentimentHeatmap] = useState([]);
  const [storedMentions, setStoredMentions] = useState([]);
  const [rssFetchStatus, setRssFetchStatus] = useState({
    current: 0,
    total: 0,
    feeds: [],
  });

  // Initialize historical data
  const [historicalData, setHistoricalData] = useState(() => {
    const data = [];
    const now = new Date();
    for (let i = 23; i >= 0; i--) {
      const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
      data.push({
        time: hour.toLocaleTimeString("en-US", { hour: "numeric" }),
        positive: 0,
        negative: 0,
        neutral: 0,
        mixed: 0,
        total: 0,
      });
    }
    return data;
  });

  // Data Source Configuration
  const [dataSourceConfig, setDataSourceConfig] = useState({
    sourceType: "demo",
    monitoringKeywords: ["AI", "artificial intelligence"],
    websiteConfig: {
      enabled: false,
      monitors: [],
      eventTemplates: {
        milken: {
          name: "Milken Institute Global Conference",
          baseUrl: "https://milkeninstitute.org/events/global-conference",
          selectors: {
            waitForSelector: ".speaker-grid",
            speakers: {
              list: ".speaker-card",
              name: ".speaker-name",
              title: ".speaker-title",
              company: ".speaker-company",
              bio: ".speaker-bio",
              image: ".speaker-image img",
            },
          },
        },
        davos: {
          name: "World Economic Forum",
          baseUrl:
            "https://www.weforum.org/events/world-economic-forum-annual-meeting",
          selectors: {},
        },
        custom: {
          name: "Custom Event",
          selectors: {},
        },
      },
    },
    apiConfig: {
      provider: "custom",
      endpoint: "",
      apiKey: "",
      headers: {},
      queryParams: {},
      pollingInterval: 300000,
      dataMapping: {
        id: "id",
        content: "text",
        source: "source",
        author: "author",
        publishDate: "published_at",
        url: "url",
        reach: "reach",
      },
    },
    aggregatorConfig: {
      sources: {
        demo: {
          enabled: true,
          count: 10,
        },
        reddit: {
          enabled: false,
          subreddits: ["technology", "artificial"],
          searchTerms: [],
        },
        hackernews: {
          enabled: false,
          searchTerms: [],
        },
        rss: {
          enabled: false,
          feeds: [
            {
              name: "TechCrunch",
              url: "https://techcrunch.com/feed/",
              category: "tech",
            },
            {
              name: "The Verge",
              url: "https://www.theverge.com/rss/index.xml",
              category: "tech",
            },
          ],
        },
        newsapi: {
          enabled: false,
          apiKey: "",
          domains: [],
          searchTerms: [],
        },
      },
      updateInterval: 300000,
      maxMentionsPerSource: 50,
    },
    filterConfig: {
      excludeKeywords: [],
      includeKeywords: [],
      minReach: 0,
      dateRange: "7d",
      languages: ["en"],
      sources: [],
    },
  });

  // Alert System State
  const [alerts, setAlerts] = useState([]);
  const [alertConfig, setAlertConfig] = useState({
    sentimentThreshold: {
      enabled: true,
      value: -20,
      duration: "1h",
    },
    volumeSpike: {
      enabled: true,
      multiplier: 3,
      timeWindow: "1h",
    },
    negativePercentage: {
      enabled: true,
      threshold: 40,
    },
    criticalTopics: {
      enabled: true,
      topics: [
        "data breach",
        "security issue",
        "lawsuit",
        "crisis",
        "outage",
        "fraud",
        "scam",
      ],
    },
    notificationChannels: {
      dashboard: true,
      email: false,
      slack: false,
      push: false,
    },
  });

  // Claude AI Configuration State
  const [claudeConfig, setClaudeConfig] = useState({
    enabled: true,
    brandContext: {
      companyName: "",
      industry: "",
      productServices: "",
      targetAudience: "",
      brandValues: "",
      customContext: "",
    },
    sentimentContext: {
      positiveScenarios: "",
      negativeScenarios: "",
      criticalConcerns: "",
      competitorContext: "",
      customRules: "",
    },
    analysisInstructions: {
      tone: "professional",
      focusAreas: [
        "customer satisfaction",
        "product quality",
        "brand perception",
        "competitive positioning",
      ],
      customInstructions: "",
      considerCompetitors: true,
      detectActionableInsights: true,
    },
    sentimentCalibration: {
      sensitivity: "balanced",
      culturalContext: true,
      industryNorms: true,
    },
    processingSettings: {
      autoAnalyze: true,
      batchSize: 10,
      maxRetries: 3,
      fallbackToKeywords: true,
    },
  });

  const [configSaved, setConfigSaved] = useState(false);

  // Load saved configuration on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem("aiMonitorConfig");
    const savedMentions = localStorage.getItem("aiMonitorMentions");

    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        if (config.dataSource) {
          setDataSourceConfig((prev) => ({
            ...prev,
            ...config.dataSource,
            monitoringKeywords: config.dataSource.monitoringKeywords || [
              "AI",
              "artificial intelligence",
            ],
          }));
        }
        if (config.claude) setClaudeConfig(config.claude);
        if (config.alerts) setAlertConfig(config.alerts);
      } catch (e) {
        console.error("Failed to load saved config:", e);
      }
    }

    if (savedMentions) {
      try {
        const mentions = JSON.parse(savedMentions);
        setStoredMentions(mentions);
        setMonitoringFeed(mentions);
      } catch (e) {
        console.error("Failed to load saved mentions:", e);
      }
    }
  }, []);

  // Save configuration when it changes
  useEffect(() => {
    const saveTimer = setTimeout(() => {
      localStorage.setItem(
        "aiMonitorConfig",
        JSON.stringify({
          dataSource: dataSourceConfig,
          claude: claudeConfig,
          alerts: alertConfig,
        })
      );
    }, 1000);

    return () => clearTimeout(saveTimer);
  }, [dataSourceConfig, claudeConfig, alertConfig]);

  // Save mentions when they change
  useEffect(() => {
    if (monitoringFeed.length > 0) {
      localStorage.setItem(
        "aiMonitorMentions",
        JSON.stringify(monitoringFeed.slice(0, 1000))
      );
    }
  }, [monitoringFeed]);

  // Generate demo mentions
  const generateDemoMentions = () => {
    const templates = [
      {
        positive: [
          "Just migrated to {keyword} and the experience has been seamless. Customer support was incredibly helpful!",
          "The new {keyword} features are exactly what we needed. Implementation was straightforward and the results are impressive.",
          "Loving the latest update! {keyword} has really improved our workflow efficiency by 40%.",
          "Best decision we made was switching to this {keyword} solution. ROI has been fantastic.",
          "The {keyword} integration worked perfectly out of the box. Highly recommend!",
        ],
      },
      {
        negative: [
          "Having issues with the {keyword} API integration. Documentation could be clearer.",
          "The pricing changes for {keyword} are disappointing. Considering switching to competitors.",
          "{keyword} has been down for 2 hours now. This is affecting our business operations.",
          "Support response time for {keyword} issues has been really slow lately.",
          "The new {keyword} update broke our existing integrations. Not happy.",
        ],
      },
      {
        neutral: [
          "Looking for alternatives to {keyword}. What are others using?",
          "Anyone have experience with {keyword} for enterprise deployments?",
          "Comparing {keyword} with other solutions in the market.",
          "Setting up {keyword} for our team. Any tips?",
          "{keyword} announced new features at their conference today.",
        ],
      },
      {
        mixed: [
          "{keyword} has great features but the pricing is getting too high for small businesses.",
          "Love the {keyword} interface, but wish it had better integration options.",
          "The {keyword} platform is powerful but has a steep learning curve.",
          "{keyword} customer service is excellent, though the product has some bugs.",
          "While {keyword} works well, competitors are offering better pricing.",
        ],
      },
    ];

    const sources = [
      { name: "Twitter", type: "Social Media", reachMultiplier: 100 },
      { name: "Reddit - r/technology", type: "Forum", reachMultiplier: 50 },
      { name: "LinkedIn", type: "Professional", reachMultiplier: 80 },
      { name: "TechCrunch", type: "News", reachMultiplier: 200 },
      { name: "Product Hunt", type: "Review", reachMultiplier: 60 },
      { name: "Hacker News", type: "Forum", reachMultiplier: 70 },
      { name: "Medium", type: "Blog", reachMultiplier: 40 },
    ];

    const authors = [
      "tech_enthusiast",
      "startup_founder",
      "developer_jane",
      "product_manager_x",
      "cto_insights",
      "ai_researcher",
      "software_architect",
      "data_scientist_pro",
    ];

    const mentions = [];
    const keywords = dataSourceConfig.monitoringKeywords || ["AI"];
    const count = 15;

    for (let i = 0; i < count; i++) {
      const sentiment = ["positive", "negative", "neutral", "mixed"][
        Math.floor(Math.random() * 4)
      ];
      const sentimentTemplates = templates.find((t) => t[sentiment])[sentiment];
      const template =
        sentimentTemplates[
          Math.floor(Math.random() * sentimentTemplates.length)
        ];
      const keyword = keywords[Math.floor(Math.random() * keywords.length)];
      const content = template.replace(/{keyword}/g, keyword);
      const source = sources[Math.floor(Math.random() * sources.length)];
      const baseReach = Math.floor(Math.random() * 1000) + 100;

      mentions.push({
        id: `demo-${Date.now()}-${i}-${Math.random()}`,
        content: content,
        source: source.name,
        sourceType: source.type,
        author: authors[Math.floor(Math.random() * authors.length)],
        publish_date: new Date(
          Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
        ),
        url: `https://example.com/post/${Date.now()}-${i}`,
        reach: baseReach * source.reachMultiplier,
        engagement: {
          likes: Math.floor(Math.random() * 500),
          shares: Math.floor(Math.random() * 100),
          comments: Math.floor(Math.random() * 50),
        },
      });
    }

    return mentions.sort((a, b) => b.publish_date - a.publish_date);
  };

  // Fallback sentiment analysis
  const fallbackAnalysis = (text) => {
    const lowerText = text.toLowerCase();

    const positiveKeywords = [
      "excellent",
      "amazing",
      "love",
      "great",
      "fantastic",
      "impressed",
      "recommend",
      "seamless",
      "helpful",
      "awesome",
      "perfect",
      "outstanding",
      "brilliant",
      "superb",
      "wonderful",
    ];
    const negativeKeywords = [
      "terrible",
      "awful",
      "hate",
      "disappointed",
      "frustrated",
      "poor",
      "worst",
      "issue",
      "problem",
      "broken",
      "failed",
      "unhappy",
      "bad",
      "horrible",
      "useless",
    ];
    const criticalKeywords = [
      "breach",
      "lawsuit",
      "fraud",
      "scam",
      "outage",
      "crisis",
      "urgent",
      "emergency",
      "security",
      "hacked",
      "vulnerability",
      "down",
      "critical",
    ];

    let positiveCount = 0;
    let negativeCount = 0;
    let criticalCount = 0;
    const foundKeywords = [];

    positiveKeywords.forEach((keyword) => {
      if (lowerText.includes(keyword)) {
        positiveCount++;
        foundKeywords.push(keyword);
      }
    });

    negativeKeywords.forEach((keyword) => {
      if (lowerText.includes(keyword)) {
        negativeCount++;
        foundKeywords.push(keyword);
      }
    });

    criticalKeywords.forEach((keyword) => {
      if (lowerText.includes(keyword)) {
        criticalCount++;
        foundKeywords.push(keyword);
      }
    });

    let sentiment = "neutral";
    let sentimentScore = 0;
    let confidence = 0.5;

    if (criticalCount > 0) {
      sentiment = "negative";
      sentimentScore = -80 - criticalCount * 5;
      confidence = 0.8;
    } else if (positiveCount > negativeCount + 1) {
      sentiment = "positive";
      sentimentScore = Math.min(positiveCount * 20, 80);
      confidence = 0.7;
    } else if (negativeCount > positiveCount + 1) {
      sentiment = "negative";
      sentimentScore = Math.max(negativeCount * -20, -80);
      confidence = 0.7;
    } else if (positiveCount > 0 && negativeCount > 0) {
      sentiment = "mixed";
      sentimentScore = (positiveCount - negativeCount) * 10;
      confidence = 0.6;
    }

    const topics = [];
    if (
      lowerText.includes("price") ||
      lowerText.includes("pricing") ||
      lowerText.includes("cost")
    )
      topics.push("pricing");
    if (lowerText.includes("support") || lowerText.includes("customer service"))
      topics.push("support");
    if (
      lowerText.includes("feature") ||
      lowerText.includes("update") ||
      lowerText.includes("release")
    )
      topics.push("features");
    if (
      lowerText.includes("bug") ||
      lowerText.includes("issue") ||
      lowerText.includes("problem")
    )
      topics.push("technical issues");
    if (lowerText.includes("competitor") || lowerText.includes("alternative"))
      topics.push("competition");

    return {
      sentiment: sentiment,
      sentiment_score: sentimentScore,
      confidence: confidence,
      summary: `${
        sentiment.charAt(0).toUpperCase() + sentiment.slice(1)
      } sentiment detected based on keyword analysis. ${
        criticalCount > 0 ? "Critical keywords found." : ""
      }`,
      rationale: `Analysis detected ${positiveCount} positive, ${negativeCount} negative, and ${criticalCount} critical keywords in the text.`,
      key_topics:
        topics.length > 0
          ? topics
          : foundKeywords.length > 0
          ? foundKeywords.slice(0, 5)
          : [],
      emotions_detected: {
        primary:
          sentiment === "positive"
            ? "satisfaction"
            : sentiment === "negative"
            ? "frustration"
            : "neutral",
        secondary: criticalCount > 0 ? ["concern", "urgency"] : [],
      },
      actionable_insights:
        criticalCount > 0
          ? ["Immediate attention required for critical issue"]
          : [],
      urgency_level: criticalCount > 0 ? "high" : "low",
      competitor_mentions: [],
      aspects_mentioned: [],
      recommended_action:
        criticalCount > 0 ? "Investigate and respond immediately" : null,
      is_fallback: true,
    };
  };

  // Claude analysis function - FIXED
  const analyzeWithClaude = async (text, source = null) => {
    if (!claudeConfig.enabled) {
      return fallbackAnalysis(text);
    }

    try {
      // Create a brand context string from the configuration
      const brandContextString =
        claudeConfig.brandContext.companyName || "a brand";

      const response = await apiService.analyzeSentiment({
        text: text,
        source: source || "manual",
        brandContext: brandContextString,
      });

      // Handle the response properly - check for nested analysis object
      if (response && response.success && response.analysis) {
        return response.analysis;
      } else if (response && response.sentiment) {
        // Handle if response is the analysis object directly
        return response;
      } else {
        console.warn("API response invalid, using fallback");
        return fallbackAnalysis(text);
      }
    } catch (error) {
      console.error("Claude API error:", error);
      if (claudeConfig.processingSettings.fallbackToKeywords) {
        return fallbackAnalysis(text);
      }
      throw error;
    }
  };

  // Analyze sentiment - FIXED SYNTAX
  const analyzeSentiment = async (text, mentionId = null, source = null) => {
    if (mentionId) {
      setAnalyzingItems((prev) => new Set(prev).add(mentionId));
    }

    try {
      let result;

      if (claudeConfig.enabled) {
        try {
          result = await analyzeWithClaude(text, source);
        } catch (claudeError) {
          console.error("Claude analysis failed:", claudeError);
          if (claudeConfig.processingSettings.fallbackToKeywords) {
            result = fallbackAnalysis(text);
          } else {
            throw new Error("Analysis failed and fallback is disabled");
          }
        }
      } else {
        result = fallbackAnalysis(text);
      }

      if (mentionId) {
        setAnalyzingItems((prev) => {
          const newSet = new Set(prev);
          newSet.delete(mentionId);
          return newSet;
        });
      }

      return result;
    } catch (err) {
      if (mentionId) {
        setAnalyzingItems((prev) => {
          const newSet = new Set(prev);
          newSet.delete(mentionId);
          return newSet;
        });
      }
      console.error("Analysis error:", err);
      return {
        sentiment: "neutral",
        sentiment_score: 0,
        confidence: 0.3,
        summary: "Analysis failed. Please check configuration.",
        rationale: err.message || "Unknown error occurred",
        key_topics: [],
        emotions_detected: { primary: "unknown", secondary: [] },
        actionable_insights: [],
        urgency_level: "low",
        competitor_mentions: [],
        aspects_mentioned: [],
        recommended_action: null,
        is_fallback: true,
        error: true,
      };
    }
  };

  // Analyze single mention
  const analyzeMention = async (mentionId) => {
    const mention = monitoringFeed.find((m) => m.id === mentionId);
    if (!mention) return;

    try {
      const analysis = await analyzeSentiment(
        mention.content,
        mention.id,
        mention.source
      );
      setMonitoringFeed((prev) => {
        const updated = prev.map((m) =>
          m.id === mentionId
            ? {
                ...m,
                claudeAnalysis: analysis,
                sentiment: analysis.sentiment,
                confidence: analysis.confidence,
                analyzedAt: new Date(),
              }
            : m
        );
        return updated;
      });
    } catch (err) {
      console.error("Analysis failed:", err);
    }
  };

  // Analyze all unanalyzed mentions
  const analyzeAllMentions = async () => {
    const unanalyzedMentions = monitoringFeed.filter(
      (m) => !m.claudeAnalysis || m.sentiment === "unanalyzed"
    );

    if (unanalyzedMentions.length === 0) {
      setAlerts((prev) =>
        [
          {
            id: Date.now(),
            type: "info",
            severity: "low",
            title: "No Mentions to Analyze",
            message: "All mentions have already been analyzed.",
            timestamp: new Date(),
            acknowledged: false,
          },
          ...prev,
        ].slice(0, 100)
      );
      return;
    }

    setAnalysisProgress({ current: 0, total: unanalyzedMentions.length });

    try {
      for (let i = 0; i < unanalyzedMentions.length; i++) {
        const mention = unanalyzedMentions[i];
        await analyzeMention(mention.id);
        setAnalysisProgress((prev) => ({ ...prev, current: i + 1 }));
      }

      setTimeout(() => {
        const newData = generateHistoricalData();
        setHistoricalData(newData);
        updateSentimentHeatmap();
      }, 100);

      setAlerts((prev) =>
        [
          {
            id: Date.now(),
            type: "analysis_complete",
            severity: "low",
            title: "Analysis Complete",
            message: `Successfully analyzed ${unanalyzedMentions.length} mentions`,
            timestamp: new Date(),
            acknowledged: false,
          },
          ...prev,
        ].slice(0, 100)
      );
    } catch (error) {
      console.error("Error analyzing mentions:", error);
    } finally {
      setAnalysisProgress({ current: 0, total: 0 });
    }
  };

  // Fetch mentions from RSS feeds
  const fetchFromRSSFeeds = async () => {
    const mentions = [];
    const keywords = dataSourceConfig.monitoringKeywords || ["AI"];
    console.log("RSS Filtering with keywords:", keywords);

    // CORS proxy options
    const corsProxies = [
      "https://api.allorigins.win/raw?url=",
      "https://corsproxy.io/?",
      "https://api.codetabs.com/v1/proxy?quest=",
    ];

    // Comprehensive RSS feed list
    const feeds = [
      // Technology News
      {
        name: "TechCrunch",
        url: "https://techcrunch.com/feed/",
        type: "Technology",
      },
      {
        name: "The Verge",
        url: "https://www.theverge.com/rss/index.xml",
        type: "Technology",
      },
      {
        name: "Wired",
        url: "https://www.wired.com/feed/rss",
        type: "Technology",
      },
      {
        name: "Ars Technica",
        url: "https://feeds.arstechnica.com/arstechnica/index",
        type: "Technology",
      },
      {
        name: "VentureBeat",
        url: "https://feeds.feedburner.com/venturebeat/SZYF",
        type: "Technology",
      },
      {
        name: "Hacker News",
        url: "https://hnrss.org/newest.rss",
        type: "Technology",
      },
      {
        name: "Reddit Technology",
        url: "https://www.reddit.com/r/technology/.rss",
        type: "Technology",
      },
      { name: "Dev.to", url: "https://dev.to/feed", type: "Technology" },

      // Business & Finance
      {
        name: "Reuters Business",
        url: "https://feeds.reuters.com/reuters/businessNews",
        type: "Business",
      },
      {
        name: "BBC Business",
        url: "https://feeds.bbci.co.uk/news/business/rss.xml",
        type: "Business",
      },
      {
        name: "Bloomberg",
        url: "https://feeds.bloomberg.com/markets/news.rss",
        type: "Business",
      },
      {
        name: "Financial Times",
        url: "https://www.ft.com/?format=rss",
        type: "Business",
      },
      {
        name: "WSJ Business",
        url: "https://feeds.a.dj.com/rss/WSJcomUSBusiness.xml",
        type: "Business",
      },

      // Press Releases & PR
      {
        name: "PR Newswire",
        url: "https://www.prnewswire.com/rss/all-news-releases-from-PR-newswire-news.rss",
        type: "PR",
      },
      {
        name: "Business Wire",
        url: "https://feed.businesswire.com/rss/home/?rss=G1QFDERJXkJeGVtQWA==",
        type: "PR",
      },
      {
        name: "PR Web",
        url: "https://www.prweb.com/rss2/daily.xml",
        type: "PR",
      },
      {
        name: "GlobeNewswire",
        url: "https://www.globenewswire.com/RssFeed/orgclass/1/feedTitle/GlobeNewswire%20-%20News%20Room",
        type: "PR",
      },

      // Marketing & Advertising
      {
        name: "Marketing Week",
        url: "https://www.marketingweek.com/feed/",
        type: "Marketing",
      },
      {
        name: "AdWeek",
        url: "https://www.adweek.com/feed/",
        type: "Marketing",
      },
      {
        name: "Marketing Land",
        url: "https://martech.org/feed/",
        type: "Marketing",
      },

      // General News
      {
        name: "CNN Business",
        url: "http://rss.cnn.com/rss/money_latest.rss",
        type: "News",
      },
      {
        name: "The Guardian Business",
        url: "https://www.theguardian.com/uk/business/rss",
        type: "News",
      },
      {
        name: "NYT Business",
        url: "https://rss.nytimes.com/services/xml/rss/nyt/Business.xml",
        type: "News",
      },

      // Industry Specific
      {
        name: "Healthcare IT News",
        url: "https://www.healthcareitnews.com/home/feed",
        type: "Healthcare",
      },
      {
        name: "Retail Dive",
        url: "https://www.retaildive.com/feeds/news/",
        type: "Retail",
      },
      {
        name: "EdTech Magazine",
        url: "https://edtechmagazine.com/higher/rss.xml",
        type: "Education",
      },
    ];

    // Filter feeds based on source type if configured
    const enabledFeeds =
      dataSourceConfig.aggregatorConfig?.sourceTypes?.length > 0
        ? feeds.filter((feed) =>
            dataSourceConfig.aggregatorConfig.sourceTypes.includes(feed.type)
          )
        : feeds;

    // Set initial fetch status
    setRssFetchStatus({ current: 0, total: enabledFeeds.length, feeds: [] });

    // Process feeds in batches to avoid overwhelming the browser
    const batchSize = 5;
    const feedBatches = [];
    for (let i = 0; i < enabledFeeds.length; i += batchSize) {
      feedBatches.push(enabledFeeds.slice(i, i + batchSize));
    }

    // Process each batch
    let processedFeeds = 0;
    for (const batch of feedBatches) {
      await Promise.all(
        batch.map(async (feed) => {
          let fetchSuccess = false;

          // Try different CORS proxies
          for (const corsProxy of corsProxies) {
            if (fetchSuccess) break;

            try {
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

              const response = await fetch(
                corsProxy + encodeURIComponent(feed.url),
                {
                  signal: controller.signal,
                }
              );
              clearTimeout(timeoutId);

              if (!response.ok) continue;

              const text = await response.text();

              // Parse RSS/XML
              const parser = new DOMParser();
              const xml = parser.parseFromString(text, "text/xml");

              // Check if it's valid RSS
              const parseError = xml.querySelector("parsererror");
              if (parseError) {
                console.warn(`Invalid RSS from ${feed.name}`);
                continue;
              }

              // Try both 'item' and 'entry' tags (RSS vs Atom)
              let items = xml.querySelectorAll("item");
              if (items.length === 0) {
                items = xml.querySelectorAll("entry");
              }

              let itemCount = 0;
              items.forEach((item) => {
                if (itemCount >= 3) return; // Limit to 3 items per feed

                // Extract content (handle both RSS and Atom formats)
                const title =
                  item.querySelector("title")?.textContent ||
                  item.querySelector("title")?.innerHTML ||
                  "";
                const description =
                  item.querySelector("description")?.textContent ||
                  item.querySelector("summary")?.textContent ||
                  item.querySelector("content")?.textContent ||
                  "";
                const link =
                  item.querySelector("link")?.textContent ||
                  item.querySelector("link")?.getAttribute("href") ||
                  "";
                const pubDate =
                  item.querySelector("pubDate")?.textContent ||
                  item.querySelector("published")?.textContent ||
                  item.querySelector("updated")?.textContent ||
                  new Date().toISOString();

                // Clean and combine content
                const cleanContent = (text) => {
                  return text
                    .replace(/<!\[CDATA\[(.*?)\]\]>/g, "$1")
                    .replace(/<[^>]*>/g, "")
                    .replace(/&lt;/g, "<")
                    .replace(/&gt;/g, ">")
                    .replace(/&amp;/g, "&")
                    .replace(/&quot;/g, '"')
                    .replace(/&#039;/g, "'")
                    .replace(/\s+/g, " ")
                    .trim();
                };

                const content = `${cleanContent(title)}. ${cleanContent(
                  description
                )}`;

                // Check if content contains any of our keywords
                const containsKeyword = keywords.some((keyword) =>
                  content.toLowerCase().includes(keyword.toLowerCase())
                );

                if (containsKeyword && content.length > 50) {
                  console.log(
                    "Found match for keyword in:",
                    feed.name,
                    "- Content:",
                    content.substring(0, 100)
                  );
                  itemCount++;
                  mentions.push({
                    id: `rss-${feed.name.replace(
                      /\s+/g,
                      "-"
                    )}-${Date.now()}-${Math.random()}`,
                    content:
                      content.substring(0, 500) +
                      (content.length > 500 ? "..." : ""),
                    source: feed.name,
                    sourceType: feed.type,
                    author: feed.name,
                    publish_date: new Date(pubDate),
                    url: link,
                    reach: Math.floor(Math.random() * 50000) + 5000,
                    engagement: {
                      likes: Math.floor(Math.random() * 1000),
                      shares: Math.floor(Math.random() * 200),
                      comments: Math.floor(Math.random() * 100),
                    },
                  });
                } else if (!containsKeyword) {
                  console.log(
                    "No keyword match in:",
                    feed.name,
                    "- Checked content:",
                    content.substring(0, 100)
                  );
                }
              });

              fetchSuccess = true;
              processedFeeds++;
              setRssFetchStatus((prev) => ({
                current: processedFeeds,
                total: prev.total,
                feeds: [
                  ...prev.feeds,
                  { name: feed.name, success: true, items: itemCount },
                ],
              }));
              console.log(
                `Successfully fetched ${itemCount} items from ${feed.name}`
              );
            } catch (error) {
              if (error.name === "AbortError") {
                console.warn(`Timeout fetching ${feed.name}`);
              } else {
                console.warn(
                  `Failed to fetch ${feed.name} with ${corsProxy}:`,
                  error.message
                );
              }
            }
          }

          if (!fetchSuccess) {
            processedFeeds++;
            setRssFetchStatus((prev) => ({
              current: processedFeeds,
              total: prev.total,
              feeds: [
                ...prev.feeds,
                { name: feed.name, success: false, items: 0 },
              ],
            }));
            console.error(`All CORS proxies failed for ${feed.name}`);
          }
        })
      );

      // Small delay between batches
      if (feedBatches.indexOf(batch) < feedBatches.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    // Reset status after a delay
    setTimeout(() => {
      setRssFetchStatus({ current: 0, total: 0, feeds: [] });
    }, 5000);

    console.log("Total RSS mentions found:", mentions.length);
    // If no mentions found from RSS, return empty array
    if (mentions.length === 0) {
      console.log("No RSS mentions found matching keywords");
      return [];
    }

    // Sort by date and return unique mentions
    const uniqueMentions = Array.from(
      new Map(mentions.map((item) => [item.content, item])).values()
    );

    return uniqueMentions.sort((a, b) => b.publish_date - a.publish_date);
  };

  // Fetch raw mentions based on source type
  const fetchRawMentions = async () => {
    setFetchError(null);

    try {
      let mentions = [];

      switch (dataSourceConfig.sourceType) {
        case "api":
          if (
            !dataSourceConfig.apiConfig?.endpoint ||
            !dataSourceConfig.apiConfig?.apiKey
          ) {
            throw new Error(
              "Please configure your API endpoint and key in Data Sources tab"
            );
          }
          // For now, throw error as API integration would need backend support
          throw new Error(
            "API integration requires backend configuration. Please use Demo or RSS Aggregators for now."
          );

        case "aggregator":
          // Show status that we're fetching from RSS
          setFetchError(null);
          mentions = await fetchFromRSSFeeds();
          // Don't throw error for empty RSS results, let parent handle it
          break;

        case "demo":
        default:
          mentions = generateDemoMentions();
          break;
      }

      // Only throw error for demo mode if no mentions
      if (
        mentions.length === 0 &&
        dataSourceConfig.sourceType !== "aggregator"
      ) {
        throw new Error("No mentions found. Try adjusting your keywords.");
      }

      return mentions;
    } catch (error) {
      setFetchError(error.message);
      throw error;
    }
  };

  // Fetch mentions without analysis
  const fetchMentions = async () => {
    setLoading(true);
    setFetchError(null);

    try {
      const keywords = dataSourceConfig.monitoringKeywords || [];
      if (keywords.length === 0 || keywords.every((k) => !k.trim())) {
        setFetchError(
          "Please add monitoring keywords in the Data Sources tab first."
        );
        setLoading(false);
        return;
      }

      // Check if aggregator mode has categories selected
      if (
        dataSourceConfig.sourceType === "aggregator" &&
        (!dataSourceConfig.aggregatorConfig?.sourceTypes ||
          dataSourceConfig.aggregatorConfig.sourceTypes.length === 0)
      ) {
        setFetchError(
          "Please select at least one RSS feed category in the Data Sources tab."
        );
        setLoading(false);
        return;
      }

      const rawMentions = await fetchRawMentions();

      if (!rawMentions || rawMentions.length === 0) {
        setFetchError(
          "No mentions found. Try different keywords or check your data source configuration."
        );
        setLoading(false);
        return;
      }

      // Apply filters
      const filteredMentions = rawMentions.filter((mention) => {
        const content = mention.content.toLowerCase();

        if (dataSourceConfig.filterConfig.includeKeywords.length > 0) {
          const hasIncludeKeyword =
            dataSourceConfig.filterConfig.includeKeywords.some((keyword) =>
              content.includes(keyword.toLowerCase())
            );
          if (!hasIncludeKeyword) return false;
        }

        if (dataSourceConfig.filterConfig.excludeKeywords.length > 0) {
          const hasExcludeKeyword =
            dataSourceConfig.filterConfig.excludeKeywords.some((keyword) =>
              content.includes(keyword.toLowerCase())
            );
          if (hasExcludeKeyword) return false;
        }

        if (
          dataSourceConfig.filterConfig.minReach > 0 &&
          mention.reach < dataSourceConfig.filterConfig.minReach
        ) {
          return false;
        }

        return true;
      });

      // Add mentions without analysis
      const mentionsWithDefaults = filteredMentions.map((mention) => ({
        ...mention,
        claudeAnalysis: null,
        sentiment: "unanalyzed",
        confidence: 0,
        analyzedAt: null,
      }));

      // Update mentions feed
      setMonitoringFeed((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const newMentions = mentionsWithDefaults.filter(
          (m) => !existingIds.has(m.id)
        );
        const updated = [...newMentions, ...prev].slice(0, 500);
        setStoredMentions(updated);
        return updated;
      });

      setLastUpdate(new Date());

      if (filteredMentions.length > 0) {
        setShowQuickStart(false);
        setAlerts((prev) =>
          [
            {
              id: Date.now(),
              type: "fetch_success",
              severity: "low",
              title: "Mentions Retrieved Successfully",
              message: `Found ${filteredMentions.length} new mentions. Click "Analyze" to run sentiment analysis.`,
              timestamp: new Date(),
              acknowledged: false,
            },
            ...prev,
          ].slice(0, 100)
        );

        // Auto-analyze if enabled
        if (claudeConfig.processingSettings.autoAnalyze) {
          setTimeout(() => {
            analyzeAllMentions();
          }, 500);
        }
      } else if (dataSourceConfig.sourceType === "aggregator") {
        // Show warning for RSS feeds but don't throw error
        setAlerts((prev) =>
          [
            {
              id: Date.now(),
              type: "warning",
              severity: "medium",
              title: "No RSS Mentions Found",
              message:
                "No mentions matching your keywords were found in the RSS feeds. This could be due to network issues or no matching content. Try adding more keywords or selecting different categories.",
              timestamp: new Date(),
              acknowledged: false,
            },
            ...prev,
          ].slice(0, 100)
        );
      }
    } catch (err) {
      console.error("Error fetching mentions:", err);
      setFetchError(
        err.message ||
          "Failed to fetch mentions. Please check your configuration."
      );
    } finally {
      setLoading(false);
    }
  };

  // Re-analyze a specific mention
  const reanalyzeMention = async (mentionId) => {
    await analyzeMention(mentionId);
  };

  // Toggle summary expansion
  const toggleSummary = (mentionId) => {
    setExpandedSummaries((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(mentionId)) {
        newSet.delete(mentionId);
      } else {
        newSet.add(mentionId);
      }
      return newSet;
    });
  };

  // Generate historical data
  const generateHistoricalData = () => {
    const analyzedMentions = monitoringFeed.filter(
      (m) => m.sentiment !== "unanalyzed" && m.claudeAnalysis
    );

    if (analyzedMentions.length === 0) {
      const data = [];
      const now = new Date();

      for (let i = 23; i >= 0; i--) {
        const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
        const hourData = {
          time: hour.toLocaleTimeString("en-US", { hour: "numeric" }),
          positive: 0,
          negative: 0,
          neutral: 0,
          mixed: 0,
          total: 0,
        };
        data.push(hourData);
      }

      return data;
    }

    const hourlyData = {};
    const now = new Date();

    for (let i = 23; i >= 0; i--) {
      const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hourKey = hour.toLocaleTimeString("en-US", { hour: "numeric" });
      hourlyData[hourKey] = {
        time: hourKey,
        positive: 0,
        negative: 0,
        neutral: 0,
        mixed: 0,
        total: 0,
      };
    }

    analyzedMentions.forEach((mention) => {
      const mentionDate = new Date(mention.publish_date);
      const hoursSinceNow = Math.floor((now - mentionDate) / (1000 * 60 * 60));

      if (hoursSinceNow < 24 && hoursSinceNow >= 0) {
        const hourKey = mentionDate.toLocaleTimeString("en-US", {
          hour: "numeric",
        });
        if (hourlyData[hourKey]) {
          if (mention.sentiment === "positive") hourlyData[hourKey].positive++;
          else if (mention.sentiment === "negative")
            hourlyData[hourKey].negative++;
          else if (mention.sentiment === "neutral")
            hourlyData[hourKey].neutral++;
          else if (mention.sentiment === "mixed") hourlyData[hourKey].mixed++;
          hourlyData[hourKey].total++;
        }
      }
    });

    const data = Object.values(hourlyData);
    return data;
  };

  // Update sentiment heatmap
  const updateSentimentHeatmap = () => {
    const analyzedMentions = monitoringFeed.filter(
      (m) => m.sentiment !== "unanalyzed" && m.claudeAnalysis
    );
    const heatmapData = [];
    const now = new Date();

    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        const dayStart = new Date(now);
        dayStart.setDate(dayStart.getDate() - day);
        dayStart.setHours(hour, 0, 0, 0);

        const dayEnd = new Date(dayStart);
        dayEnd.setHours(hour + 1, 0, 0, 0);

        const hourMentions = analyzedMentions.filter((m) => {
          const date = new Date(m.publish_date);
          return date >= dayStart && date < dayEnd;
        });

        if (hourMentions.length > 0) {
          const avgScore =
            hourMentions.reduce(
              (sum, m) => sum + (m.claudeAnalysis?.sentiment_score || 0),
              0
            ) / hourMentions.length;

          heatmapData.push({
            day: day,
            hour: hour,
            value: avgScore,
            count: hourMentions.length,
          });
        }
      }
    }

    setSentimentHeatmap(heatmapData);
  };

  // Calculate metrics
  const calculateMetrics = useMemo(() => {
    const analyzedMentions = monitoringFeed.filter(
      (m) => m.sentiment !== "unanalyzed" && m.claudeAnalysis
    );

    const totalMentions = monitoringFeed.length;
    const analyzedCount = analyzedMentions.length;
    const unanalyzedCount = totalMentions - analyzedCount;

    const positiveMentions = analyzedMentions.filter(
      (m) => m.sentiment === "positive"
    ).length;
    const negativeMentions = analyzedMentions.filter(
      (m) => m.sentiment === "negative"
    ).length;
    const neutralMentions = analyzedMentions.filter(
      (m) => m.sentiment === "neutral"
    ).length;
    const mixedMentions = analyzedMentions.filter(
      (m) => m.sentiment === "mixed"
    ).length;

    const avgSentimentScore =
      analyzedCount > 0
        ? Math.round(
            analyzedMentions.reduce(
              (sum, m) => sum + (m.claudeAnalysis?.sentiment_score || 0),
              0
            ) / analyzedCount
          )
        : 0;

    const avgConfidence =
      analyzedCount > 0
        ? analyzedMentions.reduce(
            (sum, m) =>
              sum + (m.claudeAnalysis?.confidence || m.confidence || 0),
            0
          ) / analyzedCount
        : 0;

    const totalReach = monitoringFeed.reduce(
      (sum, m) => sum + (m.reach || 0),
      0
    );

    const sentimentBySource = {};
    analyzedMentions.forEach((mention) => {
      if (!sentimentBySource[mention.source]) {
        sentimentBySource[mention.source] = {
          positive: 0,
          negative: 0,
          neutral: 0,
          mixed: 0,
          total: 0,
        };
      }
      if (mention.sentiment === "positive")
        sentimentBySource[mention.source].positive++;
      else if (mention.sentiment === "negative")
        sentimentBySource[mention.source].negative++;
      else if (mention.sentiment === "neutral")
        sentimentBySource[mention.source].neutral++;
      else if (mention.sentiment === "mixed")
        sentimentBySource[mention.source].mixed++;
      sentimentBySource[mention.source].total++;
    });

    const topicCounts = {};
    analyzedMentions.forEach((mention) => {
      if (mention.claudeAnalysis?.key_topics) {
        mention.claudeAnalysis.key_topics.forEach((topic) => {
          topicCounts[topic] = (topicCounts[topic] || 0) + 1;
        });
      }
    });

    const trendingTopics = Object.entries(topicCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([topic, count]) => ({ topic, count }));

    const recentAnalyzedMentions = analyzedMentions.slice(0, 10);
    const recentAvgScore =
      recentAnalyzedMentions.length > 0
        ? recentAnalyzedMentions.reduce(
            (sum, m) => sum + (m.claudeAnalysis?.sentiment_score || 0),
            0
          ) / recentAnalyzedMentions.length
        : 0;
    const sentimentTrend =
      recentAvgScore > avgSentimentScore
        ? "improving"
        : recentAvgScore < avgSentimentScore
        ? "declining"
        : "stable";

    return {
      totalMentions,
      analyzedCount,
      unanalyzedCount,
      positiveMentions,
      negativeMentions,
      neutralMentions,
      mixedMentions,
      avgSentimentScore,
      avgConfidence,
      totalReach,
      sentimentBySource,
      trendingTopics,
      sentimentTrend,
      recentAvgScore,
    };
  }, [monitoringFeed]);

  // Prepare chart data
  const { pieData, sourceData, metrics } = useMemo(() => {
    const metricsData = calculateMetrics;

    const pieChartData = [];
    if (metricsData.analyzedCount > 0) {
      if (metricsData.positiveMentions > 0)
        pieChartData.push({
          name: "Positive",
          value: metricsData.positiveMentions,
          color: "#10B981",
        });
      if (metricsData.negativeMentions > 0)
        pieChartData.push({
          name: "Negative",
          value: metricsData.negativeMentions,
          color: "#EF4444",
        });
      if (metricsData.neutralMentions > 0)
        pieChartData.push({
          name: "Neutral",
          value: metricsData.neutralMentions,
          color: "#6B7280",
        });
      if (metricsData.mixedMentions > 0)
        pieChartData.push({
          name: "Mixed",
          value: metricsData.mixedMentions,
          color: "#8B5CF6",
        });
    }

    const sourceChartData = Object.entries(metricsData.sentimentBySource)
      .filter(([_, data]) => data.total > 0)
      .map(([source, data]) => ({
        source,
        positive: data.positive || 0,
        negative: data.negative || 0,
        neutral: data.neutral || 0,
        mixed: data.mixed || 0,
      }))
      .slice(0, 10);

    // Debug logging
    console.log("Chart Data Debug:", {
      analyzedCount: metricsData.analyzedCount,
      pieData: pieChartData,
      sourceData: sourceChartData,
      historicalData: historicalData,
    });

    return {
      pieData: pieChartData,
      sourceData: sourceChartData,
      metrics: metricsData,
    };
  }, [calculateMetrics, historicalData]);

  // Check for alerts
  const checkForAlerts = useCallback(() => {
    const newAlerts = [];
    const now = new Date();

    monitoringFeed.forEach((mention) => {
      if (!mention.claudeAnalysis) return;

      const analysis = mention.claudeAnalysis;

      if (
        analysis.urgency_level === "critical" &&
        alertConfig.criticalTopics.enabled
      ) {
        const existingAlert = alerts.find(
          (a) =>
            a.data?.mentionId === mention.id && a.type === "critical_content"
        );

        if (!existingAlert) {
          newAlerts.push({
            id: Date.now() + Math.random(),
            type: "critical_content",
            severity: "critical",
            title: "Critical Content Detected",
            message: `Critical mention found in ${mention.source}: "${analysis.summary}"`,
            timestamp: now,
            acknowledged: false,
            data: {
              mentionId: mention.id,
              source: mention.source,
              urgency: analysis.urgency_level,
              topics: analysis.key_topics,
              recommendation: analysis.recommended_action,
            },
          });
        }
      }
    });

    if (newAlerts.length > 0) {
      setAlerts((prev) => [...newAlerts, ...prev].slice(0, 100));
    }
  }, [monitoringFeed, alertConfig, alerts]);

  // Acknowledge alert
  const acknowledgeAlert = (alertId) => {
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      )
    );
  };

  // Clear alert
  const clearAlert = (alertId) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
  };

  // Export to CSV
  const exportToCSV = () => {
    const csvData = [];

    csvData.push([
      "AI Monitoring and Sentiment Analysis Report",
      new Date().toLocaleDateString(),
    ]);
    csvData.push([]);
    csvData.push(["Summary Metrics"]);
    csvData.push(["Metric", "Value"]);
    csvData.push(["Total Mentions", metrics.totalMentions]);
    csvData.push(["Analyzed Mentions", metrics.analyzedCount]);
    csvData.push(["Unanalyzed Mentions", metrics.unanalyzedCount]);
    csvData.push(["Average Sentiment Score", metrics.avgSentimentScore]);
    csvData.push(["Sentiment Trend", metrics.sentimentTrend]);
    csvData.push(["Positive Mentions", metrics.positiveMentions]);
    csvData.push(["Negative Mentions", metrics.negativeMentions]);
    csvData.push(["Neutral Mentions", metrics.neutralMentions]);
    csvData.push(["Mixed Mentions", metrics.mixedMentions]);
    csvData.push([
      "Average Confidence",
      (metrics.avgConfidence * 100).toFixed(2) + "%",
    ]);
    csvData.push(["Total Reach", metrics.totalReach]);
    csvData.push([]);

    csvData.push(["Detailed Mentions"]);
    csvData.push([
      "Date/Time",
      "Source",
      "Content",
      "Sentiment",
      "Score",
      "Confidence",
      "Summary",
      "Key Topics",
      "Urgency",
      "Reach",
      "Author",
      "URL",
      "Analysis Status",
    ]);

    monitoringFeed.forEach((mention) => {
      csvData.push([
        new Date(mention.publish_date).toLocaleString(),
        mention.source,
        mention.content.replace(/,/g, ";"),
        mention.sentiment,
        mention.claudeAnalysis?.sentiment_score || 0,
        mention.claudeAnalysis
          ? (
              (mention.claudeAnalysis?.confidence || mention.confidence || 0) *
              100
            ).toFixed(2) + "%"
          : "N/A",
        mention.claudeAnalysis?.summary || "N/A",
        mention.claudeAnalysis?.key_topics?.join("; ") || "N/A",
        mention.claudeAnalysis?.urgency_level || "N/A",
        mention.reach || 0,
        mention.author || "N/A",
        mention.url || "N/A",
        mention.sentiment === "unanalyzed" ? "Pending" : "Analyzed",
      ]);
    });

    const csv = Papa.unparse(csvData);

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `ai-monitoring-sentiment-analysis-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    link.click();
  };

  // Export to JSON
  const exportToJSON = () => {
    const exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        timeRange: metricsTimeRange,
        totalMentions: metrics.totalMentions,
        analyzedMentions: metrics.analyzedCount,
        unanalyzedMentions: metrics.unanalyzedCount,
        dataSource: dataSourceConfig.sourceType,
        analysisMethod: claudeConfig.enabled ? "Claude AI" : "Keyword-based",
      },
      configuration: {
        monitoringKeywords: dataSourceConfig.monitoringKeywords || [],
        dataSources:
          dataSourceConfig.sourceType === "aggregator"
            ? Object.keys(
                dataSourceConfig.aggregatorConfig?.sources || {}
              ).filter(
                (source) =>
                  dataSourceConfig.aggregatorConfig?.sources?.[source]?.enabled
              )
            : [dataSourceConfig.sourceType],
      },
      summary: {
        avgSentimentScore: metrics.avgSentimentScore,
        sentimentTrend: metrics.sentimentTrend,
        distribution: {
          positive: metrics.positiveMentions,
          negative: metrics.negativeMentions,
          neutral: metrics.neutralMentions,
          mixed: metrics.mixedMentions,
        },
        avgConfidence: metrics.avgConfidence,
        totalReach: metrics.totalReach,
      },
      sentimentBySource: metrics.sentimentBySource,
      trendingTopics: metrics.trendingTopics,
      sentimentHeatmap: sentimentHeatmap,
      searchHistory: searchHistory,
      mentions: monitoringFeed.map((m) => ({
        id: m.id,
        date: m.publish_date,
        source: m.source,
        sourceType: m.sourceType,
        content: m.content,
        sentiment: m.sentiment,
        confidence: m.confidence,
        reach: m.reach,
        author: m.author,
        url: m.url,
        claudeAnalysis: m.claudeAnalysis,
        analyzed: m.sentiment !== "unanalyzed",
      })),
    };

    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `ai-monitoring-sentiment-analysis-${
      new Date().toISOString().split("T")[0]
    }.json`;
    link.click();
  };

  // Export data
  const exportData = () => {
    switch (exportFormat) {
      case "csv":
        exportToCSV();
        break;
      case "json":
        exportToJSON();
        break;
      default:
        exportToCSV();
    }
  };

  // Save configuration
  const saveAllConfigurations = () => {
    setConfigSaved(true);

    localStorage.setItem(
      "aiMonitorConfig",
      JSON.stringify({
        dataSource: dataSourceConfig,
        claude: claudeConfig,
        alerts: alertConfig,
      })
    );

    setTimeout(() => {
      setConfigSaved(false);
    }, 3000);
  };

  // Auto-refresh effect
  useEffect(() => {
    if (!isAutoRefresh) return;

    const interval = setInterval(
      () => {
        fetchMentions();
      },
      dataSourceConfig.sourceType === "api"
        ? dataSourceConfig.apiConfig?.pollingInterval || 300000
        : dataSourceConfig.aggregatorConfig?.updateInterval || 300000
    );

    return () => clearInterval(interval);
  }, [isAutoRefresh, dataSourceConfig]);

  // Update historical data and heatmap when monitoring feed changes
  useEffect(() => {
    const newHistoricalData = generateHistoricalData();
    setHistoricalData(newHistoricalData);
    updateSentimentHeatmap();
  }, [monitoringFeed]);

  // Check for alerts when monitoring feed changes
  useEffect(() => {
    if (monitoringFeed.length > 0) {
      checkForAlerts();
    }
  }, [monitoringFeed, checkForAlerts]);
  // Helper function to get active sources count
  const getActiveSourcesCount = () => {
    let count = 0;
    if (dataSourceConfig.sourceType === "demo") count = 1;
    if (dataSourceConfig.sourceType === "aggregator") {
      count = dataSourceConfig.aggregatorConfig?.sourceTypes?.length || 0;
    }
    if (dataSourceConfig.websiteConfig?.monitors) {
      count += dataSourceConfig.websiteConfig.monitors.filter(
        (m) => m.enabled
      ).length;
    }
    return count;
  };

  // Helper function to format time ago
  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  // Helper function to format reach numbers
  const formatReach = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Add agent activity
  const addAgentActivity = (type, message) => {
    setAgentActivities((prev) =>
      [
        {
          id: Date.now(),
          type,
          message,
          timestamp: new Date(),
        },
        ...prev,
      ].slice(0, 50)
    );
  };

  // Activate agent
  const activateAgent = () => {
    setIsAgentActive(!isAgentActive);
    addAgentActivity(
      isAgentActive ? "deactivated" : "activated",
      isAgentActive
        ? "Agent deactivated by user"
        : "Agent activated and monitoring"
    );
  };

  // Crisis mode
  const activateCrisisMode = () => {
    addAgentActivity(
      "alert",
      "Crisis monitoring mode activated - checking every 30 seconds"
    );
    // Add crisis mode logic here
  };
  // Component: Agent Status Card
  const AgentStatusCard = ({ icon, title, count, status, onClick }) => (
    <button
      onClick={onClick}
      className={`p-4 rounded-lg border transition-all ${
        status === "active"
          ? "border-green-200 bg-green-50 hover:bg-green-100"
          : "border-gray-200 bg-gray-50 hover:bg-gray-100"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-lg ${
              status === "active"
                ? "bg-green-200 text-green-700"
                : "bg-gray-200 text-gray-600"
            }`}
          >
            {icon}
          </div>
          <div className="text-left">
            <p className="text-2xl font-bold text-gray-800">{count}</p>
            <p className="text-xs text-gray-600">{title}</p>
          </div>
        </div>
        <div
          className={`w-2 h-2 rounded-full ${
            status === "active" ? "bg-green-500" : "bg-gray-400"
          }`}
        />
      </div>
    </button>
  );

  // Component: Quick Action Card
  const QuickActionCard = ({
    icon,
    title,
    description,
    buttonText,
    onClick,
    color = "blue",
  }) => {
    const colorClasses = {
      blue: "from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700",
      purple:
        "from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700",
      red: "from-red-500 to-red-600 hover:from-red-600 hover:to-red-700",
    };

    return (
      <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
        <div
          className={`w-16 h-16 bg-gradient-to-br ${colorClasses[color]} rounded-xl flex items-center justify-center text-white mb-4`}
        >
          {icon}
        </div>
        <h3 className="font-bold text-gray-800 mb-2">{title}</h3>
        <p className="text-sm text-gray-600 mb-4">{description}</p>
        <button
          onClick={onClick}
          className={`w-full py-2 bg-gradient-to-r ${colorClasses[color]} text-white rounded-lg font-medium transition-all`}
        >
          {buttonText}
        </button>
      </div>
    );
  };

  // Component: Agent Activity Log
  const AgentActivityLog = ({ activities }) => (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <Activity className="w-5 h-5 text-blue-600" />
        Agent Activity Log
      </h3>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {activities.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No activity yet</p>
        ) : (
          activities.map((activity, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg"
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  activity.type === "scan"
                    ? "bg-blue-500"
                    : activity.type === "alert"
                    ? "bg-red-500"
                    : activity.type === "change"
                    ? "bg-yellow-500"
                    : "bg-gray-500"
                }`}
              />
              <div className="flex-1">
                <p className="text-sm text-gray-800">{activity.message}</p>
                <p className="text-xs text-gray-500">
                  {getTimeAgo(activity.timestamp)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-6">
        {/* Quick Start Guide */}
        {showQuickStart &&
          monitoringFeed.length === 0 &&
          activeTab === "monitor" && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-green-600 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-green-900">
                    Quick Start Guide
                  </h4>
                  <p className="text-sm text-green-800 mt-1">
                    1. Keywords are pre-configured with "AI" and "artificial
                    intelligence"
                    <br />
                    2. Demo mode is enabled for instant testing
                    <br />
                    3. Click "Fetch Mentions" to retrieve sample mentions
                    <br />
                    4.{" "}
                    <strong>
                      Important: Click "Analyze All" to analyze mentions -
                      charts won't show data until mentions are analyzed!
                    </strong>
                    <br />
                    5. View charts in the "Brand Statistics" tab
                    <br />
                    6. Configure real data sources when ready in the "Data
                    Sources" tab
                  </p>
                </div>
                <button
                  onClick={() => setShowQuickStart(false)}
                  className="text-green-600 hover:text-green-800"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}

        {/* AI Agent Header - New Design */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {/* Animated Agent Avatar */}
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Bot className="w-8 h-8 text-white" />
                </div>
                {/* Status Indicator */}
                <div
                  className={`absolute bottom-0 right-0 w-5 h-5 rounded-full border-2 border-white ${
                    isAgentActive ? "bg-green-500 animate-pulse" : "bg-gray-400"
                  }`}
                />
              </div>

              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-1">
                  AI Monitoring Agent
                </h1>
                <p className="text-gray-600">
                  Your intelligent PR surveillance system powered by Claude AI
                </p>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-sm text-gray-500">
                    Monitoring:{" "}
                    <strong className="text-blue-600">
                      {getActiveSourcesCount()} sources
                    </strong>
                  </span>
                  <span className="text-sm text-gray-500">
                    Keywords:{" "}
                    <strong className="text-purple-600">
                      {dataSourceConfig.monitoringKeywords.length} active
                    </strong>
                  </span>
                  <span className="text-sm text-gray-500">
                    Last scan:{" "}
                    <strong className="text-green-600">
                      {lastUpdate ? getTimeAgo(lastUpdate) : "Never"}
                    </strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Agent Control Panel */}
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setShowAgentConfig(!showAgentConfig)}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 font-medium flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Configure Agent
              </button>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={isAgentActive}
                    onChange={(e) => setIsAgentActive(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-gray-700">Agent Active</span>
                </label>
              </div>
            </div>
          </div>

          {/* Agent Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <AgentStatusCard
              icon={<Globe className="w-5 h-5" />}
              title="Website Monitors"
              count={dataSourceConfig.websiteConfig?.monitors?.length || 0}
              status={
                dataSourceConfig.websiteConfig?.monitors?.some((m) => m.enabled)
                  ? "active"
                  : "inactive"
              }
              onClick={() => setActiveTab("agent")}
            />
            <AgentStatusCard
              icon={<Rss className="w-5 h-5" />}
              title="RSS Feeds"
              count={
                dataSourceConfig.aggregatorConfig?.sourceTypes?.length || 0
              }
              status={
                dataSourceConfig.sourceType === "aggregator"
                  ? "active"
                  : "inactive"
              }
              onClick={() => setActiveTab("agent")}
            />
            <AgentStatusCard
              icon={<Search className="w-5 h-5" />}
              title="Keywords Tracked"
              count={
                dataSourceConfig.monitoringKeywords?.filter((k) => k.trim())
                  .length || 0
              }
              status="active"
              onClick={() => setActiveTab("agent")}
            />
            <AgentStatusCard
              icon={<Brain className="w-5 h-5" />}
              title="AI Analysis"
              count={metrics.analyzedCount}
              status={claudeConfig.enabled ? "active" : "inactive"}
              onClick={() => setActiveTab("claude")}
            />
          </div>
        </div>

        {/* Tab Navigation - Updated for Agent */}
        <div className="flex gap-4 mt-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab("monitor")}
            className={`px-6 py-3 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === "monitor"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <Activity className="w-4 h-4" />
            Live Feed
          </button>
          <button
            onClick={() => setActiveTab("agent")}
            className={`px-6 py-3 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-2 relative ${
              activeTab === "agent"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <Bot className="w-4 h-4" />
            Agent Config
            {/* Pulse indicator for new feature */}
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
            </span>
          </button>
          <button
            onClick={() => setActiveTab("metrics")}
            className={`px-6 py-3 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === "metrics"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Analytics
          </button>
          <button
            onClick={() => setActiveTab("alerts")}
            className={`px-6 py-3 rounded-lg font-medium transition-colors whitespace-nowrap relative flex items-center gap-2 ${
              activeTab === "alerts"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <Bell className="w-4 h-4" />
            Alerts
            {alerts.filter((a) => !a.acknowledged).length > 0 && (
              <span className="ml-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {alerts.filter((a) => !a.acknowledged).length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("claude")}
            className={`px-6 py-3 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeTab === "claude"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <Brain className="w-4 h-4" />
            AI Config
          </button>
        </div>

        {/* Live Monitoring Tab - Enhanced for Agent */}
        {activeTab === "monitor" && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Activity className="w-6 h-6 text-blue-600" />
                  {loading && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 rounded-full animate-ping" />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    Live Intelligence Feed
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {isAgentActive ? (
                      <>
                        <span className="inline-flex items-center gap-1">
                          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          Agent actively monitoring {getActiveSourcesCount()}{" "}
                          sources
                        </span>
                      </>
                    ) : (
                      "Agent is in standby mode"
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={activateAgent}
                  className={`px-5 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    isAgentActive
                      ? "bg-gray-600 text-white hover:bg-gray-700"
                      : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
                  }`}
                >
                  <Power className="w-4 h-4" />
                  {isAgentActive ? "Deactivate Agent" : "Activate Agent"}
                </button>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isAutoRefresh}
                    onChange={(e) => setIsAutoRefresh(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-700">Auto-refresh</span>
                </label>

                {monitoringFeed.filter(
                  (m) => !m.claudeAnalysis || m.sentiment === "unanalyzed"
                ).length > 0 && (
                  <button
                    onClick={analyzeAllMentions}
                    disabled={analysisProgress.total > 0}
                    className={`px-5 py-2.5 rounded-lg font-medium transition-colors ${
                      analysisProgress.total > 0
                        ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                        : "bg-purple-600 text-white hover:bg-purple-700"
                    }`}
                  >
                    {analysisProgress.total > 0
                      ? "Analyzing..."
                      : `Analyze All (${
                          monitoringFeed.filter(
                            (m) =>
                              !m.claudeAnalysis || m.sentiment === "unanalyzed"
                          ).length
                        })`}
                  </button>
                )}

                <button
                  onClick={fetchMentions}
                  disabled={loading}
                  className={`px-5 py-2.5 rounded-lg font-medium transition-colors ${
                    loading
                      ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {loading ? "Fetching..." : "Fetch Mentions"}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {fetchError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-red-600 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <h4 className="text-sm font-medium text-red-900">
                      Error fetching mentions
                    </h4>
                    <p className="text-sm text-red-800 mt-1">{fetchError}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Analysis Progress Bar */}
            {analysisProgress.total > 0 && (
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>
                    Analyzing mentions with{" "}
                    {claudeConfig.enabled ? "Claude AI" : "keyword analysis"}...
                  </span>
                  <span>
                    {analysisProgress.current} / {analysisProgress.total}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full transition-all"
                    style={{
                      width: `${
                        (analysisProgress.current / analysisProgress.total) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* RSS Fetch Progress */}
            {rssFetchStatus.total > 0 && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-blue-800">
                    Fetching RSS Feeds...
                  </h4>
                  <span className="text-sm text-blue-700">
                    {rssFetchStatus.current} / {rssFetchStatus.total}
                  </span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{
                      width: `${
                        (rssFetchStatus.current / rssFetchStatus.total) * 100
                      }%`,
                    }}
                  />
                </div>
                <div className="max-h-20 overflow-y-auto">
                  <div className="flex flex-wrap gap-1">
                    {rssFetchStatus.feeds.map((feed, idx) => (
                      <span
                        key={idx}
                        className={`text-xs px-2 py-0.5 rounded ${
                          feed.success
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {feed.name} ({feed.items})
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Loading or Feed Content */}
            {loading && monitoringFeed.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="text-gray-600">
                    {(dataSourceConfig.monitoringKeywords || []).length === 0
                      ? "No keywords configured. Add keywords in Data Sources tab."
                      : `Fetching mentions for "${dataSourceConfig.monitoringKeywords[0]}"...`}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {monitoringFeed.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <svg
                      className="w-16 h-16 mx-auto mb-4 text-gray-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <p className="text-lg font-medium mb-2">
                      No mentions found yet
                    </p>
                    <p className="text-sm">
                      {(dataSourceConfig.monitoringKeywords || []).filter((k) =>
                        k.trim()
                      ).length === 0
                        ? "Add monitoring keywords in the Data Sources tab first."
                        : 'Click "Fetch Mentions" to start monitoring.'}
                    </p>
                  </div>
                ) : (
                  monitoringFeed.slice(0, 50).map((item) => (
                    <div
                      key={item.id}
                      className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                    >
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-blue-600">
                              {item.source}
                            </span>
                            {item.sourceType && (
                              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                                {item.sourceType}
                              </span>
                            )}
                            <span className="text-gray-500 text-sm">
                              {new Date(item.publish_date).toLocaleTimeString()}
                            </span>
                            {item.reach > 0 && (
                              <>
                                <span className="text-gray-400">•</span>
                                <span className="text-gray-500 text-sm">
                                  Reach: {item.reach.toLocaleString()}
                                </span>
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {analyzingItems.has(item.id) ? (
                              <div className="flex items-center gap-2 text-purple-600">
                                <svg
                                  className="animate-spin h-4 w-4"
                                  viewBox="0 0 24 24"
                                >
                                  <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    fill="none"
                                  ></circle>
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  ></path>
                                </svg>
                                <span className="text-sm">Analyzing...</span>
                              </div>
                            ) : (
                              <>
                                {item.sentiment === "unanalyzed" ||
                                !item.claudeAnalysis ? (
                                  <button
                                    onClick={() => analyzeMention(item.id)}
                                    className="px-4 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
                                  >
                                    Analyze
                                  </button>
                                ) : (
                                  <>
                                    <span
                                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                                        item.sentiment === "positive"
                                          ? "bg-green-100 text-green-800"
                                          : item.sentiment === "negative"
                                          ? "bg-red-100 text-red-800"
                                          : item.sentiment === "mixed"
                                          ? "bg-purple-100 text-purple-800"
                                          : "bg-gray-100 text-gray-800"
                                      }`}
                                    >
                                      {item.sentiment} (
                                      {item.claudeAnalysis.sentiment_score})
                                    </span>
                                    {item.claudeAnalysis.urgency_level ===
                                      "critical" && (
                                      <span className="px-2 py-1 bg-red-600 text-white text-xs rounded font-medium animate-pulse">
                                        CRITICAL
                                      </span>
                                    )}
                                    <button
                                      onClick={() => reanalyzeMention(item.id)}
                                      className="text-gray-400 hover:text-gray-600"
                                      title="Re-analyze"
                                    >
                                      <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                        />
                                      </svg>
                                    </button>
                                  </>
                                )}
                              </>
                            )}
                          </div>
                        </div>

                        <div className="text-gray-800 mb-3">{item.content}</div>

                        {item.claudeAnalysis &&
                          item.sentiment !== "unanalyzed" && (
                            <div className="space-y-2">
                              <button
                                onClick={() => toggleSummary(item.id)}
                                className="w-full text-left p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <svg
                                      className="w-5 h-5 text-blue-600"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                      />
                                    </svg>
                                    <span className="font-medium text-blue-800">
                                      {claudeConfig.enabled &&
                                      !item.claudeAnalysis.is_fallback
                                        ? "Claude AI Analysis"
                                        : "Sentiment Analysis"}
                                    </span>
                                    {item.claudeAnalysis.confidence && (
                                      <span className="text-xs text-blue-600">
                                        (
                                        {Math.round(
                                          item.claudeAnalysis.confidence * 100
                                        )}
                                        % confident)
                                      </span>
                                    )}
                                  </div>
                                  <svg
                                    className={`w-5 h-5 text-blue-600 transform transition-transform ${
                                      expandedSummaries.has(item.id)
                                        ? "rotate-180"
                                        : ""
                                    }`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M19 9l-7 7-7-7"
                                    />
                                  </svg>
                                </div>
                              </button>

                              {expandedSummaries.has(item.id) && (
                                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                  <div>
                                    <h4 className="font-medium text-gray-700 text-sm mb-1">
                                      Summary
                                    </h4>
                                    <p className="text-gray-600 text-sm">
                                      {item.claudeAnalysis.summary}
                                    </p>
                                  </div>

                                  <div>
                                    <h4 className="font-medium text-gray-700 text-sm mb-1">
                                      Analysis Rationale
                                    </h4>
                                    <p className="text-gray-600 text-sm">
                                      {item.claudeAnalysis.rationale}
                                    </p>
                                  </div>

                                  {item.claudeAnalysis.key_topics &&
                                    Array.isArray(
                                      item.claudeAnalysis.key_topics
                                    ) &&
                                    item.claudeAnalysis.key_topics.length >
                                      0 && (
                                      <div>
                                        <h4 className="font-medium text-gray-700 text-sm mb-1">
                                          Key Topics
                                        </h4>
                                        <div className="flex flex-wrap gap-1">
                                          {item.claudeAnalysis.key_topics.map(
                                            (topic, idx) => (
                                              <span
                                                key={idx}
                                                className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded"
                                              >
                                                {topic}
                                              </span>
                                            )
                                          )}
                                        </div>
                                      </div>
                                    )}

                                  {item.claudeAnalysis.aspects_mentioned &&
                                    Array.isArray(
                                      item.claudeAnalysis.aspects_mentioned
                                    ) &&
                                    item.claudeAnalysis.aspects_mentioned
                                      .length > 0 && (
                                      <div>
                                        <h4 className="font-medium text-gray-700 text-sm mb-1">
                                          Aspects Mentioned
                                        </h4>
                                        <div className="flex flex-wrap gap-1">
                                          {item.claudeAnalysis.aspects_mentioned.map(
                                            (aspect, idx) => (
                                              <span
                                                key={idx}
                                                className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded"
                                              >
                                                {aspect}
                                              </span>
                                            )
                                          )}
                                        </div>
                                      </div>
                                    )}

                                  {item.claudeAnalysis.actionable_insights &&
                                    Array.isArray(
                                      item.claudeAnalysis.actionable_insights
                                    ) &&
                                    item.claudeAnalysis.actionable_insights
                                      .length > 0 && (
                                      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3">
                                        <h4 className="font-medium text-yellow-800 text-sm mb-1">
                                          <span className="mr-1">💡</span>{" "}
                                          Actionable Insights
                                        </h4>
                                        <ul className="text-sm text-yellow-700 space-y-1">
                                          {item.claudeAnalysis.actionable_insights.map(
                                            (insight, idx) => (
                                              <li key={idx}>• {insight}</li>
                                            )
                                          )}
                                        </ul>
                                      </div>
                                    )}

                                  {item.claudeAnalysis.recommended_action && (
                                    <div className="bg-green-50 border-l-4 border-green-400 p-3">
                                      <h4 className="font-medium text-green-800 text-sm mb-1">
                                        <span className="mr-1">✅</span>{" "}
                                        Recommended Action
                                      </h4>
                                      <p className="text-sm text-green-700">
                                        {item.claudeAnalysis.recommended_action}
                                      </p>
                                    </div>
                                  )}

                                  <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t">
                                    <span>
                                      Primary emotion:{" "}
                                      {item.claudeAnalysis.emotions_detected
                                        ?.primary || "neutral"}
                                    </span>
                                    <span>
                                      Urgency:{" "}
                                      {item.claudeAnalysis.urgency_level}
                                    </span>
                                    {item.claudeAnalysis.competitor_mentions &&
                                      Array.isArray(
                                        item.claudeAnalysis.competitor_mentions
                                      ) &&
                                      item.claudeAnalysis.competitor_mentions
                                        .length > 0 && (
                                        <span>
                                          Competitors:{" "}
                                          {item.claudeAnalysis.competitor_mentions.join(
                                            ", "
                                          )}
                                        </span>
                                      )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                        {item.claudeAnalysis?.is_fallback && (
                          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                            ⚠️ Analyzed using keyword-based fallback. Enable
                            Claude for better results.
                          </div>
                        )}
                        {item.url && item.url !== "#" && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-500 hover:text-blue-700 text-sm mt-2"
                          >
                            View original
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                              />
                            </svg>
                          </a>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Brand Statistics Tab */}
        {activeTab === "metrics" && (
          <div className="space-y-6">
            {/* Alert Banner */}
            {alerts.filter((a) => !a.acknowledged && a.type !== "fetch_success")
              .length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <svg
                        className="w-6 h-6 text-red-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                      <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse"></span>
                    </div>
                    <div>
                      <p className="font-medium text-red-800">
                        {
                          alerts.filter(
                            (a) => !a.acknowledged && a.type !== "fetch_success"
                          ).length
                        }{" "}
                        Active Alert
                        {alerts.filter(
                          (a) => !a.acknowledged && a.type !== "fetch_success"
                        ).length > 1
                          ? "s"
                          : ""}
                      </p>
                      <p className="text-sm text-red-700">
                        Latest:{" "}
                        {
                          alerts.filter(
                            (a) => !a.acknowledged && a.type !== "fetch_success"
                          )[0]?.title
                        }
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab("alerts")}
                    className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                  >
                    View Alerts
                  </button>
                </div>
              </div>
            )}

            {/* Export Section */}
            <div className="bg-white p-4 rounded-xl shadow-lg">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <h3 className="font-medium text-gray-700">Export Data</h3>
                  <select
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="csv">CSV (Excel)</option>
                    <option value="json">JSON (API)</option>
                  </select>
                </div>
                <button
                  onClick={exportData}
                  disabled={monitoringFeed.length === 0}
                  className={`px-5 py-2.5 rounded-lg transition-colors ${
                    monitoringFeed.length === 0
                      ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  Export {exportFormat.toUpperCase()}
                </button>
              </div>
            </div>

            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-sm font-medium text-gray-600 mb-2">
                  Sentiment Score
                </h3>
                {metrics.analyzedCount > 0 ? (
                  <>
                    <div className="flex items-baseline">
                      <span
                        className={`text-3xl font-bold ${
                          metrics.avgSentimentScore > 0
                            ? "text-green-600"
                            : metrics.avgSentimentScore < 0
                            ? "text-red-600"
                            : "text-gray-600"
                        }`}
                      >
                        {metrics.avgSentimentScore > 0 ? "+" : ""}
                        {metrics.avgSentimentScore}
                      </span>
                      <span className="text-sm text-gray-500 ml-2">/ 100</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Trend:{" "}
                      <span
                        className={`font-medium ${
                          metrics.sentimentTrend === "improving"
                            ? "text-green-600"
                            : metrics.sentimentTrend === "declining"
                            ? "text-red-600"
                            : "text-gray-600"
                        }`}
                      >
                        {metrics.sentimentTrend}
                      </span>
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex items-baseline">
                      <span className="text-3xl font-bold text-gray-400">
                        --
                      </span>
                      <span className="text-sm text-gray-500 ml-2">/ 100</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      No analysis yet
                    </p>
                  </>
                )}
              </div>

              <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-sm font-medium text-gray-600 mb-2">
                  Total Mentions
                </h3>
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-blue-600">
                    {metrics.totalMentions}
                  </span>
                  <span className="text-sm text-gray-500 ml-2">total</span>
                </div>
                <div className="flex gap-3 mt-2 text-xs">
                  <span className="text-indigo-600">
                    ✓ {metrics.analyzedCount} analyzed
                  </span>
                  <span className="text-gray-500">
                    ○ {metrics.unanalyzedCount} pending
                  </span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-sm font-medium text-gray-600 mb-2">
                  Sentiment Breakdown
                </h3>
                <div className="flex items-baseline">
                  <span className="text-2xl font-bold text-gray-800">
                    {metrics.analyzedCount}
                  </span>
                  <span className="text-sm text-gray-500 ml-2">analyzed</span>
                </div>
                <div className="flex gap-2 mt-2 text-xs">
                  <span className="text-green-600">
                    ↑ {metrics.positiveMentions}
                  </span>
                  <span className="text-red-600">
                    ↓ {metrics.negativeMentions}
                  </span>
                  <span className="text-gray-600">
                    → {metrics.neutralMentions}
                  </span>
                  <span className="text-purple-600">
                    ↕ {metrics.mixedMentions}
                  </span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-sm font-medium text-gray-600 mb-2">
                  Total Reach
                </h3>
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-purple-600">
                    {metrics.totalReach >= 1000000
                      ? `${(metrics.totalReach / 1000000).toFixed(1)}M`
                      : metrics.totalReach >= 1000
                      ? `${(metrics.totalReach / 1000).toFixed(1)}K`
                      : metrics.totalReach}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2">People reached</p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-sm font-medium text-gray-600 mb-2">
                  AI Confidence
                </h3>
                {metrics.analyzedCount > 0 ? (
                  <>
                    <div className="flex items-baseline">
                      <span className="text-3xl font-bold text-indigo-600">
                        {Math.round(metrics.avgConfidence * 100)}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {claudeConfig.enabled
                        ? "Claude AI analysis"
                        : "Keyword analysis"}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex items-baseline">
                      <span className="text-3xl font-bold text-gray-400">
                        --%
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      No analysis yet
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Sentiment Trend
                </h3>
                {metrics.analyzedCount > 0 &&
                historicalData &&
                historicalData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={historicalData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="positive"
                        stackId="1"
                        stroke="#10B981"
                        fill="#10B981"
                        fillOpacity={0.6}
                      />
                      <Area
                        type="monotone"
                        dataKey="neutral"
                        stackId="1"
                        stroke="#6B7280"
                        fill="#6B7280"
                        fillOpacity={0.6}
                      />
                      <Area
                        type="monotone"
                        dataKey="negative"
                        stackId="1"
                        stroke="#EF4444"
                        fill="#EF4444"
                        fillOpacity={0.6}
                      />
                      <Area
                        type="monotone"
                        dataKey="mixed"
                        stackId="1"
                        stroke="#8B5CF6"
                        fill="#8B5CF6"
                        fillOpacity={0.6}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-gray-500">
                    <div className="text-center">
                      <svg
                        className="w-16 h-16 mx-auto mb-4 text-gray-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                      </svg>
                      <p className="text-sm">No analyzed mentions yet</p>
                      <p className="text-xs mt-1">
                        Analyze mentions to see trends
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Sentiment Distribution
                </h3>
                {pieData && pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value, percent }) =>
                          `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-gray-500">
                    <div className="text-center">
                      <svg
                        className="w-16 h-16 mx-auto mb-4 text-gray-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
                        />
                      </svg>
                      <p className="text-sm">No sentiment data available</p>
                      <p className="text-xs mt-1">
                        Analyze mentions to see distribution
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Trending Topics */}
            {metrics.trendingTopics.length > 0 && (
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Trending Topics (AI Detected)
                </h3>
                <div className="flex flex-wrap gap-3">
                  {metrics.trendingTopics.map((topic, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-full"
                    >
                      <span className="font-medium">{topic.topic}</span>
                      <span className="ml-2 text-sm opacity-75">
                        ({topic.count})
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Source Performance */}
            {sourceData && sourceData.length > 0 ? (
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Sentiment by Source
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={sourceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="source"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="positive" fill="#10B981" />
                    <Bar dataKey="negative" fill="#EF4444" />
                    <Bar dataKey="neutral" fill="#6B7280" />
                    <Bar dataKey="mixed" fill="#8B5CF6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              metrics.analyzedCount === 0 && (
                <div className="bg-white p-6 rounded-xl shadow-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Sentiment by Source
                  </h3>
                  <div className="flex items-center justify-center h-[300px] text-gray-500">
                    <div className="text-center">
                      <svg
                        className="w-16 h-16 mx-auto mb-4 text-gray-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                      </svg>
                      <p className="text-sm">No source data available</p>
                      <p className="text-xs mt-1">
                        Analyze mentions to see source breakdown
                      </p>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        )}

        {/* Agent Config Tab - NEW AI AGENT INTERFACE */}
        {activeTab === "agent" && (
          <div className="space-y-6">
            {/* Agent Mission Control */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">
                    Agent Mission Control
                  </h2>
                  <p className="text-blue-100">
                    Configure your AI agent to monitor the web 24/7 for brand
                    mentions, competitor moves, and industry changes.
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-blue-100">Agent Status</p>
                  <p className="text-2xl font-bold">
                    {isAgentActive ? "ACTIVE" : "STANDBY"}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <QuickActionCard
                icon={<Zap className="w-8 h-8" />}
                title="Quick Scan"
                description="Run an immediate scan across all sources"
                buttonText="Scan Now"
                onClick={fetchMentions}
                color="blue"
              />
              <QuickActionCard
                icon={<Target className="w-8 h-8" />}
                title="Add Website Target"
                description="Monitor any website for changes"
                buttonText="Add Target"
                onClick={() => setShowWebsiteModal(true)}
                color="purple"
              />
              <QuickActionCard
                icon={<Shield className="w-8 h-8" />}
                title="Crisis Mode"
                description="Activate high-frequency monitoring"
                buttonText="Activate"
                onClick={() => activateCrisisMode()}
                color="red"
              />
            </div>

            {/* Monitoring Targets */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  Monitoring Targets
                </h3>
                <button
                  onClick={() => setShowAddTargetModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Target
                </button>
              </div>

              {/* Keywords Section */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Hash className="w-4 h-4" />
                  Keywords & Phrases
                </h4>
                <div className="flex flex-wrap gap-2">
                  {(dataSourceConfig.monitoringKeywords || []).map(
                    (keyword, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                      >
                        {keyword}
                        <button
                          onClick={() => {
                            const newKeywords =
                              dataSourceConfig.monitoringKeywords.filter(
                                (_, i) => i !== idx
                              );
                            setDataSourceConfig((prev) => ({
                              ...prev,
                              monitoringKeywords: newKeywords,
                            }));
                          }}
                          className="ml-1 text-blue-500 hover:text-blue-700"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )
                  )}
                  <button
                    onClick={() => setShowKeywordModal(true)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 border-2 border-dashed border-gray-300 text-gray-500 rounded-full text-sm hover:border-gray-400 hover:text-gray-600"
                  >
                    <Plus className="w-3 h-3" />
                    Add Keyword
                  </button>
                </div>
              </div>

              {/* Website Monitors */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Website Monitors
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dataSourceConfig.websiteConfig?.monitors?.length > 0 ? (
                    dataSourceConfig.websiteConfig.monitors.map((monitor) => (
                      <div
                        key={monitor.id}
                        className={`border rounded-lg p-4 ${
                          monitor.enabled
                            ? "border-green-200 bg-green-50"
                            : "border-gray-200 bg-gray-50"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                monitor.enabled
                                  ? "bg-green-500 animate-pulse"
                                  : "bg-gray-400"
                              }`}
                            />
                            <h4 className="font-medium text-gray-800">
                              {monitor.name}
                            </h4>
                          </div>
                          <div className="flex items-center gap-1">
                            <button className="p-1 text-gray-400 hover:text-gray-600">
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button className="p-1 text-red-400 hover:text-red-600">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">
                          {monitor.url}
                        </p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">
                            Last checked:{" "}
                            {monitor.lastChecked
                              ? getTimeAgo(new Date(monitor.lastChecked))
                              : "Never"}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <button
                      onClick={() => setShowWebsiteModal(true)}
                      className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 flex flex-col items-center justify-center gap-2 text-gray-500 hover:text-gray-600 col-span-2"
                    >
                      <Globe className="w-8 h-8" />
                      <span className="text-sm font-medium">
                        Add Website Monitor
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {/* RSS Feeds */}
              <div>
                <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Rss className="w-4 h-4" />
                  RSS Feed Categories
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    "Technology",
                    "Business",
                    "PR",
                    "Marketing",
                    "News",
                    "Healthcare",
                    "Retail",
                    "Education",
                  ].map((category) => (
                    <label
                      key={category}
                      className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-all ${
                        dataSourceConfig.aggregatorConfig?.sourceTypes?.includes(
                          category
                        )
                          ? "bg-green-50 border-2 border-green-500"
                          : "bg-gray-50 border-2 border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={
                          dataSourceConfig.aggregatorConfig?.sourceTypes?.includes(
                            category
                          ) || false
                        }
                        onChange={(e) => {
                          const currentTypes =
                            dataSourceConfig.aggregatorConfig?.sourceTypes ||
                            [];
                          const newTypes = e.target.checked
                            ? [...currentTypes, category]
                            : currentTypes.filter((t) => t !== category);

                          setDataSourceConfig((prev) => ({
                            ...prev,
                            aggregatorConfig: {
                              ...prev.aggregatorConfig,
                              sourceTypes: newTypes,
                            },
                          }));
                        }}
                        className="w-4 h-4 text-green-600 rounded"
                      />
                      <span className="text-sm font-medium">{category}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Agent Activity Log */}
            <AgentActivityLog activities={agentActivities} />
          </div>
        )}

        {/* Free Aggregators Configuration */}
        {dataSourceConfig.sourceType === "aggregator" && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              RSS Feed Configuration
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Feed Categories
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    "Technology",
                    "Business",
                    "PR",
                    "Marketing",
                    "News",
                    "Healthcare",
                    "Retail",
                    "Education",
                  ].map((type) => (
                    <label
                      key={type}
                      className="flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={
                          dataSourceConfig.aggregatorConfig?.sourceTypes?.includes(
                            type
                          ) || false
                        }
                        onChange={(e) => {
                          const currentTypes =
                            dataSourceConfig.aggregatorConfig?.sourceTypes ||
                            [];
                          const newTypes = e.target.checked
                            ? [...currentTypes, type]
                            : currentTypes.filter((t) => t !== type);

                          setDataSourceConfig((prev) => ({
                            ...prev,
                            aggregatorConfig: {
                              ...prev.aggregatorConfig,
                              sourceTypes: newTypes,
                            },
                          }));
                        }}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm text-gray-700">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-medium text-blue-800 mb-2">
                  Available RSS Feeds
                </h4>
                <p className="text-xs text-blue-700">
                  We aggregate content from 25+ sources including TechCrunch,
                  The Verge, Reuters, PR Newswire, and more. Select categories
                  above to filter sources.
                </p>
                {dataSourceConfig.aggregatorConfig?.sourceTypes?.length > 0 && (
                  <p className="text-xs text-green-700 mt-2">
                    <strong>✓ Active:</strong> Monitoring{" "}
                    {(() => {
                      const counts = {
                        Technology: 8,
                        Business: 5,
                        PR: 4,
                        Marketing: 3,
                        News: 3,
                        Healthcare: 1,
                        Retail: 1,
                        Education: 1,
                      };
                      const total =
                        dataSourceConfig.aggregatorConfig.sourceTypes.reduce(
                          (sum, type) => sum + (counts[type] || 0),
                          0
                        );
                      return `${total} RSS feeds across ${dataSourceConfig.aggregatorConfig.sourceTypes.length} categories`;
                    })()}
                    .
                  </p>
                )}
                <p className="text-xs text-blue-700 mt-2">
                  <strong>Note:</strong> Some feeds may be temporarily
                  unavailable due to rate limits or connectivity issues.
                </p>
                {(!dataSourceConfig.aggregatorConfig?.sourceTypes ||
                  dataSourceConfig.aggregatorConfig.sourceTypes.length ===
                    0) && (
                  <p className="text-xs text-yellow-700 mt-2 bg-yellow-50 p-2 rounded">
                    <strong>⚠️ No categories selected!</strong> Please select at
                    least one category above to fetch RSS feeds.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Update Interval
                </label>
                <select
                  value={
                    dataSourceConfig.aggregatorConfig?.updateInterval || 300000
                  }
                  onChange={(e) =>
                    setDataSourceConfig((prev) => ({
                      ...prev,
                      aggregatorConfig: {
                        ...prev.aggregatorConfig,
                        updateInterval: parseInt(e.target.value),
                      },
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="60000">Every minute</option>
                  <option value="300000">Every 5 minutes</option>
                  <option value="600000">Every 10 minutes</option>
                  <option value="1800000">Every 30 minutes</option>
                  <option value="3600000">Every hour</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Demo Mode Configuration */}
        {dataSourceConfig.sourceType === "demo" && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              Demo Mode Settings
            </h3>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Demo mode is active!</strong> Sample mentions will be
                generated based on your keywords. This is perfect for testing
                the sentiment analysis features without connecting to real data
                sources.
              </p>
              <p className="text-sm text-blue-700 mt-2">
                The demo will generate realistic mentions with various
                sentiments to showcase the AI analysis capabilities.
              </p>
            </div>
          </div>
        )}

        {/* API Configuration */}
        {dataSourceConfig.sourceType === "api" && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              API Configuration
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API Endpoint
                </label>
                <input
                  type="text"
                  value={dataSourceConfig.apiConfig?.endpoint || ""}
                  onChange={(e) =>
                    setDataSourceConfig((prev) => ({
                      ...prev,
                      apiConfig: {
                        ...prev.apiConfig,
                        endpoint: e.target.value,
                      },
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="https://api.yourbrandmonitor.com/mentions"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API Key
                </label>
                <input
                  type="password"
                  value={dataSourceConfig.apiConfig?.apiKey || ""}
                  onChange={(e) =>
                    setDataSourceConfig((prev) => ({
                      ...prev,
                      apiConfig: {
                        ...prev.apiConfig,
                        apiKey: e.target.value,
                      },
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Your API key"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Polling Interval
                </label>
                <select
                  value={dataSourceConfig.apiConfig?.pollingInterval || 300000}
                  onChange={(e) =>
                    setDataSourceConfig((prev) => ({
                      ...prev,
                      apiConfig: {
                        ...prev.apiConfig,
                        pollingInterval: parseInt(e.target.value),
                      },
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="60000">Every minute</option>
                  <option value="300000">Every 5 minutes</option>
                  <option value="600000">Every 10 minutes</option>
                  <option value="1800000">Every 30 minutes</option>
                </select>
              </div>

              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> This requires a third-party API like
                  Meltwater, Brandwatch, or Mention.
                </p>
              </div>
            </div>
          </div>
        )}
        <>
          {/* Manual Import Section */}
          {dataSourceConfig.sourceType === "demo" && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                Import Real Mentions (Manual)
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Paste real tweets, posts, or comments below to analyze them.
                Each mention should be on a new line.
              </p>
              <textarea
                id="manual-import"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none font-mono text-sm"
                rows="6"
                placeholder="Example:
Just tried the new AI features in @product - absolutely mind-blowing! The automation saves us hours each week.
Having issues with the AI API integration. Documentation could be clearer. Anyone else struggling?
The latest AI update broke our workflow. Support has been unresponsive for 2 days now."
              />
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => {
                    const textarea = document.getElementById("manual-import");
                    const lines = textarea.value
                      .trim()
                      .split("\n")
                      .filter((line) => line.trim().length > 20);

                    if (lines.length === 0) {
                      setFetchError(
                        "Please paste at least one mention (minimum 20 characters)"
                      );
                      return;
                    }

                    const newMentions = lines.map((line, index) => ({
                      id: `manual-${Date.now()}-${index}`,
                      content: line.trim(),
                      source: "Manual Import",
                      sourceType: "User Input",
                      author: "User",
                      publish_date: new Date(),
                      url: "#",
                      reach: 1000,
                      claudeAnalysis: null,
                      sentiment: "unanalyzed",
                      confidence: 0,
                      analyzedAt: null,
                    }));

                    setMonitoringFeed((prev) =>
                      [...newMentions, ...prev].slice(0, 500)
                    );
                    setLastUpdate(new Date());
                    textarea.value = "";

                    setAlerts((prev) =>
                      [
                        {
                          id: Date.now(),
                          type: "import_success",
                          severity: "low",
                          title: "Manual Import Successful",
                          message: `Imported ${newMentions.length} mentions. Click "Analyze All" to run sentiment analysis.`,
                          timestamp: new Date(),
                          acknowledged: false,
                        },
                        ...prev,
                      ].slice(0, 100)
                    );

                    if (claudeConfig.processingSettings.autoAnalyze) {
                      setTimeout(() => {
                        analyzeAllMentions();
                      }, 500);
                    }
                  }}
                  className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  Import & Analyze
                </button>
                <button
                  onClick={() => {
                    document.getElementById(
                      "manual-import"
                    ).value = `The new AI assistant is incredible! It's like having a genius teammate who never sleeps. Productivity is through the roof!
Frustrated with the AI pricing changes. We're a small startup and this is becoming unsustainable. Looking at alternatives.
Just integrated the AI into our workflow. The learning curve is steep but the potential is massive. Documentation needs work though.
AI is down again! This is the third outage this month. Our entire team is blocked. This is unacceptable for a enterprise product.
Love how the AI handles complex queries. It's surprisingly accurate and the responses are always relevant. Worth every penny.`;
                  }}
                  className="px-5 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
                >
                  Load Example
                </button>
              </div>
            </div>
          )}

          {/* Filtering Configuration */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              3. Filtering Rules (Optional)
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Include Keywords
                </label>
                <p className="text-xs text-gray-600 mb-2">
                  Only keep mentions containing these keywords
                </p>
                <input
                  type="text"
                  placeholder="Enter keywords separated by commas..."
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && e.target.value.trim()) {
                      const keywords = e.target.value
                        .split(",")
                        .map((k) => k.trim())
                        .filter((k) => k);
                      setDataSourceConfig((prev) => ({
                        ...prev,
                        filterConfig: {
                          ...prev.filterConfig,
                          includeKeywords: [
                            ...prev.filterConfig.includeKeywords,
                            ...keywords,
                          ],
                        },
                      }));
                      e.target.value = "";
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                {dataSourceConfig.filterConfig.includeKeywords.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {dataSourceConfig.filterConfig.includeKeywords.map(
                      (keyword, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-sm"
                        >
                          {keyword}
                          <button
                            onClick={() =>
                              setDataSourceConfig((prev) => ({
                                ...prev,
                                filterConfig: {
                                  ...prev.filterConfig,
                                  includeKeywords:
                                    prev.filterConfig.includeKeywords.filter(
                                      (_, i) => i !== idx
                                    ),
                                },
                              }))
                            }
                            className="ml-1 text-green-500 hover:text-green-700"
                          >
                            ×
                          </button>
                        </span>
                      )
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Exclude Keywords
                </label>
                <p className="text-xs text-gray-600 mb-2">
                  Filter out mentions containing these keywords
                </p>
                <input
                  type="text"
                  placeholder="Enter keywords separated by commas..."
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && e.target.value.trim()) {
                      const keywords = e.target.value
                        .split(",")
                        .map((k) => k.trim())
                        .filter((k) => k);
                      setDataSourceConfig((prev) => ({
                        ...prev,
                        filterConfig: {
                          ...prev.filterConfig,
                          excludeKeywords: [
                            ...prev.filterConfig.excludeKeywords,
                            ...keywords,
                          ],
                        },
                      }));
                      e.target.value = "";
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                {dataSourceConfig.filterConfig.excludeKeywords.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {dataSourceConfig.filterConfig.excludeKeywords.map(
                      (keyword, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded text-sm"
                        >
                          {keyword}
                          <button
                            onClick={() =>
                              setDataSourceConfig((prev) => ({
                                ...prev,
                                filterConfig: {
                                  ...prev.filterConfig,
                                  excludeKeywords:
                                    prev.filterConfig.excludeKeywords.filter(
                                      (_, i) => i !== idx
                                    ),
                                },
                              }))
                            }
                            className="ml-1 text-red-500 hover:text-red-700"
                          >
                            ×
                          </button>
                        </span>
                      )
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Reach
                </label>
                <input
                  type="number"
                  value={dataSourceConfig.filterConfig.minReach}
                  onChange={(e) =>
                    setDataSourceConfig((prev) => ({
                      ...prev,
                      filterConfig: {
                        ...prev.filterConfig,
                        minReach: parseInt(e.target.value) || 0,
                      },
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={saveAllConfigurations}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              Save Configuration
              {configSaved && (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </button>
          </div>
        </>
        {/* Alerts Tab */}
        {activeTab === "alerts" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">
                  Active Alerts
                </h2>
                <button
                  onClick={() => setAlerts([])}
                  className="px-4 py-1.5 text-red-600 hover:text-red-800 font-medium"
                >
                  Clear All
                </button>
              </div>

              {alerts.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p>No alerts triggered yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-4 rounded-lg border-l-4 ${
                        alert.acknowledged
                          ? "bg-gray-50 border-gray-300 opacity-60"
                          : alert.severity === "critical"
                          ? "bg-red-50 border-red-500"
                          : alert.severity === "high"
                          ? "bg-orange-50 border-orange-500"
                          : alert.severity === "medium"
                          ? "bg-yellow-50 border-yellow-500"
                          : "bg-blue-50 border-blue-500"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                alert.severity === "critical"
                                  ? "bg-red-100 text-red-800"
                                  : alert.severity === "high"
                                  ? "bg-orange-100 text-orange-800"
                                  : alert.severity === "medium"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {alert.severity}
                            </span>
                            <h3 className="font-medium text-gray-800">
                              {alert.title}
                            </h3>
                          </div>
                          <p className="text-sm mt-1 text-gray-600">
                            {alert.message}
                          </p>
                          {alert.data?.recommendation && (
                            <p className="text-sm mt-2 text-green-700 bg-green-50 p-2 rounded">
                              <strong>Action:</strong>{" "}
                              {alert.data.recommendation}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(alert.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          {!alert.acknowledged && (
                            <button
                              onClick={() => acknowledgeAlert(alert.id)}
                              className="px-4 py-1.5 text-blue-600 hover:text-blue-800 font-medium border border-blue-600 rounded hover:bg-blue-50"
                            >
                              Acknowledge
                            </button>
                          )}
                          <button
                            onClick={() => clearAlert(alert.id)}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Claude Configuration Tab */}
        {activeTab === "claude" && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xl">🤖</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-blue-900">
                    Claude AI Sentiment Analysis
                  </h3>
                  <p className="text-sm text-blue-800">
                    Configure Claude to analyze mentions and provide intelligent
                    sentiment scores
                  </p>
                </div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={claudeConfig.enabled}
                    onChange={(e) =>
                      setClaudeConfig((prev) => ({
                        ...prev,
                        enabled: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm font-medium text-blue-800">
                    Enable Claude
                  </span>
                </label>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                1. Tell Claude About Your Brand
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company/Brand Name
                  </label>
                  <input
                    type="text"
                    value={claudeConfig.brandContext.companyName}
                    onChange={(e) =>
                      setClaudeConfig((prev) => ({
                        ...prev,
                        brandContext: {
                          ...prev.brandContext,
                          companyName: e.target.value,
                        },
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="e.g., Acme Corp"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Industry
                  </label>
                  <input
                    type="text"
                    value={claudeConfig.brandContext.industry}
                    onChange={(e) =>
                      setClaudeConfig((prev) => ({
                        ...prev,
                        brandContext: {
                          ...prev.brandContext,
                          industry: e.target.value,
                        },
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="e.g., SaaS, E-commerce"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Products/Services
                  </label>
                  <textarea
                    value={claudeConfig.brandContext.productServices}
                    onChange={(e) =>
                      setClaudeConfig((prev) => ({
                        ...prev,
                        brandContext: {
                          ...prev.brandContext,
                          productServices: e.target.value,
                        },
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none"
                    rows="2"
                    placeholder="What do you offer?"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                2. What Matters to Your Brand
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Help Claude understand what you view as positive or negative for
                your brand.
              </p>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <span className="text-green-600">✅</span> Positive
                      Scenarios
                    </label>
                    {!claudeConfig.sentimentContext.positiveScenarios && (
                      <button
                        onClick={() =>
                          setClaudeConfig((prev) => ({
                            ...prev,
                            sentimentContext: {
                              ...prev.sentimentContext,
                              positiveScenarios: `- Customers successfully implementing our solution
- Mentions of time or cost savings achieved with our platform
- Positive comparisons with competitors
- Users recommending us to others
- Praise for our customer support or product features`,
                            },
                          }))
                        }
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        Load example
                      </button>
                    )}
                  </div>
                  <textarea
                    value={claudeConfig.sentimentContext.positiveScenarios}
                    onChange={(e) =>
                      setClaudeConfig((prev) => ({
                        ...prev,
                        sentimentContext: {
                          ...prev.sentimentContext,
                          positiveScenarios: e.target.value,
                        },
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none"
                    rows="3"
                    placeholder="What do you consider positive mentions?"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <span className="text-yellow-600">⚠️</span> Negative
                      Scenarios
                    </label>
                    {!claudeConfig.sentimentContext.negativeScenarios && (
                      <button
                        onClick={() =>
                          setClaudeConfig((prev) => ({
                            ...prev,
                            sentimentContext: {
                              ...prev.sentimentContext,
                              negativeScenarios: `- Customers considering or switching to competitors
- Complaints about pricing or value
- Reports of bugs, downtime, or technical issues
- Frustration with missing features or limitations
- Long wait times or poor support experiences`,
                            },
                          }))
                        }
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        Load example
                      </button>
                    )}
                  </div>
                  <textarea
                    value={claudeConfig.sentimentContext.negativeScenarios}
                    onChange={(e) =>
                      setClaudeConfig((prev) => ({
                        ...prev,
                        sentimentContext: {
                          ...prev.sentimentContext,
                          negativeScenarios: e.target.value,
                        },
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none"
                    rows="3"
                    placeholder="What concerns you?"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <span className="text-red-600">🚨</span> Critical Concerns
                    </label>
                    {!claudeConfig.sentimentContext.criticalConcerns && (
                      <button
                        onClick={() =>
                          setClaudeConfig((prev) => ({
                            ...prev,
                            sentimentContext: {
                              ...prev.sentimentContext,
                              criticalConcerns: `- Security vulnerabilities or data breaches
- Service outages affecting multiple customers
- Legal issues or compliance violations
- Major customer threatening to leave
- Negative viral social media posts`,
                            },
                          }))
                        }
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        Load example
                      </button>
                    )}
                  </div>
                  <textarea
                    value={claudeConfig.sentimentContext.criticalConcerns}
                    onChange={(e) =>
                      setClaudeConfig((prev) => ({
                        ...prev,
                        sentimentContext: {
                          ...prev.sentimentContext,
                          criticalConcerns: e.target.value,
                        },
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none"
                    rows="2"
                    placeholder="What requires immediate attention?"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                3. Processing Settings
              </h3>

              <div className="space-y-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={claudeConfig.processingSettings.autoAnalyze}
                    onChange={(e) =>
                      setClaudeConfig((prev) => ({
                        ...prev,
                        processingSettings: {
                          ...prev.processingSettings,
                          autoAnalyze: e.target.checked,
                        },
                      }))
                    }
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-700">
                    Automatically analyze all new mentions
                  </span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={claudeConfig.processingSettings.fallbackToKeywords}
                    onChange={(e) =>
                      setClaudeConfig((prev) => ({
                        ...prev,
                        processingSettings: {
                          ...prev.processingSettings,
                          fallbackToKeywords: e.target.checked,
                        },
                      }))
                    }
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-700">
                    Use keyword fallback if Claude fails
                  </span>
                </label>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={saveAllConfigurations}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                Save Configuration
                {configSaved && (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </button>
            </div>

            {configSaved && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                <svg
                  className="w-5 h-5 text-green-600 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <p className="text-sm font-medium text-green-800">
                    Configuration saved successfully!
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    Your settings have been updated and will be applied to new
                    analyses.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AISentimentMonitor;
