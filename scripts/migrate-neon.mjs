import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";
import { databaseUrl } from "./neon-env.mjs";

const migrationId = "0000_neon";
const sql = neon(databaseUrl());

await sql.query("CREATE TABLE IF NOT EXISTS app_migrations (id text PRIMARY KEY, applied_at text NOT NULL)", []);
const applied = await sql.query("SELECT id FROM app_migrations WHERE id = $1", [migrationId]);

if (applied.length) {
  console.log("Neon migration is already applied.");
  process.exit(0);
}

const migration = readFileSync(new URL("../drizzle/0000_neon.sql", import.meta.url), "utf8");
const statements = migration.split("--> statement-breakpoint").map((statement) => statement.trim()).filter(Boolean);

for (const statement of statements) await sql.query(statement, []);
await sql.query("INSERT INTO app_migrations (id, applied_at) VALUES ($1, $2)", [migrationId, new Date().toISOString()]);
console.log(`Applied ${statements.length} Neon migration statements.`);
