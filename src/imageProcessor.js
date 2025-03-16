import QRCode from "qrcode";

/**
 * Generates an image with a QR code in the bottom right corner.
 * @param {string} imageUrl - The URL of the image to load.
 * @param {string} qrData - The data to encode in the QR code.
 * @returns {Promise<string>} Data URL of the combined image with QR code.
 * @throws {Error} If image loading or QR code generation fails.
 */
export async function getImageWithQR(imageUrl, qrData) {
  try {
    // Load the image
    const img = new Image();
    img.crossOrigin = "Anonymous";

    return new Promise((resolve, reject) => {
      img.onload = async () => {
        try {
          // Create canvas with image dimensions
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          canvas.width = img.width;
          canvas.height = img.height;

          if (!ctx) {
            throw new Error("Coudln't get canvas context");
          }

          // Draw the image
          ctx.drawImage(img, 0, 0);

          // Generate QR code
          const qrCodeSize = Math.min(img.width, img.height) * 0.2; // 20% of image size
          const qrCodeDataURL = await QRCode.toDataURL(qrData, {
            width: qrCodeSize,
            margin: 1,
            color: {
              dark: "#000000", // black dots
              light: "#ffffff", // white background
            },
          });

          // Load QR code
          const qrImg = new Image();
          qrImg.src = qrCodeDataURL;

          qrImg.onload = () => {
            // Calculate QR code position (bottom right corner)
            const qrX = img.width - qrCodeSize - 20; // 20px padding
            const qrY = img.height - qrCodeSize - 20;

            // Draw white background for QR code
            ctx.fillStyle = "white";
            ctx.fillRect(qrX - 5, qrY - 5, qrCodeSize + 10, qrCodeSize + 10);

            // Draw QR code
            ctx.drawImage(qrImg, qrX, qrY, qrCodeSize, qrCodeSize);

            // Convert to data URL
            const resultDataURL = canvas.toDataURL("image/jpeg", 0.9);
            resolve(resultDataURL);
          };

          qrImg.onerror = () => {
            reject(new Error("Failed to generate QR code"));
          };
        } catch (err) {
          reject(err);
        }
      };

      img.onerror = () => {
        reject(new Error("Failed to load image"));
      };

      img.src = imageUrl;
    });
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(
        "Failed to generate image: " + (error.message || "Unknown error"),
      );
    }
    throw new Error("Failed to generate image:");
  }
}

