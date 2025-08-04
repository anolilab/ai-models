/**
 * Performance monitoring utilities with consent-aware analytics
 */

// Types for performance metrics
export interface PerformanceMetric {
    name: string;
    rating: "good" | "needs-improvement" | "poor";
    timestamp: number;
    value: number;
}

export interface WebVitalsMetric {
    delta: number;
    name: "CLS" | "FCP" | "LCP" | "TTFB" | "INP";
    rating: "good" | "needs-improvement" | "poor";
    value: number;
}

// Thresholds based on Core Web Vitals recommendations
const THRESHOLDS = {
    CLS: { good: 0.1, poor: 0.25 },
    FCP: { good: 1800, poor: 3000 },
    INP: { good: 200, poor: 500 },
    LCP: { good: 2500, poor: 4000 },
    TTFB: { good: 800, poor: 1800 },
} as const;

/**
 * Consent-aware PostHog wrapper
 * This function safely captures events only when analytics consent is given
 */
function captureWithConsent(eventName: string, properties: Record<string, any> = {}): void {
    if (typeof window === "undefined") return;

    // Check if PostHog is available and consent is given
    // The AnalyticsProvider will handle consent checking, so if posthog is available, consent was given
    if ((window as any).posthog && typeof (window as any).posthog.capture === "function") {
        try {
            (window as any).posthog.capture(eventName, properties);
        } catch (error) {
            console.warn("[Performance] Failed to capture analytics event:", error);
        }
    }
}

/**
 * Get performance rating based on metric value and thresholds
 */
export function getPerformanceRating(metric: keyof typeof THRESHOLDS, value: number): "good" | "needs-improvement" | "poor" {
    const threshold = THRESHOLDS[metric];

    if (value <= threshold.good) return "good";

    if (value <= threshold.poor) return "needs-improvement";

    return "poor";
}

/**
 * Initialize Web Vitals monitoring
 * Dynamically imports web-vitals to avoid bundling in SSR
 */
export async function initWebVitals(onMetric?: (metric: WebVitalsMetric) => void): Promise<void> {
    if (typeof window === "undefined") return;

    try {
        const { onCLS, onFCP, onINP, onLCP, onTTFB } = await import("web-vitals");

        const handleMetric = (metric: any) => {
            const webVitalsMetric: WebVitalsMetric = {
                ...metric,
                rating: getPerformanceRating(metric.name, metric.value),
            };

            // Log to console in development
            if (process.env.NODE_ENV === "development") {
                console.log(`[Web Vitals] ${metric.name}:`, webVitalsMetric);
            }

            // Send to analytics
            if (onMetric) {
                onMetric(webVitalsMetric);
            }

            // Send to PostHog if available and consent given
            captureWithConsent("web_vital", {
                metric_delta: metric.delta,
                metric_name: metric.name,
                metric_rating: webVitalsMetric.rating,
                metric_value: metric.value,
            });
        };

        // Initialize all Core Web Vitals
        onCLS(handleMetric);
        onFCP(handleMetric);
        onLCP(handleMetric);
        onTTFB(handleMetric);
        onINP(handleMetric);
    } catch (error) {
        console.warn("[Performance] Failed to initialize Web Vitals:", error);
    }
}

/**
 * Measure custom performance metrics
 */
export class PerformanceTracker {
    private static instance: PerformanceTracker;

    private metrics = new Map<string, number>();

    static getInstance(): PerformanceTracker {
        if (!PerformanceTracker.instance) {
            PerformanceTracker.instance = new PerformanceTracker();
        }

        return PerformanceTracker.instance;
    }

    /**
     * Start measuring a custom metric
     */
    start(name: string): void {
        if (typeof performance !== "undefined") {
            this.metrics.set(name, performance.now());
        }
    }

    /**
     * End measuring and return the duration
     */
    end(name: string): number | null {
        if (typeof performance === "undefined") return null;

        const startTime = this.metrics.get(name);

        if (startTime === undefined) {
            console.warn(`[Performance] No start time found for metric: ${name}`);

            return null;
        }

        const duration = performance.now() - startTime;

        this.metrics.delete(name);

        // Log in development
        if (process.env.NODE_ENV === "development") {
            console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
        }

        // Send to analytics with consent check
        captureWithConsent("custom_performance_metric", {
            duration_ms: duration,
            metric_name: name,
        });

        return duration;
    }

    /**
     * Measure a function execution time
     */
    async measure<T>(name: string, fn: () => T | Promise<T>): Promise<T> {
        this.start(name);

        try {
            const result = await fn();

            this.end(name);

            return result;
        } catch (error) {
            this.end(name);
            throw error;
        }
    }
}

/**
 * Performance observer for monitoring long tasks
 */
export function observeLongTasks(threshold: number = 50, onLongTask?: (duration: number) => void): PerformanceObserver | null {
    if (typeof window === "undefined" || !("PerformanceObserver" in window)) {
        return null;
    }

    try {
        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (entry.duration > threshold) {
                    console.warn(`[Performance] Long task detected: ${entry.duration.toFixed(2)}ms`);

                    if (onLongTask) {
                        onLongTask(entry.duration);
                    }

                    // Send to analytics with consent check
                    captureWithConsent("long_task", {
                        duration_ms: entry.duration,
                        entry_type: entry.entryType,
                    });
                }
            }
        });

        observer.observe({ entryTypes: ["longtask"] });

        return observer;
    } catch (error) {
        console.warn("[Performance] Failed to initialize long task observer:", error);

        return null;
    }
}

/**
 * Get current performance information
 */
export function getPerformanceInfo(): Record<string, any> {
    if (typeof window === "undefined" || !window.performance) {
        return {};
    }

    const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType("paint");

    return {
        // Connection info
        connectionType: (navigator as any)?.connection?.effectiveType,
        // Navigation timing
        domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.domContentLoadedEventStart,

        firstContentfulPaint: paint.find((entry) => entry.name === "first-contentful-paint")?.startTime,
        // Paint timing
        firstPaint: paint.find((entry) => entry.name === "first-paint")?.startTime,

        loadComplete: navigation?.loadEventEnd - navigation?.loadEventStart,

        // Memory info (Chrome only)
        memoryUsage: (performance as any)?.memory
            ? {
                  limit: (performance as any).memory.jsHeapSizeLimit,
                  total: (performance as any).memory.totalJSHeapSize,
                  used: (performance as any).memory.usedJSHeapSize,
              }
            : undefined,
    };
}

/**
 * Initialize performance monitoring
 */
export function initPerformanceMonitoring(): void {
    if (typeof window === "undefined") return;

    // Initialize Web Vitals
    initWebVitals();

    // Monitor long tasks
    observeLongTasks();

    // Log performance info in development
    if (process.env.NODE_ENV === "development") {
        setTimeout(() => {
            console.log("[Performance] Performance Info:", getPerformanceInfo());
        }, 1000);
    }
}

// Export singleton instance
export const performanceTracker = PerformanceTracker.getInstance();
