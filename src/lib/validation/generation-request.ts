import { z } from "zod";

export const GENERATION_REQUEST_LIMITS = {
  title: { min: 5, max: 120 },
  brief: { min: 30, max: 4000 },
} as const;

export const GenerationRequestSchema = z.object({
  title: z
    .string()
    .trim()
    .min(
      GENERATION_REQUEST_LIMITS.title.min,
      "validation.request.titleTooShort",
    )
    .max(
      GENERATION_REQUEST_LIMITS.title.max,
      "validation.request.titleTooLong",
    ),
  brief: z
    .string()
    .trim()
    .min(
      GENERATION_REQUEST_LIMITS.brief.min,
      "validation.request.briefTooShort",
    )
    .max(
      GENERATION_REQUEST_LIMITS.brief.max,
      "validation.request.briefTooLong",
    ),
});

export type GenerationRequest = z.infer<typeof GenerationRequestSchema>;
