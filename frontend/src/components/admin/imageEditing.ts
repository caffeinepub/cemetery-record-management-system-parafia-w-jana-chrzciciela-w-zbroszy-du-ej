// Helper utilities for image editing and cropping

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Creates an image element from a URL or data URL
 */
export function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });
}

/**
 * Converts a File to a data URL
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(reader.result as string));
    reader.addEventListener('error', reject);
    reader.readAsDataURL(file);
  });
}

/**
 * Resizes an image to fit within max dimensions while maintaining aspect ratio
 * Returns Uint8Array suitable for ExternalBlob
 */
export async function resizeImage(
  imageSrc: string,
  maxWidth: number = 800,
  maxHeight: number = 600
): Promise<Uint8Array> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Nie można utworzyć kontekstu canvas');
  }

  // Calculate new dimensions maintaining aspect ratio
  let width = image.width;
  let height = image.height;

  if (width > maxWidth || height > maxHeight) {
    const aspectRatio = width / height;
    if (width > height) {
      width = maxWidth;
      height = width / aspectRatio;
    } else {
      height = maxHeight;
      width = height * aspectRatio;
    }
  }

  canvas.width = width;
  canvas.height = height;

  // Draw the image scaled to fit
  ctx.drawImage(image, 0, 0, width, height);

  // Convert canvas to blob, then to Uint8Array
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Nie można utworzyć obrazu'));
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
          const arrayBuffer = reader.result as ArrayBuffer;
          resolve(new Uint8Array(arrayBuffer));
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(blob);
      },
      'image/jpeg',
      0.92
    );
  });
}
