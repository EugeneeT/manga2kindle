// src/backend/services/authService.js
import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";
import { AppError } from "../middleware/errorHandler.js";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

const TOKEN_EXPIRY = "24h";

const createAuthService = () => {
  const generateToken = (username) => {
    return jwt.sign({ username }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
  };

  const verifyToken = (token) => {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        throw new AppError("Token expired", "AuthError", 401);
      }
      throw new AppError("Invalid token", "AuthError", 401);
    }
  };

  const initialize = async (username, password) => {
    const isInitialized = await userModel.isInitialized();
    if (isInitialized) {
      throw new AppError("System is already initialized", "AuthError", 400);
    }

    await userModel.createUser(username, password);
    return generateToken(username);
  };

  const login = async (username, password) => {
    const isValid = await userModel.validateCredentials(username, password);
    if (!isValid) {
      throw new AppError("Invalid credentials", "AuthError", 401);
    }

    return generateToken(username);
  };

  const changePassword = async (username, oldPassword, newPassword) => {
    const isValid = await userModel.validateCredentials(username, oldPassword);
    if (!isValid) {
      throw new AppError("Invalid current password", "AuthError", 401);
    }
    await userModel.updatePassword(username, newPassword);
  };

  return {
    generateToken,
    initialize,
    login,
    verifyToken,
    changePassword,
  };
};

export default createAuthService;
