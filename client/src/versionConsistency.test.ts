import { describe, expect, it } from "vitest";

import manifest from "../manifest.json";
import packageJson from "../package.json";

describe("extension version metadata", () => {
  it("keeps package and manifest versions aligned", () => {
    expect(packageJson.version).toBe(manifest.version);
  });
});
