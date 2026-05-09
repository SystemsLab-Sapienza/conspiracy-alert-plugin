# Paper Artifact Guide

This guide is the shortest path for an external reviewer to run the browser extension client for
the paper artifact.

## Scope

This repository contains the Chrome/Chromium extension client. It does not embed the public
datasets and does not reimplement the backend. The extension calls the FastAPI service from
`channel-checker-bot` and displays:

- a toolbar popup for the active tab;
- a manual `Check now` action;
- an optional in-page banner when the current page URL matches a dataset or monetization signal;
- a per-tab badge for matched pages or backend errors.

## Paper Alignment

The paper describes ConspiracyAlert as a Chrome TypeScript browser plug-in that observes web
navigation, sends the loaded page URL to a remote server, checks it against the Conspiracy Resource
Dataset and URL dataset, and displays an informative warning when a match exists.

This artifact implements that workflow as a Manifest V3 extension:

- the content script evaluates the loaded page URL through the background worker;
- the background worker calls the shared Channel Checker backend;
- matched pages show an in-page warning banner and toolbar badge;
- the popup lets users inspect the current tab status and run a manual `Check now`;
- automatic in-page checks can be disabled from the options page;
- extension storage is limited to configuration and the latest tab evaluation state.

The extension intentionally does not ship the datasets or a separate Flask server. Matching stays
in the backend so the browser artifact remains small and privacy boundaries are easier to audit.

Related repositories:

- `channel-checker-bot`: backend API and optional Telegram bot;
- `conspiracy-dataset-telegram`: public CSV datasets consumed by the backend.

## Prerequisites

- Chrome or Chromium with extension developer mode available;
- Node.js 24 with npm;
- the backend running at `http://127.0.0.1:8000`;
- the expected sibling checkout layout:

```text
SystemsLab-Sapienza/
  channel-checker-bot/
  conspiracy-dataset-telegram/
  conspiracy-alert-plugin/
```

## Start The Backend

From `channel-checker-bot`:

```bash
docker build -t channel-checker-bot:local .
docker run --rm \
  -p 8000:8000 \
  -e CHANNEL_CHECKER_DATASET_DIR=/data \
  -v "$(pwd)/../conspiracy-dataset-telegram:/data:ro" \
  channel-checker-bot:local
```

Verify it:

```bash
curl -s http://127.0.0.1:8000/health
curl -s -X POST http://127.0.0.1:8000/v1/evaluate-url \
  -H "Content-Type: application/json" \
  -d '{"url":"https://8kun.top/qresearch/catalog.html"}'
```

The first command should return `{"status":"ok","version":"0.1.0"}`. The second should return a
matched result.

## Build And Load The Extension

From `conspiracy-alert-plugin/client`:

```bash
npm ci
npm run build
```

Then:

1. Open `chrome://extensions/`.
2. Enable Developer mode.
3. Click `Load unpacked`.
4. Select `conspiracy-alert-plugin/client/dist`.
5. Open the extension options page and confirm the backend URL is `http://127.0.0.1:8000`.

## Manual Smoke Test

With the backend running and the extension loaded:

1. Open `https://www.amazon.com/?tag=example-20`.
2. Wait for the page to finish loading.
3. The extension should show a non-blocking in-page banner for monetization signals.
4. The toolbar popup should show the current tab status.
5. Disable automatic page checks in the extension options page.
6. Reload the page and confirm the banner does not appear automatically.
7. Use `Check now` in the popup to run a manual check.

This smoke test uses a monetization signal because it does not depend on any third-party page from
the public dataset being reachable during review.

## Package Artifact

```bash
npm run package
```

The ZIP is written to `client/release/conspiracy-alert-plugin-1.0.0.zip` and contains the built
extension files from `client/dist`.

## Verification Commands

```bash
npm run check
npm test
npm run build
npm run package
npm run check:api-types
npm run test:e2e
```

CI installs dependencies with `npm ci`, audits dependencies at moderate severity, runs TypeScript
checks, unit tests, production build, package creation, and Playwright extension E2E tests.

`npm run check:api-types` regenerates the backend OpenAPI schema from the sibling
`channel-checker-bot` checkout and verifies that generated frontend types are current.

## Privacy And Storage

The extension stores only configuration and the latest evaluation state needed for the active tab.
It does not store browsing history, raw page content, Telegram data, or dataset contents. The
backend performs all matching.

## Troubleshooting

- `?` badge: backend unavailable or returned an error. Check `http://127.0.0.1:8000/health`.
- No in-page banner: automatic checks may be disabled, the page URL may have no signal, or the
  backend may not be running.
- Custom backend URL: set it from the options page. The extension may request additional host
  permission for non-default origins.

## License

This software artifact is released under the MIT License. See [LICENSE](LICENSE).
