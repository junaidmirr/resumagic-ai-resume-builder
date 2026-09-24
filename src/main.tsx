import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

// Enhance native window.alert to handle { title, description } objects gracefully across all app views
if (typeof window !== "undefined") {
  const originalAlert = window.alert;
  window.alert = function (message?: any) {
    if (message && typeof message === "object") {
      const title = message.title || "";
      const desc =
        message.description || message.message || JSON.stringify(message);
      const formatted = title && desc ? `${title}\n\n${desc}` : title || desc;
      return originalAlert.call(window, formatted);
    }
    return originalAlert.call(window, message);
  };
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
