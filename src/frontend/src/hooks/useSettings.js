// hooks/useSettings.js
import { useState, useEffect, useCallback } from "react";

/**
 * Default configuration values
 */
const DEFAULT_CHECK_INTERVAL = 30;
const DEFAULT_CONFIG = {
  checkInterval: DEFAULT_CHECK_INTERVAL,
  smtpHost: "smtp.gmail.com",
  smtpPort: 587,
  smtpUser: "",
  smtpPass: "",
  kindleEmail: "",
};

/**
 * Hook to manage application settings
 * @param {boolean} isAuthenticated - Whether the user is authenticated
 * @returns {Object} Settings state and methods
 */
export const useSettings = (isAuthenticated) => {
  // UI state for settings management
  const [settingsState, setSettingsState] = useState({
    showSettings: false,
    showPassword: false,
    settingsChanged: false,
    isEditingInterval: false,
    error: null,
    isLoading: false,
  });

  // Actual configuration
  const [config, setConfig] = useState(DEFAULT_CONFIG);

  // Temporary configuration used for editing
  const [tempConfig, setTempConfig] = useState(DEFAULT_CONFIG);

  // Local interval value as string for input
  const [localInterval, setLocalInterval] = useState(
    DEFAULT_CHECK_INTERVAL.toString()
  );

  /**
   * Normalizes settings from the API
   * @param {Object} settings - Settings from API
   * @returns {Object} Normalized settings
   */
  const normalizeSettings = useCallback((settings) => {
    return {
      ...settings,
      checkInterval: parseInt(settings.checkInterval) || DEFAULT_CHECK_INTERVAL,
    };
  }, []);

  /**
   * Get the auth header for API requests
   * @returns {Object} Headers with auth token
   */
  const getAuthHeaders = useCallback(() => {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    };
  }, []);

  /**
   * Load settings from the server
   */
  const loadInitialData = useCallback(async () => {
    if (!isAuthenticated) return;

    setSettingsState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch("/api/settings", {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to load settings");
      }

      const settings = await response.json();
      const normalizedSettings = normalizeSettings(settings);

      setConfig(normalizedSettings);
      setTempConfig(normalizedSettings);
      setLocalInterval(normalizedSettings.checkInterval.toString());

      setSettingsState((prev) => ({
        ...prev,
        isLoading: false,
        settingsChanged: false,
      }));

      return normalizedSettings;
    } catch (error) {
      console.error("Error loading settings:", error);
      setSettingsState((prev) => ({
        ...prev,
        isLoading: false,
        error: error.message,
      }));
      return null;
    }
  }, [isAuthenticated, getAuthHeaders, normalizeSettings]);

  /**
   * Handle changes to temporary configuration
   * @param {string} field - Field name to update
   * @param {any} value - New value
   */
  const handleTempConfigChange = useCallback((field, value) => {
    setTempConfig((prev) => ({ ...prev, [field]: value }));
    setSettingsState((prev) => ({ ...prev, settingsChanged: true }));
  }, []);

  /**
   * Save settings to the server
   * @returns {Promise<boolean>} Success status
   */
  const handleSettingsSave = useCallback(async () => {
    setSettingsState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Prepare config with parsed interval
      const updatedConfig = {
        ...tempConfig,
        checkInterval: parseInt(localInterval) || DEFAULT_CHECK_INTERVAL,
      };

      const response = await fetch("/api/settings", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(updatedConfig),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save settings");
      }

      // Update state with new settings
      const { settings } = data;
      if (!settings) {
        throw new Error("No settings returned from server");
      }

      const normalizedSettings = normalizeSettings(settings);

      setConfig(normalizedSettings);
      setTempConfig(normalizedSettings);
      setLocalInterval(normalizedSettings.checkInterval.toString());

      setSettingsState((prev) => ({
        ...prev,
        isLoading: false,
        settingsChanged: false,
        error: null,
      }));

      return true;
    } catch (error) {
      console.error("Error saving settings:", error);
      setSettingsState((prev) => ({
        ...prev,
        isLoading: false,
        error: error.message,
      }));
      return false;
    }
  }, [tempConfig, localInterval, getAuthHeaders, normalizeSettings]);

  /**
   * Save only the interval setting to the server
   * @returns {Promise<boolean>} Success status
   */
  const saveIntervalOnly = useCallback(async () => {
    setSettingsState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Parse interval value
      const checkInterval = parseInt(localInterval) || DEFAULT_CHECK_INTERVAL;

      // Only send the interval to update
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ checkInterval }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save interval setting");
      }

      // Update state with new settings
      const { settings } = data;
      if (!settings) {
        throw new Error("No settings returned from server");
      }

      const normalizedSettings = normalizeSettings(settings);

      setConfig(normalizedSettings);
      setTempConfig(normalizedSettings);
      setLocalInterval(normalizedSettings.checkInterval.toString());

      setSettingsState((prev) => ({
        ...prev,
        isLoading: false,
        settingsChanged: false,
        error: null,
      }));

      return true;
    } catch (error) {
      console.error("Error saving interval:", error);
      setSettingsState((prev) => ({
        ...prev,
        isLoading: false,
        error: error.message,
      }));
      return false;
    }
  }, [localInterval, getAuthHeaders, normalizeSettings]);

  // Load settings when authentication changes
  useEffect(() => {
    if (isAuthenticated) {
      loadInitialData();
    }
  }, [isAuthenticated, loadInitialData]);

  return {
    settingsState,
    setSettingsState,
    config,
    tempConfig,
    localInterval,
    setLocalInterval,
    loadInitialData,
    handleTempConfigChange,
    handleSettingsSave,
    saveIntervalOnly,
  };
};
