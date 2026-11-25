// Lets `node --test` load the app's sources as Vite does: imports without an
// extension ("../types/Engine") find their .ts file, and JSON imports (the
// diagnostic rules) are read as JSON. Registered by tests/support/register.mjs.

const RELATIVE = /^\.{1,2}\//;

export async function resolve(specifier, context, nextResolve) {
  if (specifier.endsWith(".json")) {
    const resolved = await nextResolve(specifier, context);
    return { ...resolved, importAttributes: { ...context.importAttributes, type: "json" } };
  }
  try {
    return await nextResolve(specifier, context);
  } catch (error) {
    if (error?.code !== "ERR_MODULE_NOT_FOUND" || !RELATIVE.test(specifier)) throw error;
    for (const ending of [".ts", "/index.ts"]) {
      try {
        return await nextResolve(specifier + ending, context);
      } catch {
        // Try the next ending.
      }
    }
    throw error;
  }
}
