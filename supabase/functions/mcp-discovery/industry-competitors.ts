// Industry Competitors from orgNames.md - LIMITED TO TOP 10 PER CATEGORY
// Used by discovery MCP to identify key competitors in each industry

export const INDUSTRY_COMPETITORS_DETAILED = {
  // CONSUMER GOODS INDUSTRIES - Brands that MAKE products
  beauty: {
    general: [
      'L\'Oréal', 'Estée Lauder', 'Coty', 'Shiseido', 'Revlon',
      'e.l.f. Beauty', 'Ulta Beauty', 'Sephora', 'MAC', 'NYX'
    ],
    cosmetics: [
      'e.l.f. Beauty', 'Maybelline', 'L\'Oréal Paris', 'NYX', 'MAC',
      'Fenty Beauty', 'Charlotte Tilbury', 'Rare Beauty', 'NARS', 'Urban Decay'
    ],
    skincare: [
      'CeraVe', 'The Ordinary', 'La Roche-Posay', 'Cetaphil', 'Neutrogena',
      'Olay', 'Clinique', 'Drunk Elephant', 'Tatcha', 'Paula\'s Choice'
    ],
    haircare: [
      'Olaplex', 'Moroccanoil', 'Redken', 'Paul Mitchell', 'Aveda',
      'Schwarzkopf', 'L\'Oréal Professional', 'Matrix', 'Kerastase', 'Bumble and bumble'
    ],
    personal_care: [
      'Dove', 'Nivea', 'Aveeno', 'Bath & Body Works', 'The Body Shop',
      'Lush', 'Method', 'Mrs. Meyer\'s', 'Native', 'Harry\'s'
    ],
    luxury_beauty: [
      'La Mer', 'SK-II', 'Tom Ford Beauty', 'Chanel Beauty', 'Dior Beauty',
      'Guerlain', 'YSL Beauty', 'Lancôme', 'Sisley', 'La Prairie'
    ]
  },

  fashion: {
    general: [
      'H&M', 'Zara', 'Uniqlo', 'Nike', 'Adidas',
      'Gap', 'Levi\'s', 'Under Armour', 'Puma', 'New Balance'
    ],
    fast_fashion: [
      'Zara', 'H&M', 'Uniqlo', 'Shein', 'Forever 21',
      'Mango', 'Pull & Bear', 'Bershka', 'Primark', 'Fashion Nova'
    ],
    athletic_apparel: [
      'Nike', 'Adidas', 'Under Armour', 'Lululemon', 'Puma',
      'New Balance', 'Reebok', 'Asics', 'On Running', 'Gymshark'
    ],
    denim: [
      'Levi\'s', 'Wrangler', 'Lee', 'American Eagle', 'True Religion',
      '7 For All Mankind', 'Citizens of Humanity', 'AG Jeans', 'Frame', 'Hudson'
    ],
    outdoor_apparel: [
      'The North Face', 'Patagonia', 'Columbia', 'Arc\'teryx', 'REI',
      'Marmot', 'Mountain Hardwear', 'Outdoor Research', 'prAna', 'Cotopaxi'
    ],
    streetwear: [
      'Supreme', 'Off-White', 'A Bathing Ape', 'Stüssy', 'Palace',
      'Fear of God', 'Kith', 'Essentials', 'Anti Social Social Club', 'Rhude'
    ]
  },

  luxury_goods: {
    general: [
      'LVMH', 'Kering', 'Hermès', 'Chanel', 'Prada',
      'Richemont', 'Burberry', 'Gucci', 'Louis Vuitton', 'Dior'
    ],
    fashion_luxury: [
      'Gucci', 'Louis Vuitton', 'Dior', 'Prada', 'Burberry',
      'Balenciaga', 'Saint Laurent', 'Bottega Veneta', 'Valentino', 'Givenchy'
    ],
    watches_jewelry: [
      'Rolex', 'Cartier', 'Omega', 'Patek Philippe', 'Tiffany & Co.',
      'Bulgari', 'TAG Heuer', 'Chopard', 'Van Cleef & Arpels', 'Piaget'
    ],
    handbags: [
      'Louis Vuitton', 'Hermès', 'Chanel', 'Gucci', 'Prada',
      'Fendi', 'Celine', 'Loewe', 'Bottega Veneta', 'Saint Laurent'
    ]
  },

  food_beverage: {
    general: [
      'Nestlé', 'PepsiCo', 'Coca-Cola', 'Unilever', 'Kraft Heinz',
      'General Mills', 'Kellogg\'s', 'Mars', 'Mondelez', 'Danone'
    ],
    soft_drinks: [
      'Coca-Cola', 'PepsiCo', 'Dr Pepper Snapple', 'Red Bull', 'Monster',
      'Gatorade', 'Celsius', 'Prime', 'Liquid Death', 'Poppi'
    ],
    snacks: [
      'Frito-Lay', 'Mondelez', 'Mars', 'Hershey\'s', 'Kellogg\'s',
      'General Mills', 'KIND', 'Clif Bar', 'RXBAR', 'Quest'
    ],
    alcoholic_beverages: [
      'Diageo', 'AB InBev', 'Pernod Ricard', 'Constellation Brands', 'Brown-Forman',
      'Molson Coors', 'Heineken', 'Bacardi', 'Beam Suntory', 'Campari'
    ],
    coffee: [
      'Starbucks', 'Nespresso', 'Keurig Dr Pepper', 'Lavazza', 'Peet\'s',
      'Dunkin\'', 'Blue Bottle', 'Stumptown', 'Intelligentsia', 'La Colombe'
    ]
  },

  consumer_electronics: {
    general: [
      'Apple', 'Samsung', 'Sony', 'LG', 'Bose',
      'Dell', 'HP', 'Lenovo', 'Microsoft', 'Google'
    ],
    smartphones: [
      'Apple', 'Samsung', 'Google', 'OnePlus', 'Xiaomi',
      'Oppo', 'Vivo', 'Motorola', 'Nothing', 'Asus'
    ],
    audio: [
      'Bose', 'Sony', 'Apple', 'JBL', 'Sonos',
      'Sennheiser', 'Bang & Olufsen', 'Beats', 'Harman Kardon', 'Marshall'
    ],
    gaming_hardware: [
      'Sony PlayStation', 'Microsoft Xbox', 'Nintendo', 'Razer', 'Logitech',
      'SteelSeries', 'HyperX', 'Corsair', 'ASUS ROG', 'MSI'
    ]
  },

  home_goods: {
    general: [
      'IKEA', 'Williams-Sonoma', 'Crate & Barrel', 'Pottery Barn', 'West Elm',
      'Restoration Hardware', 'Wayfair', 'Bed Bath & Beyond', 'CB2', 'Article'
    ],
    furniture: [
      'IKEA', 'Ashley Furniture', 'La-Z-Boy', 'Steelcase', 'Herman Miller',
      'Ethan Allen', 'Rooms To Go', 'Article', 'Joybird', 'Floyd'
    ],
    home_decor: [
      'Pottery Barn', 'Crate & Barrel', 'West Elm', 'CB2', 'Anthropologie',
      'World Market', 'HomeGoods', 'At Home', 'Pier 1', 'Z Gallerie'
    ]
  },

  sporting_goods: {
    general: [
      'Nike', 'Adidas', 'Under Armour', 'Puma', 'New Balance',
      'The North Face', 'Columbia', 'Yeti', 'Callaway', 'TaylorMade'
    ],
    golf: [
      'Callaway', 'TaylorMade', 'Titleist', 'Ping', 'Cobra',
      'Cleveland', 'Bridgestone', 'Srixon', 'Mizuno', 'PXG'
    ],
    outdoor_equipment: [
      'Yeti', 'Coleman', 'REI', 'Osprey', 'Kelty',
      'Big Agnes', 'MSR', 'Black Diamond', 'Jetboil', 'Thermarest'
    ]
  },

  pet_products: {
    general: [
      'Mars Petcare', 'Nestlé Purina', 'Hill\'s Pet', 'Blue Buffalo', 'Royal Canin',
      'Chewy', 'BarkBox', 'Petco', 'PetSmart', 'Farmer\'s Dog'
    ],
    pet_food: [
      'Purina', 'Blue Buffalo', 'Hill\'s Science Diet', 'Royal Canin', 'Iams',
      'Farmer\'s Dog', 'Ollie', 'Nom Nom', 'Open Farm', 'Orijen'
    ]
  },

  toys_games: {
    general: [
      'LEGO', 'Hasbro', 'Mattel', 'Spin Master', 'Funko',
      'Nintendo', 'PlayStation', 'Xbox', 'Bandai Namco', 'Fisher-Price'
    ]
  },

  technology: {
    // Parent industry leaders
    general: [
      'Apple', 'Microsoft', 'Google', 'Amazon', 'Meta', 'Samsung', 'IBM', 'Oracle', 'Intel', 'Cisco'
    ],

    // Sub-categories - TOP 10 ONLY
    ai_ml: [
      'OpenAI', 'Anthropic', 'Google DeepMind', 'Microsoft AI', 'Meta AI',
      'xAI', 'Mistral AI', 'Cohere', 'Inflection AI', 'Perplexity'
    ],

    cybersecurity: [
      'Palo Alto Networks', 'CrowdStrike', 'Fortinet', 'Zscaler', 'SentinelOne',
      'CyberArk', 'Okta', 'Cloudflare', 'Check Point', 'Rapid7'
    ],

    saas_enterprise: [
      'Salesforce', 'ServiceNow', 'Workday', 'Adobe', 'Intuit',
      'Atlassian', 'Zoom', 'DocuSign', 'HubSpot', 'Monday.com'
    ],

    fintech: [
      'Stripe', 'Square', 'PayPal', 'Adyen', 'Klarna', 
      'Plaid', 'Chime', 'Robinhood', 'Coinbase', 'Revolut'
    ],

    cloud_infrastructure: [
      'Amazon Web Services', 'Microsoft Azure', 'Google Cloud', 'Alibaba Cloud',
      'Oracle Cloud', 'IBM Cloud', 'DigitalOcean', 'Cloudflare', 'Snowflake', 'MongoDB'
    ],

    semiconductor: [
      'NVIDIA', 'Intel', 'AMD', 'Qualcomm', 'Broadcom', 
      'TSMC', 'ASML', 'Applied Materials', 'Micron', 'Texas Instruments'
    ],

    social_media: [
      'Meta', 'X (Twitter)', 'LinkedIn', 'TikTok', 'Snapchat',
      'Pinterest', 'Reddit', 'Discord', 'Threads', 'Bluesky'
    ],

    gaming: [
      'Microsoft (Xbox)', 'Sony (PlayStation)', 'Nintendo', 'Steam (Valve)',
      'Epic Games', 'Electronic Arts', 'Activision Blizzard', 'Take-Two', 'Ubisoft', 'Roblox'
    ],

    ecommerce_platforms: [
      'Shopify', 'Amazon', 'BigCommerce', 'WooCommerce', 'Magento',
      'Wix', 'Squarespace', 'Square Online', 'Salesforce Commerce', 'Adobe Commerce'
    ]
  },

  marketing_advertising: {
    general: [
      'WPP', 'Omnicom', 'Publicis', 'Interpublic', 'Dentsu',
      'Havas', 'Accenture Interactive', 'Deloitte Digital', 'IBM iX', 'Cognizant'
    ],

    // Experiential & Event Marketing (mix of holding company + mid-size independents)
    experiential_marketing: [
      // Holding company shops
      'Momentum Worldwide', 'George P. Johnson', 'Jack Morton', 'Sparks',
      // Mid-size independents
      'Set Creative', 'TBA Global', 'NVE Experience Agency', 'Inspira Marketing', 'MAS Event + Design',
      'agencyEA', 'BeCore', 'Pro Motion', 'The Eventive Group', 'Giant Spoon', 'MKG', 'Wasserman', 'Imagination'
    ],

    integrated_marketing: [
      'Droga5', 'Wieden+Kennedy', '72andSunny', 'Anomaly', 'GSD&M',
      'Mother', 'Goodby Silverstein', 'Crispin Porter Bogusky', 'R/GA', 'TBWA'
    ],

    brand_experience: [
      'Superfly', 'IMG Live', 'AEG Presents', 'C3 Presents', 'Civic Entertainment',
      'Factory 360', 'Mirrorball', 'agencyEA', 'Eventive Marketing', 'XA'
    ],

    event_marketing: [
      'Freeman', 'Encore', 'GES', 'PSAV', 'Hargrove',
      'Czarnowski', 'Nth Degree', 'Opus Agency', '23 Stories', 'Cramer'
    ],

    sports_marketing: [
      'Octagon', 'CAA Sports', 'Wasserman', 'Excel Sports', 'Lagardère Sports',
      'Endeavor', 'Learfield IMG College', 'GMR Marketing', 'rEvolution', 'The Marketing Arm'
    ],

    creative_agency: [
      'Droga5', 'Wieden+Kennedy', '72andSunny', 'BBDO', 'DDB',
      'Ogilvy', 'McCann', 'Leo Burnett', 'Grey', 'FCB'
    ],

    media_agency: [
      'GroupM', 'Dentsu Media', 'Publicis Media', 'IPG Mediabrands', 'Havas Media',
      'Horizon Media', 'Assembly', 'OMD', 'Mindshare', 'Zenith'
    ],

    digital_marketing: [
      'Accenture Interactive', 'Deloitte Digital', 'IBM iX', 'Cognizant Interactive',
      'R/GA', 'AKQA', 'Digitas', 'Razorfish', 'Wunderman Thompson', 'VMLY&R'
    ],

    content_marketing: [
      'Contently', 'CoSchedule', 'Skyword', 'Rock Content', 'ScriptedPlatform',
      'Influence & Co.', 'ClearVoice', 'Brafton', 'NP Digital', 'Siege Media'
    ],

    influencer_marketing: [
      'AspireIQ', 'GRIN', 'CreatorIQ', 'Klear', 'IZEA',
      'Mavrck', 'Later', 'Captiv8', 'Upfluence', 'HypeAuditor'
    ],

    social_media_marketing: [
      'VaynerMedia', 'Sprinklr', 'Hootsuite', 'Sprout Social', 'Khoros',
      'Social Chain', 'Obviously', 'Viral Nation', 'The Social Standard', 'Socialfly'
    ],

    performance_marketing: [
      'Merkle', 'Wpromote', 'iProspect', '360i', 'Tinuiti',
      'Jellyfish', 'Reprise Digital', 'Rise Interactive', 'WebFX', 'Directive'
    ],

    shopper_marketing: [
      'The Mars Agency', 'Geometry', 'TracyLocke', 'Integer', 'TPN',
      'Saatchi & Saatchi X', 'IN Connected Marketing', 'Match Marketing', 'Catapult', 'Arc Worldwide'
    ],

    public_relations: [
      'Edelman', 'Weber Shandwick', 'FleishmanHillard', 'Ketchum', 'Burson',
      'Ogilvy PR', 'Porter Novelli', 'Ruder Finn', 'ICR', 'Brunswick'
    ],

    strategic_communications: [
      'Edelman', 'Weber Shandwick', 'FleishmanHillard', 'Brunswick', 'Finsbury Glover Hering',
      'ICR', 'Sard Verbinnen', 'Joele Frank', 'Kekst CNC', 'Prosek Partners'
    ],

    healthcare_marketing: [
      'Syneos Health', 'Inizio', 'Real Chemistry', 'Fingerpaint', 'Area 23',
      'Havas Health', 'Publicis Health', 'McCann Health', 'Klick Health', 'W2O Group'
    ],

    b2b_marketing: [
      'Merkle B2B', 'Dun & Bradstreet', 'ZoomInfo', 'Demandbase', 'Terminus',
      '6sense', 'Madison Logic', 'RollWorks', 'Triblio', 'MRP'
    ]
  },

  healthcare: {
    general: [
      'Johnson & Johnson', 'UnitedHealth', 'CVS Health', 'Anthem', 'Pfizer',
      'Roche', 'Novartis', 'Merck', 'AbbVie', 'Medtronic'
    ],

    pharma_big: [
      'Pfizer', 'Johnson & Johnson', 'Roche', 'Novartis', 'Merck',
      'AbbVie', 'Bristol Myers Squibb', 'AstraZeneca', 'Sanofi', 'GSK'
    ],

    biotech: [
      'Moderna', 'Regeneron', 'Vertex', 'Biogen', 'Illumina', 
      'BioNTech', 'Amgen', 'Gilead', 'CRISPR Therapeutics', 'Alnylam'
    ],

    medical_devices: [
      'Medtronic', 'Abbott', 'Johnson & Johnson', 'GE Healthcare', 'Siemens Healthineers',
      'Becton Dickinson', 'Stryker', 'Boston Scientific', 'Intuitive Surgical', 'Dexcom'
    ],

    healthtech: [
      'Teladoc', 'Veeva Systems', 'Doximity', 'GoodRx', 'Oscar Health',
      'One Medical', 'Carbon Health', 'Ro', 'BetterHelp', 'Hims & Hers'
    ],

    health_insurance: [
      'UnitedHealth', 'Anthem', 'CVS Health (Aetna)', 'Cigna', 'Humana',
      'Centene', 'Molina Healthcare', 'BlueCross BlueShield', 'Kaiser Permanente', 'Oscar Health'
    ]
  },

  finance: {
    general: [
      'JPMorgan Chase', 'Bank of America', 'Wells Fargo', 'Citigroup', 'Goldman Sachs',
      'Morgan Stanley', 'Charles Schwab', 'American Express', 'BlackRock', 'Visa'
    ],

    retail_banking: [
      'JPMorgan Chase', 'Bank of America', 'Wells Fargo', 'Citibank', 'US Bank',
      'PNC', 'Truist', 'TD Bank', 'Capital One', 'Fifth Third'
    ],

    investment_banking: [
      'Goldman Sachs', 'Morgan Stanley', 'JPMorgan', 'Bank of America', 'Citigroup',
      'Barclays', 'Credit Suisse', 'Deutsche Bank', 'UBS', 'Jefferies'
    ],

    digital_banks: [
      'Chime', 'Revolut', 'N26', 'Monzo', 'Nubank',
      'Current', 'Varo', 'SoFi', 'Ally Bank', 'Marcus by Goldman Sachs'
    ],

    wealth_management: [
      'Charles Schwab', 'Fidelity', 'Vanguard', 'BlackRock', 'Morgan Stanley Wealth',
      'Merrill Lynch', 'Edward Jones', 'Raymond James', 'Ameriprise', 'UBS Wealth'
    ],

    private_equity: [
      'Blackstone', 'KKR', 'Apollo', 'Carlyle', 'TPG', 
      'Warburg Pincus', 'Advent International', 'CVC Capital', 'Vista Equity', 'Thoma Bravo'
    ],

    venture_capital: [
      'Sequoia Capital', 'Andreessen Horowitz', 'Accel', 'Benchmark', 'Greylock',
      'Kleiner Perkins', 'GV (Google Ventures)', 'Insight Partners', 'NEA', 'Tiger Global'
    ]
  },

  retail: {
    general: [
      'Walmart', 'Amazon', 'Target', 'Costco', 'Home Depot',
      'Kroger', 'CVS', 'Walgreens', 'Best Buy', 'Lowe\'s'
    ],

    mass_merchants: [
      'Walmart', 'Target', 'Costco', 'BJ\'s Wholesale', 'Sam\'s Club',
      'Meijer', 'Dollar General', 'Dollar Tree', 'Five Below', 'Big Lots'
    ],

    grocery: [
      'Kroger', 'Albertsons', 'Publix', 'Ahold Delhaize', 'H-E-B',
      'Whole Foods', 'Trader Joe\'s', 'Aldi', 'Wegmans', 'Sprouts'
    ],

    home_improvement: [
      'Home Depot', 'Lowe\'s', 'Menards', 'Ace Hardware', 'Floor & Decor',
      'Tractor Supply', 'Harbor Freight', 'Ferguson', 'Build.com', 'Wayfair'
    ],

    apparel_retail: [
      'TJX Companies', 'Ross Stores', 'Burlington', 'Nordstrom', 'Macy\'s',
      'Gap', 'H&M', 'Zara (Inditex)', 'Uniqlo (Fast Retailing)', 'Lululemon'
    ],

    luxury_retail: [
      'LVMH', 'Kering', 'Hermès', 'Richemont', 'Chanel', 
      'Prada', 'Burberry', 'Tiffany & Co.', 'Cartier', 'Gucci'
    ]
  },

  automotive: {
    general: [
      'Toyota', 'Volkswagen', 'General Motors', 'Ford', 'Stellantis',
      'Honda', 'Nissan', 'Hyundai-Kia', 'BMW', 'Mercedes-Benz'
    ],

    mass_market: [
      'Toyota', 'Honda', 'Nissan', 'Hyundai', 'Kia', 
      'Mazda', 'Subaru', 'Chevrolet', 'Ford', 'Volkswagen'
    ],

    luxury: [
      'Mercedes-Benz', 'BMW', 'Audi', 'Lexus', 'Porsche', 
      'Jaguar Land Rover', 'Volvo', 'Cadillac', 'Genesis', 'Infiniti'
    ],

    electric_vehicles: [
      'Tesla', 'BYD', 'Rivian', 'Lucid Motors', 'NIO', 
      'XPeng', 'Li Auto', 'Polestar', 'VinFast', 'Fisker'
    ],

    auto_parts: [
      'Bosch', 'Continental', 'Denso', 'Magna', 'Aisin', 
      'ZF Friedrichshafen', 'BorgWarner', 'Aptiv', 'Valeo', 'Lear'
    ]
  },

  real_estate_construction: {
    general: [
      'CBRE', 'JLL', 'Cushman & Wakefield', 'Colliers', 'Prologis',
      'Simon Property', 'Brookfield', 'Blackstone Real Estate', 'Equity Residential', 'AvalonBay'
    ],

    commercial_reits: [
      'Prologis', 'American Tower', 'Crown Castle', 'Equinix', 'Public Storage',
      'Simon Property', 'Realty Income', 'Digital Realty', 'Alexandria', 'Welltower'
    ],

    residential_builders: [
      'D.R. Horton', 'Lennar', 'PulteGroup', 'NVR', 'Toll Brothers',
      'KB Home', 'Meritage Homes', 'Century Communities', 'Taylor Morrison', 'Beazer Homes'
    ],

    real_estate_tech: [
      'Zillow', 'Redfin', 'Opendoor', 'Compass', 'CoStar',
      'Realtor.com', 'Apartments.com', 'LoopNet', 'Matterport', 'Procore'
    ]
  },

  energy: {
    general: [
      'Saudi Aramco', 'ExxonMobil', 'Chevron', 'Shell', 'BP',
      'TotalEnergies', 'ConocoPhillips', 'Equinor', 'NextEra Energy', 'Iberdrola'
    ],

    oil_gas: [
      'ExxonMobil', 'Chevron', 'Shell', 'BP', 'TotalEnergies',
      'ConocoPhillips', 'Marathon Petroleum', 'Valero', 'Phillips 66', 'Occidental'
    ],

    renewable_energy: [
      'NextEra Energy', 'Iberdrola', 'Orsted', 'Enel', 'EDF Renewables',
      'Vestas', 'First Solar', 'Enphase Energy', 'SunPower', 'Brookfield Renewable'
    ],

    utilities: [
      'NextEra Energy', 'Duke Energy', 'Southern Company', 'Dominion Energy', 'Exelon',
      'American Electric Power', 'Sempra Energy', 'Consolidated Edison', 'PG&E', 'Xcel Energy'
    ]
  },

  telecommunications: {
    general: [
      'AT&T', 'Verizon', 'T-Mobile', 'Comcast', 'Charter',
      'China Mobile', 'Vodafone', 'Deutsche Telekom', 'Orange', 'Telefónica'
    ],

    wireless_carriers: [
      'Verizon', 'AT&T', 'T-Mobile', 'Vodafone', 'China Mobile',
      'Orange', 'Deutsche Telekom', 'Telefónica', 'América Móvil', 'Bharti Airtel'
    ],

    broadband_cable: [
      'Comcast', 'Charter', 'Cox', 'Altice USA', 'Mediacom',
      'Cable One', 'WOW!', 'Atlantic Broadband', 'RCN', 'Grande Communications'
    ]
  }
};

// Helper function to get competitors for an organization
export function getIndustryCompetitors(
  industry: string, 
  subCategory: string | null = null, 
  maxCount: number = 10
): string[] {
  // Comprehensive industry mapping - maps various industry terms to our main categories
  const industryMapping = {
    // Automotive variations
    'electric_vehicles': 'automotive',
    'ev': 'automotive',
    'electric_vehicle': 'automotive',
    'auto': 'automotive',
    'automobile': 'automotive',
    'car': 'automotive',
    'vehicle': 'automotive',
    'tesla': 'automotive', // Company names that imply industry
    
    // Tech variations
    'software': 'technology',
    'saas': 'technology',
    'artificial_intelligence': 'technology',
    'ai': 'technology',
    'machine_learning': 'technology',
    'ml': 'technology',
    'cloud': 'technology',
    'cybersecurity': 'technology',
    'fintech': 'technology',
    
    // Healthcare variations
    'pharma': 'healthcare',
    'pharmaceutical': 'healthcare',
    'biotech': 'healthcare',
    'biotechnology': 'healthcare',
    'medical': 'healthcare',
    'health': 'healthcare',
    'hospital': 'healthcare',
    
    // Finance variations
    'banking': 'finance',
    'investment': 'finance',
    'financial_services': 'finance',
    'insurance': 'finance',
    'wealth_management': 'finance',
    
    // Beauty/Cosmetics variations - map to beauty (NOT retail!)
    'cosmetics': 'beauty',
    'skincare': 'beauty',
    'makeup': 'beauty',
    'personal_care': 'beauty',
    'haircare': 'beauty',

    // Fashion/Apparel variations - map to fashion (NOT retail!)
    'apparel': 'fashion',
    'clothing': 'fashion',
    'fast_fashion': 'fashion',
    'athletic_apparel': 'fashion',
    'streetwear': 'fashion',

    // Luxury goods
    'luxury': 'luxury_goods',
    'luxury_fashion': 'luxury_goods',

    // Food & Beverage variations
    'food': 'food_beverage',
    'beverage': 'food_beverage',
    'cpg': 'food_beverage',
    'snacks': 'food_beverage',
    'drinks': 'food_beverage',

    // Consumer Electronics
    'electronics': 'consumer_electronics',
    'smartphones': 'consumer_electronics',
    'audio': 'consumer_electronics',

    // Retail - ONLY actual retailers (stores that SELL other brands' products)
    'ecommerce': 'retail',
    'e_commerce': 'retail',
    'department_store': 'retail',
    'grocery_store': 'retail',
    'big_box': 'retail',
    
    // Energy variations
    'oil': 'energy',
    'gas': 'energy',
    'petroleum': 'energy',
    'renewable': 'energy',
    'solar': 'energy',
    'wind': 'energy',
    'utilities': 'energy',
    
    // Telecom variations
    'telecom': 'telecommunications',
    'telco': 'telecommunications',
    'wireless': 'telecommunications',
    'broadband': 'telecommunications',
    'mobile': 'telecommunications',

    // PR/Communications variations
    'public_relations': 'marketing_advertising',
    'public-relations': 'marketing_advertising',
    'pr': 'marketing_advertising',
    'strategic_communications': 'marketing_advertising',
    'corporate_communications': 'marketing_advertising',
    'communications_firm': 'marketing_advertising',

    // Marketing agency variations
    'marketing': 'marketing_advertising',
    'advertising': 'marketing_advertising',
    'integrated_marketing': 'marketing_advertising',
    'experiential_marketing': 'marketing_advertising',
    'experiential': 'marketing_advertising',
    'event_marketing': 'marketing_advertising',
    'brand_experience': 'marketing_advertising',
    'brand_activation': 'marketing_advertising',
    'sports_marketing': 'marketing_advertising',
    'digital_agency': 'marketing_advertising',
    'creative_agency': 'marketing_advertising',
    'media_agency': 'marketing_advertising',
    'shopper_marketing': 'marketing_advertising',
    'b2b_marketing': 'marketing_advertising',
    'healthcare_marketing': 'marketing_advertising',
    'social_media_marketing': 'marketing_advertising',
    'agency': 'marketing_advertising'
  };
  
  let industryKey = industry.toLowerCase().replace(/[\s\-]+/g, '_');
  
  // First, check if this industry string might actually be a subcategory
  let mappedIndustry = industryMapping[industryKey];
  if (mappedIndustry) {
    if (!subCategory) {
      // Use the original as subcategory if we don't have one
      subCategory = industryKey;
    }
    industryKey = mappedIndustry;
  }
  
  // Try to find the industry data
  let industryData = INDUSTRY_COMPETITORS_DETAILED[industryKey];
  
  // If still not found, try fuzzy matching
  if (!industryData) {
    // Check if any industry key contains our search term
    for (const [key, data] of Object.entries(INDUSTRY_COMPETITORS_DETAILED)) {
      if (key.includes(industryKey) || industryKey.includes(key)) {
        industryData = data;
        industryKey = key;
        break;
      }
    }
  }
  
  // If still not found, try to match against subcategory names
  if (!industryData) {
    for (const [mainIndustry, data] of Object.entries(INDUSTRY_COMPETITORS_DETAILED)) {
      for (const subCat of Object.keys(data)) {
        if (subCat === industryKey || subCat.includes(industryKey)) {
          industryData = data;
          subCategory = subCat;
          industryKey = mainIndustry;
          break;
        }
      }
      if (industryData) break;
    }
  }
  
  if (!industryData) {
    console.log(`No competitor data for industry: ${industry} (searched for: ${industryKey})`);
    // Return empty array instead of failing
    return [];
  }
  
  // If subcategory specified, try to get those competitors
  if (subCategory) {
    const subCategoryKey = subCategory.toLowerCase().replace(/[\s\-]+/g, '_');
    const subCompetitors = industryData[subCategoryKey];
    
    if (subCompetitors) {
      return subCompetitors.slice(0, maxCount);
    }
  }
  
  // Fall back to general competitors for the industry
  return industryData.general?.slice(0, maxCount) || [];
}

// Method to discover what sub-category an organization belongs to
export function discoverSubCategory(organization: string, industry: string, description: string = ''): string | null {
  const industryKey = industry.toLowerCase().replace(/[\s\-]+/g, '_');
  const industryData = INDUSTRY_COMPETITORS_DETAILED[industryKey];
  
  if (!industryData) return null;
  
  // First, check if org name appears in any subcategory's competitor list
  const orgLower = organization.toLowerCase();
  for (const [subCategory, competitors] of Object.entries(industryData)) {
    if (subCategory === 'general') continue;
    if (Array.isArray(competitors)) {
      for (const comp of competitors) {
        if (comp.toLowerCase().includes(orgLower) || orgLower.includes(comp.toLowerCase())) {
          console.log(`   🎯 Matched ${organization} to ${subCategory} via competitor list`);
          return subCategory;
        }
      }
    }
  }

  // Keywords to match for each sub-category
  const subCategoryKeywords = {
    technology: {
      ai_ml: ['artificial intelligence', 'AI', 'machine learning', 'LLM', 'neural', 'deep learning', 'anthropic', 'openai', 'claude', 'gpt', 'chatgpt', 'foundation model', 'large language model', 'generative ai'],
      cybersecurity: ['security', 'firewall', 'threat', 'vulnerability', 'encryption', 'cyber'],
      saas_enterprise: ['SaaS', 'cloud software', 'enterprise software', 'subscription software'],
      fintech: ['payments', 'financial technology', 'banking platform', 'trading', 'crypto'],
      cloud_infrastructure: ['cloud computing', 'IaaS', 'PaaS', 'hosting', 'data center'],
      semiconductor: ['chip', 'processor', 'semiconductor', 'silicon', 'GPU', 'CPU'],
      social_media: ['social network', 'social platform', 'community', 'messaging'],
      gaming: ['gaming', 'video game', 'esports', 'game development'],
      ecommerce_platforms: ['ecommerce', 'online store', 'marketplace', 'shopping platform']
    },
    marketing_advertising: {
      experiential_marketing: ['experiential', 'brand experience', 'live experience', 'immersive', 'activation', 'pop-up', 'live marketing', 'consumer experience'],
      integrated_marketing: ['integrated', 'full-service', '360', 'omnichannel', 'multichannel', 'cross-channel'],
      brand_experience: ['brand activation', 'brand experience', 'consumer engagement', 'live brand'],
      event_marketing: ['event', 'trade show', 'conference', 'exhibition', 'convention', 'live event', 'corporate event'],
      sports_marketing: ['sports', 'athlete', 'sponsorship', 'stadium', 'team', 'league', 'esports'],
      creative_agency: ['creative', 'advertising', 'campaign', 'brand identity', 'creative services'],
      media_agency: ['media buying', 'media planning', 'programmatic', 'media strategy'],
      digital_marketing: ['digital', 'online marketing', 'web marketing', 'digital strategy'],
      content_marketing: ['content', 'editorial', 'storytelling', 'branded content'],
      influencer_marketing: ['influencer', 'creator', 'ambassador', 'talent', 'celebrity'],
      social_media_marketing: ['social media', 'social strategy', 'community management'],
      performance_marketing: ['performance', 'growth marketing', 'acquisition', 'CPA', 'ROI-driven'],
      shopper_marketing: ['shopper', 'retail marketing', 'in-store', 'point of sale', 'CPG'],
      public_relations: ['PR', 'public relations', 'media relations', 'press', 'earned media', 'publicity'],
      strategic_communications: ['corporate communications', 'reputation', 'crisis', 'investor relations'],
      healthcare_marketing: ['healthcare', 'pharma marketing', 'medical marketing', 'HCP'],
      b2b_marketing: ['B2B', 'business-to-business', 'enterprise marketing', 'demand gen', 'ABM']
    },
    healthcare: {
      pharma_big: ['pharmaceutical', 'drug', 'medicine', 'therapeutic'],
      biotech: ['biotech', 'gene', 'CRISPR', 'biologics', 'mRNA'],
      medical_devices: ['medical device', 'medical equipment', 'diagnostic device'],
      healthtech: ['digital health', 'telehealth', 'health platform', 'health app'],
      health_insurance: ['health insurance', 'health plan', 'managed care', 'HMO']
    },
    finance: {
      retail_banking: ['retail banking', 'consumer banking', 'checking', 'savings'],
      investment_banking: ['investment banking', 'M&A', 'underwriting', 'capital markets'],
      digital_banks: ['digital bank', 'neobank', 'online bank', 'challenger bank'],
      wealth_management: ['wealth management', 'asset management', 'financial advisory'],
      private_equity: ['private equity', 'PE firm', 'buyout', 'LBO'],
      venture_capital: ['venture capital', 'VC', 'startup investment', 'seed funding']
    },
    automotive: {
      electric_vehicles: ['electric vehicle', 'EV', 'battery electric', 'Tesla competitor'],
      luxury: ['luxury car', 'premium vehicle', 'luxury automotive'],
      mass_market: ['mass market', 'affordable', 'mainstream automotive']
    },
    retail: {
      apparel_retail: ['clothing', 'apparel', 'fashion', 'menswear', 'womenswear', 'garment', 'dress', 'shirt', 'pants', 'jeans', 'streetwear', 'workwear'],
      luxury_retail: ['luxury', 'premium', 'high-end', 'designer', 'haute couture', 'luxury goods'],
      mass_merchants: ['discount', 'general merchandise', 'big box', 'wholesale club', 'value retailer'],
      grocery: ['grocery', 'supermarket', 'food retail', 'organic food', 'fresh produce'],
      home_improvement: ['home improvement', 'hardware', 'home renovation', 'DIY', 'building materials', 'furniture', 'home goods']
    }
  };
  
  const keywords = subCategoryKeywords[industryKey];
  if (!keywords) return null;
  
  const searchText = `${organization} ${description}`.toLowerCase();
  
  // Find best matching sub-category
  let bestMatch = null;
  let bestScore = 0;
  
  for (const [subCategory, terms] of Object.entries(keywords)) {
    let score = 0;
    for (const term of terms) {
      if (searchText.includes(term.toLowerCase())) {
        score += 1;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = subCategory;
    }
  }
  
  return bestMatch;
}