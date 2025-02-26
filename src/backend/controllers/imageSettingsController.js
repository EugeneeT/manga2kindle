// src/backend/controllers/imageSettingsController.js
import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";

const createImageSettingsController = (imageSettingsService) => {
  const router = Router();

  router.get("/", async (req, res) => {
    try {
      console.log("GET /api/image-settings request received");
      const settings = await imageSettingsService.getSettings();
      console.log("Image settings retrieved successfully");
      res.json(settings);
    } catch (error) {
      console.error("Error in GET /api/image-settings:", error);
      res.status(500).json({
        error: error.message,
        details: "Failed to retrieve image settings",
      });
    }
  });

  router.post("/", async (req, res) => {
    try {
      console.log("POST /api/image-settings request received");
      const updatedSettings = await imageSettingsService.updateSettings(
        req.body
      );
      console.log("Image settings updated successfully");
      res.json({ success: true, settings: updatedSettings });
    } catch (error) {
      console.error("Error in POST /api/image-settings:", error);
      res.status(500).json({
        success: false,
        error: error.message,
        details: "Failed to update image settings",
      });
    }
  });

  router.post(
    "/presets",
    async (req, res) => {
      try {
        console.log("POST /api/image-settings/presets request received");
        const { name, settings } = req.body;

        if (!name || !settings) {
          return res.status(400).json({
            success: false,
            error: "Preset name and settings are required",
          });
        }

        const updatedSettings = await imageSettingsService.createPreset(
          name,
          settings
        );
        console.log(`Preset "${name}" created successfully`);
        res.json({ success: true, settings: updatedSettings });
      } catch (error) {
        console.error("Error in POST /api/image-settings/presets:", error);
        res.status(500).json({
          success: false,
          error: error.message,
          details: "Failed to create preset",
        });
      }
    }
  );

  router.delete(
    "/presets/:name",
    async (req, res) => {
      try {
        const presetName = req.params.name;
        console.log(
          `DELETE /api/image-settings/presets/${presetName} request received`
        );

        const updatedSettings = await imageSettingsService.deletePreset(
          presetName
        );
        console.log(`Preset "${presetName}" deleted successfully`);
        res.json({ success: true, settings: updatedSettings });
      } catch (error) {
        console.error("Error in DELETE /api/image-settings/presets:", error);
        res.status(500).json({
          success: false,
          error: error.message,
          details: "Failed to delete preset",
        });
      }
    }
  );

  router.post(
    "/active-preset",
    async (req, res) => {
      try {
        const { preset } = req.body;
        console.log(
          `POST /api/image-settings/active-preset request received: ${preset}`
        );

        if (!preset) {
          return res.status(400).json({
            success: false,
            error: "Preset name is required",
          });
        }

        const updatedSettings = await imageSettingsService.updateSettings({
          activePreset: preset,
        });
        console.log(`Active preset set to "${preset}" successfully`);
        res.json({ success: true, settings: updatedSettings });
      } catch (error) {
        console.error(
          "Error in POST /api/image-settings/active-preset:",
          error
        );
        res.status(500).json({
          success: false,
          error: error.message,
          details: "Failed to set active preset",
        });
      }
    }
  );

  return router;
};

export default createImageSettingsController;
