// src/backend/services/settingsService.js
import fs from "fs/promises";
import path from "path";

const createSettingsService = () => {
  const settingsPath = path.join(
    process.env.DATA_DIR || "./data",
    "settings.json"
  );

  console.log("Settings file path:", settingsPath);

  // Load initial values from environment variables
  const defaultSettings = {
    checkInterval: parseInt(process.env.CHECK_INTERVAL) || 30,
    smtpHost: process.env.SMTP_HOST || "smtp.gmail.com",
    smtpPort: parseInt(process.env.SMTP_PORT) || 587,
    smtpUser: process.env.SMTP_USER || `your_email_address@email.com`,
    smtpPass: process.env.SMTP_PASS || `your_app_password`,
    kindleEmail: process.env.KINDLE_EMAIL || `your_kindle_email@kindle.com`,
    lastUpdated: new Date().toISOString(),
  };

  // More concise logging in settingsService.js
  const ensureSettingsFile = async () => {
    try {
      await fs.mkdir(path.dirname(settingsPath), { recursive: true });

      const fileExists = await fs
        .access(settingsPath)
        .then(() => true)
        .catch(() => false);

      if (fileExists) {
        try {
          const fileContent = await fs.readFile(settingsPath, "utf8");
          const currentSettings = JSON.parse(fileContent);

          console.log("Using existing settings file");

          // Merge with default settings
          const mergedSettings = {
            ...defaultSettings,
            ...currentSettings,
          };

          await fs.writeFile(
            settingsPath,
            JSON.stringify(mergedSettings, null, 2)
          );
          return mergedSettings;
        } catch (parseError) {
          console.error("Error parsing settings file:", parseError.message);
          await fs.writeFile(
            settingsPath,
            JSON.stringify(defaultSettings, null, 2)
          );
          return defaultSettings;
        }
      } else {
        console.log("Creating new settings file");
        await fs.writeFile(
          settingsPath,
          JSON.stringify(defaultSettings, null, 2)
        );
        return defaultSettings;
      }
    } catch (error) {
      console.error("Error in ensureSettingsFile:", error.message);
      throw new Error(`Failed to initialize settings: ${error.message}`);
    }
  };

  const getSettings = async () => {
    try {
      const settings = await ensureSettingsFile();
      return settings;
    } catch (error) {
      console.error("Error in getSettings:", error);
      return defaultSettings;
    }
  };

  const updateSettings = async (newSettings) => {
    try {
      const currentSettings = await getSettings();

      // Validate new settings
      if (newSettings.checkInterval) {
        newSettings.checkInterval = parseInt(newSettings.checkInterval);
        if (isNaN(newSettings.checkInterval) || newSettings.checkInterval < 1) {
          throw new Error("Invalid check interval");
        }
      }

      if (newSettings.kindleEmail && !newSettings.kindleEmail.includes("@")) {
        throw new Error("Invalid Kindle email address");
      }

      const updatedSettings = {
        ...currentSettings,
        ...newSettings,
        lastUpdated: new Date().toISOString(),
      };

      await fs.writeFile(
        settingsPath,
        JSON.stringify(updatedSettings, null, 2)
      );
      console.log("Updated settings with:", {
        ...newSettings,
        smtpPass: newSettings.smtpPass ? "***" : "",
      });
      return updatedSettings;
    } catch (error) {
      console.error("Error in updateSettings:", error);
      throw new Error(`Failed to save settings: ${error.message}`);
    }
  };

  return {
    getSettings,
    updateSettings,
    ensureSettingsFile,
  };
};

export default createSettingsService;
