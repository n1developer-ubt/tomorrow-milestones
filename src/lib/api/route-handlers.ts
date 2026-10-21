import type { z } from "zod";
import { handleRouteError } from "./responses";
import { validateBody } from "./validate-body";

type Handler<Args extends unknown[]> = (...args: Args) => Promise<Response>;

export function withErrorHandling<Args extends unknown[]>(
  handler: Handler<Args>,
): Handler<Args> {
  return async (...args) => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleRouteError(error);
    }
  };
}

export function validatedRoute<T extends z.ZodType>(
  schema: T,
  handler: (data: z.infer<T>) => Promise<Response>,
): (request: Request) => Promise<Response> {
  return withErrorHandling(async (request: Request) => {
    const body = await validateBody(request, schema);
    if (!body.ok) return body.response;
    return handler(body.data);
  });
}
