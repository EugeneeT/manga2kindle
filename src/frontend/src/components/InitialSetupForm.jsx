// components/InitialSetupForm.jsx
import React, { memo } from "react";
import PropTypes from "prop-types";
import Card from "./common/Card";
import Input from "./common/Input";
import Button from "./common/Button";
import Alert, { ALERT_TYPES } from "./common/Alert";

/**
 * Initial setup form for creating the first admin account
 * @param {Object} props - Component props
 * @returns {JSX.Element} Initial setup form
 */
const InitialSetupForm = memo(({
  onSubmit,
  credentials,
  setCredentials,
  error,
  isLoading,
}) => (
  <Card title="Welcome! Create Your Admin Account">
    {error && <Alert type={ALERT_TYPES.ERROR} message={error} />}
    
    <form onSubmit={onSubmit} className="space-y-4">
      <Input
        type="text"
        label="Username"
        value={credentials.username}
        onChange={(value) => 
          setCredentials((prev) => ({ ...prev, username: value }))
        }
        required
      />
      
      <Input
        type="password"
        label="Password"
        value={credentials.password}
        onChange={(value) => 
          setCredentials((prev) => ({ ...prev, password: value }))
        }
        required
      />
      
      <Input
        type="password"
        label="Confirm Password"
        value={credentials.confirmPassword || ""}
        onChange={(value) => 
          setCredentials((prev) => ({ ...prev, confirmPassword: value }))
        }
        required
      />
      
      <Button
        type="submit"
        disabled={isLoading}
      >
        {isLoading ? "Creating Account..." : "Create Account"}
      </Button>
    </form>
  </Card>
));

InitialSetupForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  credentials: PropTypes.shape({
    username: PropTypes.string.isRequired,
    password: PropTypes.string.isRequired,
    confirmPassword: PropTypes.string,
  }).isRequired,
  setCredentials: PropTypes.func.isRequired,
  error: PropTypes.string,
  isLoading: PropTypes.bool,
};

export default InitialSetupForm;
