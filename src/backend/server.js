// src/backend/server.js
// Import dependencies
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import cors from "cors";

// Services
import createLocalFileService from "./services/localFileService.js";
import createConversionService from "./services/conversionService.js";
import createKindleService from "./services/kindleService.js";
import createSettingsService from "./services/settingsService.js";
import createHistoryService from "./services/historyService.js";
import createImageSettingsService from "./services/imageSettingsService.js";

// Controllers
import createMainController from "./controllers/mainController.js";
import createSettingsController from "./controllers/settingsController.js";
import createAuthController from "./controllers/authController.js";
import createImageSettingsController from "./controllers/imageSettingsController.js";

// Middleware
import { authMiddleware } from "./middleware/auth.js";
import { errorHandler } from "./middleware/errorHandler.js";

// Models
import userModel from "./models/userModel.js";

// Load environment variables
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const createServer = async () => {
  // Initialize Express app
  const app = express();

  // Apply middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Configure CORS
  const corsOptions = {
    origin:
      process.env.NODE_ENV === "production"
        ? ["http://localhost:3000", process.env.ALLOWED_ORIGIN || ""]
        : "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    maxAge: 86400, // 24 hours
  };
  app.use(cors(corsOptions));

  // Serve static files
  app.use(express.static(path.join(__dirname, "../frontend/build")));

  // Initialize user system
  await userModel.init();

  // Initialize services with proper order
  const settingsService = createSettingsService();
  await settingsService.ensureSettingsFile(); // Ensure settings exist before other services

  const imageSettingsService = createImageSettingsService();
  await imageSettingsService.ensureSettingsFile(); // Ensure image settings exist

  const localFileService = createLocalFileService();
  const conversionService = createConversionService(
    "/data",
    imageSettingsService
  );

  // Get settings for Kindle service
  const settings = await settingsService.getSettings();
  const kindleService = createKindleService({
    smtpHost: process.env.SMTP_HOST,
    smtpPort: parseInt(process.env.SMTP_PORT) || 587,
    smtpUser: settings.smtpUser || process.env.SMTP_USER,
    smtpPass: settings.smtpPass || process.env.SMTP_PASS,
    kindleEmail: settings.kindleEmail || process.env.KINDLE_EMAIL,
  });

  const historyService = createHistoryService(settingsService);

  // Initialize controllers
  const settingsController = createSettingsController(
    settingsService,
    kindleService
  );

  const imageSettingsController =
    createImageSettingsController(imageSettingsService);

  const mainController = createMainController(
    localFileService,
    conversionService,
    kindleService,
    settingsService,
    historyService
  );

  // Get auth controller routes
  const authController = createAuthController();

  // Set up routes with auth middleware applied correctly
  app.use("/api/auth", authController);

  // Apply protection middleware to routes that need it
  app.use("/api/settings", authMiddleware, settingsController);
  app.use("/api/image-settings", authMiddleware, imageSettingsController);
  app.use("/api", mainController.getRouter()); // Assuming main controller has its own auth checks

  // Catch-all route for the React app
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/build/index.html"));
  });

  // Error handling middleware
  app.use(errorHandler);

  // Initialize conversion service
  await conversionService.initialize();
  console.log("Conversion service initialized");

  return app;
};

// Start server
const startServer = async () => {
  try {
    const app = await createServer();
    const PORT = process.env.PORT || 3000;

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
