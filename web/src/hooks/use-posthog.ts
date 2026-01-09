import { useConsentManager } from "@c15t/react";

// Client-side hook loader
let usePH: (() => unknown) | null = null;

// Initialize hook on client side
if (globalThis.window !== undefined) {
    import("posthog-js/react").then(
        (posthogReact) => {
            usePH = posthogReact.usePostHog;
        },
        (error) => {
            console.warn("Failed to load PostHog hooks:", error);
        },
    );
}

// Export a hook to use PostHog in components with consent check
export const usePostHog = (): Record<string, unknown> => {
    const { consents } = useConsentManager();
    const hasAnalyticsConsent = consents.measurement;

    // Always call the hook if available, but return empty object if not
    const posthogInstance = usePH ? usePH() : {};

    // Return a wrapped PostHog instance that respects consent
    return {
        ...posthogInstance,
        // Add other commonly used PostHog methods with consent checks
        alias: (alias: string, distinctId?: string): void => {
            if (hasAnalyticsConsent && posthogInstance && typeof posthogInstance.alias === "function") {
                posthogInstance.alias(alias, distinctId);

                return;
            }

            if (import.meta.env.DEV) {
                console.log("PostHog alias blocked - no measurement consent", { alias, distinctId });
            }
        },
        capture: (event: string, properties?: Record<string, unknown>): void => {
            if (hasAnalyticsConsent && posthogInstance && typeof posthogInstance.capture === "function") {
                posthogInstance.capture(event, properties);

                return;
            }

            if (import.meta.env.DEV) {
                console.log("PostHog capture blocked - no measurement consent", { event, properties });
            }
        },
        group: (groupType: string, groupKey: string, properties?: Record<string, unknown>): void => {
            if (hasAnalyticsConsent && posthogInstance && typeof posthogInstance.group === "function") {
                posthogInstance.group(groupType, groupKey, properties);

                return;
            }

            if (import.meta.env.DEV) {
                console.log("PostHog group blocked - no measurement consent", { groupKey, groupType, properties });
            }
        },
        identify: (distinctId?: string, properties?: Record<string, unknown>): void => {
            if (hasAnalyticsConsent && posthogInstance && typeof posthogInstance.identify === "function") {
                posthogInstance.identify(distinctId, properties);

                return;
            }

            if (import.meta.env.DEV) {
                console.log("PostHog identify blocked - no measurement consent", { distinctId, properties });
            }
        },
        reset: (): void => {
            if (hasAnalyticsConsent && posthogInstance && typeof posthogInstance.reset === "function") {
                posthogInstance.reset();

                return;
            }

            if (import.meta.env.DEV) {
                console.log("PostHog reset blocked - no measurement consent");
            }
        },
    };
};