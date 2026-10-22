export type Credentials = { user: string; password: string };

export type BasicAuthConfig =
  | { mode: "disabled" }
  | { mode: "enabled"; credentials: Credentials }
  | { mode: "misconfigured" };

type AuthEnv = {
  BASIC_AUTH_USER?: string;
  BASIC_AUTH_PASSWORD?: string;
  NODE_ENV?: string;
};

export function getBasicAuthConfig(env: AuthEnv): BasicAuthConfig {
  const user = env.BASIC_AUTH_USER;
  const password = env.BASIC_AUTH_PASSWORD;
  if (user && password) {
    return { mode: "enabled", credentials: { user, password } };
  }
  return env.NODE_ENV === "production"
    ? { mode: "misconfigured" }
    : { mode: "disabled" };
}

export function parseBasicAuthHeader(
  header: string | null,
): Credentials | null {
  if (!header?.startsWith("Basic ")) return null;
  try {
    const decoded = atob(header.slice("Basic ".length).trim());
    const separator = decoded.indexOf(":");
    if (separator === -1) return null;
    return {
      user: decoded.slice(0, separator),
      password: decoded.slice(separator + 1),
    };
  } catch {
    return null;
  }
}

export function isAuthorized(
  header: string | null,
  expected: Credentials,
): boolean {
  const given = parseBasicAuthHeader(header);
  if (!given) return false;
  const userMatches = safeEqual(given.user, expected.user);
  const passwordMatches = safeEqual(given.password, expected.password);
  return userMatches && passwordMatches;
}

function safeEqual(a: string, b: string): boolean {
  const left = new TextEncoder().encode(a);
  const right = new TextEncoder().encode(b);
  let difference = left.length ^ right.length;
  for (let i = 0; i < Math.max(left.length, right.length); i++) {
    difference |= (left[i] ?? 0) ^ (right[i] ?? 0);
  }
  return difference === 0;
}
