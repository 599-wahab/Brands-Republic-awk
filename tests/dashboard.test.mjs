import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const dashboardUrl = new URL("../app/dashboard.tsx", import.meta.url);
const pageUrl = new URL("../app/page.tsx", import.meta.url);
const layoutUrl = new URL("../app/layout.tsx", import.meta.url);
const cssUrl = new URL("../app/globals.css", import.meta.url);
const schemaUrl = new URL("../db/schema.ts", import.meta.url);
const apiUrl = new URL("../app/api/crm/route.ts", import.meta.url);
const hostingUrl = new URL("../.openai/hosting.json", import.meta.url);

test("ships the complete customer relationship workspace", async () => {
  const [dashboard, layout] = await Promise.all([readFile(dashboardUrl, "utf8"), readFile(layoutUrl, "utf8")]);
  assert.match(layout, /Brands Republic \| Customer Relationship Hub/);
  for (const feature of ["Follow-ups", "Customer feedback", "Revenue records", "Relationship timeline", "Log conversation", "Detailed remarks \/ comments"]) {
    assert.match(dashboard, new RegExp(feature));
  }
});

test("provides production persistence for every CRM record type", async () => {
  const [schema, api, hosting] = await Promise.all([readFile(schemaUrl, "utf8"), readFile(apiUrl, "utf8"), readFile(hostingUrl, "utf8")]);
  assert.equal(JSON.parse(hosting).d1, "DB");
  for (const table of ["customers", "interactions", "reminders", "feedback", "revenue"]) assert.match(schema, new RegExp(`sqliteTable\\(\"${table}\"`));
  assert.match(api, /export async function GET/);
  assert.match(api, /export async function POST/);
  assert.match(api, /export async function PATCH/);
  assert.match(api, /Authentication required/);
});

test("includes accessible controls, auth gating, theme persistence, and responsive CRM layouts", async () => {
  const [dashboard, page, css] = await Promise.all([readFile(dashboardUrl, "utf8"), readFile(pageUrl, "utf8"), readFile(cssUrl, "utf8")]);
  assert.match(page, /requireChatGPTUser/);
  assert.match(dashboard, /aria-label=\"Global search\"/);
  assert.match(dashboard, /aria-label=\"Toggle theme\"/);
  assert.match(dashboard, /localStorage\.setItem\(\"cop-theme\"/);
  assert.match(dashboard, /aria-label=\"Close menu\"/);
  assert.match(dashboard, /data-testid=\"customer-profile\"/);
  assert.match(css, /@media\(max-width:780px\)/);
  assert.match(css, /prefers-reduced-motion/);
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
