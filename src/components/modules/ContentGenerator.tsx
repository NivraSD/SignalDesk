import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  generateAIContent,
  generateSingleContent as apiGenerateContent
} from "../../services/content-orchestrator";
import api, {
  generateContent,
  getContentHistory,
  getContentTemplates,
  saveContent,
  uploadTemplates,
  deleteTemplate as apiDeleteTemplate,
  exportContent as apiExportContent,
  analyzeContent as apiAnalyzeContent,
} from "../services/api";
import "./ContentGenerator.css";
import SaveToMemoryVaultButton from "./MemoryVault/SaveToMemoryVaultButton";
import { useProject } from "../contexts/ProjectContext";
import {
  BookOpen,
  Copy,
  Lightbulb,
  Award,
  Upload,
  FileText,
  X,
  Eye,
  Settings,
  Download,
  Save,
  BarChart3,
  TrendingUp,
  Users,
  Target,
  AlertTriangle,
  CheckCircle,
  Zap,
  Brain,
  Shield,
} from "lucide-react";

const ContentGenerator = () => {
  const { user } = useAuth();
  const { selectedProject } = useProject();
  const [currentType, setCurrentType] = useState("press-release");
  const [showGuides, setShowGuides] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState("");
  const [savedContents, setSavedContents] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const contentFormRef = useRef({});
  const templateUploadRef = useRef(null);
  const [contentAnalysis, setContentAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [generationMethod, setGenerationMethod] = useState(null); // 'ai' or 'form'
  const [isChangingType, setIsChangingType] = useState(false);
  const [selectedTone, setSelectedTone] = useState("professional");

  const getScoreColor = (score) => {
    if (score >= 80) return "#10b981";
    if (score >= 60) return "#f59e0b";
    return "#ef4444";
  };

  // Content type configurations
  const contentTypeLabels = {
    "press-release": "Press Release",
    "crisis-response": "Crisis Response Statement",
    "social-post": "Social Media Post",
    "media-pitch": "Media Pitch",
    "exec-statement": "Executive Statement",
    "qa-doc": "Q&A Document",
    messaging: "Messaging Framework",
    "thought-leadership": "Thought Leadership",
    presentation: "Presentation Deck",
  };

  const toneOptions = {
    professional: {
      label: "Corporate/Professional",
      description: "Formal, authoritative, industry-standard",
      characteristics: [
        "formal language",
        "industry terminology",
        "measured statements",
        "third-person perspective",
      ],
    },
    bold: {
      label: "Bold/Innovative",
      description: "Confident, disruptive, attention-grabbing",
      characteristics: [
        "strong claims",
        "provocative angles",
        "first-person authority",
        "challenge status quo",
      ],
    },
    conversational: {
      label: "Conversational/Friendly",
      description: "Approachable, human, relatable",
      characteristics: [
        "casual language",
        "personal anecdotes",
        "direct address",
        "everyday examples",
      ],
    },
    analytical: {
      label: "Data-Driven/Analytical",
      description: "Fact-based, research-heavy, objective",
      characteristics: [
        "statistics-focused",
        "evidence-based",
        "neutral tone",
        "technical precision",
      ],
    },
    inspirational: {
      label: "Inspirational/Visionary",
      description: "Uplifting, future-focused, motivational",
      characteristics: [
        "aspirational language",
        "vision statements",
        "emotional appeal",
        "possibility-focused",
      ],
    },
    urgent: {
      label: "Urgent/Action-Oriented",
      description: "Time-sensitive, direct, compelling",
      characteristics: [
        "immediate action",
        "deadline-focused",
        "clear CTAs",
        "consequence-driven",
      ],
    },
  };

  // Prompt guides configuration
  const promptGuides = {
    "press-release": {
      title: "Press Release Guide",
      subtitle: "Based on AP Style and PR Industry Standards",
      framework: "Inverted Pyramid",
      tips: [
        "Lead with the most newsworthy information in your first paragraph",
        "Answer WHO, WHAT, WHERE, WHEN, WHY in the first 2 paragraphs",
        "Use concrete numbers and specific dates instead of vague terms",
        "Include strategic quotes that add insight, not just promotion",
        "End with boilerplate company information",
      ],
      bestPractices: [
        "Headline: 10-12 words, active voice",
        "Dateline format: CITY, STATE - Date",
        "Paragraphs: 2-3 sentences max",
        "Total length: 400-600 words",
        "Include media contact info",
        "Use third person throughout",
      ],
      examples: [
        {
          category: "Strong Headline",
          input: "Product Launch Announcement",
          output:
            "TechCorp Launches AI-Powered Analytics Platform, Reduces Processing Time by 75%",
        },
        {
          category: "Strategic Quote",
          input: "CEO Quote about expansion",
          output:
            '"This expansion reflects growing market demand for sustainable solutions and positions us to serve 2 million additional customers by 2026," said Jane Smith, CEO.',
        },
      ],
      commonMistakes: [
        "Using promotional language instead of factual reporting",
        "Burying the lead in paragraph 3 or later",
        "Generic quotes that don't add value",
        "Missing concrete metrics or dates",
      ],
    },

    "crisis-response": {
      title: "Crisis Response Statement Guide",
      subtitle: "Professional Crisis Communication Framework",
      framework: "CARE Model",
      tips: [
        "Acknowledge the situation immediately and honestly",
        "Take appropriate responsibility without admitting legal fault",
        "Show genuine empathy for those affected",
        "Outline specific actions being taken to address the issue",
        "Provide clear next steps and timeline for updates",
      ],
      bestPractices: [
        "Respond quickly - within 24 hours maximum",
        "Use clear, jargon-free language",
        "Be transparent about what you know and don't know",
        "Focus on those affected, not company impact",
        "Include specific corrective actions",
        "Provide contact information for further questions",
      ],
      examples: [
        {
          category: "Acknowledgment",
          input: "We are investigating the issue",
          output:
            "We are deeply concerned about the data security incident that occurred on March 15th and are taking immediate action to address it.",
        },
      ],
      commonMistakes: [
        "Deflecting blame or making excuses",
        "Using corporate speak instead of human language",
        "Focusing on company impact rather than those affected",
        "Being vague about corrective actions",
      ],
    },

    "social-post": {
      title: "Social Media Post Guide",
      subtitle: "Platform-Optimized Engagement Strategy",
      framework: "Hook-Value-CTA",
      tips: [
        "Start with a compelling hook in the first 5 words",
        "Provide clear value or insight to your audience",
        "Use platform-appropriate hashtags (2-3 for LinkedIn, 5-10 for Instagram)",
        "Include a clear call-to-action",
        "Write in a conversational, authentic tone",
      ],
      bestPractices: [
        "LinkedIn: 150-300 characters for maximum engagement",
        "Twitter: Use threads for longer content",
        "Keep paragraphs short (1-2 sentences)",
        "Ask questions to encourage comments",
        "Use emojis strategically for visual interest",
        "Post when your audience is most active",
      ],
      examples: [
        {
          category: "Strong Hook",
          input: "Our new feature is great",
          output:
            "3 clicks. That's all it takes to automate your entire workflow with our new feature.",
        },
      ],
      commonMistakes: [
        "Being too salesy or promotional",
        "Using too many hashtags",
        "Posting without a clear purpose",
        "Ignoring platform-specific best practices",
      ],
    },

    "media-pitch": {
      title: "Media Pitch Guide",
      subtitle: "Journalist-Focused Communication Strategy",
      framework: "NEWS Framework",
      tips: [
        "Research the journalist and their beat thoroughly",
        "Lead with a compelling, newsworthy angle",
        "Explain why this story matters to their audience",
        "Provide exclusive access or unique data",
        "Make it easy for them to write the story",
      ],
      bestPractices: [
        "Subject line: Clear, specific, benefit-focused",
        "Email length: 150-200 words maximum",
        "Include high-res images and resources",
        "Offer expert sources for interviews",
        "Follow up once after 1 week",
        "Personalize every pitch",
      ],
      examples: [
        {
          category: "Strong Subject Line",
          input: "Story idea for you",
          output:
            "EXCLUSIVE: Local startup's AI reduces hospital readmissions by 40%",
        },
      ],
      commonMistakes: [
        "Mass emailing without personalization",
        "Leading with company news instead of story angle",
        "Making it about you, not their audience",
        "Following up too aggressively",
      ],
    },

    "exec-statement": {
      title: "Executive Statement Guide",
      subtitle: "Leadership Voice and Authority",
      framework: "Vision-Impact-Action",
      tips: [
        "Establish credibility and expertise early",
        "Use data and specific examples to support points",
        "Connect to broader industry trends or implications",
        "Speak with authority but remain relatable",
        "End with a forward-looking perspective",
      ],
      bestPractices: [
        "Write in first person for authenticity",
        "Use confident, decisive language",
        "Include personal insights or experiences",
        "Reference industry data or trends",
        "Keep paragraphs short and punchy",
        "Include a memorable closing thought",
      ],
      examples: [
        {
          category: "Authority Statement",
          input: "We think this will work",
          output:
            "After 15 years in this industry, I've never seen technology adoption happen this quickly - and here's why that matters for every business leader.",
        },
      ],
      commonMistakes: [
        "Sounding too corporate or scripted",
        "Making unsubstantiated claims",
        "Focusing on company achievements rather than insights",
        "Using jargon that alienates readers",
      ],
    },

    "qa-doc": {
      title: "Q&A Document Guide",
      subtitle: "Comprehensive Information Resource",
      framework: "Anticipate-Answer-Clarify",
      tips: [
        "Anticipate the most difficult questions stakeholders will ask",
        "Provide complete, honest answers without being defensive",
        "Use clear, simple language that anyone can understand",
        "Include specific examples and data when possible",
        "Address potential follow-up questions proactively",
      ],
      bestPractices: [
        "Start with the most important questions",
        "Use consistent formatting throughout",
        "Keep answers concise but complete",
        "Include contact information for additional questions",
        "Update regularly as new questions arise",
        "Test with actual stakeholders before finalizing",
      ],
      examples: [
        {
          category: "Clear Answer",
          input: "Q: Will this affect pricing?",
          output:
            "Q: Will this affect pricing? A: No. Current customers will see no price changes through 2025. New customers will see a 5% increase starting January 1st, 2026.",
        },
      ],
      commonMistakes: [
        "Being evasive or overly vague",
        "Using technical jargon without explanation",
        "Ignoring difficult or uncomfortable questions",
        "Making the answers too long or complex",
      ],
    },

    messaging: {
      title: "Messaging Framework Guide",
      subtitle: "Strategic Communication Foundation",
      framework: "Core-Proof-Benefit",
      tips: [
        "Define one clear, primary message that everything supports",
        "Create a hierarchy of supporting messages",
        "Ensure messages are relevant to each audience segment",
        "Include proof points and evidence for each claim",
        "Test messages with real audience members",
      ],
      bestPractices: [
        "Core message: One sentence maximum",
        "Use active voice and strong verbs",
        "Include emotional and rational appeals",
        "Make messages memorable and repeatable",
        "Ensure consistency across all channels",
        "Update based on market feedback",
      ],
      examples: [
        {
          category: "Core Message",
          input: "Our software is good for businesses",
          output:
            "We help growing companies automate their workflows so they can focus on what matters most: their customers.",
        },
      ],
      commonMistakes: [
        "Trying to say too much in one message",
        "Being too generic or unmemorable",
        "Focusing on features instead of benefits",
        "Not adapting messages for different audiences",
      ],
    },

    "thought-leadership": {
      title: "Thought Leadership Guide",
      subtitle: "Expert Authority and Insight",
      framework: "Insight-Evidence-Implication",
      tips: [
        "Share genuinely original insights or perspectives",
        "Support opinions with data, research, or experience",
        "Connect current trends to future implications",
        "Provide actionable advice readers can implement",
        "Position yourself as a trusted industry voice",
      ],
      bestPractices: [
        "Lead with a provocative or counterintuitive insight",
        "Use personal experiences and case studies",
        "Include relevant data and statistics",
        "Reference other industry experts respectfully",
        "End with actionable recommendations",
        "Write 1,200-2,000 words for depth",
      ],
      examples: [
        {
          category: "Strong Opening",
          input: "AI is changing business",
          output:
            "While everyone debates whether AI will replace human workers, the real disruption is already happening in a place no one's looking: middle management.",
        },
      ],
      commonMistakes: [
        "Recycling common industry wisdom",
        "Making claims without supporting evidence",
        "Being too promotional about your company",
        "Not providing actionable insights",
      ],
    },

    presentation: {
      title: "Presentation Deck Guide",
      subtitle: "Visual Storytelling Framework",
      framework: "Story Arc",
      tips: [
        "Start with a compelling hook or problem statement",
        'Use the "Rule of 3" - group information in threes',
        "Include one key point per slide maximum",
        "Use visuals to support, not replace, your narrative",
        "End with a clear call-to-action",
      ],
      bestPractices: [
        "Slide count: 10-20 slides for 20-minute presentation",
        "Font size: 24pt minimum for readability",
        "Use high-contrast colors",
        "Include slide numbers and consistent branding",
        "Practice transitions between slides",
        "Prepare for Q&A with backup slides",
      ],
      examples: [
        {
          category: "Slide Title",
          input: "Our Results",
          output: "3X Revenue Growth: How We Exceeded Every Target",
        },
      ],
      commonMistakes: [
        "Too much text on slides",
        "Reading directly from slides",
        "Using low-quality or irrelevant images",
        "Not having a clear narrative flow",
      ],
    },
  };

  // Load content history
  useEffect(() => {
    loadContentHistory();
    loadTemplates();
  }, []);

  // Check for pending content briefs from Campaign Intelligence
  useEffect(() => {
    const pendingBrief = localStorage.getItem("pendingContentBrief");
    if (pendingBrief) {
      try {
        const briefData = JSON.parse(pendingBrief);
        // Pre-fill your form with briefData
        setCurrentType(briefData.type || "press-release");

        // Wait a bit for form refs to be ready
        setTimeout(() => {
          const currentFields = getFormFields(
            briefData.type || "press-release"
          );
          currentFields.forEach((field) => {
            if (
              field.key === "title" &&
              briefData.title &&
              contentFormRef.current[field.key]
            ) {
              contentFormRef.current[field.key].value = briefData.title;
            }
            if (
              field.key === "topic" &&
              briefData.brief &&
              contentFormRef.current[field.key]
            ) {
              contentFormRef.current[field.key].value = briefData.brief;
            }
            if (
              field.key === "announcement" &&
              briefData.brief &&
              contentFormRef.current[field.key]
            ) {
              contentFormRef.current[field.key].value = briefData.brief;
            }
            if (
              field.key === "headline" &&
              briefData.title &&
              contentFormRef.current[field.key]
            ) {
              contentFormRef.current[field.key].value = briefData.title;
            }
          });

          // Also fill AI assistant if available
          if (contentFormRef.current.assistantInput) {
            contentFormRef.current.assistantInput.value = `Create a ${briefData.type} for: ${briefData.brief}`;
          }
        }, 100);

        // Clear the localStorage
        localStorage.removeItem("pendingContentBrief");
      } catch (error) {
        console.error("Error loading content brief:", error);
      }
    }
  }, []);
  const loadContentHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const response = await getContentHistory();
      setSavedContents(response.data || response || []);
    } catch (error) {
      console.error("Error loading content history:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await getContentTemplates();
      setTemplates(response.data || response || []);
    } catch (error) {
      console.error("Error loading templates:", error);
    }
  };

  // Get form fields based on content type
  const getFormFields = (type) => {
    switch (type) {
      case "press-release":
        return [
          {
            key: "headline",
            label: "Press Release Headline",
            placeholder: "Company Announces Major Product Launch",
            required: true,
          },
          {
            key: "location",
            label: "Dateline Location",
            placeholder: "NEW YORK, NY",
          },
          {
            key: "announcement",
            label: "Main Announcement",
            placeholder: "What is the core news being announced?",
            type: "textarea",
            rows: 2,
            required: true,
          },
          {
            key: "metrics",
            label: "Key Metrics & Data",
            placeholder: "Include specific numbers, percentages, dates",
            type: "textarea",
            rows: 2,
          },
          {
            key: "quotes",
            label: "Executive Quotes",
            placeholder: "Quote from CEO/leadership",
            type: "textarea",
            rows: 3,
          },
          {
            key: "background",
            label: "Supporting Details",
            placeholder: "Additional context",
            type: "textarea",
            rows: 2,
          },
          {
            key: "timing",
            label: "Timeline & Next Steps",
            placeholder: "When will this take effect?",
          },
        ];
      // Add other content types...
      default:
        return [
          {
            key: "title",
            label: "Content Title",
            placeholder: "Enter content title",
            required: true,
          },
          {
            key: "topic",
            label: "Topic/Subject",
            placeholder: "What is this content about?",
            required: true,
          },
          {
            key: "messages",
            label: "Key Messages",
            placeholder: "Enter key messages...",
            type: "textarea",
            rows: 4,
          },
        ];
    }
  };
  // Generate content
  const generateContent = async () => {
    const formData = {};
    const currentFields = getFormFields(currentType);

    currentFields.forEach((field) => {
      formData[field.key] = contentFormRef.current[field.key]?.value || "";
    });

    // Validate required fields
    const requiredFields = currentFields.filter((field) => field.required);
    const missingFields = requiredFields.filter(
      (field) => !formData[field.key].trim()
    );

    if (missingFields.length > 0) {
      alert(
        `Please fill in required fields: ${missingFields
          .map((f) => f.label)
          .join(", ")}`
      );
      return;
    }

    setIsGenerating(true);
    setGenerationMethod("form");
    setContentAnalysis(null);
    setShowAnalysis(false);

    try {
      const response = await apiGenerateContent({
        type: currentType,
        formData,
        tone: selectedTone,
        toneDescription: toneOptions[selectedTone],
        projectId: selectedProject?.id,
        companyName: selectedProject?.name || user?.company || "the company",
        industry: selectedProject?.industry || "technology",
      });

      setGeneratedContent(response.content);
    } catch (error) {
      console.error("Content generation error:", error);
      alert("Failed to generate content. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };
  // Save generated content
  const saveGeneratedContent = async () => {
    if (!generatedContent) {
      alert("No content to save.");
      return;
    }

    try {
      const title =
        contentFormRef.current.headline?.value ||
        contentFormRef.current.title?.value ||
        "Generated Content";

      const response = await saveContent({
        title,
        type: currentType,
        content: generatedContent,
        projectId: selectedProject?.id,
        formData: getFormDataValues(),
      });

      alert("✅ Content saved successfully!");
      loadContentHistory();
    } catch (error) {
      console.error("Error saving content:", error);
      alert("Failed to save content. Please try again.");
    }
  };

  const getFormDataValues = () => {
    const formData = {};
    const currentFields = getFormFields(currentType);
    currentFields.forEach((field) => {
      formData[field.key] = contentFormRef.current[field.key]?.value || "";
    });
    return formData;
  };

  // AI Assistant prompt generation
  const generateWithAI = async () => {
    const assistantInput = contentFormRef.current.assistantInput?.value;
    if (!assistantInput) {
      alert("Please describe what content you need help creating.");
      return;
    }

    setIsGenerating(true);
    setGenerationMethod("ai");

    try {
      const requestData = {
        prompt: assistantInput,
        type: currentType,
        tone: selectedTone,
        toneDescription: toneOptions[selectedTone],
        projectId: selectedProject?.id,
        companyName: selectedProject?.name || user?.company || "the company",
        industry: selectedProject?.industry || "technology",
      };

      const response = await generateAIContent(requestData);

      // Handle orchestrated multi-content response
      if (response.deliveryTracking || response.components) {
        // Format multi-content response
        let formattedContent = '';

        if (response.message || response.acknowledgment) {
          formattedContent += `${response.message || response.acknowledgment}\n\n`;
        }

        if (response.deliveryTracking) {
          formattedContent += "**Generated Components:**\n\n";
          for (const [key, tracking] of Object.entries(response.deliveryTracking)) {
            const trackingData = tracking as any;
            if (trackingData.status === 'completed' && trackingData.content) {
              formattedContent += `### ${key.replace(/-/g, ' ').toUpperCase()}\n`;
              formattedContent += `${JSON.stringify(trackingData.content, null, 2)}\n\n`;
            }
          }
        }

        setGeneratedContent(formattedContent || response.content || response);
      } else {
        // Single content response
        const content = response.content || response.data?.content || response.message || response;
        setGeneratedContent(content);
      }

      contentFormRef.current.assistantInput.value = "";
      setContentAnalysis(null);
      setShowAnalysis(false);
    } catch (error) {
      console.error("AI Generation Error:", error);
      alert("Failed to generate content with AI. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  // NEW: Analyze content function
  const analyzeContent = async () => {
    if (!generatedContent) {
      alert("No content to analyze.");
      return;
    }
    if (!user || !user.id) {
      alert("Please log in to analyze content.");
      return;
    }

    setIsAnalyzing(true);

    try {
      const data = await apiAnalyzeContent({
        content: generatedContent,
        contentType: currentType,
        tone: selectedTone,
        toneDescription: toneOptions[selectedTone],
        targetAudience: selectedProject?.targetAudience || "general",
        user_id: user?.userId, // Changed to user_id with underscore
        context: {
          company: selectedProject?.name || user?.company,
          industry: selectedProject?.industry || "technology",
          projectId: selectedProject?.id,
          userId: user?.userId, // Also include it in context
        },
      });

      setContentAnalysis(data.analysis);
      setShowAnalysis(true);
    } catch (error) {
      console.error("Analysis error:", error);
      alert("Failed to analyze content. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };
  // Template management
  const handleTemplateUpload = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const formData = new FormData();

    for (let i = 0; i < files.length; i++) {
      formData.append("templates", files[i]);
    }
    formData.append("contentType", currentType);

    try {
      const response = await uploadTemplates(formData);

      alert(`✅ ${response.data.uploaded} template(s) uploaded successfully!`);
      loadTemplates();
    } catch (error) {
      console.error("Template upload error:", error);
      alert("Failed to upload templates. Please try again.");
    }

    if (templateUploadRef.current) {
      templateUploadRef.current.value = "";
    }
  };

  const deleteTemplate = async (templateId) => {
    if (!window.confirm("Are you sure you want to delete this template?")) {
      return;
    }

    try {
      await apiDeleteTemplate(templateId);
      setTemplates((prev) => prev.filter((t) => t.id !== templateId));
      if (selectedTemplate?.id === templateId) {
        setSelectedTemplate(null);
      }
    } catch (error) {
      console.error("Error deleting template:", error);
      alert("Failed to delete template.");
    }
  };

  // Export functionality
  const exportContent = async () => {
    try {
      const response = await apiExportContent({
        content: generatedContent,
        format: exportFormat,
        templateId: selectedTemplate?.id,
        type: currentType,
      });

      // Handle file download
      const blob = new Blob([response.content], {
        type: response.data.mimeType,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = response.data.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setShowExportModal(false);
      alert("✅ Content exported successfully!");
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export content.");
    }
  };

  const currentGuide = promptGuides[currentType];
  const currentFields = getFormFields(currentType);

  return (
    <div className="content-generator">
      <div className="content-generator-header">
        <h2>AI Content Generator</h2>
        <div className="header-info">
          <span>Powered by best-in-class frameworks</span>
          <span className="badge">🏆 Expert Model</span>
        </div>
      </div>

      <div className="content-container">
        <div className="main-content">
          {/* Content Type Selector */}
          <div className="form-group">
            <label>Content Type</label>
            <select
              ref={(el) => (contentFormRef.current.type = el)}
              value={currentType}
              onChange={(e) => {
                const newType = e.target.value;

                // Clear everything when content type changes
                setCurrentType(newType);
                setGeneratedContent("");
                setContentAnalysis(null);
                setShowAnalysis(false);
                setGenerationMethod(null);
                setShowGuides(false);

                // Clear form fields
                const currentFields = getFormFields(currentType);
                currentFields.forEach((field) => {
                  if (contentFormRef.current[field.key]) {
                    contentFormRef.current[field.key].value = "";
                  }
                });

                // Clear AI assistant input
                if (contentFormRef.current.assistantInput) {
                  contentFormRef.current.assistantInput.value = "";
                }
              }}
              className="form-control"
            >
              {Object.entries(contentTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Tone Selector - Add after Content Type Selector */}
          <div className="form-group">
            <label>Content Tone <span style={{ fontSize: '12px', color: '#666', fontWeight: 'normal' }}>(for AI and form generation)</span></label>
            <div className="tone-selector">
              <select
                value={selectedTone}
                onChange={(e) => setSelectedTone(e.target.value)}
                className="form-control"
              >
                {Object.entries(toneOptions).map(([value, config]) => (
                  <option key={value} value={value}>
                    {config.label}
                  </option>
                ))}
              </select>
              <div className="tone-description">
                <p>{toneOptions[selectedTone].description}</p>
                <div className="tone-characteristics">
                  {toneOptions[selectedTone].characteristics.map(
                    (char, idx) => (
                      <span key={idx} className="characteristic-tag">
                        {char}
                      </span>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
          {/* AI Writing Assistant */}
          <div className="ai-assistant-box">
            <div className="ai-header">
              <h3>Your AI Writing Partner</h3>
              <span className="badge">Smart Guidance</span>
            </div>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
              I'm your writing guide, not an interviewer. Tell me what you need and I'll create it directly. Or use the structured form below.
            </p>
            <textarea
              ref={(el) => (contentFormRef.current.assistantInput = el)}
              placeholder={`Example: "Write a press release about our new product launch" or "Help me announce our partnership with XYZ Corp"`}
              className="assistant-input"
              style={{ minHeight: '80px' }}
            />

            <button
              onClick={generateWithAI}
              disabled={isGenerating}
              className="btn btn-primary"
            >
              {isGenerating && generationMethod === "ai"
                ? "🤖 Writing..."
                : "✨ Create Content"}
            </button>
          </div>

          {/* Show note when content was generated via AI */}
          {generatedContent && generationMethod === "ai" && (
            <div className="ai-generated-note">
              <p>
                ✨ Content created with AI assistance. You can edit it directly in the output below, or ask me for specific changes like "make it more casual" or "add metrics about user growth".
              </p>
            </div>
          )}

          {/* Writing Guide & Form Fields - only show if not generated via AI assistant or if no content generated */}
          {(!generatedContent || generationMethod === "form") && (
            <>
              {/* Writing Guide */}
              <div className="writing-guide">
                <button
                  onClick={() => setShowGuides(!showGuides)}
                  className="guide-toggle"
                >
                  <div className="guide-button-content">
                    <Lightbulb size={16} />
                    <span>Writing Guide & Best Practices</span>
                    {currentGuide && (
                      <span className="framework-badge">
                        {currentGuide.framework}
                      </span>
                    )}
                  </div>
                  <div className="guide-toggle-icon">
                    {showGuides ? "▼" : "▶"}
                  </div>
                </button>

                {showGuides && currentGuide && (
                  <div className="guide-content">
                    <div className="guide-header">
                      <h4>{currentGuide.title}</h4>
                      <p className="guide-subtitle">{currentGuide.subtitle}</p>
                    </div>

                    <div className="guide-section">
                      <h5>Key Tips</h5>
                      <ul>
                        {currentGuide.tips.map((tip, index) => (
                          <li key={index}>{tip}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="guide-section">
                      <h5>Best Practices</h5>
                      <ul>
                        {currentGuide.bestPractices.map((practice, index) => (
                          <li key={index}>{practice}</li>
                        ))}
                      </ul>
                    </div>

                    {currentGuide.examples && (
                      <div className="guide-section">
                        <h5>Examples</h5>
                        {currentGuide.examples.map((example, index) => (
                          <div key={index} className="example-item">
                            <strong>{example.category}:</strong>
                            <div className="example-before">
                              Before: {example.input}
                            </div>
                            <div className="example-after">
                              After: {example.output}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {currentGuide.commonMistakes && (
                      <div className="guide-section">
                        <h5>Common Mistakes to Avoid</h5>
                        <ul>
                          {currentGuide.commonMistakes.map((mistake, index) => (
                            <li key={index}>{mistake}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {/* Form Fields */}
              <div className="form-fields">
                <h3>{contentTypeLabels[currentType]} Details</h3>
                {currentFields.map((field) => (
                  <div key={field.key} className="form-group">
                    <label>
                      {field.label}
                      {field.required && <span className="required">*</span>}
                    </label>
                    {field.type === "textarea" ? (
                      <textarea
                        ref={(el) => (contentFormRef.current[field.key] = el)}
                        placeholder={field.placeholder}
                        rows={field.rows || 3}
                        className="form-control"
                      />
                    ) : (
                      <input
                        ref={(el) => (contentFormRef.current[field.key] = el)}
                        type="text"
                        placeholder={field.placeholder}
                        className="form-control"
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="action-buttons">
                <button
                  onClick={generateContent}
                  disabled={isGenerating}
                  className="btn btn-primary"
                >
                  {isGenerating
                    ? "⏳ Generating..."
                    : "✨ Generate with Best Practices"}
                </button>
                <button
                  onClick={() => {
                    currentFields.forEach((field) => {
                      if (contentFormRef.current[field.key]) {
                        contentFormRef.current[field.key].value = "";
                      }
                    });
                    setGeneratedContent("");
                    setContentAnalysis(null);
                    setShowAnalysis(false);
                    setGenerationMethod(null);
                  }}
                  className="btn btn-secondary"
                  disabled={isGenerating}
                >
                  Clear Form
                </button>
              </div>
            </>
          )}

          {/* Generated Content */}
          {generatedContent && (
            <div className="generated-content">
              <div className="content-header">
                <h4>Generated Content</h4>
                <div className="content-badges">
                  <span className="badge success">
                    ✅ Best Practice Applied
                  </span>
                  {currentGuide && (
                    <span className="badge">{currentGuide.framework}</span>
                  )}
                  <span className="badge tone-badge">
                    🎯 {toneOptions[selectedTone].label}
                  </span>
                </div>
              </div>
              <div className="content-display">{generatedContent}</div>

              <div className="content-actions">
                <SaveToMemoryVaultButton
                  content={generatedContent}
                  title={`${
                    contentTypeLabels[currentType]
                  } - ${new Date().toLocaleDateString()}`}
                  type="content"
                  source="content-generator"
                  folder_type="content"
                  tags={[currentType, selectedTone, "generated"]}
                  metadata={{
                    generated_at: new Date().toISOString(),
                    project_id: selectedProject?.id,
                    content_type: currentType,
                    tone: selectedTone,
                  }}
                />

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedContent);
                    alert("✅ Content copied to clipboard!");
                  }}
                  className="btn btn-secondary"
                >
                  <Copy /> Copy
                </button>
                <button
                  onClick={() => setShowExportModal(true)}
                  className="btn btn-secondary"
                >
                  <Download /> Export
                </button>

                {/* Analytics Button */}
                <button
                  onClick={analyzeContent}
                  disabled={isAnalyzing}
                  className="btn btn-analytics"
                  style={{
                    background:
                      "linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)",
                    color: "white",
                  }}
                >
                  {isAnalyzing ? (
                    <>
                      <BarChart3 className="spinning" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <BarChart3 />
                      Analyze Performance
                    </>
                  )}
                </button>
              </div>

              {/* Analysis Results */}
              {showAnalysis && contentAnalysis && (
                <div className="analysis-results">
                  <div className="analysis-header">
                    <h4>Content Performance Analysis</h4>
                    <div className="overall-score">
                      <BarChart3 />
                      <span>Overall Score: </span>
                      <strong
                        style={{
                          color: getScoreColor(contentAnalysis.overallScore),
                        }}
                      >
                        {contentAnalysis.overallScore}%
                      </strong>
                    </div>
                  </div>

                  {/* Add Tone Alignment Score */}
                  {contentAnalysis.toneAlignment && (
                    <div className="tone-alignment-card">
                      <div className="tone-alignment-header">
                        <Zap />
                        <h4>
                          Tone Alignment: {toneOptions[selectedTone].label}
                        </h4>
                        <span
                          className="alignment-score"
                          style={{
                            color: getScoreColor(
                              contentAnalysis.toneAlignment.score
                            ),
                          }}
                        >
                          {contentAnalysis.toneAlignment.score}%
                        </span>
                      </div>
                      <p className="alignment-feedback">
                        {contentAnalysis.toneAlignment.feedback}
                      </p>
                    </div>
                  )}

                  {/* Score Breakdown */}
                  <div className="metrics-grid">
                    {Object.entries(contentAnalysis.scores || {}).map(
                      ([key, score]) => (
                        <div key={key} className="score-item">
                          <div className="score-header">
                            <span className="score-label">
                              {key
                                .replace(/([A-Z])/g, " $1")
                                .replace(/^./, (str) => str.toUpperCase())}
                            </span>
                            <span
                              className="score-value"
                              style={{ color: getScoreColor(score) }}
                            >
                              {score}%
                            </span>
                          </div>
                          <div className="score-bar">
                            <div
                              className="score-fill"
                              style={{
                                width: `${score}%`,
                                backgroundColor: getScoreColor(score),
                              }}
                            />
                          </div>
                        </div>
                      )
                    )}
                  </div>

                  {/* Key Insights */}
                  <div className="insights-grid">
                    <div className="insight-card strengths">
                      <div className="insight-header">
                        <CheckCircle />
                        <h4>Strengths</h4>
                      </div>
                      <ul>
                        {(contentAnalysis.insights?.strengths || []).map(
                          (strength, index) => (
                            <li key={index}>{strength}</li>
                          )
                        )}
                      </ul>
                    </div>

                    <div className="insight-card improvements">
                      <div className="insight-header">
                        <Lightbulb />
                        <h4>Improvements</h4>
                      </div>
                      <ul>
                        {(contentAnalysis.insights?.improvements || []).map(
                          (improvement, index) => (
                            <li key={index}>{improvement}</li>
                          )
                        )}
                      </ul>
                    </div>

                    <div className="insight-card risks">
                      <div className="insight-header">
                        <AlertTriangle />
                        <h4>Risk Factors</h4>
                      </div>
                      <ul>
                        {(contentAnalysis.insights?.risks || []).map(
                          (risk, index) => (
                            <li key={index}>{risk}</li>
                          )
                        )}
                      </ul>
                    </div>
                  </div>

                  {/* Performance Predictions */}
                  {contentAnalysis.predictions && (
                    <div className="predictions-section">
                      <h4>Performance Predictions</h4>
                      <div className="prediction-items">
                        <div className="prediction-item">
                          <strong>Media Pickup:</strong>{" "}
                          {contentAnalysis.predictions.mediaPickup}
                        </div>
                        <div className="prediction-item">
                          <strong>Social Engagement:</strong>{" "}
                          {contentAnalysis.predictions.socialEngagement}
                        </div>
                        <div className="prediction-item">
                          <strong>Investor Interest:</strong>{" "}
                          {contentAnalysis.predictions.investorInterest}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar - Content History */}
        <div className="content-sidebar">
          <h3>Content History</h3>
          {isLoadingHistory ? (
            <div className="loading">Loading...</div>
          ) : savedContents.length === 0 ? (
            <div className="empty-state">No saved content yet</div>
          ) : (
            <div className="content-list">
              {savedContents.map((content) => (
                <div key={content.id} className="content-item">
                  <h4>{content.title}</h4>
                  <span className="content-type">
                    {contentTypeLabels[content.type]}
                  </span>
                  <span className="content-date">
                    {new Date(content.created_at).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => {
                      setGeneratedContent(content.content);
                      setCurrentType(content.type);
                    }}
                    className="btn-small"
                  >
                    Load
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Template Manager Modal */}
      {showTemplateManager && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Template Manager</h2>
              <button onClick={() => setShowTemplateManager(false)}>
                <X />
              </button>
            </div>
            <div className="modal-body">
              <div className="template-upload">
                <input
                  ref={templateUploadRef}
                  type="file"
                  multiple
                  accept=".docx,.pptx,.html,.txt"
                  onChange={handleTemplateUpload}
                  style={{ display: "none" }}
                />
                <button
                  onClick={() => templateUploadRef.current?.click()}
                  className="btn btn-primary"
                >
                  <Upload /> Upload Templates
                </button>
              </div>

              <div className="template-list">
                {templates.map((template) => (
                  <div key={template.id} className="template-item">
                    <FileText />
                    <div className="template-info">
                      <h4>{template.name}</h4>
                      <span>{template.content_type || "Universal"}</span>
                    </div>
                    <button onClick={() => deleteTemplate(template.id)}>
                      <X />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Export Content</h3>
              <button onClick={() => setShowExportModal(false)}>
                <X />
              </button>
            </div>
            <div className="modal-body">
              <div className="export-formats">
                {["google-docs", "word", "pdf", "powerpoint"].map((format) => (
                  <button
                    key={format}
                    onClick={() => {
                      setExportFormat(format);
                      exportContent();
                    }}
                    className="export-option"
                  >
                    {format.replace("-", " ").toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentGenerator;
