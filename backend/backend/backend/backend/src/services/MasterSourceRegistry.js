/**
 * MASTER SOURCE REGISTRY
 * Central repository for ALL monitoring sources across 25 industries
 * Ensures 100% source utilization - NO WASTE
 */

class MasterSourceRegistry {
  constructor() {
    this.sources = {
      // TECHNOLOGY INDUSTRY
      technology: {
        rss: [
          { name: 'TechCrunch', url: 'https://techcrunch.com/feed/', priority: 'critical', category: 'tech_news' },
          { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', priority: 'critical', category: 'tech_news' },
          { name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index', priority: 'high', category: 'tech_news' },
          { name: 'Wired', url: 'https://www.wired.com/feed/rss', priority: 'high', category: 'tech_news' },
          { name: 'VentureBeat', url: 'https://feeds.feedburner.com/venturebeat/SZYF', priority: 'high', category: 'tech_news' },
          { name: 'Engadget', url: 'https://www.engadget.com/rss.xml', priority: 'medium', category: 'tech_news' },
          { name: 'Gizmodo', url: 'https://gizmodo.com/rss', priority: 'medium', category: 'tech_news' },
          { name: 'ZDNet', url: 'https://www.zdnet.com/news/rss.xml', priority: 'medium', category: 'enterprise_tech' },
          { name: 'InfoWorld', url: 'https://www.infoworld.com/index.rss', priority: 'medium', category: 'enterprise_tech' },
          { name: 'MIT Tech Review', url: 'https://www.technologyreview.com/feed/', priority: 'high', category: 'research' },
          { name: 'Hacker News', url: 'https://hnrss.org/frontpage', priority: 'high', category: 'developer' },
          { name: 'Product Hunt', url: 'https://www.producthunt.com/feed', priority: 'medium', category: 'startups' },
          { name: 'Slashdot', url: 'https://rss.slashdot.org/Slashdot/slashdotMain', priority: 'low', category: 'tech_news' },
          { name: 'Dev.to', url: 'https://dev.to/feed', priority: 'medium', category: 'developer' },
          { name: 'The Register', url: 'https://www.theregister.com/headlines.atom', priority: 'medium', category: 'tech_news' },
          { name: 'Cloud Computing News', url: 'https://cloudcomputing-news.net/feed/', priority: 'high', category: 'cloud' },
          { name: 'DataCenter Knowledge', url: 'https://www.datacenterknowledge.com/rss.xml', priority: 'medium', category: 'infrastructure' },
          { name: 'Network World', url: 'https://www.networkworld.com/index.rss', priority: 'medium', category: 'networking' },
          { name: 'SecurityWeek', url: 'https://www.securityweek.com/feed/', priority: 'high', category: 'security' },
          { name: 'Dark Reading', url: 'https://www.darkreading.com/rss.xml', priority: 'high', category: 'security' }
        ],
        google_news: [
          'artificial intelligence', 'machine learning', 'cloud computing', 'cybersecurity',
          'software development', 'blockchain', 'quantum computing', 'IoT', '5G technology',
          'autonomous vehicles', 'robotics', 'big data', 'edge computing', 'API economy'
        ],
        websites: [
          'https://techcrunch.com', 'https://theverge.com', 'https://arstechnica.com',
          'https://wired.com', 'https://venturebeat.com', 'https://thenextweb.com'
        ]
      },

      // FINANCE INDUSTRY
      finance: {
        rss: [
          { name: 'Financial Times', url: 'https://www.ft.com/rss/home', priority: 'critical', category: 'finance_news' },
          { name: 'Bloomberg', url: 'https://feeds.bloomberg.com/markets/news.rss', priority: 'critical', category: 'markets' },
          { name: 'Reuters Business', url: 'https://feeds.reuters.com/reuters/businessNews', priority: 'critical', category: 'business' },
          { name: 'WSJ Markets', url: 'https://feeds.wsj.com/wsj/xml/rss/3_7031.xml', priority: 'critical', category: 'markets' },
          { name: 'CNBC Top News', url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html', priority: 'high', category: 'business' },
          { name: 'MarketWatch', url: 'https://feeds.marketwatch.com/marketwatch/topstories/', priority: 'high', category: 'markets' },
          { name: 'Forbes', url: 'https://www.forbes.com/real-time/feed2/', priority: 'medium', category: 'business' },
          { name: 'Business Insider', url: 'https://www.businessinsider.com/rss', priority: 'medium', category: 'business' },
          { name: 'Barrons', url: 'https://www.barrons.com/xml/rss/3_7510.xml', priority: 'high', category: 'investing' },
          { name: 'Seeking Alpha', url: 'https://seekingalpha.com/feed.xml', priority: 'medium', category: 'investing' },
          { name: 'The Economist', url: 'https://www.economist.com/feeds/print-sections/77/business.xml', priority: 'high', category: 'analysis' },
          { name: 'Zero Hedge', url: 'https://feeds.feedburner.com/zerohedge/feed', priority: 'medium', category: 'alternative' },
          { name: 'Investopedia', url: 'https://www.investopedia.com/feedbuilder/feed/getfeed', priority: 'low', category: 'education' }
        ],
        google_news: [
          'stock market', 'cryptocurrency', 'federal reserve', 'interest rates',
          'inflation', 'recession', 'IPO', 'mergers acquisitions', 'private equity',
          'hedge funds', 'venture capital', 'fintech', 'banking crisis'
        ]
      },

      // HEALTHCARE INDUSTRY
      healthcare: {
        rss: [
          { name: 'Healthcare IT News', url: 'https://www.healthcareitnews.com/feed', priority: 'high', category: 'health_tech' },
          { name: 'Modern Healthcare', url: 'https://www.modernhealthcare.com/section/rss', priority: 'high', category: 'health_business' },
          { name: 'MedCity News', url: 'https://medcitynews.com/feed/', priority: 'high', category: 'health_innovation' },
          { name: 'FiercePharma', url: 'https://www.fiercepharma.com/rss/xml', priority: 'high', category: 'pharma' },
          { name: 'FierceBiotech', url: 'https://www.fiercebiotech.com/rss/xml', priority: 'high', category: 'biotech' },
          { name: 'STAT News', url: 'https://www.statnews.com/feed/', priority: 'critical', category: 'health_news' },
          { name: 'Medical News Today', url: 'https://www.medicalnewstoday.com/rss/news.xml', priority: 'medium', category: 'medical' },
          { name: 'Healthcare Finance', url: 'https://www.healthcarefinancenews.com/feed', priority: 'medium', category: 'health_finance' },
          { name: 'Becker Hospital Review', url: 'https://www.beckershospitalreview.com/rss/rss-home.xml', priority: 'high', category: 'hospitals' }
        ],
        google_news: [
          'FDA approval', 'clinical trials', 'drug development', 'medical devices',
          'telemedicine', 'health insurance', 'Medicare Medicaid', 'pandemic response',
          'vaccine development', 'gene therapy', 'precision medicine'
        ]
      },

      // ENERGY INDUSTRY
      energy: {
        rss: [
          { name: 'Oil Price', url: 'https://oilprice.com/rss/main', priority: 'critical', category: 'oil_gas' },
          { name: 'Energy Voice', url: 'https://www.energyvoice.com/feed/', priority: 'high', category: 'energy_news' },
          { name: 'Renewable Energy World', url: 'https://www.renewableenergyworld.com/feed/', priority: 'high', category: 'renewables' },
          { name: 'CleanTechnica', url: 'https://cleantechnica.com/feed/', priority: 'high', category: 'clean_energy' },
          { name: 'Greentech Media', url: 'https://www.greentechmedia.com/feeds/all', priority: 'high', category: 'green_tech' },
          { name: 'Power Engineering', url: 'https://www.power-eng.com/feed/', priority: 'medium', category: 'power' },
          { name: 'S&P Global Energy', url: 'https://www.spglobal.com/commodityinsights/en/rss-feed', priority: 'critical', category: 'commodities' }
        ],
        google_news: [
          'oil prices', 'natural gas', 'renewable energy', 'solar power', 'wind energy',
          'electric vehicles', 'battery technology', 'nuclear power', 'hydrogen fuel',
          'carbon capture', 'energy transition', 'climate change'
        ]
      },

      // RETAIL INDUSTRY
      retail: {
        rss: [
          { name: 'Retail Dive', url: 'https://www.retaildive.com/feeds/news/', priority: 'high', category: 'retail_news' },
          { name: 'Chain Store Age', url: 'https://chainstoreage.com/rss.xml', priority: 'medium', category: 'retail_chains' },
          { name: 'Retail Wire', url: 'https://www.retailwire.com/feed/', priority: 'medium', category: 'retail_analysis' },
          { name: 'National Retail Federation', url: 'https://nrf.com/rss.xml', priority: 'high', category: 'retail_trends' },
          { name: 'Fashion United', url: 'https://fashionunited.com/rss/news', priority: 'medium', category: 'fashion' },
          { name: 'Footwear News', url: 'https://footwearnews.com/feed/', priority: 'medium', category: 'footwear' },
          { name: 'Just Style', url: 'https://www.just-style.com/feed/', priority: 'medium', category: 'apparel' },
          { name: 'Glossy', url: 'https://www.glossy.co/feed/', priority: 'medium', category: 'luxury' }
        ],
        google_news: [
          'e-commerce', 'retail sales', 'supply chain', 'consumer spending',
          'holiday shopping', 'retail bankruptcy', 'Amazon', 'Walmart', 'Target',
          'direct to consumer', 'omnichannel retail'
        ]
      },

      // MANUFACTURING INDUSTRY
      manufacturing: {
        rss: [
          { name: 'Manufacturing.net', url: 'https://www.manufacturing.net/rss/all', priority: 'high', category: 'manufacturing' },
          { name: 'IndustryWeek', url: 'https://www.industryweek.com/rss.xml', priority: 'high', category: 'industrial' },
          { name: 'Assembly Magazine', url: 'https://www.assemblymag.com/rss/topic/2761-assembly-news', priority: 'medium', category: 'assembly' },
          { name: 'Automation World', url: 'https://www.automationworld.com/rss.xml', priority: 'high', category: 'automation' },
          { name: 'Plant Engineering', url: 'https://www.plantengineering.com/feed/', priority: 'medium', category: 'plant_ops' }
        ],
        google_news: [
          'industrial automation', 'smart manufacturing', 'supply chain disruption',
          'reshoring', 'factory automation', '3D printing', 'additive manufacturing',
          'Industry 4.0', 'robotics manufacturing'
        ]
      },

      // REAL ESTATE INDUSTRY
      real_estate: {
        rss: [
          { name: 'Real Estate News', url: 'https://therealdeal.com/feed/', priority: 'high', category: 'real_estate' },
          { name: 'CoStar', url: 'https://www.costar.com/News/RSS', priority: 'critical', category: 'commercial' },
          { name: 'Curbed', url: 'https://www.curbed.com/rss/index.xml', priority: 'medium', category: 'real_estate' },
          { name: 'HousingWire', url: 'https://www.housingwire.com/rss/', priority: 'high', category: 'housing' },
          { name: 'Commercial Observer', url: 'https://commercialobserver.com/feed/', priority: 'high', category: 'commercial' }
        ],
        google_news: [
          'housing market', 'mortgage rates', 'commercial real estate', 'REITs',
          'property development', 'real estate investment', 'housing crisis'
        ]
      },

      // TRANSPORTATION & LOGISTICS
      transportation: {
        rss: [
          { name: 'Transport Topics', url: 'https://www.ttnews.com/rss/headlines', priority: 'high', category: 'transport' },
          { name: 'FreightWaves', url: 'https://www.freightwaves.com/feed', priority: 'high', category: 'freight' },
          { name: 'FleetOwner', url: 'https://www.fleetowner.com/rss.xml', priority: 'medium', category: 'fleet' },
          { name: 'Logistics Management', url: 'https://www.logisticsmgmt.com/rss/', priority: 'high', category: 'logistics' },
          { name: 'Supply Chain Dive', url: 'https://www.supplychaindive.com/feeds/news/', priority: 'critical', category: 'supply_chain' }
        ],
        google_news: [
          'autonomous trucks', 'shipping crisis', 'port congestion', 'freight rates',
          'last mile delivery', 'electric vehicles commercial', 'drone delivery'
        ]
      },

      // MEDIA & ENTERTAINMENT
      media: {
        rss: [
          { name: 'Hollywood Reporter', url: 'https://www.hollywoodreporter.com/feed/', priority: 'high', category: 'entertainment' },
          { name: 'Variety', url: 'https://variety.com/feed/', priority: 'high', category: 'entertainment' },
          { name: 'Deadline', url: 'https://deadline.com/feed/', priority: 'high', category: 'entertainment' },
          { name: 'AdAge', url: 'https://adage.com/rss/all', priority: 'high', category: 'advertising' },
          { name: 'Digiday', url: 'https://digiday.com/feed/', priority: 'high', category: 'digital_media' }
        ],
        google_news: [
          'streaming wars', 'Netflix', 'Disney Plus', 'box office', 'video games',
          'social media platforms', 'content creation', 'influencer marketing'
        ]
      },

      // TELECOMMUNICATIONS
      telecommunications: {
        rss: [
          { name: 'Light Reading', url: 'https://www.lightreading.com/rss_simple.asp', priority: 'high', category: 'telecom' },
          { name: 'RCR Wireless', url: 'https://www.rcrwireless.com/feed', priority: 'high', category: 'wireless' },
          { name: 'FierceWireless', url: 'https://www.fiercewireless.com/rss/xml', priority: 'high', category: 'wireless' },
          { name: 'Telecom Lead', url: 'https://www.telecomlead.com/feed', priority: 'medium', category: 'telecom' }
        ],
        google_news: [
          '5G deployment', 'broadband infrastructure', 'satellite internet',
          'network security', 'telecom mergers', 'spectrum auction'
        ]
      },

      // AGRICULTURE
      agriculture: {
        rss: [
          { name: 'AgWeb', url: 'https://www.agweb.com/rss/all', priority: 'high', category: 'agriculture' },
          { name: 'Farm Progress', url: 'https://www.farmprogress.com/rss.xml', priority: 'high', category: 'farming' },
          { name: 'AgFunder News', url: 'https://agfundernews.com/feed', priority: 'high', category: 'agtech' },
          { name: 'Food Dive', url: 'https://www.fooddive.com/feeds/news/', priority: 'high', category: 'food' }
        ],
        google_news: [
          'crop yields', 'agricultural technology', 'precision farming',
          'food security', 'sustainable agriculture', 'vertical farming'
        ]
      },

      // EDUCATION
      education: {
        rss: [
          { name: 'EdSurge', url: 'https://www.edsurge.com/feed', priority: 'high', category: 'edtech' },
          { name: 'Chronicle Higher Ed', url: 'https://www.chronicle.com/feeds/feed', priority: 'high', category: 'higher_ed' },
          { name: 'EducationWeek', url: 'https://www.edweek.org/ew/section/feeds/rss.html', priority: 'high', category: 'k12' },
          { name: 'Inside Higher Ed', url: 'https://www.insidehighered.com/rss/feeds', priority: 'high', category: 'higher_ed' }
        ],
        google_news: [
          'online learning', 'edtech funding', 'student debt', 'university enrollment',
          'STEM education', 'remote learning', 'education technology'
        ]
      },

      // GOVERNMENT & DEFENSE
      government: {
        rss: [
          { name: 'Defense News', url: 'https://www.defensenews.com/arc/outboundfeeds/rss/', priority: 'critical', category: 'defense' },
          { name: 'Federal News Network', url: 'https://federalnewsnetwork.com/feed/', priority: 'high', category: 'federal' },
          { name: 'Government Executive', url: 'https://www.govexec.com/rss/all/', priority: 'high', category: 'government' },
          { name: 'NextGov', url: 'https://www.nextgov.com/rss/', priority: 'high', category: 'gov_tech' }
        ],
        google_news: [
          'defense spending', 'government contracts', 'cybersecurity threats',
          'national security', 'military technology', 'space force'
        ]
      },

      // AEROSPACE
      aerospace: {
        rss: [
          { name: 'Aviation Week', url: 'https://aviationweek.com/rss.xml', priority: 'critical', category: 'aviation' },
          { name: 'Space News', url: 'https://spacenews.com/feed/', priority: 'critical', category: 'space' },
          { name: 'Aerospace Technology', url: 'https://www.aerospace-technology.com/feed/', priority: 'high', category: 'aerospace' },
          { name: 'Flight Global', url: 'https://www.flightglobal.com/rss', priority: 'high', category: 'aviation' }
        ],
        google_news: [
          'SpaceX', 'Blue Origin', 'NASA', 'satellite launch', 'space exploration',
          'commercial aviation', 'aircraft orders', 'aerospace innovation'
        ]
      },

      // AUTOMOTIVE
      automotive: {
        rss: [
          { name: 'Automotive News', url: 'https://www.autonews.com/feed', priority: 'critical', category: 'auto' },
          { name: 'Electrek', url: 'https://electrek.co/feed/', priority: 'high', category: 'electric_vehicles' },
          { name: 'Motor Authority', url: 'https://www.motorauthority.com/feed/rss', priority: 'medium', category: 'auto' },
          { name: 'Green Car Reports', url: 'https://www.greencarreports.com/rss', priority: 'high', category: 'green_vehicles' }
        ],
        google_news: [
          'electric vehicles', 'autonomous driving', 'Tesla', 'automotive chips',
          'vehicle recalls', 'auto manufacturing', 'charging infrastructure'
        ]
      },

      // BIOTECHNOLOGY
      biotechnology: {
        rss: [
          { name: 'BioSpace', url: 'https://www.biospace.com/rss/', priority: 'critical', category: 'biotech' },
          { name: 'Genetic Engineering News', url: 'https://www.genengnews.com/feed/', priority: 'high', category: 'genetics' },
          { name: 'BioPharma Dive', url: 'https://www.biopharmadive.com/feeds/news/', priority: 'high', category: 'biopharma' },
          { name: 'Endpoints News', url: 'https://endpts.com/feed/', priority: 'critical', category: 'biotech_news' }
        ],
        google_news: [
          'gene editing', 'CRISPR', 'biotech IPO', 'clinical trials',
          'drug approval', 'vaccine development', 'cell therapy'
        ]
      },

      // CONSTRUCTION
      construction: {
        rss: [
          { name: 'Construction Dive', url: 'https://www.constructiondive.com/feeds/news/', priority: 'high', category: 'construction' },
          { name: 'ENR', url: 'https://www.enr.com/rss/all', priority: 'critical', category: 'engineering' },
          { name: 'Building Design', url: 'https://www.bdonline.co.uk/rss/', priority: 'medium', category: 'architecture' },
          { name: 'Construction Week', url: 'https://www.constructionweek.com/rss.xml', priority: 'medium', category: 'construction' }
        ],
        google_news: [
          'infrastructure bill', 'construction technology', 'green building',
          'construction costs', 'labor shortage construction', 'modular construction'
        ]
      },

      // FOOD & BEVERAGE
      food: {
        rss: [
          { name: 'Food Business News', url: 'https://www.foodbusinessnews.net/rss', priority: 'high', category: 'food_business' },
          { name: 'Food Processing', url: 'https://www.foodprocessing.com/rss/', priority: 'medium', category: 'food_processing' },
          { name: 'Restaurant Business', url: 'https://www.restaurantbusinessonline.com/rss.xml', priority: 'high', category: 'restaurant' },
          { name: 'Nation Restaurant News', url: 'https://www.nrn.com/rss.xml', priority: 'high', category: 'restaurant' }
        ],
        google_news: [
          'food inflation', 'plant based meat', 'restaurant chains', 'food delivery',
          'sustainable packaging', 'food technology', 'supply chain food'
        ]
      },

      // INSURANCE
      insurance: {
        rss: [
          { name: 'Insurance Journal', url: 'https://www.insurancejournal.com/rss/', priority: 'critical', category: 'insurance' },
          { name: 'PropertyCasualty360', url: 'https://www.propertycasualty360.com/feed/', priority: 'high', category: 'property_casualty' },
          { name: 'Insurance Business', url: 'https://www.insurancebusinessmag.com/us/rss/', priority: 'high', category: 'insurance' },
          { name: 'Reinsurance News', url: 'https://www.reinsurancene.ws/feed/', priority: 'high', category: 'reinsurance' }
        ],
        google_news: [
          'insurance claims', 'insurtech', 'catastrophe insurance', 'cyber insurance',
          'health insurance', 'auto insurance rates', 'climate risk insurance'
        ]
      },

      // LEGAL
      legal: {
        rss: [
          { name: 'Law360', url: 'https://www.law360.com/rss', priority: 'critical', category: 'legal_news' },
          { name: 'Above the Law', url: 'https://abovethelaw.com/feed/', priority: 'high', category: 'legal' },
          { name: 'Legal Week', url: 'https://www.law.com/feed/', priority: 'high', category: 'legal' },
          { name: 'ABA Journal', url: 'https://www.abajournal.com/feed', priority: 'high', category: 'legal' }
        ],
        google_news: [
          'class action lawsuit', 'regulatory compliance', 'antitrust', 'data privacy',
          'intellectual property', 'merger review', 'litigation'
        ]
      },

      // LOGISTICS
      logistics: {
        rss: [
          { name: 'DC Velocity', url: 'https://www.dcvelocity.com/rss/', priority: 'high', category: 'distribution' },
          { name: 'Material Handling', url: 'https://www.mhpn.com/rss.xml', priority: 'medium', category: 'warehousing' },
          { name: 'Supply Chain Brain', url: 'https://www.supplychainbrain.com/rss/articles', priority: 'high', category: 'supply_chain' },
          { name: 'Logistics Viewpoints', url: 'https://logisticsviewpoints.com/feed/', priority: 'medium', category: 'logistics' }
        ],
        google_news: [
          'warehouse automation', 'fulfillment centers', 'same day delivery',
          'cross border logistics', 'cold chain', 'reverse logistics'
        ]
      },

      // MINING
      mining: {
        rss: [
          { name: 'Mining.com', url: 'https://www.mining.com/feed/', priority: 'critical', category: 'mining' },
          { name: 'Mining Weekly', url: 'https://www.miningweekly.com/rss', priority: 'high', category: 'mining' },
          { name: 'Australian Mining', url: 'https://www.australianmining.com.au/feed/', priority: 'medium', category: 'mining' },
          { name: 'Mining Technology', url: 'https://www.mining-technology.com/feed/', priority: 'high', category: 'mining_tech' }
        ],
        google_news: [
          'commodity prices', 'rare earth minerals', 'mining sustainability',
          'copper demand', 'lithium mining', 'gold prices'
        ]
      },

      // PHARMACEUTICALS
      pharmaceuticals: {
        rss: [
          { name: 'Pharma Times', url: 'https://www.pharmatimes.com/rss/', priority: 'high', category: 'pharma' },
          { name: 'Pharmaceutical Technology', url: 'https://www.pharmaceutical-technology.com/feed/', priority: 'high', category: 'pharma_tech' },
          { name: 'Drug Discovery Today', url: 'https://www.drugdiscoverytoday.com/rss', priority: 'critical', category: 'drug_discovery' },
          { name: 'PharmaLive', url: 'https://www.pharmalive.com/feed/', priority: 'medium', category: 'pharma' }
        ],
        google_news: [
          'drug pricing', 'FDA approval', 'pharmaceutical merger', 'patent expiry',
          'biosimilars', 'clinical trial results', 'drug recall'
        ]
      },

      // SPORTS & FITNESS INDUSTRY (Additional for Nike context)
      sports: {
        rss: [
          { name: 'ESPN Business', url: 'https://www.espn.com/espn/rss/news', priority: 'high', category: 'sports_business' },
          { name: 'Sports Business Journal', url: 'https://www.sportsbusinessjournal.com/rss/news.aspx', priority: 'critical', category: 'sports_business' },
          { name: 'Sportico', url: 'https://sportico.com/feed/', priority: 'high', category: 'sports_finance' },
          { name: 'The Athletic Business', url: 'https://theathletic.com/rss/', priority: 'high', category: 'sports' },
          { name: 'Hypebeast', url: 'https://hypebeast.com/feed', priority: 'medium', category: 'streetwear' },
          { name: 'Complex Sneakers', url: 'https://www.complex.com/sneakers/rss', priority: 'medium', category: 'sneakers' },
          { name: 'Sneaker News', url: 'https://sneakernews.com/feed/', priority: 'high', category: 'sneakers' },
          { name: 'Highsnobiety', url: 'https://www.highsnobiety.com/feed/', priority: 'medium', category: 'fashion_culture' }
        ],
        google_news: [
          'athlete sponsorship', 'sports apparel', 'sneaker release', 'athletic performance',
          'sports marketing', 'fitness trends', 'sports retail'
        ]
      }
    };

    // Additional cross-industry sources
    this.globalSources = {
      major_news: [
        { name: 'Reuters Top News', url: 'https://feeds.reuters.com/reuters/topNews', priority: 'critical' },
        { name: 'AP News', url: 'https://feeds.apnews.com/rss/apf-topnews', priority: 'critical' },
        { name: 'BBC News', url: 'https://feeds.bbci.co.uk/news/rss.xml', priority: 'critical' },
        { name: 'Guardian Business', url: 'https://www.theguardian.com/business/rss', priority: 'high' },
        { name: 'NY Times Business', url: 'https://rss.nytimes.com/services/xml/rss/nyt/Business.xml', priority: 'critical' },
        { name: 'WSJ Business', url: 'https://feeds.wsj.com/wsj/xml/rss/3_7014.xml', priority: 'critical' },
        { name: 'Economist', url: 'https://www.economist.com/feeds/print-sections/77/business.xml', priority: 'high' },
        { name: 'Harvard Business Review', url: 'https://hbr.org/feed', priority: 'high' },
        { name: 'Fast Company', url: 'https://www.fastcompany.com/latest/rss', priority: 'medium' },
        { name: 'Inc Magazine', url: 'https://www.inc.com/rss', priority: 'medium' },
        { name: 'Entrepreneur', url: 'https://www.entrepreneur.com/latest.rss', priority: 'medium' },
        { name: 'Business Wire', url: 'https://feed.businesswire.com/rss/home/?rss=G1QFDERJXkJeGVtRWA==', priority: 'high' },
        { name: 'PR Newswire', url: 'https://www.prnewswire.com/rss/news-releases-list.rss', priority: 'high' }
      ],
      social_platforms: [
        'Reddit', 'Twitter/X', 'LinkedIn', 'Facebook', 'Instagram', 
        'TikTok', 'YouTube', 'Discord', 'Telegram'
      ],
      api_sources: [
        'NewsAPI', 'Google News API', 'Bing News API', 'Twitter API',
        'Reddit API', 'YouTube API', 'LinkedIn API'
      ]
    };
  }

  /**
   * Get ALL sources for comprehensive monitoring
   */
  getAllSources() {
    const allSources = [];
    
    // Add all industry-specific RSS feeds
    for (const [industry, data] of Object.entries(this.sources)) {
      if (data.rss) {
        data.rss.forEach(source => {
          allSources.push({
            ...source,
            industry,
            type: 'rss'
          });
        });
      }
    }
    
    // Add global news sources
    this.globalSources.major_news.forEach(source => {
      allSources.push({
        ...source,
        industry: 'global',
        type: 'rss'
      });
    });
    
    return allSources;
  }

  /**
   * Get sources for specific industry
   */
  getIndustrySources(industry) {
    return this.sources[industry] || {};
  }

  /**
   * Get Google News queries for all industries
   */
  getAllGoogleNewsQueries() {
    const queries = [];
    
    for (const [industry, data] of Object.entries(this.sources)) {
      if (data.google_news) {
        data.google_news.forEach(query => {
          queries.push({
            industry,
            query,
            url: `https://news.google.com/rss/search?q="${encodeURIComponent(query)}"&hl=en-US&gl=US&ceid=US:en`
          });
        });
      }
    }
    
    return queries;
  }

  /**
   * Get total source count
   */
  getSourceStats() {
    const stats = {
      total_rss: 0,
      total_google_news: 0,
      total_websites: 0,
      by_industry: {}
    };
    
    for (const [industry, data] of Object.entries(this.sources)) {
      const industryStats = {
        rss: data.rss?.length || 0,
        google_news: data.google_news?.length || 0,
        websites: data.websites?.length || 0
      };
      
      stats.total_rss += industryStats.rss;
      stats.total_google_news += industryStats.google_news;
      stats.total_websites += industryStats.websites;
      stats.by_industry[industry] = industryStats;
    }
    
    stats.total_rss += this.globalSources.major_news.length;
    stats.grand_total = stats.total_rss + stats.total_google_news + stats.total_websites;
    
    return stats;
  }
  
  /**
   * Get sources for a specific industry
   * Works for ANY industry name provided by users
   */
  getSourcesForIndustry(industry) {
    if (!industry) {
      // Return general/global sources if no industry specified
      return {
        rss_feeds: this.globalSources.major_news.map(url => ({ 
          url, 
          name: url.split('/')[2], 
          category: 'general' 
        })),
        google_news_queries: ['business news', 'industry trends', 'market updates'],
        websites: []
      };
    }
    
    // Normalize industry name
    const normalizedIndustry = industry.toLowerCase().replace(/[^a-z]/g, '');
    
    // Try to find exact match
    if (this.sources[normalizedIndustry]) {
      return {
        rss_feeds: this.sources[normalizedIndustry].rss || [],
        google_news_queries: this.sources[normalizedIndustry].google_news || [],
        websites: this.sources[normalizedIndustry].websites || []
      };
    }
    
    // Try to find partial match (e.g., "Tech" matches "technology")
    for (const key in this.sources) {
      if (key.includes(normalizedIndustry) || normalizedIndustry.includes(key)) {
        return {
          rss_feeds: this.sources[key].rss || [],
          google_news_queries: this.sources[key].google_news || [],
          websites: this.sources[key].websites || []
        };
      }
    }
    
    // Industry-specific mapping for common variations
    const industryMap = {
      'tech': 'technology',
      'fintech': 'finance',
      'saas': 'technology',
      'software': 'technology',
      'banking': 'finance',
      'pharma': 'healthcare',
      'medical': 'healthcare',
      'auto': 'automotive',
      'cars': 'automotive',
      'food': 'retail',
      'restaurant': 'hospitality',
      'hotel': 'hospitality',
      'airline': 'aviation',
      'aircraft': 'aviation',
      'realestate': 'real_estate',
      'property': 'real_estate',
      'ecommerce': 'retail',
      'shopping': 'retail',
      'sports': 'sports',
      'fitness': 'sports',
      'athletic': 'sports',
      'apparel': 'retail',
      'clothing': 'retail',
      'fashion': 'retail'
    };
    
    // Check if we have a mapping for this industry
    const mappedIndustry = industryMap[normalizedIndustry];
    if (mappedIndustry && this.sources[mappedIndustry]) {
      return {
        rss_feeds: this.sources[mappedIndustry].rss || [],
        google_news_queries: this.sources[mappedIndustry].google_news || [],
        websites: this.sources[mappedIndustry].websites || []
      };
    }
    
    // Default to business/general sources if no specific match
    console.log(`No specific sources for industry "${industry}", using general business sources`);
    return {
      rss_feeds: [
        ...this.globalSources.major_news.map(url => ({ 
          url, 
          name: typeof url === 'string' ? url.split('/')[2] : 'News Source', 
          category: 'general' 
        })),
        ...(this.sources.finance && this.sources.finance.rss ? this.sources.finance.rss.slice(0, 5) : [])
      ],
      google_news_queries: [
        `${industry} news`,
        `${industry} trends`,
        `${industry} market`,
        `${industry} industry`,
        'business news'
      ],
      websites: []
    };
  }
}

module.exports = MasterSourceRegistry;