// =====================================================
// COMPREHENSIVE JOURNALIST REGISTRY WITH CONTACT INFO
// Updated: October 2025
// =====================================================

// OUTLET EMAIL FORMAT REFERENCE
// Use this to construct likely emails for journalists
export const EMAIL_FORMAT_GUIDE = {
  'New York Times': 'firstname.lastname@nytimes.com (primary 64%)',
  'Wall Street Journal': 'firstname.lastname@wsj.com (primary 97%)',
  'Bloomberg': 'flastname@bloomberg.net (primary)',
  'Washington Post': 'firstname.lastname@washpost.com',
  'Reuters': 'firstname.lastname@reuters.com or @thomsonreuters.com',
  'Financial Times': 'firstname.lastname@ft.com',
  'TechCrunch': 'firstname@techcrunch.com or firstname.lastname@techcrunch.com',
  'CNBC': 'firstname.lastname@nbcuni.com (primary 82%)',
  'Axios': 'firstname.lastname@axios.com (primary 86%)',
  'The Verge': 'firstname@theverge.com',
  'Wired': 'firstname_lastname@wired.com',
  'Forbes': 'firstname.lastname@forbes.com',
  'Fortune': 'firstname.lastname@fortune.com',
  'Insider/Business Insider': 'flastname@insider.com or @businessinsider.com',
  'STAT News': 'firstname.lastname@statnews.com',
  'The Information': 'firstname@theinformation.com',
  'Vox': 'firstname@vox.com',
  'Ars Technica': 'firstname.lastname@arstechnica.com'
};

// =====================================================
// TIER 1 OUTLETS - ORGANIZED BY BEAT
// =====================================================

export const TIER1_OUTLETS = {
  
  'New York Times': {
    domain: '@nytimes.com',
    format: 'firstname.lastname@nytimes.com',
    journalists: {
      technology: [
        { name: 'Mike Isaac', beat: 'Meta, Social Media', twitter: '@MikeIsaac', email: 'mike.isaac@nytimes.com' },
        { name: 'Daisuke Wakabayashi', beat: 'Google, Tech Companies', twitter: '@daiwaka', email: 'daisuke.wakabayashi@nytimes.com' },
        { name: 'Ryan Mac', beat: 'Tech Accountability', twitter: '@RMac18', email: 'ryan.mac@nytimes.com' },
        { name: 'Sheera Frenkel', beat: 'Cybersecurity, Disinformation', twitter: '@sheeraf', email: 'sheera.frenkel@nytimes.com' },
        { name: 'Cecilia Kang', beat: 'Tech Policy & Regulation', twitter: '@ceciliakang', email: 'cecilia.kang@nytimes.com' },
        { name: 'Kevin Roose', beat: 'Tech & AI', twitter: '@kevinroose', email: 'kevin.roose@nytimes.com' },
        { name: 'Cade Metz', beat: 'AI & Emerging Tech', twitter: '@CadeMetz', email: 'cade.metz@nytimes.com' },
        { name: 'Kate Conger', beat: 'Cybersecurity', twitter: '@kateconger', email: 'kate.conger@nytimes.com' },
        { name: 'Karen Weise', beat: 'Amazon, Tech', twitter: '@kareneweise', email: 'karen.weise@nytimes.com' }
      ],
      business: [
        { name: 'Andrew Ross Sorkin', beat: 'Business & Finance', twitter: '@andrewrsorkin', email: 'andrew.sorkin@nytimes.com' },
        { name: 'David Gelles', beat: 'Business & Climate', twitter: '@gelles', email: 'david.gelles@nytimes.com' },
        { name: 'Maureen Farrell', beat: 'Business & Finance', twitter: '@maureenfarrell', email: 'maureen.farrell@nytimes.com' },
        { name: 'Erin Griffith', beat: 'Startups & VC', twitter: '@eringriffith', email: 'erin.griffith@nytimes.com' }
      ],
      healthcare: [
        { name: 'Rebecca Robbins', beat: 'Pharma & Healthcare', twitter: '@RebeccaDRobbins', email: 'rebecca.robbins@nytimes.com' },
        { name: 'Katie Thomas', beat: 'Pharmaceuticals', twitter: '@katiejthomas', email: 'katie.thomas@nytimes.com' },
        { name: 'Sarah Kliff', beat: 'Healthcare Policy', twitter: '@sarahkliff', email: 'sarah.kliff@nytimes.com' }
      ],
      climate: [
        { name: 'Hiroko Tabuchi', beat: 'Climate & Environment', twitter: '@HirokoTabuchi', email: 'hiroko.tabuchi@nytimes.com' },
        { name: 'Coral Davenport', beat: 'Climate Policy', twitter: '@CoralMDavenport', email: 'coral.davenport@nytimes.com' }
      ],
      retail: [
        { name: 'Sapna Maheshwari', beat: 'Retail & Business', twitter: '@sapna', email: 'sapna.maheshwari@nytimes.com' },
        { name: 'Michael Corkery', beat: 'Food & Retail', twitter: '@mcorkery5', email: 'michael.corkery@nytimes.com' }
      ],
      media: [
        { name: 'Edmund Lee', beat: 'Media', twitter: '@edmundlee', email: 'edmund.lee@nytimes.com' },
        { name: 'Benjamin Mullin', beat: 'Media', twitter: '@BenMullin', email: 'benjamin.mullin@nytimes.com' }
      ],
      real_estate: [
        { name: 'Stefanos Chen', beat: 'Real Estate', twitter: '@stefanoschen', email: 'stefanos.chen@nytimes.com' },
        { name: 'Lauren Hirsch', beat: 'Real Estate & Business', twitter: '@LaurenSHirsch', email: 'lauren.hirsch@nytimes.com' }
      ],
      automotive: [
        { name: 'Neal E. Boudette', beat: 'Automotive', twitter: '@Boudette', email: 'neal.boudette@nytimes.com' }
      ],
      space: [
        { name: 'Joey Roulette', beat: 'Space', twitter: '@joroulette', email: 'joey.roulette@nytimes.com' }
      ],
      labor: [
        { name: 'Noam Scheiber', beat: 'Labor & Workplace', twitter: '@noamscheiber', email: 'noam.scheiber@nytimes.com' },
        { name: 'Emma Goldberg', beat: 'Workplace', twitter: '@GoldbergEmma', email: 'emma.goldberg@nytimes.com' }
      ],
      crypto: [
        { name: 'David Yaffe-Bellany', beat: 'Crypto', twitter: '@davidyaffe', email: 'david.yaffe-bellany@nytimes.com' }
      ]
    }
  },

  'Wall Street Journal': {
    domain: '@wsj.com',
    format: 'firstname.lastname@wsj.com',
    journalists: {
      technology: [
        { name: 'Deepa Seetharaman', beat: 'Social Media & Tech', twitter: '@dpsFT', email: 'deepa.seetharaman@wsj.com' },
        { name: 'Aaron Tilley', beat: 'Apple, Tech', twitter: '@aatilley', email: 'aaron.tilley@wsj.com' },
        { name: 'Christopher Mims', beat: 'Technology', twitter: '@mims', email: 'christopher.mims@wsj.com' }
      ],
      ai: [
        { name: 'Isabelle Bousquette', beat: 'AI & Tech', twitter: '@ibousquette', email: 'isabelle.bousquette@wsj.com' }
      ],
      fintech: [
        { name: 'Telis Demos', beat: 'Banking & Finance', twitter: '@telisdemos', email: 'telis.demos@wsj.com' },
        { name: 'Peter Rudegeair', beat: 'Banking', twitter: '@rudegeair', email: 'peter.rudegeair@wsj.com' }
      ],
      retail: [
        { name: 'Suzanne Kapner', beat: 'Retail', twitter: '@SuzanneKapner', email: 'suzanne.kapner@wsj.com' },
        { name: 'Sarah Nassauer', beat: 'Walmart & Retail', twitter: '@sarahnassauer', email: 'sarah.nassauer@wsj.com' }
      ],
      media: [
        { name: 'Joe Flint', beat: 'Media', twitter: '@JBFlint', email: 'joe.flint@wsj.com' }
      ],
      advertising: [
        { name: 'Suzanne Vranica', beat: 'Advertising', twitter: '@svranica', email: 'suzanne.vranica@wsj.com' }
      ],
      real_estate: [
        { name: 'Konrad Putzier', beat: 'Commercial Real Estate', twitter: '@KonradPutzier', email: 'konrad.putzier@wsj.com' },
        { name: 'Will Parker', beat: 'Real Estate', twitter: '@WRParker', email: 'will.parker@wsj.com' }
      ],
      automotive: [
        { name: 'Mike Colias', beat: 'Automotive', twitter: '@MikeColias', email: 'mike.colias@wsj.com' }
      ],
      venture_capital: [
        { name: 'Preetika Rana', beat: 'Venture Capital', twitter: '@preeti_rana', email: 'preetika.rana@wsj.com' }
      ],
      labor: [
        { name: 'Lauren Weber', beat: 'Workplace', twitter: '@LaurenWeberWSJ', email: 'lauren.weber@wsj.com' },
        { name: 'Chip Cutter', beat: 'Workplace & Management', twitter: '@chipcutter', email: 'chip.cutter@wsj.com' },
        { name: 'Rachel Feintzeig', beat: 'Management & Leadership', twitter: '@rachelfeintzeig', email: 'rachel.feintzeig@wsj.com' }
      ],
      food: [
        { name: 'Jesse Newman', beat: 'Food & Agriculture', twitter: '@jessenewmanWSJ', email: 'jesse.newman@wsj.com' }
      ],
      policy: [
        { name: 'Dave Michaels', beat: 'Financial Regulation', twitter: '@dave_michaels', email: 'dave.michaels@wsj.com' }
      ],
      business: [
        { name: 'Jason Zweig', beat: 'Personal Finance', twitter: '@jasonzweigwsj', email: 'jason.zweig@wsj.com' }
      ],
      climate: [
        { name: 'Gautam Naik', beat: 'Climate & Science', twitter: '@gautamnaik', email: 'gautam.naik@wsj.com' }
      ]
    }
  },

  'Bloomberg': {
    domain: '@bloomberg.net',
    format: 'flastname@bloomberg.net',
    contactEmail: 'tips2@bloomberg.net',
    journalists: {
      technology: [
        { name: 'Katie Roof', beat: 'Venture Capital', twitter: '@Katie_Roof', email: 'kroof@bloomberg.net' },
        { name: 'Mark Gurman', beat: 'Apple', twitter: '@markgurman', email: 'mgurman@bloomberg.net' },
        { name: 'Kurt Wagner', beat: 'Social Media', twitter: '@KurtWagner8', email: 'kwagner6@bloomberg.net' },
        { name: 'Sarah Frier', beat: 'Social Media', twitter: '@sarahfrier', email: 'sfrier@bloomberg.net' },
        { name: 'Emily Chang', beat: 'Tech & Venture Capital', twitter: '@emilychangtv', email: 'echang38@bloomberg.net' },
        { name: 'Jon Erlichman', beat: 'Tech & Business', twitter: '@JonErlichman', email: 'jerlichman@bloomberg.net' }
      ],
      ai: [
        { name: 'Rachel Metz', beat: 'AI', twitter: '@rachelmetz', email: 'rmetz@bloomberg.net' }
      ],
      cryptocurrency: [
        { name: 'Muyao Shen', beat: 'Crypto', twitter: '@muyaoshen', email: 'mshen66@bloomberg.net' },
        { name: 'Olga Kharif', beat: 'Cryptocurrency', twitter: '@olgakharif', email: 'okharif@bloomberg.net' }
      ],
      fintech: [
        { name: 'Hannah Miller', beat: 'Fintech', twitter: '@hannahmiller12', email: 'hmiller127@bloomberg.net' }
      ],
      media: [
        { name: 'Lucas Shaw', beat: 'Entertainment & Streaming', twitter: '@Lucas_Shaw', email: 'lshaw12@bloomberg.net' }
      ],
      climate: [
        { name: 'Akshat Rathi', beat: 'Climate & Energy', twitter: '@akshatrathi', email: 'arathi@bloomberg.net' },
        { name: 'Brian Eckhouse', beat: 'Renewable Energy', twitter: '@brianeckhouse', email: 'beckhouse@bloomberg.net' }
      ],
      venture_capital: [
        { name: 'Gillian Tan', beat: 'Private Equity', twitter: '@gillianwtan', email: 'gtan11@bloomberg.net' }
      ],
      policy: [
        { name: 'Emily Birnbaum', beat: 'Tech Policy', twitter: '@birnbaum_e', email: 'ebirnbaum4@bloomberg.net' },
        { name: 'Leah Nylen', beat: 'Antitrust', twitter: '@leah_nylen', email: 'lnylen@bloomberg.net' }
      ],
      business: [
        { name: 'Matt Levine', beat: 'Finance & Markets', twitter: '@matt_levine', email: 'mlevine51@bloomberg.net' }
      ]
    }
  },

  'Washington Post': {
    domain: '@washpost.com',
    format: 'firstname.lastname@washpost.com',
    journalists: {
      technology: [
        { name: 'Shira Ovide', beat: 'Tech Culture', twitter: '@ShiraOvide', email: 'shira.ovide@washpost.com' },
        { name: 'Gerrit De Vynck', beat: 'Big Tech', twitter: '@gerritv', email: 'gerrit.devynck@washpost.com' },
        { name: 'Cat Zakrzewski', beat: 'Tech Policy', twitter: '@cat_zakrzewski', email: 'catherine.zakrzewski@washpost.com' }
      ],
      policy: [
        { name: 'Tony Romm', beat: 'Tech Policy', twitter: '@TonyRomm', email: 'tony.romm@washpost.com' },
        { name: 'Cristiano Lima', beat: 'Tech Policy', twitter: '@viaCristiano', email: 'cristiano.lima@washpost.com' }
      ],
      automotive: [
        { name: 'Faiz Siddiqui', beat: 'Transportation', twitter: '@faizsays', email: 'faiz.siddiqui@washpost.com' }
      ],
      cybersecurity: [
        { name: 'Joseph Menn', beat: 'Cybersecurity', twitter: '@josephmenn', email: 'joseph.menn@washpost.com' }
      ],
      space: [
        { name: 'Christian Davenport', beat: 'Space', twitter: '@wapodavenport', email: 'christian.davenport@washpost.com' }
      ]
    }
  },

  'Reuters': {
    domain: '@reuters.com or @thomsonreuters.com',
    format: 'firstname.lastname@reuters.com',
    journalists: {
      ai: [
        { name: 'Max A. Cherney', beat: 'AI', twitter: '@maxcherney', email: 'max.cherney@reuters.com' }
      ]
    }
  },

  'Financial Times': {
    domain: '@ft.com',
    format: 'firstname.lastname@ft.com',
    journalists: {
      venture_capital: [
        { name: 'Miles Kruppa', beat: 'Tech & VC', twitter: '@mileskruppa', email: 'miles.kruppa@ft.com' }
      ]
    }
  }
};

// =====================================================
// TIER 2 OUTLETS - ORGANIZED BY BEAT
// =====================================================

export const TIER2_OUTLETS = {
  
  'TechCrunch': {
    domain: '@techcrunch.com',
    format: 'firstname@techcrunch.com or firstname.lastname@techcrunch.com',
    journalists: {
      technology: [
        { name: 'Connie Loizos', beat: 'Venture Capital', twitter: '@cookie', email: 'connie@techcrunch.com', verifiedEmail: 'connie@strictlyvc.com' },
        { name: 'Ron Miller', beat: 'Enterprise Tech', twitter: '@ron_miller', email: 'ron.miller@techcrunch.com' },
        { name: 'Natasha Mascarenhas', beat: 'Startups', twitter: '@nmasc_', email: 'natasha.mascarenhas@techcrunch.com' }
      ],
      ai: [
        { name: 'Kyle Wiggers', beat: 'AI', twitter: '@Kyle_L_Wiggers', email: 'kyle.wiggers@techcrunch.com' },
        { name: 'Devin Coldewey', beat: 'AI & Emerging Tech', twitter: '@technosaurus', email: 'devin@techcrunch.com' }
      ],
      fintech: [
        { name: 'Mary Ann Azevedo', beat: 'Fintech & Venture Capital', twitter: '@azevedo_mary', email: 'maryann.azevedo@techcrunch.com' }
      ],
      cybersecurity: [
        { name: 'Lorenzo Franceschi-Bicchierai', beat: 'Cybersecurity', twitter: '@lorenzofb', email: 'lorenzo@techcrunch.com' },
        { name: 'Zack Whittaker', beat: 'Security & Privacy', twitter: '@zackwhittaker', email: 'zack.whittaker@techcrunch.com' }
      ],
      automotive: [
        { name: 'Kirsten Korosec', beat: 'Transportation & AVs', twitter: '@kirstenkorosec', email: 'kirsten.korosec@techcrunch.com' }
      ]
    }
  },

  'CNBC': {
    domain: '@nbcuni.com or @cnbc.com',
    format: 'firstname.lastname@nbcuni.com',
    journalists: {
      ai: [
        { name: 'Kif Leswing', beat: 'AI & Apple', twitter: '@kifleswing', email: 'kif.leswing@nbcuni.com' }
      ],
      fintech: [
        { name: 'Ryan Browne', beat: 'Fintech & Crypto', twitter: '@Ryan_Browne_', email: 'ryan.browne@nbcuni.com' },
        { name: 'Kate Rooney', beat: 'Crypto & Fintech', twitter: '@Kr00ney', email: 'kate.rooney@nbcuni.com' }
      ],
      healthcare: [
        { name: 'Meg Tirrell', beat: 'Biotech & Pharma', twitter: '@megtirrell', email: 'meg.tirrell@nbcuni.com' },
        { name: 'Berkeley Lovelace Jr.', beat: 'Healthcare', twitter: '@BerkeleyJr', email: 'berkeley.lovelace@nbcuni.com' }
      ],
      climate: [
        { name: 'Emma Newburger', beat: 'Climate & Environment', twitter: '@emma_newburger', email: 'emma.newburger@nbcuni.com' }
      ],
      automotive: [
        { name: 'Lora Kolodny', beat: 'Tesla & EVs', twitter: '@lorakolodny', email: 'lora.kolodny@nbcuni.com' }
      ],
      retail: [
        { name: 'Lauren Thomas', beat: 'Retail', twitter: '@LaurenThomas', email: 'lauren.thomas@nbcuni.com' },
        { name: 'Melissa Repko', beat: 'Retail', twitter: '@melissa_repko', email: 'melissa.repko@nbcuni.com' }
      ],
      media: [
        { name: 'Alex Sherman', beat: 'Media', twitter: '@sherman4949', email: 'alex.sherman@nbcuni.com' }
      ],
      real_estate: [
        { name: 'Diana Olick', beat: 'Real Estate', twitter: '@DianaOlick', email: 'diana.olick@nbcuni.com' }
      ],
      space: [
        { name: 'Michael Sheetz', beat: 'Space', twitter: '@thesheetztweetz', email: 'michael.sheetz@nbcuni.com' }
      ]
    }
  },

  'Axios': {
    domain: '@axios.com',
    format: 'firstname.lastname@axios.com',
    journalists: {
      technology: [
        { name: 'Sara Fischer', beat: 'Media & Tech', twitter: '@sarafischer', email: 'sara.fischer@axios.com' },
        { name: 'Ina Fried', beat: 'Tech Policy & AI', twitter: '@inafried', email: 'ina.fried@axios.com' },
        { name: 'Dan Primack', beat: 'Venture Capital & Deals', twitter: '@danprimack', email: 'dan.primack@axios.com' },
        { name: 'Scott Rosenberg', beat: 'Tech', twitter: '@scottros', email: 'scott.rosenberg@axios.com' }
      ],
      healthcare: [
        { name: 'Erin Brodwin', beat: 'Biotech & Pharma', twitter: '@erinbrodwin', email: 'erin.brodwin@axios.com' },
        { name: 'Tina Reed', beat: 'Healthcare', twitter: '@ReedTina', email: 'tina.reed@axios.com' }
      ],
      business: [
        { name: 'Felix Salmon', beat: 'Business & Finance', twitter: '@felixsalmon', email: 'felix.salmon@axios.com' }
      ]
    }
  },

  'The Verge': {
    domain: '@theverge.com',
    format: 'firstname@theverge.com',
    journalists: {
      technology: [
        { name: 'Alex Heath', beat: 'Meta, VR/AR', twitter: '@alexeheath', email: 'alex@theverge.com' },
        { name: 'Nilay Patel', beat: 'Tech Products & Policy', twitter: '@reckless', email: 'nilay@theverge.com' },
        { name: 'Dieter Bohn', beat: 'Consumer Tech', twitter: '@backlon', email: 'dieter@theverge.com' },
        { name: 'Zoe Schiffer', beat: 'Workplace & Tech Culture', twitter: '@zoeschiffer', email: 'zoe@theverge.com' }
      ],
      ai: [
        { name: 'James Vincent', beat: 'AI', twitter: '@jjvincent', email: 'james@theverge.com' }
      ],
      climate: [
        { name: 'Justine Calma', beat: 'Climate & Energy', twitter: '@justcalma', email: 'justine@theverge.com' }
      ],
      automotive: [
        { name: 'Sean O\'Kane', beat: 'Transportation', twitter: '@sokane1', email: 'sean@theverge.com' }
      ]
    }
  },

  'The Information': {
    domain: '@theinformation.com',
    format: 'firstname@theinformation.com',
    journalists: {
      technology: [
        { name: 'Natasha Mascarenhas', beat: 'Startups', twitter: '@nmasc_', email: 'natasha@theinformation.com' },
        { name: 'Amir Efrati', beat: 'Google, Search', twitter: '@amir', email: 'amir@theinformation.com' },
        { name: 'Tom Dotan', beat: 'Apple, Consumer Tech', twitter: '@cityofthetown', email: 'tom@theinformation.com' }
      ],
      fintech: [
        { name: 'Anita Ramaswamy', beat: 'Fintech', twitter: '@arcane_moonstar', email: 'anita@theinformation.com' }
      ],
      advertising: [
        { name: 'Sahil Patel', beat: 'Media & Advertising', twitter: '@sahilpatel', email: 'sahil@theinformation.com' }
      ],
      venture_capital: [
        { name: 'Berber Jin', beat: 'Startups & VC', twitter: '@berberjin', email: 'berber@theinformation.com' }
      ]
    }
  }
};

// =====================================================
// INDEPENDENT / NEWSLETTER JOURNALISTS
// =====================================================

export const INDEPENDENT_JOURNALISTS = {
  technology: [
    { 
      name: 'Casey Newton', 
      outlet: 'Platformer', 
      beat: 'Tech Platforms & AI', 
      twitter: '@CaseyNewton', 
      email: 'casey@platformer.news',
      verified: true
    },
    { 
      name: 'Alex Kantrowitz', 
      outlet: 'Big Technology', 
      beat: 'Tech Companies & Strategy', 
      twitter: '@Kantrowitz', 
      email: 'alex.kantrowitz@gmail.com',
      verified: true
    },
    { 
      name: 'Eric Newcomer', 
      outlet: 'Newcomer', 
      beat: 'Venture Capital', 
      twitter: '@ericnewcomer', 
      email: 'eric@newcomer.co' // likely format
    },
    { 
      name: 'Kara Swisher', 
      outlet: 'New York Magazine / Vox', 
      beat: 'Tech & Business', 
      twitter: '@karaswisher', 
      email: 'on@voxmedia.com', // podcast contact
      notes: 'Also hosts "On with Kara Swisher" and "Pivot"'
    },
    { 
      name: 'Taylor Lorenz', 
      outlet: 'User Mag', 
      beat: 'Tech & Internet Culture', 
      twitter: '@TaylorLorenz', 
      email: 'taylor@usermag.co',
      alternateEmail: 'hello@usermag.co',
      verified: true,
      notes: 'Left Washington Post in October 2024'
    }
  ],
  cryptocurrency: [
    { 
      name: 'Laura Shin', 
      outlet: 'Unchained', 
      beat: 'Crypto', 
      twitter: '@LauraShin', 
      email: 'laura@unchainedcrypto.com' // likely format
    }
  ],
  healthcare: [
    { 
      name: 'Christina Farr', 
      outlet: 'Second Opinion', 
      beat: 'Health Tech', 
      twitter: '@chrissyfarr', 
      email: 'christina@secondopinion.co' // likely format
    }
  ]
};

// =====================================================
// SPECIALIZED PUBLICATIONS
// =====================================================

export const SPECIALIZED_OUTLETS = {
  
  'Wired': {
    domain: '@wired.com',
    format: 'firstname_lastname@wired.com',
    journalists: {
      ai: [
        { name: 'Will Knight', beat: 'AI & Machine Learning', twitter: '@willknight', email: 'will_knight@wired.com' },
        { name: 'Steven Levy', beat: 'Tech & AI', twitter: '@stevenlevy', email: 'steven_levy@wired.com' }
      ]
    }
  },

  'MIT Tech Review': {
    domain: '@technologyreview.com',
    format: 'firstname.lastname@technologyreview.com',
    journalists: {
      ai: [
        { name: 'Melissa Heikkilä', beat: 'AI', twitter: '@m_heiккila', email: 'melissa.heikkila@technologyreview.com' },
        { name: 'Will Douglas Heaven', beat: 'AI', twitter: '@willdhvn', email: 'will.heaven@technologyreview.com' }
      ],
      climate: [
        { name: 'James Temple', beat: 'Climate & Energy', twitter: '@jtemple', email: 'james.temple@technologyreview.com' }
      ]
    }
  },

  'Ars Technica': {
    domain: '@arstechnica.com',
    format: 'firstname.lastname@arstechnica.com',
    journalists: {
      ai: [
        { name: 'Benj Edwards', beat: 'AI & Machine Learning', twitter: '@benjedwards', email: 'benj.edwards@arstechnica.com' }
      ],
      space: [
        { name: 'Eric Berger', beat: 'Space', twitter: '@SciGuySpace', email: 'eric.berger@arstechnica.com' }
      ]
    }
  },

  'STAT News': {
    domain: '@statnews.com',
    format: 'firstname.lastname@statnews.com',
    journalists: {
      healthcare: [
        { name: 'Casey Ross', beat: 'Health Tech & AI', twitter: '@caseymross', email: 'casey.ross@statnews.com' },
        { name: 'Bob Herman', beat: 'Healthcare Business', twitter: '@mrBobHerman', email: 'bob.herman@statnews.com' },
        { name: 'Damian Garde', beat: 'Biotech', twitter: '@damiangarde', email: 'damian.garde@statnews.com' },
        { name: 'Ed Silverman', beat: 'Pharma', twitter: '@Pharmalot', email: 'ed.silverman@statnews.com' }
      ]
    }
  },

  'CoinDesk': {
    domain: '@coindesk.com',
    format: 'firstname.lastname@coindesk.com',
    journalists: {
      cryptocurrency: [
        { name: 'Nikhilesh De', beat: 'Crypto Policy', twitter: '@nikhileshde', email: 'nikhilesh.de@coindesk.com' },
        { name: 'Danny Nelson', beat: 'Crypto & Policy', twitter: '@danny8284', email: 'danny.nelson@coindesk.com' },
        { name: 'Tracy Wang', beat: 'Crypto', twitter: '@tracyspacy', email: 'tracy.wang@coindesk.com' }
      ]
    }
  },

  'The Block': {
    domain: '@theblock.co',
    format: 'firstname.lastname@theblock.co',
    journalists: {
      cryptocurrency: [
        { name: 'Frank Chaparro', beat: 'Crypto Markets', twitter: '@fintechfrank', email: 'frank.chaparro@theblock.co' }
      ]
    }
  },

  'Semafor': {
    domain: '@semafor.com',
    format: 'firstname.lastname@semafor.com',
    journalists: {
      technology: [
        { name: 'Reed Albergotti', beat: 'Big Tech', twitter: '@ReedAlbergotti', email: 'reed.albergotti@semafor.com' }
      ],
      media: [
        { name: 'Ben Smith', beat: 'Media', twitter: '@benyt', email: 'ben.smith@semafor.com' },
        { name: 'Maxwell Tani', beat: 'Media', twitter: '@maxwelltani', email: 'maxwell.tani@semafor.com' }
      ]
    }
  },

  'Vox': {
    domain: '@vox.com',
    format: 'firstname@vox.com',
    journalists: {
      retail: [
        { name: 'Jason Del Rey', beat: 'Amazon & E-commerce', twitter: '@DelRey', email: 'jason@vox.com' }
      ],
      media: [
        { name: 'Peter Kafka', beat: 'Media & Tech', twitter: '@pkafka', email: 'peter@vox.com' }
      ],
      business: [
        { name: 'Emily Stewart', beat: 'Business & Economy', twitter: '@EmilyStewartM', email: 'emily@vox.com' }
      ]
    }
  },

  'Puck': {
    domain: '@puck.news',
    format: 'firstname.lastname@puck.news',
    journalists: {
      media: [
        { name: 'Dylan Byers', beat: 'Media & Tech', twitter: '@DylanByers', email: 'dylan.byers@puck.news' }
      ]
    }
  },

  'Forbes': {
    domain: '@forbes.com',
    format: 'firstname.lastname@forbes.com',
    journalists: {
      food: [
        { name: 'Chloe Sorvino', beat: 'Food & Agriculture', twitter: '@ChloeeSorvino', email: 'chloe.sorvino@forbes.com' }
      ]
    }
  },

  'Fortune': {
    domain: '@fortune.com',
    format: 'firstname.lastname@fortune.com',
    journalists: {
      retail: [
        { name: 'Phil Wahba', beat: 'Retail', twitter: '@philwahba', email: 'phil.wahba@fortune.com' }
      ]
    }
  },

  'Business Insider': {
    domain: '@insider.com or @businessinsider.com',
    format: 'flastname@insider.com',
    journalists: {
      media: [
        { name: 'Claire Atkinson', beat: 'Media & Advertising', twitter: '@claireatki', email: 'catkinson@insider.com' }
      ]
    }
  },

  'Digiday': {
    domain: '@digiday.com',
    format: 'firstname.lastname@digiday.com',
    journalists: {
      advertising: [
        { name: 'Lucia Moses', beat: 'Media & Marketing', twitter: '@luciam', email: 'lucia.moses@digiday.com' },
        { name: 'Kristina Monllos', beat: 'Advertising', twitter: '@kmonllos', email: 'kristina.monllos@digiday.com' }
      ]
    }
  },

  'Ad Age': {
    domain: '@adage.com',
    format: 'firstname.lastname@adage.com',
    journalists: {
      advertising: [
        { name: 'Garett Sloane', beat: 'Digital Advertising', twitter: '@garettsloane', email: 'garett.sloane@adage.com' },
        { name: 'Jack Neff', beat: 'Marketing', twitter: '@Jack_Neff', email: 'jack.neff@adage.com' },
        { name: 'E.J. Schultz', beat: 'Marketing', twitter: '@EJSchultz', email: 'ej.schultz@adage.com' }
      ]
    }
  },

  'American Banker': {
    domain: '@arizent.com',
    format: 'firstname.lastname@arizent.com',
    journalists: {
      fintech: [
        { name: 'Isabelle Castro Margaroli', beat: 'Digital Banking', twitter: '@IsabelleCastro_', email: 'isabelle.castro@arizent.com' },
        { name: 'Penny Crosman', beat: 'Banking Technology', twitter: '@pcrosman', email: 'penny.crosman@arizent.com' }
      ]
    }
  },

  'Electrek': {
    domain: '@electrek.co',
    format: 'firstname.lastname@electrek.co',
    journalists: {
      automotive: [
        { name: 'Fred Lambert', beat: 'Electric Vehicles', twitter: '@FredericLambert', email: 'fred.lambert@electrek.co' }
      ]
    }
  },

  'The Atlantic': {
    domain: '@theatlantic.com',
    format: 'firstname.lastname@theatlantic.com',
    journalists: {
      space: [
        { name: 'Marina Koren', beat: 'Space', twitter: '@marinakoren', email: 'marina.koren@theatlantic.com' }
      ],
      food: [
        { name: 'Amanda Mull', beat: 'Consumer Culture & Food', twitter: '@amandamull', email: 'amanda.mull@theatlantic.com' }
      ]
    }
  }
};

// =====================================================
// ADDITIONAL CATEGORIES WITH MORE JOURNALISTS
// =====================================================

export const ADDITIONAL_JOURNALISTS = {
  
  // CONSUMER TECHNOLOGY
  consumer_tech: [
    { name: 'Joanna Stern', outlet: 'Wall Street Journal', beat: 'Consumer Tech', twitter: '@JoannaStern', email: 'joanna.stern@wsj.com' },
    { name: 'Brian X. Chen', outlet: 'New York Times', beat: 'Consumer Tech', twitter: '@bxchen', email: 'brian.chen@nytimes.com' },
    { name: 'David Pierce', outlet: 'The Verge', beat: 'Gadgets & Apps', twitter: '@pierce', email: 'david@theverge.com' },
    { name: 'Lauren Goode', outlet: 'Wired', beat: 'Consumer Tech', twitter: '@LaurenGoode', email: 'lauren_goode@wired.com' }
  ],

  // GAMING & ESPORTS
  gaming: [
    { name: 'Stephen Totilo', outlet: 'Axios', beat: 'Gaming', twitter: '@stephentotilo', email: 'stephen.totilo@axios.com' },
    { name: 'Dean Takahashi', outlet: 'VentureBeat', beat: 'Gaming', twitter: '@deantak', email: 'dean@venturebeat.com' },
    { name: 'Jason Schreier', outlet: 'Bloomberg', beat: 'Gaming', twitter: '@jasonschreier', email: 'jschreier@bloomberg.net' },
    { name: 'Patrick Klepek', outlet: 'Giant Bomb', beat: 'Gaming', twitter: '@patrickklepek', email: 'patrick@giantbomb.com' }
  ],

  // STREAMING & ENTERTAINMENT TECH
  streaming: [
    { name: 'Julia Alexander', outlet: 'Parrot Analytics', beat: 'Streaming', twitter: '@loudmouthjulia', email: 'julia@parrotanalytics.com' },
    { name: 'Dan Rayburn', outlet: 'Streaming Media', beat: 'Streaming Tech', twitter: '@danrayburn', email: 'dan@streamingmediablog.com' }
  ],

  // PRIVACY & DATA
  privacy: [
    { name: 'Alfred Ng', outlet: 'Politico', beat: 'Privacy & Surveillance', twitter: '@alfredwkng', email: 'ang@politico.com' },
    { name: 'Issie Lapowsky', outlet: 'Protocol', beat: 'Tech Policy & Privacy', twitter: '@issielapowsky', email: 'issie.lapowsky@protocol.com' },
    { name: 'Natasha Singer', outlet: 'New York Times', beat: 'Privacy & Tech', twitter: '@natashanyt', email: 'natasha.singer@nytimes.com' }
  ],

  // SEMICONDUCTORS & HARDWARE
  semiconductors: [
    { name: 'Ian King', outlet: 'Bloomberg', beat: 'Semiconductors', twitter: '@IanKing', email: 'iking5@bloomberg.net' },
    { name: 'Debby Wu', outlet: 'Bloomberg', beat: 'Taiwan Tech & Semiconductors', twitter: '@debbywutw', email: 'dwu121@bloomberg.net' }
  ],

  // TELECOM & 5G
  telecom: [
    { name: 'Marguerite Reardon', outlet: 'CNET', beat: 'Telecom & 5G', twitter: '@maggie_reardon', email: 'marguerite.reardon@cnet.com' },
    { name: 'Karl Bode', outlet: 'Techdirt', beat: 'Telecom Policy', twitter: '@KarlBode', email: 'karl@techdirt.com' }
  ],

  // QUANTUM COMPUTING
  quantum: [
    { name: 'Martin Giles', outlet: 'MIT Tech Review', beat: 'Quantum Computing', twitter: '@martingiles_', email: 'martin.giles@technologyreview.com' }
  ],

  // EDTECH
  edtech: [
    { name: 'Natasha Singer', outlet: 'New York Times', beat: 'EdTech', twitter: '@natashanyt', email: 'natasha.singer@nytimes.com' },
    { name: 'Jeffrey R. Young', outlet: 'EdSurge', beat: 'EdTech', twitter: '@jryoung', email: 'jeffrey@edsurge.com' }
  ],

  // PROPTECH
  proptech: [
    { name: 'Alex Janin', outlet: 'The Real Deal', beat: 'PropTech', twitter: '@alexjanin', email: 'ajanin@therealdeal.com' }
  ],

  // SUPPLY CHAIN & LOGISTICS
  supply_chain: [
    { name: 'Lydia DePillis', outlet: 'New York Times', beat: 'Supply Chain', twitter: '@lydiadepillis', email: 'lydia.depillis@nytimes.com' }
  ],

  // ROBOTICS & AUTOMATION
  robotics: [
    { name: 'Brian Heater', outlet: 'TechCrunch', beat: 'Robotics', twitter: '@bheater', email: 'brian.heater@techcrunch.com' },
    { name: 'Evan Ackerman', outlet: 'IEEE Spectrum', beat: 'Robotics', twitter: '@BotJunkie', email: 'e.ackerman@ieee.org' }
  ]
};

// =====================================================
// USAGE NOTES
// =====================================================

/*
EMAIL VERIFICATION STATUS:
- ✓ Verified: Email confirmed from public sources (Twitter bio, byline, website)
- Format-based: Email constructed using verified outlet patterns
- Likely: Best guess based on outlet standards

BEST PRACTICES:
1. Always check journalist Twitter bios first - many list their emails
2. Use outlet-specific formats as documented above
3. For TechCrunch, check bylines as many reporters list emails there
4. Bloomberg uses first initial + last name format (flastname@bloomberg.net)
5. When in doubt, use the primary format for each outlet
6. Some journalists prefer DM for initial outreach - check Twitter bios
7. Always personalize pitches and respect "no PR" notices in bios

TIPS DATABASE CONTACTS:
- Bloomberg: tips2@bloomberg.net
- New York Times: nytnews@nytimes.com
- Wall Street Journal: wsjcontact@wsj.com
- Washington Post: wpmagazine@washpost.com

UPDATING THIS DATABASE:
- Mark verified emails with verified: true
- Note alternative contact methods in 'notes' field
- Add 'alternateEmail' for secondary contacts
- Include Twitter as many journalists prefer DMs for initial contact
*/

  // INSURANCE & INSURTECH
  insurtech: [
    { name: 'Leslie Scism', outlet: 'Wall Street Journal', beat: 'Insurance', twitter: '@LeslieScism', email: 'leslie.scism@wsj.com' },
    { name: 'David Weliver', outlet: 'Lifehacker', beat: 'InsurTech', twitter: '@dweliver', email: 'david.weliver@lifehacker.com' }
  ],

  // LEGALTECH
  legaltech: [
    { name: 'Joe Patrice', outlet: 'Above the Law', beat: 'Legal Tech', twitter: '@JoePatrice', email: 'joe.patrice@abovethelaw.com' },
    { name: 'Bob Ambrogi', outlet: 'LawSites', beat: 'Legal Technology', twitter: '@BobAmbrogi', email: 'bob@lawsitesblog.com' }
  ],

  // SaaS & ENTERPRISE SOFTWARE  
  saas: [
    { name: 'Sarah K. White', outlet: 'CIO.com', beat: 'Enterprise Tech', twitter: '@sarahkwhite', email: 'sarah.white@foundryco.com' },
    { name: 'Larry Dignan', outlet: 'Constellation Research', beat: 'Enterprise Software', twitter: '@ldignan', email: 'larry.dignan@constellationr.com' }
  ],

  // DEVTOOLS & DEVELOPER ECOSYSTEM
  devtools: [
    { name: 'Matt Asay', outlet: 'InfoWorld', beat: 'Developer Tools', twitter: '@mjasay', email: 'matt.asay@infoworld.com' },
    { name: 'Richard MacManus', outlet: 'The New Stack', beat: 'Developer Ecosystem', twitter: '@ricmac', email: 'richard@thenewstack.io' }
  ],

  // WEB3 / DECENTRALIZED TECH (beyond crypto)
  web3: [
    { name: 'Camila Russo', outlet: 'The Defiant', beat: 'DeFi', twitter: '@CamiRusso', email: 'camila@thedefiant.io' },
    { name: 'Sam Reynolds', outlet: 'CoinDesk', beat: 'Web3 & NFTs', twitter: '@sfreynolds', email: 'sam.reynolds@coindesk.com' }
  ]
};

// =====================================================
// MASSIVELY EXPANDED CATEGORIES
// =====================================================

export const EXPANDED_JOURNALIST_DATABASE = {

  // FINTECH (EXPANDED)
  fintech_expanded: [
    { name: 'Hugh Son', outlet: 'CNBC', beat: 'Banking & Fintech', twitter: '@Hugh_Son', email: 'hugh.son@nbcuni.com' },
    { name: 'Lucinda Shen', outlet: 'Axios', beat: 'Fintech', twitter: '@ShenLucinda', email: 'lucinda.shen@axios.com' },
    { name: 'Aisha Gani', outlet: 'Bloomberg', beat: 'Fintech', twitter: '@aishagani', email: 'agani3@bloomberg.net' },
    { name: 'Joel Khalili', outlet: 'Wired', beat: 'Crypto & Fintech', twitter: '@JKFruit', email: 'joel_khalili@wired.com' },
    { name: 'Steve Cocheo', outlet: 'The Financial Brand', beat: 'Banking Tech', twitter: '@stevecocheo', email: 'steve.cocheo@thefinancialbrand.com' },
    { name: 'Miriam Cross', outlet: 'American Banker', beat: 'Bank Technology', twitter: '@MiriamSCross', email: 'miriam.cross@arizent.com' },
    { name: 'Aaron Marsh', outlet: 'Bank Automation News', beat: 'Banking Tech', twitter: '@soIwrote', email: 'aaron.marsh@bankautomate.com' },
    { name: 'John Reosti', outlet: 'American Banker', beat: 'Credit Unions & Lending', twitter: '@jreosti', email: 'john.reosti@arizent.com' },
    { name: 'Melinda Huspen', outlet: 'American Banker', beat: 'Banking & Fintech', twitter: '@melindahuspen', email: 'melinda.huspen@arizent.com' },
    { name: 'Rick Morgan', outlet: 'Bank Innovation', beat: 'Fintech', twitter: '@RickAnselMorgan', email: 'rick.morgan@bankinnovation.net' },
    { name: 'Matt White', outlet: 'Finextra', beat: 'Fintech', twitter: '@FinextraMat', email: 'matt.white@finextra.com' },
    { name: 'Hannah Lang', outlet: 'Reuters', beat: 'Fintech & Regulation', twitter: '@hannahdlang', email: 'hannah.lang@thomsonreuters.com' }
  ],

  // HEALTHCARE & BIOTECH (MASSIVELY EXPANDED)
  healthcare_biotech_expanded: [
    // Endpoints News
    { name: 'John Carroll', outlet: 'Endpoints News', beat: 'Biotech News', twitter: '@johncarroll23', email: 'john@endpts.com' },
    { name: 'Nicole DeFeudis', outlet: 'Endpoints News', beat: 'Editor', twitter: '@nicdefeudis', email: 'nicole@endpts.com' },
    { name: 'Andrew Dunn', outlet: 'Endpoints News', beat: 'Biopharma', twitter: '@andrewwdunn', email: 'andrew.dunn@endpts.com' },
    { name: 'Jaimy Lee', outlet: 'Endpoints News', beat: 'Newsletters Deputy Editor', twitter: '@jaimylee', email: 'jaimy.lee@endpts.com' },
    { name: 'Anna Brown', outlet: 'Endpoints News', beat: 'Biopharma Breaking News', twitter: '@annainthelab', email: 'anna.brown@endpts.com' },
    { name: 'Max Bayer', outlet: 'Endpoints News', beat: 'Pharma', twitter: '@maxpbayer', email: 'max.bayer@endpts.com' },
    { name: 'Shelby Livingston', outlet: 'Endpoints News', beat: 'Health Tech', twitter: '@ShelbyLiv', email: 'shelby.livingston@endpts.com' },
    
    // BioPharma Dive
    { name: 'Ned Pagliarulo', outlet: 'BioPharma Dive', beat: 'Biopharma', twitter: '@nedpagliarulo', email: 'ned.pagliarulo@industrydive.com' },
    { name: 'Ben Fidler', outlet: 'BioPharma Dive', beat: 'Biotech', twitter: '@benfidler', email: 'ben.fidler@industrydive.com' },
    { name: 'Gwendolyn Wu', outlet: 'BioPharma Dive', beat: 'Biotech Finance', twitter: '@gwendolynwu_', email: 'gwendolyn.wu@industrydive.com' },
    { name: 'Rebecca Pifer', outlet: 'BioPharma Dive', beat: 'Healthcare Policy', twitter: '@rebeccapifer', email: 'rebecca.pifer@industrydive.com' },
    { name: 'Kristin Jensen', outlet: 'BioPharma Dive', beat: 'Pharma', twitter: '@KristinWJensen', email: 'kristin.jensen@industrydive.com' },
    
    // Fierce Biotech/Pharma
    { name: 'Conor Hale', outlet: 'Fierce Biotech', beat: 'Biotech', twitter: '@conorhale', email: 'conor.hale@fiercebiotech.com' },
    { name: 'Fraiser Kansteiner', outlet: 'Fierce Pharma', beat: 'Pharma', twitter: '@FKansteiner', email: 'fraiser.kansteiner@fiercepharma.com' },
    { name: 'Kyle LaHucik', outlet: 'Fierce Biotech', beat: 'Biotech Deals', twitter: '@KyleLaHucik', email: 'kyle.lahucik@fiercebiotech.com' },
    
    // Additional Healthcare
    { name: 'Zachary Brennan', outlet: 'Endpoints News', beat: 'FDA & Regulation', twitter: '@ZacharySBrennan', email: 'zachary.brennan@endpts.com' },
    { name: 'Sydney Lupkin', outlet: 'NPR', beat: 'Pharmaceuticals', twitter: '@slupkin', email: 'slupkin@npr.org' },
    { name: 'Sarah Jane Tribble', outlet: 'KHN', beat: 'Healthcare', twitter: '@SJTribble', email: 'stribble@kff.org' },
    { name: 'Rachel Cohrs', outlet: 'STAT News', beat: 'Healthcare Business', twitter: '@rachelcohrs', email: 'rachel.cohrs@statnews.com' },
    { name: 'Nicholas Florko', outlet: 'STAT News', beat: 'Drug Pricing', twitter: '@NicholasFlorko', email: 'nicholas.florko@statnews.com' },
    { name: 'Lev Facher', outlet: 'STAT News', beat: 'Healthcare Policy', twitter: '@levfacher', email: 'lev.facher@statnews.com' },
    { name: 'Lizzy Lawrence', outlet: 'STAT News', beat: 'Biotech', twitter: '@LizzyLaw_', email: 'lizzy.lawrence@statnews.com' },
    { name: 'Adam Feuerstein', outlet: 'STAT News', beat: 'Biotech Investing', twitter: '@adamfeuerstein', email: 'adam.feuerstein@statnews.com' }
  ],

  // CLIMATE & ENERGY (EXPANDED)
  climate_energy_expanded: [
    { name: 'David Gelles', outlet: 'New York Times', beat: 'Climate & Business', twitter: '@gelles', email: 'david.gelles@nytimes.com' },
    { name: 'Lisa Friedman', outlet: 'New York Times', beat: 'Climate Policy', twitter: '@LFFriedman', email: 'lisa.friedman@nytimes.com' },
    { name: 'Brad Plumer', outlet: 'New York Times', beat: 'Climate', twitter: '@bradplumer', email: 'brad.plumer@nytimes.com' },
    { name: 'Somini Sengupta', outlet: 'New York Times', beat: 'Climate', twitter: '@sominisengupta', email: 'somini.sengupta@nytimes.com' },
    { name: 'Eric Roston', outlet: 'Bloomberg', beat: 'Climate', twitter: '@eroston', email: 'eroston@bloomberg.net' },
    { name: 'Will Wade', outlet: 'Bloomberg', beat: 'Energy Storage', twitter: '@willwade', email: 'wwade20@bloomberg.net' },
    { name: 'Javier Blas', outlet: 'Bloomberg', beat: 'Energy Markets', twitter: '@JavierBlas', email: 'jblas@bloomberg.net' },
    { name: 'Naureen S. Malik', outlet: 'Bloomberg', beat: 'Energy & Climate', twitter: '@naureenSmalik', email: 'nmalik28@bloomberg.net' },
    { name: 'Joe Carroll', outlet: 'Bloomberg', beat: 'Energy', twitter: '@JoeCarroll8', email: 'jcarroll23@bloomberg.net' },
    { name: 'Nichola Groom', outlet: 'Reuters', beat: 'Energy & Environment', twitter: '@nicholagroom', email: 'nichola.groom@reuters.com' },
    { name: 'Valerie Volcovici', outlet: 'Reuters', beat: 'Climate & Energy Policy', twitter: '@VVolcovici', email: 'valerie.volcovici@reuters.com' },
    { name: 'Jennifer Hiller', outlet: 'Wall Street Journal', beat: 'Energy', twitter: '@jenhiller', email: 'jennifer.hiller@wsj.com' },
    { name: 'Katherine Blunt', outlet: 'Wall Street Journal', beat: 'Energy', twitter: '@kath_blunt', email: 'katherine.blunt@wsj.com' },
    { name: 'Amrith Ramkumar', outlet: 'Wall Street Journal', beat: 'Energy Markets', twitter: '@aramkumar', email: 'amrith.ramkumar@wsj.com' }
  ],

  // AUTOMOTIVE & MOBILITY (EXPANDED)
  automotive_mobility_expanded: [
    { name: 'Tim Higgins', outlet: 'Wall Street Journal', beat: 'Tesla & EVs', twitter: '@timkhiggins', email: 'tim.higgins@wsj.com' },
    { name: 'Rebecca Elliott', outlet: 'Wall Street Journal', beat: 'Automotive', twitter: '@rebeccaadelliott', email: 'rebecca.elliott@wsj.com' },
    { name: 'Mike Ramsey', outlet: 'Wall Street Journal', beat: 'Automotive Tech', twitter: '@mramsey', email: 'mike.ramsey@wsj.com' },
    { name: 'Neal Boudette', outlet: 'New York Times', beat: 'Automotive Industry', twitter: '@Boudette', email: 'neal.boudette@nytimes.com' },
    { name: 'Jack Ewing', outlet: 'New York Times', beat: 'Electric Vehicles', twitter: '@JackEwingNYT', email: 'jack.ewing@nytimes.com' },
    { name: 'Craig Trudell', outlet: 'Bloomberg', beat: 'Automotive', twitter: '@Craig_Trudell', email: 'ctrudell@bloomberg.net' },
    { name: 'Ed Ludlow', outlet: 'Bloomberg', beat: 'Transportation Tech', twitter: '@EdLudlow', email: 'eludlow@bloomberg.net' },
    { name: 'Alex Webb', outlet: 'Bloomberg', beat: 'Automotive', twitter: '@AJWebb', email: 'awebb4@bloomberg.net' },
    { name: 'Kyle Stock', outlet: 'Bloomberg', beat: 'Transportation', twitter: '@KyleStock', email: 'kstock4@bloomberg.net' },
    { name: 'Gabrielle Coppola', outlet: 'Bloomberg', beat: 'Automotive', twitter: '@GabeCoppola', email: 'gcoppola@bloomberg.net' },
    { name: 'Rebecca Bellan', outlet: 'TechCrunch', beat: 'Transportation', twitter: '@RebeccaBellan', email: 'rebecca.bellan@techcrunch.com' },
    { name: 'Andrew J. Hawkins', outlet: 'The Verge', beat: 'Transportation', twitter: '@andyjayhawk', email: 'andrew@theverge.com' }
  ],

  // RETAIL & E-COMMERCE (EXPANDED)
  retail_ecommerce_expanded: [
    { name: 'Sarah Nassauer', outlet: 'Wall Street Journal', beat: 'Retail', twitter: '@sarahnassauer', email: 'sarah.nassauer@wsj.com' },
    { name: 'Jinjoo Lee', outlet: 'Wall Street Journal', beat: 'Retail', twitter: '@jinjoo_lee', email: 'jinjoo.lee@wsj.com' },
    { name: 'Sharon Terlep', outlet: 'Wall Street Journal', beat: 'Retail & Consumer Goods', twitter: '@SharonTerlep', email: 'sharon.terlep@wsj.com' },
    { name: 'Khadeeja Safdar', outlet: 'Wall Street Journal', beat: 'Retail', twitter: '@KhadeejaS', email: 'khadeeja.safdar@wsj.com' },
    { name: 'Annie Gasparro', outlet: 'Wall Street Journal', beat: 'Food & Retail', twitter: '@anniegasparro', email: 'annie.gasparro@wsj.com' },
    { name: 'Shoshy Ciment', outlet: 'Business Insider', beat: 'Retail', twitter: '@ShoshyCiment', email: 'sciment@insider.com' },
    { name: 'Dominick Reuter', outlet: 'Business Insider', beat: 'Retail', twitter: '@dominickreuter', email: 'dreuter@insider.com' },
    { name: 'Emma Cosgrove', outlet: 'Retail Dive', beat: 'Retail', twitter: '@emmarcosgrove', email: 'emma.cosgrove@industrydive.com' },
    { name: 'Daphne Howland', outlet: 'Retail Dive', beat: 'Retail', twitter: '@daphnehowland', email: 'daphne.howland@industrydive.com' }
  ],

  // MEDIA & ENTERTAINMENT (EXPANDED)
  media_entertainment_expanded: [
    { name: 'Benjamin Mullin', outlet: 'New York Times', beat: 'Media', twitter: '@BenMullin', email: 'benjamin.mullin@nytimes.com' },
    { name: 'Katie Robertson', outlet: 'New York Times', beat: 'Media', twitter: '@katie_robertson', email: 'katie.robertson@nytimes.com' },
    { name: 'Michael M. Grynbaum', outlet: 'New York Times', beat: 'Media', twitter: '@grynbaum', email: 'michael.grynbaum@nytimes.com' },
    { name: 'Brooks Barnes', outlet: 'New York Times', beat: 'Hollywood & Entertainment', twitter: '@brooksbarnesNYT', email: 'brooks.barnes@nytimes.com' },
    { name: 'Nicole Sperling', outlet: 'New York Times', beat: 'Hollywood', twitter: '@nicsperling', email: 'nicole.sperling@nytimes.com' },
    { name: 'Keach Hagey', outlet: 'Wall Street Journal', beat: 'Media', twitter: '@keachhagey', email: 'keach.hagey@wsj.com' },
    { name: 'Jessica Toonkel', outlet: 'The Information', beat: 'Media', twitter: '@jtoonkel', email: 'jessica@theinformation.com' },
    { name: 'Gerry Smith', outlet: 'Bloomberg', beat: 'Media', twitter: '@gerrysmi', email: 'gsmith252@bloomberg.net' },
    { name: 'Lucas Shaw', outlet: 'Bloomberg', beat: 'Streaming', twitter: '@Lucas_Shaw', email: 'lshaw12@bloomberg.net' },
    { name: 'Julia Alexander', outlet: 'Parrot Analytics', beat: 'Streaming & Creator Economy', twitter: '@loudmouthjulia', email: 'julia@parrotanalytics.com' }
  ],

  // VENTURE CAPITAL & STARTUPS (EXPANDED)
  vc_startups_expanded: [
    { name: 'Lizette Chapman', outlet: 'Bloomberg', beat: 'Venture Capital', twitter: '@lizette_chapman', email: 'lchapman19@bloomberg.net' },
    { name: 'Natalie Lung', outlet: 'Bloomberg', beat: 'Venture Capital', twitter: '@natalie_lung', email: 'nlung@bloomberg.net' },
    { name: 'Rachel Lerman', outlet: 'Washington Post', beat: 'Tech Companies', twitter: '@rachellerman', email: 'rachel.lerman@washpost.com' },
    { name: 'Tomio Geron', outlet: 'Wall Street Journal', beat: 'Startups & VC', twitter: '@tomiogeron', email: 'tomio.geron@wsj.com' },
    { name: 'Corrie Driebusch', outlet: 'Wall Street Journal', beat: 'Startups & IPOs', twitter: '@corriedrie', email: 'corrie.driebusch@wsj.com' },
    { name: 'Heather Somerville', outlet: 'Wall Street Journal', beat: 'Tech Startups', twitter: '@heathersomervil', email: 'heather.somerville@wsj.com' },
    { name: 'Christine Hall', outlet: 'TechCrunch', beat: 'Startups & Venture', twitter: '@christianna_c', email: 'christine.hall@techcrunch.com' },
    { name: 'Anita Ramaswamy', outlet: 'The Information', beat: 'Startups', twitter: '@arcane_moonstar', email: 'anita@theinformation.com' },
    { name: 'Anissa Gardizy', outlet: 'The Information', beat: 'Startups', twitter: '@anissagardizy', email: 'anissa@theinformation.com' }
  ],

  // ENTERPRISE TECH & CLOUD (EXPANDED)
  enterprise_cloud_expanded: [
    { name: 'Jordan Novet', outlet: 'CNBC', beat: 'Enterprise Tech', twitter: '@jordannovet', email: 'jordan.novet@nbcuni.com' },
    { name: 'Ashley Stewart', outlet: 'Business Insider', beat: 'Enterprise Tech', twitter: '@ashannstew', email: 'astewart@insider.com' },
    { name: 'Jordan Robertson', outlet: 'Bloomberg', beat: 'Cybersecurity', twitter: '@j_robertson', email: 'jrobertson14@bloomberg.net' },
    { name: 'Dina Bass', outlet: 'Bloomberg', beat: 'Microsoft & Cloud', twitter: '@dinabass', email: 'dbass6@bloomberg.net' },
    { name: 'Spencer Soper', outlet: 'Bloomberg', beat: 'Amazon & Cloud', twitter: '@spencersoper', email: 'ssoper@bloomberg.net' },
    { name: 'Ellen Huet', outlet: 'Bloomberg', beat: 'Enterprise Software', twitter: '@ellenhuet', email: 'ehuet@bloomberg.net' },
    { name: 'Nico Grant', outlet: 'New York Times', beat: 'Google', twitter: '@nicolegrant', email: 'nico.grant@nytimes.com' },
    { name: 'Tripp Mickle', outlet: 'New York Times', beat: 'Apple & Tech', twitter: '@tMickle', email: 'tripp.mickle@nytimes.com' }
  ],

  // FOOD & AGTECH (EXPANDED)
  food_agtech_expanded: [
    { name: 'Jacob Bunge', outlet: 'Wall Street Journal', beat: 'Agriculture', twitter: '@jacobbunge', email: 'jacob.bunge@wsj.com' },
    { name: 'Kirk Maltais', outlet: 'Wall Street Journal', beat: 'Agriculture Commodities', twitter: '@kirkmaltais', email: 'kirk.maltais@wsj.com' },
    { name: 'Kim Severson', outlet: 'New York Times', beat: 'Food & Dining', twitter: '@kimseverson', email: 'kim.severson@nytimes.com' },
    { name: 'Julie Jargon', outlet: 'Wall Street Journal', beat: 'Food & Restaurants', twitter: '@juliejargon', email: 'julie.jargon@wsj.com' },
    { name: 'Heather Haddon', outlet: 'Wall Street Journal', beat: 'Restaurants', twitter: '@heatherhaddon', email: 'heather.haddon@wsj.com' },
    { name: 'Emma Newburger', outlet: 'CNBC', beat: 'AgTech', twitter: '@emma_newburger', email: 'emma.newburger@nbcuni.com' },
    { name: 'Chase Purdy', outlet: 'Politico', beat: 'Food & Agriculture', twitter: '@chasepurdy', email: 'cpurdy@politico.com' }
  ],

  // DEFENSE TECH & DRONES
  defense_tech: [
    { name: 'Lara Seligman', outlet: 'Politico', beat: 'Defense & National Security', twitter: '@laraseligman', email: 'lseligman@politico.com' },
    { name: 'Aaron Mehta', outlet: 'Breaking Defense', beat: 'Defense Technology', twitter: '@AaronMehta', email: 'aaron@breakingdefense.com' },
    { name: 'Theresa Hitchens', outlet: 'Breaking Defense', beat: 'Space & Defense', twitter: '@theresajayne', email: 'theresa@breakingdefense.com' },
    { name: 'Jen Judson', outlet: 'Defense News', beat: 'Land Warfare', twitter: '@jenjudson', email: 'jjudson@defensenews.com' },
    { name: 'Eric Geller', outlet: 'Politico', beat: 'Cybersecurity & Defense', twitter: '@ericgeller', email: 'egeller@politico.com' }
  ],

  // IMMIGRATION TECH
  immigration_tech: [
    { name: 'Hamed Aleaziz', outlet: 'Los Angeles Times', beat: 'Immigration', twitter: '@Haleaziz', email: 'hamed.aleaziz@latimes.com' },
    { name: 'Muzaffar Chishti', outlet: 'Migration Policy Institute', beat: 'Immigration Policy', twitter: '@mchishti', email: 'mchishti@migrationpolicy.org' }
  ],

  // INFLUENCER ECONOMY & CREATOR TOOLS
  creator_economy: [
    { name: 'Amanda Perelli', outlet: 'Business Insider', beat: 'Creator Economy', twitter: '@amandaperelli', email: 'aperelli@insider.com' },
    { name: 'Dan Whateley', outlet: 'Business Insider', beat: 'Influencer Industry', twitter: '@danwhateley', email: 'dwhateley@insider.com' },
    { name: 'Sydney Bradley', outlet: 'Business Insider', beat: 'Creator Economy', twitter: '@sydneynwbradley', email: 'sbradley@insider.com' }
  ]
};

// Export all registries
export default {
  EMAIL_FORMAT_GUIDE,
  TIER1_OUTLETS,
  TIER2_OUTLETS,
  INDEPENDENT_JOURNALISTS,
  SPECIALIZED_OUTLETS,
  ADDITIONAL_JOURNALISTS,
  EXPANDED_JOURNALIST_DATABASE
};