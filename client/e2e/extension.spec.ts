import { expect, test, chromium, type BrowserContext } from "@playwright/test";
import { createServer, type Server } from "node:http";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const BACKEND_PORT = 8000;
const PAGE_PORT = 8765;

test.describe("extension in-page alert", () => {
  let backend: Server;
  let pageServer: Server;
  let context: BrowserContext;
  let userDataDir: string;
  let backendRequests = 0;

  test.beforeAll(async () => {
    backend = await listen(
      createBackendServer(() => {
        backendRequests += 1;
      }),
      BACKEND_PORT,
    );
    pageServer = await listen(createPageServer(), PAGE_PORT);

    userDataDir = mkdtempSync(path.join(tmpdir(), "conspiracy-alert-e2e-"));
    const extensionPath = path.resolve("dist");
    context = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    });
    await waitForExtensionServiceWorker(context);
  });

  test.beforeEach(async () => {
    backendRequests = 0;
    await setExtensionSettings(context, {
      apiBaseUrl: "http://127.0.0.1:8000",
      automaticChecksEnabled: true,
    });
  });

  test.afterAll(async () => {
    await context?.close();
    await closeServer(pageServer);
    await closeServer(backend);
    if (userDataDir) {
      rmSync(userDataDir, { recursive: true, force: true });
    }
  });

  test("shows a page banner for matched URLs", async () => {
    const page = await context.newPage();

    await page.goto(`http://127.0.0.1:${PAGE_PORT}/trigger`);

    await expect.poll(() => backendRequests).toBeGreaterThan(0);
    await expect(page.getByText("Questionable resource detected")).toBeVisible();
    await expect(page.getByText("Questionable content.")).toBeVisible();
  });

  test("does not request backend when automatic page checks are disabled", async () => {
    await setExtensionSettings(context, {
      apiBaseUrl: "http://127.0.0.1:8000",
      automaticChecksEnabled: false,
    });
    const page = await context.newPage();

    await page.goto(`http://127.0.0.1:${PAGE_PORT}/disabled`);

    await page.waitForTimeout(300);
    expect(backendRequests).toBe(0);
    await expect(page.getByText("Questionable resource detected")).toHaveCount(0);
  });
});

async function waitForExtensionServiceWorker(context: BrowserContext): Promise<void> {
  const existing = context.serviceWorkers()[0];
  const serviceWorker = existing ?? (await context.waitForEvent("serviceworker"));
  expect(serviceWorker.url()).toContain("service-worker-loader.js");
}

async function setExtensionSettings(
  context: BrowserContext,
  settings: { apiBaseUrl: string; automaticChecksEnabled: boolean },
): Promise<void> {
  const serviceWorker = context.serviceWorkers()[0] ?? (await context.waitForEvent("serviceworker"));
  await serviceWorker.evaluate((nextSettings) => {
    return chrome.storage.sync.set({ settings: nextSettings });
  }, settings);
}

function createBackendServer(onEvaluateUrl: () => void): Server {
  return createServer((request, response) => {
    if (request.method === "POST" && request.url === "/v1/evaluate-url") {
      onEvaluateUrl();
      let body = "";
      request.on("data", (chunk: Buffer) => {
        body += chunk.toString("utf8");
      });
      request.on("end", () => {
        const payload = JSON.parse(body) as { url: string };
        const normalizedUrl = new URL(payload.url).host;
        response.writeHead(200, { "Content-Type": "application/json" });
        response.end(
          JSON.stringify({
            status: "matched",
            normalized_url: normalizedUrl,
            matches: [],
            signals: [
              {
                type: "resource_dataset",
                severity: "high",
                count: 1,
                message: "Questionable content.",
              },
            ],
          }),
        );
      });
      return;
    }

    response.writeHead(404);
    response.end();
  });
}

function createPageServer(): Server {
  return createServer((_request, response) => {
    response.writeHead(200, { "Content-Type": "text/html" });
    response.end("<!doctype html><title>Trigger</title><main>Trigger page</main>");
  });
}

function listen(server: Server, port: number): Promise<Server> {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => resolve(server));
  });
}

function closeServer(server: Server | undefined): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!server?.listening) {
      resolve();
      return;
    }

    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}
