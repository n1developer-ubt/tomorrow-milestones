import type { z } from "zod";
import { failure, validationFailure } from "./responses";
import type { ValidatedInput } from "./types";

export async function validateBody<T extends z.ZodType>(
  request: Request,
  schema: T,
): Promise<ValidatedInput<z.infer<T>>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { ok: false, response: failure(400, "invalid_json") };
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    return { ok: false, response: validationFailure(result.error) };
  }
  return { ok: true, data: result.data };
}
