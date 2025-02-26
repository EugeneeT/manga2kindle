// src/backend/controllers/authController.js
import { Router } from "express";
import createAuthService from "../services/authService.js";
import userModel from "../models/userModel.js";
import { authMiddleware } from "../middleware/auth.js";

const createAuthController = () => {
  const router = Router();
  const authService = createAuthService();

  router.post("/initialize", async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res
          .status(400)
          .json({ error: "Username and password are required" });
      }

      // Check if system is already initialized
      const isInitialized = await userModel.isInitialized();
      if (isInitialized) {
        return res.status(400).json({ error: "System is already initialized" });
      }

      // Create user and generate token
      await userModel.createUser(username, password);
      const token = await authService.generateToken(username);

      res.json({ token, message: "System initialized successfully" });
    } catch (error) {
      console.error("Initialization error:", error);
      res.status(400).json({ error: error.message || "Initialization failed" });
    }
  });

  router.post("/refresh", authMiddleware, async (req, res) => {
    try {
      const { username } = req.user;
      const newToken = await authService.generateToken(username);
      res.json({ token: newToken });
    } catch (error) {
      res.status(401).json({ error: "Failed to refresh token" });
    }
  });

  router.post("/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const token = await authService.login(username, password);
      res.json({ token });
    } catch (error) {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  router.get("/status", async (req, res) => {
    try {
      const isInitialized = await userModel.isInitialized();
      res.json({ isInitialized });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post("/change-password", authMiddleware, async (req, res) => {
    try {
      const { oldPassword, newPassword } = req.body;
      const { username } = req.user;

      await authService.changePassword(username, oldPassword, newPassword);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  return router;
};

export default createAuthController;
