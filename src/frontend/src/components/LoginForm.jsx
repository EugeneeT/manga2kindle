// components/LoginForm.jsx
import React, { memo } from "react";
import PropTypes from "prop-types";
import Card from "./common/Card";
import Input from "./common/Input";
import Button from "./common/Button";
import Alert, { ALERT_TYPES } from "./common/Alert";

/**
 * Login form component for user authentication
 * @param {Object} props - Component props
 * @returns {JSX.Element} Login form
 */
const LoginForm = memo(({
  onSubmit,
  credentials,
  setCredentials,
  error,
  isLoading,
}) => (
  <Card title="Welcome Back! Please Log In">
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
      
      <Button
        type="submit"
        disabled={isLoading}
      >
        {isLoading ? "Logging in..." : "Log In"}
      </Button>
    </form>
  </Card>
));

LoginForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  credentials: PropTypes.shape({
    username: PropTypes.string.isRequired,
    password: PropTypes.string.isRequired,
  }).isRequired,
  setCredentials: PropTypes.func.isRequired,
  error: PropTypes.string,
  isLoading: PropTypes.bool,
};

export default LoginForm;
