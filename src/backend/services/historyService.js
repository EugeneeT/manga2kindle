// src/backend/services/historyService.js
import fs from "fs/promises";
import path from "path";

const createHistoryService = () => {
  const DATA_DIR = process.env.DATA_DIR || "/app/data";
  const HISTORY_FILE = path.join(DATA_DIR, "history.json");

  const ensureHistoryFile = async () => {
    try {
      await fs.access(HISTORY_FILE);
    } catch {
      await fs.writeFile(HISTORY_FILE, JSON.stringify({ processedFiles: [] }));
    }
  };

  return {
    async getHistory() {
      await ensureHistoryFile();
      const data = await fs.readFile(HISTORY_FILE, "utf8");
      return JSON.parse(data).processedFiles;
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
