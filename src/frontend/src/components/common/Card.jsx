// common/Card.jsx
import React, { memo } from "react";
import PropTypes from "prop-types";

/**
 * Reusable Card component with consistent styling
 * @param {Object} props - Component props
 * @returns {JSX.Element} Styled card component
 */
const Card = memo(
  ({ children, title, titleAction, className = "", bodyClassName = "" }) => {
    return (
      <div
        className={`bg-gray-800 rounded-lg shadow p-4 text-white ${className}`}
      >
        {(title || titleAction) && (
          <div className="flex justify-between items-center mb-4">
            {title && (
              <h2 className="text-lg font-semibold text-white">{title}</h2>
            )}
            {titleAction}
          </div>
        )}
        <div className={bodyClassName}>{children}</div>
      </div>
    );
  }
);

Card.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.node,
  titleAction: PropTypes.node,
  className: PropTypes.string,
  bodyClassName: PropTypes.string,
};

export default Card;
