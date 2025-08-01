import { registerGlobalMiddleware } from "@tanstack/react-start";

import { logMiddleware } from "./middleware/logging-middleware";

registerGlobalMiddleware({
    middleware: [
        // Logging middleware for debugging and monitoring
        logMiddleware,
    ],
});
