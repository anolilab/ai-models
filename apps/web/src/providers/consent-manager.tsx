import type { ContractsOutputs } from "@c15t/backend";
import type { ConsentManagerProviderProps } from "@c15t/react";
import { ConsentManagerProvider as ClientConsentManagerProvider } from "@c15t/react";
import { createIsomorphicFn } from "@tanstack/react-start";
import { getHeaders } from "@tanstack/react-start/server";

import { showBanner } from "@/lib/consent/show-banner";

const LOCATION_HEADERS = [
    "cf-ipcountry",
    "x-vercel-ip-country",
    "x-amz-cf-ipcountry",
    "x-country-code",
    "x-vercel-ip-country-region",
    "x-region-code",
    "accept-language",
    "user-agent",
] as const;

/**
 * Extract relevant headers for consent banner determination
 * TanStack Start's getHeaders() returns a plain object, not a Headers instance
 */
function extractRelevantHeaders(headers: Record<string, string | undefined>): Record<string, string> {
    const relevantHeaders: Record<string, string> = {};

    for (const headerName of LOCATION_HEADERS) {
        const value = headers[headerName];

        if (value) {
            relevantHeaders[headerName] = value;
        }
    }

    return relevantHeaders;
}

/**
 * Server function to get consent banner data based on request headers
 * Uses TanStack Start's createIsomorphicFn for server-side execution
 */
const getShowConsentBanner = createIsomorphicFn()
    .server(async (): Promise<ContractsOutputs["consent"]["showBanner"]> => {
        try {
            const headers = getHeaders();
            const relevantHeaders = extractRelevantHeaders(headers);

            // Debug logging in development
            if (import.meta.env.DEV) {
                console.log("Consent banner headers:", relevantHeaders);
            }

            // Always return a valid data structure, even with empty headers
            // This ensures the @c15t/react library gets the expected format
            return showBanner(relevantHeaders);
        } catch (error) {
            console.error("Failed to process consent banner:", {
                error: error instanceof Error ? error.message : String(error),
            });

            // Return a fallback data structure instead of undefined
            return showBanner({});
        }
    })
    .client(async (): Promise<ContractsOutputs["consent"]["showBanner"]> =>
        // On client side, return a fallback structure - consent will be managed by existing client-side logic
        showBanner({}),
    );

/**
 * TanStack Start-compatible ConsentManagerProvider
 * Automatically detects user location and jurisdiction requirements server-side
 */
export function ConsentManagerProvider({ children, options }: ConsentManagerProviderProps) {
    // Get initial consent banner data from server
    const initialDataPromise = getShowConsentBanner();

    return (
        <ClientConsentManagerProvider
            options={{
                ...options,
                store: {
                    ...options.store,
                    _initialData: initialDataPromise,
                },
            }}
        >
            {children}
        </ClientConsentManagerProvider>
    );
}
