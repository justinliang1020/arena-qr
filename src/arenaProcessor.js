import { getImageWithQR } from "./imageProcessor.js";

/**
 * Sets up the Arena block processing functionality.
 * Initializes event listeners and handlers for the UI components.
 */
export function setupArenaProcessor() {
  // Get DOM elements
  const arenaUrlInput = document.getElementById("arena-url");
  const generateBtn = document.getElementById("generate-btn");
  const loadingEl = document.getElementById("loading");
  const errorEl = document.getElementById("error");
  const resultEl = document.getElementById("result");
  const resultImage = document.getElementById("result-image");
  const downloadBtn = document.getElementById("download-btn");

  // Validate required elements exist
  if (
    !arenaUrlInput ||
    !generateBtn ||
    !loadingEl ||
    !errorEl ||
    !resultEl ||
    !resultImage ||
    !downloadBtn
  ) {
    throw new Error("Required DOM elements not found");
  }

  // Event handlers
  generateBtn.addEventListener("click", async () => {
    const url =
      arenaUrlInput instanceof HTMLInputElement
        ? arenaUrlInput.value.trim()
        : "";

    if (!url) {
      showError("Please enter an Are.na block URL");
      return;
    }

    // Show loading, hide other elements
    loadingEl.style.display = "block";
    errorEl.style.display = "none";
    resultEl.style.display = "none";

    try {
      // Get block data from Are.na
      const blockData = await getArenaBlockData(url);

      // Generate image with QR code
      const imageDataURL = await processArenaBlock(blockData);

      // Show result
      if (resultImage instanceof HTMLImageElement) {
        resultImage.src = imageDataURL;
      }
      resultEl.style.display = "flex";

      // Enable download button
      downloadBtn.onclick = () => {
        const link = document.createElement("a");
        link.href = imageDataURL;
        link.download = `arena-qr-${Date.now()}.jpg`;
        link.click();
      };
    } catch (error) {
      if (error instanceof Error) {
        showError(error.message);
      }
    } finally {
      loadingEl.style.display = "none";
    }
  });

  // Enable Enter key on the input field
  if (arenaUrlInput instanceof HTMLInputElement) {
    arenaUrlInput.addEventListener("keyup", (event) => {
      if (event.key === "Enter") {
        generateBtn.click();
      }
    });
  }

  /**
   * Displays an error message to the user.
   * @param {string} message - The error message to display.
   */
  function showError(message) {
    if (!errorEl) {
      throw new Error("Required DOM elements not found");
    }
    errorEl.textContent = message;
    errorEl.style.display = "block";
  }
}

/**
 * Fetches data for an Arena block from the API based on the provided URL.
 * @param {string} url - The URL of the Arena block to fetch.
 * @returns {Promise<Object>} The block data from the Arena API.
 * @throws {Error} If the URL is invalid or the request fails.
 */
async function getArenaBlockData(url) {
  try {
    // Extract block ID from URL
    const blockIdMatch =
      url.match(/are\.na\/.*\/.*\/([0-9]+)/) ||
      url.match(/are\.na\/block\/([0-9]+)/);

    if (!blockIdMatch || !blockIdMatch[1]) {
      throw new Error("Invalid Are.na URL. Please provide a valid block URL.");
    }

    const blockId = blockIdMatch[1];
    const response = await fetch(`https://api.are.na/v2/blocks/${blockId}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(
        "Failed to fetch Are.na block: " + (error.message || "Unknown error"),
      );
    }
    throw new Error("Failed to fetch Are.na block");
  }
}

/**
 * @typedef {Object} ArenaImage
 * @property {Object} original
 * @property {string} original.url
 */

/**
 * @typedef {Object} ArenaAttachment
 * @property {string} url
 */

/**
 * @typedef {Object} ArenaSource
 * @property {string} [url]
 */

/**
 * @typedef {Object} ArenaBlock
 * @property {ArenaImage} [image]
 * @property {ArenaAttachment} [attachment]
 * @property {ArenaSource} [source]
 * @property {string} [source_url]
 * @property {string} [generated_title]
 * @property {string} [title]
 */

/**
 * Processes an Arena block to extract image URL and generate a QR code.
 * @param {ArenaBlock} blockData - The Arena block data from the API.
 * @returns {Promise<string>} Data URL of the generated image with QR code.
 * @throws {Error} If processing fails or no image is found in the block.
 */
async function processArenaBlock(blockData) {
  try {
    // Get image from block data
    let imageUrl;

    if (blockData.image?.original?.url) {
      imageUrl = blockData.image.original.url;
    } else if (blockData.attachment?.url) {
      imageUrl = blockData.attachment.url;
    } else {
      throw new Error("No image found in this Are.na block");
    }

    // Get QR code data (URL or title from the block)
    const qrData =
      blockData.source?.url ||
      blockData.source_url ||
      blockData.generated_title ||
      blockData.title ||
      window.location.href;

    // Generate combined image
    return await getImageWithQR(imageUrl, qrData);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to process Are.na block: ${error.message}`);
    }
    throw new Error("Failed to process Are.na block: Unknown error");
  }
}
