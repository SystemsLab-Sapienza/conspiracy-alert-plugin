import { mkdirSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const backendDir = path.resolve(process.env.CHANNEL_CHECKER_BACKEND_DIR ?? "../../channel-checker-bot");
const datasetDir = path.resolve(
  process.env.CHANNEL_CHECKER_DATASET_DIR ?? "../../conspiracy-dataset-telegram",
);
const outputDir = path.resolve("openapi");
const outputPath = path.join(outputDir, "channel-checker.openapi.json");

mkdirSync(outputDir, { recursive: true });

const result = spawnSync(
  "python3",
  [
    "-m",
    "channel_checker.cli",
    "export-openapi",
    "--dataset-dir",
    datasetDir,
    "--output",
    outputPath,
  ],
  {
    cwd: backendDir,
    env: {
      ...process.env,
      PYTHONPATH: "src",
    },
    encoding: "utf8",
  },
);

if (result.status !== 0) {
  process.stderr.write(result.stderr);
  process.exit(result.status ?? 1);
}

process.stdout.write(`Wrote ${outputPath}\n`);
