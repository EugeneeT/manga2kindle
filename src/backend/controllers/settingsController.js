// src/backend/controllers/settingsController.js
import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";

const createSettingsController = (settingsService, kindleService) => {
  const router = Router();

  router.get("/", async (req, res) => {
    try {
      console.log("GET /api/settings request received");
      const settings = await settingsService.getSettings();
      console.log("Settings retrieved successfully");
      res.json(settings);
    } catch (error) {
      console.error("Error in GET /api/settings:", error);
      res.status(500).json({
        error: error.message,
        details: "Failed to retrieve settings",
      });
    }
  });

  router.post("/", async (req, res) => {
    try {
      console.log("POST /api/settings request received");
      const updatedSettings = await settingsService.updateSettings(req.body);

      // Reinitialize kindle service if email settings changed
      if (req.body.smtpUser || req.body.smtpPass || req.body.kindleEmail) {
        console.log("Email settings changed, validating configuration...");
        try {
          await kindleService.validateConfiguration({
            smtpUser: updatedSettings.smtpUser,
            smtpPass: updatedSettings.smtpPass,
            kindleEmail: updatedSettings.kindleEmail,
          });
          console.log("Kindle service configuration validated");
        } catch (kindleError) {
          console.error("Kindle service validation failed:", kindleError);
          throw new Error(`Invalid email settings: ${kindleError.message}`);
        }
      }

      console.log("Settings updated successfully");
      res.json({ success: true, settings: updatedSettings });
    } catch (error) {
      console.error("Error in POST /api/settings:", error);
      res.status(500).json({
        success: false,
        error: error.message,
        details: "Failed to update settings",
      });
    }
  });

  return router;
};

export default createSettingsController;
