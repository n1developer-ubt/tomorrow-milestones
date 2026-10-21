import type { z } from "zod";
import { handleRouteError } from "./responses";
import type { RouteContext } from "./types";
import { validateBody } from "./validate-body";
import { validateQuery } from "./validate-query";

type NoParams = Record<string, never>;

type Route<P> = (
  request: Request,
  context: RouteContext<P>,
) => Promise<Response>;

export function withErrorHandling<P = NoParams>(
  handler: (request: Request, params: P) => Promise<Response>,
): Route<P> {
  return async (request, context) => {
    try {
      return await handler(request, await context.params);
    } catch (error) {
      return handleRouteError(error);
    }
  };
}

export function validatedRoute<T extends z.ZodType, P = NoParams>(
  schema: T,
  handler: (data: z.infer<T>, params: P) => Promise<Response>,
): Route<P> {
  return withErrorHandling<P>(async (request, params) => {
    const body = await validateBody(request, schema);
    if (!body.ok) return body.response;
    return handler(body.data, params);
  });
}

export function validatedQueryRoute<T extends z.ZodType, P = NoParams>(
  schema: T,
  handler: (query: z.infer<T>, params: P) => Promise<Response>,
): Route<P> {
  return withErrorHandling<P>(async (request, params) => {
    const query = validateQuery(request, schema);
    if (!query.ok) return query.response;
    return handler(query.data, params);
  });
}
