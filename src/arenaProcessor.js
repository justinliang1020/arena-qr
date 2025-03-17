import { generateContentWithQR } from "./imageProcessor.js";

/**
 * @typedef {Object} ArenaImage
 * @property {Object} original
 * @property {string} original.url
 * @property {Object} [display]
 * @property {string} [display.url]
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
 * @property {User} [user]
 * @property {string} [content]
 * @property {string} [class]
 * @property {string} [description]
 * @property {string} [created_at]
 */

/**
 * @typedef {Object} User
 * @property {string} username
 */

/**
 * @typedef {import('./imageProcessor').ImageContent} ImageContent
 * @typedef {import('./imageProcessor').TextContent} TextContent
 * @typedef {import('./imageProcessor').ContentOptions} ContentOptions
 */

/**
 * Fetches data for an Arena block from the API based on the provided URL.
 * @param {string} url - The URL of the Arena block to fetch.
 * @returns {Promise<ArenaBlock>} The block data from the Arena API.
 * @throws {Error} If the URL is invalid or the request fails.
 */
export async function getArenaBlockData(url) {
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
 * Processes an Arena block to extract content and generate a QR code.
 * @param {ArenaBlock} blockData - The Arena block data from the API.
 * @param {string} qrData - The data to embed in the QR code
 * @returns {Promise<string>} Data URL of the generated content with QR code.
 * @throws {Error} If processing fails or no valid content is found in the block.
 */
export async function createArenaqrImageDataURL(blockData, qrData) {
  try {
    // Get QR code data (URL or title from the block)

    // Determine block type and prepare content
    const blockClass = blockData.class || "";

    /** @type {ImageContent|TextContent} */
    let content;

    // Process based on block class/type
    if (blockClass === "Text" && blockData.content) {
      // Text block
      /** @type {TextContent} */
      content = {
        type: "text",
        text: blockData.content,
      };
    } else if (blockData.image) {
      // Image block
      /** @type {ImageContent} */
      content = {
        type: "image",
        imageUrl: blockData.image.original.url,
      };

      // Use display URL if available
      if (blockData.image.display?.url) {
        content.displayUrl = blockData.image.display.url;
      }
    } else if (blockData.attachment?.url) {
      // Attachment block (file/document)
      /** @type {ImageContent} */
      content = {
        type: "image",
        imageUrl: blockData.attachment.url,
      };
    } else {
      throw new Error("No valid content found in this Are.na block");
    }

    // Set title if available
    if (blockData.title) {
      content.title = blockData.title;
    } else if (blockData.generated_title) {
      content.title = blockData.generated_title;
    }

    // Set description if available
    if (blockData.description) {
      content.description = blockData.description;
    }

    // Set creation date if available
    if (blockData.created_at) {
      content.created_at = blockData.created_at;
    }

    // Set username if available
    if (blockData.user) {
      content.username = blockData.user.username;
    }

    // Generate combined content with QR code
    return await generateContentWithQR(content, qrData);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to process Are.na block: ${error.message}`);
    }
    throw new Error("Failed to process Are.na block: Unknown error");
  }
}
