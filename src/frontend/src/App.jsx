// App.jsx
import React, { useState, useCallback } from "react";
import LoginForm from "./components/LoginForm";
import InitialSetupForm from "./components/InitialSetupForm";
import HistorySection from "./components/HistorySection";
import StatusSection from "./components/StatusSection";
import SettingsSection from "./components/SettingsSection";
import ImageSettingsSection from "./components/ImageSettingsSection";
import { useAuth } from "./hooks/useAuth";
import { useSettings } from "./hooks/useSettings";
import { useStatus } from "./hooks/useStatus";
import { useImageSettings } from "./hooks/useImageSettings";

// Common AppHeader component used in both authenticated and non-authenticated states
const AppHeader = ({ showLogout = false, onLogout = null }) => (
  <div className="flex justify-between items-center mb-6">
    <h1 className="text-2xl font-bold text-white">Manga to Kindle Converter</h1>
    {showLogout && (
      <button
        onClick={onLogout}
        className="text-white px-4 py-2 rounded bg-blue-600 hover:bg-blue-700"
      >
        Logout
      </button>
    )}
  </div>
);

const App = () => {
  // Auth related state
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
    confirmPassword: "",
  });

  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [passwordChangeState, setPasswordChangeState] = useState({
    success: false,
    error: "",
  });

  // Loading states
  const [isLoading, setIsLoading] = useState({
    auth: false,
    settings: false,
    processing: false,
  });

  // Custom hooks
  const { authState, handleLogin, handleLogout } = useAuth();

  const {
    settingsState,
    setSettingsState,
    config,
    tempConfig,
    localInterval,
    setLocalInterval,
    loadInitialData,
    handleTempConfigChange,
    handleSettingsSave,
  } = useSettings(authState.isAuthenticated);

  const { status, startProcessing, clearHistory } = useStatus(
    authState.isAuthenticated
  );

  const {
    imageSettingsState,
    toggleImageSettings,
    imageSettings,
    setActivePreset,
    updateImageSettings,
    createPreset,
    deletePreset,
    startPresetEdit,
    cancelPresetEdit,
    startPresetCreation,
  } = useImageSettings(authState.isAuthenticated);

  // Authentication handlers
  const handleLoginSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setIsLoading((prev) => ({ ...prev, auth: true }));

      try {
        const success = await handleLogin(credentials);
        if (success) {
          await loadInitialData();
        }
      } finally {
        setIsLoading((prev) => ({ ...prev, auth: false }));
      }
    },
    [credentials, handleLogin, loadInitialData]
  );

  const handleInitialSetup = useCallback(
    async (e) => {
      e.preventDefault();

      // Validate passwords match
      if (credentials.password !== credentials.confirmPassword) {
        // Use setState instead of direct mutation
        setPasswordChangeState((prev) => ({
          ...prev,
          error: "Passwords don't match",
        }));
        return;
      }

      setIsLoading((prev) => ({ ...prev, auth: true }));

      try {
        const response = await fetch("/api/auth/initialize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: credentials.username,
            password: credentials.password,
          }),
        });

        // Parse response JSON once
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to create account");
        }

        // Store token and session
        const { token } = data;
        if (!token) {
          throw new Error("No token received from server");
        }

        localStorage.setItem("token", token);
        localStorage.setItem(
          "session",
          JSON.stringify({
            expiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          })
        );

        await handleLogin(credentials);
        // Use state management via React instead of page reload
        await loadInitialData();
      } catch (error) {
        setPasswordChangeState((prev) => ({
          ...prev,
          error: error.message,
        }));
      } finally {
        setIsLoading((prev) => ({ ...prev, auth: false }));
      }
    },
    [credentials, loadInitialData, handleLogin]
  );

  // Settings handlers
  const toggleImageSettingsSection = useCallback(
    (isOpen) => {
      if (isOpen) {
        setSettingsState((prev) => ({ ...prev, showSettings: false }));
      }
      toggleImageSettings(isOpen);
    },
    [toggleImageSettings, setSettingsState]
  );

  const toggleSettingsSection = useCallback(
    (isOpen) => {
      setSettingsState((prev) => ({ ...prev, showSettings: isOpen }));
      if (isOpen) {
        toggleImageSettings(false);
      }
    },
    [toggleImageSettings, setSettingsState]
  );

  const handleIntervalSave = useCallback(async () => {
    setIsLoading((prev) => ({ ...prev, settings: true }));
    try {
      await handleSettingsSave();
    } finally {
      setIsLoading((prev) => ({ ...prev, settings: false }));
    }
  }, [handleSettingsSave]);

  const handleSettingsSaveWrapper = useCallback(async () => {
    setIsLoading((prev) => ({ ...prev, settings: true }));
    try {
      await handleSettingsSave();
    } finally {
      setIsLoading((prev) => ({ ...prev, settings: false }));
    }
  }, [handleSettingsSave]);

  // Processing handler
  const handleStartProcessing = useCallback(async () => {
    setIsLoading((prev) => ({ ...prev, processing: true }));
    try {
      await startProcessing();
    } finally {
      setIsLoading((prev) => ({ ...prev, processing: false }));
    }
  }, [startProcessing]);

  // Password change handler
  const handlePasswordChange = useCallback(
    async (e) => {
      e.preventDefault();
      setPasswordChangeState({ success: false, error: "" });

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setPasswordChangeState((prev) => ({
          ...prev,
          error: "New passwords don't match",
        }));
        return;
      }

      try {
        const response = await fetch("/api/auth/change-password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            oldPassword: passwordData.oldPassword,
            newPassword: passwordData.newPassword,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to change password");
        }

        setPasswordChangeState((prev) => ({ ...prev, success: true }));
        setPasswordData({
          oldPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } catch (err) {
        setPasswordChangeState((prev) => ({
          ...prev,
          error: err.message,
        }));
      }
    },
    [passwordData]
  );

  // Memorize setting interval updater function
  const handleEditInterval = useCallback(
    (value) => {
      setSettingsState((prev) => ({ ...prev, isEditingInterval: value }));
    },
    [setSettingsState]
  );

  // Memorize password visibility toggler
  const handleTogglePasswordVisibility = useCallback(
    (value) => {
      setSettingsState((prev) => ({ ...prev, showPassword: value }));
    },
    [setSettingsState]
  );

  // Render unauthenticated UI
  if (!authState.isAuthenticated) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <AppHeader />

        {!authState.isInitialized ? (
          <InitialSetupForm
            credentials={credentials}
            setCredentials={setCredentials}
            onSubmit={handleInitialSetup}
            error={passwordChangeState.error}
            isLoading={isLoading.auth}
          />
        ) : (
          <LoginForm
            credentials={credentials}
            setCredentials={setCredentials}
            onSubmit={handleLoginSubmit}
            error={passwordChangeState.error}
            isLoading={isLoading.auth}
          />
        )}
      </div>
    );
  }

  // Render authenticated UI
  return (
    <div className="p-6 w-full mx-auto">
      <AppHeader showLogout onLogout={handleLogout} />

      <div className="flex flex-col md:flex-row gap-6">
        {/* Left Column */}
        <div className="w-full md:w-1/2">
          {/* Status Section */}
          <StatusSection
            status={status}
            isProcessing={status.isProcessing || isLoading.processing}
            onStartProcessing={handleStartProcessing}
            config={config}
            localInterval={localInterval}
            setLocalInterval={setLocalInterval}
            isEditingInterval={settingsState.isEditingInterval}
            setIsEditingInterval={handleEditInterval}
            onIntervalSave={handleIntervalSave}
          />

          {/* Processing History Section */}
          <HistorySection
            files={status.processedFiles}
            onClearHistory={clearHistory}
          />
        </div>

        {/* Right Column */}
        <div className="w-full md:w-1/2">
          {/* Image Settings Section */}
          <ImageSettingsSection
            isAuthenticated={authState.isAuthenticated}
            imageSettingsState={imageSettingsState}
            imageSettings={imageSettings}
            toggleImageSettings={toggleImageSettingsSection}
            setActivePreset={setActivePreset}
            updateImageSettings={updateImageSettings}
            createPreset={createPreset}
            deletePreset={deletePreset}
            startPresetEdit={startPresetEdit}
            cancelPresetEdit={cancelPresetEdit}
            startPresetCreation={startPresetCreation}
          />

          {/* User Settings Section */}
          <div className="mt-6">
            <SettingsSection
              isAuthenticated={authState.isAuthenticated}
              showSettings={settingsState.showSettings}
              setShowSettings={toggleSettingsSection}
              tempConfig={tempConfig}
              showPassword={settingsState.showPassword}
              setShowPassword={handleTogglePasswordVisibility}
              onTempConfigChange={handleTempConfigChange}
              settingsChanged={settingsState.settingsChanged}
              onSettingsSave={handleSettingsSaveWrapper}
              isLoading={isLoading.settings}
              passwordData={passwordData}
              setPasswordData={setPasswordData}
              onPasswordChange={handlePasswordChange}
              passwordChangeState={passwordChangeState}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
