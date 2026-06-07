import { readdir, stat } from "fs/promises";
import { join, resolve } from "path";

async function walk(dir) {
  let files = [];
  const list = await readdir(dir);
  for (const file of list) {
    const filePath = join(dir, file);
    const s = await stat(filePath);
    if (s.isDirectory()) {
      files = files.concat(await walk(filePath));
    } else if (file.endsWith("page.js")) {
      files.push(filePath);
    }
  }
  return files;
}

async function test() {
  const appDir = resolve("./.next/server/app");
  console.log("Scanning directory:", appDir);
  const pageFiles = await walk(appDir);
  console.log(`Found ${pageFiles.length} page.js files.`);

  for (const file of pageFiles) {
    console.log("Testing import of:", file);
    try {
      // Import the compiled page JS file
      const mod = await import("file://" + file.replace(/\\/g, "/"));
      console.log("✓ Success:", file);
    } catch (err) {
      console.error("✗ Error importing:", file);
      console.error(err);
    }
  }
}

test();
