// Same limit as the backend (Profile.picture): a 500x500 photo in WebP/JPEG stays far below it
export const MAX_PICTURE_LENGTH = 1_000_000;
export const MAX_UPLOAD_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Returns an error message, or null if the file can be used
export const validateImageFile = (file: File): string | null => {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return "Please choose a JPEG, PNG or WebP image.";
  }
  if (file.size > MAX_UPLOAD_FILE_SIZE) {
    return "The image must be smaller than 10 MB.";
  }
  return null;
};

// JPEG has no transparency: paint transparent areas white instead of black
const flattenOnWhite = (canvas: HTMLCanvasElement): HTMLCanvasElement => {
  const flat = document.createElement("canvas");
  flat.width = canvas.width;
  flat.height = canvas.height;
  const ctx = flat.getContext("2d");
  if (!ctx) return canvas;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, flat.width, flat.height);
  ctx.drawImage(canvas, 0, 0);
  return flat;
};

// WebP when the browser can encode it, otherwise JPEG (Safari returns PNG for WebP requests)
export const canvasToCompressedDataUrl = (
  canvas: HTMLCanvasElement,
  quality: number = 0.85
): string => {
  const webp = canvas.toDataURL("image/webp", quality);
  if (webp.startsWith("data:image/webp")) {
    return webp;
  }
  return flattenOnWhite(canvas).toDataURL("image/jpeg", quality);
};

export const convertBase64 = (file: File | Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.readAsDataURL(file);
    fileReader.onload = () => {
      resolve(fileReader.result as string);
    };
    fileReader.onerror = (error) => {
      reject(error);
    };
  });
};

export const resizeImage = (
  base64Str: string,
  maxWidth: number = 500,
  maxHeight: number = 500
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const MAX_WIDTH = maxWidth;
      const MAX_HEIGHT = maxHeight;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas 2D context is not available."));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvasToCompressedDataUrl(canvas));
    };

    img.onerror = () => reject(new Error("Could not load the image to resize."));
    img.src = base64Str;
  });
};