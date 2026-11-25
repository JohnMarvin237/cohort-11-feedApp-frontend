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

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext("2d");
            if (!ctx) {
                reject(new Error("Canvas 2D context is not available."));
                return;
            }

            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL());
        };

        img.onerror = () =>
            reject(new Error("Could not load the image to resize."));
        img.src = base64Str;
    });
};
