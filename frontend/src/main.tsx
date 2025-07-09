import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { Toaster } from "@/components/ui/sonner";
import { BrowserRouter } from "react-router-dom";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        richColors
        closeButton
        duration={3000}
        className="z-50"
        toastOptions={{
          className: "bg-card text-card-foreground shadow-lg",
          style: {
            backgroundColor: "var(--background)",
            color: "var(--foreground)",
          },
        }}
      />
    </BrowserRouter>
  </StrictMode>
);
