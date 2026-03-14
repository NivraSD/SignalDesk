// Shared entity database used across LP modules
// Groups > Categories > Entity names

export type EntityDatabaseType = Record<string, { icon: string; categories: Record<string, string[]> }>

export const ENTITY_DATABASE: EntityDatabaseType = {
  // Government & Politics
  us_government: {
    icon: 'landmark',
    categories: {
      executive_branch: ['White House', 'Department of State', 'Department of Defense', 'Department of Treasury', 'Department of Justice', 'Department of Commerce', 'EPA', 'FDA', 'FTC', 'SEC'],
      key_regulators: ['SEC', 'FTC', 'FDA', 'EPA', 'FCC', 'CFPB', 'OSHA', 'NHTSA', 'FAA', 'CFTC'],
      intelligence_agencies: ['CIA', 'NSA', 'FBI', 'DHS', 'DNI', 'NRO', 'DIA', 'Secret Service', 'ATF', 'DEA']
    }
  },
  us_congress: {
    icon: 'landmark',
    categories: {
      senate_leadership: ['Chuck Schumer', 'Mitch McConnell', 'John Thune', 'Dick Durbin', 'John Barrasso', 'Shelley Moore Capito', 'Patty Murray', 'Tom Cotton'],
      senate_tech_commerce: ['Maria Cantwell', 'Ted Cruz', 'Amy Klobuchar', 'Marsha Blackburn', 'Brian Schatz', 'John Hickenlooper', 'Cynthia Lummis', 'Mark Warner'],
      senate_finance: ['Ron Wyden', 'Mike Crapo', 'Elizabeth Warren', 'Tim Scott', 'Sherrod Brown', 'Bob Menendez', 'Bill Hagerty', 'Catherine Cortez Masto'],
      house_leadership: ['Mike Johnson', 'Hakeem Jeffries', 'Steve Scalise', 'Katherine Clark', 'Tom Emmer', 'Pete Aguilar', 'Elise Stefanik', 'James Clyburn']
    }
  },
  international_leaders: {
    icon: 'landmark',
    categories: {
      g7_leaders: ['Joe Biden (US)', 'Keir Starmer (UK)', 'Emmanuel Macron (France)', 'Olaf Scholz (Germany)', 'Giorgia Meloni (Italy)', 'Justin Trudeau (Canada)', 'Shigeru Ishiba (Japan)'],
      tech_policy_leaders: ['Ursula von der Leyen (EU)', 'Thierry Breton (EU)', 'Margrethe Vestager (EU)', 'Narendra Modi (India)', 'Xi Jinping (China)']
    }
  },

  // Media & Journalism
  tech_journalists: {
    icon: 'newspaper',
    categories: {
      ai_reporters: ['Kara Swisher', 'Casey Newton', 'Will Oremus', 'Kevin Roose', 'Cade Metz', 'Karen Hao', 'James Vincent', 'Zoe Schiffer', 'Alex Kantrowitz', 'Emily Chang'],
      tech_columnists: ['Ben Thompson', 'John Gruber', 'MG Siegler', 'Om Malik', 'Joanna Stern', 'Nilay Patel', 'Marques Brownlee', 'Dieter Bohn', 'David Pierce', 'Lauren Goode']
    }
  },
  business_journalists: {
    icon: 'newspaper',
    categories: {
      financial_press: ['Andrew Ross Sorkin', 'David Faber', 'Jim Cramer', 'Sara Eisen', 'Becky Quick', 'Joe Kernen', 'Scott Wapner', 'Carl Quintanilla'],
      investigative: ['Ronan Farrow', 'Matt Taibbi', 'Bethany McLean', 'Jesse Eisinger', 'Gretchen Morgenson', 'David Enrich', 'Emily Steel', 'Kate Kelly']
    }
  },
  media_outlets: {
    icon: 'newspaper',
    categories: {
      mainstream: ['New York Times', 'Wall Street Journal', 'Washington Post', 'Bloomberg', 'Reuters', 'Associated Press', 'CNN', 'MSNBC', 'Fox News', 'NBC News'],
      tech_focused: ['TechCrunch', 'The Verge', 'Wired', 'Ars Technica', 'The Information', 'Platformer', 'Stratechery', 'Semafor', '404 Media', 'Rest of World']
    }
  },

  // Tech Executives & Influencers
  tech_executives: {
    icon: 'lightbulb',
    categories: {
      ai_leaders: ['Sam Altman', 'Dario Amodei', 'Demis Hassabis', 'Satya Nadella', 'Sundar Pichai', 'Mark Zuckerberg', 'Elon Musk', 'Jensen Huang', 'Arvind Krishna', 'Thomas Kurian'],
      startup_founders: ['Brian Chesky', 'Patrick Collison', 'Drew Houston', 'Stewart Butterfield', 'Daniel Ek', 'Whitney Wolfe Herd', 'Vlad Tenev', 'Tobi Lutke', 'Melanie Perkins', 'Dylan Field'],
      vc_investors: ['Marc Andreessen', 'Ben Horowitz', 'Reid Hoffman', 'Peter Thiel', 'Mary Meeker', 'John Doerr', 'Vinod Khosla', 'Bill Gurley', 'Aileen Lee', 'Kirsten Green']
    }
  },
  tech_influencers: {
    icon: 'lightbulb',
    categories: {
      twitter_tech: ['Paul Graham', 'Naval Ravikant', 'Balaji Srinivasan', 'Jason Calacanis', 'Benedict Evans', 'Chamath Palihapitiya', 'David Sacks', 'Garry Tan', 'Packy McCormick', 'Lenny Rachitsky'],
      ai_researchers: ['Andrej Karpathy', 'Yann LeCun', 'Andrew Ng', 'Fei-Fei Li', 'Geoffrey Hinton', 'Ilya Sutskever', 'Gary Marcus', 'Yoshua Bengio', 'Ian Goodfellow', 'Sebastian Thrun']
    }
  },

  // Advocacy & Activism
  tech_advocacy: {
    icon: 'scale',
    categories: {
      ai_safety: ['Center for AI Safety', 'Future of Life Institute', 'Machine Intelligence Research Institute', 'AI Now Institute', 'Partnership on AI', 'Center for Human-Compatible AI', 'Alignment Forum', 'EleutherAI', 'Conjecture', 'Redwood Research'],
      digital_rights: ['Electronic Frontier Foundation', 'ACLU', 'Access Now', 'Fight for the Future', 'Public Knowledge', 'Free Press', 'Demand Progress', 'Mozilla Foundation', 'Internet Archive', 'Creative Commons'],
      tech_accountability: ['Tech Transparency Project', 'Accountable Tech', 'Center for Humane Technology', 'Data & Society', 'AI Policy Institute', 'Integrity Institute', 'Stanford Internet Observatory', 'Tech Oversight Project', 'Foxglove', 'AlgorithmWatch']
    }
  },
  environmental: {
    icon: 'tree',
    categories: {
      major_ngos: ['Sierra Club', 'Greenpeace', 'Environmental Defense Fund', 'Natural Resources Defense Council', 'World Wildlife Fund', 'The Nature Conservancy', 'Earthjustice', '350.org', 'Sunrise Movement', 'Climate Reality Project'],
      climate_activists: ['Greta Thunberg', 'Bill McKibben', 'Vanessa Nakate', 'Xiye Bastida', 'Jamie Margolin', 'Alexandria Villaseñor', 'Jerome Foster II', 'Isra Hirsi', 'Luisa Neubauer', 'Licypriya Kangujam'],
      climate_scientists: ['Michael Mann', 'Katharine Hayhoe', 'James Hansen', 'Gavin Schmidt', 'Peter Kalmus', 'Kim Cobb', 'Leah Stokes', 'Ayana Elizabeth Johnson', 'Jonathan Foley', 'Marshall Burke']
    }
  },

  // Think Tanks & Research
  think_tanks: {
    icon: 'graduation',
    categories: {
      tech_policy: ['Brookings Institution', 'RAND Corporation', 'Center for Strategic and International Studies', 'New America', 'Information Technology and Innovation Foundation', 'R Street Institute', 'Aspen Institute', 'Wilson Center', 'German Marshall Fund', 'Atlantic Council'],
      economic: ['Peterson Institute', 'American Enterprise Institute', 'Cato Institute', 'Heritage Foundation', 'Economic Policy Institute', 'Center on Budget and Policy Priorities', 'Tax Foundation', 'Mercatus Center', 'Roosevelt Institute', 'Niskanen Center']
    }
  },
  academic: {
    icon: 'graduation',
    categories: {
      ai_research_labs: ['Stanford HAI', 'MIT CSAIL', 'Berkeley AI Research', 'CMU AI', 'Google Brain', 'DeepMind', 'Meta AI Research', 'Microsoft Research', 'OpenAI Research', 'Anthropic Research'],
      tech_policy_centers: ['Stanford Cyber Policy Center', 'Berkman Klein Center (Harvard)', 'Oxford Internet Institute', 'MIT Media Lab', 'Princeton CITP', 'Georgetown Law Tech Institute', 'NYU Tandon', 'UC Berkeley CLTC', 'Cambridge CFI', 'Montreal AI Ethics Institute']
    }
  },

  // Industries
  technology: {
    icon: 'building',
    categories: {
      big_tech: ['Apple', 'Microsoft', 'Google', 'Amazon', 'Meta', 'NVIDIA', 'Tesla', 'Oracle', 'IBM', 'Salesforce'],
      ai_companies: ['OpenAI', 'Anthropic', 'Google DeepMind', 'xAI', 'Mistral AI', 'Cohere', 'Inflection AI', 'Perplexity', 'Stability AI', 'Hugging Face'],
      cybersecurity: ['Palo Alto Networks', 'CrowdStrike', 'Fortinet', 'Zscaler', 'SentinelOne', 'CyberArk', 'Okta', 'Cloudflare', 'Check Point', 'Rapid7'],
      fintech: ['Stripe', 'Square', 'PayPal', 'Adyen', 'Klarna', 'Plaid', 'Chime', 'Robinhood', 'Coinbase', 'Revolut'],
      semiconductors: ['NVIDIA', 'Intel', 'AMD', 'Qualcomm', 'Broadcom', 'TSMC', 'ASML', 'Applied Materials', 'Micron', 'Texas Instruments']
    }
  },
  healthcare: {
    icon: 'building',
    categories: {
      big_pharma: ['Pfizer', 'Johnson & Johnson', 'Roche', 'Novartis', 'Merck', 'AbbVie', 'Bristol Myers Squibb', 'AstraZeneca', 'Sanofi', 'GSK'],
      biotech: ['Moderna', 'Regeneron', 'Vertex', 'Biogen', 'Illumina', 'BioNTech', 'Amgen', 'Gilead', 'CRISPR Therapeutics', 'Alnylam'],
      health_insurance: ['UnitedHealth', 'Anthem', 'CVS Health (Aetna)', 'Cigna', 'Humana', 'Centene', 'Kaiser Permanente', 'Blue Cross Blue Shield', 'Molina', 'Oscar Health']
    }
  },
  finance: {
    icon: 'building',
    categories: {
      major_banks: ['JPMorgan Chase', 'Bank of America', 'Wells Fargo', 'Citigroup', 'Goldman Sachs', 'Morgan Stanley', 'US Bank', 'PNC', 'Truist', 'Capital One'],
      asset_managers: ['BlackRock', 'Vanguard', 'Fidelity', 'State Street', 'Charles Schwab', 'T. Rowe Price', 'Franklin Templeton', 'Invesco', 'PIMCO', 'Wellington'],
      venture_capital: ['Sequoia Capital', 'Andreessen Horowitz', 'Accel', 'Benchmark', 'Greylock', 'Kleiner Perkins', 'GV', 'Insight Partners', 'NEA', 'Tiger Global']
    }
  },
  energy: {
    icon: 'building',
    categories: {
      oil_majors: ['ExxonMobil', 'Chevron', 'Shell', 'BP', 'TotalEnergies', 'ConocoPhillips', 'Equinor', 'Eni', 'Petrobras', 'Saudi Aramco'],
      renewable: ['NextEra Energy', 'Iberdrola', 'Orsted', 'Enel', 'Vestas', 'First Solar', 'Enphase Energy', 'SunPower', 'Brookfield Renewable', 'Canadian Solar']
    }
  },
  automotive: {
    icon: 'building',
    categories: {
      legacy_oems: ['Toyota', 'Volkswagen', 'General Motors', 'Ford', 'Stellantis', 'Honda', 'Nissan', 'Hyundai-Kia', 'BMW', 'Mercedes-Benz'],
      ev_companies: ['Tesla', 'Rivian', 'Lucid Motors', 'NIO', 'BYD', 'XPeng', 'Li Auto', 'Polestar', 'VinFast', 'Fisker'],
      autonomous: ['Waymo', 'Cruise', 'Aurora', 'Motional', 'Nuro', 'Zoox', 'TuSimple', 'Pony.ai', 'Mobileye', 'Argo AI']
    }
  },
  media_entertainment: {
    icon: 'building',
    categories: {
      streaming: ['Netflix', 'Disney+', 'Amazon Prime Video', 'HBO Max', 'Hulu', 'Paramount+', 'Peacock', 'Apple TV+', 'YouTube Premium', 'Spotify'],
      studios: ['Walt Disney', 'Warner Bros Discovery', 'Paramount', 'NBCUniversal', 'Sony Pictures', 'Lionsgate', 'A24', 'Netflix Studios', 'Amazon Studios', 'Apple Studios'],
      gaming: ['Microsoft (Xbox)', 'Sony (PlayStation)', 'Nintendo', 'Tencent', 'Activision Blizzard', 'Electronic Arts', 'Take-Two', 'Ubisoft', 'Epic Games', 'Roblox']
    }
  },
  retail: {
    icon: 'building',
    categories: {
      ecommerce: ['Amazon', 'Shopify', 'eBay', 'Etsy', 'Wayfair', 'Chewy', 'Alibaba', 'JD.com', 'Pinduoduo', 'MercadoLibre'],
      big_box: ['Walmart', 'Target', 'Costco', 'Home Depot', 'Lowes', 'Best Buy', 'Kroger', 'CVS', 'Walgreens', 'Dollar General']
    }
  }
}

// Format category/group names for display
export function formatEntityName(name: string): string {
  return name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}

// Get all entity names as a flat set
export function getAllEntityNames(): Set<string> {
  const names = new Set<string>()
  for (const group of Object.values(ENTITY_DATABASE)) {
    for (const entities of Object.values(group.categories)) {
      for (const name of entities) {
        names.add(name)
      }
    }
  }
  return names
}

// Get total entity count
export function getEntityCount(): number {
  let count = 0
  for (const group of Object.values(ENTITY_DATABASE)) {
    for (const entities of Object.values(group.categories)) {
      count += entities.length
    }
  }
  return count
}
