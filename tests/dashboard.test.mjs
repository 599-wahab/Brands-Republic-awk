import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const dashboardUrl = new URL("../app/dashboard.tsx", import.meta.url);
const pageUrl = new URL("../app/page.tsx", import.meta.url);
const layoutUrl = new URL("../app/layout.tsx", import.meta.url);
const cssUrl = new URL("../app/globals.css", import.meta.url);
const schemaUrl = new URL("../db/schema.ts", import.meta.url);
const databaseUrl = new URL("../db/index.ts", import.meta.url);
const apiUrl = new URL("../app/api/crm/route.ts", import.meta.url);
const hostingUrl = new URL("../.openai/hosting.json", import.meta.url);
const authUrl = new URL("../app/auth.ts", import.meta.url);
const loginPageUrl = new URL("../app/login/page.tsx", import.meta.url);
const loginRouteUrl = new URL("../app/api/auth/login/route.ts", import.meta.url);
const legacyLoginUrl = new URL("../app/signin-with-chatgpt/page.tsx", import.meta.url);
const importerUrl = new URL("../scripts/import-customers.mjs", import.meta.url);

test("ships the complete customer relationship workspace", async () => {
  const [dashboard, layout] = await Promise.all([readFile(dashboardUrl, "utf8"), readFile(layoutUrl, "utf8")]);
  assert.match(layout, /Brands Republic \| Customer Relationship Hub/);
  for (const feature of ["Follow-ups", "Customer feedback", "Revenue records", "Relationship timeline", "Log conversation", "Detailed remarks \/ comments"]) {
    assert.match(dashboard, new RegExp(feature));
  }
});

test("provides production persistence for every CRM record type", async () => {
  const [schema, database, api, hosting, dashboard] = await Promise.all([readFile(schemaUrl, "utf8"), readFile(databaseUrl, "utf8"), readFile(apiUrl, "utf8"), readFile(hostingUrl, "utf8"), readFile(dashboardUrl, "utf8")]);
  assert.equal(JSON.parse(hosting).d1, null);
  for (const table of ["customers", "interactions", "reminders", "feedback", "revenue"]) assert.match(schema, new RegExp(`pgTable\\(\"${table}\"`));
  assert.match(database, /@neondatabase\/serverless/);
  assert.match(database, /DATABASE_URL/);
  assert.doesNotMatch(dashboard, /DATABASE_URL|NEXT_PUBLIC_DATABASE_URL|VITE_DATABASE_URL/);
  assert.match(api, /export async function GET/);
  assert.match(api, /export async function POST/);
  assert.match(api, /export async function PATCH/);
  assert.match(api, /Authentication required/);
});

test("includes accessible controls, secure auth gating, theme persistence, and responsive CRM layouts", async () => {
  const [dashboard, page, css, auth, loginPage, loginRoute] = await Promise.all([readFile(dashboardUrl, "utf8"), readFile(pageUrl, "utf8"), readFile(cssUrl, "utf8"), readFile(authUrl, "utf8"), readFile(loginPageUrl, "utf8"), readFile(loginRouteUrl, "utf8")]);
  assert.match(page, /getAuthenticatedUser/);
  assert.match(page, /redirect\("\/login"\)/);
  assert.match(auth, /CRM_LOGIN_ID/);
  assert.match(auth, /CRM_LOGIN_PASSWORD/);
  assert.match(auth, /CRM_SESSION_SECRET/);
  assert.match(auth, /crypto\.subtle/);
  assert.match(loginRoute, /httpOnly: true/);
  assert.match(loginRoute, /sameSite: "lax"/);
  assert.match(loginPage, /autoComplete="username"/);
  assert.match(loginPage, /autoComplete="current-password"/);
  assert.match(css, /crm-login-background\.png/);
  assert.match(dashboard, /aria-label=\"Global search\"/);
  assert.match(dashboard, /aria-label=\"Toggle theme\"/);
  assert.match(dashboard, /localStorage\.setItem\(\"cop-theme\"/);
  assert.match(dashboard, /aria-label=\"Close menu\"/);
  assert.match(dashboard, /data-testid=\"customer-profile\"/);
  assert.match(css, /@media\(max-width:780px\)/);
  assert.match(css, /prefers-reduced-motion/);
});

test("supports repeatable customer spreadsheet imports without exposing data files", async () => {
  const [schema, importer] = await Promise.all([readFile(schemaUrl, "utf8"), readFile(importerUrl, "utf8")]);
  for (const field of ["fullAddress", "city", "country", "postalCode", "orderCount", "cartCount", "missingFields", "importSource"]) assert.match(schema, new RegExp(field));
  assert.match(importer, /ON CONFLICT \(email\) DO UPDATE/);
  assert.match(importer, /duplicate email addresses/);
});

test("redirects the legacy Vercel sign-in URL to the environment-backed login", async () => {
  const source = await readFile(legacyLoginUrl, "utf8");
  assert.match(source, /redirect\("\/login"\)/);
});

test("shows a truthful loading state instead of flashing sample customer records", async () => {
  const dashboard = await readFile(dashboardUrl, "utf8");
  assert.match(dashboard, /useState<CRMData>\(emptyCRMData\)/);
  assert.match(dashboard, /loading\?<CRMInitialLoading\/>/);
  assert.doesNotMatch(dashboard, /cust-aisha|Aisha Rahman/);
});

test("validates CRM input and exposes completion workflows", async () => {
  const [dashboard, api] = await Promise.all([readFile(dashboardUrl, "utf8"), readFile(apiUrl, "utf8")]);
  assert.match(api, /Valid name, email, and status are required/);
  assert.match(api, /Feedback needs a 1–5 rating and comment/);
  assert.match(api, /Revenue amount must be greater than zero/);
  assert.match(dashboard, /Follow-up completed/);
  assert.match(dashboard, /Feedback marked as resolved/);
  assert.match(dashboard, /CRM report downloaded/);
});

test("supports editing and deleting every CRM entity with confirmation", async () => {
  const [dashboard, api] = await Promise.all([readFile(dashboardUrl, "utf8"), readFile(apiUrl, "utf8")]);
  for (const table of ["customers", "interactions", "reminders", "feedback", "revenue"]) {
    assert.match(api, new RegExp(`UPDATE ${table}`));
  }
  assert.match(api, /interaction: "interactions", reminder: "reminders", feedback: "feedback", revenue: "revenue"/);
  assert.match(api, /entity = clean\(url\.searchParams\.get\("entity"\)/);
  assert.match(api, /Record not found/);
  assert.match(dashboard, /function RecordActions/);
  assert.match(dashboard, /function ConfirmDelete/);
  assert.match(dashboard, /Save customer changes/);
  assert.match(dashboard, /Save .* changes/);
  assert.match(dashboard, /This action cannot be undone/);
  assert.match(dashboard, /Archive customer/);
});

test("exposes imported customer fields and uses live dates and safe zero denominators", async () => {
  const [dashboard, api] = await Promise.all([readFile(dashboardUrl, "utf8"), readFile(apiUrl, "utf8")]);
  for (const field of ["full_address", "city", "country", "postal_code", "order_count", "cart_count", "missing_fields", "import_source"]) assert.match(api, new RegExp(field));
  assert.doesNotMatch(dashboard, /2026-07-29T12:00:00/);
  assert.match(dashboard, /data\.reminders\.length\?Math\.round/);
  assert.match(dashboard, /customer\.name&&customer\.email&&customer\.phone&&!customer\.missing_fields/);
});

test("uses explicit customer ownership, real notifications, global relationship search, and an explainable pulse", async () => {
  const [dashboard, api, css] = await Promise.all([readFile(dashboardUrl, "utf8"), readFile(apiUrl, "utf8"), readFile(cssUrl, "utf8")]);
  assert.doesNotMatch(dashboard, /data\.customers\[0\]\?\.id/);
  assert.match(dashboard, /name="customerId" value=\{customerId\}/);
  assert.match(dashboard, /Choose a customer from the search results before saving/);
  assert.match(api, /Choose a valid active customer/);
  assert.match(api, /customer_id=COALESCE\(NULLIF\(\$1,''\),customer_id\)/);
  assert.match(dashboard, /matchingRelationshipIds/);
  assert.match(dashboard, /function GlobalSearchResults/);
  assert.match(dashboard, /notificationCount = openReminders\.length \+ openFeedback\.length/);
  assert.match(dashboard, /function relationshipPulse/);
  assert.match(dashboard, /Profile completeness.*50% weight/);
  assert.match(dashboard, /function LedgerActions/);
  assert.match(css, /revenue-table th:last-child.*position:sticky/);
});
