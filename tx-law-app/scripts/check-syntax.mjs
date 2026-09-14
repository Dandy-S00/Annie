#!/usr/bin/env node
// Static syntax check of every ES module in src/ without needing a bundler.
import { readdir, readFile } from "node:fs/promises";
import { join, extname } from "node:path";
import vm from "node:vm";

const root = process.argv[2] || "src";
let failures = 0;

async function walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) await walk(p);
    else if (extname(p) === ".js" || extname(p) === ".mjs") await check(p);
  }
}

async function check(path) {
  const code = await readFile(path, "utf8");
  try {
    // Parsing as a module surfaces syntax errors without executing imports.
    new vm.SourceTextModule(code, { identifier: path });
    console.log(`ok   ${path}`);
  } catch (err) {
    failures++;
    console.log(`FAIL ${path}\n     ${err.message}`);
  }
}

await walk(root);
console.log(failures ? `\n${failures} file(s) failed to parse.` : "\nAll files parse cleanly.");
process.exit(failures ? 1 : 0);
