// src/backend/services/imageSettingsService.js
import fs from "fs/promises";
import path from "path";

const createImageSettingsService = () => {
  const settingsPath = path.join(
    process.env.DATA_DIR || "./data",
    "image-settings.json"
  );

  console.log("Image settings file path:", settingsPath);

  // Default image settings presets
  const defaultSettings = {
    activePreset: "standard",
    presets: {
      standard: {
        resize: {
          width: 1600,
          height: 2400,
          enabled: true,
        },
        colorspaceConversion: true,
        level: {
          blackPoint: 5,
          whitePoint: 90,
          gamma: 1.2,
          enabled: true,
        },
        contrast: {
          enabled: true,
        },
        sharpen: {
          radius: 0,
          sigma: 0.5,
          enabled: true,
        },
        quality: 100,
      },
      highContrast: {
        resize: {
          width: 1200,
          height: 1800,
          enabled: true,
        },
        colorspaceConversion: true,
        level: {
          blackPoint: 10,
          whitePoint: 90,
          gamma: 1.6,
          enabled: true,
        },
        contrastStretch: {
          black: 5,
          white: 1,
          enabled: true,
        },
        brightnessContrast: {
          brightness: 0,
          contrast: 25,
          enabled: true,
        },
        blackThreshold: {
          threshold: 25,
          enabled: true,
        },
        sharpen: {
          radius: 0,
          sigma: 0.8,
          enabled: true,
        },
        quality: 90,
      },
      lowContrast: {
        resize: {
          width: 1600,
          height: 2400,
          enabled: true,
        },
        colorspaceConversion: true,
        level: {
          blackPoint: 3,
          whitePoint: 85,
          gamma: 1.0,
          enabled: true,
        },
        contrast: {
          enabled: false,
        },
        sharpen: {
          radius: 0,
          sigma: 0.3,
          enabled: true,
        },
        quality: 100,
      },
    },
    lastUpdated: new Date().toISOString(),
  };

  const ensureSettingsFile = async () => {
    try {
      console.log("Checking if image settings directory exists...");
      await fs.mkdir(path.dirname(settingsPath), { recursive: true });
      console.log("Image settings directory ensured");

      console.log("Checking if image settings file exists...");
      const fileExists = await fs
        .access(settingsPath)
        .then(() => true)
        .catch(() => false);

      if (fileExists) {
        console.log("Image settings file exists, reading content...");
        try {
          const fileContent = await fs.readFile(settingsPath, "utf8");
          console.log("File content read successfully");

          const currentSettings = JSON.parse(fileContent);
          console.log("Current image settings loaded");

          // Ensure all presets have required fields
          const mergedSettings = {
            ...defaultSettings,
            ...currentSettings,
            presets: {
              ...defaultSettings.presets,
              ...currentSettings.presets,
            },
          };

          console.log("Writing merged image settings...");
          await fs.writeFile(
            settingsPath,
            JSON.stringify(mergedSettings, null, 2)
          );
          console.log("Image settings file updated successfully");
          return mergedSettings;
        } catch (parseError) {
          console.error("Error parsing image settings file:", parseError);
          console.log("Creating new image settings file with defaults...");
          await fs.writeFile(
            settingsPath,
            JSON.stringify(defaultSettings, null, 2)
          );
          console.log("New image settings file created successfully");
          return defaultSettings;
        }
      } else {
        console.log("Image settings file doesn't exist, creating new one...");
        await fs.writeFile(
          settingsPath,
          JSON.stringify(defaultSettings, null, 2)
        );
        console.log("New image settings file created successfully");
        return defaultSettings;
      }
    } catch (error) {
      console.error("Error in ensureImageSettingsFile:", error);
      throw new Error(`Failed to initialize image settings: ${error.message}`);
    }
  };

  const getSettings = async () => {
    console.log("Getting image settings...");
    try {
      const settings = await ensureSettingsFile();
      console.log("Retrieved image settings");
      return settings;
    } catch (error) {
      console.error("Error in getImageSettings:", error);
      return defaultSettings;
    }
  };

  const getActivePreset = async () => {
    const settings = await getSettings();
    const activePresetName = settings.activePreset || "standard";
    return (
      settings.presets[activePresetName] || defaultSettings.presets.standard
    );
  };

  const updateSettings = async (newSettings) => {
    console.log("Updating image settings...");

    try {
      const currentSettings = await getSettings();

      // Validate presets
      if (newSettings.presets) {
        for (const presetName in newSettings.presets) {
          const preset = newSettings.presets[presetName];

          // Basic validation
          if (
            preset.resize?.width &&
            (isNaN(preset.resize.width) || preset.resize.width < 1)
          ) {
            throw new Error(`Invalid width in preset ${presetName}`);
          }

          if (
            preset.resize?.height &&
            (isNaN(preset.resize.height) || preset.resize.height < 1)
          ) {
            throw new Error(`Invalid height in preset ${presetName}`);
          }

          if (
            preset.quality &&
            (isNaN(preset.quality) ||
              preset.quality < 1 ||
              preset.quality > 100)
          ) {
            throw new Error(`Invalid quality value in preset ${presetName}`);
          }
        }
      }

      // Make sure activePreset exists in presets
      if (
        newSettings.activePreset &&
        (!newSettings.presets || !newSettings.presets[newSettings.activePreset])
      ) {
        if (!currentSettings.presets[newSettings.activePreset]) {
          throw new Error(
            `Active preset "${newSettings.activePreset}" does not exist`
          );
        }
      }

      // Properly handle preset replacement if presets are being updated
      // This allows for deletion of presets
      let updatedPresets;
      if (newSettings.replaceAllPresets) {
        // Complete replacement of all presets
        updatedPresets = newSettings.presets || {};
        delete newSettings.replaceAllPresets;
      } else {
        // Normal merging behavior
        updatedPresets = {
          ...currentSettings.presets,
          ...(newSettings.presets || {}),
        };
      }

      const updatedSettings = {
        ...currentSettings,
        ...newSettings,
        presets: updatedPresets,
        lastUpdated: new Date().toISOString(),
      };

      console.log("Writing updated image settings...");
      await fs.writeFile(
        settingsPath,
        JSON.stringify(updatedSettings, null, 2)
      );
      console.log("Image settings updated successfully");
      return updatedSettings;
    } catch (error) {
      console.error("Error in updateImageSettings:", error);
      throw new Error(`Failed to save image settings: ${error.message}`);
    }
  };

  const createPreset = async (presetName, presetSettings) => {
    if (!presetName || typeof presetName !== "string") {
      throw new Error("Preset name is required");
    }

    const currentSettings = await getSettings();

    if (currentSettings.presets[presetName]) {
      throw new Error(`Preset "${presetName}" already exists`);
    }

    return updateSettings({
      presets: {
        [presetName]: presetSettings,
      },
    });
  };

  const deletePreset = async (presetName) => {
    const currentSettings = await getSettings();

    if (!currentSettings.presets[presetName]) {
      throw new Error(`Preset "${presetName}" does not exist`);
    }

    // Prevent deleting the active preset
    if (currentSettings.activePreset === presetName) {
      throw new Error(`Cannot delete the active preset "${presetName}"`);
    }

    // Make a copy and delete the preset
    const updatedPresets = { ...currentSettings.presets };
    delete updatedPresets[presetName];

    // Use the new approach to completely replace presets
    return updateSettings({
      presets: updatedPresets,
      replaceAllPresets: true, // This flag tells updateSettings to replace all presets
    });
  };

  return {
    getSettings,
    getActivePreset,
    updateSettings,
    createPreset,
    deletePreset,
    ensureSettingsFile,
  };
};

export default createImageSettingsService;
