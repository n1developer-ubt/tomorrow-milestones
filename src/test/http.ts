export const noParams = { params: Promise.resolve({}) } as {
  params: Promise<Record<string, never>>;
};

export function params<P>(value: P): { params: Promise<P> } {
  return { params: Promise.resolve(value) };
}

export function jsonRequest(body: unknown): Request {
  return new Request("http://localhost/api/test", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}
