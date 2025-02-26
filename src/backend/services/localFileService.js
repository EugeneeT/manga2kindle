// src/backend/services/localFileService.js
import fs from "fs/promises";
import path from "path";

const createLocalFileService = (
  syncFolder = process.env.SYNC_DIR || "/sync"
) => {
  // Private variable for sync folder path
  const stConfigFolder = path.join(
    process.env.ST_HOME || "/home/appuser/.config/syncthing",
    "data"
  );

  console.log(`LocalFileService initialized with sync folder: ${syncFolder}`);

  const findFilesRecursively = async (dir) => {
    console.log(`Starting to search for files in ${dir}`);
    const files = [];

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          // Skip system directories and temporary folders
          if (
            !entry.name.startsWith(".") &&
            !["index-v0.14.0.db"].includes(entry.name)
          ) {
            const subFiles = await findFilesRecursively(fullPath);
            files.push(...subFiles);
          }
        } else if (
          entry.isFile() &&
          path.extname(entry.name).toLowerCase() === ".cbz"
        ) {
          // Get the parent folder name for manga title
          const parentDir = path.basename(path.dirname(fullPath));
          // Extract series name (everything before space, dash, or asterisk)
          const seriesName = parentDir.split(/[\s\-\*]/)[0];
          // Extract chapter number
          const chapterMatch = entry.name.match(/\d+/);
          const chapterNum = chapterMatch ? chapterMatch[0] : "";

          files.push({
            id: path.relative(syncFolder, fullPath),
            name: entry.name,
            path: fullPath,
            seriesName: seriesName,
            chapterNum: chapterNum,
            outputName: `${seriesName}${chapterNum}`,
          });
        }
      }
    } catch (error) {
      console.error(`Error reading directory ${dir}:`, error);
    }

    return files;
  };

  const findNewFiles = async () => {
    try {
      console.log(`Searching for files recursively in: ${syncFolder}`);
      const files = await findFilesRecursively(syncFolder);
      console.log(
        `Found CBZ files:`,
        files.map((f) => f.path)
      );
      return files;
    } catch (error) {
      console.error("Error finding new files:", error);
      throw error;
    }
  };

  const deleteFile = async (fileId) => {
    try {
      const filePath = path.join(syncFolder, fileId);
      const parentDir = path.dirname(filePath);

      // Delete the file first
      await fs.unlink(filePath);

      // Check if parent directory is empty
      const dirContents = await fs.readdir(parentDir);
      if (dirContents.length === 0) {
        // Delete parent directory if empty
        await fs.rmdir(parentDir);
        console.log(`Deleted empty parent directory: ${parentDir}`);
      }

      return true;
    } catch (error) {
      console.error("Error deleting file:", error);
      throw error;
    }
  };

  return {
    findNewFiles,
    deleteFile,
  };
};

export default createLocalFileService;
