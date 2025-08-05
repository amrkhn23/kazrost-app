// main.jsx

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// Регистрируем service worker (для PWA или Firebase Messaging)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/firebase-messaging-sw.js")
      .then((registration) => {
        console.log("✅ Service Worker зарегистрирован:", registration);
      })
      .catch((err) => {
        console.error("❌ Ошибка регистрации Service Worker:", err);
      });
  });
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
