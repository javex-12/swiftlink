/**
 * Client-side image compression helper.
 * Compresses images before upload using HTML5 Canvas to keep file sizes small
 * and ensure fast uploads on cellular networks.
 */

export interface CompressionResult {
  file: File;
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
}

export async function compressImageBeforeUpload(
  file: File,
  maxDimension = 1400,
  quality = 0.82
): Promise<CompressionResult> {
  // If not an image or in SSR, return raw file
  if (typeof window === "undefined" || !file.type.startsWith("image/")) {
    return {
      file,
      dataUrl: "",
      originalSize: file.size,
      compressedSize: file.size,
    };
  }

  // SVG images do not need canvas compression
  if (file.type === "image/svg+xml") {
    const dataUrl = await fileToDataUrl(file);
    return {
      file,
      dataUrl,
      originalSize: file.size,
      compressedSize: file.size,
    };
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          resolve({
            file,
            dataUrl: src,
            originalSize: file.size,
            compressedSize: file.size,
          });
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        const mimeType = "image/jpeg";
        const dataUrl = canvas.toDataURL(mimeType, quality);

        canvas.toBlob(
          (blob) => {
            if (blob && blob.size < file.size) {
              const newFileName = file.name.replace(/\.[^/.]+$/, ".jpg");
              const compressedFile = new File([blob], newFileName, {
                type: mimeType,
                lastModified: Date.now(),
              });
              resolve({
                file: compressedFile,
                dataUrl,
                originalSize: file.size,
                compressedSize: blob.size,
              });
            } else {
              // If canvas compression is somehow larger, keep original file with dataUrl
              resolve({
                file,
                dataUrl,
                originalSize: file.size,
                compressedSize: file.size,
              });
            }
          },
          mimeType,
          quality
        );
      };

      img.onerror = () => {
        resolve({
          file,
          dataUrl: src,
          originalSize: file.size,
          compressedSize: file.size,
        });
      };

      img.src = src;
    };

    reader.onerror = () => {
      resolve({
        file,
        dataUrl: "",
        originalSize: file.size,
        compressedSize: file.size,
      });
    };

    reader.readAsDataURL(file);
  });
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve((e.target?.result as string) || "");
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
}
