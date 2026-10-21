import { readFileSync } from "node:fs";

const read = (relativePath) =>
  readFileSync(new URL(relativePath, import.meta.url), "utf8");

const system = read("./.generated/system.txt");
const template = read("../prompts/generate.txt").trim();

const escapeTags = (text) =>
  text.replaceAll("<", "&lt;").replaceAll(">", "&gt;");

export default function generatePrompt({ vars }) {
  const user = template
    .replace("{{title}}", escapeTags(vars.title))
    .replace("{{brief}}", escapeTags(vars.brief));
  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}
