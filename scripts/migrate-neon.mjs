import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { neon } from "@neondatabase/serverless";
import { databaseUrl } from "./neon-env.mjs";

const sql = neon(databaseUrl());
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const migrationDirectory = join(root, "drizzle");

await sql.query("CREATE TABLE IF NOT EXISTS app_migrations (id text PRIMARY KEY, applied_at text NOT NULL)", []);
const appliedRows = await sql.query("SELECT id FROM app_migrations", []);
const applied = new Set(appliedRows.map((row) => row.id));
const files = (await readdir(migrationDirectory)).filter((file) => /^\d+_.+\.sql$/.test(file)).sort();

let appliedCount = 0;
for (const file of files) {
  const migrationId = file.replace(/\.sql$/, "");
  if (applied.has(migrationId)) continue;

  const migration = await readFile(join(migrationDirectory, file), "utf8");
  const statements = migration.split("--> statement-breakpoint").map((statement) => statement.trim()).filter(Boolean);
  for (const statement of statements) await sql.query(statement, []);
  await sql.query("INSERT INTO app_migrations (id, applied_at) VALUES ($1, $2)", [migrationId, new Date().toISOString()]);
  appliedCount += 1;
  console.log(`Applied ${migrationId} (${statements.length} statements).`);
}

if (!appliedCount) console.log("Neon migrations are already up to date.");
