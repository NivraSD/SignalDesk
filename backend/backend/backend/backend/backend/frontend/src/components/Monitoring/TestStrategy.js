// Test strategy for debugging
export const testStrategy = {
  profile: {
    company: "Apple",
    industry: "Technology",
    businessModel: "Consumer electronics and software",
    keyCompetitors: ["Samsung", "Google", "Microsoft"],
    keyRisks: ["privacy concerns", "antitrust", "supply chain"],
    opportunities: ["AI integration", "services growth", "emerging markets"]
  },
  strategy: {
    keywords: ["Apple", "iPhone", "iPad", "Mac"],
    sources: {
      rss: [
        "https://techcrunch.com/feed/",
        "https://www.theverge.com/rss/index.xml"
      ],
      categories: ["technology", "business"]
    },
    alertThresholds: {
      sentiment: "negative",
      volume: 10,
      urgency: "high"
    },
    reviewFrequency: "Daily"
  },
  suggestions: [
    {
      type: "keywords",
      title: "Primary Keywords",
      items: ["Apple", "iPhone", "iPad", "Mac"]
    }
  ]
};