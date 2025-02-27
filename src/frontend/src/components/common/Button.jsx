// common/Button.jsx
import React, { memo } from "react";
import PropTypes from "prop-types";

/**
 * Common button variants
 */
const VARIANTS = {
  PRIMARY: "primary",
  SECONDARY: "secondary",
  DANGER: "danger",
  SUCCESS: "success",
};

/**
 * Reusable Button component with consistent styling
 * @param {Object} props - Component props
 * @returns {JSX.Element} Styled button component
 */
const Button = memo(
  ({
    children,
    onClick,
    type = "button",
    variant = VARIANTS.PRIMARY,
    disabled = false,
    className = "",
    icon = null,
    title,
  }) => {
    // Define base and variant-specific classes
    const baseClasses = "px-3 py-3 rounded";

    // Get variant-specific classes
    const variantClasses = {
      [VARIANTS.PRIMARY]: "text-white dark:bg-blue-600 dark:hover:bg-blue-700",
      [VARIANTS.SECONDARY]:
        "text-gray-800 dark:bg-gray-300 dark:hover:bg-gray-400",
      [VARIANTS.DANGER]: "text-white dark:bg-red-500 dark:hover:bg-red-600 ",
      [VARIANTS.SUCCESS]:
        "text-white dark:bg-green-500 dark:hover:bg-green-600",
    }[variant];

    // Combine all classes
    const buttonClasses = `${baseClasses} ${variantClasses} ${className} ${
      disabled ? "opacity-50 cursor-not-allowed" : ""
    }`;

    return (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={buttonClasses}
        title={title}
      >
        <div className="flex items-center justify-center">
          {icon}
          {children}
        </div>
      </button>
    );
  }
);

Button.propTypes = {
  children: PropTypes.node,
  onClick: PropTypes.func,
  type: PropTypes.oneOf(["button", "submit", "reset"]),
  variant: PropTypes.oneOf(Object.values(VARIANTS)),
  disabled: PropTypes.bool,
  className: PropTypes.string,
  icon: PropTypes.node,
  title: PropTypes.string,
};

// Export both the component and the variants for use elsewhere
export { VARIANTS };
export default Button;
