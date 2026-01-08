import { createStart } from "@tanstack/react-start";

import logMiddleware from "./middleware/logging-middleware";

// eslint-disable-next-line import/prefer-default-export
export const startInstance = createStart(() => {
    return {
        functionMiddleware: [logMiddleware],
    };
});
