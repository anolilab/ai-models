import { StrictMode, startTransition } from "react";
import { hydrateRoot } from "react-dom/client";
import { StartClient } from "@tanstack/react-start";
import { createRouter } from "@/router";
import { initPerformanceMonitoring, performanceTracker } from "@/utils/performance";

// Initialize performance monitoring
initPerformanceMonitoring();

// Measure router creation time
performanceTracker.start("router-creation");
const router = createRouter();
performanceTracker.end("router-creation");

// Measure hydration time
performanceTracker.start("hydration");

startTransition(() => {
    hydrateRoot(
        document,
        <StrictMode>
            <StartClient router={router} />
        </StrictMode>,
    );

    // End hydration measurement after a brief delay to ensure completion
    setTimeout(() => {
        performanceTracker.end("hydration");
    }, 0);
});
