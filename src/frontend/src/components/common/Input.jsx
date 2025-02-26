// common/Input.jsx
import React, { memo } from "react";
import PropTypes from "prop-types";

/**
 * Reusable Input component with consistent styling
 * @param {Object} props - Component props
 * @returns {JSX.Element} Styled input component
 */
const Input = memo(
  ({
    type = "text",
    label,
    value,
    onChange,
    onKeyDown,
    required = false,
    disabled = false,
    placeholder = "",
    className = "",
    min,
    max,
    step,
    id,
  }) => {
    // Handle change with proper parsing for number inputs
    const handleChange = (e) => {
      const newValue = e.target.value;

      if (type === "number" && newValue !== "" && onChange) {
        // Parse as float if step is decimal, otherwise as int
        const parsedValue =
          step && step < 1 ? parseFloat(newValue) : parseInt(newValue, 10);
        onChange(parsedValue);
      } else if (onChange) {
        onChange(newValue);
      }
    };

    // For controlled inputs that update objects
    const handleObjectChange = (e) => {
      if (onChange) {
        onChange((prev) => ({ ...prev, [id]: e.target.value }));
      }
    };

    return (
      <div className={className}>
        {label && (
          <label className="block text-sm m- dark:text-gray-300">{label}</label>
        )}
        <input
          type={type}
          value={value}
          onChange={id ? handleObjectChange : handleChange}
          onKeyDown={onKeyDown}
          className="border p-2 w-full rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
          id={id}
        />
      </div>
    );
  }
);

Input.propTypes = {
  type: PropTypes.string,
  label: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  onKeyDown: PropTypes.func,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  placeholder: PropTypes.string,
  className: PropTypes.string,
  min: PropTypes.number,
  max: PropTypes.number,
  step: PropTypes.number,
  id: PropTypes.string,
};

export default Input;
