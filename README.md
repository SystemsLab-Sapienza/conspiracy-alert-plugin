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
  - [Server Setup](#server-setup)
  - [Client Setup](#client-setup)
- [Building the Client](#building-the-client)
- [Installing the Browser Plugin](#installing-the-browser-plugin)
- [Usage](#usage)

## Overview

This repository contains the code for both the server and client sides of conspiracy alert plugin. The server handles backend operations, while the client is responsible for the frontend interface that users interact with in their browsers.

## Prerequisites

Before you begin, ensure you have the following installed:

- Python 3.x
- Node.js and npm
- Git

## Installation

### Server Setup

1. Clone the repository:
    ```bash
      git clone https://github.com/SystemsLab-Sapienza/conspiracy-alert-plugin.git
      cd conspiracy-alert-plugin/server
    ```

2. Create a virtual environment:
    ```bash
      python3 -m venv venv
    ```

3. Activate the virtual environment:

    - On macOS/Linux:

      ```bash
        source venv/bin/activate
      ```

    - On Windows:

      ```bash
        venv\Scripts\activate
      ```
      
4. Install the required Python packages:

    ```bash
      pip3 install -r requirements.txt
    ```

5. Start the server:

    ```bash
      python3 server.py
    ```

### Client Setup

1. Navigate to the client directory:

    ```bash
      cd ../client
    ```

2. Install the required Node.js packages:

    ```bash
      npm install
    ```

## Building the Client

To build the client for production, run the following command in the client directory:

```bash
  npm run build
```

This will create a production-ready build of the client in the `dist` folder.

## Installing the Browser Plugin

To install the custom browser plugin, follow these steps:

1. Open Chrome and go to `chrome://extensions/`.
2. Enable "Developer mode" by toggling the switch in the top right corner.
3. Click on "Load unpacked".
4. Select the `dist` folder from the client directory where the build was created.
5. The plugin should now be installed and visible in your extensions.

## Usage

Once the plugin is installed, you can access its features directly from your browser's toolbar.