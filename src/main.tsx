import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import App from "./App.tsx";
import "./index.css";
import "./accessibility.css";
import "./animations.css";
import "./button-effects.css";
import { setupErrorTracking } from "./services/logger";

// Initialize error tracking
setupErrorTracking();

createRoot(document.getElementById("root")!).render(
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <App />
  </ThemeProvider>
);
