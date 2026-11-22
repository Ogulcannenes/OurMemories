// Client-side photo preparation: decode, honour EXIF orientation, downscale, re-encode.
// Re-encoding also strips EXIF metadata (location, device) before anything leaves the phone.

export const MAX_INPUT_BYTES = 15 * 1024 * 1024;
const MAX_EDGE = 1600;

export type PreparedPhoto = { blob: Blob; ext: "webp" | "jpg"; type: string };

export class PhotoError extends Error {
  constructor(public reason: "too_large" | "unsupported") {
    super(reason);
  }
}

export async function preparePhoto(file: File): Promise<PreparedPhoto> {
  if (file.size > MAX_INPUT_BYTES) throw new PhotoError("too_large");
  if (!file.type.startsWith("image/")) throw new PhotoError("unsupported");

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new PhotoError("unsupported"); // e.g. HEIC on browsers that can't decode it
  }

  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const g = canvas.getContext("2d");
  if (!g) throw new PhotoError("unsupported");
  g.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const encode = (type: string) => new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.82));

  // Older Safari silently falls back to PNG for WebP; detect that and use JPEG instead.
  const webp = await encode("image/webp");
  if (webp?.type === "image/webp") return { blob: webp, ext: "webp", type: "image/webp" };
  const jpeg = await encode("image/jpeg");
  if (!jpeg) throw new PhotoError("unsupported");
  return { blob: jpeg, ext: "jpg", type: "image/jpeg" };
}
