import { z } from "zod";

export const taskSchema = z.object({
  title: z.string().trim().min(3, "العنوان قصير").max(120, "العنوان طويل جداً"),
  details: z.string().trim().min(10, "التفاصيل قصيرة جداً").max(1000, "التفاصيل طويلة جداً"),
  category: z.enum(["delivery", "teaching", "transport", "search", "work", "help", "other"]),
  price: z.coerce.number().min(0, "السعر يجب أن يكون موجباً").max(1000000, "السعر مرتفع جداً"),
  location: z.string().trim().min(2, "الموقع مطلوب").max(120, "الموقع طويل جداً"),
  whatsapp: z
    .string()
    .trim()
    .min(6, "رقم الواتساب مطلوب")
    .max(20, "رقم الواتساب طويل جداً")
    .regex(/^[+\d\s-]+$/, "رقم غير صالح"),
});

export const editTaskSchema = taskSchema.pick({
  title: true,
  details: true,
  category: true,
  price: true,
  location: true,
});

export type TaskInput = z.infer<typeof taskSchema>;
export type EditTaskInput = z.infer<typeof editTaskSchema>;
