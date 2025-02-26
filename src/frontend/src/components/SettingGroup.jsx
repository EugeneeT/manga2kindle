// components/SettingGroup.jsx
import React, { memo } from "react";
import PropTypes from "prop-types";

/**
 * Groups related settings with a title and optional action element
 * @param {Object} props - Component props
 * @returns {JSX.Element} Setting group container
 */
const SettingGroup = memo(({ 
  title, 
  children, 
  className = "",
  action = null,
  description = null,
}) => {
  // If action is explicitly provided, use it
  // Otherwise, assume first child is the action element if multiple children exist
  const actionElement = action || (Array.isArray(children) && children.length > 1 ? children[0] : null);
  
  // Get content elements - either explicitly provided children or all children after first
  const contentElements = action 
    ? children 
    : (Array.isArray(children) && children.length > 1 ? children.slice(1) : children);
  
  return (
    <div className={`border rounded p-4 mb-4 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium">{title}</h4>
        {actionElement}
      </div>
      
      {description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          {description}
        </p>
      )}
      
      {contentElements}
    </div>
  );
});

SettingGroup.propTypes = {
  title: PropTypes.node.isRequired,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  action: PropTypes.node,
  description: PropTypes.node,
};

export default SettingGroup;
