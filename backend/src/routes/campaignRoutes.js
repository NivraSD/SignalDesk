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
