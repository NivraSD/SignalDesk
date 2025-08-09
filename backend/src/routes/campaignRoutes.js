// campaignRoutes.js - Updated routes for enhanced Campaign Intelligence
const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const campaignIntelligenceController = require("../controllers/campaignIntelligenceController");
const {
  generateMarketAnalysis,
  generateCampaignConcept,
  generateFromConcept,
  saveCampaign,
  getCampaigns,
  updateCampaign,
  deleteCampaign,
  generateStrategicReport,
  saveStrategicReport,
  getStrategicReports,
} = require("../controllers/campaignIntelligenceController");

// Apply auth middleware to all routes
router.use(authMiddleware);

// Campaign generation endpoints
router.post("/generate-market-analysis", generateMarketAnalysis);
router.post("/generate-campaign-concept", generateCampaignConcept);
router.post("/generate-from-concept", generateFromConcept);

// Campaign Analysis endpoint - FIXED VERSION
router.post("/analyze", async (req, res) => {
  console.log("📊 Campaign analysis request:", req.body);
  
  const mockStrategy = {
    executiveSummary: "Comprehensive campaign strategy focused on maximizing reach and engagement",
    objectives: [
      "Increase brand awareness by 40%",
      "Generate 500 qualified leads",
      "Achieve 25% engagement rate on social media"
    ],
    targetAudience: {
      primary: "Decision makers in technology companies",
      secondary: "Industry influencers and thought leaders",
      demographics: "25-45 years old, college-educated, urban/suburban"
    },
    channels: ["LinkedIn", "Email marketing", "Trade publications", "Webinars"],
    timeline: "12 weeks",
    budget: "$50,000 - $75,000",
    metrics: ["Reach and impressions", "Engagement rate", "Lead quality", "ROI"]
  };
  
  res.json({
    success: true,
    report: mockStrategy,
    generated: new Date().toISOString()
  });
});

// Campaign CRUD operations
router.get("/", getCampaigns);
router.post("/", saveCampaign);
router.put("/:id", updateCampaign);
router.delete("/:id", deleteCampaign);

router.post(
  "/generate-strategic-report",
  authMiddleware,
  campaignIntelligenceController.generateStrategicReportSimple
);
router.post("/save-strategic-report", authMiddleware, saveStrategicReport);
router.get("/strategic-reports", authMiddleware, getStrategicReports);
router.post(
  "/expand-report",
  authMiddleware,
  campaignIntelligenceController.expandReport
);

module.exports = router;
