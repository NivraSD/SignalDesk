import DataSourceIntegration from './DataSourceIntegration';
import WebIntelligenceAgent from './WebIntelligenceAgent';

class CompanyAnalysis {
  constructor() {
    this.analysisFrameworks = {
      // McKinsey 7S Framework
      sevenS: ['strategy', 'structure', 'systems', 'shared_values', 'skills', 'style', 'staff'],
      
      // Porter's Five Forces
      portersFive: ['competitive_rivalry', 'supplier_power', 'buyer_power', 'threat_substitutes', 'threat_new_entrants'],
      
      // PESTLE Analysis
      pestle: ['political', 'economic', 'social', 'technological', 'legal', 'environmental'],
      
      // Stakeholder Mapping
      stakeholderTypes: ['investors', 'customers', 'employees', 'suppliers', 'regulators', 'communities', 'media', 'competitors']
    };
  }

  async performDeepAnalysis(companyName, additionalContext = {}) {
    console.log('🔍 Starting deep analysis for:', companyName);
    
    const analysis = {
      company: companyName,
      timestamp: new Date(),
      marketPosition: {},
      industryDynamics: {},
      stakeholderLandscape: {},
      strategicPriorities: {},
      riskFactors: {},
      opportunities: {},
      recommendations: {}
    };

    try {
      // Phase 1: Basic Company Intelligence
      console.log('📊 Phase 1: Gathering company profile...');
      const companyProfile = await this.gatherCompanyProfile(companyName, additionalContext);
      
      // Estimate company size after gathering profile
      companyProfile.size = await this.estimateCompanySize(companyProfile);
      console.log(`📏 Estimated company size: ${companyProfile.size}`);
      
      analysis.profile = companyProfile;

      // Phase 2: Industry Analysis
      console.log('🏭 Phase 2: Analyzing industry...');
      const industryAnalysis = await this.analyzeIndustry(companyProfile);
      analysis.industryDynamics = industryAnalysis;

      // Phase 3: Competitive Landscape
      console.log('🎯 Phase 3: Analyzing competitive landscape...');
      const competitiveAnalysis = await this.analyzeCompetitiveLandscape(companyProfile);
      analysis.marketPosition = competitiveAnalysis;

      // Phase 4: Stakeholder Mapping
      console.log('👥 Phase 4: Mapping stakeholders...');
      const stakeholderMap = await this.mapStakeholders(companyProfile, industryAnalysis);
      analysis.stakeholderLandscape = stakeholderMap;

      // Phase 5: Strategic Priority Identification
      console.log('🎯 Phase 5: Identifying strategic priorities...');
      const priorities = await this.identifyStrategicPriorities(analysis);
      analysis.strategicPriorities = priorities;

      // Phase 6: Risk and Opportunity Assessment
      console.log('⚠️ Phase 6: Assessing risks and opportunities...');
      const riskOpportunity = await this.assessRisksAndOpportunities(analysis);
      analysis.riskFactors = riskOpportunity.risks;
      analysis.opportunities = riskOpportunity.opportunities;

      // Phase 7: Generate Strategic Recommendations
      console.log('💡 Phase 7: Generating recommendations...');
      analysis.recommendations = await this.generateRecommendations(analysis);

      console.log('✅ Analysis complete!');
      return analysis;
    } catch (error) {
      console.error('❌ Error during analysis:', error);
      // Return partial analysis even if some phases fail
      return analysis;
    }
  }

  async gatherCompanyProfile(companyName, additionalContext = {}) {
    // Start with basic profile structure
    const profile = {
      name: companyName,
      industry: await this.inferIndustry(companyName),
      size: 'medium',
      type: 'private',
      headquarters: 'unknown',
      foundedYear: null,
      employeeCount: null,
      revenue: null,
      businessModel: null,
      keyProducts: [],
      recentNews: [],
      leadership: [],
      additionalContext: additionalContext.additionalContext || ''
    };

    let aiAnalysis = ''; // Declare at function scope
    let sections = []; // Declare sections at function scope
    
    try {
      // Use backend AI to analyze the company with sophisticated prompting
      console.log('🤖 Requesting AI analysis for company profile...');
      const response = await fetch('http://localhost:5001/api/ai/analyze', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: `Provide a sophisticated strategic analysis of "${companyName}". Think like a McKinsey consultant analyzing this organization for stakeholder intelligence purposes.

COMPANY PROFILE ANALYSIS:
1. Organization Overview
   - Full legal name and common names/brands
   - Ownership structure (public/private/nonprofit/government)
   - If public: Stock ticker, market cap, major shareholders
   - Founding year and key milestones
   - Geographic footprint and headquarters

2. Business Model & Operations
   - Core business segments and revenue mix
   - Value proposition and competitive differentiation
   - Operating model (B2B/B2C/B2G/Platform/etc.)
   - Key capabilities and assets
   - Technology stack and digital maturity

3. Financial Performance
   - Revenue (latest available and growth trend)
   - Profitability metrics
   - Market share and position
   - Financial health indicators
   - Investment priorities

4. Market Context
   - Industry classification (be specific - e.g., "enterprise cloud infrastructure" not just "technology")
   - Market size and growth dynamics
   - Regulatory environment and compliance requirements
   - Key industry trends affecting the company
   - Disruption risks and opportunities

5. Competitive Landscape
   - Direct competitors (name specific companies)
   - Competitive advantages and moats
   - Market positioning (leader/challenger/follower/nicher)
   - Substitutes and alternative solutions
   - Partnership ecosystem

6. Leadership & Culture
   - CEO and key executives (names and tenure)
   - Board composition and governance
   - Organizational culture and values
   - Employee satisfaction indicators
   - Diversity, equity, and inclusion metrics

7. Strategic Priorities
   - Stated strategic goals and initiatives
   - Recent major announcements or pivots
   - M&A activity and integration
   - Innovation and R&D focus areas
   - ESG commitments and progress

8. Stakeholder Landscape Preview
   - Critical stakeholder groups specific to this company
   - Recent stakeholder actions or statements
   - Known areas of stakeholder concern
   - Regulatory scrutiny or activism
   - Media sentiment and coverage themes

9. Recent Developments (last 6-12 months)
   - Major news and announcements
   - Leadership changes
   - Product launches or discontinuations
   - Legal or regulatory issues
   - Stock performance (if public)

${additionalContext.additionalContext ? `Additional context to consider: ${additionalContext.additionalContext}` : ''}

Provide specific, factual information where available. For publicly-traded companies, include recent stock performance. For private companies, note funding rounds or ownership changes. Be precise about industry classification and market position.`,
          context: 'company_analysis'
        })
      });

      console.log('🔍 Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Response data keys:', Object.keys(data));
        aiAnalysis = data.response || data.analysis || ''; // Use existing variable
        
        if (!aiAnalysis) {
          console.error('❌ No AI analysis in response');
          return profile;
        }
        
        console.log('📊 AI Analysis received, length:', aiAnalysis.length);
        console.log('📊 First 1000 chars of AI response:', aiAnalysis.substring(0, 1000));
        
        // Log section detection
        sections = aiAnalysis.split(/\n(?=\d+\.)/) || [];
        console.log('📊 Found sections:', sections.length);
        sections.forEach((section, idx) => {
          const firstLine = section.split('\n')[0];
          console.log(`  Section ${idx}: ${firstLine.substring(0, 50)}...`);
        });
        
        // Store full AI insights
        profile.aiInsights = aiAnalysis;
        
        // Initialize arrays to avoid undefined errors
        profile.keyProducts = [];
        profile.businessSegments = [];
        profile.competitors = [];
        profile.strategicPriorities = [];
        profile.competitiveAdvantages = [];
        profile.stakeholderConcerns = [];
        
        // Parse AI response to extract structured data with sophisticated analysis
        const lowerAnalysis = aiAnalysis.toLowerCase();
        
        // Enhanced company type extraction - be more specific to avoid false positives
        if (lowerAnalysis.includes('publicly traded') || lowerAnalysis.includes('public company') || 
            lowerAnalysis.includes('stock ticker') || lowerAnalysis.includes('nasdaq') || lowerAnalysis.includes('nyse') ||
            lowerAnalysis.includes('listed on')) {
          profile.type = 'public';
          
          // Extract stock ticker if mentioned
          const tickerMatch = aiAnalysis.match(/(?:ticker|symbol|traded as)[::\s]+([A-Z]{1,5})/i);
          if (tickerMatch) {
            profile.ticker = tickerMatch[1];
          }
          
          // Extract market cap if mentioned
          const marketCapMatch = aiAnalysis.match(/market\s+cap(?:italization)?[::\s]+\$?([\d.]+)\s*(billion|trillion|million)/i);
          if (marketCapMatch) {
            profile.marketCap = `$${marketCapMatch[1]} ${marketCapMatch[2]}`;
          }
        } else if (lowerAnalysis.includes('nonprofit') || lowerAnalysis.includes('non-profit') || 
                   lowerAnalysis.includes('501(c)') || lowerAnalysis.includes('ngo')) {
          profile.type = 'nonprofit';
        } else if ((lowerAnalysis.includes('government agency') || lowerAnalysis.includes('federal agency') || 
                   lowerAnalysis.includes('state agency') || lowerAnalysis.includes('municipal')) &&
                   !lowerAnalysis.includes('private company')) {
          // Only mark as government if explicitly described as an agency
          profile.type = 'government';
        } else if (lowerAnalysis.includes('private equity') || lowerAnalysis.includes('privately held') || 
                   lowerAnalysis.includes('private company') || lowerAnalysis.includes('privately-owned')) {
          profile.type = 'private';
        } else {
          // For diversified conglomerates, check if they're actually public
          if (profile.industry === 'diversified' && 
              (companyName.toLowerCase().includes('mitsui') || companyName.toLowerCase().includes('mitsubishi'))) {
            profile.type = 'public'; // Most major Japanese trading companies are public
          } else {
            profile.type = 'private'; // default
          }
        }
        
        // Extract founding year
        const foundingMatch = aiAnalysis.match(/(?:founded|established|incorporated)(?:\s+in)?\s+(\d{4})/i);
        if (foundingMatch) {
          profile.foundedYear = parseInt(foundingMatch[1]);
        }
        
        // Extract headquarters location
        const hqMatch = aiAnalysis.match(/(?:headquarter|hq|based in)s?\s+(?:in\s+)?([A-Za-z\s,]+?)(?:\.|,|\sand\s)/i);
        if (hqMatch) {
          profile.headquarters = hqMatch[1].trim();
        }
        
        // Enhanced industry extraction with sub-industry detection
        let industryDetails = {};
        
        // Check for specific industry mentions with context
        const industrySection = aiAnalysis.match(/industry\s+classification[:\s]+([^.]+)/i);
        if (industrySection) {
          const industryText = industrySection[1].toLowerCase();
          
          // Map sophisticated industry classifications
          if (industryText.includes('enterprise cloud infrastructure') || industryText.includes('iaas') || 
              industryText.includes('cloud computing platform')) {
            profile.industry = 'technology';
            industryDetails.subIndustry = 'cloud infrastructure';
          } else if (industryText.includes('e-commerce') || industryText.includes('online retail')) {
            profile.industry = 'retail';
            industryDetails.subIndustry = 'e-commerce';
          } else if (industryText.includes('investment bank') || industryText.includes('wealth management')) {
            profile.industry = 'finance';
            industryDetails.subIndustry = industryText.includes('investment bank') ? 'investment banking' : 'wealth management';
          } else if (industryText.includes('biotech') || industryText.includes('pharmaceutical')) {
            profile.industry = 'healthcare';
            industryDetails.subIndustry = industryText.includes('biotech') ? 'biotechnology' : 'pharmaceuticals';
          }
        }
        
        // Fallback to pattern matching if no specific classification found
        if (!profile.industry) {
          if (lowerAnalysis.includes('diversified') || lowerAnalysis.includes('conglomerate') || 
              lowerAnalysis.includes('trading company') || lowerAnalysis.includes('sogo shosha') ||
              lowerAnalysis.includes('holding company')) {
            profile.industry = 'diversified';
            industryDetails.subIndustry = 'conglomerate';
          } else {
            // Enhanced industry patterns with sub-industries
            const industryPatterns = {
              technology: {
                patterns: ['software', 'saas', 'cloud', 'artificial intelligence', 'cybersecurity', 'data analytics', 'fintech', 'edtech'],
                subIndustries: {
                  'saas': 'enterprise software',
                  'artificial intelligence': 'AI/ML',
                  'cybersecurity': 'security',
                  'fintech': 'financial technology',
                  'edtech': 'education technology'
                }
              },
              healthcare: {
                patterns: ['healthcare', 'health', 'medical', 'pharma', 'biotechnology', 'hospital', 'clinical', 'therapeutics'],
                subIndustries: {
                  'biotechnology': 'biotech',
                  'hospital': 'healthcare services',
                  'pharma': 'pharmaceuticals',
                  'medical device': 'medical devices'
                }
              },
              finance: {
                patterns: ['financial services', 'banking', 'investment', 'insurance', 'asset management', 'payments'],
                subIndustries: {
                  'investment': 'investment management',
                  'banking': 'commercial banking',
                  'insurance': 'insurance',
                  'payments': 'payment processing'
                }
              }
            };
            
            // Look for industry patterns
            for (const [industry, config] of Object.entries(industryPatterns)) {
              const matchedPattern = config.patterns.find(pattern => lowerAnalysis.includes(pattern));
              if (matchedPattern) {
                profile.industry = industry;
                industryDetails.subIndustry = config.subIndustries[matchedPattern] || matchedPattern;
                break;
              }
            }
          }
        }
        
        profile.industryDetails = industryDetails;
        
        // Extract key information using pattern matching
        const extractInfo = (pattern, text) => {
          const match = text.match(pattern);
          return match ? match[1].trim() : null;
        };
        
        // Enhanced revenue extraction with growth trends
        const revenueMatch = aiAnalysis.match(/revenue[:\s]+\$?([\d,.]+)\s*(billion|million|B|M)(?:\s*\(([^)]+)\))?/i);
        if (revenueMatch) {
          profile.revenue = `$${revenueMatch[1]} ${revenueMatch[2]}`;
          if (revenueMatch[3]) {
            profile.revenueGrowth = revenueMatch[3];
          }
        }
        
        // Extract profitability metrics
        const profitMatch = aiAnalysis.match(/(?:profit|margin|ebitda)[:\s]+([^.,]+)/i);
        if (profitMatch) {
          profile.profitability = profitMatch[1].trim();
        }
        
        // Enhanced employee count with location breakdown
        const employeeMatch = aiAnalysis.match(/([\d,]+)\s*employees?(?:\s*(?:globally|worldwide|total))?/i);
        if (employeeMatch) {
          profile.employeeCount = parseInt(employeeMatch[1].replace(/,/g, ''));
        }
        
        // Extract business segments and revenue mix
        const segmentsMatch = aiAnalysis.match(/(?:business segments?|revenue mix)[:\s]+([^.]+)/i);
        if (segmentsMatch) {
          profile.businessSegments = segmentsMatch[1].split(/,|;/).map(s => s.trim()).filter(s => s.length > 0);
        }
        
        // Extract key products/services with more context
        const productsSection = aiAnalysis.match(/(?:core business segments?|main products?|key services?)[:\s]+([^.]+)/i);
        if (productsSection) {
          profile.keyProducts = productsSection[1].split(/,|;/).map(p => p.trim()).filter(p => p.length > 0);
        }
        
        // Enhanced competitor extraction with specific names
        const competitorsSection = aiAnalysis.match(/(?:direct competitors?|key competitors?)[:\s]+([^.]+)/i);
        if (competitorsSection) {
          profile.competitors = competitorsSection[1]
            .split(/,|;|and/)
            .map(c => c.trim())
            .filter(c => c.length > 0 && !c.toLowerCase().includes('include'));
        }
        
        // Extract market position
        const marketPosMatch = aiAnalysis.match(/market position(?:ing)?[:\s]+([^.,]+)/i);
        if (marketPosMatch) {
          const position = marketPosMatch[1].toLowerCase();
          if (position.includes('leader') || position.includes('leading')) {
            profile.marketPosition = 'leader';
          } else if (position.includes('challenger')) {
            profile.marketPosition = 'challenger';
          } else if (position.includes('niche')) {
            profile.marketPosition = 'nicher';
          }
        }
        
        // Extract CEO and leadership
        const ceoMatch = aiAnalysis.match(/(?:ceo|chief executive)[:\s]+([A-Za-z\s]+?)(?:\.|,|;|\sand\s)/i);
        if (ceoMatch) {
          profile.ceo = ceoMatch[1].trim();
        }
        
        // Extract strategic priorities
        const strategicMatch = aiAnalysis.match(/(?:strategic priorities?|strategic goals?)[:\s]+([^.]+)/i);
        if (strategicMatch) {
          profile.strategicPriorities = strategicMatch[1]
            .split(/,|;/)
            .map(p => p.trim())
            .filter(p => p.length > 0);
        }
        
        // Extract ESG commitments
        const esgMatch = aiAnalysis.match(/(?:esg|sustainability|environmental)[^.]*?(?:commitment|goal|target)[s]?[:\s]+([^.]+)/i);
        if (esgMatch) {
          profile.esgCommitments = esgMatch[1].trim();
        }
        
        // Extract recent M&A activity
        const maMatch = aiAnalysis.match(/(?:m&a|merger|acquisition|acquired)[:\s]+([^.]+)/i);
        if (maMatch) {
          profile.recentMA = maMatch[1].trim();
        }
        
        // Extract stakeholder concerns
        const concernsMatch = aiAnalysis.match(/(?:stakeholder concerns?|areas? of concern)[:\s]+([^.]+)/i);
        if (concernsMatch) {
          profile.stakeholderConcerns = concernsMatch[1]
            .split(/,|;/)
            .map(c => c.trim())
            .filter(c => c.length > 0);
        }
        
        // Extract regulatory environment
        const regulatoryMatch = aiAnalysis.match(/(?:regulatory environment|compliance requirements?)[:\s]+([^.]+)/i);
        if (regulatoryMatch) {
          profile.regulatoryEnvironment = regulatoryMatch[1].trim();
        }
        
        // First try to extract key facts from the very beginning of the response
        const firstParagraph = aiAnalysis.split('\n\n')[0];
        if (firstParagraph) {
          // Company description often in first paragraph
          const descMatch = firstParagraph.match(/(?:is\s+a|operates\s+as\s+a)\s+([^.]+)/i);
          if (descMatch && !profile.businessModel) {
            const desc = descMatch[1].trim();
            if (desc.length < 100) {
              profile.businessDescription = desc;
            }
          }
        }
        
        // Enhanced extraction for sections in the AI response
        if (!aiAnalysis) {
          console.error('❌ No AI analysis text to parse');
          return profile;
        }
        
        // Use the sections variable that was already declared above
        sections.forEach(section => {
          const sectionLower = section.toLowerCase();
          
          // Extract from Organization Overview section
          if (sectionLower.includes('organization overview') || sectionLower.includes('full legal name')) {
            // Extract ticker more reliably
            const tickerPatterns = [
              /\(([A-Z]{1,5})\)/,
              /ticker[:\s]+([A-Z]{1,5})/i,
              /symbol[:\s]+([A-Z]{1,5})/i,
              /\b(NYSE|NASDAQ)[:\s]+([A-Z]{1,5})/i
            ];
            
            for (const pattern of tickerPatterns) {
              const match = section.match(pattern);
              if (match) {
                profile.ticker = match[match.length === 3 ? 2 : 1];
                break;
              }
            }
            
            // Extract founding year more reliably
            if (!profile.foundedYear) {
              const yearMatch = section.match(/(?:founded|established|incorporated)(?:\s+in)?\s+(\d{4})/i);
              if (yearMatch) {
                profile.foundedYear = parseInt(yearMatch[1]);
              }
            }
            
            // Extract headquarters
            if (!profile.headquarters) {
              const hqMatch = section.match(/(?:headquarter|hq|based)(?:ed)?\s+(?:in\s+)?([A-Za-z\s,]+?)(?:\.|,|;|\n)/i);
              if (hqMatch) {
                profile.headquarters = hqMatch[1].trim();
              }
            }
          }
          
          // Extract from Business Model section
          if (sectionLower.includes('business model') || sectionLower.includes('core business')) {
            // Extract business model
            const modelMatch = section.match(/(?:operating model|business model)[:\s]+([^.\n]+)/i);
            if (modelMatch) {
              profile.businessModel = modelMatch[1].trim();
            }
            
            // Extract value proposition
            const valueMatch = section.match(/(?:value proposition)[:\s]+([^.\n]+)/i);
            if (valueMatch) {
              profile.valueProposition = valueMatch[1].trim();
            }
            
            // Extract key capabilities
            const capMatch = section.match(/(?:key capabilities)[:\s]+([^.\n]+)/i);
            if (capMatch) {
              profile.keyCapabilities = capMatch[1].split(/,|;/).map(c => c.trim());
            }
            
            // Look for bullet lists in the entire section
            const bulletListMatch = section.match(/(?:core offerings?|key products?|main products?|business segments?).*?\n((?:\s*[-•]\s*[^\n]+\n?)+)/i);
            if (bulletListMatch && bulletListMatch[1]) {
              const bulletText = bulletListMatch[1];
              console.log('🔍 Found bullet list:', bulletText.substring(0, 200));
              const items = bulletText.match(/[-•]\s*([^-•\n]+)/g) || [];
              console.log('🔍 Raw items:', items.length);
              
              if (items.length > 0) {
                const extractedProducts = items
                  .map(item => item.replace(/^[-•]\s*/, '').trim())
                  .filter(p => {
                    const lower = p.toLowerCase();
                    const valid = p.length > 3 && 
                           p.length < 100 && 
                           !lower.includes('operating model') &&
                           !lower.includes('diversified trading') &&
                           !p.includes(':') &&
                           !p.match(/^\d+$/);
                    if (!valid) {
                      console.log('🔍 Filtered out:', p.substring(0, 50));
                    }
                    return valid;
                  })
                  .slice(0, 10);
                  
                console.log('🔍 Extracted products:', extractedProducts);
                profile.keyProducts = extractedProducts;
              }
            }
            
            // If no bullet list found, try comma-separated
            if (!profile.keyProducts.length) {
              const productMatch = section.match(/(?:core offerings?|key products?|main products?).*?:\s*([^.\n]+)/i);
              if (productMatch && productMatch[1]) {
                const productText = productMatch[1].trim();
                if (!productText.includes('while') && !productText.includes('through')) {
                  profile.keyProducts = productText
                    .split(/,\s*/)
                    .map(p => p.trim())
                    .filter(p => p.length > 3 && p.length < 100)
                    .slice(0, 10);
                }
              }
            }
            
            // Extract business segments
            const segmentMatch = section.match(/(?:business segments?|core segments?|revenue mix)[:\s]+([^.\n]+)/i);
            if (segmentMatch) {
              profile.businessSegments = segmentMatch[1].split(/,|;|and/).map(s => s.trim()).filter(s => s.length > 0);
            }
          }
          
          // Extract from Financial Performance section
          if (sectionLower.includes('financial performance') || sectionLower.includes('revenue')) {
            // More flexible revenue extraction
            const revenuePatterns = [
              /revenue[:\s]+\$?([\d,.]+)\s*(billion|million|trillion|B|M|T)(?:\s*\(([^)]+)\))?/i,
              /\$?([\d,.]+)\s*(billion|million|trillion|B|M|T)\s+(?:in\s+)?revenue/i,
              /revenues?\s+of\s+\$?([\d,.]+)\s*(billion|million|trillion|B|M|T)/i,
              /annual revenue[:\s]+\$?([\d,.]+)\s*(billion|million|trillion|B|M|T)/i,
              /revenue.*?\$?([\d,.]+)\s*(billion|million|trillion|B|M|T)/i
            ];
            
            for (const pattern of revenuePatterns) {
              const match = section.match(pattern);
              if (match) {
                profile.revenue = `$${match[1]} ${match[2]}`;
                if (match[3]) {
                  profile.revenueGrowth = match[3];
                }
                break;
              }
            }
            
            // Extract market share
            const shareMatch = section.match(/market share[:\s]+([^.\n]+)/i);
            if (shareMatch) {
              profile.marketShare = shareMatch[1].trim();
            }
          }
          
          // Extract from Leadership section
          if (sectionLower.includes('leadership') || sectionLower.includes('ceo')) {
            // More flexible CEO extraction
            const ceoPatterns = [
              /CEO[:\s]+([A-Za-z\s.-]+?)(?:\.|,|;|\n|$)/i,
              /Chief Executive Officer[:\s]+([A-Za-z\s.-]+?)(?:\.|,|;|\n|$)/i,
              /led by (?:CEO\s+)?([A-Za-z\s.-]+?)(?:\.|,|;|\n|$)/i,
              /President and CEO[:\s]+([A-Za-z\s.-]+?)(?:\.|,|;|\n|$)/i,
              /([A-Za-z\s.-]+?)\s+(?:serves as|is the)\s+CEO/i
            ];
            
            for (const pattern of ceoPatterns) {
              const match = section.match(pattern);
              if (match) {
                profile.ceo = match[1].trim();
                break;
              }
            }
            
            // Extract culture
            const cultureMatch = section.match(/(?:culture|values)[:\s]+([^.\n]+)/i);
            if (cultureMatch) {
              profile.culture = cultureMatch[1].trim();
            }
          }
          
          // Extract from Competitive Landscape section
          if (sectionLower.includes('competitive landscape') || sectionLower.includes('competitors')) {
            // Extract specific competitor names with improved patterns
            const competitorPatterns = [
              /(?:direct competitors?|key competitors?|main competitors?)\s*(?:include|are)?\s*:?\s*([^.\n]+)/i,
              /(?:competes?\s+with|competes?\s+against|faces competition from)\s+([^.\n]+)/i,
              /competitors?\s+include\s*:?\s*([^.\n]+)/i,
              /primary competitors?\s*:?\s*([^.\n]+)/i,
              /competitive landscape\s+includes?\s*:?\s*([^.\n]+)/i
            ];
            
            for (const pattern of competitorPatterns) {
              const match = section.match(pattern);
              if (match && match[1]) {
                // Improved parsing to handle "and" properly and complex company names
                const competitorText = match[1].trim();
                let competitors = [];
                
                // First split by comma, but preserve commas within parentheses
                const parts = competitorText.split(/,\s*(?![^()]*\))/);
                
                parts.forEach(part => {
                  part = part.trim();
                  // Check if this part contains " and " without commas (last item)
                  if (part.includes(' and ') && !part.includes(',')) {
                    // Split the "X and Y" format
                    const andParts = part.split(' and ');
                    competitors.push(...andParts.map(p => p.trim()));
                  } else {
                    // Remove trailing "and" if present
                    part = part.replace(/\s+and\s*$/, '').trim();
                    competitors.push(part);
                  }
                });
                
                // Filter and clean
                competitors = competitors
                  .map(c => {
                    // Remove markdown formatting
                    c = c.trim()
                      .replace(/^[-*•]\s*/, '')  // Remove bullet points
                      .replace(/^\d+\.\s*/, '')  // Remove numbered lists
                      .replace(/^['""]|['""]$/g, ''); // Remove quotes
                    return c;
                  })
                  .filter(c => 
                    c.length > 2 && 
                    c.length < 100 && 
                    !c.toLowerCase().includes('include') && 
                    !c.toLowerCase().includes('such as') &&
                    !c.toLowerCase().includes('other') &&
                    !c.toLowerCase().includes('various') &&
                    c !== 'Inc.' && 
                    c !== 'Corp.' &&
                    c !== 'LLC'
                  );
                
                if (competitors.length > 0) {
                  profile.competitors = competitors.slice(0, 10); // Keep up to 10 competitors
                  break;
                }
              }
            }
            
            // Extract competitive advantages
            const advantagesMatch = section.match(/(?:competitive advantages?|advantages?|key differentiators?)[:\s]+([^.\n]+)/i);
            if (advantagesMatch) {
              profile.competitiveAdvantages = advantagesMatch[1]
                .split(/,|;/)
                .map(a => a.trim())
                .filter(a => a.length > 0 && a.length < 100);
            }
          }
          
          // Extract from Strategic Priorities section
          if (sectionLower.includes('strategic priorities') || sectionLower.includes('strategic goals')) {
            const priorityPatterns = [
              /(?:strategic priorities?|strategic goals?)[:\s]+([^.\n]+)/i,
              /(?:priorities include|goals include)[:\s]+([^.\n]+)/i,
              /(?:focused on|focusing on)[:\s]+([^.\n]+)/i
            ];
            
            for (const pattern of priorityPatterns) {
              const match = section.match(pattern);
              if (match && match[1]) {
                profile.strategicPriorities = match[1]
                  .split(/,|;|and/)
                  .map(p => p.trim())
                  .filter(p => p.length > 0 && p.length < 100);
                break;
              }
            }
          }
          
          // Extract from Stakeholder Landscape section
          if (sectionLower.includes('stakeholder landscape') || sectionLower.includes('stakeholder groups')) {
            // Extract stakeholder concerns
            const concernMatch = section.match(/(?:stakeholder concerns?|areas? of concern|known areas of)[:\s]+([^.\n]+)/i);
            if (concernMatch) {
              profile.stakeholderConcerns = concernMatch[1]
                .split(/,|;|and/)
                .map(c => c.trim())
                .filter(c => c.length > 0);
            }
          }
          
          // Extract from Recent Developments section
          if (sectionLower.includes('recent developments') || sectionLower.includes('recent news')) {
            // Extract recent news items
            const newsItems = section.match(/[-•]\s*([^-•\n]+)/g);
            if (newsItems && newsItems.length > 0) {
              profile.recentDevelopments = newsItems.map(item => 
                item.replace(/^[-•]\s*/, '').trim()
              ).filter(item => item.length > 10);
            }
          }
        });
        
        // Log what we have before fallback extraction
        console.log('📊 Before fallback extraction:', {
          productsCount: profile.keyProducts?.length || 0,
          products: profile.keyProducts?.slice(0, 3)
        });
        
        // Additional fallback extraction from full text if sections didn't capture everything
        if (!profile.keyProducts.length) {
          // Try to extract from full AI response
          const productPatterns = [
            /(?:products and services|key offerings?|main products?|core offerings?)(?:\s+include)?[:\s]*([^.]+?)(?:\.|The|Their)/i,
            /(?:portfolio includes?|offerings? include)[:\s]*([^.]+?)(?:\.|The|Their)/i,
            /(?:primary business(?:es)?|main business(?:es)?)[:\s]*([^.]+?)(?:\.|The|Their)/i
          ];
          
          for (const pattern of productPatterns) {
            const match = aiAnalysis.match(pattern);
            if (match && match[1]) {
              const productText = match[1].trim();
              // Avoid sentence fragments
              if (!productText.includes('while') && 
                  !productText.includes('through') && 
                  !productText.includes('which') &&
                  !productText.includes('that') &&
                  productText.length < 200) {
                
                const products = productText
                  .split(/,\s*(?![^()]*\))/)
                  .map(p => {
                    p = p.trim();
                    // Handle "X and Y" as last item
                    if (p.includes(' and ') && !p.includes(',')) {
                      return p.split(' and ').map(x => x.trim());
                    }
                    return p;
                  })
                  .flat()
                  .filter(p => p.length > 3 && p.length < 80 && !p.includes(':'))
                  .slice(0, 5);
                
                if (products.length > 0) {
                  profile.keyProducts = products;
                  break;
                }
              }
            }
          }
        }
        
        if (!profile.strategicPriorities.length) {
          // Extract strategic priorities from anywhere in the text
          const strategyPatterns = [
            /(?:strategic priorities|key initiatives|focus areas)[:\s]*([^.]+)/i,
            /(?:prioritizing|focused on|investing in)\s+([^.]+?)(?:\.|The|and)/i
          ];
          
          for (const pattern of strategyPatterns) {
            const match = aiAnalysis.match(pattern);
            if (match && match[1]) {
              const priorities = match[1]
                .split(/,|;|and/)
                .map(p => p.trim())
                .filter(p => p.length > 3 && p.length < 100);
              
              if (priorities.length > 0) {
                profile.strategicPriorities = priorities.slice(0, 5);
                break;
              }
            }
          }
        }
        
        if (!profile.businessSegments.length && profile.keyProducts.length > 0) {
          // Use key products as business segments if no segments found
          profile.businessSegments = profile.keyProducts.slice(0, 3);
        }
        
        // For diversified companies, look for common business segment patterns
        if (profile.industry === 'diversified' && (!profile.keyProducts.length || profile.keyProducts[0].length < 10)) {
          const segmentPatterns = [
            /(?:Mineral\s*&?\s*Metal(?:s)?(?:\s+Resources)?)/gi,
            /(?:Energy(?:\s+(?:Resources|Solutions|Business))?)/gi,
            /(?:Machinery\s*&?\s*Infrastructure)/gi,
            /(?:Chemicals?(?:\s+Business)?)/gi,
            /(?:Iron\s*&?\s*Steel(?:\s+Products)?)/gi,
            /(?:Lifestyle(?:\s+\([^)]+\))?)/gi,
            /(?:Innovation\s*&?\s*Corporate\s+Development)/gi,
            /(?:Food(?:\s+(?:Resources|Products|Business))?)/gi,
            /(?:Consumer(?:\s+(?:Products|Services|Business))?)/gi,
            /(?:Healthcare(?:\s+(?:Business|Services))?)/gi,
            /(?:ICT(?:\s+Business)?)/gi,
            /(?:Mobility(?:\s+Business)?)/gi
          ];
          
          const foundSegments = [];
          segmentPatterns.forEach(pattern => {
            const matches = aiAnalysis.match(pattern);
            if (matches) {
              matches.forEach(match => {
                const cleaned = match.trim();
                if (!foundSegments.includes(cleaned)) {
                  foundSegments.push(cleaned);
                }
              });
            }
          });
          
          if (foundSegments.length > 0) {
            console.log('🔍 Found diversified segments:', foundSegments);
            profile.keyProducts = foundSegments.slice(0, 8);
          }
        }
        
        // Fallback extraction for CEO from full text
        if (!profile.ceo && aiAnalysis) {
          const ceoPatterns = [
            /(?:CEO|Chief Executive Officer)[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})/,
            /([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\s+(?:serves as|is the|is)\s+CEO/,
            /led by\s+(?:CEO\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})/
          ];
          
          for (const pattern of ceoPatterns) {
            const match = aiAnalysis.match(pattern);
            if (match && match[1]) {
              const ceoName = match[1].trim();
              if (ceoName.split(' ').length >= 2 && ceoName.length < 50) {
                profile.ceo = ceoName;
                break;
              }
            }
          }
        }
        
        // Fallback extraction for revenue from full text
        if (!profile.revenue && aiAnalysis) {
          const revenueMatch = aiAnalysis.match(/(?:revenue|revenues).*?\$?([\d,.]+)\s*(billion|million|trillion)/i);
          if (revenueMatch) {
            const amount = parseFloat(revenueMatch[1].replace(/,/g, ''));
            const unit = revenueMatch[2].toLowerCase();
            
            // Sanity check - no company has revenue over $1 trillion
            if (unit === 'trillion' && amount > 1) {
              // This is likely total trading volume, not revenue
              console.log('⚠️ Skipping unrealistic revenue figure:', `$${revenueMatch[1]} ${revenueMatch[2]}`);
            } else {
              profile.revenue = `$${revenueMatch[1]} ${revenueMatch[2]}`;
            }
          }
        }
        
        console.log('📊 Enhanced extraction complete:', {
          industry: profile.industry,
          subIndustry: profile.industryDetails?.subIndustry,
          type: profile.type,
          ticker: profile.ticker,
          marketCap: profile.marketCap,
          ceo: profile.ceo,
          foundedYear: profile.foundedYear,
          headquarters: profile.headquarters,
          businessModel: profile.businessModel,
          valueProposition: profile.valueProposition,
          revenue: profile.revenue,
          competitors: profile.competitors,
          keyProducts: profile.keyProducts,
          businessSegments: profile.businessSegments,
          strategicPriorities: profile.strategicPriorities,
          revenue: profile.revenue,
          businessModel: profile.businessModel,
          hasProducts: !!profile.keyProducts?.length,
          competitorsCount: profile.competitors?.length || 0,
          competitorNames: profile.competitors?.slice(0, 3)
        });
      } else {
        console.error('❌ AI API request failed with status:', response.status);
        try {
          const errorData = await response.text();
          console.error('❌ Error response:', errorData);
        } catch (e) {
          console.error('❌ Could not parse error response');
        }
      }
    } catch (error) {
      console.error('❌ AI analysis error:', error);
      console.error('❌ Error stack:', error.stack);
    }

    // Fallback extraction if we still don't have key data and have AI insights
    if (profile.aiInsights) {
      const aiAnalysisText = profile.aiInsights;
      
      if (!profile.competitors || profile.competitors.length === 0) {
        // Try a more general search for competitors anywhere in the text
        const competitorSentences = aiAnalysisText.match(/[^.]*(?:compet|rival)[^.]*\./gi) || [];
        const potentialCompetitors = [];
        
        competitorSentences.forEach(sentence => {
          // Look for company names (capitalized words, potentially with Inc., LLC, etc.)
          const companyNames = sentence.match(/\b[A-Z][a-zA-Z]*(?:\s+[A-Z][a-zA-Z]*)*(?:\s+(?:Inc|LLC|Ltd|Corp|Corporation|Company|Co))?\b/g) || [];
          companyNames.forEach(name => {
            if (name !== companyName && !name.match(/^(The|And|Or|With|Against|CEO|CFO|CTO)$/)) {
              potentialCompetitors.push(name);
            }
          });
        });
        
        if (potentialCompetitors.length > 0) {
          profile.competitors = [...new Set(potentialCompetitors)]; // Remove duplicates
        }
      }
      
      // Ensure we have at least basic products/services
      if (!profile.keyProducts || profile.keyProducts.length === 0) {
        const productSentences = aiAnalysisText.match(/[^.]*(?:product|service|offer|provide|solution)[^.]*\./gi) || [];
        const products = [];
        
        productSentences.forEach(sentence => {
          const productMatch = sentence.match(/(?:offers?|provides?|delivers?|sells?)\s+([^.,]+)/i);
          if (productMatch) {
            products.push(productMatch[1].trim());
          }
        });
        
        if (products.length > 0) {
          profile.keyProducts = products.slice(0, 5);
        }
      }
      
      // Ensure we have business segments if mentioned
      if (!profile.businessSegments || profile.businessSegments.length === 0) {
        const segmentMatch = aiAnalysisText.match(/(?:segments?|divisions?|business units?|operates? in)[:\s]+([^.]+)/i);
        if (segmentMatch) {
          profile.businessSegments = segmentMatch[1]
            .split(/,|;|and/)
            .map(s => s.trim())
            .filter(s => s.length > 0);
        }
      }
    }
    
    try {
      // Also gather web intelligence
      const searchResults = await WebIntelligenceAgent.performWebSearch(`"${companyName}" company profile news`);
      
      if (searchResults && searchResults.length > 0) {
        profile.recentNews = searchResults.slice(0, 5).map(r => ({
          title: r.title,
          date: r.timestamp,
          sentiment: r.sentiment || 'neutral',
          url: r.url,
          source: r.source
        }));
      }

      // Search for competitors
      const competitorResults = await WebIntelligenceAgent.performWebSearch(`"${companyName}" competitors market share`);
      if (competitorResults && competitorResults.length > 0) {
        profile.competitorMentions = competitorResults.slice(0, 3);
      }
      
    } catch (error) {
      console.error('Web search error:', error);
    }

    return profile;
  }

  async inferIndustry(companyName) {
    // Industry inference logic based on company name and search results
    // Check for known diversified conglomerates first
    const diversifiedCompanies = ['mitsui', 'mitsubishi', 'sumitomo', 'itochu', 'marubeni', 'berkshire', 'tata', 'samsung'];
    const lowerName = companyName.toLowerCase();
    
    if (diversifiedCompanies.some(company => lowerName.includes(company))) {
      return 'diversified';
    }
    
    const industryKeywords = {
      technology: ['tech', 'software', 'digital', 'cyber', 'data', 'cloud', 'AI'],
      healthcare: ['health', 'medical', 'pharma', 'bio', 'care', 'therapeutics'],
      finance: ['bank', 'financial', 'capital', 'invest', 'insurance', 'fintech'],
      retail: ['retail', 'store', 'shop', 'commerce', 'market'],
      manufacturing: ['manufacturing', 'industrial', 'factory', 'production'],
      energy: ['energy', 'power', 'oil', 'gas', 'renewable', 'solar'],
      media: ['media', 'entertainment', 'broadcast', 'publish', 'content'],
      education: ['education', 'university', 'college', 'school', 'academy', 'learning'],
      nonprofit: ['foundation', 'charity', 'nonprofit', 'association', 'society']
    };
    
    for (const [industry, keywords] of Object.entries(industryKeywords)) {
      if (keywords.some(keyword => lowerName.includes(keyword))) {
        return industry;
      }
    }

    return 'general';
  }

  async analyzeIndustry(companyProfile) {
    const analysis = {
      industry: companyProfile.industry,
      maturity: 'growth', // emerging, growth, mature, declining
      growthRate: 'moderate',
      keyTrends: [],
      majorPlayers: [],
      disruptors: [],
      regulations: [],
      marketSize: null,
      dynamics: {}
    };

    // Industry-specific analysis
    const industryInsights = {
      technology: {
        maturity: 'growth',
        growthRate: 'high',
        keyTrends: [
          'AI/ML adoption',
          'Cloud transformation',
          'Cybersecurity concerns',
          'Remote work tools',
          'Data privacy regulations'
        ],
        regulations: ['GDPR', 'CCPA', 'SOC2', 'ISO27001'],
        dynamics: {
          innovation_pace: 'very high',
          barrier_to_entry: 'moderate',
          customer_loyalty: 'low',
          price_sensitivity: 'moderate'
        }
      },
      healthcare: {
        maturity: 'mature',
        growthRate: 'moderate',
        keyTrends: [
          'Digital health adoption',
          'Personalized medicine',
          'Value-based care',
          'Telehealth expansion',
          'AI in diagnostics'
        ],
        regulations: ['HIPAA', 'FDA', 'Medicare/Medicaid', 'Clinical trials'],
        dynamics: {
          innovation_pace: 'high',
          barrier_to_entry: 'very high',
          customer_loyalty: 'high',
          price_sensitivity: 'low'
        }
      },
      finance: {
        maturity: 'mature',
        growthRate: 'low',
        keyTrends: [
          'Digital transformation',
          'Fintech disruption',
          'Cryptocurrency adoption',
          'ESG investing',
          'Regulatory changes'
        ],
        regulations: ['Dodd-Frank', 'Basel III', 'MiFID II', 'AML/KYC'],
        dynamics: {
          innovation_pace: 'moderate',
          barrier_to_entry: 'very high',
          customer_loyalty: 'moderate',
          price_sensitivity: 'high'
        }
      }
    };

    // Apply industry-specific insights
    const insights = industryInsights[companyProfile.industry] || {
      maturity: 'mature',
      growthRate: 'moderate',
      keyTrends: ['Digital transformation', 'Sustainability', 'Customer experience'],
      regulations: ['General business regulations'],
      dynamics: {
        innovation_pace: 'moderate',
        barrier_to_entry: 'moderate',
        customer_loyalty: 'moderate',
        price_sensitivity: 'moderate'
      }
    };

    return { ...analysis, ...insights };
  }

  async analyzeCompetitiveLandscape(companyProfile) {
    const landscape = {
      marketPosition: 'challenger', // leader, challenger, follower, nicher
      competitiveAdvantages: [],
      weaknesses: [],
      competitors: companyProfile.competitors || [],
      marketShare: null,
      differentiators: []
    };

    // Determine market position based on company size and type
    if (companyProfile.size === 'enterprise') {
      landscape.marketPosition = 'leader';
      landscape.competitiveAdvantages = [
        'Global scale and resources',
        'Strong brand recognition',
        'Extensive customer base',
        'Worldwide distribution networks',
        'Research & development capabilities'
      ];
      landscape.weaknesses = [
        'Organizational complexity',
        'Slower decision making',
        'Legacy system constraints',
        'Innovation inertia'
      ];
    } else if (companyProfile.size === 'large') {
      landscape.marketPosition = 'leader';
      landscape.competitiveAdvantages = [
        'Market presence',
        'Brand credibility',
        'Resource availability',
        'Strategic partnerships',
        'Market influence'
      ];
      landscape.weaknesses = [
        'Organizational layers',
        'Change resistance',
        'Cost structure',
        'Agility constraints'
      ];
    } else if (companyProfile.size === 'medium-large') {
      landscape.marketPosition = 'challenger';
      landscape.competitiveAdvantages = [
        'Market agility',
        'Growth momentum',
        'Innovation focus',
        'Strategic flexibility',
        'Emerging brand strength'
      ];
      landscape.weaknesses = [
        'Resource gaps vs leaders',
        'Market penetration',
        'Brand building needs',
        'Scale limitations'
      ];
    } else if (companyProfile.size === 'medium') {
      landscape.marketPosition = 'challenger';
      landscape.competitiveAdvantages = [
        'Operational agility',
        'Focused offerings',
        'Customer intimacy',
        'Innovation capability'
      ];
      landscape.weaknesses = [
        'Limited resources',
        'Brand awareness',
        'Geographic reach',
        'Talent acquisition'
      ];
    } else if (companyProfile.size === 'small') {
      landscape.marketPosition = 'nicher';
      landscape.competitiveAdvantages = [
        'Deep specialization',
        'High flexibility',
        'Low overhead',
        'Personal service',
        'Rapid adaptation'
      ];
      landscape.weaknesses = [
        'Resource constraints',
        'Limited market reach',
        'Scalability challenges',
        'Risk concentration'
      ];
    } else { // startup
      landscape.marketPosition = 'nicher';
      landscape.competitiveAdvantages = [
        'Innovation focus',
        'Disruptive potential',
        'Digital native',
        'Lean operations',
        'Speed to market'
      ];
      landscape.weaknesses = [
        'Limited resources',
        'No brand recognition',
        'Unproven model',
        'Talent retention',
        'Cash flow'
      ];
    }

    // Adjust based on company type
    if (companyProfile.type === 'nonprofit') {
      landscape.competitiveAdvantages.push('Mission-driven focus', 'Community trust');
      landscape.weaknesses = landscape.weaknesses.filter(w => w !== 'Cash flow').concat(['Funding dependency', 'Resource allocation']);
    }

    return landscape;
  }

  async mapStakeholders(companyProfile, industryAnalysis) {
    const stakeholderMap = {
      primary: [],
      secondary: [],
      influence_matrix: {},
      engagement_priorities: []
    };

    // Use AI to identify specific stakeholders for this company with sophisticated analysis
    try {
      console.log('🤖 Using AI to identify key stakeholders...');
      const response = await fetch('http://localhost:5001/api/ai/analyze', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: `Provide a sophisticated stakeholder analysis for ${companyProfile.name} (${companyProfile.industry} industry, ${companyProfile.type} company).

STAKEHOLDER MAPPING ANALYSIS:

1. PRIMARY STAKEHOLDERS (High Power + High Interest)
For each group, identify:
- Specific entities/organizations (not generic categories)
- Current influence level (1-10) and rationale
- Interest/stake level (1-10) and what drives it
- Current sentiment and recent actions
- Top 3 specific concerns
- Preferred engagement channels
- Key decision makers if known

2. SECONDARY STAKEHOLDERS (High Power OR High Interest)
Same analysis as above

3. TERTIARY STAKEHOLDERS (Monitor Only)
- Groups to watch for potential changes in influence/interest

4. STAKEHOLDER DYNAMICS
- Which stakeholder groups influence each other?
- Are there coalitions or opposing factions?
- What triggers would change stakeholder positions?

5. RECENT STAKEHOLDER ACTIONS (last 12 months)
- Specific examples of stakeholder engagement
- Public statements or positions taken
- Regulatory filings or activist campaigns
- Media coverage or social media activity

6. STAKEHOLDER RISK ASSESSMENT
- Which stakeholders pose the highest risk?
- What actions could they take?
- Early warning indicators to monitor

7. ENGAGEMENT OPPORTUNITIES
- Which stakeholders are most receptive to engagement?
- What shared interests exist?
- Potential for converting critics to supporters

Consider company context:
${companyProfile.aiInsights ? companyProfile.aiInsights.substring(0, 1000) : 'No additional context'}

${companyProfile.stakeholderConcerns ? `Known concerns: ${companyProfile.stakeholderConcerns.join(', ')}` : ''}

Provide specific, actionable intelligence rather than generic categories. Name actual organizations, regulatory bodies, activist groups, major customers, or investor entities where possible.`,
          context: 'stakeholder_mapping'
        })
      });

      if (response.ok) {
        const data = await response.json();
        const aiStakeholderAnalysis = data.response || data.analysis || '';
        stakeholderMap.aiAnalysis = aiStakeholderAnalysis;
        
        console.log('👥 AI Stakeholder analysis received');
        
        // Parse stakeholder insights from AI response
        const lowerAnalysis = aiStakeholderAnalysis.toLowerCase();
        
        // Extract specific stakeholder mentions
        const stakeholderKeywords = {
          'investors': ['investors', 'shareholders', 'venture capital', 'vcs', 'funding'],
          'customers': ['customers', 'clients', 'users', 'consumers'],
          'employees': ['employees', 'workforce', 'staff', 'talent'],
          'regulators': ['regulators', 'government', 'compliance', 'regulatory'],
          'media': ['media', 'press', 'journalists', 'analysts'],
          'partners': ['partners', 'suppliers', 'vendors', 'distributors'],
          'community': ['community', 'public', 'society', 'local'],
          'competitors': ['competitors', 'competition', 'rivals']
        };
        
        // Check which stakeholders are mentioned prominently
        const mentionedStakeholders = [];
        for (const [group, keywords] of Object.entries(stakeholderKeywords)) {
          if (keywords.some(keyword => lowerAnalysis.includes(keyword))) {
            mentionedStakeholders.push(group);
          }
        }
        
        // Update primary stakeholders based on AI insights
        if (mentionedStakeholders.length > 0) {
          console.log('📋 AI identified stakeholders:', mentionedStakeholders);
          
          // Enhance existing stakeholder data with AI insights
          stakeholderMap.primary.forEach(stakeholder => {
            const groupLower = stakeholder.group.toLowerCase();
            if (mentionedStakeholders.some(m => groupLower.includes(m) || m.includes(groupLower))) {
              stakeholder.aiIdentified = true;
              stakeholder.influence = Math.min(stakeholder.influence + 1, 10);
            }
          });
        }
      }
    } catch (error) {
      console.error('AI stakeholder analysis error:', error);
    }

    // Define stakeholder templates by industry
    const industryStakeholders = {
      technology: {
        primary: [
          { group: 'Developers/Engineers', influence: 8, interest: 9, sentiment: 'positive' },
          { group: 'Enterprise Customers', influence: 9, interest: 8, sentiment: 'neutral' },
          { group: 'Tech Media', influence: 7, interest: 7, sentiment: 'neutral' },
          { group: 'Investors/VCs', influence: 9, interest: 9, sentiment: 'positive' }
        ],
        secondary: [
          { group: 'Industry Analysts', influence: 8, interest: 6, sentiment: 'neutral' },
          { group: 'Open Source Community', influence: 6, interest: 8, sentiment: 'mixed' },
          { group: 'Regulators', influence: 7, interest: 5, sentiment: 'cautious' },
          { group: 'Partners/Integrators', influence: 6, interest: 7, sentiment: 'positive' }
        ]
      },
      healthcare: {
        primary: [
          { group: 'Healthcare Providers', influence: 9, interest: 9, sentiment: 'neutral' },
          { group: 'Patients/Patient Advocates', influence: 8, interest: 10, sentiment: 'mixed' },
          { group: 'Regulators (FDA/CMS)', influence: 10, interest: 8, sentiment: 'cautious' },
          { group: 'Payers/Insurance', influence: 9, interest: 7, sentiment: 'skeptical' }
        ],
        secondary: [
          { group: 'Medical Associations', influence: 8, interest: 6, sentiment: 'neutral' },
          { group: 'Research Institutions', influence: 7, interest: 8, sentiment: 'positive' },
          { group: 'Healthcare Media', influence: 6, interest: 7, sentiment: 'neutral' },
          { group: 'Investors', influence: 7, interest: 8, sentiment: 'positive' }
        ]
      },
      finance: {
        primary: [
          { group: 'Retail Customers', influence: 7, interest: 9, sentiment: 'mixed' },
          { group: 'Institutional Clients', influence: 9, interest: 8, sentiment: 'neutral' },
          { group: 'Regulators', influence: 10, interest: 9, sentiment: 'cautious' },
          { group: 'Shareholders', influence: 9, interest: 10, sentiment: 'demanding' }
        ],
        secondary: [
          { group: 'Financial Media', influence: 8, interest: 7, sentiment: 'critical' },
          { group: 'Industry Analysts', influence: 7, interest: 6, sentiment: 'neutral' },
          { group: 'Fintech Partners', influence: 6, interest: 8, sentiment: 'collaborative' },
          { group: 'Employee Unions', influence: 5, interest: 9, sentiment: 'mixed' }
        ]
      }
    };

    // Apply industry-specific stakeholder mapping
    const template = industryStakeholders[companyProfile.industry] || {
      primary: [
        { group: 'Customers', influence: 8, interest: 9, sentiment: 'mixed' },
        { group: 'Employees', influence: 7, interest: 10, sentiment: 'positive' },
        { group: 'Investors', influence: 9, interest: 9, sentiment: 'neutral' },
        { group: 'Media', influence: 7, interest: 6, sentiment: 'neutral' }
      ],
      secondary: [
        { group: 'Suppliers', influence: 6, interest: 7, sentiment: 'positive' },
        { group: 'Community', influence: 5, interest: 6, sentiment: 'neutral' },
        { group: 'Regulators', influence: 8, interest: 7, sentiment: 'cautious' },
        { group: 'Competitors', influence: 6, interest: 8, sentiment: 'competitive' }
      ]
    };

    stakeholderMap.primary = template.primary;
    stakeholderMap.secondary = template.secondary;

    // Calculate engagement priorities based on influence and interest
    const allStakeholders = [...template.primary, ...template.secondary];
    stakeholderMap.engagement_priorities = allStakeholders
      .sort((a, b) => (b.influence * b.interest) - (a.influence * a.interest))
      .slice(0, 5)
      .map(s => s.group);

    return stakeholderMap;
  }

  async identifyStrategicPriorities(analysis) {
    const priorities = {
      immediate: [], // 0-3 months
      shortTerm: [], // 3-6 months
      mediumTerm: [], // 6-12 months
      longTerm: [] // 12+ months
    };

    // Base priorities on market position
    const positionPriorities = {
      leader: {
        immediate: ['Maintain market leadership', 'Defend against disruption'],
        shortTerm: ['Expand market share', 'Drive industry standards'],
        mediumTerm: ['Innovation pipeline', 'Ecosystem development'],
        longTerm: ['Market expansion', 'Platform evolution']
      },
      challenger: {
        immediate: ['Differentiation campaign', 'Competitive positioning'],
        shortTerm: ['Market share capture', 'Customer acquisition'],
        mediumTerm: ['Brand building', 'Partnership development'],
        longTerm: ['Category leadership', 'Geographic expansion']
      },
      follower: {
        immediate: ['Value proposition refinement', 'Cost optimization'],
        shortTerm: ['Niche identification', 'Customer retention'],
        mediumTerm: ['Selective expansion', 'Operational excellence'],
        longTerm: ['Sustainable growth', 'Market positioning']
      },
      nicher: {
        immediate: ['Expertise establishment', 'Target market focus'],
        shortTerm: ['Thought leadership', 'Customer intimacy'],
        mediumTerm: ['Market penetration', 'Solution expansion'],
        longTerm: ['Adjacent markets', 'Scale strategies']
      }
    };

    const position = analysis.marketPosition?.marketPosition || 'challenger';
    const basePriorities = positionPriorities[position];

    // Adjust based on industry dynamics
    if (analysis.industryDynamics?.growthRate === 'high') {
      basePriorities.immediate.push('Growth acceleration');
      basePriorities.shortTerm.push('Talent acquisition');
    }

    if (analysis.industryDynamics?.regulations?.length > 3) {
      basePriorities.immediate.push('Compliance readiness');
      basePriorities.mediumTerm.push('Regulatory advocacy');
    }

    return basePriorities;
  }

  async assessRisksAndOpportunities(analysis) {
    const assessment = {
      risks: [],
      opportunities: []
    };

    // Risk identification based on analysis
    const riskMatrix = {
      competitive: {
        condition: () => analysis.marketPosition?.marketPosition === 'leader',
        risks: [
          { type: 'Disruption risk', probability: 'medium', impact: 'high' },
          { type: 'Market share erosion', probability: 'medium', impact: 'medium' },
          { type: 'Talent poaching', probability: 'high', impact: 'medium' }
        ]
      },
      regulatory: {
        condition: () => analysis.industryDynamics?.regulations?.length > 2,
        risks: [
          { type: 'Compliance burden', probability: 'high', impact: 'medium' },
          { type: 'Regulatory changes', probability: 'medium', impact: 'high' },
          { type: 'Legal challenges', probability: 'low', impact: 'high' }
        ]
      },
      market: {
        condition: () => analysis.industryDynamics?.maturity === 'mature',
        risks: [
          { type: 'Market saturation', probability: 'high', impact: 'medium' },
          { type: 'Price pressure', probability: 'high', impact: 'medium' },
          { type: 'Customer churn', probability: 'medium', impact: 'high' }
        ]
      }
    };

    // Opportunity identification
    const opportunityMatrix = {
      growth: {
        condition: () => analysis.industryDynamics?.growthRate === 'high',
        opportunities: [
          { type: 'Market expansion', potential: 'high', timeframe: 'short' },
          { type: 'New customer segments', potential: 'medium', timeframe: 'medium' },
          { type: 'Innovation leadership', potential: 'high', timeframe: 'long' }
        ]
      },
      digital: {
        condition: () => ['technology', 'finance'].includes(analysis.profile?.industry),
        opportunities: [
          { type: 'Digital transformation', potential: 'high', timeframe: 'short' },
          { type: 'Data monetization', potential: 'medium', timeframe: 'medium' },
          { type: 'Platform economics', potential: 'high', timeframe: 'long' }
        ]
      },
      partnership: {
        condition: () => analysis.marketPosition?.marketPosition !== 'leader',
        opportunities: [
          { type: 'Strategic alliances', potential: 'high', timeframe: 'short' },
          { type: 'Channel partnerships', potential: 'medium', timeframe: 'short' },
          { type: 'Ecosystem development', potential: 'high', timeframe: 'medium' }
        ]
      }
    };

    // Apply risk and opportunity matrices
    Object.values(riskMatrix).forEach(category => {
      if (category.condition()) {
        assessment.risks.push(...category.risks);
      }
    });

    Object.values(opportunityMatrix).forEach(category => {
      if (category.condition()) {
        assessment.opportunities.push(...category.opportunities);
      }
    });

    return assessment;
  }

  async generateRecommendations(analysis) {
    const recommendations = {
      stakeholder_strategy: [],
      communication_approach: [],
      quick_wins: [],
      strategic_initiatives: []
    };

    // Stakeholder strategy recommendations
    const topStakeholders = analysis.stakeholderLandscape?.engagement_priorities || [];
    recommendations.stakeholder_strategy = topStakeholders.map(stakeholder => ({
      group: stakeholder,
      approach: this.getStakeholderApproach(stakeholder, analysis),
      key_messages: this.generateKeyMessages(stakeholder, analysis),
      channels: this.recommendChannels(stakeholder)
    }));

    // Communication approach based on market position
    const positionStrategies = {
      leader: ['Thought leadership', 'Vision setting', 'Industry education'],
      challenger: ['Differentiation', 'Competitive comparison', 'Innovation showcase'],
      follower: ['Value focus', 'Customer success', 'Reliability emphasis'],
      nicher: ['Expertise demonstration', 'Specialization benefits', 'Case studies']
    };

    recommendations.communication_approach = positionStrategies[
      analysis.marketPosition?.marketPosition || 'challenger'
    ];

    // Quick wins based on immediate priorities
    recommendations.quick_wins = [
      'Stakeholder perception audit',
      'Key message development',
      'Executive visibility program',
      'Customer success stories',
      'Media relationship building'
    ];

    // Strategic initiatives based on opportunities
    recommendations.strategic_initiatives = analysis.opportunities?.opportunities
      ?.filter(opp => opp.potential === 'high')
      .map(opp => ({
        initiative: opp.type,
        timeline: opp.timeframe,
        stakeholders: this.identifyRelevantStakeholders(opp.type, analysis)
      })) || [];

    return recommendations;
  }

  // Helper methods
  async determineCompanyType(companyName, searchResults) {
    const typeIndicators = {
      public: ['NYSE', 'NASDAQ', 'publicly traded', 'ticker', 'stock'],
      nonprofit: ['501(c)', 'nonprofit', 'foundation', 'charity', 'NGO'],
      government: ['government', 'federal', 'state', 'municipal', 'agency'],
      private: ['privately held', 'private company', 'LLC', 'Inc']
    };

    const searchText = JSON.stringify(searchResults).toLowerCase();
    
    for (const [type, indicators] of Object.entries(typeIndicators)) {
      if (indicators.some(indicator => searchText.includes(indicator.toLowerCase()))) {
        return type;
      }
    }

    return 'private'; // default
  }

  async estimateCompanySize(profile) {
    // First check if we have exact employee count
    if (profile.employeeCount) {
      if (profile.employeeCount >= 50000) return 'enterprise';
      if (profile.employeeCount >= 10000) return 'large';
      if (profile.employeeCount >= 1000) return 'medium-large';
      if (profile.employeeCount >= 100) return 'medium';
      if (profile.employeeCount >= 10) return 'small';
      return 'startup';
    }

    // Check AI insights for size indicators
    const aiInsights = profile.aiInsights?.toLowerCase() || '';
    const companyName = profile.name?.toLowerCase() || '';
    
    // Fortune 500 / Large company indicators
    const largeCompanyIndicators = [
      'fortune 500', 'fortune 1000', 'global leader', 'multinational', 
      'billion in revenue', 'billions in revenue', 'largest', 'major corporation',
      'global company', 'worldwide operations', 'operates in multiple countries'
    ];
    
    // Well-known large companies (expanded list)
    const knownLargeCompanies = [
      'amazon', 'google', 'microsoft', 'apple', 'facebook', 'meta', 'alphabet',
      'walmart', 'exxon', 'berkshire hathaway', 'jpmorgan', 'johnson & johnson',
      'visa', 'procter & gamble', 'mastercard', 'nvidia', 'home depot',
      'disney', 'bank of america', 'coca-cola', 'nike', 'tesla', 'netflix',
      'oracle', 'ibm', 'intel', 'cisco', 'adobe', 'salesforce', 'uber', 'airbnb',
      'paypal', 'chevron', 'pfizer', 'merck', 'at&t', 'verizon', 'comcast',
      'costco', 'starbucks', 'mcdonalds', 'pepsi', 'boeing', 'lockheed martin',
      'general electric', 'ge', 'ford', 'gm', 'general motors', 'toyota',
      'samsung', 'sony', 'mitsui', 'mitsubishi', 'sumitomo', 'itochu', 'marubeni'
    ];
    
    // Check for large company indicators
    if (largeCompanyIndicators.some(indicator => aiInsights.includes(indicator)) ||
        knownLargeCompanies.some(company => companyName.includes(company))) {
      return profile.type === 'public' ? 'enterprise' : 'large';
    }
    
    // Check for startup indicators
    if (aiInsights.includes('startup') || aiInsights.includes('founded in 20')) {
      return 'startup';
    }
    
    // Revenue-based estimation
    if (profile.revenue) {
      const revenueStr = profile.revenue.toLowerCase();
      if (revenueStr.includes('billion')) return 'enterprise';
      if (revenueStr.includes('hundred million')) return 'large';
      if (revenueStr.includes('million') && parseInt(revenueStr) > 50) return 'medium-large';
    }
    
    // Type-based estimation with better defaults
    if (profile.type === 'public') {
      // Most public companies are at least large
      return aiInsights.includes('small cap') ? 'medium-large' : 'large';
    }
    
    if (profile.type === 'nonprofit') {
      return aiInsights.includes('international') || aiInsights.includes('global') ? 'large' : 'medium';
    }
    
    if (profile.type === 'government') {
      return aiInsights.includes('federal') || aiInsights.includes('national') ? 'large' : 'medium';
    }
    
    // Industry-based defaults (more nuanced)
    const industryDefaults = {
      'technology': aiInsights.includes('saas') || aiInsights.includes('software') ? 'medium' : 'medium-large',
      'finance': 'large',
      'healthcare': 'medium-large',
      'retail': aiInsights.includes('chain') || aiInsights.includes('stores') ? 'large' : 'medium',
      'manufacturing': 'medium-large',
      'diversified': 'enterprise'
    };
    
    return industryDefaults[profile.industry] || 'medium';
  }

  getStakeholderApproach(stakeholder, analysis) {
    const approaches = {
      'Developers/Engineers': 'Technical content, open source contributions, developer relations',
      'Enterprise Customers': 'Executive briefings, case studies, ROI demonstrations',
      'Investors/VCs': 'Growth metrics, market opportunity, competitive advantages',
      'Regulators': 'Compliance focus, proactive engagement, transparency',
      'Media': 'Newsworthy angles, exclusive access, thought leadership',
      'Employees': 'Internal communications, culture building, career development'
    };

    return approaches[stakeholder] || 'Targeted engagement and relationship building';
  }

  generateKeyMessages(stakeholder, analysis) {
    const industry = analysis.profile?.industry || 'general';
    const position = analysis.marketPosition?.marketPosition || 'challenger';

    const messageTemplates = {
      technology: {
        'Developers/Engineers': ['Innovation in action', 'Technical excellence', 'Developer-first approach'],
        'Enterprise Customers': ['Digital transformation partner', 'Proven ROI', 'Enterprise-grade reliability'],
        'Investors/VCs': ['Scalable growth model', 'Market disruption', 'Strong unit economics']
      },
      healthcare: {
        'Healthcare Providers': ['Improving patient outcomes', 'Clinical efficiency', 'Evidence-based solutions'],
        'Patients/Patient Advocates': ['Patient-centered care', 'Access and affordability', 'Quality of life'],
        'Regulators': ['Safety first', 'Compliance excellence', 'Transparent practices']
      }
    };

    const industryMessages = messageTemplates[industry] || {};
    return industryMessages[stakeholder] || ['Value creation', 'Strategic partnership', 'Mutual success'];
  }

  recommendChannels(stakeholder) {
    const channelMap = {
      'Developers/Engineers': ['GitHub', 'Dev blogs', 'Technical conferences', 'Stack Overflow'],
      'Enterprise Customers': ['Executive meetings', 'Industry events', 'Case studies', 'Webinars'],
      'Media': ['Press releases', 'Media briefings', 'Social media', 'Thought leadership'],
      'Investors/VCs': ['Investor meetings', 'Earnings calls', 'Annual reports', 'Investor conferences'],
      'Regulators': ['Official filings', 'Direct meetings', 'Industry associations', 'Compliance reports'],
      'Employees': ['Town halls', 'Internal portals', 'Team meetings', 'Employee newsletters']
    };

    return channelMap[stakeholder] || ['Email', 'Website', 'Social media', 'Events'];
  }

  identifyRelevantStakeholders(opportunityType, analysis) {
    const opportunityStakeholders = {
      'Market expansion': ['Customers', 'Partners', 'Investors'],
      'Digital transformation': ['Employees', 'Customers', 'Technology Partners'],
      'Strategic alliances': ['Partners', 'Customers', 'Industry Associations'],
      'Innovation leadership': ['Developers', 'Media', 'Customers'],
      'Platform economics': ['Developers', 'Partners', 'Customers']
    };

    return opportunityStakeholders[opportunityType] || ['Customers', 'Employees', 'Partners'];
  }
}

const companyAnalysis = new CompanyAnalysis();
export default companyAnalysis;