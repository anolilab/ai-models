import { useConsentManager } from "@c15t/react";
import posthog from "posthog-js";
import { PostHogProvider, usePostHog as usePH } from "posthog-js/react";
import type { FC, PropsWithChildren } from "react";
import { useEffect } from "react";

// Extend the Window interface to include PostHog
declare global {
    interface Window {
        posthog?: any;
    }
}

export const AnalyticsProvider: FC<PropsWithChildren> = ({ children }) => {
    const { consents } = useConsentManager();

    // Check if user has given consent for measurement (analytics) category
    const hasAnalyticsConsent = consents.measurement;

    useEffect(() => {
        // Don't initialize PostHog in development, if window is not available,
        // if environment variables are missing, or if analytics consent is not given
        if (
            import.meta.env.DEV
                || typeof window === "undefined"
                || !import.meta.env.VITE_POSTHOG_API_KEY
                || !import.meta.env.VITE_POSTHOG_HOST
                || !hasAnalyticsConsent
        ) {
            return;
        }

        // Check if PostHog is already initialized to avoid double initialization
        if (window.posthog && (window.posthog as any).__loaded) {
            return;
        }

        posthog.init(import.meta.env.VITE_POSTHOG_API_KEY, {
            api_host: import.meta.env.VITE_POSTHOG_HOST,
            // Ensure flags are loaded before rendering the app, if you use feature flags
            bootstrap: {
                // distinctID: 'your_distinct_id', // Optional: if you have a distinct ID to set
                // isIdentifiedID: false, // Optional: set to true if the distinctID is from an identify call
                // featureFlags: { 'beta-feature': true, 'another-flag': 'variant' }, // Optional: initial feature flags
                // featureFlagPayloads: { 'another-flag': { value: 'something' } }, // Optional: initial feature flag payloads
            },
            capture_pageview: true,
            loaded: (ph) => {
                if (import.meta.env && import.meta.env.DEV) {
                    ph.opt_in_capturing(); // Ensure capturing is on for debug
                    ph.debug();
                }
            },
            // Respect user's consent preferences
            opt_out_capturing_by_default: false,
            opt_out_persistence_by_default: false,
            persistence: hasAnalyticsConsent ? "localStorage+cookie" : "memory",
            person_profiles: "always",
        });
    }, [hasAnalyticsConsent]); // Re-run when consent changes

    // Effect to handle consent changes after initialization
    useEffect(() => {
        if (typeof window === "undefined" || !window.posthog)
            return;

        if (hasAnalyticsConsent) {
            // User has given consent - opt in to capturing
            posthog.opt_in_capturing();
        } else {
            // User has withdrawn consent - opt out of capturing
            posthog.opt_out_capturing();
        }
    }, [hasAnalyticsConsent]);

    return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
};

// Export a hook to use PostHog in components with consent check
export const usePostHog = () => {
    const { consents } = useConsentManager();
    const posthogInstance = usePH();
    const hasAnalyticsConsent = consents.measurement;

    // Return a wrapped PostHog instance that respects consent
    return {
        ...posthogInstance,
        // Add other commonly used PostHog methods with consent checks
        alias: (alias: string, distinctId?: string) => {
            if (hasAnalyticsConsent && posthogInstance) {
                return posthogInstance.alias(alias, distinctId);
            }

            if (import.meta.env.DEV) {
                console.log("PostHog alias blocked - no measurement consent", { alias, distinctId });
            }
        },
        capture: (event: string, properties?: Record<string, any>) => {
            if (hasAnalyticsConsent && posthogInstance) {
                return posthogInstance.capture(event, properties);
            }

            // If no consent, do nothing or log for debugging
            if (import.meta.env.DEV) {
                console.log("PostHog capture blocked - no measurement consent", { event, properties });
            }
        },
        group: (groupType: string, groupKey: string, properties?: Record<string, any>) => {
            if (hasAnalyticsConsent && posthogInstance) {
                return posthogInstance.group(groupType, groupKey, properties);
            }

            if (import.meta.env.DEV) {
                console.log("PostHog group blocked - no measurement consent", { groupKey, groupType, properties });
            }
        },
        identify: (distinctId?: string, properties?: Record<string, any>) => {
            if (hasAnalyticsConsent && posthogInstance) {
                return posthogInstance.identify(distinctId, properties);
            }

            if (import.meta.env.DEV) {
                console.log("PostHog identify blocked - no measurement consent", { distinctId, properties });
            }
        },
        reset: () => {
            if (hasAnalyticsConsent && posthogInstance) {
                return posthogInstance.reset();
            }

            if (import.meta.env.DEV) {
                console.log("PostHog reset blocked - no measurement consent");
            }
        },
    };
};
