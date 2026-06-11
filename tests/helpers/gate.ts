import { Page } from "@playwright/test";

export function setupConsoleGate(page: Page) {
  page.on("pageerror", (exception: Error) => {
    const msg = exception.message || "";
    const stack = exception.stack || "";
    const fullText = `${msg}\n${stack}`;

    if (fullText.includes("Failed to fetch") || fullText.includes("net::ERR_")) {
      return;
    }

    if (
      fullText.includes("TypeError") ||
      fullText.includes("ReferenceError") ||
      fullText.includes("Unhandled Promise") ||
      fullText.includes("unhandledrejection") ||
      fullText.includes("Hydration") ||
      fullText.includes("Text content did not match")
    ) {
      throw new Error(`[Console Error Gate] Strict page error detected: ${fullText}`);
    }
  });

  page.on("console", (msg) => {
    const text = msg.text();
    if (text.includes("Failed to fetch") || text.includes("net::ERR_") || text.includes("RSC payload")) {
      return;
    }

    if (
      text.includes("TypeError") ||
      text.includes("ReferenceError") ||
      text.includes("Unhandled Promise") ||
      text.includes("unhandledrejection") ||
      text.includes("Hydration") ||
      text.includes("Text content did not match")
    ) {
      throw new Error(`[Console Error Gate] Strict console message detected: [${msg.type()}] ${text}`);
    }
  });
}


