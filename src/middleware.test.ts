import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { middleware } from "./middleware";

function request(authorization?: string) {
  return new NextRequest("http://localhost/api/milestone-plans", {
    headers: authorization ? { authorization } : {},
  });
}

const valid = `Basic ${btoa("admin:pw")}`;

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("middleware", () => {
  it("lets requests through when auth is disabled", () => {
    vi.stubEnv("BASIC_AUTH_USER", "");
    vi.stubEnv("BASIC_AUTH_PASSWORD", "");
    vi.stubEnv("NODE_ENV", "development");

    expect(middleware(request()).headers.get("x-middleware-next")).toBe("1");
  });

  describe("when credentials are configured", () => {
    beforeEach(() => {
      vi.stubEnv("BASIC_AUTH_USER", "admin");
      vi.stubEnv("BASIC_AUTH_PASSWORD", "pw");
    });

    it("challenges requests without credentials", async () => {
      const response = middleware(request());

      expect(response.status).toBe(401);
      expect(response.headers.get("www-authenticate")).toContain("Basic");
      expect(await response.text()).toBe("Authentication required.");
    });

    it("rejects wrong credentials", () => {
      expect(middleware(request(`Basic ${btoa("admin:x")}`)).status).toBe(401);
    });

    it("lets valid credentials through", () => {
      expect(middleware(request(valid)).headers.get("x-middleware-next")).toBe(
        "1",
      );
    });
  });

  it("fails closed in production without credentials", () => {
    vi.stubEnv("BASIC_AUTH_USER", "");
    vi.stubEnv("BASIC_AUTH_PASSWORD", "");
    vi.stubEnv("NODE_ENV", "production");

    expect(middleware(request(valid)).status).toBe(500);
  });
});
