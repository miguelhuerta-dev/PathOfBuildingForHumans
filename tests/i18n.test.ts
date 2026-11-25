import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { es } from "../src/i18n/es.ts";

const SRC = join(import.meta.dirname, "../src");

function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === "data" ? [] : sources(path);
    return /\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith(".d.ts") ? [path] : [];
  });
}

// t("text") and t("text", {…}) with a plain string literal; texts built at run time are not checked here.
const CALL = /\bt\(\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')\s*[,)]/g;

test("every fixed text shown with t() has a Spanish translation", () => {
  const missing: string[] = [];
  for (const file of sources(SRC)) {
    // The dictionary itself, and the i18n module whose comments show t() examples.
    if (/i18n[\\/](es\.ts|index\.tsx)$/.test(file)) continue;
    for (const [, literal] of readFileSync(file, "utf8").matchAll(CALL)) {
      const text = literal.startsWith("'") ? literal.slice(1, -1).replace(/\\'/g, "'") : (JSON.parse(literal) as string);
      if (!(text in es)) missing.push(`${file.slice(SRC.length + 1)}: ${text}`);
    }
  }
  assert.deepEqual([...new Set(missing)], [], "add these texts to src/i18n/es.ts");
});

test("translations keep every {placeholder} of the English text", () => {
  const wrong = Object.entries(es).filter(([english, spanish]) => {
    const names = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");
    return names(english) !== names(spanish);
  });
  assert.deepEqual(wrong, []);
});
