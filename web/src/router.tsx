import "./index.css";

import { createRouter as createTanStackRouter } from "@tanstack/react-router";

import Loader from "./components/loader";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
    const router = createTanStackRouter({
        context: {},
        defaultNotFoundComponent: () => <div>Not Found</div>,
        defaultPendingComponent: () => <Loader />,
        defaultPreload: "intent",
        defaultPreloadStaleTime: 0,
        defaultStaleTime: 0,
        defaultViewTransition: true,
        routeTree,
        scrollRestoration: true,
    });

    return router;
};

declare module "@tanstack/react-router" {
    interface Register {
        router: ReturnType<typeof getRouter>;
    }
}
