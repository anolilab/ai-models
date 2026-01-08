/**
 * Safely converts a value to a number.
 * Handles strings, numbers, null, and undefined.
 * @param value The value to convert
 * @returns The number value, or null if conversion fails or value is null/undefined
 * @example
 * toNumber("123") // Returns 123
 * toNumber(123) // Returns 123
 * toNumber("123.45") // Returns 123.45
 * toNumber(null) // Returns null
 * toNumber(undefined) // Returns null
 * toNumber("invalid") // Returns null
 */
export const toNumber = (value: string | number | null | undefined): number | null => {
    if (value === null || value === undefined) {
        return null;
    }

    if (typeof value === "number") {
        return Number.isNaN(value) ? null : value;
    }

    if (typeof value === "string") {
        const trimmed = value.trim();

        if (trimmed === "" || trimmed === "N/A" || trimmed === "null" || trimmed === "undefined") {
            return null;
        }

        const parsed = Number.parseFloat(trimmed);

        return Number.isNaN(parsed) ? null : parsed;
    }

    return null;
};
