// Generates content/search-index.json from topic metadata + MDX body text.
// Run automatically before build/dev via the "prebuild"/"predev" scripts.
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const topicsDir = resolve(root, "content", "topics");

// Load the topics index by reading the TS source and pulling out the entries
// we need. To avoid a TS runtime dependency, we parse the metadata we require
// (id, slug, title, summary, domain, file) with a light regex over the array.
const indexSource = await readFile(
  resolve(root, "content", "topics.index.ts"),
  "utf8"
);

/** Extract a string field value from a topic object literal block. */
function field(block, name) {
  const m = block.match(new RegExp(`${name}:\\s*"([^"]*)"`));
  return m ? m[1] : "";
}

// Split the array into per-object blocks by the `id:` anchor.
const objectBlocks = indexSource
  .split(/\{\s*id:/)
  .slice(1)
  .map((b) => "id:" + b);

/** Strip MDX/markdown syntax to plain, searchable text. */
function stripMdx(src) {
  return src
    .replace(/```[\s\S]*?```/g, " ") // fenced code blocks
    .replace(/<[^>]+>/g, " ") // JSX tags (Callout, RevealAnswer, etc.)
    .replace(/[#>*`|_~]/g, " ") // markdown punctuation
    .replace(/\[(.*?)\]\(.*?\)/g, "$1") // links -> text
    .replace(/\s+/g, " ")
    .trim();
}

const records = [];
for (const block of objectBlocks) {
  const id = field(block, "id");
  const slug = field(block, "slug");
  const title = field(block, "title");
  const summary = field(block, "summary");
  const domain = field(block, "domain");
  const file = field(block, "file");
  if (!id || !file) continue;

  let body = "";
  try {
    const mdx = await readFile(resolve(topicsDir, file), "utf8");
    body = stripMdx(mdx);
  } catch {
    // topic without a body yet — index metadata only
  }

  records.push({ id, slug, title, summary, domain, body });
}

const outPath = resolve(root, "content", "search-index.json");
await writeFile(outPath, JSON.stringify(records, null, 2) + "\n", "utf8");
console.log(
  `search-index.json written: ${records.length} topics indexed -> ${outPath}`
);
