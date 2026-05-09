import React from "react";
import ReactDOM from "react-dom/client";

import SettingsPage from "./SettingsPage";
import "./main.css";

const root = document.getElementById("root");

if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <SettingsPage />
    </React.StrictMode>,
  );
}
