import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import messages from "../../messages/en.json";
import type { AiErrorCode } from "@/lib/ai/errors";
import type { ApiErrorCode } from "@/lib/api/types";

function hasKey(key: string): boolean {
  let node: unknown = messages;
  for (const part of key.split(".")) {
    if (typeof node !== "object" || node === null || !(part in node)) {
      return false;
    }
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === "string";
}

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((entry) => entry.isFile() && /\.tsx?$/.test(entry.name))
    .filter((entry) => !entry.name.includes(".test."))
    .map((entry) => path.join(entry.parentPath, entry.name));
}

describe("messages/en.json", () => {
  it("contains every validation key used in source code", () => {
    const keys = sourceFiles(path.join(process.cwd(), "src")).flatMap(
      (file) => readFileSync(file, "utf8").match(/"validation\.[\w.]+"/g) ?? [],
    );

    expect(keys.length).toBeGreaterThan(0);
    const missing = keys.map((k) => k.slice(1, -1)).filter((k) => !hasKey(k));
    expect(missing).toEqual([]);
  });

  it("contains a message for every AI error code", () => {
    const codes: AiErrorCode[] = [
      "timeout",
      "rate_limited",
      "invalid_output",
      "provider_error",
    ];
    for (const code of codes) expect(hasKey(`errors.ai.${code}`)).toBe(true);
  });

  it("contains a message for every API error code", () => {
    const codes: Exclude<ApiErrorCode, AiErrorCode>[] = [
      "invalid_json",
      "validation",
      "not_found",
      "internal_error",
    ];
    for (const code of codes) expect(hasKey(`errors.api.${code}`)).toBe(true);
  });
});
