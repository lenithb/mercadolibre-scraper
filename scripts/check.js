// chequeo rápido: recorre el proyecto y corre `node --check` sobre cada
// archivo .js, para detectar errores de sintaxis sin llegar a correr el scraper
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const SKIP_DIRS = new Set(["node_modules", "output", "debug", ".git"]);

function collectJsFiles(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectJsFiles(fullPath, files);
    } else if (entry.name.endsWith(".js")) {
      files.push(fullPath);
    }
  }
  return files;
}

const root = path.join(__dirname, "..");
const files = collectJsFiles(root);
let hasError = false;

for (const file of files) {
  try {
    execFileSync(process.execPath, ["--check", file], { stdio: "inherit" });
  } catch {
    hasError = true;
  }
}

if (hasError) {
  console.error("\nfalló el chequeo de sintaxis");
  process.exit(1);
}

console.log(`los ${files.length} archivos pasaron el chequeo de sintaxis`);
