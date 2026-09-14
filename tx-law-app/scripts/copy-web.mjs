#!/usr/bin/env node
// Copies source files into www/ for Capacitor to package into the Android app.
// The web UI is dependency-free ES modules, so this is a copy, not a bundle —
// keeping the app buildable with nothing but Node and no network access.
import { cp, mkdir, readdir, readFile, writeFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url)) + "/..";
const www = join(root, "www");
const src = join(root, "src");

async function countFiles(dir) {
  let n = 0;
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) n += await countFiles(join(dir, entry.name));
    else n += 1;
  }
  return n;
}

// Cache-busting token so a rebuilt app never serves a stale JS bundle.
function stamp() {
  const d = new Date();
  const p = (x) => String(x).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}`;
}

async function main() {
  await mkdir(join(www, "js"), { recursive: true });

  // Wipe stale copies so a removed module cannot linger in the packaged app.
  await rm(join(www, "js"), { recursive: true, force: true });
  await mkdir(join(www, "js"), { recursive: true });

  await cp(join(src, "core"), join(www, "js", "core"), { recursive: true });
  await cp(join(src, "data"), join(www, "js", "data"), { recursive: true });
  await cp(join(src, "app.js"), join(www, "js", "app.js"));
  await cp(join(src, "styles.css"), join(www, "styles.css"));

  const idx = join(www, "index.html");
  if (existsSync(idx)) {
    let html = await readFile(idx, "utf8");
    html = html.replace(/__BUILD__/g, stamp());
    await writeFile(idx, html, "utf8");
  }

  const total = await countFiles(www);
  console.log(`Copied src -> www. www now has ${total} files.`);
  console.log(existsSync(idx) ? "www/index.html present." : "WARNING: www/index.html is missing.");

  // The app source uses ./js/... paths relative to www/index.html, and the
  // data layer imports across folders (../data, ../core). Verify those resolve.
  const needs = [
    ["js/app.js", true],
    ["js/core/comparison.js", true],
    ["js/core/courts.js", true],
    ["js/core/defastra.js", true],
    ["js/data/attorneys.js", true],
    ["js/data/caseTypes.js", true],
    ["js/data/outcomes.js", true],
    ["js/data/statutes.js", true],
    ["styles.css", true],
    ["index.html", true],
    ["manifest.webmanifest", true],
    ["icons/icon-192.png", false],
    ["icons/icon-512.png", false],
  ];
  const missing = needs.filter(([p, required]) => required && !existsSync(join(www, p))).map(([p]) => p);
  if (missing.length) {
    console.error("MISSING REQUIRED FILES: " + missing.join(", "));
    process.exit(1);
  }
  console.log("All required assets present.");
}

main().catch((err) => {
  console.error("build failed:", err.message);
  process.exit(1);
});
