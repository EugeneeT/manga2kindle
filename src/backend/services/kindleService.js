import nodemailer from "nodemailer";
import fs from "fs/promises";
import { stat } from "fs/promises";
import { AppError } from "../middleware/errorHandler.js";

const GMAIL_SIZE_LIMIT = 25 * 1024 * 1024; // 25MB in bytes

const createKindleService = (config) => {
  let transporter = null;
  let currentConfig = { ...config };

  const validateConfiguration = async (settings, strictValidation = false) => {
    const { smtpHost, smtpPort, smtpUser, smtpPass, kindleEmail } = settings;

    // If we're strictly validating (e.g., before sending email)
    if (strictValidation) {
      if (!smtpHost || !smtpPort || !smtpUser || !smtpPass || !kindleEmail) {
        throw new AppError(
          "Missing required email configuration",
          "ConfigError",
          400
        );
      }
    } else {
      // For settings updates, we'll be more lenient
      // Just store what we have and validate at send time
      if (!smtpHost && !smtpPort && !smtpUser && !smtpPass && !kindleEmail) {
        // If all are empty, just update the config without validation
        currentConfig = {
          ...currentConfig,
          smtpHost: smtpHost || currentConfig.smtpHost,
          smtpPort: smtpPort || currentConfig.smtpPort,
          smtpUser: smtpUser || currentConfig.smtpUser,
          smtpPass: smtpPass || currentConfig.smtpPass,
          kindleEmail: kindleEmail || currentConfig.kindleEmail,
        };
        return true;
      }
    }

    // Update current configuration
    currentConfig = {
      ...currentConfig,
      smtpHost: smtpHost || currentConfig.smtpHost,
      smtpPort: smtpPort || currentConfig.smtpPort,
      smtpUser: smtpUser || currentConfig.smtpUser,
      smtpPass: smtpPass || currentConfig.smtpPass,
      kindleEmail: kindleEmail || currentConfig.kindleEmail,
    };

    // Only test connection if we have all required fields
    if (smtpHost && smtpPort && smtpUser && smtpPass && kindleEmail) {
      // Test connection
      const testTransporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort),
        secure: parseInt(smtpPort) === 465, // Usually 465 for secure, not 587
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      try {
        await testTransporter.verify();
        transporter = testTransporter;
        return true;
      } catch (error) {
        if (strictValidation) {
          throw new AppError(
            `Failed to validate email configuration: ${error.message}`,
            "ConfigError",
            400
          );
        }
        // When not strict, just log the error but don't throw
        console.warn(`Email configuration warning: ${error.message}`);
        return false;
      }
    }

    return false;
  };

  const initializeTransporter = async () => {
    if (
      currentConfig.smtpHost &&
      currentConfig.smtpPort &&
      currentConfig.smtpUser &&
      currentConfig.smtpPass &&
      currentConfig.kindleEmail
    ) {
      await validateConfiguration({
        smtpHost: currentConfig.smtpHost,
        smtpPort: currentConfig.smtpPort,
        smtpUser: currentConfig.smtpUser,
        smtpPass: currentConfig.smtpPass,
        kindleEmail: currentConfig.kindleEmail,
      });
    }
  };

  const checkFileSize = async (filePath) => {
    const stats = await stat(filePath);
    return stats.size;
  };

  const sendToKindle = async (filePath) => {
    // Strict validation when actually trying to send
    if (!transporter) {
      await validateConfiguration(
        {
          smtpHost: currentConfig.smtpHost,
          smtpPort: currentConfig.smtpPort,
          smtpUser: currentConfig.smtpUser,
          smtpPass: currentConfig.smtpPass,
          kindleEmail: currentConfig.kindleEmail,
        },
        true
      ); // Pass true for strict validation

      if (!transporter) {
        throw new AppError(
          "Email transport not configured",
          "ConfigError",
          400
        );
      }
    }

    try {
      await fs.access(filePath);
      const fileSize = await checkFileSize(filePath);

      if (fileSize > GMAIL_SIZE_LIMIT) {
        throw new AppError(
          `File size (${(fileSize / 1024 / 1024).toFixed(
            2
          )}MB) exceeds Gmail's 25MB limit. Please reduce image quality or split the file.`,
          "FileSizeError",
          400
        );
      }

      const mailOptions = {
        from: currentConfig.smtpUser,
        to: currentConfig.kindleEmail,
        subject: "Convert",
        text: "Converted document attached",
        attachments: [
          {
            path: filePath,
          },
        ],
      };

      await transporter.sendMail(mailOptions);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        `Failed to send email: ${error.message}`,
        "EmailError",
        500
      );
    }
  };

  const sendBatch = async (filePaths) => {
    if (!Array.isArray(filePaths)) {
      throw new AppError("filePaths must be an array", "ValidationError", 400);
    }

    // Send files one by one
    for (const filePath of filePaths) {
      await sendToKindle(filePath);

      // Add a small delay between sends to avoid rate limiting
      if (filePaths.length > 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  };

  const cleanupSentFile = async (filePath) => {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      // If file doesn't exist, that's okay
      if (error.code !== "ENOENT") {
        throw new AppError(
          `Failed to cleanup file: ${error.message}`,
          "FileError",
          500
        );
      }
    }
  };

  const getConfiguration = () => ({
    smtpHost: currentConfig.smtpHost,
    smtpPort: currentConfig.smtpPort,
    smtpUser: currentConfig.smtpUser,
    kindleEmail: currentConfig.kindleEmail,
    isConfigured: !!transporter,
  });

  const updateConfiguration = async (newConfig) => {
    await validateConfiguration(newConfig);
    return getConfiguration();
  };

  // Initialize immediately
  initializeTransporter().catch(console.error);

  return {
    validateConfiguration,
    sendToKindle,
    sendBatch,
    cleanupSentFile,
    getConfiguration,
    updateConfiguration,
  };
};

export default createKindleService;
