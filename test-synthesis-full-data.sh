#!/bin/bash

# Test Claude Synthesis Stage 5 with FULL payload pushing 50+ seconds

echo "🚀 TESTING CLAUDE SYNTHESIS STAGE 5 WITH FULL PAYLOAD"
echo "================================================"
echo "This test simulates a complete intelligence pipeline with massive data"
echo "Expected to take 50+ seconds (approaching 60s timeout limit)"
echo ""

# Get Supabase credentials
SUPABASE_URL="https://zskaxjtyuaqazydouifp.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8"

# Generate request ID for this test
REQUEST_ID="test-pipeline-$(date +%s)-${RANDOM}"
echo "🔑 Request ID: $REQUEST_ID"

# Create MASSIVE test payload with realistic data from all stages
cat > /tmp/synthesis_test_payload.json << EOF
{
  "request_id": "$REQUEST_ID",
  "organization": {
    "name": "Meta",
    "industry": "Technology",
    "description": "Meta Platforms, Inc., formerly Facebook, is a multinational technology conglomerate",
    "headquarters": "Menlo Park, California",
    "founded": "2004",
    "employees": "86000",
    "revenue": "$134.9 billion (2023)",
    "market_cap": "$1.2 trillion",
    "products": ["Facebook", "Instagram", "WhatsApp", "Oculus", "Threads"],
    "ceo": "Mark Zuckerberg"
  },
  "dataVersion": "3.0-massive-test",
  "previousResults": {
    "extraction": {
      "data": {
        "organization_profile": {
          "name": "Meta",
          "market_position": "Social media and metaverse leader",
          "key_products": ["Facebook", "Instagram", "WhatsApp", "Reality Labs"],
          "recent_initiatives": [
            "Threads launch to compete with Twitter",
            "Llama 3 AI model release",
            "Quest 3 VR headset launch",
            "Efficiency year with 21,000 layoffs"
          ]
        }
      },
      "intelligence": {
        "raw_signals": [
          {"signal": "Meta launches Threads with 100M users in 5 days", "source": "TechCrunch", "timestamp": "2023-07"},
          {"signal": "Reality Labs loses $13.7B in 2023", "source": "WSJ", "timestamp": "2024-01"},
          {"signal": "Instagram Reels reaches 200B daily plays", "source": "Meta Earnings", "timestamp": "2024-02"},
          {"signal": "WhatsApp hits 3 billion users globally", "source": "Reuters", "timestamp": "2024-01"},
          {"signal": "Meta stock up 194% in 2023", "source": "NASDAQ", "timestamp": "2023-12"},
          {"signal": "EU fines Meta €1.2B for data transfers", "source": "BBC", "timestamp": "2023-05"},
          {"signal": "Meta announces dividend for first time", "source": "CNBC", "timestamp": "2024-02"},
          {"signal": "Llama 3 outperforms GPT-3.5 on benchmarks", "source": "ArXiv", "timestamp": "2024-04"},
          {"signal": "Meta cuts Reality Labs staff by 10%", "source": "The Information", "timestamp": "2024-03"},
          {"signal": "Facebook reaches 3 billion MAU", "source": "Meta IR", "timestamp": "2024-01"}
        ],
        "metadata": {
          "sources": ["TechCrunch", "WSJ", "Reuters", "BBC", "CNBC", "ArXiv"],
          "signal_count": 150,
          "time_range": "2023-2024"
        }
      }
    },
    "competitive": {
      "data": {
        "competitors": {
          "direct": [
            {
              "name": "Google",
              "threat_level": "High",
              "market_share": "28.9%",
              "recent_actions": [
                "Launched Bard AI chatbot",
                "YouTube Shorts hits 70B daily views",
                "Announced Gemini AI model"
              ],
              "strengths": ["Search dominance", "YouTube platform", "Android ecosystem"],
              "weaknesses": ["Social media presence", "Messaging platforms"],
              "competitive_moves": [
                {"move": "Gemini Ultra launch", "impact": "High", "response_needed": "Yes"},
                {"move": "YouTube Shorts monetization", "impact": "Medium", "response_needed": "Yes"}
              ]
            },
            {
              "name": "TikTok",
              "threat_level": "Critical",
              "market_share": "15.2%",
              "recent_actions": [
                "Reached 1.7B global users",
                "Launched TikTok Shop in US",
                "Increased max video length to 30 minutes"
              ],
              "strengths": ["Gen Z dominance", "Algorithm superiority", "Creator ecosystem"],
              "weaknesses": ["Regulatory scrutiny", "Monetization challenges"],
              "competitive_moves": [
                {"move": "E-commerce integration", "impact": "High", "response_needed": "Urgent"},
                {"move": "Long-form video push", "impact": "Medium", "response_needed": "Yes"}
              ]
            },
            {
              "name": "Apple",
              "threat_level": "High",
              "market_share": "12.1%",
              "recent_actions": [
                "Vision Pro launch at $3,499",
                "App Tracking Transparency impact",
                "iMessage remains exclusive"
              ],
              "strengths": ["Hardware integration", "Privacy brand", "Premium positioning"],
              "weaknesses": ["Social platforms", "Open ecosystem"],
              "competitive_moves": [
                {"move": "Vision Pro spatial computing", "impact": "High", "response_needed": "Critical"},
                {"move": "Privacy features expansion", "impact": "High", "response_needed": "Yes"}
              ]
            },
            {
              "name": "Microsoft",
              "threat_level": "Medium",
              "market_share": "8.7%",
              "recent_actions": [
                "Teams hits 320M users",
                "LinkedIn reaches 1B members",
                "Copilot AI integration across Office"
              ],
              "strengths": ["Enterprise dominance", "LinkedIn network", "Azure cloud"],
              "weaknesses": ["Consumer social", "Mobile presence"],
              "competitive_moves": [
                {"move": "OpenAI partnership expansion", "impact": "Medium", "response_needed": "Monitor"},
                {"move": "Teams consumer push", "impact": "Low", "response_needed": "Monitor"}
              ]
            },
            {
              "name": "Amazon",
              "threat_level": "Medium",
              "market_share": "6.3%",
              "recent_actions": [
                "Twitch reaches 140M MAU",
                "Alexa LLM development",
                "Prime Video ads launch"
              ],
              "strengths": ["AWS infrastructure", "E-commerce integration", "Twitch gaming"],
              "weaknesses": ["Social networking", "Mobile apps"],
              "competitive_moves": [
                {"move": "Twitch expansion", "impact": "Low", "response_needed": "Monitor"},
                {"move": "Advertising growth", "impact": "Medium", "response_needed": "Yes"}
              ]
            }
          ],
          "indirect": [
            {"name": "Netflix", "category": "Attention economy", "threat": "Medium"},
            {"name": "Spotify", "category": "Audio/Creator economy", "threat": "Low"},
            {"name": "Discord", "category": "Community platforms", "threat": "Medium"},
            {"name": "Reddit", "category": "Discussion forums", "threat": "Medium"},
            {"name": "Pinterest", "category": "Visual discovery", "threat": "Low"}
          ],
          "emerging": [
            {"name": "OpenAI", "potential": "High", "timeline": "6-12 months", "threat_vector": "AI-native social"},
            {"name": "Character.AI", "potential": "Medium", "timeline": "12-18 months", "threat_vector": "AI companions"},
            {"name": "Midjourney", "potential": "Medium", "timeline": "12-24 months", "threat_vector": "Creative tools"},
            {"name": "Mastodon", "potential": "Low", "timeline": "Ongoing", "threat_vector": "Decentralized social"},
            {"name": "BeReal", "potential": "Low", "timeline": "Declining", "threat_vector": "Authentic social"}
          ]
        },
        "competitive_analysis": {
          "market_dynamics": "Intensifying competition across all fronts",
          "key_battlegrounds": ["Short-form video", "AI integration", "VR/AR", "Messaging", "E-commerce"],
          "differentiation_opportunities": ["Metaverse leadership", "Cross-app integration", "Open source AI"],
          "competitive_threats": [
            "TikTok's continued growth among younger users",
            "Apple's Vision Pro challenging Quest dominance",
            "Google's AI advancements with Gemini",
            "Regulatory pressures favoring smaller competitors"
          ]
        }
      }
    },
    "media": {
      "data": {
        "coverage_analysis": {
          "coverage": [
            {
              "outlet": "TechCrunch",
              "articles_last_30_days": 47,
              "sentiment": "Mixed",
              "key_topics": ["Threads growth", "AI developments", "Reality Labs losses"],
              "journalist_relationships": [
                {"name": "Sarah Perez", "beat": "Social apps", "sentiment": "Neutral"},
                {"name": "Ivan Mehta", "beat": "Social platforms", "sentiment": "Positive"}
              ]
            },
            {
              "outlet": "The Verge",
              "articles_last_30_days": 38,
              "sentiment": "Critical",
              "key_topics": ["Metaverse skepticism", "Privacy concerns", "Content moderation"],
              "journalist_relationships": [
                {"name": "Alex Heath", "beat": "Meta/VR", "sentiment": "Critical"},
                {"name": "Jay Peters", "beat": "Gaming/VR", "sentiment": "Neutral"}
              ]
            },
            {
              "outlet": "Wall Street Journal",
              "articles_last_30_days": 29,
              "sentiment": "Neutral",
              "key_topics": ["Financial performance", "Regulatory challenges", "AI investments"],
              "journalist_relationships": [
                {"name": "Jeff Horwitz", "beat": "Tech regulation", "sentiment": "Critical"},
                {"name": "Salvador Rodriguez", "beat": "Meta coverage", "sentiment": "Neutral"}
              ]
            },
            {
              "outlet": "Financial Times",
              "articles_last_30_days": 21,
              "sentiment": "Positive",
              "key_topics": ["Stock performance", "Efficiency gains", "AI strategy"],
              "journalist_relationships": [
                {"name": "Hannah Murphy", "beat": "Big Tech", "sentiment": "Neutral"}
              ]
            },
            {
              "outlet": "Wired",
              "articles_last_30_days": 15,
              "sentiment": "Mixed",
              "key_topics": ["AI ethics", "VR future", "Social impact"],
              "journalist_relationships": [
                {"name": "Lauren Goode", "beat": "Consumer tech", "sentiment": "Mixed"}
              ]
            }
          ],
          "sentiment_analysis": {
            "overall": "Mixed-Positive",
            "trend": "Improving",
            "drivers": ["Strong financial results", "AI progress", "Threads success"],
            "detractors": ["Reality Labs losses", "Privacy concerns", "Teen safety issues"]
          },
          "narrative_themes": [
            {
              "theme": "The Efficiency Era",
              "prevalence": "High",
              "sentiment": "Positive",
              "examples": ["Year of Efficiency success", "Improved margins", "Stock gains"]
            },
            {
              "theme": "AI Transformation",
              "prevalence": "High",
              "sentiment": "Positive",
              "examples": ["Llama success", "AI integration in apps", "Recommendation improvements"]
            },
            {
              "theme": "Metaverse Skepticism",
              "prevalence": "Medium",
              "sentiment": "Negative",
              "examples": ["Reality Labs losses", "Low Quest adoption", "Horizon Worlds criticism"]
            },
            {
              "theme": "Regulatory Pressure",
              "prevalence": "Medium",
              "sentiment": "Negative",
              "examples": ["EU fines", "Child safety concerns", "Antitrust scrutiny"]
            }
          ]
        },
        "media_opportunities": [
          {
            "opportunity": "AI thought leadership positioning",
            "angle": "Open source Llama vs closed competitors",
            "target_outlets": ["Wired", "MIT Tech Review", "ArsTechnica"],
            "timing": "Immediate"
          },
          {
            "opportunity": "Threads success story",
            "angle": "Fastest growing app in history",
            "target_outlets": ["TechCrunch", "The Verge", "Mashable"],
            "timing": "Ongoing"
          },
          {
            "opportunity": "Efficiency transformation case study",
            "angle": "How Meta became lean and profitable",
            "target_outlets": ["WSJ", "Financial Times", "Bloomberg"],
            "timing": "Quarterly earnings"
          }
        ],
        "stakeholder_analysis": {
          "journalists": {
            "supporters": ["Financial media impressed by turnaround"],
            "critics": ["Tech media skeptical of metaverse", "Privacy advocates"],
            "neutral": ["General business press"]
          },
          "influencers": {
            "tech_leaders": {"sentiment": "Mixed", "key_voices": ["Supportive of open source AI", "Critical of metaverse focus"]},
            "creators": {"sentiment": "Positive", "key_voices": ["Excited about monetization", "Concerned about algorithm changes"]},
            "investors": {"sentiment": "Very Positive", "key_voices": ["Impressed by efficiency", "Bullish on AI integration"]}
          }
        }
      }
    },
    "regulatory": {
      "data": {
        "regulatory_landscape": {
          "current_regulations": [
            {
              "regulation": "EU Digital Services Act",
              "status": "Active",
              "impact": "High",
              "compliance_status": "Ongoing",
              "requirements": ["Content moderation", "Algorithm transparency", "Risk assessments"]
            },
            {
              "regulation": "EU Digital Markets Act",
              "status": "Active",
              "impact": "Critical",
              "compliance_status": "Challenging",
              "requirements": ["Interoperability", "Data portability", "No self-preferencing"]
            },
            {
              "regulation": "UK Online Safety Act",
              "status": "Implementation phase",
              "impact": "High",
              "compliance_status": "Preparing",
              "requirements": ["Age verification", "Harmful content removal", "Transparency reports"]
            },
            {
              "regulation": "US COPPA",
              "status": "Active",
              "impact": "Medium",
              "compliance_status": "Compliant",
              "requirements": ["Under-13 restrictions", "Parental consent", "Data minimization"]
            },
            {
              "regulation": "California Age-Appropriate Design Code",
              "status": "Challenged in court",
              "impact": "High",
              "compliance_status": "Monitoring",
              "requirements": ["Privacy by default", "Age estimation", "Impact assessments"]
            }
          ],
          "upcoming_regulations": [
            {
              "regulation": "EU AI Act",
              "timeline": "2024 implementation",
              "expected_impact": "High",
              "preparation_needed": ["AI system classification", "Risk assessments", "Transparency measures"]
            },
            {
              "regulation": "US Federal Privacy Law",
              "timeline": "2024-2025 potential",
              "expected_impact": "High",
              "preparation_needed": ["National compliance framework", "User rights implementation"]
            },
            {
              "regulation": "India Data Protection Act",
              "timeline": "2024 enforcement",
              "expected_impact": "Medium",
              "preparation_needed": ["Local data storage", "Consent mechanisms", "Grievance procedures"]
            }
          ],
          "compliance_risks": [
            {
              "risk": "Interoperability mandates",
              "severity": "Critical",
              "mitigation": "Technical architecture changes required",
              "timeline": "Immediate"
            },
            {
              "risk": "Age verification requirements",
              "severity": "High",
              "mitigation": "Developing privacy-preserving age assurance",
              "timeline": "6 months"
            },
            {
              "risk": "AI transparency requirements",
              "severity": "Medium",
              "mitigation": "Documentation and explainability tools",
              "timeline": "12 months"
            }
          ],
          "regulatory_opportunities": [
            {
              "opportunity": "Lead on AI safety standards",
              "approach": "Proactive Llama safety measures",
              "benefit": "Regulatory goodwill and industry leadership"
            },
            {
              "opportunity": "Privacy-first positioning",
              "approach": "End-to-end encryption expansion",
              "benefit": "Differentiation from competitors"
            },
            {
              "opportunity": "Youth safety innovation",
              "approach": "Advanced parental controls and teen wellbeing tools",
              "benefit": "Positive regulatory engagement"
            }
          ]
        }
      }
    },
    "trends": {
      "data": {
        "market_trends": {
          "trending_topics": [
            {
              "topic": "Generative AI Integration",
              "trajectory": "Exponential growth",
              "relevance": "Critical",
              "market_signals": [
                "Every major platform adding AI features",
                "$50B+ invested in GenAI startups in 2023",
                "User expectation of AI assistance"
              ],
              "implications": ["Must have AI strategy", "Compute costs rising", "New monetization models"]
            },
            {
              "topic": "Short-form Video Dominance",
              "trajectory": "Continued growth",
              "relevance": "Critical",
              "market_signals": [
                "TikTok at 1.7B users",
                "YouTube Shorts at 70B daily views",
                "Instagram Reels at 200B plays"
              ],
              "implications": ["Algorithm competition", "Creator monetization pressure", "Infrastructure demands"]
            },
            {
              "topic": "Social Commerce",
              "trajectory": "Accelerating",
              "relevance": "High",
              "market_signals": [
                "TikTok Shop US launch",
                "Instagram Shopping evolution",
                "Pinterest shopping features"
              ],
              "implications": ["Payment infrastructure needs", "Creator commerce tools", "Logistics partnerships"]
            },
            {
              "topic": "Spatial Computing",
              "trajectory": "Early adoption",
              "relevance": "High",
              "market_signals": [
                "Apple Vision Pro launch",
                "Quest 3 improvements",
                "Google AR developments"
              ],
              "implications": ["Hardware race intensifying", "Content ecosystem critical", "Developer tools important"]
            },
            {
              "topic": "AI Companions/Agents",
              "trajectory": "Emerging",
              "relevance": "Medium",
              "market_signals": [
                "Character.AI growth",
                "ChatGPT integration everywhere",
                "AI girlfriend apps trending"
              ],
              "implications": ["New social dynamics", "Authenticity questions", "Mental health considerations"]
            },
            {
              "topic": "Creator Economy Maturation",
              "trajectory": "Stabilizing",
              "relevance": "High",
              "market_signals": [
                "Creator funds scaling back",
                "Direct monetization focus",
                "Creator burnout discussions"
              ],
              "implications": ["Sustainable monetization needed", "Platform differentiation", "Creator retention crucial"]
            },
            {
              "topic": "Privacy-First Features",
              "trajectory": "Steady demand",
              "relevance": "Medium",
              "market_signals": [
                "Signal user growth",
                "WhatsApp encryption emphasis",
                "Apple privacy marketing"
              ],
              "implications": ["Feature parity needed", "Marketing opportunity", "Regulatory alignment"]
            },
            {
              "topic": "Decentralized Social",
              "trajectory": "Slow growth",
              "relevance": "Low",
              "market_signals": [
                "Mastodon post-Twitter growth",
                "Bluesky limited adoption",
                "Threads ActivityPub promises"
              ],
              "implications": ["Monitor for disruption", "Interoperability considerations", "Niche communities"]
            }
          ],
          "conversation_gaps": [
            {
              "gap": "Mental health impact transparency",
              "opportunity": "Lead with research and tools",
              "first_mover_advantage": "High"
            },
            {
              "gap": "AI ethics in social platforms",
              "opportunity": "Set industry standards",
              "first_mover_advantage": "High"
            },
            {
              "gap": "Creator sustainability models",
              "opportunity": "Innovative monetization solutions",
              "first_mover_advantage": "Medium"
            },
            {
              "gap": "Cross-platform identity solutions",
              "opportunity": "User-controlled identity",
              "first_mover_advantage": "Medium"
            }
          ],
          "emerging_opportunities": [
            {
              "opportunity": "AI-powered content moderation at scale",
              "market_size": "$15B by 2028",
              "competitive_advantage": "Llama model expertise",
              "timeline": "6-12 months"
            },
            {
              "opportunity": "Enterprise metaverse solutions",
              "market_size": "$280B by 2030",
              "competitive_advantage": "Quest hardware + Horizon platform",
              "timeline": "12-24 months"
            },
            {
              "opportunity": "AI coding assistants for developers",
              "market_size": "$20B by 2027",
              "competitive_advantage": "Code Llama models",
              "timeline": "3-6 months"
            },
            {
              "opportunity": "Secure messaging for business",
              "market_size": "$35B by 2029",
              "competitive_advantage": "WhatsApp Business platform",
              "timeline": "Ongoing"
            }
          ],
          "trend_predictions": [
            {
              "prediction": "AI agents will handle 30% of social interactions by 2025",
              "confidence": "Medium",
              "implications": ["Authentication challenges", "Content quality concerns", "New interaction models"]
            },
            {
              "prediction": "Spatial computing reaches 100M users by 2026",
              "confidence": "High",
              "implications": ["Content demand surge", "New ad formats", "Hardware competition"]
            },
            {
              "prediction": "Social commerce exceeds $1T globally by 2025",
              "confidence": "High",
              "implications": ["Payment integration critical", "Logistics partnerships needed", "Creator tools essential"]
            },
            {
              "prediction": "Regulatory fragmentation forces regional app versions",
              "confidence": "Medium",
              "implications": ["Development complexity", "Compliance costs", "User experience challenges"]
            }
          ]
        }
      }
    }
  },
  "fullProfile": {
    "name": "Meta",
    "competitors": {
      "direct": ["Google", "TikTok", "Apple", "Microsoft", "Amazon"],
      "indirect": ["Netflix", "Spotify", "Discord", "Reddit", "Pinterest"],
      "emerging": ["OpenAI", "Character.AI", "Midjourney", "Mastodon", "BeReal"]
    }
  },
  "stage1": {
    "competitive_analysis": {
      "battle_cards": [
        {
          "competitor": "TikTok",
          "our_advantages": ["Broader age demographics", "Multiple app ecosystem", "Established advertiser relationships"],
          "their_advantages": ["Superior algorithm", "Gen Z dominance", "Cultural relevance"],
          "counter_strategies": ["Emphasize Reels growth", "Cross-app integration benefits", "Privacy and safety features"]
        },
        {
          "competitor": "Apple",
          "our_advantages": ["Open platform", "Lower price point", "Cross-platform compatibility"],
          "their_advantages": ["Premium brand", "Hardware integration", "Privacy perception"],
          "counter_strategies": ["Open source AI narrative", "Quest 3 value proposition", "Developer ecosystem benefits"]
        }
      ]
    }
  },
  "stage2": {
    "media_landscape": {
      "sentiment_trends": {
        "6_month_trend": "Improving significantly",
        "key_drivers": ["Stock performance", "AI progress", "Efficiency gains"],
        "risk_factors": ["Reality Labs losses", "Teen safety concerns", "Regulatory fines"]
      }
    }
  },
  "stage3": {
    "regulatory_timeline": [
      {"date": "2024-Q2", "event": "EU AI Act implementation", "impact": "High"},
      {"date": "2024-Q3", "event": "UK Online Safety Act enforcement", "impact": "High"},
      {"date": "2024-Q4", "event": "India Data Protection enforcement", "impact": "Medium"},
      {"date": "2025-Q1", "event": "Potential US federal privacy law", "impact": "Critical"}
    ]
  },
  "stage4": {
    "disruption_signals": [
      {"signal": "AI-native social platforms emerging", "threat_level": "Medium", "timeline": "12-18 months"},
      {"signal": "Apple Vision Pro ecosystem growing", "threat_level": "High", "timeline": "6-12 months"},
      {"signal": "Creator platform fragmentation", "threat_level": "Low", "timeline": "Ongoing"},
      {"signal": "Regulatory-driven market fragmentation", "threat_level": "Medium", "timeline": "24 months"}
    ]
  },
  "monitoring": {
    "raw_signals": [
      {"signal": "Meta Q4 earnings beat expectations by 12%", "timestamp": "2024-02-01", "source": "Earnings Call"},
      {"signal": "Threads reaches 130M MAU", "timestamp": "2024-02-08", "source": "Internal Metrics"},
      {"signal": "Reality Labs announces 40% cost reduction", "timestamp": "2024-02-15", "source": "Internal Memo"},
      {"signal": "EU opens new investigation into Meta data practices", "timestamp": "2024-02-20", "source": "Reuters"},
      {"signal": "Instagram launches AI-powered creator tools", "timestamp": "2024-02-25", "source": "Product Launch"},
      {"signal": "WhatsApp Business crosses 200M users", "timestamp": "2024-03-01", "source": "Company Blog"},
      {"signal": "Meta announces $50B buyback program", "timestamp": "2024-03-05", "source": "SEC Filing"},
      {"signal": "Quest 3 sales exceed 2M units", "timestamp": "2024-03-10", "source": "Supply Chain Data"},
      {"signal": "Llama 3 70B model released", "timestamp": "2024-03-15", "source": "AI Blog"},
      {"signal": "Facebook Dating expands to 20 new countries", "timestamp": "2024-03-20", "source": "Product Update"}
    ],
    "metadata": {
      "total_signals": 250,
      "sources": ["Earnings Reports", "News Media", "Social Media", "Regulatory Filings", "Industry Reports", "Internal Data"],
      "confidence_level": "High",
      "data_freshness": "Real-time to 7 days old"
    }
  }
}
EOF

echo "📊 Payload created with:"
echo "  - Organization: Meta (complete profile)"
echo "  - Stage 1: 5 direct competitors with detailed analysis"
echo "  - Stage 2: 5 media outlets with coverage analysis"
echo "  - Stage 3: 5 current + 3 upcoming regulations"
echo "  - Stage 4: 8 market trends with predictions"
echo "  - Stage 5: 250+ intelligence signals"
echo "  - Total data size: ~50KB of structured intelligence"
echo ""

echo "🚀 Calling Stage 5 Synthesis endpoint..."
echo "Expected duration: 50-55 seconds (approaching timeout)"
echo ""

START_TIME=$(date +%s)

# Make the API call with explicit timeout of 58 seconds (just under edge function limit)
response=$(curl -s -X POST \
  "${SUPABASE_URL}/functions/v1/intelligence-stage-5-synthesis" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "x-client-info: supabase-js/2.39.0" \
  --max-time 58 \
  -d @/tmp/synthesis_test_payload.json \
  -w "\n\nHTTP_STATUS:%{http_code}\nTIME_TOTAL:%{time_total}\nTIME_CONNECT:%{time_connect}\nTIME_STARTTRANSFER:%{time_starttransfer}\n")

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo ""
echo "⏱️  Total execution time: ${DURATION} seconds"
echo ""

# Extract HTTP status
HTTP_STATUS=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)
TIME_TOTAL=$(echo "$response" | grep "TIME_TOTAL:" | cut -d: -f2)

echo "📊 Response Metrics:"
echo "  - HTTP Status: ${HTTP_STATUS}"
echo "  - Total Time: ${TIME_TOTAL} seconds"
echo ""

# Extract and format the JSON response
json_response=$(echo "$response" | sed -n '1,/HTTP_STATUS:/p' | sed '$d')

# Save raw response for debugging
echo "$json_response" > /tmp/synthesis_raw_response.json

echo "📝 Response Analysis:"
echo "================================"

# Check if we got a timeout
if [[ "$HTTP_STATUS" == "000" ]]; then
    echo "❌ REQUEST TIMED OUT (exceeded 58 second limit)"
    echo "This indicates the synthesis is taking too long."
elif [[ "$HTTP_STATUS" == "504" ]]; then
    echo "❌ GATEWAY TIMEOUT (Edge function exceeded 60 second limit)"
    echo "The function ran but exceeded Supabase's timeout."
elif [[ "$HTTP_STATUS" == "200" ]]; then
    echo "✅ SUCCESS - Synthesis completed within timeout"
    
    # Check if response is empty
    if [[ -z "$json_response" || "$json_response" == "" ]]; then
        echo "⚠️ WARNING: Empty response received!"
        echo "This could indicate the function completed but returned no data."
    else
        # Show first 500 chars of response for debugging
        echo ""
        echo "📄 Raw Response (first 500 chars):"
        echo "$json_response" | head -c 500
        echo ""
        echo ""
    fi
    
    # Parse and display key insights
    echo ""
    echo "🔍 Synthesis Results:"
    echo "$json_response" | python3 -c "
import json
import sys

try:
    data = json.load(sys.stdin)
    
    print('✅ Success:', data.get('success', False))
    print('📊 Stage:', data.get('stage', 'unknown'))
    
    if 'data' in data:
        synthesis = data['data']
        
        # Check for executive summary
        if 'executive_summary' in synthesis:
            exec_summary = synthesis['executive_summary']
            print('\n📋 Executive Summary:')
            if 'key_developments' in exec_summary:
                print(f'  - Key Developments: {len(exec_summary[\"key_developments\"])} items')
            if 'pr_implications' in exec_summary:
                print(f'  - PR Implications: {len(exec_summary[\"pr_implications\"])} items')
        
        # Check for opportunities
        if 'consolidated_opportunities' in synthesis:
            opps = synthesis['consolidated_opportunities']
            if 'prioritized_list' in opps:
                print(f'\n🎯 Opportunities Generated: {len(opps[\"prioritized_list\"])} total')
                for i, opp in enumerate(opps['prioritized_list'][:3], 1):
                    print(f'  {i}. {opp.get(\"opportunity\", \"Unknown\")}')
                    print(f'     - Type: {opp.get(\"type\", \"N/A\")}')
                    print(f'     - Urgency: {opp.get(\"urgency\", \"N/A\")}')
                    print(f'     - Confidence: {opp.get(\"confidence\", \"N/A\")}%')
        
        # Check for cross-dimensional insights
        if 'cross_dimensional_insights' in synthesis:
            insights = synthesis['cross_dimensional_insights']
            if 'patterns' in insights:
                print(f'\n🔗 Patterns Identified: {len(insights[\"patterns\"])} patterns')
            if 'connections' in insights:
                print(f'🔗 Connections Found: {len(insights[\"connections\"])} connections')
        
        # Check for metadata
        if 'metadata' in synthesis:
            meta = synthesis['metadata']
            print(f'\n📊 Processing Metadata:')
            print(f'  - Duration: {meta.get(\"duration\", \"N/A\")}ms')
            print(f'  - Claude Enhanced: {meta.get(\"claude_enhanced\", False)}')
            print(f'  - Data Completeness: {meta.get(\"data_completeness\", \"N/A\")}%')
            print(f'  - Opportunities Generated: {meta.get(\"opportunities_generated\", 0)}')
    
    # Check for tabs (UI data)
    if 'tabs' in data:
        print(f'\n📑 UI Tabs Generated: {len(data[\"tabs\"])} tabs')
        for tab_name in data['tabs'].keys():
            print(f'  - {tab_name}')
    
    # Check for debug info
    if 'debug' in data:
        debug = data['debug']
        print(f'\n🔍 Debug Info:')
        print(f'  - Data Completeness: {debug.get(\"dataCompleteness\", \"N/A\")}%')
        print(f'  - Had Previous Results: {debug.get(\"hadPreviousResults\", False)}')
        print(f'  - Had Full Profile: {debug.get(\"hadFullProfile\", False)}')
    
except json.JSONDecodeError as e:
    print(f'❌ Failed to parse JSON: {e}')
    print('Raw response:', sys.stdin.read()[:500])
except Exception as e:
    print(f'❌ Error analyzing response: {e}')
" 2>/dev/null || echo "❌ Could not parse JSON response"

else
    echo "❌ Unexpected HTTP status: ${HTTP_STATUS}"
    echo "Response body:"
    echo "$json_response"
fi

echo ""
echo "================================"
echo "🏁 TEST COMPLETE"
echo ""
echo "💡 Analysis:"
if [[ "$DURATION" -gt 50 ]]; then
    echo "⚠️  Function is approaching timeout limit (60s)"
    echo "   Consider optimizing:"
    echo "   - Reduce Claude prompt size"
    echo "   - Implement caching for previous results"
    echo "   - Process data in smaller chunks"
elif [[ "$DURATION" -gt 40 ]]; then
    echo "⚡ Function completed but taking significant time"
    echo "   Monitor for potential timeout issues with larger datasets"
else
    echo "✅ Function completed within acceptable time"
fi

echo ""
echo "📊 Data Processing Summary:"
echo "  - Input stages: 5 (extraction, competitive, media, regulatory, trends)"
echo "  - Total signals: 250+"
echo "  - Competitors analyzed: 15 (5 direct, 5 indirect, 5 emerging)"
echo "  - Media outlets: 5"
echo "  - Regulations: 8"
echo "  - Market trends: 8"
echo ""

# Clean up
rm -f /tmp/synthesis_test_payload.json

echo "🧹 Cleanup complete"