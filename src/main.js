import "./style.css";
import {
  getArenaBlockData,
  createArenaqrImageDataURL,
} from "./arenaProcessor.js";

// Get DOM elements
const arenaUrlInput = document.getElementById("arena-url");
const generateBtn = document.getElementById("generate-btn");
const exampleBtn = document.getElementById("example-btn");
const loadingEl = document.getElementById("loading");
const errorEl = document.getElementById("error");
const resultEl = document.getElementById("result");
const resultImage = document.getElementById("result-image");
const downloadBtn = document.getElementById("download-btn");

if (!generateBtn || !exampleBtn) {
  throw new Error("Required DOM elements not found");
}

// Event handlers
generateBtn.addEventListener("click", async () => {
  const url =
    arenaUrlInput instanceof HTMLInputElement ? arenaUrlInput.value.trim() : "";
  generateArenaqrImage(url);
});

exampleBtn.addEventListener("click", async () => {
  const urls = [
    "https://www.are.na/block/35251863",
    "https://www.are.na/block/35284311",
    "https://www.are.na/block/35021175",
    "https://www.are.na/block/34879567",
    "https://www.are.na/block/33647520",
  ];
  const url = urls[Math.floor(Math.random() * urls.length)];
  if (arenaUrlInput instanceof HTMLInputElement) {
    arenaUrlInput.value = url;
  }
  generateArenaqrImage(url);
});

/**
 * @param {string} url
 */
async function generateArenaqrImage(url) {
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
  // Show loading, hide other elements
  loadingEl.style.display = "block";
  errorEl.style.display = "none";
  resultEl.style.display = "none";

  try {
    // Get block data from Are.na
    const blockData = await getArenaBlockData(url);

    console.log(blockData);

    // Generate image with QR code
    const imageDataURL = await createArenaqrImageDataURL(blockData, url);

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
}

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
