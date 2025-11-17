// HARDCODED JOURNALIST REGISTRY - No database, no RLS bullshit
// Exactly like master-source-registry approach

export const JOURNALIST_REGISTRY = {
  // PR / PUBLIC RELATIONS
  public_relations: {
    tier1: [
      { name: 'Steve Barrett', outlet: 'PRWeek', beat: 'PR Industry News', twitter: '@steve_w_barrett', email: 'steve.barrett@prweek.com' },
      { name: 'Diana Marszalek', outlet: 'PRWeek', beat: 'Agency Business', twitter: '@dianamarszalek', email: 'diana.marszalek@prweek.com' },
      { name: 'Frank Washkuch', outlet: 'PRWeek', beat: 'Technology & Crisis', twitter: '@fwashkuch', email: 'frank.washkuch@prweek.com' },
      { name: 'Gideon Fidelzeid', outlet: 'PRWeek', beat: 'Corporate Comms', twitter: '@gfidelzeid', email: 'gideon.fidelzeid@prweek.com' },
      { name: 'Arun Sudhaman', outlet: 'PRovoke Media', beat: 'PR Industry Analysis', twitter: '@arunsudhaman', email: 'arun@provokemedia.com' },
      { name: 'Paul Holmes', outlet: 'The Holmes Report', beat: 'PR Strategy', twitter: '@paulholmes', email: 'paul.holmes@holmesreport.com' },
      { name: 'Matthew Schwartz', outlet: 'PR News', beat: 'PR Technology', twitter: '@mattschwartznow', email: 'mschwartz@accessintel.com' },
      { name: 'Seth Arenstein', outlet: 'Ragan Communications', beat: 'Internal Comms & PR', twitter: '@setharenstein', email: 'sarenstein@ragan.com' },
      { name: 'Mark Ragan', outlet: 'Ragan Communications', beat: 'Communications Leadership', twitter: '@markragan', email: 'mark@ragan.com' }
    ],
    tier2: [
      { name: 'Sally Falkow', outlet: 'Proactive Report', beat: 'PR Measurement', twitter: '@sallyfalkow', email: 'sally@proactivereport.com' },
      { name: 'Shonali Burke', outlet: 'Waxing UnLyrical', beat: 'PR Strategy', twitter: '@shonali', email: 'shonali@waxingunlyrical.com' },
      { name: 'Gini Dietrich', outlet: 'Spin Sucks', beat: 'PR & Marketing', twitter: '@ginidietrich', email: 'gini@spinsucks.com' },
      { name: 'Heather Whaling', outlet: 'Geben Communication', beat: 'Nonprofit PR', twitter: '@heatherwhaling', email: 'heather@gebencommunication.com' }
    ]
  },

  // ADVERTISING / MARKETING
  advertising: {
    tier1: [
      { name: 'Sara Fischer', outlet: 'Axios', beat: 'Media & Streaming', twitter: '@sarafischer', email: 'sara@axios.com' },
      { name: 'Lucia Moses', outlet: 'Digiday', beat: 'Media & Marketing', twitter: '@luciam', email: 'lucia.moses@digiday.com' },
      { name: 'Suzanne Vranica', outlet: 'Wall Street Journal', beat: 'Advertising', twitter: '@svranica', email: 'suzanne.vranica@wsj.com' },
      { name: 'Sahil Patel', outlet: 'The Information', beat: 'Media & Advertising', twitter: '@sahilpatel', email: 'sahil@theinformation.com' },
      { name: 'Garett Sloane', outlet: 'Ad Age', beat: 'Digital Advertising', twitter: '@garettsloane', email: 'gsloane@adage.com' },
      { name: 'E.J. Schultz', outlet: 'Ad Age', beat: 'Marketing', twitter: '@EJSchultz', email: 'eschultz@adage.com' },
      { name: 'Jack Neff', outlet: 'Ad Age', beat: 'Marketing', twitter: '@Jack_Neff', email: 'jneff@adage.com' },
      { name: 'Kristina Monllos', outlet: 'Digiday', beat: 'Advertising', twitter: '@kmonllos', email: 'kristina.monllos@digiday.com' },
      { name: 'Ann Handley', outlet: 'Total Annarchy', beat: 'Marketing', twitter: '@annhandley', email: 'ann@annhandley.com' },
      { name: 'Tanya Dua', outlet: 'Business Insider', beat: 'Advertising', twitter: '@tanyadua', email: 'tdua@businessinsider.com' }
    ],
    tier2: []
  },

  // TECHNOLOGY
  technology: {
    tier1: [
      // NYT Tech
      { name: 'Kashmir Hill', outlet: 'New York Times', beat: 'Privacy & Surveillance Tech', twitter: '@kashhill', email: 'kashmir.hill@nytimes.com' },
      { name: 'Kalley Huang', outlet: 'New York Times', beat: 'Tech & Social Media', twitter: '@kalleyhuang', email: 'kalley.huang@nytimes.com' },
      { name: 'Nico Grant', outlet: 'New York Times', beat: 'Google & Tech Giants', twitter: '@nicolegrant', email: 'nico.grant@nytimes.com' },
      { name: 'Tripp Mickle', outlet: 'New York Times', beat: 'Apple & Consumer Tech', twitter: '@tMickle', email: 'tripp.mickle@nytimes.com' },
      { name: 'Brian X. Chen', outlet: 'New York Times', beat: 'Consumer Tech', twitter: '@bxchen', email: 'brian.chen@nytimes.com' },
      { name: 'Kellen Browning', outlet: 'New York Times', beat: 'Gaming & Virtual Worlds', twitter: '@kellen_browning', email: 'kellen.browning@nytimes.com' },

      // WSJ Tech
      { name: 'Tim Higgins', outlet: 'Wall Street Journal', beat: 'Apple & Tesla', twitter: '@timkhiggins', email: 'tim.higgins@wsj.com' },
      { name: 'Rob Copeland', outlet: 'Wall Street Journal', beat: 'Tech Finance', twitter: '@RobCopeland', email: 'rob.copeland@wsj.com' },

      // TechCrunch
      { name: 'Alex Wilhelm', outlet: 'TechCrunch', beat: 'Venture Capital & Startups', twitter: '@alex', email: 'alex.wilhelm@techcrunch.com' },
      { name: 'Sarah Perez', outlet: 'TechCrunch', beat: 'Consumer Apps', twitter: '@sarahintampa', email: 'sarah.perez@techcrunch.com' },

      // The Verge
      { name: 'Nilay Patel', outlet: 'The Verge', beat: 'Tech Editor', twitter: '@reckless', email: 'nilay@theverge.com' },
      { name: 'David Pierce', outlet: 'The Verge', beat: 'Consumer Tech', twitter: '@pierce', email: 'david.pierce@theverge.com' },

      // Bloomberg
      { name: 'Mark Gurman', outlet: 'Bloomberg', beat: 'Apple & Tech', twitter: '@markgurman', email: 'mgurman@bloomberg.net' },
      { name: 'Ed Ludlow', outlet: 'Bloomberg', beat: 'Tech & Venture Capital', twitter: '@edludlow', email: 'eludlow@bloomberg.net' },

      // The Information
      { name: 'Alex Heath', outlet: 'The Information', beat: 'Meta & Social Platforms', twitter: '@alexeheath', email: 'alex@theinformation.com' },

      // Wired
      { name: 'Lauren Goode', outlet: 'Wired', beat: 'Consumer Tech', twitter: '@laurengoode', email: 'lauren_goode@wired.com' },
      { name: 'Senior Strategy Reporter', outlet: 'Ars Technica', beat: 'Strategy', twitter: '@arstechnica', email: 'tips@arstechnica.com' }
    ],
    tier2: []
  },

  // FINTECH / BANKING
  fintech: {
    tier1: [
      // WSJ Banking/Fintech
      { name: 'AnnaMaria Andriotis', outlet: 'Wall Street Journal', beat: 'Consumer Finance & Credit Cards', twitter: '@AnnaMaria', email: 'annamaria.andriotis@wsj.com' },
      { name: 'Peter Rudegeair', outlet: 'Wall Street Journal', beat: 'Banking & Finance', twitter: '@rudegeair', email: 'peter.rudegeair@wsj.com' },
      { name: 'David Benoit', outlet: 'Wall Street Journal', beat: 'Banking Industry', twitter: '@DavidBenoit', email: 'david.benoit@wsj.com' },

      // Bloomberg Banking/Fintech
      { name: 'Sridhar Natarajan', outlet: 'Bloomberg', beat: 'Fintech & Digital Banking', twitter: '@sridnews', email: 'snatarajan52@bloomberg.net' },
      { name: 'Gillian Tan', outlet: 'Bloomberg', beat: 'Finance & Deals', twitter: '@gillianwtan', email: 'gtan10@bloomberg.net' },
      { name: 'Sonali Basak', outlet: 'Bloomberg', beat: 'Wall Street & Banking', twitter: '@sonalibasak', email: 'sbasak4@bloomberg.net' },

      // NYT Finance
      { name: 'Emily Flitter', outlet: 'New York Times', beat: 'Banking & Finance', twitter: '@FlitterOnFraud', email: 'emily.flitter@nytimes.com' },
      { name: 'Nathaniel Popper', outlet: 'New York Times', beat: 'Fintech & Crypto', twitter: '@nathanielpopper', email: 'nathaniel.popper@nytimes.com' },

      // American Banker
      { name: 'Penny Crosman', outlet: 'American Banker', beat: 'Banking Technology', twitter: '@PennyCrosman', email: 'penny.crosman@arizent.com' },
      { name: 'Kate Fitzgerald', outlet: 'American Banker', beat: 'Payments & Fintech', twitter: '@katefitzgeraldb', email: 'kate.fitzgerald@arizent.com' },

      // TechCrunch Fintech
      { name: 'Mary Ann Azevedo', outlet: 'TechCrunch', beat: 'Fintech & Venture Capital', twitter: '@MaryAnnAzevedo', email: 'maryann@techcrunch.com' },

      // The Information Fintech
      { name: 'Tom Dotan', outlet: 'The Information', beat: 'Fintech & Payments', twitter: '@cityofthetown', email: 'tom@theinformation.com' },

      // Reuters Finance
      { name: 'Elizabeth Dilts Marshall', outlet: 'Reuters', beat: 'Banking & Regulation', twitter: '@ediltsmarshal', email: 'elizabeth.diltsmarshall@reuters.com' },

      // FT Banking
      { name: 'Robert Armstrong', outlet: 'Financial Times', beat: 'Finance & Markets', twitter: '@robertarmstrong', email: 'robert.armstrong@ft.com' },
      { name: 'Sujeet Indap', outlet: 'Financial Times', beat: 'Banking & M&A', twitter: '@sujeetindap', email: 'sujeet.indap@ft.com' }
    ],
    tier2: [
      { name: 'Ron Shevlin', outlet: 'Forbes', beat: 'Banking & Fintech Strategy', twitter: '@rshevlin', email: 'rshevlin@forbes.com' },
      { name: 'Jason Mikula', outlet: 'Fintech Business Weekly', beat: 'Fintech Analysis', twitter: '@jasonmikula', email: 'jason@fintechbusinessweekly.com' }
    ]
  }
};

// Flatten function to search across all industries/tiers
export function getJournalists(industry?: string, tier?: string): any[] {
  const journalists: any[] = [];

  if (industry) {
    // Get specific industry
    const industryData = JOURNALIST_REGISTRY[industry as keyof typeof JOURNALIST_REGISTRY];
    if (industryData) {
      if (tier) {
        const tierData = industryData[tier as keyof typeof industryData] || [];
        journalists.push(...tierData.map(j => ({ ...j, industry, tier })));
      } else {
        // All tiers for this industry
        Object.entries(industryData).forEach(([t, journalistList]) => {
          journalists.push(...(journalistList as any[]).map(j => ({ ...j, industry, tier: t })));
        });
      }
    }
  } else {
    // All industries
    Object.entries(JOURNALIST_REGISTRY).forEach(([ind, industryData]) => {
      if (tier) {
        const tierData = industryData[tier as keyof typeof industryData] || [];
        journalists.push(...(tierData as any[]).map(j => ({ ...j, industry: ind, tier })));
      } else {
        Object.entries(industryData).forEach(([t, journalistList]) => {
          journalists.push(...(journalistList as any[]).map(j => ({ ...j, industry: ind, tier: t })));
        });
      }
    });
  }

  return journalists;
}
