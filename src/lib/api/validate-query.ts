import type { z } from "zod";
import { validationFailure } from "./responses";
import type { ValidatedInput } from "./types";

export function validateQuery<T extends z.ZodType>(
  request: Request,
  schema: T,
): ValidatedInput<z.infer<T>> {
  const query = Object.fromEntries(new URL(request.url).searchParams);
  const result = schema.safeParse(query);
  if (!result.success) {
    return { ok: false, response: validationFailure(result.error) };
  }
  return { ok: true, data: result.data };
}
