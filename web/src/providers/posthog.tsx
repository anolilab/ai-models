import { useConsentManager } from "@c15t/react";
// eslint-disable-next-line import/no-named-as-default
import posthog from "posthog-js";
import type { FC, PropsWithChildren } from "react";
import { useEffect } from "react";

let PostHogProvider: FC<{ client: typeof posthog } & PropsWithChildren> | null = null;

if (typeof globalThis.window !== "undefined") {
    import("posthog-js/react").then(
        ({ PostHogProvider: Provider }) => {
            PostHogProvider = Provider;
        },
        (error) => {
            console.warn("Failed to load PostHogProvider:", error);
        },
    );
}

declare global {
    interface Window {
        posthog?: any;
    }
}

export const AnalyticsProvider: FC<PropsWithChildren> = ({ children }) => {
    const { consents } = useConsentManager();

    const hasAnalyticsConsent = consents.measurement;

    useEffect(() => {
        if (
            import.meta.env.DEV ||
            globalThis.window === undefined ||
            !import.meta.env.VITE_POSTHOG_API_KEY ||
            !import.meta.env.VITE_POSTHOG_HOST ||
            !hasAnalyticsConsent
        ) {
            return;
        }

        if (globalThis.posthog && (globalThis.posthog as { __loaded?: boolean }).__loaded) {
            return;
        }

        posthog.init(import.meta.env.VITE_POSTHOG_API_KEY, {
            api_host: import.meta.env.VITE_POSTHOG_HOST,
            bootstrap: {},
            capture_pageview: true,
            loaded: (ph) => {
                if (import.meta.env && import.meta.env.DEV) {
                    ph.opt_in_capturing(); // Ensure capturing is on for debug
                    ph.debug();
                }
            },
            opt_out_capturing_by_default: false,
            opt_out_persistence_by_default: false,
            persistence: hasAnalyticsConsent ? "localStorage+cookie" : "memory",
            person_profiles: "always",
        });
    }, [hasAnalyticsConsent]);

    useEffect(() => {
        if (globalThis.window === undefined || !globalThis.posthog) {
            return;
        }

        if (hasAnalyticsConsent) {
            posthog.opt_in_capturing();
        } else {
            posthog.opt_out_capturing();
        }
    }, [hasAnalyticsConsent]);

    if (globalThis.window === undefined || !PostHogProvider) {
        return <div suppressHydrationWarning>{children}</div>;
    }

    return (
        <div suppressHydrationWarning>
            <PostHogProvider client={posthog}>{children}</PostHogProvider>
        </div>
    );
};

export { usePostHog } from "@/hooks/use-posthog";