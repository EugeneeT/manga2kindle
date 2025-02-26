// hooks/useStatus.js
import { useState, useEffect, useCallback } from "react";

// Poll interval in milliseconds
const STATUS_POLL_INTERVAL = 5000;

// Initial status state
const INITIAL_STATUS = {
  isProcessing: false,
  currentFile: null,
  stage: null,
  lastError: null,
  processedFiles: [],
  lastUpdated: null,
};

/**
 * Hook to manage processing status and history
 * @param {boolean} isAuthenticated - Whether the user is authenticated
 * @returns {Object} Status state and methods
 */
export const useStatus = (isAuthenticated) => {
  // Status state
  const [status, setStatus] = useState(INITIAL_STATUS);
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Get the auth header for API requests
   * @returns {Object} Headers with auth token
   */
  const getAuthHeaders = useCallback(() => {
    return {
      "Content-Type": "application/json", 
      Authorization: `Bearer ${localStorage.getItem("token")}`
    };
  }, []);

  /**
   * Fetch current processing status
   */
  const fetchStatus = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await fetch("/api/status", {
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch status");
      }
      
      const data = await response.json();
      setStatus({
        ...data,
        lastUpdated: new Date().toISOString()
      });
      setError(null);
    } catch (error) {
      console.error("Error fetching status:", error);
      setError(error.message);
    }
  }, [isAuthenticated, getAuthHeaders]);

  /**
   * Start the file processing
   * @returns {Promise<boolean>} Success status
   */
  const startProcessing = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/process", {
        method: "POST",
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to start processing");
      }
      
      const data = await response.json();
      
      if (data.currentStatus) {
        setStatus({
          ...data.currentStatus,
          lastUpdated: new Date().toISOString()
        });
      }
      
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error("Error starting process:", error);
      setError(error.message);
      setIsLoading(false);
      return false;
    }
  }, [getAuthHeaders]);

  /**
   * Clear processing history
   * @returns {Promise<boolean>} Success status
   */
  const clearHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/history/clear", {
        method: "POST",
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to clear history");
      }
      
      setStatus(prev => ({
        ...prev,
        processedFiles: [],
        lastUpdated: new Date().toISOString()
      }));
      
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error("Error clearing history:", error);
      setError(error.message);
      setIsLoading(false);
      return false;
    }
  }, [getAuthHeaders]);

  // Set up polling for status updates
  useEffect(() => {
    let pollInterval;

    if (isAuthenticated) {
      // Initial fetch
      fetchStatus();
      
      // Set up polling
      pollInterval = setInterval(fetchStatus, STATUS_POLL_INTERVAL);
    }

    // Clean up on unmount
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [isAuthenticated, fetchStatus]);

  return {
    status,
    isLoading,
    error,
    startProcessing,
    clearHistory,
  };
};
