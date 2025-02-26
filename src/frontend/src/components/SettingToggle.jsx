// components/SettingToggle.jsx
import React, { memo } from "react";
import PropTypes from "prop-types";

/**
 * Toggle switch component for boolean settings
 * @param {Object} props - Component props
 * @returns {JSX.Element} Toggle switch
 */
const SettingToggle = memo(({ 
  enabled, 
  onChange,
  disabled = false,
  label = null,
  labelPosition = "right",
}) => {
  const handleChange = () => {
    if (!disabled && onChange) {
      onChange(!enabled);
    }
  };

  const toggle = (
    <label className={`inline-flex items-center cursor-pointer ${disabled ? 'opacity-50' : ''}`}>
      <input
        type="checkbox"
        checked={enabled}
        onChange={handleChange}
        disabled={disabled}
        className="sr-only peer"
      />
      <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
    </label>
  );

  // If no label, just return the toggle
  if (!label) return toggle;

  // Return toggle with label in specified position
  return (
    <div className="flex items-center gap-2">
      {labelPosition === "left" && (
        <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
      )}
      {toggle}
      {labelPosition === "right" && (
        <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
      )}
    </div>
  );
});

SettingToggle.propTypes = {
  enabled: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  label: PropTypes.node,
  labelPosition: PropTypes.oneOf(["left", "right"]),
};

export default SettingToggle;
