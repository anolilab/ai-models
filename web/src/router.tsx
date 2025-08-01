import "./index.css";

import { createRouter as createTanStackRouter } from "@tanstack/react-router";

import Loader from "./components/loader";
import { routeTree } from "./routeTree.gen";

export const createRouter = () => {
    const router = createTanStackRouter({
        context: {},
        defaultNotFoundComponent: () => <div>Not Found</div>,
        defaultPendingComponent: () => <Loader />,
        defaultPreloadStaleTime: 0,
        routeTree,
        scrollRestoration: true,
        Wrap: ({ children }) => <>{children}</>,
    });

    return router;
};

declare module "@tanstack/react-router" {
    interface Register {
        router: ReturnType<typeof createRouter>;
    }
}
