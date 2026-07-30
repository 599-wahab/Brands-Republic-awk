import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { neon } from "@neondatabase/serverless";
import { databaseUrl } from "./neon-env.mjs";

const inputPath = process.argv[2];
if (!inputPath) throw new Error("Pass the normalized customer JSON file path.");

const records = JSON.parse(await readFile(resolve(inputPath), "utf8"));
if (!Array.isArray(records) || !records.length) throw new Error("The import file contains no customer records.");

const required = ["name", "email", "status"];
for (const [index, record] of records.entries()) {
  for (const field of required) if (!String(record[field] ?? "").trim()) throw new Error(`Record ${index + 1} is missing ${field}.`);
}

const uniqueEmails = new Set(records.map((record) => String(record.email).trim().toLowerCase()));
if (uniqueEmails.size !== records.length) throw new Error("The import file contains duplicate email addresses.");

const sql = neon(databaseUrl());
const beforeRows = await sql.query("SELECT COUNT(*)::integer AS count FROM customers WHERE archived_at IS NULL", []);
const batchSize = 200;
const columns = [
  "id", "name", "email", "phone", "location", "full_address", "city", "country", "postal_code",
  "order_count", "cart_count", "missing_fields", "import_source", "status", "created_at", "updated_at", "archived_at",
];

function customerId(email) {
  const hash = createHash("sha256").update(`brands-republic-customer:${email}`).digest("hex");
  return `cust-import-${hash.slice(0, 32)}`;
}

for (let offset = 0; offset < records.length; offset += batchSize) {
  const batch = records.slice(offset, offset + batchSize);
  const parameters = [];
  const valueGroups = batch.map((record, rowIndex) => {
    const email = String(record.email).trim().toLowerCase();
    const timestamp = String(record.importedAt || new Date().toISOString());
    parameters.push(
      customerId(email), String(record.name).trim(), email, String(record.phone || ""), String(record.location || ""),
      String(record.fullAddress || ""), String(record.city || ""), String(record.country || ""), String(record.postalCode || ""),
      Number(record.orderCount || 0), Number(record.cartCount || 0), String(record.missingFields || ""), String(record.importSource || ""),
      String(record.status), timestamp, timestamp, null,
    );
    const start = rowIndex * columns.length;
    return `(${columns.map((_, columnIndex) => `$${start + columnIndex + 1}`).join(",")})`;
  });

  await sql.query(`
    INSERT INTO customers (${columns.join(",")}) VALUES ${valueGroups.join(",")}
    ON CONFLICT (email) DO UPDATE SET
      name=EXCLUDED.name,
      phone=EXCLUDED.phone,
      location=EXCLUDED.location,
      full_address=EXCLUDED.full_address,
      city=EXCLUDED.city,
      country=EXCLUDED.country,
      postal_code=EXCLUDED.postal_code,
      order_count=EXCLUDED.order_count,
      cart_count=EXCLUDED.cart_count,
      missing_fields=EXCLUDED.missing_fields,
      import_source=EXCLUDED.import_source,
      status=EXCLUDED.status,
      updated_at=EXCLUDED.updated_at,
      archived_at=NULL
  `, parameters);
  console.log(`Imported ${Math.min(offset + batch.length, records.length)} of ${records.length} customers.`);
}

const [afterRows, distribution] = await Promise.all([
  sql.query("SELECT COUNT(*)::integer AS count FROM customers WHERE archived_at IS NULL", []),
  sql.query("SELECT status, COUNT(*)::integer AS count FROM customers WHERE archived_at IS NULL GROUP BY status ORDER BY status", []),
]);

console.log(JSON.stringify({
  sourceRecords: records.length,
  activeCustomersBefore: beforeRows[0].count,
  activeCustomersAfter: afterRows[0].count,
  statusDistribution: distribution,
}, null, 2));
