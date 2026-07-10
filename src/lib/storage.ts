import { uploadImageSecure } from "@/lib/upload.functions";

const ALLOWED_MIMES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_BYTES = 5 * 1024 * 1024;

async function fileToBase64(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

/**
 * Uploads a File to a private bucket via a server function that validates
 * MIME by inspecting magic bytes (defense against client-only MIME spoofing).
 * Returns a long-lived signed URL suitable for storing in DB.
 */
export async function uploadImage(
  bucket: "task-images" | "banners",
  file: File,
  _userId: string,
): Promise<string> {
  // Client-side pre-checks for UX (server enforces authoritatively)
  if (!ALLOWED_MIMES.has(file.type)) throw new Error("الملف يجب أن يكون صورة (JPEG / PNG / WebP / GIF)");
  if (file.size > MAX_BYTES) throw new Error("الحد الأقصى للصورة 5 ميجابايت");

  const base64 = await fileToBase64(file);
  const { url } = await uploadImageSecure({ data: { bucket, base64 } });
  return url;
}
