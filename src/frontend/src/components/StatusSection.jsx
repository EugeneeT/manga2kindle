// components/StatusSection.jsx
import React, { memo } from "react";
import PropTypes from "prop-types";
import { Play, Edit, X, Save } from "lucide-react";

import Card from "./common/Card";
import Button, { VARIANTS } from "./common/Button";
import Input from "./common/Input";

/**
 * Status indicator component
 */
const StatusIndicator = memo(({ status }) => {
  // Determine status color
  let statusColor = "bg-yellow-500"; // Default (idle)
  let statusText = "Idle";

  if (status.lastError) {
    statusColor = "bg-red-500";
    statusText = `Error: ${status.lastError}`;
  } else if (status.isProcessing) {
    statusColor = "bg-green-500";
    statusText = `${status.stage || "Processing..."}: ${
      status.currentFile || ""
    }`;
  }

  return (
    <div className="flex items-center gap-4">
      <div className={`w-4 h-4 rounded-full ${statusColor}`} />
      <span className="text-white">{statusText}</span>
    </div>
  );
});

StatusIndicator.propTypes = {
  status: PropTypes.shape({
    lastError: PropTypes.string,
    isProcessing: PropTypes.bool,
    stage: PropTypes.string,
    currentFile: PropTypes.string,
  }).isRequired,
};

/**
 * Interval editor component
 */
const IntervalEditor = memo(
  ({
    localInterval,
    setLocalInterval,
    onIntervalSave,
    setIsEditingInterval,
    config,
  }) => {
    const handleKeyDown = (e) => {
      if (e.key === "Enter") {
        handleSave();
      }
    };

    const handleSave = () => {
      onIntervalSave();
      setIsEditingInterval(false);
    };

    const handleCancel = () => {
      setIsEditingInterval(false);
      setLocalInterval(config.checkInterval.toString());
    };

    return (
      <div className="flex items-center gap-2">
        <Input
          type="number"
          value={localInterval}
          onChange={setLocalInterval}
          onKeyDown={handleKeyDown}
          className="w-14"
        />
        <Button onClick={handleSave} className="text-sm">
          <Save size={16} />
        </Button>
        <Button
          onClick={handleCancel}
          variant={VARIANTS.DANGER}
          className="text-sm"
        >
          <X size={16} />
        </Button>
      </div>
    );
  }
);

IntervalEditor.propTypes = {
  localInterval: PropTypes.string.isRequired,
  setLocalInterval: PropTypes.func.isRequired,
  onIntervalSave: PropTypes.func.isRequired,
  setIsEditingInterval: PropTypes.func.isRequired,
  config: PropTypes.object.isRequired,
};

/**
 * Interval display component
 */
const IntervalDisplay = memo(({ config, setIsEditingInterval }) => (
  <div className="flex items-center gap-2">
    <span className="text-white">{config.checkInterval} min</span>
    <div className="ml-auto">
      <Button
        onClick={() => setIsEditingInterval(true)}
        className="ml-auto"
        icon={<Edit size={16} />}
      />
    </div>
  </div>
));

IntervalDisplay.propTypes = {
  config: PropTypes.object.isRequired,
  setIsEditingInterval: PropTypes.func.isRequired,
};

/**
 * Status section component that shows current processing status and controls
 * @param {Object} props - Component props
 * @returns {JSX.Element} Status section
 */
const StatusSection = memo(
  ({
    status,
    isProcessing,
    onStartProcessing,
    config,
    localInterval,
    setLocalInterval,
    isEditingInterval,
    setIsEditingInterval,
    onIntervalSave,
  }) => (
    <Card className="mb-6">
      <div className="flex justify-between items-center">
        <StatusIndicator status={status} />

        <Button
          onClick={onStartProcessing}
          disabled={isProcessing}
          icon={isProcessing ? null : <Play size={16} />}
        >
          {isProcessing ? "Processing..." : ""}
        </Button>
      </div>

      <div className="mt-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-300">Check Interval:</span>
          <span className="text-white">{config.checkInterval} min</span>
        </div>

        {isEditingInterval ? (
          <IntervalEditor
            localInterval={localInterval}
            setLocalInterval={setLocalInterval}
            onIntervalSave={onIntervalSave}
            setIsEditingInterval={setIsEditingInterval}
            config={config}
          />
        ) : (
          <Button
            onClick={() => setIsEditingInterval(true)}
            className=""
            icon={<Edit size={16} />}
          />
        )}
      </div>
    </Card>
  )
);

StatusSection.propTypes = {
  status: PropTypes.shape({
    lastError: PropTypes.string,
    isProcessing: PropTypes.bool,
    stage: PropTypes.string,
    currentFile: PropTypes.string,
  }).isRequired,
  isProcessing: PropTypes.bool.isRequired,
  onStartProcessing: PropTypes.func.isRequired,
  config: PropTypes.object.isRequired,
  localInterval: PropTypes.string.isRequired,
  setLocalInterval: PropTypes.func.isRequired,
  isEditingInterval: PropTypes.bool.isRequired,
  setIsEditingInterval: PropTypes.func.isRequired,
  onIntervalSave: PropTypes.func.isRequired,
};

export default StatusSection;
