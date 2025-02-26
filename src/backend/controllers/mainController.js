// src/backend/controllers/mainController.js
import { Router } from "express";
import cron from "node-cron";
import { authMiddleware } from "../middleware/auth.js";
import { AppError } from "../middleware/errorHandler.js";

const createMainController = (
  localFileService,
  conversionService,
  kindleService,
  settingsService,
  historyService
) => {
  const router = Router();
  let cronJob = null;

  const currentStatus = {
    isProcessing: false,
    currentFile: null,
    stage: null,
    lastRun: null,
    lastError: null,
    processedFiles: [],
  };

  // Load initial history
  const initialize = async () => {
    currentStatus.processedFiles = await historyService.getHistory();
    await scheduleCron();
  };

  const updateStatus = async (update) => {
    Object.assign(currentStatus, {
      ...update,
      lastUpdated: new Date().toISOString(),
    });

    // Only save to history when a file is successfully processed or failed
    if (update.processedFiles?.length > 0) {
      const lastEntry = update.processedFiles[0];
      await historyService.addToHistory(lastEntry);
    }
  };

  const processFiles = async () => {
    if (currentStatus.isProcessing) {
      console.log("Process already running");
      return;
    }

    try {
      await updateStatus({
        isProcessing: true,
        stage: "finding_files",
        currentFile: null,
        lastError: null,
      });

      const files = await localFileService.findNewFiles();

      if (files.length === 0) {
        await updateStatus({
          isProcessing: false,
          stage: "completed",
          currentFile: null,
          lastRun: new Date().toISOString(),
        });
        return;
      }

      for (const file of files) {
        try {
          await updateStatus({ currentFile: file.name, stage: "converting" });
          const epubPath = await conversionService.convertToEpub(
            file.path,
            file.outputName
          );

          await updateStatus({ stage: "sending_to_kindle" });
          await kindleService.sendToKindle(epubPath);

          await updateStatus({ stage: "cleaning_up" });
          await localFileService.deleteFile(file.id);

          // Add single entry to history
          await historyService.addToHistory({
            name: file.name,
            processedAt: new Date().toISOString(),
            status: "success",
            seriesName: file.seriesName || "Unknown Series",
          });
        } catch (processError) {
          console.error(`Error processing file ${file.name}:`, processError);
          await historyService.addToHistory({
            name: file.name,
            processedAt: new Date().toISOString(),
            status: "error",
            error: processError.message,
            seriesName: file.seriesName || "Unknown Series",
          });

          await updateStatus({
            lastError: `Error processing ${file.name}: ${processError.message}`,
          });
        }
      }
    } catch (error) {
      const appError =
        error instanceof AppError ? error : new AppError(error.message);
      throw appError;
    } finally {
      await updateStatus({
        isProcessing: false,
        stage: "completed",
        currentFile: null,
        lastRun: new Date().toISOString(),
      });
    }
  };

  const scheduleCron = async () => {
    if (cronJob) {
      cronJob.stop();
    }

    const settings = await settingsService.getSettings();
    const checkInterval = settings.checkInterval || 30;

    const cronExpression = `*/${checkInterval} * * * *`;
    cronJob = cron.schedule(cronExpression, () => {
      processFiles().catch((error) => {
        console.error("Cron job error:", error);
        updateStatus({
          lastError: `Scheduled process error: ${error.message}`,
          isProcessing: false,
        }).catch(console.error);
      });
    });
    console.log(`Cron job scheduled with interval: ${checkInterval} minutes`);
  };

  // Initialize immediately
  initialize().catch((error) => {
    console.error("Initialization error:", error);
  });

  // API Routes
  router.get("/status", authMiddleware, (req, res) => {
    res.json(currentStatus);
  });

  router.post("/process", authMiddleware, async (req, res) => {
    try {
      if (currentStatus.isProcessing) {
        return res
          .status(409)
          .json({ error: "Process already running", currentStatus });
      }

      processFiles().catch((error) => {
        console.error("Process error:", error);
        updateStatus({
          lastError: `Manual process error: ${error.message}`,
          isProcessing: false,
        }).catch(console.error);
      });

      res.json({ message: "Processing started", currentStatus });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post("/history/clear", authMiddleware, async (req, res) => {
    try {
      await historyService.clearHistory();
      await updateStatus({ processedFiles: [] });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return {
    getRouter: () => router,
    processFiles,
    getCurrentStatus: () => ({ ...currentStatus }),
  };
};

export default createMainController;
