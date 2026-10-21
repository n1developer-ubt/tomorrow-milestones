import { z } from "zod";

export const GENERATION_REQUEST_LIMITS = {
  title: { min: 5, max: 120 },
  brief: { min: 30, max: 4000 },
} as const;

export const GenerationRequestSchema = z.object({
  title: z
    .string()
    .trim()
    .min(GENERATION_REQUEST_LIMITS.title.min, "Title is too short")
    .max(GENERATION_REQUEST_LIMITS.title.max, "Title is too long"),
  brief: z
    .string()
    .trim()
    .min(GENERATION_REQUEST_LIMITS.brief.min, "Brief needs more detail")
    .max(GENERATION_REQUEST_LIMITS.brief.max, "Brief is too long"),
});

export type GenerationRequest = z.infer<typeof GenerationRequestSchema>;
