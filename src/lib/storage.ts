import { supabase } from "@/integrations/supabase/client";

const FIVE_YEARS = 60 * 60 * 24 * 365 * 5;

/**
 * Uploads a File to a private bucket under {userId}/{timestamp}-{name}.
 * Returns a long-lived signed URL suitable for storing in DB.
 */
export async function uploadImage(
  bucket: "task-images" | "banners",
  file: File,
  userId: string,
): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("الملف يجب أن يكون صورة");
  if (file.size > 5 * 1024 * 1024) throw new Error("الحد الأقصى للصورة 5 ميجابايت");

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error: upErr } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
    contentType: file.type,
  });
  if (upErr) throw upErr;

  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, FIVE_YEARS);
  if (error || !data) throw error ?? new Error("تعذّر توليد الرابط");
  return data.signedUrl;
}
