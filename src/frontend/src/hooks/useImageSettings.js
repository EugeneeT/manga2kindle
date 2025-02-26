// hooks/useImageSettings.js
import { useState, useEffect, useCallback } from "react";

// Default image settings
const DEFAULT_IMAGE_SETTINGS = {
  activePreset: "standard",
  presets: {},
};

/**
 * Hook to manage image processing settings
 * @param {boolean} isAuthenticated - Whether the user is authenticated
 * @returns {Object} Image settings state and methods
 */
export const useImageSettings = (isAuthenticated) => {
  // UI state for image settings management
  const [imageSettingsState, setImageSettingsState] = useState({
    loading: false,
    error: null,
    showImageSettings: false,
    currentPreset: null,
    editingPreset: null,
    isCreatingPreset: false,
  });

  // Actual image settings
  const [imageSettings, setImageSettings] = useState(DEFAULT_IMAGE_SETTINGS);

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
   * Set loading state and clear error
   */
  const setLoading = useCallback((isLoading = true) => {
    setImageSettingsState(prev => ({
      ...prev,
      loading: isLoading,
      error: isLoading ? null : prev.error,
    }));
  }, []);

  /**
   * Set error state and clear loading
   */
  const setError = useCallback((error) => {
    setImageSettingsState(prev => ({
      ...prev,
      error,
      loading: false,
    }));
  }, []);

  /**
   * Load image settings from the server
   * @returns {Promise<Object|null>} Image settings or null on error
   */
  const loadImageSettings = useCallback(async () => {
    if (!isAuthenticated) return null;
    
    setLoading(true);
    
    try {
      const response = await fetch("/api/image-settings", {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to load image settings");
      }

      const settings = await response.json();
      
      setImageSettings(settings);
      setImageSettingsState(prev => ({
        ...prev,
        loading: false,
        error: null,
        currentPreset: settings.activePreset,
      }));
      
      return settings;
    } catch (error) {
      console.error("Error loading image settings:", error);
      setError(error.message);
      return null;
    }
  }, [isAuthenticated, getAuthHeaders, setLoading, setError]);

  /**
   * Update image settings
   * @param {Object} updatedSettings - New settings to save
   * @returns {Promise<boolean>} Success status
   */
  const updateImageSettings = useCallback(async (updatedSettings) => {
    setLoading(true);
    
    try {
      const response = await fetch("/api/image-settings", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(updatedSettings),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to save image settings");
      }

      if (!data.settings) {
        throw new Error("No settings returned from server");
      }

      setImageSettings(data.settings);
      setImageSettingsState(prev => ({
        ...prev,
        loading: false,
        error: null,
        currentPreset: data.settings.activePreset,
        editingPreset: null,
      }));
      
      return true;
    } catch (error) {
      console.error("Error updating image settings:", error);
      setError(error.message);
      return false;
    }
  }, [getAuthHeaders, setLoading, setError]);

  /**
   * Set the active preset
   * @param {string} presetName - Preset name to activate
   * @returns {Promise<boolean>} Success status
   */
  const setActivePreset = useCallback(async (presetName) => {
    setLoading(true);
    
    try {
      const response = await fetch("/api/image-settings/active-preset", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ preset: presetName }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to set active preset");
      }

      if (!data.settings) {
        throw new Error("No settings returned from server");
      }

      setImageSettings(data.settings);
      setImageSettingsState(prev => ({
        ...prev,
        loading: false,
        error: null,
        currentPreset: presetName,
      }));
      
      return true;
    } catch (error) {
      console.error("Error setting active preset:", error);
      setError(error.message);
      return false;
    }
  }, [getAuthHeaders, setLoading, setError]);

  /**
   * Create a new preset
   * @param {string} presetName - New preset name
   * @param {Object} presetSettings - Preset settings
   * @returns {Promise<boolean>} Success status
   */
  const createPreset = useCallback(async (presetName, presetSettings) => {
    setLoading(true);
    
    try {
      const response = await fetch("/api/image-settings/presets", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ 
          name: presetName, 
          settings: presetSettings 
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to create preset");
      }

      if (!data.settings) {
        throw new Error("No settings returned from server");
      }

      setImageSettings(data.settings);
      setImageSettingsState(prev => ({
        ...prev,
        loading: false,
        error: null,
        isCreatingPreset: false,
      }));
      
      return true;
    } catch (error) {
      console.error("Error creating preset:", error);
      setError(error.message);
      return false;
    }
  }, [getAuthHeaders, setLoading, setError]);

  /**
   * Delete a preset
   * @param {string} presetName - Preset name to delete
   * @returns {Promise<boolean>} Success status
   */
  const deletePreset = useCallback(async (presetName) => {
    setLoading(true);
    
    try {
      const response = await fetch(`/api/image-settings/presets/${presetName}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete preset");
      }

      if (!data.settings) {
        throw new Error("No settings returned from server");
      }

      setImageSettings(data.settings);
      setImageSettingsState(prev => ({
        ...prev,
        loading: false,
        error: null,
      }));
      
      return true;
    } catch (error) {
      console.error("Error deleting preset:", error);
      setError(error.message);
      return false;
    }
  }, [getAuthHeaders, setLoading, setError]);

  /**
   * Toggle image settings panel visibility
   * @param {boolean} isOpen - Explicitly set open state, or toggle if undefined
   */
  const toggleImageSettings = useCallback((isOpen) => {
    setImageSettingsState(prev => ({
      ...prev,
      showImageSettings: typeof isOpen === "boolean" 
        ? isOpen 
        : !prev.showImageSettings,
    }));
  }, []);

  /**
   * UI Helpers for managing preset editing state
   */
  
  const startPresetEdit = useCallback((presetName) => {
    setImageSettingsState(prev => ({
      ...prev,
      editingPreset: presetName,
      isCreatingPreset: false,
    }));
  }, []);

  const cancelPresetEdit = useCallback(() => {
    setImageSettingsState(prev => ({
      ...prev,
      editingPreset: null,
      isCreatingPreset: false,
    }));
  }, []);

  const startPresetCreation = useCallback(() => {
    setImageSettingsState(prev => ({
      ...prev,
      isCreatingPreset: true,
      editingPreset: null,
    }));
  }, []);

  // Load settings when authentication changes
  useEffect(() => {
    if (isAuthenticated) {
      loadImageSettings();
    }
  }, [isAuthenticated, loadImageSettings]);

  return {
    imageSettingsState,
    imageSettings,
    loadImageSettings,
    updateImageSettings,
    setActivePreset,
    createPreset,
    deletePreset,
    toggleImageSettings,
    startPresetEdit,
    cancelPresetEdit,
    startPresetCreation,
  };
};
