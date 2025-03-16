import QRCode from "qrcode";

/**
 * @typedef {Object} ContentOptions
 * @property {number} canvasWidth=800 - Fixed width of the generated canvas
 * @property {number} canvasHeight=500 - Fixed height of the generated canvas
 * @property {number} contentWidth=600 - Width of the content area (left side)
 * @property {number} metadataWidth=200 - Width of the metadata area (right side)
 * @property {number} frameWidth=1 - Width of the border frame in pixels
 * @property {string} frameColor="#e7e7e5" - Color of the frame
 * @property {string} borderColor="#000" - Color of the border
 * @property {number} padding=20 - Padding around content in pixels
 * @property {number} titleFontSize=18 - Font size for the title
 * @property {string} titleFontFamily=["Arial, sans-serif"] - Font family for the title
 * @property {string} titleColor="#333" - Color for the title text
 * @property {number} qrCodeSize=150 - QR code size
 * @property {number} qrCodeMargin=1 - QR code margin/padding
 * @property {Object} qrCodeColor - QR code colors
 * @property {string} qrCodeColor.dark="#000000" - QR code dark color
 * @property {string} qrCodeColor.light="#ffffff" - QR code light color
 * @property {number} spaceBetween=15 - Space between elements in pixels
 * @property {string} backgroundColor="#fff" - Background color
 */

/**
 * @typedef {Object} ImageContent
 * @property {string} type - Content type (set to "image")
 * @property {string} imageUrl - The URL of the image to load
 * @property {string} [displayUrl] - The display URL version of the image (if available)
 * @property {string} [title] - Title to display in the metadata section
 */

/**
 * @typedef {Object} TextContent
 * @property {string} type - Content type (set to "text")
 * @property {string} text - The text content
 * @property {string} [title] - Title to display in the metadata section
 */

/**
 * @typedef {ImageContent|TextContent} Content
 */

/**
 * Generates content with a QR code in a fixed-size layout.
 * @param {Content} content - The content to render (image or text)
 * @param {string} qrData - The data to encode in the QR code
 * @returns {Promise<string>} Data URL of the combined content with QR code
 * @throws {Error} If content loading or QR code generation fails
 */
export async function generateContentWithQR(content, qrData) {
  /** @type {ContentOptions} */
  const settings = {
    canvasWidth: 800,
    canvasHeight: 500,
    contentWidth: 600, // 75% of the canvas width
    metadataWidth: 200, // 25% of the canvas width
    frameWidth: 1,
    frameColor: "#e7e7e5", // Arena's light gray color
    borderColor: "#000",
    padding: 16,
    titleFontSize: 16,
    titleFontFamily: "Arial, sans-serif",
    titleColor: "#333",
    qrCodeMargin: 1,
    qrCodeColor: {
      dark: "#000000",
      light: "#ffffff",
    },
    qrCodeSize: 150, // Fixed QR code size
    spaceBetween: 20,
    backgroundColor: "#fff",
  };

  try {
    // Create canvas with fixed dimensions
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Couldn't get canvas context");
    }

    canvas.width = settings.canvasWidth;
    canvas.height = settings.canvasHeight;

    // Draw the base layout (frame, background)
    drawBaseLayout(canvas, ctx, settings);

    // Process based on content type
    if (content.type === "text" && "text" in content) {
      await renderTextContent(content, ctx, settings);
    } else if (content.type === "image" && "imageUrl" in content) {
      await renderImageContent(content, ctx, settings);
    } else {
      throw new Error("Invalid content provided");
    }

    // Add the metadata (title and QR code)
    await addMetadata(content, qrData, ctx, settings);

    // Return the final canvas as a data URL
    return canvas.toDataURL("image/jpeg", 0.9);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(
        "Failed to generate content: " + (error.message || "Unknown error"),
      );
    }
    throw new Error("Failed to generate content: Unknown error");
  }
}

/**
 * Draws the base layout frame and background
 * @param {HTMLCanvasElement} canvas - The canvas element
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 * @param {ContentOptions} settings - The render settings
 */
function drawBaseLayout(canvas, ctx, settings) {
  // Draw outer border
  ctx.fillStyle = settings.borderColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw inner frame
  ctx.fillStyle = settings.frameColor;
  ctx.fillRect(
    settings.frameWidth,
    settings.frameWidth,
    canvas.width - settings.frameWidth * 2,
    canvas.height - settings.frameWidth * 2,
  );

  // Fill background
  ctx.fillStyle = settings.backgroundColor;
  ctx.fillRect(
    settings.frameWidth * 2,
    settings.frameWidth * 2,
    canvas.width - settings.frameWidth * 4,
    canvas.height - settings.frameWidth * 4,
  );

  // Draw divider between content and metadata
  ctx.fillStyle = settings.frameColor;
  const dividerX = settings.contentWidth + settings.frameWidth * 2;
  ctx.fillRect(
    dividerX,
    settings.frameWidth,
    settings.frameWidth,
    canvas.height - settings.frameWidth * 2,
  );
}

/**
 * Renders image content within the layout
 * @param {ImageContent} content - The content object
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 * @param {ContentOptions} settings - The render settings
 * @returns {Promise<void>}
 */
async function renderImageContent(content, ctx, settings) {
  // Load the image
  const img = new Image();
  img.crossOrigin = "Anonymous";

  return new Promise((resolve, reject) => {
    img.onload = async () => {
      try {
        // Calculate the content area dimensions
        const contentAreaWidth = settings.contentWidth - settings.padding * 2;
        const contentAreaHeight =
          settings.canvasHeight -
          settings.padding * 2 -
          settings.frameWidth * 4;

        // Scale the image to fit in the content area while maintaining aspect ratio
        const scale = Math.min(
          contentAreaWidth / img.width,
          contentAreaHeight / img.height,
        );

        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;

        // Center the image in the content area
        const imageX =
          settings.frameWidth * 2 +
          settings.padding +
          (contentAreaWidth - scaledWidth) / 2;
        const imageY =
          settings.frameWidth * 2 +
          settings.padding +
          (contentAreaHeight - scaledHeight) / 2;

        // Draw the image
        ctx.drawImage(img, imageX, imageY, scaledWidth, scaledHeight);

        resolve();
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };

    // Use display URL if available, otherwise use regular image URL
    img.src = content.displayUrl || content.imageUrl;
  });
}

/**
 * Renders text content within the layout
 * @param {TextContent} content - The content object
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 * @param {ContentOptions} settings - The render settings
 * @returns {Promise<void>}
 */
async function renderTextContent(content, ctx, settings) {
  try {
    // Text rendering settings
    const textFontSize = 16;
    const textFontFamily = settings.titleFontFamily;
    const lineHeight = textFontSize * 1.4;

    // Calculate the content area dimensions
    const contentAreaWidth = settings.contentWidth - settings.padding * 2;
    const contentAreaHeight =
      settings.canvasHeight - settings.padding * 2 - settings.frameWidth * 4;

    // Prepare text background
    ctx.fillStyle = "#fff";
    ctx.fillRect(
      settings.frameWidth * 2 + settings.padding / 2,
      settings.frameWidth * 2 + settings.padding / 2,
      contentAreaWidth,
      contentAreaHeight,
    );

    // Draw text
    ctx.fillStyle = "#333";
    ctx.font = `${textFontSize}px ${textFontFamily}`;
    ctx.textBaseline = "top";

    const textX = settings.frameWidth * 2 + settings.padding;
    const textY = settings.frameWidth * 2 + settings.padding;

    // Calculate wrapped text lines
    const wrappedText = wrapText(
      content.text,
      ctx,
      contentAreaWidth - settings.padding,
    );

    // Draw the text with line wrapping
    wrappedText.forEach((line, index) => {
      if (
        textY + (index + 1) * lineHeight <
        settings.canvasHeight - settings.padding
      ) {
        ctx.fillText(line, textX, textY + index * lineHeight);
      }
    });

    return Promise.resolve();
  } catch (error) {
    if (error instanceof Error) {
      return Promise.reject(
        new Error(`Failed to render text content: ${error.message}`),
      );
    }
    return Promise.reject(
      new Error(`Failed to render text content. Could not parse error.`),
    );
  }
}

/**
 * Adds metadata (title and QR code) to the canvas
 * @param {Content} content - The content object
 * @param {string} qrData - The data to encode in the QR code
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 * @param {ContentOptions} settings - The render settings
 * @returns {Promise<void>}
 */
async function addMetadata(content, qrData, ctx, settings) {
  // Calculate metadata area starting position
  const metadataX = settings.contentWidth + settings.frameWidth * 3;
  const metadataY = settings.frameWidth * 2 + settings.padding;

  // Add title if present
  if (content.title) {
    // Set font and style - using string literals to ensure valid string values
    ctx.font = `${settings.titleFontSize}px ${settings.titleFontFamily}`;
    ctx.fillStyle = settings.titleColor;
    ctx.textBaseline = "top";

    // Wrap title if necessary
    const maxWidth = settings.metadataWidth - settings.padding * 2;
    const wrappedTitle = wrapText(content.title, ctx, maxWidth);

    // Draw each line of the wrapped title
    wrappedTitle.forEach((line, index) => {
      ctx.fillText(
        line,
        metadataX,
        metadataY + index * (settings.titleFontSize * 1.2),
      );
    });
  }

  // Generate QR code
  const qrCodeDataURL = await QRCode.toDataURL(qrData, {
    width: settings.qrCodeSize,
    margin: settings.qrCodeMargin,
    color: settings.qrCodeColor,
  });

  // Load QR code
  const qrImg = new Image();
  qrImg.src = qrCodeDataURL;

  return new Promise((resolve, reject) => {
    qrImg.onload = () => {
      try {
        // Calculate QR code position
        const titleHeight = content.title
          ? Math.ceil(
              ctx.measureText(content.title).width /
                (settings.metadataWidth - settings.padding * 2),
            ) *
            (settings.titleFontSize * 1.2)
          : 0;

        const qrY = metadataY + titleHeight + settings.spaceBetween;
        const qrX =
          metadataX +
          (settings.metadataWidth -
            settings.qrCodeSize -
            settings.padding * 2) /
            2;

        // Draw QR code with white background
        ctx.fillStyle = "white";
        ctx.fillRect(
          qrX - 5,
          qrY - 5,
          settings.qrCodeSize + 10,
          settings.qrCodeSize + 10,
        );
        ctx.drawImage(
          qrImg,
          qrX,
          qrY,
          settings.qrCodeSize,
          settings.qrCodeSize,
        );

        resolve();
      } catch (err) {
        reject(err);
      }
    };

    qrImg.onerror = () => {
      reject(new Error("Failed to generate QR code"));
    };
  });
}

/**
 * Wraps text to fit within a specified width
 * @param {string} text - The text to wrap
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 * @param {number} maxWidth - The maximum width for the text
 * @returns {string[]} Array of wrapped text lines
 */
function wrapText(text, ctx, maxWidth) {
  const words = text.split(" ");
  const lines = [];
  let currentLine = words[0] || "";

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + " " + word).width;

    if (width < maxWidth) {
      currentLine += " " + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}
