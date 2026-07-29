import { neon } from "@neondatabase/serverless";
import { databaseUrl } from "./neon-env.mjs";

const sql = neon(databaseUrl());
const tables = ["customers", "interactions", "reminders", "feedback", "revenue"];
const counts = {};

if (process.argv.includes("--cleanup-tests")) {
  const removed = await sql.query("DELETE FROM customers WHERE email LIKE $1 RETURNING id", ["storage-test-%@example.com"]);
  console.log(`Removed ${removed.length} temporary storage test record(s).`);
}

for (const table of tables) {
  const rows = await sql.query(`SELECT COUNT(*)::integer AS count FROM ${table}`, []);
  counts[table] = rows[0].count;
}

console.log("Neon CRM storage verified:", counts);
