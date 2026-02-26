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
  TrendingDown,
  AlertCircle,
  AlertTriangle,
  Users,
  BarChart3,
  Calendar,
  Cpu,
} from "lucide-react";

// Keep the styles import for updated styling system
import { styles } from "./styles/monitoring.styles";

const AISentimentMonitor = () => {
  const { selectedProject, getMonitoringData, setMonitoringData } = useProject();
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
  const [searchHistory] = useState([]);
  const [scheduledExport] = useState(null);
  const [sentimentHeatmap, setSentimentHeatmap] = useState([]);
  const [storedMentions, setStoredMentions] = useState([]);
  const [rssFetchStatus, setRssFetchStatus] = useState({
    current: 0,
    total: 0,
    feeds: [],
  });

  // Agent Config state
  const [monitoredWebsites, setMonitoredWebsites] = useState([]);
  const [newWebsite, setNewWebsite] = useState("");
  const [monitoringSettings, setMonitoringSettings] = useState({
    checkFrequency: "15",
    visualDetection: true,
    contentAlerts: true,
  });
  const [savingConfig, setSavingConfig] = useState(false);
  const [searchKeywords, setSearchKeywords] = useState([]);
  const [newKeyword, setNewKeyword] = useState("");
  const [dataFromCache, setDataFromCache] = useState(false);
  const [showPositiveSuggestions, setShowPositiveSuggestions] = useState(false);
  const [showNegativeSuggestions, setShowNegativeSuggestions] = useState(false);
  const [showCriticalSuggestions, setShowCriticalSuggestions] = useState(false);

  // Sentiment concept suggestions
  const sentimentSuggestions = {
    positive: [
      "Innovation and R&D breakthroughs",
      "Customer satisfaction improvements",
      "Market expansion and growth",
      "Strategic partnerships and alliances",
      "Environmental sustainability initiatives",
      "Employee satisfaction and retention",
      "Award recognition and industry accolades",
      "Revenue growth and profitability",
      "Product quality improvements",
      "Community engagement and social impact",
      "Technology leadership",
      "Operational efficiency gains"
    ],
    negative: [
      "Data privacy or security concerns",
      "Customer complaints and dissatisfaction",
      "Product defects or quality issues",
      "Employee layoffs or high turnover",
      "Regulatory compliance failures",
      "Market share loss to competitors",
      "Financial losses or declining revenue",
      "Supply chain disruptions",
      "Negative environmental impact",
      "Leadership or management issues",
      "Service outages or disruptions",
      "Legal disputes or investigations"
    ],
    critical: [
      "Major data breach or cyberattack",
      "Executive misconduct or scandal",
      "Product recall or safety issue",
      "Class action lawsuit",
      "Regulatory shutdown or major fines",
      "Bankruptcy or financial crisis",
      "Fatal accident or safety incident",
      "Criminal investigation",
      "Major environmental disaster",
      "Mass customer data exposure",
      "Systemic discrimination allegations",
      "Fraud or embezzlement"
    ]
  };

  const addSentimentConcept = (type, concept) => {
    const field = type === 'positive' ? 'positiveScenarios' : 
                  type === 'negative' ? 'negativeScenarios' : 'criticalConcerns';
    
    const currentValue = claudeConfig.sentimentContext?.[field] || "";
    const newValue = currentValue ? `${currentValue}\n• ${concept}` : `• ${concept}`;
    
    setClaudeConfig({
      ...claudeConfig,
      sentimentContext: {
        ...claudeConfig.sentimentContext,
        [field]: newValue
      }
    });
    
    // Hide suggestions after adding
    if (type === 'positive') setShowPositiveSuggestions(false);
    if (type === 'negative') setShowNegativeSuggestions(false);
    if (type === 'critical') setShowCriticalSuggestions(false);
  };

  // Agent Config handlers
  const handleAddKeyword = () => {
    if (!newKeyword.trim()) return;
    
    const updatedKeywords = [...(dataSourceConfig.monitoringKeywords || []), newKeyword.trim()];
    setDataSourceConfig({
      ...dataSourceConfig,
      monitoringKeywords: updatedKeywords
    });
    setSearchKeywords(updatedKeywords); // Keep searchKeywords in sync
    setNewKeyword("");
  };

  const handleRemoveKeyword = (index) => {
    const updatedKeywords = (dataSourceConfig.monitoringKeywords || []).filter((_, i) => i !== index);
    setDataSourceConfig({
      ...dataSourceConfig,
      monitoringKeywords: updatedKeywords
    });
    setSearchKeywords(updatedKeywords); // Keep searchKeywords in sync
  };

  const handleAddWebsite = () => {
    if (!newWebsite) return;
    
    const website = {
      id: Date.now().toString(),
      url: newWebsite,
      lastChecked: null,
      status: "active"
    };
    
    setMonitoredWebsites([...monitoredWebsites, website]);
    setNewWebsite("");
  };

  const handleRemoveWebsite = (id) => {
    setMonitoredWebsites(monitoredWebsites.filter(w => w.id !== id));
  };

  const handleCheckWebsite = async (id) => {
    // This would trigger a website check - placeholder for now
    const websiteIndex = monitoredWebsites.findIndex(w => w.id === id);
    if (websiteIndex !== -1) {
      const updatedWebsites = [...monitoredWebsites];
      updatedWebsites[websiteIndex].lastChecked = new Date().toISOString();
      setMonitoredWebsites(updatedWebsites);
    }
  };

  const handleApplyTemplate = (template) => {
    // Apply event monitoring template
    setMonitoringSettings({
      ...monitoringSettings,
      checkFrequency: "5", // More frequent for events
    });
    
    // Add template-specific websites
    const eventWebsites = {
      "Milken Conference": [
        "https://milkeninstitute.org/events/global-conference",
        "https://twitter.com/milkeninstitute"
      ],
      "Davos": [
        "https://www.weforum.org/events/world-economic-forum-annual-meeting",
        "https://twitter.com/davos"
      ],
      "CES": [
        "https://ces.tech",
        "https://twitter.com/CES"
      ]
    };
    
    const urls = eventWebsites[template.name] || [];
    const newSites = urls.map(url => ({
      id: Date.now().toString() + Math.random(),
      url,
      lastChecked: null,
      status: "active"
    }));
    
    setMonitoredWebsites([...monitoredWebsites, ...newSites]);
  };

  const handleSaveConfig = async () => {
    setSavingConfig(true);
    try {
      // Log the full config being saved
      console.log("=== SAVING CONFIG ===");
      console.log("Claude config sentiment context:", claudeConfig.sentimentContext);
      console.log("Full claude config:", claudeConfig);
      
      // Ensure we save the complete dataSource configuration
      const configToSave = {
        dataSource: {
          ...dataSourceConfig,
          websites: monitoredWebsites,
          keywords: dataSourceConfig.monitoringKeywords || searchKeywords,
          monitoringKeywords: dataSourceConfig.monitoringKeywords || searchKeywords, // Save in both places for compatibility
          sourceType: dataSourceConfig.sourceType || "demo",
          aggregatorConfig: dataSourceConfig.aggregatorConfig || {}
        },
        claude: claudeConfig,
        alerts: alertConfig,
        settings: monitoringSettings
      };
      
      console.log("Full config being saved:", configToSave);
      
      await apiService.saveMonitoringConfig(configToSave);
      
      // Show success message
      setConfigSaved(true);
      setTimeout(() => setConfigSaved(false), 3000);
      
      console.log("Config saved successfully!");
    } catch (error) {
      console.error("Failed to save config:", error);
    } finally {
      setSavingConfig(false);
    }
  };

  const handleAcknowledgeAlert = (alertId) => {
    setAlerts(alerts.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  };

  const handleExportData = async () => {
    try {
      const exportData = {
        mentions: monitoringFeed,
        metrics: metrics,
        sentimentCounts: sentimentCounts,
        timeRange: metricsTimeRange,
        exportDate: new Date().toISOString()
      };

      if (exportFormat === "csv") {
        // Convert to CSV format
        const csv = Papa.unparse(monitoringFeed);
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `brand-analytics-${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else if (exportFormat === "json") {
        // Export as JSON
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `brand-analytics-${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Export failed:", error);
    }
  };


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
    monitoringKeywords: [],
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

  // Load cached data on component mount
  useEffect(() => {
    if (selectedProject?.id) {
      const cachedData = getMonitoringData(selectedProject.id);
      if (cachedData) {
        // Restore cached state
        if (cachedData.monitoringFeed) setMonitoringFeed(cachedData.monitoringFeed);
        if (cachedData.searchKeywords) setSearchKeywords(cachedData.searchKeywords);
        if (cachedData.monitoredWebsites) setMonitoredWebsites(cachedData.monitoredWebsites);
        if (cachedData.claudeConfig) setClaudeConfig(cachedData.claudeConfig);
        if (cachedData.alertConfig) setAlertConfig(cachedData.alertConfig);
        if (cachedData.alerts) setAlerts(cachedData.alerts);
        if (cachedData.dataSourceConfig) {
          setDataSourceConfig(cachedData.dataSourceConfig);
          // Sync keywords from dataSourceConfig
          if (cachedData.dataSourceConfig.monitoringKeywords) {
            setSearchKeywords(cachedData.dataSourceConfig.monitoringKeywords);
          }
        }
        
        // Mark data as from cache
        setDataFromCache(true);
        
        // Check if data is stale (older than 30 minutes)
        const lastUpdated = new Date(cachedData.lastUpdated);
        const now = new Date();
        const diffMinutes = (now - lastUpdated) / (1000 * 60);
        
        if (diffMinutes > 30) {
          // Data is stale, fetch fresh data
          fetchMentions();
        }
      } else {
        // No cached data, fetch fresh
        fetchMentions();
      }
    }
  }, [selectedProject?.id]);

  // Save to cache whenever important data changes
  useEffect(() => {
    if (selectedProject?.id && monitoringFeed.length > 0) {
      setMonitoringData(selectedProject.id, {
        monitoringFeed,
        searchKeywords,
        monitoredWebsites,
        claudeConfig,
        alertConfig,
        alerts,
        dataSourceConfig,
      });
    }
  }, [monitoringFeed, searchKeywords, monitoredWebsites, claudeConfig, alertConfig, alerts, dataSourceConfig, selectedProject?.id]);

  // Load saved configuration from API on mount
  useEffect(() => {
    const loadConfigFromAPI = async () => {
      try {
        const apiConfig = await apiService.getMonitoringConfig();
        if (apiConfig) {
          console.log("Loaded config from API:", apiConfig);
          if (apiConfig.dataSource) {
            console.log('Loading dataSource config:', apiConfig.dataSource);
            // Handle both possible keyword locations
            const loadedKeywords = apiConfig.dataSource.monitoringKeywords || apiConfig.dataSource.keywords || [];
            console.log('Loaded keywords:', loadedKeywords);
            
            setDataSourceConfig((prev) => ({
              ...prev,
              ...apiConfig.dataSource,
              monitoringKeywords: loadedKeywords,
            }));
            setSearchKeywords(loadedKeywords);
          }
          if (apiConfig.claude) {
            console.log("=== LOADING CLAUDE CONFIG ===");
            console.log("API config claude:", apiConfig.claude);
            console.log("Sentiment context from API:", apiConfig.claude.sentimentContext);
            console.log("Has positive scenarios:", !!apiConfig.claude.sentimentContext?.positiveScenarios);
            console.log("Has negative scenarios:", !!apiConfig.claude.sentimentContext?.negativeScenarios);
            
            setClaudeConfig(prev => {
              const newConfig = {
                ...prev,
                ...apiConfig.claude,
                sentimentContext: {
                  ...prev.sentimentContext,
                  ...apiConfig.claude.sentimentContext
                },
                brandContext: {
                  ...prev.brandContext,
                  ...apiConfig.claude.brandContext
                }
              };
              console.log("New claude config after merge:", newConfig);
              return newConfig;
            });
          }
          if (apiConfig.alerts) setAlertConfig(apiConfig.alerts);
        }
      } catch (error) {
        console.log("No saved config in API, checking localStorage");
      }
    };
    
    loadConfigFromAPI();
    
    // Fallback to localStorage
    const savedConfig = localStorage.getItem("aiMonitorConfig");
    const savedMentions = localStorage.getItem("aiMonitorMentions");

    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        if (config.dataSource) {
          // Handle both possible keyword locations
          const loadedKeywords = config.dataSource.monitoringKeywords || config.dataSource.keywords || [];
          
          setDataSourceConfig((prev) => ({
            ...prev,
            ...config.dataSource,
            monitoringKeywords: loadedKeywords,
          }));
          setSearchKeywords(loadedKeywords);
        }
        if (config.claude) {
          setClaudeConfig(prev => ({
            ...prev,
            ...config.claude,
            sentimentContext: {
              ...prev.sentimentContext,
              ...config.claude.sentimentContext
            },
            brandContext: {
              ...prev.brandContext,
              ...config.claude.brandContext
            }
          }));
        }
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
      const configToSave = {
        dataSource: dataSourceConfig,
        claude: claudeConfig,
        alerts: alertConfig,
      };
      localStorage.setItem(
        "aiMonitorConfig",
        JSON.stringify(configToSave)
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
      // Pass the full sentiment context and brand context
      console.log("=== ANALYZE WITH CLAUDE ===");
      console.log("Text to analyze:", text.substring(0, 100) + "...");
      console.log("Claude config state:", claudeConfig);
      console.log("Sentiment context being sent:", claudeConfig.sentimentContext);
      console.log("Has positive scenarios:", !!claudeConfig.sentimentContext?.positiveScenarios);
      console.log("Has negative scenarios:", !!claudeConfig.sentimentContext?.negativeScenarios);
      console.log("Brand context:", claudeConfig.brandContext);
      
      const requestData = {
        text: text,
        source: source || "manual",
        brandContext: claudeConfig.brandContext,
        sentimentContext: claudeConfig.sentimentContext,
        customInstructions: claudeConfig.customInstructions,
      };
      
      console.log("Full request data:", JSON.stringify(requestData, null, 2));
      
      // Double check sentiment context is not empty
      if (!requestData.sentimentContext || 
          (!requestData.sentimentContext.positiveScenarios && 
           !requestData.sentimentContext.negativeScenarios && 
           !requestData.sentimentContext.criticalConcerns)) {
        console.warn("⚠️ WARNING: Sentiment context is empty!");
        console.warn("Current claudeConfig:", claudeConfig);
      }
      
      const response = await apiService.analyzeSentiment(requestData);

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
    const keywords = dataSourceConfig.monitoringKeywords && dataSourceConfig.monitoringKeywords.length > 0 ? dataSourceConfig.monitoringKeywords : [];
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
          try {
            const response = await apiService.fetchRSSFeeds(dataSourceConfig.monitoringKeywords || []);
            if (response.success && response.mentions) {
              mentions = response.mentions;
            } else {
              mentions = [];
            }
          } catch (error) {
            console.error("RSS fetch error:", error);
            mentions = await fetchFromRSSFeeds(); // Fallback to local function
          }
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
    setDataFromCache(false);

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
  const { pieData, sourceData, metrics, sentimentCounts, sourceCounts } = useMemo(() => {
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

    // Create sentimentCounts object for the charts
    const sentimentCountsData = {
      positive: metricsData.positiveMentions || 0,
      negative: metricsData.negativeMentions || 0,
      neutral: metricsData.neutralMentions || 0,
      mixed: metricsData.mixedMentions || 0,
    };

    // Create sourceCounts array for the top sources display
    const sourceCountsData = monitoringFeed.reduce((acc, mention) => {
      const source = mention.source || "Unknown";
      const existing = acc.find(s => s.name === source);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ name: source, count: 1 });
      }
      return acc;
    }, []).sort((a, b) => b.count - a.count);

    return {
      pieData: pieChartData,
      sourceData: sourceChartData,
      metrics: metricsData,
      sentimentCounts: sentimentCountsData,
      sourceCounts: sourceCountsData,
    };
  }, [calculateMetrics, historicalData, monitoringFeed]);

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
    const jsonData = {
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

    const json = JSON.stringify(jsonData, null, 2);
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
      style={{
        padding: "1rem",
        borderRadius: "0.5rem",
        border: `1px solid ${status === "active" ? "#bbf7d0" : "#d1d5db"}`,
        background: status === "active" ? "#f0fdf4" : "#f9fafb",
        transition: "all 0.2s",
        cursor: "pointer",
        width: "100%"
      }}
      onMouseOver={(e) => {
        e.target.style.background = status === "active" ? "#dcfce7" : "#f3f4f6";
      }}
      onMouseOut={(e) => {
        e.target.style.background = status === "active" ? "#f0fdf4" : "#f9fafb";
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{
              padding: "0.5rem",
              borderRadius: "0.5rem",
              background: status === "active" ? "#bbf7d0" : "#d1d5db",
              color: status === "active" ? "#15803d" : "#4b5563"
            }}
          >
            {icon}
          </div>
          <div style={{ textAlign: "left" }}>
            <p style={{ fontSize: "1.5rem", fontWeight: "700", color: "#1f2937" }}>{count}</p>
            <p style={{ fontSize: "0.75rem", color: "#4b5563" }}>{title}</p>
          </div>
        </div>
        <div
          style={{
            width: "0.5rem",
            height: "0.5rem",
            borderRadius: "50%",
            background: status === "active" ? "#10b981" : "#9ca3af"
          }}
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
    const colorStyles = {
      blue: {
        background: "linear-gradient(to bottom right, #3b82f6, #2563eb)",
        hoverBackground: "linear-gradient(to bottom right, #2563eb, #1d4ed8)",
        buttonBackground: "linear-gradient(to right, #3b82f6, #2563eb)",
        buttonHoverBackground: "linear-gradient(to right, #2563eb, #1d4ed8)"
      },
      purple: {
        background: "linear-gradient(to bottom right, #8b5cf6, #7c3aed)",
        hoverBackground: "linear-gradient(to bottom right, #7c3aed, #6d28d9)",
        buttonBackground: "linear-gradient(to right, #8b5cf6, #7c3aed)",
        buttonHoverBackground: "linear-gradient(to right, #7c3aed, #6d28d9)"
      },
      red: {
        background: "linear-gradient(to bottom right, #ef4444, #dc2626)",
        hoverBackground: "linear-gradient(to bottom right, #dc2626, #b91c1c)",
        buttonBackground: "linear-gradient(to right, #ef4444, #dc2626)",
        buttonHoverBackground: "linear-gradient(to right, #dc2626, #b91c1c)"
      },
    };

    return (
      <div 
        style={{ 
          background: "white", 
          borderRadius: "0.75rem", 
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)", 
          padding: "1.5rem", 
          transition: "box-shadow 0.2s"
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.boxShadow = "0 20px 25px -5px rgba(0, 0, 0, 0.1)";
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(0, 0, 0, 0.1)";
        }}
      >
        <div
          style={{
            width: "4rem",
            height: "4rem",
            background: colorStyles[color].background,
            borderRadius: "0.75rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            marginBottom: "1rem"
          }}
        >
          {icon}
        </div>
        <h3 style={{ fontWeight: "700", color: "#1f2937", marginBottom: "0.5rem" }}>{title}</h3>
        <p style={{ fontSize: "0.875rem", color: "#4b5563", marginBottom: "1rem" }}>{description}</p>
        <button
          onClick={onClick}
          style={{
            width: "100%",
            padding: "0.5rem 0",
            background: colorStyles[color].buttonBackground,
            color: "white",
            borderRadius: "0.5rem",
            fontWeight: "500",
            transition: "all 0.2s",
            border: "none",
            cursor: "pointer"
          }}
          onMouseOver={(e) => {
            e.target.style.background = colorStyles[color].buttonHoverBackground;
          }}
          onMouseOut={(e) => {
            e.target.style.background = colorStyles[color].buttonBackground;
          }}
        >
          {buttonText}
        </button>
      </div>
    );
  };

  // Component: Agent Activity Log
  const AgentActivityLog = ({ activities }) => (
    <div style={{ background: "white", borderRadius: "0.75rem", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)", padding: "1.5rem" }}>
      <h3 style={{ fontSize: "1.25rem", fontWeight: "700", color: "#1f2937", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <Activity style={{ width: "1.25rem", height: "1.25rem", color: "#2563eb" }} />
        Agent Activity Log
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "16rem", overflowY: "auto" }}>
        {activities.length === 0 ? (
          <p style={{ textAlign: "center", color: "#6b7280", padding: "2rem 0" }}>No activity yet</p>
        ) : (
          activities.map((activity, idx) => (
            <div
              key={idx}
              style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "0.75rem", 
                padding: "0.75rem", 
                borderRadius: "0.5rem",
                transition: "background 0.2s"
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = "#f9fafb";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <div
                style={{
                  width: "0.5rem",
                  height: "0.5rem",
                  borderRadius: "50%",
                  background: activity.type === "scan"
                    ? "#3b82f6"
                    : activity.type === "alert"
                    ? "#ef4444"
                    : activity.type === "change"
                    ? "#eab308"
                    : "#6b7280"
                }}
              />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: "0.875rem", color: "#1f2937" }}>{activity.message}</p>
                <p style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                  {getTimeAgo(activity.timestamp)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  // Tab configuration
  const tabs = [
    { id: "monitor", label: "Live Feed", icon: Activity },
    { id: "agent", label: "Agent Config", icon: Bot, pulse: true },
    { id: "metrics", label: "Analytics", icon: BarChart3 },
    {
      id: "alerts",
      label: "Alerts", 
      icon: Bell,
      badge: alerts.filter((a) => !a.acknowledged).length,
    },
    { id: "claude", label: "AI Config", icon: Brain },
  ];

  const containerStyle = {
    minHeight: "100vh",
    background: "#f3f4f6",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  };

  return (
    <div style={containerStyle}>
      <div style={{ maxWidth: "80rem", margin: "0 auto", padding: "2rem 1.5rem" }}>
        {/* Quick Start Guide */}
        {showQuickStart &&
          monitoringFeed.length === 0 &&
          activeTab === "monitor" && (
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "0.75rem", padding: "1rem", marginBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                <svg
                  style={{ width: "1.25rem", height: "1.25rem", color: "#16a34a", marginTop: "0.125rem" }}
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
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: "0.875rem", fontWeight: "700", color: "#14532d" }}>
                    Quick Start Guide
                  </h4>
                  <p style={{ fontSize: "0.875rem", color: "#166534", marginTop: "0.25rem" }}>
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
                  style={{ color: "#16a34a", cursor: "pointer" }}
                  onMouseOver={(e) => e.target.style.color = "#166534"}
                  onMouseOut={(e) => e.target.style.color = "#16a34a"}
                >
                  <svg
                    style={{ width: "1.25rem", height: "1.25rem" }}
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

        {/* Header Section */}
        <div style={{ ...styles.card, marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ position: "relative" }}>
                <Bot style={{ width: "2rem", height: "2rem", color: "#2563eb" }} />
                {isAgentActive && (
                  <div style={{ position: "absolute", top: "-0.25rem", right: "-0.25rem", width: "0.75rem", height: "0.75rem", background: "#10b981", borderRadius: "50%", animation: "pulse 2s infinite" }} />
                )}
              </div>
              <div>
                <h1 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#1f2937" }}>
                  AI Sentiment Monitor
                </h1>
                <p style={{ fontSize: "0.875rem", color: "#4b5563" }}>
                  Real-time brand monitoring with AI-powered sentiment analysis
                  {selectedProject && ` • Project: ${selectedProject.name}`}
                </p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <button
                onClick={fetchMentions}
                disabled={loading}
                style={{
                  ...styles.button.primary,
                  padding: "0.5rem 1rem",
                  opacity: loading ? 0.6 : 1,
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                <RefreshCw
                  style={{ 
                    width: "1rem", 
                    height: "1rem",
                    marginRight: "0.5rem",
                    animation: loading ? "spin 1s linear infinite" : "none"
                  }}
                />
                {loading ? "Refreshing..." : "Refresh Feed"}
              </button>
              <button
                onClick={() => setIsAutoRefresh(!isAutoRefresh)}
                style={{
                  ...styles.button[isAutoRefresh ? "primary" : "secondary"],
                  padding: "0.5rem 1rem",
                  background: isAutoRefresh
                    ? "linear-gradient(135deg, #16a34a 0%, #22c55e 100%)"
                    : "#e5e7eb",
                }}
              >
                <RefreshCw
                  style={{ 
                    width: "1rem", 
                    height: "1rem",
                    animation: isAutoRefresh ? "spin 1s linear infinite" : "none"
                  }}
                />
              </button>
              <button
                onClick={activateAgent}
                style={{
                  ...styles.button[isAgentActive ? "danger" : "primary"],

                  background: isAgentActive
                    ? "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)"
                    : "linear-gradient(135deg, #16a34a 0%, #22c55e 100%)",
                  padding: "0.5rem 1.5rem",
                }}
              >
                <Power style={{ width: "1rem", height: "1rem", marginRight: "0.5rem" }} />
                {isAgentActive ? "Deactivate" : "Activate"} Agent
              </button>
            </div>
          </div>

          {/* Agent Stats Row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "1rem" }}>
            <AgentStatusCard
              icon={<Activity style={{ width: "1.25rem", height: "1.25rem" }} />}
              title="Active Sources"
              count={getActiveSourcesCount()}
              status={isAgentActive ? "active" : "inactive"}
              onClick={() => setActiveTab("agent")}
            />
            <AgentStatusCard
              icon={<Search style={{ width: "1.25rem", height: "1.25rem" }} />}
              title="Total Mentions"
              count={metrics.totalMentions}
              status="active"
              onClick={() => setActiveTab("monitor")}
            />
            <AgentStatusCard
              icon={<TrendingUp style={{ width: "1.25rem", height: "1.25rem" }} />}
              title="Avg Sentiment"
              count={metrics.avgSentimentScore}
              status={metrics.avgSentimentScore >= 0 ? "active" : "inactive"}
              onClick={() => setActiveTab("metrics")}
            />
            <AgentStatusCard
              icon={<AlertCircle style={{ width: "1.25rem", height: "1.25rem" }} />}
              title="Alerts"
              count={alerts.filter((a) => !a.acknowledged).length}
              status={
                alerts.filter((a) => !a.acknowledged).length > 0
                  ? "active"
                  : "inactive"
              }
              onClick={() => setActiveTab("alerts")}
            />
            <AgentStatusCard
              icon={<Brain style={{ width: "1.25rem", height: "1.25rem" }} />}
              title="AI Analysis"
              count={metrics.analyzedCount}
              status={claudeConfig.enabled ? "active" : "inactive"}
              onClick={() => setActiveTab("claude")}
            />
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", overflowX: "auto" }}>
          <button
            onClick={() => setActiveTab("monitor")}
            style={{
              ...styles.tab[activeTab === "monitor" ? "active" : "inactive"],
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <Activity style={{ width: "1rem", height: "1rem" }} />
            Live Feed
          </button>
          <button
            onClick={() => setActiveTab("sources")}
            style={{
              ...styles.tab[activeTab === "sources" ? "active" : "inactive"],
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <Rss style={{ width: "1rem", height: "1rem" }} />
            Data Sources
          </button>
          <button
            onClick={() => setActiveTab("agent")}
            style={{
              ...styles.tab[activeTab === "agent" ? "active" : "inactive"],
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              position: "relative",
            }}
          >
            <Bot style={{ width: "1rem", height: "1rem" }} />
            Agent Config
            <span style={{ position: "absolute", top: "-0.25rem", right: "-0.25rem", display: "flex", height: "0.75rem", width: "0.75rem" }}>
              <span style={{ animation: "ping 1s infinite", position: "absolute", display: "inline-flex", height: "100%", width: "100%", borderRadius: "50%", background: "#c084fc", opacity: 0.75 }}></span>
              <span style={{ position: "relative", display: "inline-flex", borderRadius: "50%", height: "0.75rem", width: "0.75rem", background: "#a855f7" }}></span>
            </span>
          </button>
          <button
            onClick={() => setActiveTab("metrics")}
            style={{
              ...styles.tab[activeTab === "metrics" ? "active" : "inactive"],
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <BarChart3 style={{ width: "1rem", height: "1rem" }} />
            Brand Statistics
          </button>
          <button
            onClick={() => setActiveTab("alerts")}
            style={{
              ...styles.tab[activeTab === "alerts" ? "active" : "inactive"],
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <Bell style={{ width: "1rem", height: "1rem" }} />
            Alerts
            {alerts.filter((a) => !a.acknowledged).length > 0 && (
              <span style={{ marginLeft: "0.25rem", padding: "0.25rem 0.5rem", background: "#dc2626", color: "white", fontSize: "0.75rem", borderRadius: "50px", minWidth: "20px", textAlign: "center" }}>
                {alerts.filter((a) => !a.acknowledged).length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("claude")}
            style={{
              ...styles.tab[activeTab === "claude" ? "active" : "inactive"],
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <Brain style={{ width: "1rem", height: "1rem" }} />
            AI Configuration
          </button>
        </div>

        {/* Live Monitoring Tab - Enhanced for Agent */}
        {activeTab === "monitor" && (
          <div style={{ background: "white", borderRadius: "0.75rem", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)", padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{ position: "relative" }}>
                  <Activity style={{ width: "1.5rem", height: "1.5rem", color: "#2563eb" }} />
                  {loading && (
                    <div style={{ position: "absolute", top: "-0.25rem", right: "-0.25rem", width: "0.75rem", height: "0.75rem", background: "#2563eb", borderRadius: "50%", animation: "ping 1s infinite" }} />
                  )}
                </div>
                <div>
                  <h2 style={{ fontSize: "1.25rem", fontWeight: "700", color: "#1f2937" }}>
                    Live Intelligence Feed
                  </h2>
                  <p style={{ fontSize: "0.875rem", color: "#4b5563", marginTop: "0.25rem" }}>
                    {dataFromCache && (
                      <span style={{ 
                        display: "inline-flex", 
                        alignItems: "center", 
                        gap: "0.25rem",
                        marginRight: "0.5rem",
                        padding: "0.125rem 0.5rem",
                        background: "#fef3c7",
                        color: "#92400e",
                        borderRadius: "0.25rem",
                        fontSize: "0.75rem"
                      }}>
                        <Bookmark style={{ width: "0.75rem", height: "0.75rem" }} />
                        Cached Data
                      </span>
                    )}
                    {isAgentActive ? (
                      <>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                          <span style={{ width: "0.5rem", height: "0.5rem", background: "#10b981", borderRadius: "50%", animation: "pulse 2s infinite" }} />
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
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <button
                  onClick={activateAgent}
                  style={{
                    padding: "0.625rem 1.25rem",
                    borderRadius: "0.5rem",
                    fontWeight: "500",
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    background: isAgentActive
                      ? "#4b5563"
                      : "linear-gradient(to right, #2563eb, #7c3aed)",
                    color: "white",
                    border: "none",
                    cursor: "pointer"
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = isAgentActive
                      ? "#374151"
                      : "linear-gradient(to right, #1d4ed8, #6d28d9)";
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = isAgentActive
                      ? "#4b5563"
                      : "linear-gradient(to right, #2563eb, #7c3aed)";
                  }}
                >
                  <Power style={{ width: "1rem", height: "1rem" }} />
                  {isAgentActive ? "Deactivate Agent" : "Activate Agent"}
                </button>

                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <input
                    type="checkbox"
                    checked={isAutoRefresh}
                    onChange={(e) => setIsAutoRefresh(e.target.checked)}
                    style={{ width: "1rem", height: "1rem", color: "#2563eb", borderRadius: "0.25rem" }}
                  />
                  <span style={{ fontSize: "0.875rem", color: "#374151" }}>Auto-refresh</span>
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
              <div style={{ marginBottom: "1rem", padding: "1rem", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "0.5rem" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                  <svg
                    style={{ width: "1.25rem", height: "1.25rem", color: "#dc2626", marginTop: "0.125rem" }}
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
                    <h4 style={{ fontSize: "0.875rem", fontWeight: "500", color: "#7f1d1d" }}>
                      Error fetching mentions
                    </h4>
                    <p style={{ fontSize: "0.875rem", color: "#991b1b", marginTop: "0.25rem" }}>{fetchError}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Analysis Progress Bar */}
            {analysisProgress.total > 0 && (
              <div style={{ marginBottom: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", color: "#4b5563", marginBottom: "0.25rem" }}>
                  <span>
                    Analyzing mentions with{" "}
                    {claudeConfig.enabled ? "Claude AI" : "keyword analysis"}...
                  </span>
                  <span>
                    {analysisProgress.current} / {analysisProgress.total}
                  </span>
                </div>
                <div style={{ width: "100%", background: "#e5e7eb", borderRadius: "50px", height: "0.5rem" }}>
                  <div
                    style={{ 
                      background: "#7c3aed", 
                      height: "0.5rem", 
                      borderRadius: "50px", 
                      transition: "all 0.3s",
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
              <div style={{ marginBottom: "1rem", padding: "1rem", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "0.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <h4 style={{ fontSize: "0.875rem", fontWeight: "500", color: "#1e40af" }}>
                    Fetching RSS Feeds...
                  </h4>
                  <span style={{ fontSize: "0.875rem", color: "#1d4ed8" }}>
                    {rssFetchStatus.current} / {rssFetchStatus.total}
                  </span>
                </div>
                <div style={{ width: "100%", background: "#bfdbfe", borderRadius: "50px", height: "0.5rem", marginBottom: "0.5rem" }}>
                  <div
                    style={{
                      background: "#2563eb",
                      height: "0.5rem",
                      borderRadius: "50px",
                      transition: "all 0.3s",
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
                  <div className="text-center py-12">
                    <div className="inline-flex items-center gap-3 mb-4">
                      <Search className="w-12 h-12 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-800 mb-2">
                      No mentions found
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {dataSourceConfig.sourceType === "demo"
                        ? "Click 'Fetch Mentions' to generate sample data"
                        : "Try adjusting your keywords or data source configuration"}
                    </p>
                    <button
                      onClick={fetchMentions}
                      style={{
                        ...styles.button.primary,
                        padding: "0.75rem 1.5rem",
                      }}
                    >
                      Fetch Mentions
                    </button>
                  </div>
                ) : (
                  monitoringFeed.map((mention) => (
                    <div
                      key={mention.id}
                      style={{
                        border: "1px solid #e5e7eb",
                        borderRadius: "0.5rem",
                        padding: "1rem",
                        transition: "box-shadow 0.2s",
                        marginBottom: "1rem",
                        background: "white",
                        cursor: "pointer"
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <div
                            style={{
                              width: "0.75rem",
                              height: "0.75rem",
                              borderRadius: "50%",
                              background:
                                mention.sentiment === "positive"
                                  ? "#10b981"
                                  : mention.sentiment === "negative"
                                  ? "#ef4444"
                                  : mention.sentiment === "mixed"
                                  ? "#8b5cf6"
                                  : mention.sentiment === "neutral"
                                  ? "#6b7280"
                                  : "#eab308"
                            }}
                          />
                          <span
                            style={{
                              fontSize: "0.875rem",
                              fontWeight: "500",
                              color: "#2563eb",
                            }}
                          >
                            {mention.source}
                          </span>
                          <span
                            style={{
                              fontSize: "0.75rem",
                              color: "#6b7280",
                            }}
                          >
                            {getTimeAgo(new Date(mention.publish_date))}
                          </span>
                          {mention.reach && (
                            <span
                              style={{
                                fontSize: "0.75rem",
                                color: "#6b7280",
                              }}
                            >
                              Reach: {formatReach(mention.reach)}
                            </span>
                          )}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                          }}
                        >
                          {mention.sentiment !== "unanalyzed" && (
                            <button
                              onClick={() => reanalyzeMention(mention.id)}
                              disabled={analyzingItems.has(mention.id)}
                              style={{
                                color: "#9ca3af",
                                padding: "0.25rem",
                                border: "none",
                                background: "transparent",
                                cursor: "pointer",
                                borderRadius: "0.25rem",
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.color = "#2563eb";
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.color = "#9ca3af";
                              }}
                              title="Re-analyze"
                            >
                              <RefreshCw
                                style={{
                                  width: "16px",
                                  height: "16px",
                                  animation: analyzingItems.has(mention.id)
                                    ? "spin 1s linear infinite"
                                    : "none",
                                }}
                              />
                            </button>
                          )}
                          {mention.url && (
                            <a
                              href={mention.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                color: "#9ca3af",
                                padding: "0.25rem",
                                textDecoration: "none",
                                borderRadius: "0.25rem",
                                display: "inline-block",
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.color = "#2563eb";
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.color = "#9ca3af";
                              }}
                              title="View original"
                            >
                              <ExternalLink
                                style={{
                                  width: "16px",
                                  height: "16px",
                                }}
                              />
                            </a>
                          )}
                        </div>
                      </div>

                      <div style={{ marginBottom: "0.75rem" }}>
                        <p
                          style={{
                            color: "#1f2937",
                            lineHeight: "1.625",
                            margin: "0",
                          }}
                        >
                          {mention.content}
                        </p>
                        {mention.author && (
                          <p
                            style={{
                              fontSize: "0.75rem",
                              color: "#6b7280",
                              marginTop: "0.5rem",
                              margin: "0.5rem 0 0 0",
                            }}
                          >
                            by {mention.author}
                          </p>
                        )}
                      </div>

                      {mention.sentiment === "unanalyzed" ? (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "0.75rem",
                            backgroundColor: "#fefce8",
                            border: "1px solid #fde047",
                            borderRadius: "0.5rem",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "0.875rem",
                              color: "#92400e",
                            }}
                          >
                            Awaiting analysis
                          </span>
                          <button
                            onClick={() => analyzeMention(mention.id)}
                            disabled={analyzingItems.has(mention.id)}
                            style={{
                              padding: "0.375rem 0.75rem",
                              fontSize: "0.875rem",
                              borderRadius: "0.375rem",
                              border: "none",
                              cursor: analyzingItems.has(mention.id) ? "not-allowed" : "pointer",
                              backgroundColor: analyzingItems.has(mention.id) ? "#9ca3af" : "#7c3aed",
                              color: analyzingItems.has(mention.id) ? "#e5e7eb" : "white",
                            }}
                            onMouseEnter={(e) => {
                              if (!analyzingItems.has(mention.id)) {
                                e.target.style.backgroundColor = "#6d28d9";
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!analyzingItems.has(mention.id)) {
                                e.target.style.backgroundColor = "#7c3aed";
                              }
                            }}
                          >
                            {analyzingItems.has(mention.id)
                              ? "Analyzing..."
                              : "Analyze"}
                          </button>
                        </div>
                      ) : (
                        mention.claudeAnalysis && (
                          <div
                            style={{
                              borderTop: "1px solid #e5e7eb",
                              paddingTop: "0.75rem",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                marginBottom: "0.5rem",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "0.5rem",
                                }}
                              >
                                <span
                                  style={{
                                    padding: "0.25rem 0.5rem",
                                    fontSize: "0.75rem",
                                    fontWeight: "500",
                                    borderRadius: "9999px",
                                    backgroundColor:
                                      mention.sentiment === "positive"
                                        ? "#dcfce7"
                                        : mention.sentiment === "negative"
                                        ? "#fecaca"
                                        : mention.sentiment === "mixed"
                                        ? "#e9d5ff"
                                        : "#f3f4f6",
                                    color:
                                      mention.sentiment === "positive"
                                        ? "#166534"
                                        : mention.sentiment === "negative"
                                        ? "#991b1b"
                                        : mention.sentiment === "mixed"
                                        ? "#6b21a8"
                                        : "#1f2937",
                                  }}
                                >
                                  {mention.sentiment.charAt(0).toUpperCase() +
                                    mention.sentiment.slice(1)}
                                </span>
                                {mention.claudeAnalysis.sentiment_score && (
                                  <span
                                    style={{
                                      fontSize: "0.75rem",
                                      color: "#4b5563",
                                    }}
                                  >
                                    Score:{" "}
                                    {mention.claudeAnalysis.sentiment_score}
                                  </span>
                                )}
                                {mention.claudeAnalysis.confidence && (
                                  <span
                                    style={{
                                      fontSize: "0.75rem",
                                      color: "#4b5563",
                                    }}
                                  >
                                    Confidence:{" "}
                                    {Math.round(
                                      mention.claudeAnalysis.confidence * 100
                                    )}
                                    %
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={() => toggleSummary(mention.id)}
                                style={{
                                  color: "#2563eb",
                                  fontSize: "0.875rem",
                                  border: "none",
                                  background: "transparent",
                                  cursor: "pointer",
                                  padding: "0.25rem",
                                  borderRadius: "0.25rem",
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.color = "#1e40af";
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.color = "#2563eb";
                                }}
                              >
                                {expandedSummaries.has(mention.id)
                                  ? "Hide Details"
                                  : "Show Details"}
                              </button>
                            </div>

                            {mention.claudeAnalysis.summary && (
                              <p
                                style={{
                                  fontSize: "0.875rem",
                                  color: "#374151",
                                  marginBottom: "0.5rem",
                                  margin: "0 0 0.5rem 0",
                                }}
                              >
                                {mention.claudeAnalysis.summary}
                              </p>
                            )}

                            {expandedSummaries.has(mention.id) && (
                              <div
                                style={{
                                  marginTop: "0.75rem",
                                  padding: "0.75rem",
                                  backgroundColor: "#f9fafb",
                                  borderRadius: "0.5rem",
                                  fontSize: "0.875rem",
                                }}
                              >
                                {mention.claudeAnalysis.key_topics &&
                                  mention.claudeAnalysis.key_topics.length >
                                    0 && (
                                    <div style={{ marginBottom: "0.5rem" }}>
                                      <strong style={{ color: "#1f2937" }}>
                                        Topics:{" "}
                                      </strong>
                                      <span style={{ color: "#374151" }}>
                                        {mention.claudeAnalysis.key_topics.join(
                                          ", "
                                        )}
                                      </span>
                                    </div>
                                  )}

                                {mention.claudeAnalysis.emotions_detected
                                  ?.primary && (
                                  <div style={{ marginBottom: "0.5rem" }}>
                                    <strong style={{ color: "#1f2937" }}>
                                      Primary Emotion:{" "}
                                    </strong>
                                    <span
                                      style={{
                                        color: "#374151",
                                        textTransform: "capitalize",
                                      }}
                                    >
                                      {
                                        mention.claudeAnalysis.emotions_detected
                                          .primary
                                      }
                                    </span>
                                  </div>
                                )}

                                {mention.claudeAnalysis.urgency_level &&
                                  mention.claudeAnalysis.urgency_level !==
                                    "low" && (
                                    <div style={{ marginBottom: "0.5rem" }}>
                                      <strong style={{ color: "#1f2937" }}>
                                        Urgency:{" "}
                                      </strong>
                                      <span
                                        style={{
                                          textTransform: "capitalize",
                                          color:
                                            mention.claudeAnalysis
                                              .urgency_level === "critical"
                                              ? "#b91c1c"
                                              : mention.claudeAnalysis
                                                  .urgency_level === "high"
                                              ? "#c2410c"
                                              : "#374151",
                                          fontWeight:
                                            mention.claudeAnalysis
                                              .urgency_level === "critical" ||
                                            mention.claudeAnalysis
                                              .urgency_level === "high"
                                              ? "500"
                                              : "normal",
                                        }}
                                      >
                                        {mention.claudeAnalysis.urgency_level}
                                      </span>
                                    </div>
                                  )}

                                {mention.claudeAnalysis.recommended_action && (
                                  <div style={{ marginBottom: "0.5rem" }}>
                                    <strong style={{ color: "#1f2937" }}>
                                      Recommended Action:{" "}
                                    </strong>
                                    <span style={{ color: "#374151" }}>
                                      {
                                        mention.claudeAnalysis
                                          .recommended_action
                                      }
                                    </span>
                                  </div>
                                )}

                                {mention.claudeAnalysis.rationale && (
                                  <div>
                                    <strong style={{ color: "#1f2937" }}>
                                      Analysis:{" "}
                                    </strong>
                                    <span style={{ color: "#374151" }}>
                                      {mention.claudeAnalysis.rationale}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Stats Summary */}
            {monitoringFeed.length > 0 && (
              <div
                style={{
                  marginTop: "1.5rem",
                  padding: "1rem",
                  backgroundColor: "#f9fafb",
                  borderRadius: "0.5rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "0.875rem",
                  }}
                >
                  <span style={{ color: "#4b5563" }}>
                    Last updated: {lastUpdate.toLocaleTimeString()}
                  </span>
                  <span style={{ color: "#4b5563" }}>
                    Total: {metrics.totalMentions} mentions •{" "}
                    {metrics.analyzedCount} analyzed • {metrics.unanalyzedCount}{" "}
                    pending
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Data Sources Tab */}
        {activeTab === "sources" && (
          <div style={{ ...styles.card, marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
              <div style={styles.gradientIcon}>
                <Rss style={{ width: "1.5rem", height: "1.5rem", color: "white" }} />
              </div>
              <div>
                <h2 style={styles.text.heading}>Data Sources</h2>
                <p style={styles.text.body}>Configure where to fetch mentions from</p>
              </div>
            </div>

            {/* Keywords Section */}
            <div style={{ marginBottom: "2rem" }}>
              <h3 style={{ ...styles.text.subheading, marginBottom: "1rem" }}>Monitoring Keywords</h3>
              <p style={{ ...styles.text.body, marginBottom: "1rem" }}>
                Enter keywords to monitor. Mentions containing these keywords will be fetched.
              </p>
              
              {/* Add Keyword Form */}
              <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
                <input
                  type="text"
                  placeholder="Enter keyword to monitor (e.g., your brand name, product, competitor)"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && newKeyword.trim()) {
                      handleAddKeyword();
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: "0.75rem",
                    border: "1px solid #e5e7eb",
                    borderRadius: "0.5rem",
                    fontSize: "0.875rem",
                    outline: "none",
                  }}
                />
                <button
                  onClick={handleAddKeyword}
                  style={{
                    ...styles.button.primary,
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                  disabled={!newKeyword.trim()}
                >
                  <Plus style={{ width: "1rem", height: "1rem" }} />
                  Add Keyword
                </button>
              </div>

              {/* Keywords List */}
              <div style={{ marginBottom: "1.5rem" }}>
                {(!dataSourceConfig.monitoringKeywords || dataSourceConfig.monitoringKeywords.length === 0) ? (
                  <div style={{ 
                    padding: "1.5rem", 
                    background: "#fef3c7", 
                    border: "1px solid #fde68a",
                    borderRadius: "0.5rem",
                    textAlign: "center" 
                  }}>
                    <AlertCircle style={{ width: "2rem", height: "2rem", color: "#f59e0b", margin: "0 auto 0.5rem" }} />
                    <p style={{ color: "#92400e", fontWeight: "500", marginBottom: "0.25rem" }}>
                      No keywords added yet
                    </p>
                    <p style={{ fontSize: "0.875rem", color: "#92400e" }}>
                      Add at least one keyword to start monitoring mentions
                    </p>
                  </div>
                ) : (
                  <div>
                    <p style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "0.75rem" }}>
                      Active Keywords ({dataSourceConfig.monitoringKeywords.length})
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                      {dataSourceConfig.monitoringKeywords.map((keyword, index) => (
                        <div
                          key={index}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            padding: "0.5rem 0.75rem",
                            background: "#e9d5ff",
                            border: "1px solid #c084fc",
                            borderRadius: "9999px",
                            fontSize: "0.875rem",
                          }}
                        >
                          <Hash style={{ width: "0.875rem", height: "0.875rem", color: "#7c3aed" }} />
                          <span style={{ color: "#7c3aed", fontWeight: "500" }}>{keyword}</span>
                          <button
                            onClick={() => handleRemoveKeyword(index)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: "1.25rem",
                              height: "1.25rem",
                              background: "#7c3aed",
                              color: "white",
                              borderRadius: "50%",
                              border: "none",
                              cursor: "pointer",
                              fontSize: "0.75rem",
                            }}
                          >
                            <X style={{ width: "0.75rem", height: "0.75rem" }} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Source Type Selection */}
            <div style={{ marginBottom: "2rem", borderTop: "1px solid #e5e7eb", paddingTop: "1.5rem" }}>
              <h3 style={{ ...styles.text.subheading, marginBottom: "1rem" }}>Data Source Type</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
                <button
                  onClick={() => setDataSourceConfig({ ...dataSourceConfig, sourceType: "demo" })}
                  style={{
                    padding: "1rem",
                    border: `2px solid ${dataSourceConfig.sourceType === "demo" ? "#6366f1" : "#e5e7eb"}`,
                    borderRadius: "0.5rem",
                    background: dataSourceConfig.sourceType === "demo" ? "#ede9fe" : "white",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  <h4 style={{ fontSize: "0.875rem", fontWeight: "600", color: "#1f2937", marginBottom: "0.25rem" }}>
                    Demo Data
                  </h4>
                  <p style={styles.text.small}>Generate sample mentions for testing</p>
                </button>
                
                <button
                  onClick={() => setDataSourceConfig({ ...dataSourceConfig, sourceType: "aggregator" })}
                  style={{
                    padding: "1rem",
                    border: `2px solid ${dataSourceConfig.sourceType === "aggregator" ? "#6366f1" : "#e5e7eb"}`,
                    borderRadius: "0.5rem",
                    background: dataSourceConfig.sourceType === "aggregator" ? "#ede9fe" : "white",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  <h4 style={{ fontSize: "0.875rem", fontWeight: "600", color: "#1f2937", marginBottom: "0.25rem" }}>
                    RSS Feeds
                  </h4>
                  <p style={styles.text.small}>Monitor RSS feeds from news sources</p>
                </button>
                
                <button
                  onClick={() => setDataSourceConfig({ ...dataSourceConfig, sourceType: "api" })}
                  style={{
                    padding: "1rem",
                    border: `2px solid ${dataSourceConfig.sourceType === "api" ? "#6366f1" : "#e5e7eb"}`,
                    borderRadius: "0.5rem",
                    background: dataSourceConfig.sourceType === "api" ? "#ede9fe" : "white",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    opacity: 0.5,
                  }}
                  disabled
                >
                  <h4 style={{ fontSize: "0.875rem", fontWeight: "600", color: "#1f2937", marginBottom: "0.25rem" }}>
                    Custom API
                  </h4>
                  <p style={styles.text.small}>Connect to your own API (Coming Soon)</p>
                </button>
              </div>
            </div>

            {/* RSS Feed Configuration */}
            {dataSourceConfig.sourceType === "aggregator" && (
              <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "1.5rem" }}>
                <h3 style={{ ...styles.text.subheading, marginBottom: "1rem" }}>RSS Feed Categories</h3>
                <p style={{ ...styles.text.body, marginBottom: "1rem" }}>
                  Select which feed categories to monitor. Keywords from Agent Config will filter the results.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem" }}>
                  {[
                    { id: "tech", name: "Technology News", sources: ["TechCrunch", "The Verge", "Wired"] },
                    { id: "business", name: "Business & Finance", sources: ["Reuters", "Bloomberg", "FT"] },
                    { id: "pr", name: "Press Releases", sources: ["PR Newswire", "Business Wire"] },
                    { id: "marketing", name: "Marketing & Advertising", sources: ["AdWeek", "Marketing Week"] },
                    { id: "general", name: "General News", sources: ["CNN", "BBC", "NYT"] },
                    { id: "forums", name: "Forums & Social", sources: ["Reddit", "Hacker News"] },
                  ].map((category) => (
                    <label
                      key={category.id}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "0.75rem",
                        padding: "1rem",
                        border: "1px solid #e5e7eb",
                        borderRadius: "0.5rem",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={dataSourceConfig.aggregatorConfig?.sourceTypes?.includes(category.id) || false}
                        onChange={(e) => {
                          const currentTypes = dataSourceConfig.aggregatorConfig?.sourceTypes || [];
                          const newTypes = e.target.checked
                            ? [...currentTypes, category.id]
                            : currentTypes.filter(t => t !== category.id);
                          
                          setDataSourceConfig({
                            ...dataSourceConfig,
                            aggregatorConfig: {
                              ...dataSourceConfig.aggregatorConfig,
                              sourceTypes: newTypes,
                            },
                          });
                        }}
                        style={{ marginTop: "0.125rem" }}
                      />
                      <div style={{ flex: 1 }}>
                        <h4 style={{ fontSize: "0.875rem", fontWeight: "600", color: "#1f2937" }}>
                          {category.name}
                        </h4>
                        <p style={styles.text.small}>
                          {category.sources.join(", ")}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>

                {/* Update Interval */}
                <div style={{ marginTop: "1.5rem" }}>
                  <label style={{ display: "block", marginBottom: "0.5rem" }}>
                    <span style={{ fontSize: "0.875rem", fontWeight: "500", color: "#374151" }}>
                      Update Interval
                    </span>
                  </label>
                  <select
                    value={dataSourceConfig.aggregatorConfig?.updateInterval || 300000}
                    onChange={(e) => setDataSourceConfig({
                      ...dataSourceConfig,
                      aggregatorConfig: {
                        ...dataSourceConfig.aggregatorConfig,
                        updateInterval: parseInt(e.target.value),
                      },
                    })}
                    style={{
                      padding: "0.5rem",
                      border: "1px solid #e5e7eb",
                      borderRadius: "0.375rem",
                      fontSize: "0.875rem",
                      width: "200px",
                    }}
                  >
                    <option value="60000">1 minute</option>
                    <option value="300000">5 minutes</option>
                    <option value="900000">15 minutes</option>
                    <option value="1800000">30 minutes</option>
                    <option value="3600000">1 hour</option>
                  </select>
                </div>
              </div>
            )}

            {/* Demo Configuration */}
            {dataSourceConfig.sourceType === "demo" && (
              <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "1.5rem" }}>
                <h3 style={{ ...styles.text.subheading, marginBottom: "1rem" }}>Demo Settings</h3>
                <p style={{ ...styles.text.body, marginBottom: "1rem" }}>
                  Generate sample data to test the monitoring system. Keywords from Agent Config will be used.
                </p>
                <label style={{ display: "block" }}>
                  <span style={{ fontSize: "0.875rem", fontWeight: "500", color: "#374151", display: "block", marginBottom: "0.5rem" }}>
                    Number of mentions to generate
                  </span>
                  <input
                    type="number"
                    value={dataSourceConfig.demo?.count || 15}
                    onChange={(e) => setDataSourceConfig({
                      ...dataSourceConfig,
                      demo: {
                        ...dataSourceConfig.demo,
                        count: parseInt(e.target.value) || 15,
                      },
                    })}
                    min="1"
                    max="50"
                    style={{
                      padding: "0.5rem",
                      border: "1px solid #e5e7eb",
                      borderRadius: "0.375rem",
                      fontSize: "0.875rem",
                      width: "100px",
                    }}
                  />
                </label>
              </div>
            )}

            {/* Fetch Button */}
            <div style={{ marginTop: "2rem", display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
              <button
                onClick={() => {
                  setActiveTab("monitor");
                  setTimeout(() => fetchMentions(), 100);
                }}
                style={{
                  ...styles.button.primary,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
                disabled={
                  dataSourceConfig.sourceType === "aggregator" && 
                  (!dataSourceConfig.aggregatorConfig?.sourceTypes || 
                   dataSourceConfig.aggregatorConfig.sourceTypes.length === 0)
                }
              >
                <Zap style={{ width: "1rem", height: "1rem" }} />
                Fetch Mentions
              </button>
            </div>
          </div>
        )}

        {/* Agent Configuration Tab */}
        {activeTab === "agent" && (
          <div style={{ ...styles.card, marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
              <div style={styles.gradientIcon}>
                <Bot style={{ width: "1.5rem", height: "1.5rem", color: "white" }} />
              </div>
              <div>
                <h2 style={styles.text.heading}>Agent Configuration</h2>
                <p style={styles.text.body}>Configure your AI monitoring agent settings and website monitoring</p>
              </div>
            </div>

            {/* Website Monitoring Section */}
            <div style={{ marginBottom: "2rem" }}>
              <h3 style={{ ...styles.text.subheading, marginBottom: "1rem" }}>Website Monitoring</h3>
              
              {/* Add Website Form */}
              <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
                <input
                  type="url"
                  placeholder="Enter website URL to monitor"
                  value={newWebsite}
                  onChange={(e) => setNewWebsite(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "0.75rem",
                    border: "1px solid #e5e7eb",
                    borderRadius: "0.5rem",
                    fontSize: "0.875rem",
                    outline: "none",
                  }}
                />
                <button
                  onClick={handleAddWebsite}
                  style={{
                    ...styles.button.primary,
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                  disabled={!newWebsite}
                >
                  <Plus style={{ width: "1rem", height: "1rem" }} />
                  Add Website
                </button>
              </div>

              {/* Monitored Websites List */}
              <div style={{ marginBottom: "1.5rem" }}>
                <h4 style={{ fontSize: "0.875rem", fontWeight: "600", color: "#374151", marginBottom: "0.75rem" }}>
                  Monitored Websites ({monitoredWebsites.length})
                </h4>
                {monitoredWebsites.length === 0 ? (
                  <div style={styles.emptyState}>
                    <Globe style={{ width: "3rem", height: "3rem", color: "#9ca3af", marginBottom: "0.5rem" }} />
                    <p>No websites being monitored yet. Add a website above to start tracking changes.</p>
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: "0.75rem" }}>
                    {monitoredWebsites.map((website) => (
                      <div
                        key={website.id}
                        style={{
                          padding: "1rem",
                          border: "1px solid #e5e7eb",
                          borderRadius: "0.5rem",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <Globe style={{ width: "1.25rem", height: "1.25rem", color: "#6b7280" }} />
                          <div>
                            <p style={{ fontSize: "0.875rem", fontWeight: "500", color: "#1f2937" }}>{website.url}</p>
                            <p style={styles.text.small}>
                              Last checked: {website.lastChecked ? new Date(website.lastChecked).toLocaleString() : "Never"}
                            </p>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <button
                            onClick={() => handleCheckWebsite(website.id)}
                            style={{
                              padding: "0.5rem",
                              background: "#f3f4f6",
                              border: "1px solid #e5e7eb",
                              borderRadius: "0.375rem",
                              cursor: "pointer",
                            }}
                          >
                            <RefreshCw style={{ width: "1rem", height: "1rem", color: "#6b7280" }} />
                          </button>
                          <button
                            onClick={() => handleRemoveWebsite(website.id)}
                            style={{
                              padding: "0.5rem",
                              background: "#fee2e2",
                              border: "1px solid #fecaca",
                              borderRadius: "0.375rem",
                              cursor: "pointer",
                            }}
                          >
                            <X style={{ width: "1rem", height: "1rem", color: "#ef4444" }} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Monitoring Settings */}
              <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "1.5rem" }}>
                <h4 style={{ fontSize: "0.875rem", fontWeight: "600", color: "#374151", marginBottom: "1rem" }}>
                  Monitoring Settings
                </h4>
                <div style={{ display: "grid", gap: "1rem" }}>
                  <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={styles.text.body}>Check frequency</span>
                    <select
                      value={monitoringSettings.checkFrequency}
                      onChange={(e) => setMonitoringSettings({ ...monitoringSettings, checkFrequency: e.target.value })}
                      style={{
                        padding: "0.5rem",
                        border: "1px solid #e5e7eb",
                        borderRadius: "0.375rem",
                        fontSize: "0.875rem",
                      }}
                    >
                      <option value="5">Every 5 minutes</option>
                      <option value="15">Every 15 minutes</option>
                      <option value="30">Every 30 minutes</option>
                      <option value="60">Every hour</option>
                    </select>
                  </label>
                  <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={styles.text.body}>Visual change detection</span>
                    <input
                      type="checkbox"
                      checked={monitoringSettings.visualDetection}
                      onChange={(e) => setMonitoringSettings({ ...monitoringSettings, visualDetection: e.target.checked })}
                      style={{ width: "1.25rem", height: "1.25rem" }}
                    />
                  </label>
                  <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={styles.text.body}>Content change alerts</span>
                    <input
                      type="checkbox"
                      checked={monitoringSettings.contentAlerts}
                      onChange={(e) => setMonitoringSettings({ ...monitoringSettings, contentAlerts: e.target.checked })}
                      style={{ width: "1.25rem", height: "1.25rem" }}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Event Templates Section */}
            <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "1.5rem" }}>
              <h3 style={{ ...styles.text.subheading, marginBottom: "1rem" }}>Event Monitoring Templates</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1rem" }}>
                {[
                  { name: "Milken Conference", icon: Calendar, keywords: ["milken", "conference", "finance"] },
                  { name: "Davos", icon: Globe, keywords: ["davos", "WEF", "world economic forum"] },
                  { name: "CES", icon: Cpu, keywords: ["CES", "consumer electronics", "tech show"] },
                ].map((template) => (
                  <div
                    key={template.name}
                    style={{
                      padding: "1rem",
                      border: "1px solid #e5e7eb",
                      borderRadius: "0.5rem",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    onClick={() => handleApplyTemplate(template)}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                      <template.icon style={{ width: "1.25rem", height: "1.25rem", color: "#6366f1" }} />
                      <h4 style={{ fontSize: "0.875rem", fontWeight: "600", color: "#1f2937" }}>{template.name}</h4>
                    </div>
                    <p style={styles.text.small}>Click to apply monitoring template</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Save Configuration Button */}
            <div style={{ marginTop: "2rem", display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={handleSaveConfig}
                style={styles.button.primary}
                disabled={savingConfig}
              >
                {savingConfig ? "Saving..." : "Save Configuration"}
              </button>
            </div>
          </div>
        )}

        {/* Brand Statistics Tab */}
        {activeTab === "metrics" && (
          <div style={{ ...styles.card }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
              <div style={styles.gradientIcon}>
                <BarChart3 style={{ width: "1.5rem", height: "1.5rem", color: "white" }} />
              </div>
              <div>
                <h2 style={styles.text.heading}>Brand Statistics</h2>
                <p style={styles.text.body}>Comprehensive analytics and insights about your brand mentions</p>
              </div>
            </div>

            {/* Time Range Selector */}
            <div style={{ marginBottom: "1.5rem", display: "flex", gap: "0.5rem" }}>
              {["24h", "7d", "30d", "90d"].map((range) => (
                <button
                  key={range}
                  onClick={() => setMetricsTimeRange(range)}
                  style={{
                    padding: "0.5rem 1rem",
                    background: metricsTimeRange === range ? "#6366f1" : "white",
                    color: metricsTimeRange === range ? "white" : "#6b7280",
                    border: "1px solid #e5e7eb",
                    borderRadius: "0.375rem",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    cursor: "pointer",
                  }}
                >
                  {range === "24h" ? "24 Hours" : range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : "90 Days"}
                </button>
              ))}
            </div>

            {/* Key Metrics Grid */}
            <div style={styles.grid.metrics}>
              <div style={{ ...styles.card, padding: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
                  <Activity style={{ width: "1.25rem", height: "1.25rem", color: "#6366f1" }} />
                  <h3 style={{ fontSize: "0.875rem", fontWeight: "600", color: "#6b7280" }}>Total Mentions</h3>
                </div>
                <p style={{ fontSize: "2rem", fontWeight: "700", color: "#1f2937" }}>{metrics.totalMentions}</p>
                <p style={{ fontSize: "0.75rem", color: metrics.percentageChange > 0 ? "#10b981" : "#ef4444" }}>
                  {metrics.percentageChange > 0 ? "+" : ""}{metrics.percentageChange}% from previous period
                </p>
              </div>

              <div style={{ ...styles.card, padding: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
                  <Users style={{ width: "1.25rem", height: "1.25rem", color: "#8b5cf6" }} />
                  <h3 style={{ fontSize: "0.875rem", fontWeight: "600", color: "#6b7280" }}>Total Reach</h3>
                </div>
                <p style={{ fontSize: "2rem", fontWeight: "700", color: "#1f2937" }}>{metrics.totalReach.toLocaleString()}</p>
                <p style={{ fontSize: "0.75rem", color: "#6b7280" }}>Unique impressions</p>
              </div>

              <div style={{ ...styles.card, padding: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
                  <TrendingUp style={{ width: "1.25rem", height: "1.25rem", color: "#10b981" }} />
                  <h3 style={{ fontSize: "0.875rem", fontWeight: "600", color: "#6b7280" }}>Avg. Sentiment</h3>
                </div>
                <p style={{ fontSize: "2rem", fontWeight: "700", color: "#1f2937" }}>{metrics.avgSentiment}</p>
                <p style={{ fontSize: "0.75rem", color: "#10b981" }}>Positive trend</p>
              </div>

              <div style={{ ...styles.card, padding: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
                  <AlertCircle style={{ width: "1.25rem", height: "1.25rem", color: "#ef4444" }} />
                  <h3 style={{ fontSize: "0.875rem", fontWeight: "600", color: "#6b7280" }}>Critical Mentions</h3>
                </div>
                <p style={{ fontSize: "2rem", fontWeight: "700", color: "#1f2937" }}>{metrics.criticalCount}</p>
                <p style={{ fontSize: "0.75rem", color: "#ef4444" }}>Requires attention</p>
              </div>
            </div>

            {/* Sentiment Distribution Chart */}
            <div style={{ ...styles.card, marginTop: "1.5rem", padding: "1.5rem" }}>
              <h3 style={{ ...styles.text.subheading, marginBottom: "1rem" }}>Sentiment Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Positive", value: sentimentCounts.positive, color: "#10b981" },
                      { name: "Neutral", value: sentimentCounts.neutral, color: "#6b7280" },
                      { name: "Negative", value: sentimentCounts.negative, color: "#ef4444" },
                      { name: "Mixed", value: sentimentCounts.mixed, color: "#8b5cf6" },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[
                      { name: "Positive", value: sentimentCounts.positive, color: "#10b981" },
                      { name: "Neutral", value: sentimentCounts.neutral, color: "#6b7280" },
                      { name: "Negative", value: sentimentCounts.negative, color: "#ef4444" },
                      { name: "Mixed", value: sentimentCounts.mixed, color: "#8b5cf6" },
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Mentions Over Time Chart */}
            <div style={{ ...styles.card, marginTop: "1.5rem", padding: "1.5rem" }}>
              <h3 style={{ ...styles.text.subheading, marginBottom: "1rem" }}>Mentions Over Time</h3>
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
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="neutral"
                    stackId="1"
                    stroke="#6b7280"
                    fill="#6b7280"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="negative"
                    stackId="1"
                    stroke="#ef4444"
                    fill="#ef4444"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Top Sources */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginTop: "1.5rem" }}>
              <div style={{ ...styles.card, padding: "1.5rem" }}>
                <h3 style={{ ...styles.text.subheading, marginBottom: "1rem" }}>Top Sources</h3>
                <div style={{ display: "grid", gap: "0.75rem" }}>
                  {sourceCounts.slice(0, 5).map((source, index) => (
                    <div key={index} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={styles.text.body}>{source.name}</span>
                      <span style={{ ...styles.text.body, fontWeight: "600" }}>{source.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Topics */}
              <div style={{ ...styles.card, padding: "1.5rem" }}>
                <h3 style={{ ...styles.text.subheading, marginBottom: "1rem" }}>Trending Topics</h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {["Product Launch", "Customer Service", "Pricing", "Features", "Competition"].map((topic) => (
                    <span
                      key={topic}
                      style={{
                        padding: "0.25rem 0.75rem",
                        background: "#e9d5ff",
                        color: "#7c3aed",
                        borderRadius: "0.375rem",
                        fontSize: "0.75rem",
                        fontWeight: "500",
                      }}
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Export Options */}
            <div style={{ marginTop: "2rem", display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
                style={{
                  padding: "0.625rem 1rem",
                  border: "1px solid #e5e7eb",
                  borderRadius: "0.5rem",
                  fontSize: "0.875rem",
                }}
              >
                <option value="csv">CSV</option>
                <option value="json">JSON</option>
                <option value="pdf">PDF</option>
              </select>
              <button
                onClick={handleExportData}
                style={{
                  ...styles.button.primary,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <Share2 style={{ width: "1rem", height: "1rem" }} />
                Export Report
              </button>
            </div>
          </div>
        )}

        {/* Alerts Tab */}
        {activeTab === "alerts" && (
          <div style={{ ...styles.card }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
              <div style={styles.gradientIcon}>
                <Bell style={{ width: "1.5rem", height: "1.5rem", color: "white" }} />
              </div>
              <div>
                <h2 style={styles.text.heading}>Alerts & Notifications</h2>
                <p style={styles.text.body}>Manage alert rules and view recent notifications</p>
              </div>
            </div>

            {/* Alert Rules Configuration */}
            <div style={{ marginBottom: "2rem" }}>
              <h3 style={{ ...styles.text.subheading, marginBottom: "1rem" }}>Alert Rules</h3>
              
              <div style={{ display: "grid", gap: "1rem" }}>
                {/* Sentiment Alerts */}
                <div style={{ padding: "1rem", border: "1px solid #e5e7eb", borderRadius: "0.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                    <div>
                      <h4 style={{ fontSize: "0.875rem", fontWeight: "600", color: "#1f2937" }}>Negative Sentiment Alerts</h4>
                      <p style={styles.text.small}>Notify when negative sentiment exceeds threshold</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={alertConfig.negativeSentiment}
                      onChange={(e) => setAlertConfig({ ...alertConfig, negativeSentiment: e.target.checked })}
                      style={{ width: "1.25rem", height: "1.25rem" }}
                    />
                  </div>
                  {alertConfig.negativeSentiment && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.5rem" }}>
                      <span style={styles.text.small}>Threshold:</span>
                      <input
                        type="number"
                        value={alertConfig.sentimentThreshold}
                        onChange={(e) => setAlertConfig({ ...alertConfig, sentimentThreshold: parseInt(e.target.value) })}
                        style={{
                          padding: "0.25rem 0.5rem",
                          border: "1px solid #e5e7eb",
                          borderRadius: "0.25rem",
                          fontSize: "0.75rem",
                          width: "80px",
                        }}
                      />
                      <span style={styles.text.small}>mentions</span>
                    </div>
                  )}
                </div>

                {/* Volume Spike Alerts */}
                <div style={{ padding: "1rem", border: "1px solid #e5e7eb", borderRadius: "0.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                    <div>
                      <h4 style={{ fontSize: "0.875rem", fontWeight: "600", color: "#1f2937" }}>Volume Spike Alerts</h4>
                      <p style={styles.text.small}>Alert on unusual mention volume increases</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={alertConfig.volumeSpike}
                      onChange={(e) => setAlertConfig({ ...alertConfig, volumeSpike: e.target.checked })}
                      style={{ width: "1.25rem", height: "1.25rem" }}
                    />
                  </div>
                  {alertConfig.volumeSpike && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.5rem" }}>
                      <span style={styles.text.small}>Spike threshold:</span>
                      <input
                        type="number"
                        value={alertConfig.spikeThreshold}
                        onChange={(e) => setAlertConfig({ ...alertConfig, spikeThreshold: parseInt(e.target.value) })}
                        style={{
                          padding: "0.25rem 0.5rem",
                          border: "1px solid #e5e7eb",
                          borderRadius: "0.25rem",
                          fontSize: "0.75rem",
                          width: "80px",
                        }}
                      />
                      <span style={styles.text.small}>% increase</span>
                    </div>
                  )}
                </div>

                {/* Keyword Alerts */}
                <div style={{ padding: "1rem", border: "1px solid #e5e7eb", borderRadius: "0.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                    <div>
                      <h4 style={{ fontSize: "0.875rem", fontWeight: "600", color: "#1f2937" }}>Keyword Alerts</h4>
                      <p style={styles.text.small}>Alert when specific keywords are mentioned</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={alertConfig.keywordAlerts}
                      onChange={(e) => setAlertConfig({ ...alertConfig, keywordAlerts: e.target.checked })}
                      style={{ width: "1.25rem", height: "1.25rem" }}
                    />
                  </div>
                  {alertConfig.keywordAlerts && (
                    <div style={{ marginTop: "0.5rem" }}>
                      <input
                        type="text"
                        value={alertConfig.keywords?.join(", ") || ""}
                        onChange={(e) => setAlertConfig({ ...alertConfig, keywords: e.target.value.split(",").map(k => k.trim()) })}
                        placeholder="Enter keywords separated by commas"
                        style={{
                          width: "100%",
                          padding: "0.5rem",
                          border: "1px solid #e5e7eb",
                          borderRadius: "0.25rem",
                          fontSize: "0.75rem",
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Crisis Detection */}
                <div style={{ padding: "1rem", border: "1px solid #e5e7eb", borderRadius: "0.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <h4 style={{ fontSize: "0.875rem", fontWeight: "600", color: "#1f2937" }}>Crisis Detection</h4>
                      <p style={styles.text.small}>AI-powered detection of potential PR crises</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={alertConfig.crisisDetection || true}
                      onChange={(e) => setAlertConfig({ ...alertConfig, crisisDetection: e.target.checked })}
                      style={{ width: "1.25rem", height: "1.25rem" }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Notification Channels */}
            <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "1.5rem", marginBottom: "2rem" }}>
              <h3 style={{ ...styles.text.subheading, marginBottom: "1rem" }}>Notification Channels</h3>
              
              <div style={{ display: "grid", gap: "1rem" }}>
                <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Bell style={{ width: "1rem", height: "1rem", color: "#6b7280" }} />
                    <span style={styles.text.body}>In-App Notifications</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={true}
                    disabled
                    style={{ width: "1.25rem", height: "1.25rem" }}
                  />
                </label>

                <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={styles.text.body}>Email Notifications</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={alertConfig.emailNotifications || false}
                    onChange={(e) => setAlertConfig({ ...alertConfig, emailNotifications: e.target.checked })}
                    style={{ width: "1.25rem", height: "1.25rem" }}
                  />
                </label>

                <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={styles.text.body}>SMS Notifications</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={alertConfig.smsNotifications || false}
                    onChange={(e) => setAlertConfig({ ...alertConfig, smsNotifications: e.target.checked })}
                    style={{ width: "1.25rem", height: "1.25rem" }}
                  />
                </label>

                <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={styles.text.body}>Slack Integration</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={alertConfig.slackIntegration || false}
                    onChange={(e) => setAlertConfig({ ...alertConfig, slackIntegration: e.target.checked })}
                    style={{ width: "1.25rem", height: "1.25rem" }}
                  />
                </label>
              </div>
            </div>

            {/* Recent Alerts */}
            <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "1.5rem" }}>
              <h3 style={{ ...styles.text.subheading, marginBottom: "1rem" }}>
                Recent Alerts ({alerts.filter(a => !a.acknowledged).length} unacknowledged)
              </h3>
              
              {alerts.length === 0 ? (
                <div style={styles.emptyState}>
                  <Bell style={{ width: "3rem", height: "3rem", color: "#9ca3af", marginBottom: "0.5rem" }} />
                  <p>No alerts yet. Alerts will appear here when triggered by your configured rules.</p>
                </div>
              ) : (
                <div style={{ display: "grid", gap: "0.75rem" }}>
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      style={{
                        padding: "1rem",
                        border: `1px solid ${alert.type === "critical" ? "#fecaca" : "#e5e7eb"}`,
                        borderRadius: "0.5rem",
                        background: alert.acknowledged ? "#f9fafb" : "white",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                            <AlertCircle
                              style={{
                                width: "1rem",
                                height: "1rem",
                                color: alert.type === "critical" ? "#ef4444" : alert.type === "warning" ? "#f59e0b" : "#6b7280"
                              }}
                            />
                            <h4 style={{ fontSize: "0.875rem", fontWeight: "600", color: "#1f2937" }}>{alert.title}</h4>
                            <span
                              style={{
                                padding: "0.125rem 0.5rem",
                                background: alert.type === "critical" ? "#fee2e2" : alert.type === "warning" ? "#fef3c7" : "#f3f4f6",
                                color: alert.type === "critical" ? "#ef4444" : alert.type === "warning" ? "#f59e0b" : "#6b7280",
                                borderRadius: "0.25rem",
                                fontSize: "0.75rem",
                                fontWeight: "500",
                              }}
                            >
                              {alert.type}
                            </span>
                          </div>
                          <p style={styles.text.body}>{alert.message}</p>
                          <p style={styles.text.small}>{new Date(alert.timestamp).toLocaleString()}</p>
                        </div>
                        {!alert.acknowledged && (
                          <button
                            onClick={() => handleAcknowledgeAlert(alert.id)}
                            style={{
                              padding: "0.5rem 1rem",
                              background: "white",
                              color: "#6b7280",
                              border: "1px solid #e5e7eb",
                              borderRadius: "0.375rem",
                              fontSize: "0.75rem",
                              cursor: "pointer",
                            }}
                          >
                            Acknowledge
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Save Alert Settings */}
            <div style={{ marginTop: "2rem", display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={handleSaveConfig}
                style={styles.button.primary}
                disabled={savingConfig}
              >
                {savingConfig ? "Saving..." : "Save Alert Settings"}
              </button>
            </div>
          </div>
        )}

        {/* AI Configuration Tab */}
        {activeTab === "claude" && (
          <div style={{ ...styles.card }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
              <div style={styles.gradientIcon}>
                <Brain style={{ width: "1.5rem", height: "1.5rem", color: "white" }} />
              </div>
              <div>
                <h2 style={styles.text.heading}>AI Configuration</h2>
                <p style={styles.text.body}>Configure Claude AI settings for sentiment analysis and PR implications</p>
              </div>
            </div>

            {/* Claude Settings */}
            <div style={{ marginBottom: "2rem" }}>
              <h3 style={{ ...styles.text.subheading, marginBottom: "1rem" }}>Claude AI Settings</h3>
              
              <div style={{ display: "grid", gap: "1.5rem" }}>
                {/* Enable/Disable Claude */}
                <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <span style={{ fontSize: "0.875rem", fontWeight: "500", color: "#1f2937" }}>Enable Claude AI Analysis</span>
                    <p style={styles.text.small}>Use Claude for advanced sentiment analysis and PR insights</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={claudeConfig.enabled}
                    onChange={(e) => setClaudeConfig({ ...claudeConfig, enabled: e.target.checked })}
                    style={{ width: "1.25rem", height: "1.25rem" }}
                  />
                </label>

                {/* Analysis Model */}
                <div>
                  <label style={{ fontSize: "0.875rem", fontWeight: "500", color: "#1f2937", display: "block", marginBottom: "0.5rem" }}>
                    Analysis Model
                  </label>
                  <select
                    value={claudeConfig.model}
                    onChange={(e) => setClaudeConfig({ ...claudeConfig, model: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "1px solid #e5e7eb",
                      borderRadius: "0.5rem",
                      fontSize: "0.875rem",
                    }}
                    disabled={!claudeConfig.enabled}
                  >
                    <option value="claude-3-opus">Claude 3 Opus (Most Capable)</option>
                    <option value="claude-3-sonnet">Claude 3 Sonnet (Balanced)</option>
                    <option value="claude-3-haiku">Claude 3 Haiku (Fastest)</option>
                  </select>
                </div>

                {/* Temperature Setting */}
                <div>
                  <label style={{ fontSize: "0.875rem", fontWeight: "500", color: "#1f2937", display: "block", marginBottom: "0.5rem" }}>
                    Analysis Temperature: {claudeConfig.temperature}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={claudeConfig.temperature}
                    onChange={(e) => setClaudeConfig({ ...claudeConfig, temperature: parseFloat(e.target.value) })}
                    style={{ width: "100%" }}
                    disabled={!claudeConfig.enabled}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.25rem" }}>
                    <span style={styles.text.small}>Conservative</span>
                    <span style={styles.text.small}>Creative</span>
                  </div>
                </div>

                {/* Custom Instructions */}
                <div>
                  <label style={{ fontSize: "0.875rem", fontWeight: "500", color: "#1f2937", display: "block", marginBottom: "0.5rem" }}>
                    Custom Analysis Instructions
                  </label>
                  <textarea
                    value={claudeConfig.customInstructions}
                    onChange={(e) => setClaudeConfig({ ...claudeConfig, customInstructions: e.target.value })}
                    placeholder="Add specific instructions for Claude to follow during analysis..."
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "1px solid #e5e7eb",
                      borderRadius: "0.5rem",
                      fontSize: "0.875rem",
                      minHeight: "100px",
                      resize: "vertical",
                    }}
                    disabled={!claudeConfig.enabled}
                  />
                </div>
              </div>
            </div>

            {/* PR Implications Settings */}
            <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "1.5rem", marginBottom: "2rem" }}>
              <h3 style={{ ...styles.text.subheading, marginBottom: "1rem" }}>PR Implications Analysis</h3>
              
              <div style={{ display: "grid", gap: "1rem" }}>
                <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={styles.text.body}>Analyze PR implications</span>
                  <input
                    type="checkbox"
                    checked={claudeConfig.analyzePRImplications || true}
                    onChange={(e) => setClaudeConfig({ ...claudeConfig, analyzePRImplications: e.target.checked })}
                    style={{ width: "1.25rem", height: "1.25rem" }}
                    disabled={!claudeConfig.enabled}
                  />
                </label>

                <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={styles.text.body}>Generate response recommendations</span>
                  <input
                    type="checkbox"
                    checked={claudeConfig.generateRecommendations || true}
                    onChange={(e) => setClaudeConfig({ ...claudeConfig, generateRecommendations: e.target.checked })}
                    style={{ width: "1.25rem", height: "1.25rem" }}
                    disabled={!claudeConfig.enabled}
                  />
                </label>

                <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={styles.text.body}>Identify crisis indicators</span>
                  <input
                    type="checkbox"
                    checked={claudeConfig.identifyCrisis || true}
                    onChange={(e) => setClaudeConfig({ ...claudeConfig, identifyCrisis: e.target.checked })}
                    style={{ width: "1.25rem", height: "1.25rem" }}
                    disabled={!claudeConfig.enabled}
                  />
                </label>
              </div>
            </div>

            {/* Sentiment Context Configuration */}
            <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "1.5rem", marginBottom: "2rem" }}>
              <h3 style={{ ...styles.text.subheading, marginBottom: "1rem" }}>Sentiment Context Configuration</h3>
              <p style={{ ...styles.text.body, marginBottom: "1rem" }}>
                Define what constitutes positive or negative sentiment for your brand. Claude will analyze stories based on these concepts, not just keywords.
              </p>
              
              <div style={{ display: "grid", gap: "1.5rem" }}>
                {/* Positive Concepts */}
                <div style={{ position: "relative" }}>
                  <label style={{ fontSize: "0.875rem", fontWeight: "500", color: "#1f2937", display: "block", marginBottom: "0.5rem" }}>
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <TrendingUp style={{ width: "1rem", height: "1rem", color: "#10b981" }} />
                        Positive Concepts & Ideas
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowPositiveSuggestions(!showPositiveSuggestions)}
                        style={{
                          padding: "0.25rem 0.5rem",
                          fontSize: "0.75rem",
                          background: "#e9d5ff",
                          border: "1px solid #c084fc",
                          borderRadius: "0.375rem",
                          color: "#7c3aed",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.25rem",
                        }}
                      >
                        <Lightbulb style={{ width: "0.75rem", height: "0.75rem" }} />
                        Suggestions
                      </button>
                    </span>
                  </label>
                  <textarea
                    value={claudeConfig.sentimentContext?.positiveScenarios || ""}
                    onChange={(e) => setClaudeConfig({ 
                      ...claudeConfig, 
                      sentimentContext: { 
                        ...claudeConfig.sentimentContext, 
                        positiveScenarios: e.target.value 
                      } 
                    })}
                    placeholder="Examples:&#10;• Innovation in our product line&#10;• Customer satisfaction improvements&#10;• Market expansion&#10;• Environmental sustainability initiatives&#10;• Employee wellbeing programs&#10;• Strategic partnerships"
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "1px solid #e5e7eb",
                      borderRadius: "0.5rem",
                      fontSize: "0.875rem",
                      minHeight: "120px",
                      resize: "vertical",
                      background: claudeConfig.enabled ? "#f0fdf4" : "#f9fafb",
                    }}
                    disabled={!claudeConfig.enabled}
                  />
                  <p style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.25rem" }}>
                    Describe scenarios, achievements, or developments that should be considered positive for your brand
                  </p>
                  
                  {/* Positive Suggestions Dropdown */}
                  {showPositiveSuggestions && (
                    <div style={{
                      position: "absolute",
                      top: "2rem",
                      right: "0",
                      width: "300px",
                      maxHeight: "300px",
                      overflowY: "auto",
                      background: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "0.5rem",
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                      zIndex: 10,
                      padding: "0.5rem",
                    }}>
                      <p style={{ fontSize: "0.75rem", fontWeight: "500", color: "#6b7280", marginBottom: "0.5rem" }}>
                        Click to add suggestions:
                      </p>
                      {sentimentSuggestions.positive.map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => addSentimentConcept('positive', suggestion)}
                          style={{
                            width: "100%",
                            textAlign: "left",
                            padding: "0.5rem",
                            fontSize: "0.75rem",
                            color: "#374151",
                            background: "transparent",
                            border: "none",
                            borderRadius: "0.375rem",
                            cursor: "pointer",
                            transition: "background 0.2s",
                          }}
                          onMouseEnter={(e) => e.target.style.background = "#f3f4f6"}
                          onMouseLeave={(e) => e.target.style.background = "transparent"}
                        >
                          + {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Negative Concepts */}
                <div style={{ position: "relative" }}>
                  <label style={{ fontSize: "0.875rem", fontWeight: "500", color: "#1f2937", display: "block", marginBottom: "0.5rem" }}>
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <TrendingDown style={{ width: "1rem", height: "1rem", color: "#ef4444" }} />
                        Negative Concepts & Ideas
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowNegativeSuggestions(!showNegativeSuggestions)}
                        style={{
                          padding: "0.25rem 0.5rem",
                          fontSize: "0.75rem",
                          background: "#e9d5ff",
                          border: "1px solid #c084fc",
                          borderRadius: "0.375rem",
                          color: "#7c3aed",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.25rem",
                        }}
                      >
                        <Lightbulb style={{ width: "0.75rem", height: "0.75rem" }} />
                        Suggestions
                      </button>
                    </span>
                  </label>
                  <textarea
                    value={claudeConfig.sentimentContext?.negativeScenarios || ""}
                    onChange={(e) => setClaudeConfig({ 
                      ...claudeConfig, 
                      sentimentContext: { 
                        ...claudeConfig.sentimentContext, 
                        negativeScenarios: e.target.value 
                      } 
                    })}
                    placeholder="Examples:&#10;• Data security concerns&#10;• Customer complaints about service&#10;• Product quality issues&#10;• Layoffs or restructuring&#10;• Regulatory violations&#10;• Competitive disadvantages"
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "1px solid #e5e7eb",
                      borderRadius: "0.5rem",
                      fontSize: "0.875rem",
                      minHeight: "120px",
                      resize: "vertical",
                      background: claudeConfig.enabled ? "#fef2f2" : "#f9fafb",
                    }}
                    disabled={!claudeConfig.enabled}
                  />
                  <p style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.25rem" }}>
                    Describe scenarios, issues, or developments that should be considered negative for your brand
                  </p>
                  
                  {/* Negative Suggestions Dropdown */}
                  {showNegativeSuggestions && (
                    <div style={{
                      position: "absolute",
                      top: "2rem",
                      right: "0",
                      width: "300px",
                      maxHeight: "300px",
                      overflowY: "auto",
                      background: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "0.5rem",
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                      zIndex: 10,
                      padding: "0.5rem",
                    }}>
                      <p style={{ fontSize: "0.75rem", fontWeight: "500", color: "#6b7280", marginBottom: "0.5rem" }}>
                        Click to add suggestions:
                      </p>
                      {sentimentSuggestions.negative.map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => addSentimentConcept('negative', suggestion)}
                          style={{
                            width: "100%",
                            textAlign: "left",
                            padding: "0.5rem",
                            fontSize: "0.75rem",
                            color: "#374151",
                            background: "transparent",
                            border: "none",
                            borderRadius: "0.375rem",
                            cursor: "pointer",
                            transition: "background 0.2s",
                          }}
                          onMouseEnter={(e) => e.target.style.background = "#f3f4f6"}
                          onMouseLeave={(e) => e.target.style.background = "transparent"}
                        >
                          + {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Critical Concerns */}
                <div style={{ position: "relative" }}>
                  <label style={{ fontSize: "0.875rem", fontWeight: "500", color: "#1f2937", display: "block", marginBottom: "0.5rem" }}>
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <AlertTriangle style={{ width: "1rem", height: "1rem", color: "#f59e0b" }} />
                        Critical Concerns (Crisis Indicators)
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowCriticalSuggestions(!showCriticalSuggestions)}
                        style={{
                          padding: "0.25rem 0.5rem",
                          fontSize: "0.75rem",
                          background: "#e9d5ff",
                          border: "1px solid #c084fc",
                          borderRadius: "0.375rem",
                          color: "#7c3aed",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.25rem",
                        }}
                      >
                        <Lightbulb style={{ width: "0.75rem", height: "0.75rem" }} />
                        Suggestions
                      </button>
                    </span>
                  </label>
                  <textarea
                    value={claudeConfig.sentimentContext?.criticalConcerns || ""}
                    onChange={(e) => setClaudeConfig({ 
                      ...claudeConfig, 
                      sentimentContext: { 
                        ...claudeConfig.sentimentContext, 
                        criticalConcerns: e.target.value 
                      } 
                    })}
                    placeholder="Examples:&#10;• Major data breach&#10;• Executive misconduct&#10;• Product recall&#10;• Legal action or lawsuits&#10;• Major accident or safety issue&#10;• Significant financial losses"
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "1px solid #e5e7eb",
                      borderRadius: "0.5rem",
                      fontSize: "0.875rem",
                      minHeight: "100px",
                      resize: "vertical",
                      background: claudeConfig.enabled ? "#fef3c7" : "#f9fafb",
                    }}
                    disabled={!claudeConfig.enabled}
                  />
                  <p style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.25rem" }}>
                    Define crisis-level issues that require immediate attention
                  </p>
                  
                  {/* Critical Suggestions Dropdown */}
                  {showCriticalSuggestions && (
                    <div style={{
                      position: "absolute",
                      top: "2rem",
                      right: "0",
                      width: "300px",
                      maxHeight: "300px",
                      overflowY: "auto",
                      background: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "0.5rem",
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                      zIndex: 10,
                      padding: "0.5rem",
                    }}>
                      <p style={{ fontSize: "0.75rem", fontWeight: "500", color: "#6b7280", marginBottom: "0.5rem" }}>
                        Click to add suggestions:
                      </p>
                      {sentimentSuggestions.critical.map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => addSentimentConcept('critical', suggestion)}
                          style={{
                            width: "100%",
                            textAlign: "left",
                            padding: "0.5rem",
                            fontSize: "0.75rem",
                            color: "#374151",
                            background: "transparent",
                            border: "none",
                            borderRadius: "0.375rem",
                            cursor: "pointer",
                            transition: "background 0.2s",
                          }}
                          onMouseEnter={(e) => e.target.style.background = "#f3f4f6"}
                          onMouseLeave={(e) => e.target.style.background = "transparent"}
                        >
                          + {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Brand Context */}
                <div>
                  <label style={{ fontSize: "0.875rem", fontWeight: "500", color: "#1f2937", display: "block", marginBottom: "0.5rem" }}>
                    Brand & Industry Context
                  </label>
                  <textarea
                    value={claudeConfig.brandContext?.customContext || ""}
                    onChange={(e) => setClaudeConfig({ 
                      ...claudeConfig, 
                      brandContext: { 
                        ...claudeConfig.brandContext, 
                        customContext: e.target.value 
                      } 
                    })}
                    placeholder="Provide context about your brand, industry, and what matters most to your reputation. This helps Claude understand the nuances of your situation."
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "1px solid #e5e7eb",
                      borderRadius: "0.5rem",
                      fontSize: "0.875rem",
                      minHeight: "80px",
                      resize: "vertical",
                    }}
                    disabled={!claudeConfig.enabled}
                  />
                </div>
              </div>
            </div>

            {/* Test Configuration */}
            <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "1.5rem", marginBottom: "2rem" }}>
              <h3 style={{ ...styles.text.subheading, marginBottom: "1rem" }}>Test Configuration</h3>
              
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ fontSize: "0.875rem", fontWeight: "500", color: "#1f2937", display: "block", marginBottom: "0.5rem" }}>
                  Test Text
                </label>
                <textarea
                  id="testText"
                  placeholder="Enter a sample text to test sentiment analysis..."
                  defaultValue="Our customer support team received praise for quickly resolving a data security concern."
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #e5e7eb",
                    borderRadius: "0.5rem",
                    fontSize: "0.875rem",
                    minHeight: "80px",
                  }}
                  disabled={!claudeConfig.enabled}
                />
              </div>

              <div style={{ display: "flex", gap: "1rem" }}>
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch('http://localhost:5001/api/monitoring/test-claude', {
                        headers: {
                          'Authorization': `Bearer ${localStorage.getItem('token')}`
                        }
                      });
                      const data = await response.json();
                      console.log('Claude test result:', data);
                      alert(`Claude Test: ${data.success ? 'SUCCESS' : 'FAILED'}\nKey Exists: ${data.keyExists}\nDetails: ${data.details || 'Working properly'}`);
                    } catch (error) {
                      console.error('Test failed:', error);
                      alert('Failed to test Claude connection');
                    }
                  }}
                  style={{
                    ...styles.button.secondary,
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                  disabled={!claudeConfig.enabled}
                >
                  <Zap style={{ width: "1rem", height: "1rem" }} />
                  Test Claude Connection
                </button>

                <button
                onClick={async () => {
                  const testText = document.getElementById('testText').value;
                  if (!testText) {
                    alert('Please enter some test text');
                    return;
                  }
                  
                  try {
                    console.log('Testing sentiment analysis with context...');
                    const analysis = await analyzeWithClaude(testText, 'test');
                    console.log('Test analysis result:', analysis);
                    alert(`Sentiment Analysis Result:
Sentiment: ${analysis.sentiment}
Score: ${analysis.sentiment_score}
Confidence: ${analysis.confidence}
Summary: ${analysis.summary}
Rationale: ${analysis.rationale}`);
                  } catch (error) {
                    console.error('Test analysis failed:', error);
                    alert('Failed to analyze sentiment. Check console for details.');
                  }
                }}
                style={{
                  ...styles.button.primary,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginLeft: "1rem",
                }}
                disabled={!claudeConfig.enabled}
              >
                <Brain style={{ width: "1rem", height: "1rem" }} />
                Test Sentiment Analysis
              </button>
              </div>
            </div>

            {/* Save Button */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={handleSaveConfig}
                style={styles.button.primary}
                disabled={savingConfig}
              >
                {savingConfig ? "Saving..." : "Save AI Configuration"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AISentimentMonitor;
