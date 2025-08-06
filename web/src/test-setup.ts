import "@testing-library/jest-dom";

// Configure React for testing environment
import { configure } from "@testing-library/react";
import { vi } from "vitest";

configure({
    testIdAttribute: "data-testid",
});

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
    value: vi.fn().mockImplementation((query) => {
        return {
            addEventListener: vi.fn(),
            addListener: vi.fn(), // deprecated
            dispatchEvent: vi.fn(),
            matches: false,
            media: query,
            onchange: null,
            removeEventListener: vi.fn(),
            removeListener: vi.fn(), // deprecated
        };
    }),
    writable: true,
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => {
    return {
        disconnect: vi.fn(),
        observe: vi.fn(),
        unobserve: vi.fn(),
    };
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => {
    return {
        disconnect: vi.fn(),
        observe: vi.fn(),
        unobserve: vi.fn(),
    };
});

// Mock scrollTo
global.scrollTo = vi.fn();

// Mock clipboard API
Object.assign(navigator, {
    clipboard: {
        readText: vi.fn(() => Promise.resolve("")),
        writeText: vi.fn(() => Promise.resolve()),
    },
});

// Mock performance.memory for memory management tests
Object.defineProperty(window.performance, "memory", {
    value: {
        jsHeapSizeLimit: 4000000,
        totalJSHeapSize: 2000000,
        usedJSHeapSize: 1000000,
    },
    writable: true,
});
