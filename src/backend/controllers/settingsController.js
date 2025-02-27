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

      // Determine what type of settings update this is
      const isEmailSettingsUpdate =
        req.body.smtpUser !== undefined ||
        req.body.smtpPass !== undefined ||
        req.body.kindleEmail !== undefined;

      // Update settings in the database/file
      const updatedSettings = await settingsService.updateSettings(req.body);

      // Only validate email configuration if email settings are being updated
      if (isEmailSettingsUpdate) {
        console.log("Email settings changed, validating configuration...");

        // Check if all required email settings are provided together
        const allEmailFieldsPresent =
          updatedSettings.smtpUser &&
          updatedSettings.smtpPass &&
          updatedSettings.kindleEmail;

        // Only try to validate if all fields are present
        if (allEmailFieldsPresent) {
          try {
            await kindleService.validateConfiguration({
              smtpUser: updatedSettings.smtpUser,
              smtpPass: updatedSettings.smtpPass,
              kindleEmail: updatedSettings.kindleEmail,
            });
            console.log("Kindle service configuration validated");
          } catch (kindleError) {
            console.error("Kindle service validation failed:", kindleError);
            // Continue without failing - we'll validate when sending
            console.log("Continuing with partial email settings update");
          }
        } else {
          console.log("Partial email settings update - will validate on send");
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
