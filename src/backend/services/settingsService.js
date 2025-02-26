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
    smtpUser: process.env.SMTP_USER || "",
    smtpPass: process.env.SMTP_PASS || "",
    kindleEmail: process.env.KINDLE_EMAIL || "",
    lastUpdated: new Date().toISOString(),
  };

  console.log("Default settings:", {
    ...defaultSettings,
    smtpPass: defaultSettings.smtpPass ? "***" : "",
  });

  const ensureSettingsFile = async () => {
    try {
      console.log("Checking if settings directory exists...");
      await fs.mkdir(path.dirname(settingsPath), { recursive: true });
      console.log("Settings directory ensured");

      console.log("Checking if settings file exists...");
      const fileExists = await fs
        .access(settingsPath)
        .then(() => true)
        .catch(() => false);

      if (fileExists) {
        console.log("Settings file exists, reading content...");
        try {
          const fileContent = await fs.readFile(settingsPath, "utf8");
          console.log("File content read successfully");

          const currentSettings = JSON.parse(fileContent);
          console.log("Current settings:", {
            ...currentSettings,
            smtpPass: currentSettings.smtpPass ? "***" : "",
          });

          // Merge with default settings
          const mergedSettings = {
            ...defaultSettings,
            ...currentSettings,
          };

          console.log("Writing merged settings...");
          await fs.writeFile(
            settingsPath,
            JSON.stringify(mergedSettings, null, 2)
          );
          console.log("Settings file updated successfully");
          return mergedSettings;
        } catch (parseError) {
          console.error("Error parsing settings file:", parseError);
          console.log("Creating new settings file with defaults...");
          await fs.writeFile(
            settingsPath,
            JSON.stringify(defaultSettings, null, 2)
          );
          console.log("New settings file created successfully");
          return defaultSettings;
        }
      } else {
        console.log("Settings file doesn't exist, creating new one...");
        await fs.writeFile(
          settingsPath,
          JSON.stringify(defaultSettings, null, 2)
        );
        console.log("New settings file created successfully");
        return defaultSettings;
      }
    } catch (error) {
      console.error("Error in ensureSettingsFile:", error);
      throw new Error(`Failed to initialize settings: ${error.message}`);
    }
  };

  const getSettings = async () => {
    console.log("Getting settings...");
    try {
      const settings = await ensureSettingsFile();
      console.log("Retrieved settings:", {
        ...settings,
        smtpPass: settings.smtpPass ? "***" : "",
      });
      return settings;
    } catch (error) {
      console.error("Error in getSettings:", error);
      return defaultSettings;
    }
  };

  const updateSettings = async (newSettings) => {
    console.log("Updating settings...", {
      ...newSettings,
      smtpPass: newSettings.smtpPass ? "***" : "",
    });

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

      console.log("Writing updated settings...");
      await fs.writeFile(
        settingsPath,
        JSON.stringify(updatedSettings, null, 2)
      );
      console.log("Settings updated successfully");
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
