export function jsonRequest(body: unknown): Request {
  return new Request("http://localhost/api/test", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}
