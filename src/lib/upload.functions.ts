import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

// Magic-byte signatures for supported image formats
const SIGNATURES: Array<{ mime: string; ext: string; test: (b: Uint8Array) => boolean }> = [
  { mime: "image/jpeg", ext: "jpg", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { mime: "image/png", ext: "png", test: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  { mime: "image/gif", ext: "gif", test: (b) => b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 },
  {
    mime: "image/webp",
    ext: "webp",
    test: (b) =>
      b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
      b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50,
  },
  { mime: "image/bmp", ext: "bmp", test: (b) => b[0] === 0x42 && b[1] === 0x4d },
  {
    // HEIC / HEIF / AVIF: ISOBMFF "ftyp" box at offset 4
    mime: "image/heic",
    ext: "heic",
    test: (b) => {
      if (b[4] !== 0x66 || b[5] !== 0x74 || b[6] !== 0x79 || b[7] !== 0x70) return false;
      const brand = String.fromCharCode(b[8] ?? 0, b[9] ?? 0, b[10] ?? 0, b[11] ?? 0);
      return ["heic", "heix", "heis", "hevc", "hevx", "mif1", "msf1", "avif", "avis"].includes(brand);
    },
  },
  {
    mime: "image/svg+xml",
    ext: "svg",
    test: (b) => {
      const head = new TextDecoder().decode(b.subarray(0, Math.min(b.length, 512))).trim().toLowerCase();
      return head.startsWith("<?xml") ? head.includes("<svg") : head.startsWith("<svg");
    },
  },
];

const MAX_BYTES = 10 * 1024 * 1024; // 10MB


const inputSchema = z.object({
  bucket: z.enum(["task-images", "banners"]),
  base64: z.string().min(1).max(Math.ceil((MAX_BYTES * 4) / 3) + 128),
});

export const uploadImageSecure = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { bucket: "task-images" | "banners"; base64: string }) =>
    inputSchema.parse(input),
  )
  .handler(async ({ data, context }) => {
    // Admin bucket restriction: only admins may upload banners
    if (data.bucket === "banners") {
      const { data: role } = await context.supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", context.userId)
        .eq("role", "admin")
        .maybeSingle();
      if (!role) throw new Error("Forbidden");
    }

    // Decode base64
    const raw = data.base64.includes(",") ? data.base64.split(",", 2)[1]! : data.base64;
    const bytes = Uint8Array.from(atob(raw), (c) => c.charCodeAt(0));
    if (bytes.byteLength === 0) throw new Error("ملف فارغ");
    if (bytes.byteLength > MAX_BYTES) throw new Error("الحد الأقصى للصورة 10 ميجابايت");


    // Verify magic bytes
    const sig = SIGNATURES.find((s) => s.test(bytes));
    if (!sig) throw new Error("نوع الصورة غير مدعوم");

    const path = `${context.userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${sig.ext}`;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error: upErr } = await supabaseAdmin.storage.from(data.bucket).upload(path, bytes, {
      cacheControl: "31536000",
      upsert: false,
      contentType: sig.mime,
    });
    if (upErr) throw new Error(upErr.message);

    const FIVE_YEARS = 60 * 60 * 24 * 365 * 5;
    const { data: signed, error } = await supabaseAdmin.storage
      .from(data.bucket)
      .createSignedUrl(path, FIVE_YEARS);
    if (error || !signed) throw new Error(error?.message ?? "تعذّر توليد الرابط");
    return { url: signed.signedUrl };
  });
