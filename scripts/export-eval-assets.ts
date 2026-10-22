import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { GeneratedOutput, SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { GeneratedMilestonesSchema } from "@/lib/milestones/schemas";

const OUTPUT_DIR = path.join(process.cwd(), "evals", ".generated");

function jsonSchema(schema: z.ZodType): Record<string, unknown> {
  const result: Record<string, unknown> = z.toJSONSchema(schema);
  delete result.$schema;
  return result;
}

function write(file: string, content: string) {
  writeFileSync(path.join(OUTPUT_DIR, file), content);
}

mkdirSync(OUTPUT_DIR, { recursive: true });

write("system.txt", SYSTEM_PROMPT);
write(
  "response-format.json",
  JSON.stringify({
    type: "json_schema",
    json_schema: {
      name: "generated_milestones",
      strict: true,
      schema: jsonSchema(GeneratedOutput),
    },
  }),
);
write(
  "milestones.schema.json",
  JSON.stringify(jsonSchema(GeneratedMilestonesSchema)),
);
