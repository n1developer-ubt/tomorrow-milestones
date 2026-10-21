import { describe, expect, it } from "vitest";
import {
  getBasicAuthConfig,
  isAuthorized,
  parseBasicAuthHeader,
} from "./basic-auth";

const credentials = { user: "admin", password: "s3cret:with:colons" };

function header(user: string, password: string) {
  return `Basic ${btoa(`${user}:${password}`)}`;
}

describe("getBasicAuthConfig", () => {
  it("enables auth when both credentials are set", () => {
    expect(
      getBasicAuthConfig({
        BASIC_AUTH_USER: "admin",
        BASIC_AUTH_PASSWORD: "pw",
        NODE_ENV: "production",
      }),
    ).toEqual({
      mode: "enabled",
      credentials: { user: "admin", password: "pw" },
    });
  });

  it.each(["development", "test", undefined])(
    "disables auth without credentials in %s",
    (NODE_ENV) => {
      expect(getBasicAuthConfig({ NODE_ENV })).toEqual({ mode: "disabled" });
    },
  );

  it("fails closed in production without credentials", () => {
    expect(
      getBasicAuthConfig({ BASIC_AUTH_USER: "admin", NODE_ENV: "production" }),
    ).toEqual({ mode: "misconfigured" });
  });
});

describe("parseBasicAuthHeader", () => {
  it("splits on the first colon only", () => {
    expect(parseBasicAuthHeader(header("admin", "a:b:c"))).toEqual({
      user: "admin",
      password: "a:b:c",
    });
  });

  it.each([null, "", "Bearer token", "Basic !!!", `Basic ${btoa("nocolon")}`])(
    "returns null for %s",
    (value) => {
      expect(parseBasicAuthHeader(value)).toBeNull();
    },
  );
});

describe("isAuthorized", () => {
  it("accepts matching credentials", () => {
    expect(
      isAuthorized(header(credentials.user, credentials.password), credentials),
    ).toBe(true);
  });

  it.each([
    ["wrong password", header("admin", "nope")],
    ["wrong user", header("root", credentials.password)],
    ["password prefix", header("admin", "s3cret")],
    ["missing header", null],
  ])("rejects %s", (_, value) => {
    expect(isAuthorized(value, credentials)).toBe(false);
  });
});
