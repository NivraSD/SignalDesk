-- Insert Default Prediction Patterns
-- Run this in Supabase SQL Editor

INSERT INTO stakeholder_patterns (pattern_name, stakeholder_type, pattern_description, early_signals, typical_actions, avg_lead_time_days, reliability_score)
VALUES
(
  'Regulatory Enforcement Pattern',
  'regulator',
  'Pattern indicating likely regulatory enforcement action against company or industry',
  '{"T90": ["Peer company enforcement actions", "Industry-wide investigations"], "T60": ["Congressional hearing mentions", "Regulator speech references"], "T30": ["Informal inquiries", "Document requests"], "T14": ["Wells notice issued", "Settlement discussions"], "T7": ["Enforcement action filed", "Public announcement"]}',
  '["Fines", "Consent orders", "Business restrictions", "Enhanced oversight"]',
  45,
  0.78
),
(
  'Activist Campaign Pattern',
  'activist',
  'Pattern indicating activist investor preparing campaign against company',
  '{"T90": ["Initial stake building (<5%)", "Industry white papers"], "T60": ["Stake increase (5-10%)", "Private engagement attempts"], "T30": ["13D filing", "Public criticism"], "T14": ["Proxy fight announcement", "Media campaign"], "T7": ["Shareholder proposal", "Board nominations"]}',
  '["Board changes", "Strategy shifts", "Asset sales", "Management changes"]',
  60,
  0.82
),
(
  'Institutional Selloff Pattern',
  'investor',
  'Pattern indicating institutional investors reducing positions',
  '{"T60": ["Reduced analyst coverage", "Negative research notes"], "T30": ["Small position reductions", "Reduced conference participation"], "T14": ["Accelerated selling", "Public concerns expressed"], "T7": ["Major position exit", "Downgrades"]}',
  '["Stock pressure", "Liquidity issues", "Credit impacts", "Valuation decline"]',
  30,
  0.75
),
(
  'Customer Revolt Pattern',
  'customer',
  'Pattern indicating customer backlash and potential boycott',
  '{"T30": ["Social media complaint velocity +50%", "Support ticket spike"], "T14": ["Viral negative post", "Influencer criticism"], "T7": ["Organized boycott calls", "Media coverage"], "T3": ["Hashtag trending", "Competitor positioning"]}',
  '["Revenue impact", "Brand damage", "Churn spike", "PR crisis"]',
  14,
  0.71
),
(
  'Employee Exodus Pattern',
  'employee',
  'Pattern indicating mass employee departures or unionization effort',
  '{"T60": ["Glassdoor rating decline", "Reduced job posting responses"], "T30": ["LinkedIn profile update spike", "Internal survey negativity"], "T14": ["Key talent departures", "Recruiting difficulty"], "T7": ["Mass resignation threats", "Union activity"]}',
  '["Productivity loss", "Knowledge drain", "Morale crisis", "Union vote"]',
  30,
  0.73
),
(
  'Competitor Product Launch Pattern',
  'competitor',
  'Pattern indicating competitor preparing major product launch',
  '{"T90": ["Increased hiring", "Patent filings"], "T60": ["Supply chain movements", "Marketing job postings"], "T30": ["Press briefing invitations", "Beta testing signals"], "T14": ["Launch event announced", "Marketing campaign starts"], "T7": ["Product revealed", "Pre-orders open"]}',
  '["Market share threat", "Pricing pressure", "Feature comparison", "Customer churn risk"]',
  45,
  0.68
),
(
  'Media Investigation Pattern',
  'media',
  'Pattern indicating journalist preparing investigative report',
  '{"T60": ["Source requests", "Document FOIA filings"], "T30": ["Employee interviews", "Former executive contacts"], "T14": ["Company comment request", "Legal review"], "T7": ["Publication scheduled", "Fact-checking queries"]}',
  '["Negative coverage", "Stock impact", "Reputation damage", "Legal exposure"]',
  40,
  0.70
)
ON CONFLICT (pattern_name) DO NOTHING;

SELECT COUNT(*) as patterns_inserted FROM stakeholder_patterns;
