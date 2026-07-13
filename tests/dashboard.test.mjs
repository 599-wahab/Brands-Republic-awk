import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pageUrl = new URL("../app/page.tsx", import.meta.url);
const layoutUrl = new URL("../app/layout.tsx", import.meta.url);
const cssUrl = new URL("../app/globals.css", import.meta.url);

test("ships product metadata and core operational metrics", async () => {
  const [page, layout] = await Promise.all([
    readFile(pageUrl, "utf8"),
    readFile(layoutUrl, "utf8"),
  ]);

  assert.match(layout, /Brands Republic \| Customer Operations/);
  assert.match(page, /Good afternoon, Adnan/);
  assert.match(page, /Total customers/);
  assert.match(page, /8,964/);
  assert.match(page, /Returning customers/);
  assert.match(page, /Abandoned carts/);
  assert.match(page, /Needs review/);
});

test("includes accessible search, theme persistence, and responsive navigation", async () => {
  const [page, css] = await Promise.all([
    readFile(pageUrl, "utf8"),
    readFile(cssUrl, "utf8"),
  ]);

  assert.match(page, /aria-label="Global search"/);
  assert.match(page, /aria-label="Toggle theme"/);
  assert.match(page, /localStorage\.setItem\("cop-theme"/);
  assert.match(page, /aria-label="Close menu"/);
  assert.match(css, /@media\(max-width:780px\)/);
  assert.match(css, /prefers-reduced-motion/);
});
