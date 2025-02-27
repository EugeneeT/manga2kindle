// src/backend/models/userModel.js
import bcrypt from "bcrypt";
import fs from "fs/promises";
import path from "path";

const DATA_DIR = process.env.DATA_DIR || "/app/data";
const USER_FILE = path.join(DATA_DIR, "user.json");

const userModel = {
  async init() {
    try {
      // Ensure the data directory exists
      try {
        await fs.access(DATA_DIR);
      } catch {
        await fs.mkdir(DATA_DIR, { recursive: true });
      }

      // Check if user file exists
      try {
        await fs.access(USER_FILE);
        // Validate the file content
        const data = await fs.readFile(USER_FILE, "utf8");
        JSON.parse(data); // Will throw if invalid JSON
      } catch (error) {
        // Create or reset the user file if it doesn't exist or is invalid
        await fs.writeFile(
          USER_FILE,
          JSON.stringify({ isInitialized: false }, null, 2)
        );
      }
    } catch (error) {
      console.error("Error initializing user model:", error);
      throw new Error("Failed to initialize user system");
    }
  },

  async isInitialized() {
    try {
      const data = await fs.readFile(USER_FILE, "utf8");
      const user = JSON.parse(data);
      return Boolean(user.isInitialized);
    } catch (error) {
      console.error("Error checking initialization status:", error);
      return false;
    }
  },

  async createUser(username, password) {
    if (!username || !password) {
      throw new Error("Username and password are required");
    }

    try {
      const isInit = await this.isInitialized();
      if (isInit) {
        throw new Error("System is already initialized");
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const userData = {
        username,
        password: hashedPassword,
        isInitialized: true,
        createdAt: new Date().toISOString(),
      };

      await fs.writeFile(USER_FILE, JSON.stringify(userData, null, 2));
      return { username, createdAt: userData.createdAt };
    } catch (error) {
      console.error("Error creating user:", error);
      throw new Error(error.message || "Failed to create user");
    }
  },

  async validateCredentials(username, password) {
    try {
      const data = await fs.readFile(USER_FILE, "utf8");
      const user = JSON.parse(data);

      if (!user.isInitialized || user.username !== username) {
        return false;
      }

      return bcrypt.compare(password, user.password);
    } catch (error) {
      console.error("Error validating credentials:", error);
      return false;
    }
  },

  async updatePassword(username, newPassword) {
    try {
      const data = await fs.readFile(USER_FILE, "utf8");
      const user = JSON.parse(data);

      if (user.username !== username) {
        throw new Error("User not found");
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      user.password = hashedPassword;

      await fs.writeFile(USER_FILE, JSON.stringify(user, null, 2));
      return true;
    } catch (error) {
      console.error("Error updating password:", error);
      throw new Error("Failed to update password");
    }
  },
};

export default userModel;
