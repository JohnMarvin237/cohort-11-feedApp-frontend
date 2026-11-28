// Same limit as the backend (Profile.picture and Feed.picture), in base64 characters
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
    quality: number = 0.85,
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
    maxHeight: number = 500,
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

            // Rounded: a canvas truncates decimals (1023.99 px would become 1023 px)
            canvas.width = Math.round(width);
            canvas.height = Math.round(height);

            const ctx = canvas.getContext("2d");
            if (!ctx) {
                reject(new Error("Canvas 2D context is not available."));
                return;
            }

            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvasToCompressedDataUrl(canvas));
        };

        img.onerror = () =>
            reject(new Error("Could not load the image to resize."));
        img.src = base64Str;
    });
};

// Feed pictures keep their original shape: nothing is cropped, only the longest side is limited
export const FEED_PICTURE_MAX_SIDE = 1280; // pixels

// Resizes without cropping, then shrinks a bit more while the result is above the backend limit
export const resizeImageToFit = async (
    base64Str: string,
    maxSide: number = FEED_PICTURE_MAX_SIDE,
    maxLength: number = MAX_PICTURE_LENGTH,
): Promise<string> => {
    let side = maxSide;
    let result = await resizeImage(base64Str, side, side);

    while (result.length > maxLength && side > 480) {
        side = Math.round(side * 0.8);
        result = await resizeImage(base64Str, side, side);
    }

    return result;
};

// The course sample data holds file names ("2.jpg") instead of images: only real images are shown
export const isImageDataUrl = (value?: string | null): value is string =>
    typeof value === "string" && value.startsWith("data:image/");

// The backend sends dates as "yyyy-MM-dd HH:mm:ss" (application.yml). Safari cannot parse
// the space, "yyyy-MM-ddTHH:mm:ss" works everywhere (read as local time)
const toDate = (value: string | number | Date): Date => {
    if (value instanceof Date) return value;
    if (
        typeof value === "string" &&
        /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(value)
    ) {
        return new Date(value.replace(" ", "T"));
    }
    return new Date(value);
};

const DATE_TIME_FORMAT = new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeStyle: "short",
});

// e.g. "November 26, 2026 at 4:19 PM"; "" when the date is missing or invalid
export const formatDateTime = (
    value?: string | number | Date | null,
): string => {
    if (value === undefined || value === null || value === "") return "";
    const date = toDate(value);
    return Number.isNaN(date.getTime()) ? "" : DATE_TIME_FORMAT.format(date);
};
