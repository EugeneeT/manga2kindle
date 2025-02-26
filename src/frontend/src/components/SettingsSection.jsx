// components/SettingsSection.jsx
import React, { useState, memo } from "react";
import PropTypes from "prop-types";
import { Lock, Unlock, Eye, EyeOff, Save } from "lucide-react";
import Card from "./common/Card";
import Button from "./common/Button";
import Input from "./common/Input";
import Alert, { ALERT_TYPES } from "./common/Alert";

/**
 * Tab configuration
 */
const TABS = {
  EMAIL_SETTINGS: "emailSettings",
  PASSWORD_CHANGE: "passwordChange",
};

/**
 * Tab navigation component
 */
const TabNavigation = memo(({ activeTab, setActiveTab }) => (
  <div className="border-b border-gray-200 mb-4">
    <nav className="flex space-x-2">
      <button
        onClick={() => setActiveTab(TABS.EMAIL_SETTINGS)}
        className={`py-2 px-4 ${
          activeTab === TABS.EMAIL_SETTINGS
            ? "border-b-2 border-blue-500 font-medium"
            : "text-gray-500 hover:text-gray-700"
        }`}
      >
        Email Settings
      </button>
      <button
        onClick={() => setActiveTab(TABS.PASSWORD_CHANGE)}
        className={`py-2 px-4 ${
          activeTab === TABS.PASSWORD_CHANGE
            ? "border-b-2 border-blue-500 font-medium"
            : "text-gray-500 hover:text-gray-700"
        }`}
      >
        Change Password
      </button>
    </nav>
  </div>
));

TabNavigation.propTypes = {
  activeTab: PropTypes.string.isRequired,
  setActiveTab: PropTypes.func.isRequired,
};

/**
 * Email settings form component
 */
const EmailSettingsForm = memo(
  ({
    tempConfig,
    onTempConfigChange,
    showPassword,
    setShowPassword,
    settingsChanged,
    onSettingsSave,
    isLoading,
  }) => (
    <div className="space-y-4">
      <Input
        type="email"
        label="SMTP User"
        value={tempConfig.smtpUser}
        onChange={(value) => onTempConfigChange("smtpUser", value)}
      />

      <div>
        <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">
          SMTP Password
        </label>
        <div className="relative flex items-center">
          <input
            type={showPassword ? "text" : "password"}
            value={tempConfig.smtpPass}
            onChange={(e) => onTempConfigChange("smtpPass", e.target.value)}
            className="border p-2 w-full rounded bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <Button
            onClick={() => setShowPassword(!showPassword)}
            className="ml-2 p-2"
            icon={showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          />
        </div>
      </div>

      <Input
        type="email"
        label="Kindle Email"
        value={tempConfig.kindleEmail}
        onChange={(value) => onTempConfigChange("kindleEmail", value)}
      />

      {settingsChanged && (
        <Button
          onClick={onSettingsSave}
          disabled={isLoading}
          icon={isLoading ? null : <Save size={16} />}
        >
          {isLoading ? "Saving..." : ""}
        </Button>
      )}
    </div>
  )
);

EmailSettingsForm.propTypes = {
  tempConfig: PropTypes.object.isRequired,
  onTempConfigChange: PropTypes.func.isRequired,
  showPassword: PropTypes.bool.isRequired,
  setShowPassword: PropTypes.func.isRequired,
  settingsChanged: PropTypes.bool.isRequired,
  onSettingsSave: PropTypes.func.isRequired,
  isLoading: PropTypes.bool.isRequired,
};

/**
 * Password change form component
 */
const PasswordChangeForm = memo(
  ({
    passwordData,
    setPasswordData,
    onPasswordChange,
    passwordChangeState,
  }) => {
    // Add state for tracking password visibility for each field
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    return (
      <div>
        {passwordChangeState.error && (
          <Alert type={ALERT_TYPES.ERROR} message={passwordChangeState.error} />
        )}

        {passwordChangeState.success && (
          <Alert
            type={ALERT_TYPES.SUCCESS}
            message="Password successfully changed!"
          />
        )}

        <form onSubmit={onPasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">
              Current Password
            </label>
            <div className="relative flex items-center">
              <input
                type={showOldPassword ? "text" : "password"}
                value={passwordData.oldPassword}
                onChange={(e) =>
                  setPasswordData((prev) => ({
                    ...prev,
                    oldPassword: e.target.value,
                  }))
                }
                className="border p-2 w-full rounded bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
              <Button
                onClick={() => setShowOldPassword(!showOldPassword)}
                className="ml-2 p-2"
                icon={
                  showOldPassword ? <EyeOff size={16} /> : <Eye size={16} />
                }
              />
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">
              New Password
            </label>
            <div className="relative flex items-center">
              <input
                type={showNewPassword ? "text" : "password"}
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData((prev) => ({
                    ...prev,
                    newPassword: e.target.value,
                  }))
                }
                className="border p-2 w-full rounded bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
              <Button
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="ml-2 p-2"
                icon={
                  showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />
                }
              />
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">
              Confirm New Password
            </label>
            <div className="relative flex items-center">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData((prev) => ({
                    ...prev,
                    confirmPassword: e.target.value,
                  }))
                }
                className="border p-2 w-full rounded bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
              <Button
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="ml-2 p-2"
                icon={
                  showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />
                }
              />
            </div>
          </div>

          <Button type="submit">
            <Save size={16} />
          </Button>
        </form>
      </div>
    );
  }
);

PasswordChangeForm.propTypes = {
  passwordData: PropTypes.object.isRequired,
  setPasswordData: PropTypes.func.isRequired,
  onPasswordChange: PropTypes.func.isRequired,
  passwordChangeState: PropTypes.object.isRequired,
};

/**
 * Settings section component for managing user settings
 * @param {Object} props - Component props
 * @returns {JSX.Element} Settings section
 */
const SettingsSection = memo(
  ({
    isAuthenticated,
    showSettings,
    setShowSettings,
    tempConfig,
    showPassword,
    setShowPassword,
    onTempConfigChange,
    settingsChanged,
    onSettingsSave,
    isLoading,
    passwordData,
    setPasswordData,
    onPasswordChange,
    passwordChangeState,
  }) => {
    // State to track active tab
    const [activeTab, setActiveTab] = useState(TABS.EMAIL_SETTINGS);

    // Title action button to toggle settings visibility
    const titleAction = (
      <Button
        onClick={() => setShowSettings(!showSettings)}
        className="p-2"
        icon={showSettings ? <Unlock size={16} /> : <Lock size={16} />}
      />
    );

    return (
      <Card title="User Settings" titleAction={titleAction}>
        {showSettings && isAuthenticated && (
          <div>
            <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

            {activeTab === TABS.EMAIL_SETTINGS ? (
              <EmailSettingsForm
                tempConfig={tempConfig}
                onTempConfigChange={onTempConfigChange}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
                settingsChanged={settingsChanged}
                onSettingsSave={onSettingsSave}
                isLoading={isLoading}
              />
            ) : (
              <PasswordChangeForm
                passwordData={passwordData}
                setPasswordData={setPasswordData}
                onPasswordChange={onPasswordChange}
                passwordChangeState={passwordChangeState}
              />
            )}
          </div>
        )}
      </Card>
    );
  }
);

SettingsSection.propTypes = {
  isAuthenticated: PropTypes.bool.isRequired,
  showSettings: PropTypes.bool.isRequired,
  setShowSettings: PropTypes.func.isRequired,
  tempConfig: PropTypes.object.isRequired,
  showPassword: PropTypes.bool.isRequired,
  setShowPassword: PropTypes.func.isRequired,
  onTempConfigChange: PropTypes.func.isRequired,
  settingsChanged: PropTypes.bool.isRequired,
  onSettingsSave: PropTypes.func.isRequired,
  isLoading: PropTypes.bool.isRequired,
  passwordData: PropTypes.object.isRequired,
  setPasswordData: PropTypes.func.isRequired,
  onPasswordChange: PropTypes.func.isRequired,
  passwordChangeState: PropTypes.object.isRequired,
};

export default SettingsSection;
