/**
 * Parses context length strings from various formats into numeric values.
 * Supports K (thousands) and M (millions) units.
 * @param lengthString The context length string to parse
 * @returns Parsed context length as number or null if parsing fails
 * @example
 * parseContextLength("1000") // Returns 1000
 * parseContextLength("8K") // Returns 8192
 * parseContextLength("1M") // Returns 1048576
 * parseContextLength("N/A") // Returns null
 */
export const parseContextLength = (lengthString: string): number | null => {
    if (!lengthString) {
        return null;
    }

    const match = lengthString.toLowerCase().match(/(\d+)([km])?/);

    if (!match) {
        return null;
    }

    const value = Number.parseInt(match[1], 10);
    const unit = match[2];

    if (unit === "k") {
        return value * 1024;
    }

    if (unit === "m") {
        return value * 1024 * 1024;
    }

    return value;
};
