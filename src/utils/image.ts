/**
 * Image Utilities for Cropping and Compression
 */

export async function cropAndCompressImage(
  imageSrc: string,
  crop: { x: number, y: number, width: number, height: number },
  quality: number = 0.7,
  targetWidth: number = 800
): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = imageSrc;
    image.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject("No canvas context");

      // Set canvas to square target size
      canvas.width = targetWidth;
      canvas.height = targetWidth;

      // Draw cropped area onto canvas with scaling
      ctx.drawImage(
        image,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        0,
        0,
        targetWidth,
        targetWidth
      );

      // Export as compressed base64 JPEG
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    image.onerror = (err) => reject(err);
  });
}
