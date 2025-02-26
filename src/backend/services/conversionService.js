// src/backend/services/conversionService.js
import fs from "fs/promises";
import { createReadStream, existsSync } from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import Epub from "epub-gen";
import { mkdir } from "fs/promises";
import { Extract } from "unzipper";

const execAsync = promisify(exec);

const createConversionService = (
  baseDir = "/data",
  imageSettingsService = null
) => {
  const tempDir = path.join("/app", ".temp");

  const initialize = async () => {
    try {
      await mkdir(tempDir, { recursive: true });
      await mkdir(path.join(tempDir, "epub"), { recursive: true });
      await mkdir(path.join(tempDir, "extract"), { recursive: true });

      const { stdout } = await execAsync("convert -version");
      console.log("ImageMagick version:", stdout.split("\n")[0]);
    } catch (error) {
      if (error.message.includes("convert -version")) {
        throw new Error("ImageMagick dependency missing");
      }
      throw new Error(
        `Failed to initialize conversion service: ${error.message}`
      );
    }
  };

  const extractCbz = async (cbzPath) => {
    const extractDir = path.join(
      tempDir,
      "extract",
      `${path.basename(cbzPath, ".cbz")}_${Date.now()}`
    );
    await mkdir(extractDir, { recursive: true });

    await new Promise((resolve, reject) => {
      createReadStream(cbzPath)
        .pipe(Extract({ path: extractDir }))
        .on("error", reject)
        .on("close", resolve);
    });

    const files = await fs.readdir(extractDir);
    const imageFiles = sortImageFiles(files.filter(isValidImageFile));

    if (imageFiles.length === 0) {
      throw new Error("No valid images found in CBZ file");
    }

    return {
      extractDir,
      imageFiles: imageFiles.map((file) => path.join(extractDir, file)),
    };
  };

  const processImage = async (imagePath, index, extractDir, imageSettings) => {
    const outputJpg = path.join(extractDir, `processed_${index}.jpg`);
    const imageInfo = await getImageInfo(imagePath);
    const command = buildImageMagickCommand(
      imagePath,
      outputJpg,
      imageInfo,
      imageSettings
    );

    await execAsync(command);

    if (!existsSync(outputJpg)) {
      throw new Error(`Failed to process image: ${imagePath}`);
    }

    return outputJpg;
  };

  const convertToEpub = async (cbzPath, outputName) => {
    try {
      const { extractDir, imageFiles } = await extractCbz(cbzPath);
      const outputPath = path.join(tempDir, "epub", `${outputName}.epub`);

      // Get active image processing settings
      let imageSettings = null;
      if (imageSettingsService) {
        try {
          imageSettings = await imageSettingsService.getActivePreset();
        } catch (settingsError) {
          console.warn(
            "Failed to load image settings, using defaults:",
            settingsError.message
          );
        }
      }

      const processedImages = await processBatchedImages(
        imageFiles,
        extractDir,
        imageSettings
      );
      await createEpubFile(processedImages, cbzPath, outputPath);

      await fs.rm(extractDir, { recursive: true });
      return outputPath;
    } catch (error) {
      throw new Error(`EPUB conversion failed: ${error.message}`);
    }
  };

  const cleanup = async () => {
    try {
      await fs.rm(tempDir, { recursive: true });
      await initialize();
    } catch (error) {
      console.error("Cleanup failed:", error);
    }
  };

  const isValidImageFile = (file) => {
    const validExtensions = /\.(jpg|jpeg|png|gif|webp|bmp|tiff)$/i;
    return validExtensions.test(file) && !file.startsWith(".");
  };

  const sortImageFiles = (files) => {
    return files.sort((a, b) => {
      const getNumber = (filename) => {
        const match = filename.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
      };
      const aNum = getNumber(a);
      const bNum = getNumber(b);
      return aNum === bNum ? a.localeCompare(b) : aNum - bNum;
    });
  };

  const getImageInfo = async (imagePath) => {
    const { stdout } = await execAsync(
      `identify -format "%w %h %[colorspace]" "${imagePath}"`
    );
    return stdout.trim().split(" ");
  };

  const buildImageMagickCommand = (
    inputPath,
    outputPath,
    imageInfo,
    imageSettings = null
  ) => {
    const [, , colorspace] = imageInfo;
    let command = `convert "${inputPath}" `;

    // Default settings if no image settings provided
    const defaultSettings = {
      resize: {
        width: 1600,
        height: 2400,
        enabled: true,
      },
      colorspaceConversion: true,
      level: {
        blackPoint: 5,
        whitePoint: 90,
        gamma: 1.2,
        enabled: true,
      },
      contrast: {
        enabled: true,
      },
      sharpen: {
        radius: 0,
        sigma: 0.5,
        enabled: true,
      },
      quality: 100,
    };

    // Use provided settings or defaults
    const settings = imageSettings || defaultSettings;

    // Resize
    if (settings.resize?.enabled) {
      const width = settings.resize.width || 1600;
      const height = settings.resize.height || 2400;
      command += `-resize ${width}x${height}\\> `;
    }

    // Colorspace conversion
    if (settings.colorspaceConversion && colorspace === "CMYK") {
      command += `-colorspace sRGB `;
    }

    // Level adjustment
    if (settings.level?.enabled) {
      const blackPoint = settings.level.blackPoint || 5;
      const whitePoint = settings.level.whitePoint || 90;
      const gamma = settings.level.gamma || 1.2;
      command += `-level ${blackPoint}%,${whitePoint}%,${gamma} `;
    }

    // Contrast-stretch
    if (settings.contrastStretch?.enabled) {
      const black = settings.contrastStretch.black || 0;
      const white = settings.contrastStretch.white || 1;
      command += `-contrast-stretch ${black}%x${white}% `;
    }

    // Brightness-contrast
    if (settings.brightnessContrast?.enabled) {
      const brightness = settings.brightnessContrast.brightness || 0;
      const contrast = settings.brightnessContrast.contrast || 0;
      command += `-brightness-contrast ${brightness}x${contrast} `;
    }

    // Black threshold
    if (settings.blackThreshold?.enabled) {
      const threshold = settings.blackThreshold.threshold || 50;
      command += `-black-threshold ${threshold}% `;
    }

    // Basic contrast
    if (settings.contrast?.enabled) {
      command += `-contrast `;
    }

    // Sharpening
    if (settings.sharpen?.enabled) {
      const radius = settings.sharpen.radius || 0;
      const sigma = settings.sharpen.sigma || 0.5;
      command += `-sharpen ${radius}x${sigma} `;
    }

    // Quality
    const quality = settings.quality || 100;
    command += `-quality ${quality} `;

    command += `"${outputPath}"`;
    return command;
  };

  const processBatchedImages = async (
    imageFiles,
    extractDir,
    imageSettings = null
  ) => {
    const batchSize = 5;
    const processedImages = [];

    for (let i = 0; i < imageFiles.length; i += batchSize) {
      const batch = imageFiles.slice(i, i + batchSize);
      const batchPromises = batch.map((imagePath, batchIndex) =>
        processImage(imagePath, i + batchIndex, extractDir, imageSettings)
      );
      const batchResults = await Promise.all(batchPromises);
      processedImages.push(...batchResults);
    }

    return processedImages;
  };

  const createEpubFile = async (processedImages, cbzPath, outputPath) => {
    const options = {
      title: path.basename(cbzPath, ".cbz"),
      author: "Converted by CBZ Converter",
      publisher: "CBZ Converter",
      content: processedImages.map((imagePath, index) => ({
        data: `<div style="text-align: center;"><img src="${imagePath}" alt="Page ${
          index + 1
        }" style="max-width: 100%; height: auto;"/></div>`,
        includeInSpine: true,
      })),
      appendChapterTitles: false,
      tocTitle: "",
      excludeFromToc: true,
      customOpfTemplatePath: null,
      customNcxTocTemplatePath: null,
      verbose: false,
      tempDir: path.join(tempDir, "epub"),
    };

    await new Epub(options, outputPath).promise;
  };

  return {
    initialize,
    convertToEpub,
    cleanup,
  };
};

export default createConversionService;
