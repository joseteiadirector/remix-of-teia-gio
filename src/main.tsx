import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Simple bootstrap
const rootEl = document.getElementById("root");
if (rootEl) {
  createRoot(rootEl).render(<App />);
}

