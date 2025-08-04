/**
 * Parses token limit strings from various formats into numeric values.
 * @param limitString The token limit string to parse
 * @returns Parsed token limit as number or null if parsing fails
 * @example
 * parseTokenLimit("1000") // Returns 1000
 * parseTokenLimit("1,000") // Returns 1000
 * parseTokenLimit("8K") // Returns 8000
 * parseTokenLimit("DEFAULT: 8K MAXIMUM: 32K") // Returns 32000
 * parseTokenLimit("N/A") // Returns null
 */
export const parseTokenLimit = (limitString: string): number | null => {
    if (!limitString || limitString === "N/A") {
        return null;
    }

    // Handle "DEFAULT: XK MAXIMUM: YK" format
    const maxMatch = limitString.match(/MAXIMUM:\s*(\d+(?:\.\d+)?)\s*K/i);

    if (maxMatch) {
        return Math.round(Number.parseFloat(maxMatch[1]) * 1000);
    }

    // Handle "DEFAULT: XK" format
    const defaultMatch = limitString.match(/DEFAULT:\s*(\d+(?:\.\d+)?)\s*K/i);

    if (defaultMatch) {
        return Math.round(Number.parseFloat(defaultMatch[1]) * 1000);
    }

    // Handle "XK" format
    const kMatch = limitString.match(/(\d+(?:\.\d+)?)\s*K/i);

    if (kMatch) {
        return Math.round(Number.parseFloat(kMatch[1]) * 1000);
    }

    // Handle basic number format
    const match = limitString.match(/([\d,]+)/);

    if (match) {
        return Number.parseInt(match[1].replaceAll(",", ""), 10);
    }

    return null;
};
