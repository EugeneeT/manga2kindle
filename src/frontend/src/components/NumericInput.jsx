// components/NumericInput.jsx
import React, { memo } from "react";
import PropTypes from "prop-types";
import Input from "./common/Input";

/**
 * Specialized input component for numeric values
 * @param {Object} props - Component props
 * @returns {JSX.Element} Numeric input field
 */
const NumericInput = memo(({
  label,
  value,
  onChange,
  disabled = false,
  min,
  max,
  step = 1,
  className = "",
}) => (
  <Input
    type="number"
    label={label}
    value={value}
    onChange={onChange}
    disabled={disabled}
    min={min}
    max={max}
    step={step}
    className={className}
  />
));

NumericInput.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  min: PropTypes.number,
  max: PropTypes.number,
  step: PropTypes.number,
  className: PropTypes.string,
};

export default NumericInput;
