import { z } from "zod";

export type ListMilestonePlansQuery = z.infer<
  typeof ListMilestonePlansQuerySchema
>;

export const LIST_LIMITS = { default: 20, max: 100 } as const;

export const ListMilestonePlansQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .min(1, "validation.plan.limitInvalid")
    .max(LIST_LIMITS.max, "validation.plan.limitInvalid")
    .default(LIST_LIMITS.default),
});
