// hooks/useAuth.js
import { useState, useEffect, useCallback } from "react";

// Constants
const SESSION_EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const SESSION_BUFFER_TIME = 300000; // 5 minutes buffer for expiry check

/**
 * Authentication hook to manage user session and auth state
 * @returns {Object} Authentication state and methods
 */
export const useAuth = () => {
  // State to track authentication status
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    isInitialized: false,
    loginError: "",
    loginAttempts: 0,
  });

  /**
   * Verify if session is still valid
   * @param {string} sessionString - JSON string containing session info
   * @returns {boolean} Whether session is valid
   */
  const isSessionValid = useCallback((sessionString) => {
    try {
      const { expiry } = JSON.parse(sessionString);
      return new Date(expiry).getTime() - SESSION_BUFFER_TIME > Date.now();
    } catch (e) {
      console.error("Error parsing session:", e);
      return false;
    }
  }, []);

  /**
   * Create a new session
   * @returns {Object} Session object
   */
  const createSession = useCallback(() => {
    return {
      expiry: new Date(Date.now() + SESSION_EXPIRY_TIME).toISOString(),
    };
  }, []);

  /**
   * Clear stored auth data
   */
  const clearStoredAuth = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("session");
  }, []);

  /**
   * Verify token validity with the server
   * @returns {Promise<boolean>} Token validity
   */
  const verifyTokenWithServer = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        return false;
      }

      // Use the token refresh endpoint to verify if the token is valid
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Invalid token");
      }

      // If we got here, token is valid, update it with the new one
      const data = await response.json();
      localStorage.setItem("token", data.token);
      localStorage.setItem("session", JSON.stringify(createSession()));

      return true;
    } catch (error) {
      console.error("Token verification failed:", error);
      clearStoredAuth();
      return false;
    }
  }, [clearStoredAuth, createSession]);

  /**
   * Check authentication status from server or local storage
   * @returns {Promise<boolean>} Authentication status
   */
  const checkAuthStatus = useCallback(async () => {
    try {
      // First, check if the system is initialized at all
      const statusResponse = await fetch("/api/auth/status");

      if (!statusResponse.ok) {
        throw new Error("Failed to get auth status");
      }

      const statusData = await statusResponse.json();

      // If system is not initialized, clear any existing tokens and return
      if (!statusData.isInitialized) {
        clearStoredAuth();
        setAuthState((prev) => ({
          ...prev,
          isInitialized: false,
          isAuthenticated: false,
        }));
        return false;
      }

      // System is initialized, now check if we have a valid token
      const token = localStorage.getItem("token");
      const session = localStorage.getItem("session");

      // If we have a token and session, check if session is valid locally first
      if (token && session && isSessionValid(session)) {
        // Then verify with the server that the token is still valid
        const isValid = await verifyTokenWithServer();

        setAuthState((prev) => ({
          ...prev,
          isInitialized: true,
          isAuthenticated: isValid,
        }));

        return isValid;
      } else {
        // No valid token or session, clear any existing ones
        clearStoredAuth();
        setAuthState((prev) => ({
          ...prev,
          isInitialized: true,
          isAuthenticated: false,
        }));
        return false;
      }
    } catch (error) {
      console.error("Failed to check auth status:", error);
      clearStoredAuth();
      setAuthState((prev) => ({
        ...prev,
        isAuthenticated: false,
      }));
      return false;
    }
  }, [clearStoredAuth, isSessionValid, verifyTokenWithServer]);

  /**
   * Handle user login
   * @param {Object} credentials - User credentials
   * @returns {Promise<boolean>} Login success status
   */
  const handleLogin = useCallback(
    async (credentials) => {
      try {
        // Clear any existing auth data before attempting login
        clearStoredAuth();

        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credentials),
        });

        if (!response.ok) {
          throw new Error("Invalid credentials");
        }

        const data = await response.json();

        if (!data.token) {
          throw new Error("No token received");
        }

        // Store auth data
        localStorage.setItem("token", data.token);
        localStorage.setItem("session", JSON.stringify(createSession()));

        // Update state
        setAuthState((prev) => ({
          ...prev,
          isAuthenticated: true,
          loginAttempts: 0,
          loginError: "",
        }));

        return true;
      } catch (error) {
        setAuthState((prev) => ({
          ...prev,
          loginAttempts: prev.loginAttempts + 1,
          loginError: error.message || "Invalid credentials",
        }));
        return false;
      }
    },
    [clearStoredAuth, createSession]
  );

  /**
   * Handle user logout
   */
  const handleLogout = useCallback(() => {
    clearStoredAuth();
    setAuthState((prev) => ({
      ...prev,
      isAuthenticated: false,
      loginError: "",
    }));
  }, [clearStoredAuth]);

  // Check auth status on initial load
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  return {
    authState,
    handleLogin,
    handleLogout,
    checkAuthStatus,
  };
};
