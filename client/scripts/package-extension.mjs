import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, readdir, readFile, rm, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import yazl from "yazl";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const clientDir = path.resolve(scriptDir, "..");
const distDir = path.join(clientDir, "dist");
const releaseDir = path.join(clientDir, "release");
const packageJsonPath = path.join(clientDir, "package.json");

const packageJson = JSON.parse(await readFile(packageJsonPath, "utf-8"));
const archiveName = `${packageJson.name}-${packageJson.version}.zip`;
const archivePath = path.join(releaseDir, archiveName);

await assertExtensionBuild(distDir);
await mkdir(releaseDir, { recursive: true });
await rm(archivePath, { force: true });

const zipfile = new yazl.ZipFile();
const output = createWriteStream(archivePath);
const completed = new Promise((resolve, reject) => {
  output.on("close", resolve);
  output.on("error", reject);
  zipfile.outputStream.on("error", reject);
});

zipfile.outputStream.pipe(output);
await addDirectoryToZip(zipfile, distDir, distDir);
zipfile.end();
await completed;

console.log(`Packaged ${path.relative(clientDir, archivePath)}`);

async function assertExtensionBuild(directory) {
  const manifestPath = path.join(directory, "manifest.json");
  try {
    await stat(manifestPath);
  } catch {
    throw new Error("Missing dist/manifest.json. Run npm run build before packaging.");
  }
}

async function addDirectoryToZip(zipfile, rootDirectory, currentDirectory) {
  const entries = await readdir(currentDirectory, { withFileTypes: true });
  for (const entry of entries) {
    const absolutePath = path.join(currentDirectory, entry.name);
    const relativePath = path.relative(rootDirectory, absolutePath).split(path.sep).join("/");

    if (entry.isDirectory()) {
      await addDirectoryToZip(zipfile, rootDirectory, absolutePath);
      continue;
    }

    if (entry.isFile()) {
      zipfile.addReadStream(createReadStream(absolutePath), relativePath);
    }
  }
}
