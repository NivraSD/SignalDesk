const campaignTemplates = {
  // LAUNCH CAMPAIGNS
  "product-launch-b2b": {
    name: "B2B Product Launch",
    duration: "90 days",
    phases: [
      "Pre-launch Research",
      "Beta/Early Access",
      "Launch Week",
      "Post-launch Nurture",
    ],
    keyActivities: [
      "Analyst briefings",
      "Partner enablement",
      "Case study development",
      "Webinar series",
      "Media outreach",
      "Sales enablement",
    ],
    channels: [
      "Industry media",
      "LinkedIn",
      "Email",
      "Partner channels",
      "Webinars",
    ],
    metrics: [
      "Qualified leads",
      "Demo requests",
      "Media mentions",
      "Analyst coverage",
    ],
    budget_allocation: {
      "Content Creation": 0.25,
      "Media Relations": 0.2,
      "Paid Promotion": 0.3,
      "Events/Webinars": 0.15,
      "Tools & Software": 0.1,
    },
  },

  "product-launch-consumer": {
    name: "Consumer Product Launch",
    duration: "60 days",
    phases: ["Teaser/Hype", "Reveal", "Launch", "Sustain"],
    keyActivities: [
      "Influencer seeding",
      "Media exclusives",
      "Launch event",
      "User-generated content campaign",
      "Retail partner activation",
    ],
    channels: [
      "Social media",
      "Consumer press",
      "Retail partners",
      "Influencers",
    ],
    metrics: [
      "Social engagement",
      "Pre-orders",
      "Media reach",
      "Sentiment score",
    ],
    budget_allocation: {
      "Influencer Partnerships": 0.35,
      "Creative Production": 0.25,
      "Media Relations": 0.15,
      "Paid Social": 0.2,
      Measurement: 0.05,
    },
  },

  // Add all 25+ templates here...
  // (Including crisis-response, thought-leadership, funding-announcement, etc.)
};

module.exports = campaignTemplates;
