const normalize = (text) =>
  text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();

export function noDuplicateTitles(output) {
  const titles = JSON.parse(output).milestones.map((m) => normalize(m.title));
  const pass = new Set(titles).size === titles.length;
  return { pass, score: pass ? 1 : 0, reason: pass ? "unique" : "duplicates" };
}
