import type { Translate } from "./index";

/**
 * Error messages come from the desktop side (Rust, the engine) and from
 * pathofexile.com already written in English, often with a detail appended
 * ("Could not reach pathofexile.com: timed out"). A message that matches one of
 * these patterns is translated with its detail kept as it came; any other one is
 * looked up whole, and shows in English when it is unknown.
 */
const TEMPLATES = [
  "The calculation failed: {detail}",
  "The calculation was interrupted: {detail}",
  "Could not start the calculation engine: {detail}",
  "Could not prepare the calculation: {detail}",
  "The engine returned unreadable data: {detail}",
  "Could not unpack the calculation engine: {detail}",
  "The calculation took longer than {seconds} seconds and was stopped.",
  "Client.txt not found at {path}",
  "Reading the game's icons was interrupted: {detail}",
  "Reading the game's item art was interrupted: {detail}",
  "Could not open the browser: {detail}",
  "Could not download the guide: {detail}",
  "The guide link did not work: {detail}",
  "Could not read the guide: {detail}",
  "Could not download jewel data: {detail}",
  "Jewel data {name} could not be downloaded earlier.",
  "Path of Building has no jewel data named {name}.",
  "Could not save jewel data: {detail}",
  "Could not reach pathofexile.com: {detail}",
  "pathofexile.com answered with error {status}.",
  "Could not read the response: {detail}",
  "Unexpected response from pathofexile.com: {detail}",
  "poe.ninja did not answer: {detail}",
  "poe.ninja sent unreadable prices: {detail}",
  "Atlas tree links of format {version} are not supported yet.",
  "The {name} could not be loaded.",
];

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const PATTERNS = TEMPLATES.map((template) => {
  const names: string[] = [];
  const source = escape(template).replace(/\\\{(\w+)\\\}/g, (_, name: string) => {
    names.push(name);
    return "([\\s\\S]*?)";
  });
  return { template, names, regex: new RegExp(`^${source}$`) };
});

/** The message in the chosen language, keeping any detail it carries. */
export function translateError(message: string, t: Translate): string {
  const whole = t(message);
  if (whole !== message) return whole;
  for (const { template, names, regex } of PATTERNS) {
    const match = regex.exec(message);
    if (!match) continue;
    const vars = Object.fromEntries(names.map((name, i) => [name, t(match[i + 1])]));
    return t(template, vars);
  }
  return message;
}
