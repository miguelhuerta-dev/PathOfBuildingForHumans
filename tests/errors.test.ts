import { test } from "node:test";
import assert from "node:assert/strict";
import { es as dictionary } from "../src/i18n/es.ts";
import { translateError } from "../src/i18n/errors.ts";

// The app's translator, without React: look the text up, then fill its {vars}.
type Vars = Record<string, string | number | undefined>;
const fill = (text: string, vars?: Vars) => text.replace(/\{(\w+)\}/g, (m, name: string) => (vars && name in vars ? String(vars[name]) : m));
const es = (text: string, vars?: Vars) => fill(dictionary[text] ?? text, vars);
const en = (text: string, vars?: Vars) => fill(text, vars);

test("a whole error message is translated", () => {
  assert.equal(translateError("Load a guide first.", es), "Primero carga una guía.");
});

test("an error with a detail keeps the detail", () => {
  assert.equal(
    translateError("Could not reach pathofexile.com: operation timed out", es),
    "No se pudo conectar con pathofexile.com: operation timed out",
  );
  assert.equal(translateError("The passive tree could not be loaded.", es), "No se pudo cargar el árbol de pasivas.");
});

test("English and unknown messages are left as they are", () => {
  assert.equal(translateError("Could not reach pathofexile.com: x", en), "Could not reach pathofexile.com: x");
  assert.equal(translateError("Brand new failure", es), "Brand new failure");
});
