// common/Alert.jsx
import React, { memo } from "react";
import PropTypes from "prop-types";

/**
 * Alert types with associated styling
 */
const ALERT_TYPES = {
  SUCCESS: "success",
  ERROR: "error",
  WARNING: "warning",
  INFO: "info",
};

/**
 * Reusable Alert component for displaying notifications
 * @param {Object} props - Component props
 * @returns {JSX.Element} Styled alert component
 */
const Alert = memo(({ 
  type = ALERT_TYPES.INFO, 
  message, 
  className = "",
  onDismiss = null,
}) => {
  if (!message) return null;

  const typeClasses = {
    [ALERT_TYPES.SUCCESS]: "bg-green-100 border-green-400 text-green-700",
    [ALERT_TYPES.ERROR]: "bg-red-100 border-red-400 text-red-700",
    [ALERT_TYPES.WARNING]: "bg-yellow-100 border-yellow-400 text-yellow-700",
    [ALERT_TYPES.INFO]: "bg-blue-100 border-blue-400 text-blue-700",
  }[type];

  return (
    <div className={`border px-4 py-3 rounded mb-4 ${typeClasses} ${className}`}>
      <div className="flex justify-between items-center">
        <div>{message}</div>
        {onDismiss && (
          <button
            type="button"
            className="ml-4 text-gray-500 hover:text-gray-700"
            onClick={onDismiss}
            aria-label="Dismiss"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
});

Alert.propTypes = {
  type: PropTypes.oneOf(Object.values(ALERT_TYPES)),
  message: PropTypes.node,
  className: PropTypes.string,
  onDismiss: PropTypes.func,
};

export { ALERT_TYPES };
export default Alert;