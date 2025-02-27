// components/ImageSettingsSection.jsx
import React, { useState, useEffect, memo, useMemo, useCallback } from "react";
import PropTypes from "prop-types";
import { Lock, Unlock, Plus, Edit, Trash, Check, X } from "lucide-react";
import SettingToggle from "./SettingToggle";
import SettingGroup from "./SettingGroup";
import NumericInput from "./NumericInput";
import Card from "./common/Card";
import Button, { VARIANTS } from "./common/Button";
import Input from "./common/Input";
import Alert, { ALERT_TYPES } from "./common/Alert";

/**
 * Default preset template with all options
 */
const DEFAULT_PRESET_TEMPLATE = {
  resize: { width: 1600, height: 2400, enabled: true },
  colorspaceConversion: true,
  level: { blackPoint: 5, whitePoint: 90, gamma: 1.2, enabled: true },
  contrast: { enabled: true },
  contrastStretch: { black: 5, white: 1, enabled: false },
  brightnessContrast: { brightness: 0, contrast: 0, enabled: false },
  blackThreshold: { threshold: 25, enabled: false },
  sharpen: { radius: 0, sigma: 0.5, enabled: true },
  quality: 100,
};

/**
 * Header component
 */
const Header = memo(({ showImageSettings, toggleImageSettings }) => (
  <div className="flex justify-between items-center mb-4">
    <h2 className="text-lg font-semibold text-white">
      Image Processing Settings
    </h2>
    <Button
      onClick={() => toggleImageSettings(!showImageSettings)}
      className="p-2"
      icon={showImageSettings ? <Unlock size={16} /> : <Lock size={16} />}
    />
  </div>
));

Header.propTypes = {
  showImageSettings: PropTypes.bool.isRequired,
  toggleImageSettings: PropTypes.func.isRequired,
};

/**
 * Error message component
 */
const ErrorMessage = memo(({ message }) => (
  <Alert type={ALERT_TYPES.ERROR} message={message} />
));

ErrorMessage.propTypes = {
  message: PropTypes.string.isRequired,
};

/**
 * Active preset display when settings are locked
 */
const ActivePresetDisplay = memo(({ activePreset }) => (
  <div className="flex items-center mb-4">
    <label className="mr-2 text-gray-300">Active Preset:</label>
    <div className="font-medium  text-white">{activePreset || "Default"}</div>
  </div>
));

ActivePresetDisplay.propTypes = {
  activePreset: PropTypes.string.isRequired,
};

/**
 * Preset item display with edit/delete buttons
 */
const PresetItem = memo(
  ({ presetName, isActive, onEdit, onDelete, loading }) => (
    <div className="flex items-center justify-between p-2 border rounded">
      <span className="font-medium">{presetName}</span>
      <div className="flex space-x-2">
        <Button
          onClick={() => onEdit(presetName)}
          className=" p-1"
          title="Edit preset"
          icon={<Edit size={16} />}
          variant={VARIANTS.SECONDARY}
        />
        {!isActive && (
          <Button
            onClick={() => onDelete(presetName)}
            className="p-1"
            title="Delete preset"
            disabled={loading}
            icon={<Trash size={16} />}
            variant={VARIANTS.DANGER}
          />
        )}
      </div>
    </div>
  )
);

PresetItem.propTypes = {
  presetName: PropTypes.string.isRequired,
  isActive: PropTypes.bool.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
};

/**
 * Preset selector component
 */
const PresetSelector = memo(
  ({
    activePreset,
    presets = {},
    onPresetChange,
    onDeletePreset,
    onEditPreset,
    onCreatePreset,
    loading,
  }) => (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <label className="text-sm text-gray-300">Active Preset:</label>
        <select
          value={activePreset}
          onChange={(e) => onPresetChange(e.target.value)}
          className="border p-2 rounded bg-gray-700 border-gray-600 text-white"
        >
          {Object.keys(presets).map((presetName) => (
            <option key={presetName} value={presetName}>
              {presetName}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4">
        <h3 className="text-md font-semibold mb-2 text-white">
          Available Presets
        </h3>
        <div className="space-y-2">
          {Object.keys(presets).map((presetName) => (
            <PresetItem
              key={presetName}
              presetName={presetName}
              isActive={activePreset === presetName}
              onEdit={onEditPreset}
              onDelete={onDeletePreset}
              loading={loading}
            />
          ))}
        </div>

        <Button
          onClick={onCreatePreset}
          className="mt-4"
          disabled={loading}
          icon={<Plus size={16} />}
          variant={VARIANTS.SUCCESS}
        >
          Create New Preset
        </Button>
      </div>
    </div>
  )
);

PresetSelector.propTypes = {
  activePreset: PropTypes.string.isRequired,
  presets: PropTypes.object,
  onPresetChange: PropTypes.func.isRequired,
  onDeletePreset: PropTypes.func.isRequired,
  onEditPreset: PropTypes.func.isRequired,
  onCreatePreset: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
};

/**
 * Contrast adjustment component
 */
const ContrastAdjustment = memo(({ editedPreset, toggleFeature }) => (
  <div className="mb-4">
    <div className="flex items-center justify-between mb-2">
      <h4 className="font-medium">Contrast</h4>
      <SettingToggle
        enabled={editedPreset.contrast?.enabled ?? true}
        onChange={() => toggleFeature("contrast.enabled")}
      />
    </div>
    <p className="text-xs text-gray-400">
      Applies standard contrast enhancement to improve image clarity
    </p>
  </div>
));

ContrastAdjustment.propTypes = {
  editedPreset: PropTypes.object.isRequired,
  toggleFeature: PropTypes.func.isRequired,
};

/**
 * Contrast stretch component
 */
const ContrastStretch = memo(
  ({ editedPreset, toggleFeature, updateNestedValue }) => (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium">Contrast Stretch</h4>
        <SettingToggle
          enabled={editedPreset.contrastStretch?.enabled ?? false}
          onChange={() => toggleFeature("contrastStretch.enabled")}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <NumericInput
          label="Black (%)"
          value={editedPreset.contrastStretch?.black ?? 5}
          min={0}
          max={100}
          onChange={(val) => updateNestedValue("contrastStretch.black", val)}
          disabled={!(editedPreset.contrastStretch?.enabled ?? false)}
        />
        <NumericInput
          label="White (%)"
          value={editedPreset.contrastStretch?.white ?? 1}
          min={0}
          max={100}
          onChange={(val) => updateNestedValue("contrastStretch.white", val)}
          disabled={!(editedPreset.contrastStretch?.enabled ?? false)}
        />
      </div>
    </div>
  )
);

ContrastStretch.propTypes = {
  editedPreset: PropTypes.object.isRequired,
  toggleFeature: PropTypes.func.isRequired,
  updateNestedValue: PropTypes.func.isRequired,
};

/**
 * Brightness and contrast component
 */
const BrightnessContrast = memo(
  ({ editedPreset, toggleFeature, updateNestedValue }) => (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium">Brightness & Contrast</h4>
        <SettingToggle
          enabled={editedPreset.brightnessContrast?.enabled ?? false}
          onChange={() => toggleFeature("brightnessContrast.enabled")}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <NumericInput
          label="Brightness"
          value={editedPreset.brightnessContrast?.brightness ?? 0}
          min={-100}
          max={100}
          onChange={(val) =>
            updateNestedValue("brightnessContrast.brightness", val)
          }
          disabled={!(editedPreset.brightnessContrast?.enabled ?? false)}
        />
        <NumericInput
          label="Contrast"
          value={editedPreset.brightnessContrast?.contrast ?? 0}
          min={-100}
          max={100}
          onChange={(val) =>
            updateNestedValue("brightnessContrast.contrast", val)
          }
          disabled={!(editedPreset.brightnessContrast?.enabled ?? false)}
        />
      </div>
    </div>
  )
);

BrightnessContrast.propTypes = {
  editedPreset: PropTypes.object.isRequired,
  toggleFeature: PropTypes.func.isRequired,
  updateNestedValue: PropTypes.func.isRequired,
};

/**
 * Black threshold component
 */
const BlackThreshold = memo(
  ({ editedPreset, toggleFeature, updateNestedValue }) => (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium">Black Threshold</h4>
        <SettingToggle
          enabled={editedPreset.blackThreshold?.enabled ?? false}
          onChange={() => toggleFeature("blackThreshold.enabled")}
        />
      </div>
      <NumericInput
        label="Threshold (%)"
        value={editedPreset.blackThreshold?.threshold ?? 25}
        min={0}
        max={100}
        onChange={(val) => updateNestedValue("blackThreshold.threshold", val)}
        disabled={!(editedPreset.blackThreshold?.enabled ?? false)}
      />
    </div>
  )
);

BlackThreshold.propTypes = {
  editedPreset: PropTypes.object.isRequired,
  toggleFeature: PropTypes.func.isRequired,
  updateNestedValue: PropTypes.func.isRequired,
};

/**
 * Preset name input for new presets
 */
const PresetNameInput = memo(({ newPresetName, setNewPresetName }) => (
  <div className="mb-4">
    <Input
      type="text"
      label="Preset Name"
      value={newPresetName}
      onChange={setNewPresetName}
      placeholder="Enter preset name"
      required
    />
  </div>
));

PresetNameInput.propTypes = {
  newPresetName: PropTypes.string.isRequired,
  setNewPresetName: PropTypes.func.isRequired,
};

/**
 * Preset editor component
 */
const PresetEditor = memo(
  ({
    editedPreset,
    isCreatingPreset,
    editingPreset,
    newPresetName,
    setNewPresetName,
    updateNestedValue,
    toggleFeature,
    onSavePreset,
    onCancelEdit,
    loading,
  }) => {
    // Create color adjustment components
    const colorAdjustmentComponents = useMemo(
      () => [
        <ContrastAdjustment
          key="contrast"
          editedPreset={editedPreset}
          toggleFeature={toggleFeature}
        />,
        <ContrastStretch
          key="contrastStretch"
          editedPreset={editedPreset}
          toggleFeature={toggleFeature}
          updateNestedValue={updateNestedValue}
        />,
        <BrightnessContrast
          key="brightnessContrast"
          editedPreset={editedPreset}
          toggleFeature={toggleFeature}
          updateNestedValue={updateNestedValue}
        />,
        <BlackThreshold
          key="blackThreshold"
          editedPreset={editedPreset}
          toggleFeature={toggleFeature}
          updateNestedValue={updateNestedValue}
        />,
      ],
      [editedPreset, toggleFeature, updateNestedValue]
    );

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-md font-semibold text-white">
            {isCreatingPreset
              ? "Create New Preset"
              : `Edit Preset: ${editingPreset}`}
          </h3>

          {/* Action buttons */}
          <div className="flex space-x-2">
            <Button
              onClick={onCancelEdit}
              variant={VARIANTS.DANGER}
              icon={<X size={16} />}
            ></Button>
            <Button
              onClick={onSavePreset}
              disabled={loading}
              icon={<Check size={16} />}
            ></Button>
          </div>
        </div>

        {isCreatingPreset && (
          <PresetNameInput
            newPresetName={newPresetName}
            setNewPresetName={setNewPresetName}
          />
        )}

        {/* Resize settings */}
        <SettingGroup
          title="Resize"
          action={
            <SettingToggle
              enabled={editedPreset.resize?.enabled ?? true}
              onChange={() => toggleFeature("resize.enabled")}
            />
          }
        >
          <div className="grid grid-cols-2 gap-4">
            <NumericInput
              label="Width"
              value={editedPreset.resize?.width ?? 1600}
              onChange={(val) => updateNestedValue("resize.width", val)}
              disabled={!(editedPreset.resize?.enabled ?? true)}
            />
            <NumericInput
              label="Height"
              value={editedPreset.resize?.height ?? 2400}
              onChange={(val) => updateNestedValue("resize.height", val)}
              disabled={!(editedPreset.resize?.enabled ?? true)}
            />
          </div>
        </SettingGroup>

        {/* Color adjustment settings */}
        <SettingGroup title="Color Adjustments">
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <label className="block text-sm mb-1 text-gray-300">
                Color Space Conversion
              </label>
              <SettingToggle
                enabled={editedPreset.colorspaceConversion ?? true}
                onChange={() =>
                  updateNestedValue(
                    "colorspaceConversion",
                    !editedPreset.colorspaceConversion
                  )
                }
              />
            </div>
            <p className="text-xs text-gray-400">
              Converts CMYK to sRGB for better web compatibility
            </p>
          </div>

          {/* Level adjustment */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Level Adjustment</h4>
              <SettingToggle
                enabled={editedPreset.level?.enabled ?? true}
                onChange={() => toggleFeature("level.enabled")}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <NumericInput
                label="Black Point (%)"
                value={editedPreset.level?.blackPoint ?? 5}
                min={0}
                max={100}
                onChange={(val) => updateNestedValue("level.blackPoint", val)}
                disabled={!(editedPreset.level?.enabled ?? true)}
              />
              <NumericInput
                label="White Point (%)"
                value={editedPreset.level?.whitePoint ?? 90}
                min={0}
                max={100}
                onChange={(val) => updateNestedValue("level.whitePoint", val)}
                disabled={!(editedPreset.level?.enabled ?? true)}
              />
              <NumericInput
                label="Gamma"
                value={editedPreset.level?.gamma ?? 1.2}
                step={0.1}
                min={0.1}
                max={10}
                onChange={(val) => updateNestedValue("level.gamma", val)}
                disabled={!(editedPreset.level?.enabled ?? true)}
              />
            </div>
          </div>

          {/* Other color adjustments */}
          {colorAdjustmentComponents}
        </SettingGroup>

        {/* Sharpen settings */}
        <SettingGroup
          title="Sharpen"
          action={
            <SettingToggle
              enabled={editedPreset.sharpen?.enabled ?? true}
              onChange={() => toggleFeature("sharpen.enabled")}
            />
          }
        >
          <div className="grid grid-cols-2 gap-4">
            <NumericInput
              label="Radius"
              value={editedPreset.sharpen?.radius ?? 0}
              min={0}
              step={0.1}
              onChange={(val) => updateNestedValue("sharpen.radius", val)}
              disabled={!(editedPreset.sharpen?.enabled ?? true)}
            />
            <NumericInput
              label="Sigma"
              value={editedPreset.sharpen?.sigma ?? 0.5}
              min={0}
              step={0.1}
              onChange={(val) => updateNestedValue("sharpen.sigma", val)}
              disabled={!(editedPreset.sharpen?.enabled ?? true)}
            />
          </div>
        </SettingGroup>

        {/* Output quality settings */}
        <SettingGroup
          title="Output Quality"
          description="Higher values produce better quality but larger file sizes"
        >
          <NumericInput
            label="Quality (1-100)"
            value={editedPreset.quality ?? 100}
            min={1}
            max={100}
            onChange={(val) => updateNestedValue("quality", val)}
          />
        </SettingGroup>
      </div>
    );
  }
);

PresetEditor.propTypes = {
  editedPreset: PropTypes.object.isRequired,
  isCreatingPreset: PropTypes.bool.isRequired,
  editingPreset: PropTypes.string,
  newPresetName: PropTypes.string.isRequired,
  setNewPresetName: PropTypes.func.isRequired,
  updateNestedValue: PropTypes.func.isRequired,
  toggleFeature: PropTypes.func.isRequired,
  onSavePreset: PropTypes.func.isRequired,
  onCancelEdit: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
};

/**
 * Image settings section component for managing image processing settings
 * @param {Object} props - Component props
 * @returns {JSX.Element} Image settings section
 */
const ImageSettingsSection = memo(
  ({
    isAuthenticated,
    imageSettingsState,
    imageSettings,
    toggleImageSettings,
    setActivePreset,
    updateImageSettings,
    createPreset,
    deletePreset,
    startPresetEdit,
    cancelPresetEdit,
    startPresetCreation,
  }) => {
    // Local state
    const [newPresetName, setNewPresetName] = useState("");
    const [editedPreset, setEditedPreset] = useState(null);

    // Destructure state for better readability
    const {
      showImageSettings,
      editingPreset,
      isCreatingPreset,
      error,
      loading,
    } = imageSettingsState;
    const { presets = {}, activePreset } = imageSettings;

    // Initialize edited preset when starting to edit or create
    useEffect(() => {
      if (editingPreset && presets) {
        // Start with the complete template and merge with existing settings
        const basePreset = { ...DEFAULT_PRESET_TEMPLATE };
        const presetToEdit = presets[editingPreset];

        // Deep merge the preset settings
        Object.keys(presetToEdit).forEach((key) => {
          if (
            typeof presetToEdit[key] === "object" &&
            presetToEdit[key] !== null
          ) {
            basePreset[key] = { ...basePreset[key], ...presetToEdit[key] };
          } else {
            basePreset[key] = presetToEdit[key];
          }
        });

        setEditedPreset(basePreset);
      } else if (isCreatingPreset) {
        setEditedPreset({ ...DEFAULT_PRESET_TEMPLATE });
        setNewPresetName("");
      }
    }, [editingPreset, isCreatingPreset, presets]);

    /**
     * Handles saving a preset
     */
    const handleSavePreset = async () => {
      if (editingPreset) {
        await updateImageSettings({
          presets: { [editingPreset]: editedPreset },
        });
      } else if (isCreatingPreset) {
        if (!newPresetName.trim()) {
          alert("Please enter a preset name");
          return;
        }
        await createPreset(newPresetName, editedPreset);
      }
    };

    /**
     * Handles deleting a preset after confirmation
     */
    const handleDeletePreset = async (presetName) => {
      if (
        window.confirm(
          `Are you sure you want to delete the "${presetName}" preset?`
        )
      ) {
        await deletePreset(presetName);
      }
    };

    /**
     * Updates a nested property value in the edited preset
     */
    const updateNestedValue = useCallback((path, value) => {
      setEditedPreset((prev) => {
        const result = { ...prev };
        const parts = path.split(".");
        let current = result;

        for (let i = 0; i < parts.length - 1; i++) {
          current[parts[i]] = { ...current[parts[i]] };
          current = current[parts[i]];
        }

        current[parts[parts.length - 1]] = value;
        return result;
      });
    }, []);

    /**
     * Toggles a feature's enabled status
     */
    const toggleFeature = useCallback(
      (path) => {
        if (editedPreset) {
          const parts = path.split(".");
          let current = editedPreset;

          // Create nested objects if they don't exist
          for (let i = 0; i < parts.length - 1; i++) {
            if (!current[parts[i]]) {
              current[parts[i]] = {};
            }
            current = current[parts[i]];
          }

          const lastPart = parts[parts.length - 1];
          // Toggle the value, defaulting to true if it doesn't exist
          updateNestedValue(path, !(current[lastPart] ?? false));
        }
      },
      [editedPreset, updateNestedValue]
    );

    return (
      <Card>
        <Header
          showImageSettings={showImageSettings}
          toggleImageSettings={toggleImageSettings}
        />

        {error && <ErrorMessage message={error} />}

        {!showImageSettings && (
          <ActivePresetDisplay activePreset={activePreset} />
        )}

        {showImageSettings &&
          isAuthenticated &&
          !editingPreset &&
          !isCreatingPreset && (
            <PresetSelector
              activePreset={activePreset}
              presets={presets}
              onPresetChange={setActivePreset}
              onDeletePreset={handleDeletePreset}
              onEditPreset={startPresetEdit}
              onCreatePreset={startPresetCreation}
              loading={loading}
            />
          )}

        {showImageSettings &&
          isAuthenticated &&
          (editingPreset || isCreatingPreset) &&
          editedPreset && (
            <PresetEditor
              editedPreset={editedPreset}
              isCreatingPreset={isCreatingPreset}
              editingPreset={editingPreset}
              newPresetName={newPresetName}
              setNewPresetName={setNewPresetName}
              updateNestedValue={updateNestedValue}
              toggleFeature={toggleFeature}
              onSavePreset={handleSavePreset}
              onCancelEdit={cancelPresetEdit}
              loading={loading}
            />
          )}
      </Card>
    );
  }
);

ImageSettingsSection.propTypes = {
  isAuthenticated: PropTypes.bool.isRequired,
  imageSettingsState: PropTypes.shape({
    loading: PropTypes.bool,
    error: PropTypes.string,
    showImageSettings: PropTypes.bool,
    currentPreset: PropTypes.string,
    editingPreset: PropTypes.string,
    isCreatingPreset: PropTypes.bool,
  }).isRequired,
  imageSettings: PropTypes.shape({
    activePreset: PropTypes.string,
    presets: PropTypes.object,
  }).isRequired,
  toggleImageSettings: PropTypes.func.isRequired,
  setActivePreset: PropTypes.func.isRequired,
  updateImageSettings: PropTypes.func.isRequired,
  createPreset: PropTypes.func.isRequired,
  deletePreset: PropTypes.func.isRequired,
  startPresetEdit: PropTypes.func.isRequired,
  cancelPresetEdit: PropTypes.func.isRequired,
  startPresetCreation: PropTypes.func.isRequired,
};

export default ImageSettingsSection;
