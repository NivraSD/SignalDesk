import React, { useState } from "react";
import { useProject } from "../contexts/ProjectContext";
import SaveToMemoryVaultButton from "./MemoryVault/SaveToMemoryVaultButton";
import API_BASE_URL from '../config/api';
import {
  Brain,
  FileText,
  TrendingUp,
  Users,
  Globe,
  Target,
  Lightbulb,
  ChevronRight,
  ChevronDown,
  Download,
  Share2,
  Loader,
  Building,
  AlertCircle,
  Megaphone,
  Shield,
  Sparkles,
  Award,
  Calendar,
  DollarSign,
  BarChart3,
  CheckCircle,
  ArrowRight,
  ExternalLink,
  Search,
} from "lucide-react";

export default function CampaignIntelligence() {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [campaignBrief, setCampaignBrief] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [strategicReport, setStrategicReport] = useState(null);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedReportId, setSavedReportId] = useState(null);
  const [showExpansionPrompt, setShowExpansionPrompt] = useState(false);
  const [expansionPrompt, setExpansionPrompt] = useState("");
  const [isExpanding, setIsExpanding] = useState(false);
  const [reportExpansions, setReportExpansions] = useState([]);
  const [expandedSections, setExpandedSections] = useState({});
  const { activeProject, selectedProject } = useProject();

  // Campaign categories and types
  const campaignCategories = {
    "Product Launch": {
      icon: Sparkles,
      color: "#3b82f6",
      types: [
        {
          id: "b2b-saas",
          name: "B2B SaaS Launch",
          description: "Enterprise software go-to-market",
        },
        {
          id: "consumer-tech",
          name: "Consumer Tech Launch",
          description: "Consumer electronics & apps",
        },
        {
          id: "medical-device",
          name: "Medical Device Launch",
          description: "Healthcare technology rollout",
        },
        {
          id: "cpg-product",
          name: "CPG Product Launch",
          description: "Consumer packaged goods",
        },
        {
          id: "fintech",
          name: "Fintech Product Launch",
          description: "Financial technology solutions",
        },
      ],
    },
    "Brand & Reputation": {
      icon: Award,
      color: "#10b981",
      types: [
        {
          id: "brand-reposition",
          name: "Brand Repositioning",
          description: "Refresh brand perception",
        },
        {
          id: "thought-leadership",
          name: "Thought Leadership",
          description: "Executive visibility program",
        },
        {
          id: "corporate-reputation",
          name: "Corporate Reputation",
          description: "Company image enhancement",
        },
        {
          id: "esg-sustainability",
          name: "ESG/Sustainability",
          description: "Environmental & social impact",
        },
        {
          id: "employer-branding",
          name: "Employer Branding",
          description: "Talent attraction strategy",
        },
      ],
    },
    "Marketing Campaigns": {
      icon: Megaphone,
      color: "#f59e0b",
      types: [
        {
          id: "integrated-marketing",
          name: "Integrated Marketing",
          description: "Multi-channel campaign",
        },
        {
          id: "influencer-campaign",
          name: "Influencer Campaign",
          description: "Influencer-led initiative",
        },
        {
          id: "content-marketing",
          name: "Content Marketing",
          description: "Content-driven strategy",
        },
        {
          id: "event-marketing",
          name: "Event Marketing",
          description: "Event-centered campaign",
        },
        {
          id: "partnership-launch",
          name: "Partnership Launch",
          description: "Strategic alliance PR",
        },
      ],
    },
    "Agency Services": {
      icon: Building,
      color: "#7c3aed",
      types: [
        {
          id: "new-business-proposal",
          name: "New Business Proposal",
          description: "Win new clients",
        },
        {
          id: "campaign-pitch",
          name: "Campaign Pitch Deck",
          description: "Campaign presentation",
        },
        {
          id: "annual-planning",
          name: "Annual PR Planning",
          description: "Yearly strategy development",
        },
        {
          id: "quarterly-review",
          name: "Quarterly Review",
          description: "Performance & planning",
        },
        {
          id: "budget-justification",
          name: "Budget Justification",
          description: "ROI demonstration",
        },
      ],
    },
  };

  // Helper function to show what's special about each campaign type
  const getCampaignTypeFeatures = (type) => {
    const features = {
      "b2b-saas": [
        "SaaS-specific metrics (MRR, CAC, LTV, churn)",
        "Technical buyer journey mapping",
        "Integration partnership opportunities",
        "Free trial optimization strategies",
      ],
      "consumer-tech": [
        "Tech reviewer and influencer outreach plans",
        "Retail vs D2C channel strategies",
        "Unboxing experience optimization",
        "Pre-order and launch day tactics",
      ],
      "medical-device": [
        "FDA regulatory communication strategies",
        "Healthcare provider education programs",
        "Clinical evidence presentation",
        "Reimbursement pathway planning",
      ],
      "cpg-product": [
        "Retail buyer pitch strategies",
        "In-store promotion planning",
        "Consumer sampling programs",
        "Amazon marketplace optimization",
      ],
      fintech: [
        "Trust and security messaging",
        "Regulatory compliance communications",
        "Financial media relations",
        "Partnership strategies",
      ],
      "brand-reposition": [
        "Perception shift strategies",
        "Employee ambassador programs",
        "Visual identity evolution",
        "Stakeholder communication plans",
      ],
      "thought-leadership": [
        "Executive positioning strategies",
        "Speaking opportunity targeting",
        "LinkedIn influence building",
        "Media relationship development",
      ],
      "corporate-reputation": [
        "Multi-stakeholder engagement",
        "Awards and recognition strategy",
        "Employee advocacy programs",
        "Reputation measurement framework",
      ],
      "esg-sustainability": [
        "ESG rating improvement tactics",
        "Sustainability storytelling",
        "Stakeholder materiality alignment",
        "Impact measurement strategies",
      ],
      "employer-branding": [
        "Talent attraction strategies",
        "Employee value proposition",
        "Glassdoor optimization",
        "University relations programs",
      ],
      "integrated-marketing": [
        "Omnichannel orchestration",
        "Attribution modeling",
        "Creative consistency framework",
        "Performance optimization",
      ],
      "influencer-campaign": [
        "Influencer vetting and selection",
        "Content collaboration frameworks",
        "Performance tracking setup",
        "FTC compliance strategies",
      ],
      "content-marketing": [
        "SEO-driven content strategy",
        "Editorial calendar development",
        "Distribution channel optimization",
        "Content ROI measurement",
      ],
      "event-marketing": [
        "Attendee acquisition strategies",
        "Sponsor value optimization",
        "Content capture planning",
        "Post-event nurture campaigns",
      ],
      "partnership-launch": [
        "Co-marketing strategies",
        "Joint value proposition",
        "Channel conflict resolution",
        "Success metric alignment",
      ],
      "new-business-proposal": [
        "Win theme development",
        "Competitive differentiation",
        "Pricing strategy optimization",
        "Chemistry session planning",
      ],
      "campaign-pitch": [
        "Big idea development",
        "Creative territory exploration",
        "Media mix optimization",
        "Presentation flow design",
      ],
      "annual-planning": [
        "Year-long narrative arc",
        "Milestone mapping",
        "Budget allocation strategy",
        "Contingency planning",
      ],
      "quarterly-review": [
        "Performance visualization",
        "ROI demonstration",
        "Learning documentation",
        "Forward planning",
      ],
      "budget-justification": [
        "ROI calculation methods",
        "Competitive benchmarking",
        "Value demonstration",
        "Scenario planning",
      ],
    };

    return (
      features[type] || [
        "Customized strategic analysis",
        "Industry-specific recommendations",
        "Targeted media lists",
        "Relevant success metrics",
      ]
    );
  };

  const briefPrompts = {
    // Product Launch
    "b2b-saas":
      "Describe your SaaS product, target market (company size, industry verticals), pricing model (per seat, usage-based, enterprise), key differentiators, main competitors, and launch timeline. Include: current MRR if any, target annual contract value, integration requirements, security certifications (SOC2, ISO), and any pilot customer feedback.",

    "consumer-tech":
      "Detail your product features, target demographics (age, income, lifestyle), price point, retail partnerships planned, and unique selling points. Include: manufacturing timeline, expected MSRP, comparable products in market, any beta testing results, planned retail channels (online, Best Buy, Amazon, etc.), and marketing budget.",

    "medical-device":
      "Explain your device's clinical application, FDA clearance status (510k, PMA), target healthcare providers, patient population, and reimbursement pathway. Include: clinical trial results, competitive advantages, training requirements, hospital system targets, key opinion leaders engaged, and implementation timeline.",

    "cpg-product":
      "Describe your product, category placement, target consumer segments, price point, and distribution strategy. Include: retailer targets, margin structure, promotional calendar, sustainability features, competing products, initial production capacity, and any consumer testing results.",

    fintech:
      "Detail your fintech solution, target users, regulatory status, security features, and go-to-market strategy. Include: compliance requirements met, banking partnerships, fee structure, competitive differentiation, user acquisition cost targets, and technology stack.",

    // Brand & Reputation
    "brand-reposition":
      "Describe current brand perception (include any research), desired future positioning, reasons for change, and success metrics. Include: stakeholder groups affected, budget for rebrand, timeline, any visual identity changes planned, employee count for internal rollout, and competitive positioning goals.",

    "thought-leadership":
      "Detail the executive's background, unique expertise areas, controversial or innovative perspectives, target influence goals, and available time commitment. Include: previous media coverage, speaking experience, content creation capacity, specific topics to own, and business objectives for thought leadership.",

    "corporate-reputation":
      "Explain current reputation challenges or opportunities, stakeholder priorities, company milestones upcoming, and measurement goals. Include: recent company news (good or bad), employee count, industry position, CSR initiatives, investor relations needs, and reputation score benchmarks.",

    "esg-sustainability":
      "Describe your ESG initiatives, current performance metrics, stakeholder expectations, and reporting requirements. Include: carbon footprint data, diversity metrics, governance structure, UN SDG alignment, competitor ESG ratings, materiality assessment results, and investment in sustainability.",

    "employer-branding":
      "Detail current employer brand challenges, talent competition, hiring goals, and company culture. Include: current Glassdoor rating, employee count, growth plans, remote work policy, DEI statistics, key roles to fill, compensation positioning, and unique benefits.",

    // Marketing Campaigns
    "integrated-marketing":
      "Describe campaign objectives, target audience, budget allocation, channels to integrate, and success metrics. Include: customer journey mapping done, current channel performance, creative assets needed, technology stack, attribution model, and timeline for campaign.",

    "influencer-campaign":
      "Detail campaign goals, target audience demographics, budget for influencers, content expectations, and timeline. Include: preferred platforms (Instagram, TikTok, YouTube), influencer tiers desired, brand safety requirements, past influencer work, compliance needs, and performance KPIs.",

    "content-marketing":
      "Explain content goals, target audience, current content performance, and distribution channels. Include: SEO priorities, content team size, publication frequency goals, thought leadership topics, competitor content analysis, and measurement framework.",

    "event-marketing":
      "Describe event concept, target attendees, budget, venue/format (in-person, virtual, hybrid), and objectives. Include: expected attendance, sponsor needs, speaker wishlist, content capture plans, competitor events, and follow-up strategy.",

    "partnership-launch":
      "Detail both partners, joint value proposition, target customers, and success metrics. Include: revenue sharing model, marketing commitments from each side, exclusivity terms, launch timeline, co-marketing budget, and long-term vision.",

    // Agency Services
    "new-business-proposal":
      "Describe the prospective client, their industry, known challenges, budget range, and decision timeline. Include: incumbent agency (if any), key decision makers, pitch requirements, your agency's relevant experience, team to propose, and win themes.",

    "campaign-pitch":
      "Detail the client brief, campaign objectives, target audience, budget parameters, and timeline. Include: creative territories to explore, media budget split, measurement requirements, competitive campaigns to beat, and presentation constraints.",

    "annual-planning":
      "Explain client's business goals, previous year performance, budget for the year, and key milestones. Include: product launches planned, executive changes, competitive threats, industry events, crisis preparedness needs, and team resources.",

    "quarterly-review":
      "Describe the client, quarter's activities, performance against goals, and challenges faced. Include: specific KPIs and results, budget burn rate, wins to highlight, learnings captured, client feedback, and recommendations for next quarter.",

    "budget-justification":
      "Detail current program performance, budget increase requested, competitive benchmarks, and expected ROI. Include: historical program ROI, missed opportunities from underfunding, peer company spending, value created to date, and growth potential with increased investment.",
  };

  const toggleSection = (sectionId) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  // Helper function to parse Claude's response into structured sections
  const parseReportSections = (content) => {
    const sections = [];
    const lines = content.split('\n');
    let currentSection = null;
    let currentContent = [];

    lines.forEach(line => {
      // Check if line is a section header (starts with number or is in caps)
      if (/^\d+\.\s/.test(line) || /^[A-Z][A-Z\s]+:/.test(line)) {
        // Save previous section if exists
        if (currentSection) {
          sections.push({
            id: currentSection.toLowerCase().replace(/\s+/g, '-'),
            title: currentSection,
            content: currentContent.join('\n').trim()
          });
        }
        // Start new section
        currentSection = line.replace(/^\d+\.\s/, '').replace(/:$/, '').trim();
        currentContent = [];
      } else if (line.trim()) {
        currentContent.push(line);
      }
    });

    // Add last section
    if (currentSection) {
      sections.push({
        id: currentSection.toLowerCase().replace(/\s+/g, '-'),
        title: currentSection,
        content: currentContent.join('\n').trim()
      });
    }

    // If no sections were parsed, create a single section with all content
    if (sections.length === 0) {
      sections.push({
        id: 'report',
        title: 'Strategic Report',
        content: content
      });
    }

    return sections;
  };

  const generateStrategicReport = async () => {
    if (!campaignBrief.trim() || !selectedType) {
      setError("Please select a campaign type and provide a detailed brief");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Step 1: Generate comprehensive strategic report using Claude
      const response = await fetch(
        `${API_BASE_URL}/content/ai-generate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
          body: JSON.stringify({
            prompt: `Generate a comprehensive strategic campaign report for:
            
Campaign Type: ${selectedType}
Category: ${selectedCategory}
Brief: ${campaignBrief}
${briefPrompts[selectedType] ? `Context: ${briefPrompts[selectedType]}` : ''}

Please provide a detailed strategic report with the following sections:
1. Executive Summary
2. Campaign Objectives & KPIs
3. Target Audience Analysis
4. Key Messages & Positioning
5. Strategic Recommendations
6. Channel Strategy
7. Timeline & Milestones
8. Budget Considerations
9. Risk Assessment
10. Success Metrics

Format the response as a structured report with clear sections and actionable insights.`,
            type: "campaign-strategy",
            tone: "strategic",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to generate report");
      }

      // Parse the Claude response into a structured report
      const reportContent = data.content || data.response || data;
      const structuredReport = {
        title: `Strategic Campaign Report - ${selectedType}`,
        sections: parseReportSections(reportContent),
        timestamp: new Date().toISOString()
      };

      // Set the report and expand all sections
      setStrategicReport(structuredReport);

      // Auto-expand all sections for easy viewing
      const sections = {};
      if (structuredReport && structuredReport.sections) {
        structuredReport.sections.forEach((section) => {
          sections[section.id] = true;
        });
      }
      setExpandedSections(sections);
    } catch (error) {
      console.error("Error generating report:", error);
      setError(error.message || "Failed to generate strategic report");
    } finally {
      setIsGenerating(false);
    }
  };

  const exportReport = (format) => {
    if (!strategicReport) return;

    if (format === "pdf") {
      // Create HTML content for PDF
      let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${strategicReport.title}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
            h1 { color: #2563eb; border-bottom: 3px solid #2563eb; padding-bottom: 10px; }
            h2 { color: #1e40af; margin-top: 30px; }
            h3 { color: #374151; margin-top: 20px; }
            .executive-summary { background: #eff6ff; padding: 20px; border-left: 4px solid #2563eb; margin: 20px 0; }
            .section { margin-bottom: 30px; }
            .subsection { margin-left: 20px; margin-top: 15px; }
            .recommendations { background: #f0f9ff; padding: 15px; border-radius: 5px; margin-top: 15px; }
            .metrics { display: flex; gap: 20px; margin-top: 20px; }
            .metric { background: #f9fafb; padding: 15px; border-radius: 5px; text-align: center; flex: 1; }
            .next-steps { background: #f0fdf4; padding: 20px; border-left: 4px solid #10b981; margin-top: 30px; }
          </style>
        </head>
        <body>
          <h1>${strategicReport.title}</h1>
          <p style="color: #6b7280; font-size: 18px;">${
            strategicReport.subtitle
          }</p>
          <p style="color: #9ca3af;">Generated on ${new Date().toLocaleDateString()}</p>
      `;

      if (strategicReport.executiveSummary) {
        htmlContent += `
          <div class="executive-summary">
            <h2>Executive Summary</h2>
            <p>${strategicReport.executiveSummary.replace(/\n/g, "<br>")}</p>
          </div>
        `;
      }

      strategicReport.sections?.forEach((section) => {
        htmlContent += `<div class="section"><h2>${section.title}</h2>`;
        if (section.content) {
          htmlContent += `<p>${section.content.replace(/\n/g, "<br>")}</p>`;
        }
        section.subsections?.forEach((sub) => {
          htmlContent += `<div class="subsection"><h3>${
            sub.title
          }</h3><p>${sub.content.replace(/\n/g, "<br>")}</p></div>`;
        });
        if (section.recommendations?.length) {
          htmlContent += `<div class="recommendations"><h3>Key Recommendations</h3><ul>`;
          section.recommendations.forEach((rec) => {
            htmlContent += `<li>${rec}</li>`;
          });
          htmlContent += `</ul></div>`;
        }
        htmlContent += `</div>`;
      });

      if (strategicReport.nextSteps?.length) {
        htmlContent += `<div class="next-steps"><h2>Immediate Next Steps</h2><ol>`;
        strategicReport.nextSteps.forEach((step) => {
          htmlContent += `<li>${step}</li>`;
        });
        htmlContent += `</ol></div>`;
      }

      htmlContent += `</body></html>`;

      // Create and download
      const blob = new Blob([htmlContent], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${strategicReport.title.replace(/\s+/g, "_")}_Report.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (format === "slides") {
      // Export as JSON for now (can be enhanced to actual slides format)
      const slidesData = {
        title: strategicReport.title,
        subtitle: strategicReport.subtitle,
        slides: [
          {
            title: "Executive Summary",
            content: strategicReport.executiveSummary,
          },
          ...strategicReport.sections.map((section) => ({
            title: section.title,
            content: section.content,
            bullets: section.recommendations || [],
          })),
        ],
      };

      const blob = new Blob([JSON.stringify(slidesData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${strategicReport.title.replace(/\s+/g, "_")}_Slides.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const expandReport = async () => {
    if (!expansionPrompt.trim() || !strategicReport) {
      console.log("Missing prompt or report:", {
        expansionPrompt,
        strategicReport,
      });
      return;
    }

    setIsExpanding(true);
    setError(null);

    console.log("Expanding report with:", {
      campaignType: selectedType,
      promptLength: expansionPrompt.length,
      reportSections: strategicReport.sections?.length,
    });

    try {
      const response = await fetch(
        `${API_BASE_URL}/campaigns/expand-report`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
          body: JSON.stringify({
            campaignType: selectedType,
            originalBrief: campaignBrief,
            currentReport: strategicReport,
            expansionPrompt: expansionPrompt,
          }),
        }
      );

      console.log("Response status:", response.status);
      const data = await response.json();
      console.log("Response data:", data);

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to expand report");
      }

      // Add the expansion to our list
      setReportExpansions((prev) => [
        ...prev,
        {
          prompt: data.expansion.prompt,
          content: data.expansion.content,
          timestamp: data.expansion.timestamp,
          relatedSections: data.expansion.relatedSections || [],
        },
      ]);

      // Clear the prompt and hide the input
      setExpansionPrompt("");
      setShowExpansionPrompt(false);

      // Scroll to the new expansion
      setTimeout(() => {
        const expansionsSection = document.getElementById(
          "additional-insights"
        );
        if (expansionsSection) {
          expansionsSection.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }, 100);
    } catch (error) {
      console.error("Error expanding report:", error);
      setError(error.message || "Failed to expand report");
      alert(`Failed to expand report: ${error.message}`);
    } finally {
      setIsExpanding(false);
    }
  };

  const renderReportSection = (section) => {
    const isExpanded = expandedSections[section.id] !== false;

    return (
      <div
        key={section.id}
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          marginBottom: "1rem",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
          overflow: "hidden",
        }}
      >
        <div
          onClick={() => toggleSection(section.id)}
          style={{
            padding: "1.5rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: isExpanded ? "1px solid #e5e7eb" : "none",
          }}
        >
          <h3
            style={{
              fontSize: "1.25rem",
              fontWeight: "600",
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
            }}
          >
            {section.title}
          </h3>
          {isExpanded ? (
            <ChevronDown
              style={{ width: "20px", height: "20px", color: "#6b7280" }}
            />
          ) : (
            <ChevronRight
              style={{ width: "20px", height: "20px", color: "#6b7280" }}
            />
          )}
        </div>

        {isExpanded && (
          <div style={{ padding: "1.5rem", paddingTop: "1rem" }}>
            {section.content && (
              <div style={{ whiteSpace: "pre-wrap", lineHeight: "1.75" }}>
                {section.content}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f9fafb",
        padding: "2rem",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <h1
            style={{
              fontSize: "3rem",
              fontWeight: "bold",
              background: "linear-gradient(135deg, #3b82f6 0%, #7c3aed 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              marginBottom: "0.5rem",
            }}
          >
            Campaign Intelligence
          </h1>
          <p
            style={{
              fontSize: "1.25rem",
              color: "#6b7280",
              maxWidth: "600px",
              margin: "0 auto",
            }}
          >
            AI-powered strategic intelligence for winning campaigns
          </p>
        </div>

        {!strategicReport ? (
          <>
            {/* Campaign Type Selection */}
            {!selectedType && (
              <div style={{ marginBottom: "2rem" }}>
                <h2
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: "600",
                    marginBottom: "1.5rem",
                    textAlign: "center",
                  }}
                >
                  What type of campaign are you planning?
                </h2>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                    gap: "1.5rem",
                  }}
                >
                  {Object.entries(campaignCategories).map(
                    ([category, config]) => {
                      const Icon = config.icon;
                      return (
                        <div
                          key={category}
                          style={{
                            backgroundColor: "white",
                            borderRadius: "12px",
                            padding: "1.5rem",
                            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                            transition: "all 0.2s",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "1rem",
                              marginBottom: "1rem",
                            }}
                          >
                            <div
                              style={{
                                width: "48px",
                                height: "48px",
                                borderRadius: "8px",
                                backgroundColor: config.color + "20",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Icon
                                style={{
                                  width: "24px",
                                  height: "24px",
                                  color: config.color,
                                }}
                              />
                            </div>
                            <h3
                              style={{
                                fontSize: "1.25rem",
                                fontWeight: "600",
                                margin: 0,
                              }}
                            >
                              {category}
                            </h3>
                          </div>

                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "0.5rem",
                            }}
                          >
                            {config.types.map((type) => (
                              <button
                                key={type.id}
                                onClick={() => {
                                  setSelectedCategory(category);
                                  setSelectedType(type.id);
                                }}
                                style={{
                                  textAlign: "left",
                                  padding: "0.75rem",
                                  borderRadius: "6px",
                                  border: "1px solid #e5e7eb",
                                  backgroundColor: "white",
                                  cursor: "pointer",
                                  transition: "all 0.2s",
                                  ":hover": {
                                    backgroundColor: "#f9fafb",
                                    borderColor: config.color,
                                  },
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.backgroundColor = "#f9fafb";
                                  e.target.style.borderColor = config.color;
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.backgroundColor = "white";
                                  e.target.style.borderColor = "#e5e7eb";
                                }}
                              >
                                <div
                                  style={{
                                    fontWeight: "500",
                                    marginBottom: "0.25rem",
                                  }}
                                >
                                  {type.name}
                                </div>
                                <div
                                  style={{
                                    fontSize: "0.875rem",
                                    color: "#6b7280",
                                  }}
                                >
                                  {type.description}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            )}

            {/* Brief Input */}
            {selectedType && (
              <div
                style={{
                  backgroundColor: "white",
                  borderRadius: "12px",
                  padding: "2rem",
                  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "1.5rem",
                  }}
                >
                  <div>
                    <h2
                      style={{
                        fontSize: "1.5rem",
                        fontWeight: "600",
                        marginBottom: "0.5rem",
                      }}
                    >
                      Campaign Brief
                    </h2>
                    <p style={{ color: "#6b7280" }}>
                      {selectedCategory} →{" "}
                      {
                        campaignCategories[selectedCategory].types.find(
                          (t) => t.id === selectedType
                        )?.name
                      }
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedType("");
                      setSelectedCategory("");
                      setCampaignBrief("");
                    }}
                    style={{
                      padding: "0.5rem 1rem",
                      borderRadius: "6px",
                      border: "1px solid #e5e7eb",
                      backgroundColor: "white",
                      cursor: "pointer",
                      fontSize: "0.875rem",
                    }}
                  >
                    Change Type
                  </button>
                </div>

                {/* Campaign Type Benefits */}
                <div
                  style={{
                    backgroundColor: "#f0f9ff",
                    borderRadius: "8px",
                    padding: "1rem",
                    marginBottom: "1rem",
                    border: "1px solid #3b82f6",
                  }}
                >
                  <h4
                    style={{
                      margin: "0 0 0.5rem 0",
                      color: "#1e40af",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <Sparkles style={{ width: "20px", height: "20px" }} />
                    Why{" "}
                    {
                      campaignCategories[selectedCategory].types.find(
                        (t) => t.id === selectedType
                      )?.name
                    }{" "}
                    is unique:
                  </h4>
                  <p
                    style={{
                      margin: "0 0 0.5rem 0",
                      color: "#1e40af",
                      fontSize: "0.875rem",
                    }}
                  >
                    Your strategic report will include specialized analysis for:
                  </p>
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: "1.5rem",
                      fontSize: "0.875rem",
                      color: "#1e40af",
                    }}
                  >
                    {getCampaignTypeFeatures(selectedType).map(
                      (feature, idx) => (
                        <li key={idx} style={{ marginBottom: "0.25rem" }}>
                          {feature}
                        </li>
                      )
                    )}
                  </ul>
                </div>

                <div
                  style={{
                    backgroundColor: "#f0f9ff",
                    borderLeft: "4px solid #3b82f6",
                    padding: "1rem",
                    borderRadius: "4px",
                    marginBottom: "1.5rem",
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      color: "#1e40af",
                      fontSize: "0.875rem",
                    }}
                  >
                    <strong>Guidance:</strong>{" "}
                    {briefPrompts[selectedType] ||
                      "Provide as much detail as possible about your campaign objectives, target audience, timeline, budget, and any specific requirements or constraints."}
                  </p>
                </div>

                <textarea
                  value={campaignBrief}
                  onChange={(e) => setCampaignBrief(e.target.value)}
                  placeholder="Provide comprehensive details about your campaign..."
                  style={{
                    width: "100%",
                    minHeight: "300px",
                    padding: "1rem",
                    fontSize: "1rem",
                    border: "2px solid #e5e7eb",
                    borderRadius: "8px",
                    resize: "vertical",
                    outline: "none",
                    transition: "border-color 0.2s",
                    fontFamily: "inherit",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
                  onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
                />

                {error && (
                  <div
                    style={{
                      marginTop: "1rem",
                      padding: "1rem",
                      backgroundColor: "#fef2f2",
                      border: "1px solid #fecaca",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <AlertCircle
                      style={{
                        width: "20px",
                        height: "20px",
                        color: "#dc2626",
                      }}
                    />
                    <p style={{ margin: 0, color: "#dc2626" }}>{error}</p>
                  </div>
                )}

                <button
                  onClick={generateStrategicReport}
                  disabled={!campaignBrief.trim() || isGenerating}
                  style={{
                    marginTop: "1.5rem",
                    width: "100%",
                    padding: "1rem",
                    borderRadius: "8px",
                    background:
                      campaignBrief.trim() && !isGenerating
                        ? "linear-gradient(135deg, #3b82f6 0%, #7c3aed 100%)"
                        : "#e5e7eb",
                    color:
                      campaignBrief.trim() && !isGenerating
                        ? "white"
                        : "#9ca3af",
                    border: "none",
                    fontSize: "1.125rem",
                    fontWeight: "600",
                    cursor:
                      campaignBrief.trim() && !isGenerating
                        ? "pointer"
                        : "not-allowed",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                    transition: "all 0.2s",
                  }}
                >
                  {isGenerating ? (
                    <>
                      <Loader
                        style={{
                          width: "20px",
                          height: "20px",
                          animation: "spin 1s linear infinite",
                        }}
                      />
                      Generating Strategic Report...
                    </>
                  ) : (
                    <>
                      <Brain style={{ width: "20px", height: "20px" }} />
                      Generate Strategic Report
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        ) : (
          /* Strategic Report Display */
          <div>
            {/* Report Header */}
            <div
              style={{
                backgroundColor: "white",
                borderRadius: "12px",
                padding: "2rem",
                marginBottom: "2rem",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "start",
                }}
              >
                <div>
                  <h2
                    style={{
                      fontSize: "2rem",
                      fontWeight: "bold",
                      marginBottom: "0.5rem",
                    }}
                  >
                    {strategicReport.title}
                  </h2>
                  <p style={{ color: "#6b7280", marginBottom: "1rem" }}>
                    {strategicReport.subtitle}
                  </p>
                  <div
                    style={{
                      display: "flex",
                      gap: "2rem",
                      fontSize: "0.875rem",
                      color: "#6b7280",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <Calendar style={{ width: "16px", height: "16px" }} />
                      Generated: {new Date().toLocaleDateString()}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <FileText style={{ width: "16px", height: "16px" }} />
                      {strategicReport.sections?.length || 0} Sections
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <SaveToMemoryVaultButton
                    content={JSON.stringify(
                      {
                        report: strategicReport,
                        metadata: {
                          campaignType: selectedType,
                          campaignCategory: selectedCategory,
                          brief: campaignBrief,
                          generatedAt: new Date().toISOString(),
                          expansions: reportExpansions,
                        },
                      },
                      null,
                      2
                    )}
                    title={strategicReport.title || "Strategic Report"}
                    type="campaign-strategy"
                    source="campaign-intelligence"
                    folder_type="campaign-intelligence"
                    preview={
                      strategicReport.executiveSummary ||
                      strategicReport.subtitle
                    }
                    tags={[
                      "campaign-intelligence",
                      selectedType,
                      selectedCategory,
                      "strategic-report",
                      new Date().getFullYear().toString(),
                    ]}
                    metadata={{
                      generated_at: new Date().toISOString(),
                      project_id: selectedProject?.id,
                      campaign_type: selectedType,
                      campaign_category: selectedCategory,
                      sections_count: strategicReport.sections?.length || 0,
                      expansions_count: reportExpansions.length,
                    }}
                    buttonText={savedReportId ? "Saved" : "Save to Vault"}
                    onSuccess={(item) => {
                      setSavedReportId(item.id);
                      alert("Report saved successfully to MemoryVault!");
                    }}
                  />
                  <button
                    onClick={() => exportReport("pdf")}
                    style={{
                      padding: "0.75rem 1.5rem",
                      borderRadius: "6px",
                      border: "1px solid #e5e7eb",
                      backgroundColor: "white",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      transition: "all 0.2s",
                    }}
                  >
                    <Download style={{ width: "16px", height: "16px" }} />
                    Export PDF
                  </button>
                  <button
                    onClick={() => exportReport("slides")}
                    style={{
                      padding: "0.75rem 1.5rem",
                      borderRadius: "6px",
                      border: "1px solid #e5e7eb",
                      backgroundColor: "white",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      transition: "all 0.2s",
                    }}
                  >
                    <FileText style={{ width: "16px", height: "16px" }} />
                    Export Slides
                  </button>
                  <button
                    onClick={() => {
                      setStrategicReport(null);
                      setSelectedType("");
                      setSelectedCategory("");
                      setCampaignBrief("");
                      setSavedReportId(null);
                      setReportExpansions([]);
                      setShowExpansionPrompt(false);
                      setExpansionPrompt("");
                    }}
                    style={{
                      padding: "0.75rem 1.5rem",
                      borderRadius: "6px",
                      backgroundColor: "#3b82f6",
                      color: "white",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      transition: "all 0.2s",
                    }}
                  >
                    <ArrowRight style={{ width: "16px", height: "16px" }} />
                    New Report
                  </button>
                </div>
              </div>
            </div>

            {/* Report Sections */}
            {strategicReport.sections?.map((section) =>
              renderReportSection(section)
            )}

            {/* Next Steps */}
            {strategicReport.nextSteps && (
              <div
                style={{
                  backgroundColor: "#f0fdf4",
                  borderLeft: "4px solid #10b981",
                  padding: "1.5rem",
                  borderRadius: "8px",
                  marginTop: "2rem",
                }}
              >
                <h3
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: "600",
                    marginBottom: "0.75rem",
                    color: "#047857",
                  }}
                >
                  Immediate Next Steps
                </h3>
                <ol
                  style={{
                    margin: 0,
                    paddingLeft: "1.25rem",
                    color: "#047857",
                  }}
                >
                  {strategicReport.nextSteps.map((step, idx) => (
                    <li key={idx} style={{ marginBottom: "0.5rem" }}>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Report Expansion Feature - NOW IN THE RIGHT PLACE! */}
            <div
              style={{
                backgroundColor: "#f3f4f6",
                borderRadius: "12px",
                padding: "2rem",
                marginTop: "2rem",
                border: "2px dashed #9ca3af",
              }}
            >
              {!showExpansionPrompt ? (
                <div style={{ textAlign: "center" }}>
                  <h3
                    style={{
                      fontSize: "1.25rem",
                      fontWeight: "600",
                      marginBottom: "0.5rem",
                      color: "#374151",
                    }}
                  >
                    Need More Details?
                  </h3>
                  <p style={{ color: "#6b7280", marginBottom: "1rem" }}>
                    Ask Claude to expand on any aspect of this report
                  </p>
                  <button
                    onClick={() => setShowExpansionPrompt(true)}
                    style={{
                      padding: "0.75rem 1.5rem",
                      borderRadius: "8px",
                      background:
                        "linear-gradient(135deg, #3b82f6 0%, #7c3aed 100%)",
                      color: "white",
                      border: "none",
                      fontSize: "1rem",
                      fontWeight: "500",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = "translateY(-2px)";
                      e.target.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = "translateY(0)";
                      e.target.style.boxShadow = "none";
                    }}
                  >
                    <Brain style={{ width: "20px", height: "20px" }} />
                    Expand Report
                  </button>
                </div>
              ) : (
                <div>
                  <h3
                    style={{
                      fontSize: "1.25rem",
                      fontWeight: "600",
                      marginBottom: "1rem",
                      color: "#374151",
                    }}
                  >
                    What would you like to know more about?
                  </h3>
                  <div style={{ marginBottom: "1rem" }}>
                    <p
                      style={{
                        fontSize: "0.875rem",
                        color: "#6b7280",
                        marginBottom: "0.5rem",
                      }}
                    >
                      Example prompts:
                    </p>
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "0.5rem",
                        marginBottom: "1rem",
                      }}
                    >
                      {[
                        "Expand on the creative concepts with specific examples",
                        "Provide more detail on the 30-day quick wins",
                        "Deep dive into the competitive analysis",
                        "Add specific journalist names and media targets",
                        "Include detailed budget breakdown by channel",
                        "Expand on partnership opportunities",
                      ].map((example, idx) => (
                        <button
                          key={idx}
                          onClick={() => setExpansionPrompt(example)}
                          style={{
                            padding: "0.25rem 0.75rem",
                            borderRadius: "9999px",
                            backgroundColor: "#e5e7eb",
                            color: "#374151",
                            border: "none",
                            fontSize: "0.875rem",
                            cursor: "pointer",
                            transition: "all 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = "#d1d5db";
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = "#e5e7eb";
                          }}
                        >
                          {example}
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    value={expansionPrompt}
                    onChange={(e) => setExpansionPrompt(e.target.value)}
                    placeholder="Ask for specific details, examples, or expansions on any part of the report..."
                    style={{
                      width: "100%",
                      minHeight: "100px",
                      padding: "1rem",
                      fontSize: "1rem",
                      border: "2px solid #e5e7eb",
                      borderRadius: "8px",
                      resize: "vertical",
                      outline: "none",
                      transition: "border-color 0.2s",
                      fontFamily: "inherit",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
                    onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
                  />
                  <div
                    style={{
                      display: "flex",
                      gap: "1rem",
                      marginTop: "1rem",
                      justifyContent: "flex-end",
                    }}
                  >
                    <button
                      onClick={() => {
                        setShowExpansionPrompt(false);
                        setExpansionPrompt("");
                      }}
                      style={{
                        padding: "0.75rem 1.5rem",
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb",
                        backgroundColor: "white",
                        color: "#374151",
                        cursor: "pointer",
                        fontSize: "1rem",
                        fontWeight: "500",
                        transition: "all 0.2s",
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={expandReport}
                      disabled={!expansionPrompt.trim() || isExpanding}
                      style={{
                        padding: "0.75rem 1.5rem",
                        borderRadius: "8px",
                        background:
                          expansionPrompt.trim() && !isExpanding
                            ? "linear-gradient(135deg, #3b82f6 0%, #7c3aed 100%)"
                            : "#e5e7eb",
                        color:
                          expansionPrompt.trim() && !isExpanding
                            ? "white"
                            : "#9ca3af",
                        border: "none",
                        fontSize: "1rem",
                        fontWeight: "500",
                        cursor:
                          expansionPrompt.trim() && !isExpanding
                            ? "pointer"
                            : "not-allowed",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        transition: "all 0.2s",
                      }}
                    >
                      {isExpanding ? (
                        <>
                          <Loader
                            style={{
                              width: "20px",
                              height: "20px",
                              animation: "spin 1s linear infinite",
                            }}
                          />
                          Expanding...
                        </>
                      ) : (
                        <>
                          <Sparkles style={{ width: "20px", height: "20px" }} />
                          Expand Report
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Display Expanded Sections */}
            {reportExpansions.length > 0 && (
              <div style={{ marginTop: "2rem" }}>
                <h2
                  id="additional-insights"
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: "600",
                    marginBottom: "1rem",
                    color: "#1e40af",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <Sparkles style={{ width: "24px", height: "24px" }} />
                  Additional Insights
                </h2>
                {reportExpansions.map((expansion, idx) => (
                  <div
                    key={idx}
                    style={{
                      backgroundColor: "#eff6ff",
                      borderLeft: "4px solid #3b82f6",
                      padding: "1.5rem",
                      borderRadius: "8px",
                      marginBottom: "1rem",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "1.125rem",
                        fontWeight: "600",
                        marginBottom: "0.5rem",
                        color: "#1e40af",
                      }}
                    >
                      {expansion.prompt}
                    </h3>
                    <div
                      style={{
                        color: "#374151",
                        lineHeight: "1.75",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {expansion.content}
                    </div>
                    {expansion.timestamp && (
                      <div
                        style={{
                          fontSize: "0.875rem",
                          color: "#6b7280",
                          marginTop: "0.5rem",
                        }}
                      >
                        Added: {new Date(expansion.timestamp).toLocaleString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
