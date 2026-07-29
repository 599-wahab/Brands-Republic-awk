import { readFileSync } from "node:fs";

export function databaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  let source = "";
  try { source = readFileSync(new URL("../.dev.vars", import.meta.url), "utf8"); } catch {}
  const line = source.split(/\r?\n/).find((entry) => entry.trim().startsWith("DATABASE_URL="));
  const value = line?.slice(line.indexOf("=") + 1).trim().replace(/^(['"])(.*)\1$/, "$2");
  if (!value) throw new Error("DATABASE_URL is not configured");
  return value;
}
