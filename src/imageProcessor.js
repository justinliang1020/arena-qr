import QRCode from "qrcode";

/**
 * @typedef {Object} ContentOptions
 * @property {number} canvasWidth - Fixed width of the generated canvas
 * @property {number} canvasHeight - Fixed height of the generated canvas
 * @property {number} contentWidth - Width of the content area (left side)
 * @property {number} metadataWidth - Width of the metadata area (right side)
 * @property {number} frameWidth - Width of the border frame in pixels
 * @property {string} frameColor - Color of the frame
 * @property {string} borderColor - Color of the border
 * @property {string} containerBorderColor - Color of the content container border
 * @property {number} containerPadding - Padding inside the content container border
 * @property {number} textContainerMargin - Margin inside the content container border
 * @property {number} padding - Padding around content in pixels
 * @property {number} titleFontSize - Font size for the title
 * @property {number} descriptionFontSize - Font size for the description
 * @property {number} dateAddedFontSize - Font size for the date added
 * @property {number} authorFontSize - Font size for the author
 * @property {string} titleFontFamily - Font family for the title
 * @property {string} metadataFontFamily - Font family for other metadata
 * @property {string} titleColor - Color for the title text
 * @property {string} metadataColor - Color for other metadata text
 * @property {number} qrCodeSize - QR code size
 * @property {number} qrCodeMargin - QR code margin/padding
 * @property {Object} qrCodeColor - QR code colors
 * @property {string} qrCodeColor.dark - QR code dark color
 * @property {string} qrCodeColor.light - QR code light color
 * @property {number} spaceBetween - Space between elements in pixels
 * @property {string} backgroundColor - Background color
 */

/**
 * @typedef {Object} ImageContent
 * @property {string} type - Content type (set to "image")
 * @property {string} imageUrl - The URL of the image to load
 * @property {string} [displayUrl] - The display URL version of the image (if available)
 * @property {string} [title] - Title to display in the metadata section
 * @property {string} [description] - Description to display in the metadata section
 * @property {string} [created_at] - Date the content was added
 * @property {string} [username] - Username to display in the metadata section
 */

/**
 * @typedef {Object} TextContent
 * @property {string} type - Content type (set to "text")
 * @property {string} text - The text content
 * @property {string} [title] - Title to display in the metadata section
 * @property {string} [description] - Description to display in the metadata section
 * @property {string} [created_at] - Date the content was added
 * @property {string} [username] - Username to display in the metadata section
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
    containerBorderColor: "#e7e7e5", // Light gray for content container border
    containerPadding: 2, // Padding inside the container border
    textContainerMargin: 5, // Padding inside the container border
    padding: 16,
    titleFontSize: 18,
    descriptionFontSize: 14,
    dateAddedFontSize: 12,
    authorFontSize: 12,
    titleFontFamily: "Arial, sans-serif",
    metadataFontFamily: "Arial, sans-serif",
    titleColor: "#333",
    metadataColor: "#666",
    qrCodeMargin: 1,
    qrCodeColor: {
      dark: "#000000",
      light: "#ffffff",
    },
    qrCodeSize: 150, // Fixed QR code size
    spaceBetween: 15,
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

        // Draw content container with grey border
        const containerX = settings.frameWidth * 2 + settings.padding;
        const containerY = settings.frameWidth * 2 + settings.padding;
        const containerWidth = contentAreaWidth;
        const containerHeight = contentAreaHeight;

        // Draw grey border rectangle
        ctx.fillStyle = settings.containerBorderColor;
        ctx.fillRect(containerX, containerY, containerWidth, containerHeight);

        // Draw white inner rectangle (slightly smaller)
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(
          containerX + settings.containerPadding,
          containerY + settings.containerPadding,
          containerWidth - settings.containerPadding * 2,
          containerHeight - settings.containerPadding * 2,
        );

        // Scale the image to fit inside the inner white rectangle while maintaining aspect ratio
        const innerWidth = containerWidth - settings.containerPadding * 2;
        const innerHeight = containerHeight - settings.containerPadding * 2;

        const scale = Math.min(
          innerWidth / img.width,
          innerHeight / img.height,
        );

        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;

        // Center the image in the inner area
        const imageX =
          containerX +
          settings.containerPadding +
          (innerWidth - scaledWidth) / 2;
        const imageY =
          containerY +
          settings.containerPadding +
          (innerHeight - scaledHeight) / 2;

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

    // Draw content container with grey border
    const containerX = settings.frameWidth * 2 + settings.padding;
    const containerY = settings.frameWidth * 2 + settings.padding;
    const containerWidth = contentAreaWidth;
    const containerHeight = contentAreaHeight;

    // Draw grey border rectangle
    ctx.fillStyle = settings.containerBorderColor;
    ctx.fillRect(containerX, containerY, containerWidth, containerHeight);

    // Draw white inner rectangle (slightly smaller)
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(
      containerX + settings.containerPadding,
      containerY + settings.containerPadding,
      containerWidth - settings.containerPadding * 2,
      containerHeight - settings.containerPadding * 2,
    );

    // Draw text
    ctx.fillStyle = "#333";
    ctx.font = `${textFontSize}px ${textFontFamily}`;
    ctx.textBaseline = "top";

    const textX =
      containerX +
      settings.containerPadding * 2 +
      settings.textContainerMargin * 2;
    const textY =
      containerY +
      settings.containerPadding * 2 +
      settings.textContainerMargin * 2;

    // Available width for text is now the inner rectangle width minus some padding
    const textWidth =
      containerWidth -
      settings.containerPadding * 4 -
      settings.textContainerMargin * 4;

    // Calculate wrapped text lines
    const wrappedText = wrapText(content.text, ctx, textWidth);

    // Draw the text with line wrapping
    wrappedText.forEach((line, index) => {
      if (
        textY + (index + 1) * lineHeight <
        containerY + containerHeight - settings.containerPadding * 2
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
 * Adds metadata (title, description, date added, author, and QR code) to the canvas
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

  // Load and draw the Arena logo
  const image = new Image();
  image.src = "./public/arena.png";
  await image.decode();
  const imageHeight = 17; // hardcoded
  ctx.drawImage(image, metadataX + settings.padding, metadataY);

  // Track current Y position for progressive layout
  let currentY = metadataY + imageHeight + settings.padding;
  const maxWidth = settings.metadataWidth - settings.padding * 2;

  // 1. Title (if present)
  if (content.title) {
    ctx.font = `bold ${settings.titleFontSize}px ${settings.titleFontFamily}`;
    ctx.fillStyle = settings.titleColor;
    ctx.textBaseline = "top";

    const wrappedTitle = wrapText(content.title, ctx, maxWidth);
    wrappedTitle.forEach((line, index) => {
      ctx.fillText(
        line,
        metadataX + settings.padding,
        currentY + index * (settings.titleFontSize * 1.2),
      );
    });

    // Update current Y position after title
    currentY +=
      wrappedTitle.length * (settings.titleFontSize * 1.2) +
      settings.spaceBetween;
  }

  // 2. Description (if present)
  if (content.description) {
    ctx.font = `${settings.descriptionFontSize}px ${settings.metadataFontFamily}`;
    ctx.fillStyle = settings.metadataColor;

    const wrappedDesc = wrapText(content.description, ctx, maxWidth);
    wrappedDesc.forEach((line, index) => {
      ctx.fillText(
        line,
        metadataX + settings.padding,
        currentY + index * (settings.descriptionFontSize * 1.2),
      );
    });

    // Update current Y position after description
    currentY +=
      wrappedDesc.length * (settings.descriptionFontSize * 1.2) +
      settings.spaceBetween;
  }

  // 3. Date Added (if present)
  if (content.created_at) {
    ctx.font = `${settings.dateAddedFontSize}px ${settings.metadataFontFamily}`;
    ctx.fillStyle = settings.metadataColor;

    // Format date if it's an ISO date string
    let dateText = content.created_at;
    try {
      const date = new Date(content.created_at);
      if (!isNaN(date.getTime())) {
        dateText = date.toLocaleDateString();
      }
    } catch (e) {
      // If date parsing fails, use the original string
    }

    ctx.fillText(`Added: ${dateText}`, metadataX + settings.padding, currentY);

    // Update current Y position after date
    currentY += settings.dateAddedFontSize * 1.2 + settings.spaceBetween;
  }

  // 4. Author/Username (if present)
  if (content.username) {
    ctx.font = `${settings.authorFontSize}px ${settings.metadataFontFamily}`;
    ctx.fillStyle = settings.metadataColor;

    ctx.fillText(
      `By: ${content.username}`,
      metadataX + settings.padding,
      currentY,
    );
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
        // Position QR code near bottom
        const qrY =
          settings.canvasHeight - settings.qrCodeSize - settings.padding;
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
