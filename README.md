# Conspiracy Alert Plugin

This repository provides the conspiracy alert plugin cited in the USENIX Security 2025 paper:

**[The Conspiracy Money Machine: Uncovering Telegram's Conspiracy Channels and their Profit Model](https://arxiv.org/abs/2310.15977)**

If you use this plugin, or the findings from the paper, please cite:

```
@inproceedings{imperati2025conspiracy,
  title={The Conspiracy Money Machine: Uncovering Telegram's Conspiracy Channels and their Profit Model},
  author={Imperati, Vincenzo and La Morgia, Massimo and Mei, Alessandro and Mongardini, Alberto Maria and Sassi, Francesco},
  booktitle={34th USENIX Security Symposium (USENIX Security 25)},
  year={2025}
}
```

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
  - [Backend Setup](#backend-setup)
  - [Client Setup](#client-setup)
- [Building the Client](#building-the-client)
- [Installing the Browser Plugin](#installing-the-browser-plugin)
- [Usage](#usage)

## Overview

This repository contains the browser extension client for the Channel Checker backend. The rebuilt
client calls the FastAPI backend from `channel-checker-bot`, stores only the latest tab evaluation
in Chrome local extension storage, and renders a compact popup for the current tab. The backend URL
defaults to `http://127.0.0.1:8000` and can be changed from the extension options page.
When a page URL matches a dataset or monetization signal, the extension also shows a non-blocking
in-page banner and marks the extension icon with a per-tab badge.

For a reviewer-friendly setup path, start with [ARTIFACT.md](ARTIFACT.md).

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js 24 with npm, matching CI.
- Git.
- The sibling `channel-checker-bot` and `conspiracy-dataset-telegram` repositories when running
  the extension against the paper artifact backend.

## Installation

### Backend Setup

Run the backend from the sibling `channel-checker-bot` repository:

```bash
cd ../channel-checker-bot
CHANNEL_CHECKER_DATASET_DIR=../conspiracy-dataset-telegram \
PYTHONPATH=src uvicorn --factory channel_checker.api.server:create_app_from_environment \
  --host 127.0.0.1 \
  --port 8000
```

### Client Setup

1. Navigate to the client directory:

    ```bash
      cd client
    ```

2. Install the required Node.js packages:

    ```bash
      npm ci
    ```

3. Run client checks:

    ```bash
      npm test
      npm run check
      npm run build
    ```

## Building the Client

To build the client for production, run the following command in the client directory:

```bash
  npm run build
```

This will create a production-ready build of the client in the `dist` folder.

To create the installable ZIP artifact used by CI:

```bash
  npm run package
```

The archive is written to `client/release/` and contains the built extension files from `dist`.

## Installing the Browser Plugin

To install the custom browser plugin, follow these steps:

1. Open Chrome and go to `chrome://extensions/`.
2. Enable "Developer mode" by toggling the switch in the top right corner.
3. Click on "Load unpacked".
4. Select the `dist` folder from the client directory where the build was created.
5. The plugin should now be installed and visible in your extensions.

## Usage

Once the plugin is installed, you can access its features directly from your browser's toolbar.
Use the popup Settings button, or the browser extension details page, to configure a non-default
backend URL.

On matching pages, the content script asks the background worker to evaluate the current URL and
shows a dismissible banner inside the page. The browser toolbar popup does not open automatically.
Dataset/resource matches are labeled as questionable resources; affiliate, donation, crowdfunding,
marketplace, and commerce-path matches are labeled as monetization signals. If the backend is
unavailable, the page is not modified and the extension icon shows a `?` badge.

Automatic in-page checks are enabled by default and can be disabled from the extension options
page. The popup still supports manual checks through `Check now`.

## License

This software artifact is released under the MIT License. See [LICENSE](LICENSE).
