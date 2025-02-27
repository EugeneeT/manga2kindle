// src/backend/services/historyService.js
import fs from "fs/promises";
import path from "path";

const createHistoryService = () => {
  const DATA_DIR = process.env.DATA_DIR || "./data";
  const HISTORY_FILE = path.join(DATA_DIR, "history.json");

  const ensureHistoryFile = async () => {
    try {
      await fs.access(HISTORY_FILE);

      // Read the current content to check its format
      const data = await fs.readFile(HISTORY_FILE, "utf8");
      const parsedData = JSON.parse(data);

      // If the file directly contains processedFiles array instead of being wrapped
      if (
        Array.isArray(parsedData) ||
        !parsedData.hasOwnProperty("processedFiles")
      ) {
        // Convert to the expected format
        await fs.writeFile(
          HISTORY_FILE,
          JSON.stringify(
            { processedFiles: Array.isArray(parsedData) ? parsedData : [] },
            null,
            2
          )
        );
      }
    } catch {
      // Create new file if it doesn't exist
      await fs.writeFile(HISTORY_FILE, JSON.stringify({ processedFiles: [] }));
    }
  };

  return {
    async getHistory() {
      await ensureHistoryFile();
      const data = await fs.readFile(HISTORY_FILE, "utf8");
      try {
        const parsedData = JSON.parse(data);
        // Handle both formats
        return Array.isArray(parsedData)
          ? parsedData
          : parsedData.processedFiles || [];
      } catch (e) {
        console.error("Error parsing history file:", e);
        return [];
      }
    },

    async saveHistory(processedFiles) {
      await ensureHistoryFile();
      await fs.writeFile(
        HISTORY_FILE,
        JSON.stringify({ processedFiles }, null, 2)
      );
    },

    async clearHistory() {
      await ensureHistoryFile();
      await fs.writeFile(
        HISTORY_FILE,
        JSON.stringify({ processedFiles: [] }, null, 2)
      );
    },

    async addToHistory(entry) {
      const history = await this.getHistory();
      history.unshift(entry);
      if (history.length > 10) {
        history.pop();
      }
      await this.saveHistory(history);
      return history;
    },
  };
};

export default createHistoryService;
