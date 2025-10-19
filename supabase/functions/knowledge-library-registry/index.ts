// Knowledge Library Registry - COMPREHENSIVE RESEARCH DATABASE
// Structured for research agents supporting CASCADE, MIRROR, CHORUS, and other advanced PR strategies
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

// TIER 1 KNOWLEDGE - Core foundational research always included
const TIER1_KNOWLEDGE = {
  foundational_psychology: [
    {
      title: 'Influence: The Psychology of Persuasion',
      author: 'Robert Cialdini',
      type: 'book',
      url: 'https://www.influenceatwork.com/',
      priority: 'critical',
      tags: ['persuasion', 'social_proof', 'authority', 'reciprocity'],
      application: ['CASCADE', 'CHORUS', 'general_strategy'],
      key_concepts: [
        'Six principles of influence',
        'Social proof mechanics',
        'Authority establishment',
        'Commitment and consistency',
        'Scarcity principle'
      ]
    },
    {
      title: 'Pre-Suasion: A Revolutionary Way to Influence and Persuade',
      author: 'Robert Cialdini',
      type: 'book',
      url: 'https://www.influenceatwork.com/pre-suasion/',
      priority: 'critical',
      tags: ['pre-suasion', 'timing', 'attention', 'framing'],
      application: ['CASCADE', 'timing_optimization'],
      key_concepts: [
        'Privileged moments',
        'Attention channeling',
        'Pre-suasive priming',
        'Unity principle'
      ]
    },
    {
      title: 'Thinking, Fast and Slow',
      author: 'Daniel Kahneman',
      type: 'book',
      url: 'https://scholar.google.com/citations?user=ImhakoAAAAAJ',
      priority: 'critical',
      tags: ['cognitive_bias', 'decision_making', 'system_1_2'],
      application: ['all_patterns', 'message_design'],
      key_concepts: [
        'System 1 and System 2 thinking',
        'Cognitive biases',
        'Prospect theory',
        'Anchoring effects',
        'Loss aversion'
      ]
    },
    {
      title: 'Nudge: Improving Decisions About Health, Wealth, and Happiness',
      author: 'Richard Thaler, Cass Sunstein',
      type: 'book',
      url: 'https://www.nudgetheory.com/',
      priority: 'critical',
      tags: ['choice_architecture', 'behavioral_economics', 'defaults'],
      application: ['CASCADE', 'MIRROR', 'strategy_design'],
      key_concepts: [
        'Choice architecture',
        'Libertarian paternalism',
        'Default effects',
        'Status quo bias'
      ]
    },
    {
      title: 'Contagious: Why Things Catch On',
      author: 'Jonah Berger',
      type: 'book',
      url: 'https://jonahberger.com/books/contagious/',
      priority: 'critical',
      tags: ['virality', 'word_of_mouth', 'social_currency'],
      application: ['CASCADE', 'viral_campaigns'],
      key_concepts: [
        'STEPPS framework',
        'Social currency',
        'Triggers',
        'Emotion',
        'Public visibility',
        'Practical value',
        'Stories'
      ]
    }
  ],

  network_science: [
    {
      title: 'Everything Is Obvious: How Common Sense Fails Us',
      author: 'Duncan Watts',
      type: 'book',
      url: 'https://www.penguinrandomhouse.com/books/202662/everything-is-obvious-by-duncan-j-watts/',
      priority: 'critical',
      tags: ['networks', 'influence', 'small_worlds', 'unpredictability'],
      application: ['CASCADE', 'CHORUS', 'influence_mapping'],
      key_concepts: [
        'Small world networks',
        'Influencer paradox',
        'Unpredictability of viral content',
        'Six degrees of separation',
        'Common sense failures'
      ]
    },
    {
      title: 'How Behavior Spreads: The Science of Complex Contagions',
      author: 'Damon Centola',
      type: 'book',
      url: 'https://press.princeton.edu/books/hardcover/9780691175317/how-behavior-spreads',
      priority: 'critical',
      tags: ['complex_contagion', 'network_effects', 'tipping_point'],
      application: ['CASCADE', 'grassroots', 'movement_building'],
      key_concepts: [
        'Complex vs simple contagions',
        '25% tipping point for social change',
        'Wide bridges vs long bridges',
        'Network topology effects',
        'Clustered networks'
      ]
    },
    {
      title: 'Connected: The Surprising Power of Our Social Networks',
      author: 'Nicholas Christakis, James Fowler',
      type: 'book',
      url: 'https://www.connectedthebook.com/',
      priority: 'high',
      tags: ['social_networks', 'three_degrees', 'influence_spread'],
      application: ['CHORUS', 'CASCADE', 'network_mapping'],
      key_concepts: [
        'Three degrees of influence',
        'Social contagion',
        'Network structure',
        'Influence propagation'
      ]
    },
    {
      title: 'Social Physics: How Good Ideas Spread',
      author: 'Alex Pentland',
      type: 'book',
      url: 'https://www.penguinrandomhouse.com/books/314230/social-physics-by-alex-pentland/',
      priority: 'high',
      tags: ['data_science', 'behavioral_patterns', 'idea_flow'],
      application: ['CASCADE', 'data_analysis', 'prediction'],
      key_concepts: [
        'Idea flow patterns',
        'Engagement patterns',
        'Exploration vs exploitation',
        'Social learning'
      ]
    }
  ],

  trust_credibility: [
    {
      title: 'Edelman Trust Barometer',
      author: 'Edelman',
      type: 'annual_report',
      url: 'https://www.edelman.com/trust-barometer',
      priority: 'critical',
      tags: ['trust', 'credibility', 'institutions', 'benchmarks'],
      application: ['all_patterns', 'strategy_foundation'],
      update_frequency: 'annual',
      key_concepts: [
        'Trust in institutions',
        'Trust in media',
        'Trust in business',
        'Trust trends by demographic',
        'Global trust metrics'
      ]
    },
    {
      title: 'Source Credibility and Persuasion',
      author: 'Hovland, Janis, Kelley',
      type: 'academic_paper',
      url: 'https://psycnet.apa.org/record/1954-06257-000',
      priority: 'critical',
      tags: ['source_credibility', 'expertise', 'trustworthiness'],
      application: ['MIRROR', 'CASCADE', 'spokesperson_selection'],
      key_concepts: [
        'Expertise dimension',
        'Trustworthiness dimension',
        'Source attractiveness',
        'Sleeper effect'
      ]
    }
  ],

  framing_narrative: [
    {
      title: "Don't Think of an Elephant: Know Your Values and Frame the Debate",
      author: 'George Lakoff',
      type: 'book',
      url: 'https://georgelakoff.com/',
      priority: 'critical',
      tags: ['framing', 'metaphor', 'political_communication', 'values'],
      application: ['CASCADE', 'MIRROR', 'message_design'],
      key_concepts: [
        'Conceptual metaphors',
        'Frame semantics',
        'Strict father vs nurturant parent',
        'Reframing techniques',
        'Values-based messaging'
      ]
    },
    {
      title: 'Framing Theory',
      author: 'Robert Entman',
      type: 'academic_paper',
      url: 'https://academic.oup.com/joc/article-abstract/43/4/51/4160153',
      priority: 'critical',
      tags: ['framing', 'media_effects', 'problem_definition'],
      application: ['CASCADE', 'MIRROR', 'crisis_framing'],
      key_concepts: [
        'Problem definition',
        'Causal interpretation',
        'Moral evaluation',
        'Treatment recommendation',
        'Cascade activation model'
      ]
    },
    {
      title: 'Narrative Economics: How Stories Go Viral and Drive Major Economic Events',
      author: 'Robert Shiller',
      type: 'book',
      url: 'https://press.princeton.edu/books/hardcover/9780691182292/narrative-economics',
      priority: 'high',
      tags: ['narrative', 'economics', 'viral_stories', 'economic_behavior'],
      application: ['CASCADE', 'narrative_design'],
      key_concepts: [
        'Economic narratives',
        'Narrative contagion',
        'Historical narrative patterns',
        'Story-driven decision making'
      ]
    }
  ],

  behavioral_economics: [
    {
      title: 'Predictably Irrational',
      author: 'Dan Ariely',
      type: 'book',
      url: 'https://danariely.com/books/',
      priority: 'high',
      tags: ['behavioral_economics', 'decision_making', 'irrationality'],
      application: ['CASCADE', 'audience_psychology'],
      key_concepts: [
        'Relativity principle',
        'Anchoring effects',
        'Free as a price',
        'Social norms vs market norms',
        'Ownership bias'
      ]
    },
    {
      title: 'Misbehaving: The Making of Behavioral Economics',
      author: 'Richard Thaler',
      type: 'book',
      url: 'https://www.penguinrandomhouse.com/books/317372/misbehaving-by-richard-h-thaler/',
      priority: 'high',
      tags: ['behavioral_economics', 'mental_accounting', 'endowment_effect'],
      application: ['CASCADE', 'MIRROR', 'strategy_design'],
      key_concepts: [
        'Mental accounting',
        'Endowment effect',
        'Status quo bias',
        'Libertarian paternalism'
      ]
    }
  ]
};

// INDUSTRY INTELLIGENCE - Consultancy reports, benchmarks, best practices
const INDUSTRY_INTELLIGENCE = {
  pr_communications: [
    {
      title: 'PRSA Annual Industry Report',
      author: 'Public Relations Society of America',
      type: 'annual_report',
      url: 'https://www.prsa.org/intelligence',
      priority: 'critical',
      tags: ['industry_benchmarks', 'pr_trends', 'best_practices'],
      application: ['all_patterns', 'industry_intelligence'],
      update_frequency: 'annual'
    },
    {
      title: 'Cision State of the Media Report',
      author: 'Cision',
      type: 'annual_report',
      url: 'https://www.cision.com/resources/white-papers/state-of-the-media/',
      priority: 'critical',
      tags: ['journalist_behavior', 'media_relations', 'pitch_effectiveness'],
      application: ['CASCADE', 'media_strategy'],
      update_frequency: 'annual',
      key_concepts: [
        'Journalist preferences',
        'Pitch response rates',
        'Media consumption patterns',
        'Press release effectiveness'
      ]
    },
    {
      title: 'Muck Rack State of Journalism',
      author: 'Muck Rack',
      type: 'annual_report',
      url: 'https://muckrack.com/state-of-journalism',
      priority: 'critical',
      tags: ['journalism', 'media_relations', 'journalist_surveys'],
      application: ['CASCADE', 'media_targeting'],
      update_frequency: 'annual'
    },
    {
      title: 'Holmes Report Global PR Rankings',
      author: 'PRovoke Media',
      type: 'annual_report',
      url: 'https://www.provokemedia.com/rankings',
      priority: 'high',
      tags: ['agency_rankings', 'competitive_intelligence', 'case_studies'],
      application: ['competitive_analysis', 'best_practices'],
      update_frequency: 'annual'
    }
  ],

  consultancy_insights: [
    {
      title: 'McKinsey Quarterly - Communications & Marketing',
      author: 'McKinsey & Company',
      type: 'journal',
      url: 'https://www.mckinsey.com/featured-insights',
      priority: 'critical',
      tags: ['strategy', 'marketing', 'digital_transformation'],
      application: ['all_patterns', 'strategic_thinking'],
      update_frequency: 'quarterly'
    },
    {
      title: 'Deloitte Digital Trends',
      author: 'Deloitte',
      type: 'annual_report',
      url: 'https://www2.deloitte.com/us/en/insights/focus/digital-maturity.html',
      priority: 'high',
      tags: ['digital_trends', 'technology', 'transformation'],
      application: ['forward_intelligence', 'tech_strategy'],
      update_frequency: 'annual'
    },
    {
      title: 'BCG Marketing & Communications Insights',
      author: 'Boston Consulting Group',
      type: 'research',
      url: 'https://www.bcg.com/capabilities/marketing-sales',
      priority: 'high',
      tags: ['marketing_strategy', 'customer_insights', 'analytics'],
      application: ['CASCADE', 'strategic_planning'],
      update_frequency: 'ongoing'
    },
    {
      title: 'Accenture Interactive Research',
      author: 'Accenture',
      type: 'research',
      url: 'https://www.accenture.com/us-en/insights/song-index',
      priority: 'high',
      tags: ['digital_marketing', 'customer_experience', 'personalization'],
      application: ['CASCADE', 'CHORUS', 'digital_strategy'],
      update_frequency: 'ongoing'
    },
    {
      title: 'Gartner Hype Cycle for Marketing',
      author: 'Gartner',
      type: 'annual_report',
      url: 'https://www.gartner.com/en/marketing/research',
      priority: 'critical',
      tags: ['technology_trends', 'martech', 'innovation'],
      application: ['forward_intelligence', 'technology_adoption'],
      update_frequency: 'annual'
    },
    {
      title: 'Forrester Marketing Research',
      author: 'Forrester',
      type: 'research',
      url: 'https://www.forrester.com/research/marketing-strategy-insights/',
      priority: 'high',
      tags: ['customer_insights', 'marketing_technology', 'trends'],
      application: ['CASCADE', 'strategic_planning'],
      update_frequency: 'ongoing'
    }
  ],

  media_consumption: [
    {
      title: 'Pew Research Center - News Consumption',
      author: 'Pew Research Center',
      type: 'research',
      url: 'https://www.pewresearch.org/journalism/',
      priority: 'critical',
      tags: ['news_consumption', 'media_trust', 'demographics'],
      application: ['all_patterns', 'audience_understanding'],
      update_frequency: 'ongoing',
      key_concepts: [
        'Platform preferences by age',
        'News source trust',
        'Social media news consumption',
        'Generational differences'
      ]
    },
    {
      title: 'Reuters Institute Digital News Report',
      author: 'Reuters Institute',
      type: 'annual_report',
      url: 'https://reutersinstitute.politics.ox.ac.uk/digital-news-report',
      priority: 'critical',
      tags: ['digital_news', 'global_trends', 'trust_in_news'],
      application: ['CASCADE', 'MIRROR', 'media_strategy'],
      update_frequency: 'annual',
      key_concepts: [
        'News avoidance patterns',
        'Platform preferences',
        'Paid news consumption',
        'Trust metrics by country'
      ]
    }
  ]
};

// PATTERN-SPECIFIC KNOWLEDGE - Organized by strategic pattern
const PATTERN_KNOWLEDGE = {
  CASCADE: {
    academic_foundations: [
      {
        title: 'Information Cascades and Social Conventions',
        author: 'Bikhchandani, Hirshleifer, Welch',
        type: 'academic_paper',
        url: 'https://www.anderson.ucla.edu/faculty-and-research/anderson-review/cascades',
        priority: 'critical',
        tags: ['information_cascades', 'herd_behavior', 'sequential_decision_making'],
        application: ['CASCADE', 'timing_strategy'],
        key_concepts: [
          'Sequential decision making',
          'Observational learning',
          'Cascade fragility',
          'Information revelation'
        ]
      },
      {
        title: 'Threshold Models of Collective Behavior',
        author: 'Mark Granovetter',
        type: 'academic_paper',
        url: 'https://www.jstor.org/stable/2778111',
        priority: 'critical',
        tags: ['threshold_models', 'collective_behavior', 'tipping_points'],
        application: ['CASCADE', 'movement_building'],
        key_concepts: [
          'Individual thresholds',
          'Collective action',
          'Tipping points',
          'Heterogeneous thresholds'
        ]
      },
      {
        title: 'The Tipping Point: How Little Things Can Make a Big Difference',
        author: 'Malcolm Gladwell',
        type: 'book',
        url: 'https://www.gladwellbooks.com/titles/malcolm-gladwell/the-tipping-point/9780759574731/',
        priority: 'high',
        tags: ['tipping_point', 'viral', 'connectors', 'mavens'],
        application: ['CASCADE', 'influencer_strategy'],
        key_concepts: [
          'Law of the few',
          'Stickiness factor',
          'Power of context',
          'Connectors, mavens, salesmen'
        ]
      },
      {
        title: 'The Strength of Weak Ties',
        author: 'Mark Granovetter',
        type: 'academic_paper',
        url: 'https://www.jstor.org/stable/2776392',
        priority: 'critical',
        tags: ['weak_ties', 'network_theory', 'information_diffusion'],
        application: ['CASCADE', 'CHORUS', 'network_strategy'],
        key_concepts: [
          'Weak tie theory',
          'Bridge connections',
          'Information flow',
          'Job search networks'
        ]
      }
    ],

    case_studies: [
      {
        title: 'ALS Ice Bucket Challenge Analysis',
        type: 'case_study',
        url: 'https://journals.sagepub.com/doi/full/10.1177/2056305115610350',
        priority: 'critical',
        tags: ['viral_campaign', 'grassroots', 'social_media', 'nonprofit'],
        application: ['CASCADE', 'viral_mechanics'],
        key_concepts: [
          'Challenge mechanics',
          'Celebrity amplification',
          'Nomination chain',
          'Video format',
          'Simplified participation'
        ],
        metrics: {
          reach: '17M participants',
          raised: '$115M',
          duration: '8 weeks',
          platform: 'Facebook primary'
        }
      },
      {
        title: 'Old Spice "The Man Your Man Could Smell Like" Campaign',
        type: 'case_study',
        url: 'https://www.dandad.org/awards/professional/2011/writing-for-advertising/18922/responses/',
        priority: 'high',
        tags: ['viral_video', 'real_time_marketing', 'social_media'],
        application: ['CASCADE', 'CHORUS', 'content_strategy'],
        key_concepts: [
          'Absurdist humor',
          'Real-time response videos',
          'Influencer targeting',
          'Multi-platform distribution',
          'Sustained engagement'
        ],
        metrics: {
          views: '180M+',
          engagement: '800%+ increase',
          sales_lift: '107% increase',
          response_videos: '186 personalized'
        }
      },
      {
        title: 'Dove Real Beauty Campaign Evolution',
        type: 'case_study',
        url: 'https://www.unilever.com/brands/beauty-wellbeing/dove/our-vision/',
        priority: 'high',
        tags: ['long_term_campaign', 'social_movement', 'brand_purpose'],
        application: ['CASCADE', 'movement_building', 'purpose_driven'],
        key_concepts: [
          'Multi-year narrative arc',
          'Research foundation',
          'User-generated content',
          'Educational programs',
          'Social movement integration'
        ]
      },
      {
        title: '#MeToo Movement Emergence and Spread',
        type: 'case_study',
        url: 'https://www.pewresearch.org/journalism/2018/10/11/how-metoo-has-affected-media-coverage-of-sexual-assault/',
        priority: 'critical',
        tags: ['social_movement', 'grassroots', 'network_effects', 'culture_shift'],
        application: ['CASCADE', 'movement_mechanics'],
        key_concepts: [
          'Hashtag as unifying symbol',
          'Celebrity catalysts',
          'Personal story sharing',
          'Media amplification cycle',
          'Policy change outcomes'
        ]
      },
      {
        title: 'Apple Product Launch Orchestration',
        type: 'case_study',
        url: 'https://hbr.org/2012/05/how-apple-creates-demand',
        priority: 'high',
        tags: ['product_launch', 'secrecy', 'orchestration', 'cascade_timing'],
        application: ['CASCADE', 'launch_strategy'],
        key_concepts: [
          'Controlled information release',
          'Speculation generation',
          'Event choreography',
          'Post-launch amplification',
          'Retail experience design'
        ]
      }
    ],

    methodologies: [
      {
        title: 'Social Network Analysis for Communications Planning',
        type: 'methodology',
        url: 'https://www.orgnet.com/sna.html',
        priority: 'high',
        tags: ['network_analysis', 'influence_mapping', 'SNA'],
        application: ['CASCADE', 'CHORUS', 'influencer_identification'],
        tools: ['Gephi', 'NodeXL', 'Cytoscape', 'NetworkX'],
        key_concepts: [
          'Centrality measures',
          'Community detection',
          'Bridge identification',
          'Influence paths'
        ]
      },
      {
        title: 'Cascade Prediction Modeling',
        type: 'methodology',
        url: 'https://arxiv.org/abs/1809.01164',
        priority: 'high',
        tags: ['prediction', 'modeling', 'machine_learning'],
        application: ['CASCADE', 'planning'],
        key_concepts: [
          'Early cascade detection',
          'Growth prediction',
          'Feature engineering',
          'Model validation'
        ]
      }
    ],

    timing_research: [
      {
        title: 'Optimal Timing in Social Media',
        type: 'research',
        url: 'https://journals.sagepub.com/doi/10.1177/0022243718820936',
        priority: 'high',
        tags: ['timing', 'social_media', 'engagement'],
        application: ['CASCADE', 'CHORUS', 'timing_optimization'],
        key_concepts: [
          'Platform-specific patterns',
          'Audience activity cycles',
          'Content lifespan',
          'Momentum building'
        ]
      },
      {
        title: 'News Cycle and Attention Patterns',
        type: 'research',
        url: 'https://www.niemanlab.org/collection/attention-cycles/',
        priority: 'high',
        tags: ['news_cycle', 'attention', 'media_timing'],
        application: ['CASCADE', 'MIRROR', 'announcement_timing'],
        key_concepts: [
          'News shelf-life',
          'Attention windows',
          'Friday news dump',
          'Breaking into cycles'
        ]
      }
    ]
  },

  MIRROR: {
    academic_foundations: [
      {
        title: 'Crisis Communication Theory',
        author: 'W. Timothy Coombs',
        type: 'book',
        url: 'https://uk.sagepub.com/en-gb/eur/ongoing-crisis-communication/book237442',
        priority: 'critical',
        tags: ['crisis_communication', 'SCCT', 'reputation_management'],
        application: ['MIRROR', 'crisis_response'],
        key_concepts: [
          'Situational Crisis Communication Theory (SCCT)',
          'Crisis types taxonomy',
          'Response strategies',
          'Attribution theory',
          'Reputation repair'
        ]
      },
      {
        title: 'The Social Amplification of Risk Framework',
        author: 'Kasperson et al.',
        type: 'academic_paper',
        url: 'https://www.sciencedirect.com/science/article/abs/pii/0272494488900119',
        priority: 'critical',
        tags: ['risk_communication', 'amplification', 'media_effects'],
        application: ['MIRROR', 'risk_assessment'],
        key_concepts: [
          'Risk amplification stations',
          'Social and individual amplification',
          'Ripple effects',
          'Secondary impacts'
        ]
      },
      {
        title: 'Inoculation Theory',
        author: 'William McGuire',
        type: 'academic_theory',
        url: 'https://psycnet.apa.org/record/1962-08861-001',
        priority: 'critical',
        tags: ['inoculation', 'prebunking', 'resistance', 'persuasion'],
        application: ['MIRROR', 'crisis_prevention'],
        key_concepts: [
          'Threat and refutational preemption',
          'Resistance to persuasion',
          'Attitude strengthening',
          'Prebunking vs debunking'
        ]
      }
    ],

    case_studies: [
      {
        title: 'Johnson & Johnson Tylenol Crisis (1982)',
        type: 'case_study',
        url: 'https://www.jnj.com/our-heritage/tylenol-product-tampering-crisis',
        priority: 'critical',
        tags: ['crisis_response', 'product_recall', 'trust_restoration', 'gold_standard'],
        application: ['MIRROR', 'crisis_management'],
        key_concepts: [
          'Immediate product recall',
          'Public safety first',
          'Transparent communication',
          'Tamper-proof packaging innovation',
          'Trust restoration'
        ],
        outcomes: {
          response_time: 'Immediate',
          market_share_recovery: 'Full recovery within 1 year',
          reputation: 'Enhanced through response'
        }
      },
      {
        title: 'Toyota Recall Crisis (2009-2010)',
        type: 'case_study',
        url: 'https://hbr.org/2010/02/how-toyota-lost-its-way',
        priority: 'high',
        tags: ['crisis_response', 'automotive', 'recall', 'reputation_damage'],
        application: ['MIRROR', 'crisis_lessons'],
        key_concepts: [
          'Delayed response impact',
          'Cultural communication gaps',
          'Congressional testimony',
          'Recovery strategy',
          'Quality narrative restoration'
        ],
        outcomes: {
          initial_response: 'Delayed and defensive',
          reputation_impact: 'Significant damage',
          recovery_time: '2+ years',
          lessons: 'Speed and transparency critical'
        }
      },
      {
        title: 'United Airlines Passenger Removal Crisis (2017)',
        type: 'case_study',
        url: 'https://www.nytimes.com/2017/04/11/business/united-airline-passenger-doctor.html',
        priority: 'high',
        tags: ['social_media_crisis', 'video_crisis', 'response_failure'],
        application: ['MIRROR', 'social_media_crisis'],
        key_concepts: [
          'Video evidence impact',
          'Initial defensive response',
          'CEO statement evolution',
          'Policy changes',
          'Social media speed'
        ],
        outcomes: {
          stock_impact: '$1.4B market cap loss',
          response_evolution: 'Three statements in 24 hours',
          policy_changes: 'Comprehensive review',
          reputation: 'Long-term damage'
        }
      },
      {
        title: 'Boeing 737 MAX Crisis (2019-2020)',
        type: 'case_study',
        url: 'https://www.nytimes.com/2020/01/10/business/boeing-737-employees-messages.html',
        priority: 'critical',
        tags: ['safety_crisis', 'regulatory', 'trust_collapse', 'engineering'],
        application: ['MIRROR', 'complex_crisis'],
        key_concepts: [
          'Technical crisis communication',
          'Regulatory relationships',
          'Multi-stakeholder management',
          'Long-term recovery',
          'Culture change communication'
        ]
      },
      {
        title: 'Equifax Data Breach Response (2017)',
        type: 'case_study',
        url: 'https://www.ftc.gov/enforcement/refunds/equifax-data-breach-settlement',
        priority: 'high',
        tags: ['data_breach', 'cybersecurity_crisis', 'regulatory'],
        application: ['MIRROR', 'data_breach_response'],
        key_concepts: [
          'Delayed disclosure',
          'Executive stock sales scandal',
          'Consumer notification',
          'Regulatory coordination',
          'Settlement communications'
        ]
      }
    ],

    early_warning_systems: [
      {
        title: 'Social Listening for Crisis Detection',
        type: 'methodology',
        url: 'https://www.brandwatch.com/blog/crisis-detection/',
        priority: 'critical',
        tags: ['social_listening', 'monitoring', 'sentiment_analysis'],
        application: ['MIRROR', 'early_warning'],
        tools: ['Brandwatch', 'Sprinklr', 'Meltwater', 'Talkwalker'],
        key_concepts: [
          'Sentiment shift velocity',
          'Volume spike detection',
          'Influencer activity',
          'Topic clustering'
        ]
      },
      {
        title: 'Issue Lifecycle Prediction',
        type: 'research',
        url: 'https://instituteforcrisismanagement.org/',
        priority: 'high',
        tags: ['issue_management', 'lifecycle', 'prediction'],
        application: ['MIRROR', 'prevention'],
        key_concepts: [
          'Issue evolution stages',
          'Early warning signals',
          'Intervention windows',
          'Issue intensity prediction'
        ]
      }
    ],

    recovery_frameworks: [
      {
        title: 'Reputation Repair Strategies',
        type: 'framework',
        url: 'https://www.tandfonline.com/doi/abs/10.1207/s1532785xmep0101_4',
        priority: 'high',
        tags: ['reputation_repair', 'apology', 'strategies'],
        application: ['MIRROR', 'recovery'],
        strategies: [
          'Denial',
          'Evading responsibility',
          'Reducing offensiveness',
          'Corrective action',
          'Mortification (apology)'
        ]
      }
    ]
  },

  CHORUS: {
    academic_foundations: [
      {
        title: 'Astroturfing and Orchestrated Public Opinion',
        type: 'research',
        url: 'https://www.oxfordhandbooks.com/view/10.1093/oxfordhb/9780199560431.001.0001/oxfordhb-9780199560431-e-30',
        priority: 'high',
        tags: ['astroturfing', 'grassroots', 'authenticity', 'ethics'],
        application: ['CHORUS', 'ethical_boundaries'],
        key_concepts: [
          'Grassroots vs astroturf',
          'Detection methods',
          'Authenticity markers',
          'Ethical considerations'
        ]
      },
      {
        title: 'Bot Detection and Coordinated Behavior',
        type: 'research',
        url: 'https://osome.iuni.iu.edu/tools/botometer/',
        priority: 'critical',
        tags: ['bot_detection', 'coordinated_behavior', 'authenticity'],
        application: ['CHORUS', 'detection_avoidance'],
        tools: ['Botometer', 'BotSlayer', 'Hoaxy'],
        key_concepts: [
          'Bot detection algorithms',
          'Coordinated inauthentic behavior',
          'Network manipulation',
          'Platform detection systems'
        ]
      },
      {
        title: 'Computational Propaganda Research',
        author: 'Oxford Internet Institute',
        type: 'research',
        url: 'https://comprop.oii.ox.ac.uk/',
        priority: 'critical',
        tags: ['computational_propaganda', 'disinformation', 'manipulation'],
        application: ['CHORUS', 'ethical_boundaries', 'detection'],
        key_concepts: [
          'Automated accounts',
          'Algorithmic manipulation',
          'Platform vulnerabilities',
          'Counter-strategies'
        ]
      }
    ],

    case_studies: [
      {
        title: 'Genuine Influencer Campaigns Analysis',
        type: 'research',
        url: 'https://www.influencermarketinghub.com/influencer-marketing-benchmark-report/',
        priority: 'high',
        tags: ['influencer_marketing', 'authenticity', 'engagement'],
        application: ['CHORUS', 'influencer_strategy'],
        key_concepts: [
          'Micro vs macro influencers',
          'Engagement rates',
          'Authenticity markers',
          'Platform differences',
          'FTC disclosure requirements'
        ]
      },
      {
        title: 'Reddit AMAs as Engagement Model',
        type: 'case_study',
        url: 'https://www.reddit.com/r/IAmA/',
        priority: 'medium',
        tags: ['community_engagement', 'authentic_conversation', 'Reddit'],
        application: ['CHORUS', 'authentic_engagement'],
        key_concepts: [
          'Verification importance',
          'Authentic voice',
          'Community norms',
          'Transparency',
          'Value provision'
        ]
      }
    ],

    ethical_frameworks: [
      {
        title: 'PRSA Code of Ethics',
        type: 'ethical_code',
        url: 'https://www.prsa.org/about/prsa-code-of-ethics',
        priority: 'critical',
        tags: ['ethics', 'disclosure', 'transparency', 'standards'],
        application: ['CHORUS', 'all_patterns', 'ethical_guidance'],
        key_principles: [
          'Advocacy',
          'Honesty',
          'Expertise',
          'Independence',
          'Loyalty',
          'Fairness'
        ]
      },
      {
        title: 'FTC Disclosure Guidelines',
        type: 'regulation',
        url: 'https://www.ftc.gov/business-guidance/resources/disclosures-101-social-media-influencers',
        priority: 'critical',
        tags: ['disclosure', 'influencer_marketing', 'legal_requirements'],
        application: ['CHORUS', 'compliance'],
        key_requirements: [
          'Clear and conspicuous disclosure',
          'Material connection disclosure',
          'Endorsement guidelines',
          'Social media specific rules'
        ]
      }
    ]
  },

  TROJAN: {
    academic_foundations: [
      {
        title: 'Indirect Persuasion Techniques',
        type: 'research',
        url: 'https://journals.sagepub.com/doi/10.1177/0093650213510940',
        priority: 'high',
        tags: ['indirect_persuasion', 'narrative_transportation', 'subtle_influence'],
        application: ['TROJAN', 'indirect_messaging'],
        key_concepts: [
          'Transportation theory',
          'Narrative persuasion',
          'Counter-arguing reduction',
          'Subtle influence'
        ]
      },
      {
        title: 'Dual-Process Theory in Persuasion',
        type: 'academic_theory',
        url: 'https://www.communicationcache.com/uploads/1/0/8/8/10887248/the_elaboration_likelihood_model_of_persuasion.pdf',
        priority: 'critical',
        tags: ['ELM', 'persuasion', 'peripheral_route', 'central_route'],
        application: ['TROJAN', 'message_design'],
        key_concepts: [
          'Elaboration Likelihood Model',
          'Central route processing',
          'Peripheral route processing',
          'Message processing motivation'
        ]
      }
    ]
  }
};

// EMERGING RESEARCH - Latest trends and cutting-edge studies
const EMERGING_RESEARCH = {
  ai_communications: [
    {
      title: 'Large Language Models in Communications',
      type: 'emerging_research',
      url: 'https://arxiv.org/list/cs.CL/recent',
      priority: 'high',
      tags: ['AI', 'LLM', 'automation', 'content_generation'],
      application: ['all_patterns', 'automation'],
      monitoring: 'continuous',
      key_areas: [
        'AI-generated content detection',
        'Personalization at scale',
        'Synthetic media implications',
        'Trust in AI content'
      ]
    },
    {
      title: 'Deepfake Detection and Implications',
      type: 'emerging_research',
      url: 'https://www.media.mit.edu/projects/detect-fakes/overview/',
      priority: 'critical',
      tags: ['deepfakes', 'synthetic_media', 'trust', 'detection'],
      application: ['MIRROR', 'crisis_prevention'],
      key_areas: [
        'Detection technologies',
        'Authentication methods',
        'Public trust impact',
        'Regulatory approaches'
      ]
    }
  ],

  platform_evolution: [
    {
      title: 'Decentralized Social Media Research',
      type: 'emerging_research',
      url: 'https://bsky.app/',
      priority: 'medium',
      tags: ['decentralization', 'web3', 'platform_shift'],
      application: ['CHORUS', 'future_strategy'],
      key_areas: [
        'Mastodon and ActivityPub',
        'Bluesky AT Protocol',
        'User migration patterns',
        'Communications implications'
      ]
    }
  ]
};

// TOOLS AND METHODOLOGIES - Practical implementation resources
const TOOLS_METHODOLOGIES = {
  network_analysis: [
    {
      name: 'Gephi',
      type: 'tool',
      url: 'https://gephi.org/',
      priority: 'critical',
      tags: ['network_visualization', 'SNA', 'open_source'],
      application: ['CASCADE', 'CHORUS', 'influence_mapping'],
      use_cases: [
        'Influence network mapping',
        'Community detection',
        'Centrality analysis',
        'Network visualization'
      ]
    },
    {
      name: 'NodeXL',
      type: 'tool',
      url: 'https://www.smrfoundation.org/nodexl/',
      priority: 'high',
      tags: ['social_media_analysis', 'Twitter', 'network_analysis'],
      application: ['CASCADE', 'CHORUS', 'social_listening'],
      use_cases: [
        'Twitter network analysis',
        'Hashtag tracking',
        'Influencer identification',
        'Community mapping'
      ]
    }
  ],

  sentiment_analysis: [
    {
      name: 'VADER Sentiment Analysis',
      type: 'tool',
      url: 'https://github.com/cjhutto/vaderSentiment',
      priority: 'high',
      tags: ['sentiment_analysis', 'social_media', 'python'],
      application: ['MIRROR', 'monitoring'],
      use_cases: [
        'Social media sentiment',
        'Crisis detection',
        'Brand monitoring'
      ]
    }
  ],

  research_databases: [
    {
      name: 'Google Scholar',
      type: 'database',
      url: 'https://scholar.google.com/',
      priority: 'critical',
      tags: ['academic_search', 'research', 'citations'],
      application: ['all_patterns', 'research'],
      features: [
        'Academic paper search',
        'Citation tracking',
        'Alerts for new research',
        'Author profiles'
      ]
    },
    {
      name: 'SSRN (Social Science Research Network)',
      type: 'database',
      url: 'https://www.ssrn.com/',
      priority: 'critical',
      tags: ['preprints', 'social_science', 'early_research'],
      application: ['all_patterns', 'emerging_research'],
      features: [
        'Working papers',
        'Early research access',
        'Author networks',
        'Topic alerts'
      ]
    }
  ]
};

// Main handler function
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { pattern, research_area, priority_filter, tags } = await req.json();

    console.log(`📚 Knowledge Library: Querying research database`);
    console.log(`   Pattern: ${pattern || 'all'}`);
    console.log(`   Research Area: ${research_area || 'all'}`);
    console.log(`   Priority Filter: ${priority_filter || 'all'}`);

    // Build response structure
    const knowledge = {
      foundational: [],
      industry_intelligence: [],
      pattern_specific: [],
      emerging: [],
      tools: [],
      metadata: {}
    };

    // Always include Tier 1 foundational knowledge
    knowledge.foundational = [
      ...TIER1_KNOWLEDGE.foundational_psychology,
      ...TIER1_KNOWLEDGE.network_science,
      ...TIER1_KNOWLEDGE.trust_credibility,
      ...TIER1_KNOWLEDGE.framing_narrative,
      ...TIER1_KNOWLEDGE.behavioral_economics
    ];

    // Add industry intelligence
    knowledge.industry_intelligence = [
      ...INDUSTRY_INTELLIGENCE.pr_communications,
      ...INDUSTRY_INTELLIGENCE.consultancy_insights,
      ...INDUSTRY_INTELLIGENCE.media_consumption
    ];

    // Add pattern-specific knowledge if pattern is specified
    if (pattern && PATTERN_KNOWLEDGE[pattern]) {
      const patternData = PATTERN_KNOWLEDGE[pattern];
      knowledge.pattern_specific = [
        ...(patternData.academic_foundations || []),
        ...(patternData.case_studies || []),
        ...(patternData.methodologies || []),
        ...(patternData.timing_research || []),
        ...(patternData.early_warning_systems || []),
        ...(patternData.recovery_frameworks || []),
        ...(patternData.ethical_frameworks || [])
      ];
    }

    // Add emerging research
    knowledge.emerging = [
      ...EMERGING_RESEARCH.ai_communications,
      ...EMERGING_RESEARCH.platform_evolution
    ];

    // Add tools
    knowledge.tools = [
      ...TOOLS_METHODOLOGIES.network_analysis,
      ...TOOLS_METHODOLOGIES.sentiment_analysis,
      ...TOOLS_METHODOLOGIES.research_databases
    ];

    // Apply filters if specified
    if (priority_filter) {
      Object.keys(knowledge).forEach(category => {
        if (Array.isArray(knowledge[category])) {
          knowledge[category] = knowledge[category].filter(
            item => item.priority === priority_filter
          );
        }
      });
    }

    // Count total resources
    const totalResources = Object.values(knowledge).reduce(
      (sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0),
      0
    );

    // Build metadata
    knowledge.metadata = {
      total_resources: totalResources,
      patterns_available: Object.keys(PATTERN_KNOWLEDGE),
      research_areas: Object.keys(TIER1_KNOWLEDGE),
      last_updated: new Date().toISOString(),
      update_schedule: {
        tier1: 'Annual review',
        industry_intelligence: 'Quarterly',
        emerging_research: 'Monthly',
        case_studies: 'As published'
      }
    };

    console.log(`✅ Returning ${totalResources} knowledge resources`);
    console.log(`   Foundational: ${knowledge.foundational.length}`);
    console.log(`   Industry Intel: ${knowledge.industry_intelligence.length}`);
    console.log(`   Pattern-Specific: ${knowledge.pattern_specific.length}`);
    console.log(`   Emerging: ${knowledge.emerging.length}`);
    console.log(`   Tools: ${knowledge.tools.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        pattern: pattern || 'all',
        data: knowledge,
        metadata: knowledge.metadata
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Knowledge Library error:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        success: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
