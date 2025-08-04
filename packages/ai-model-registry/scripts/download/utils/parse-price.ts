/**
 * Parses price strings from various formats into numeric values.
 * @param priceString The price string to parse
 * @returns Parsed price as number or null if parsing fails
 * @example
 * parsePrice("$0.50") // Returns 0.5
 * parsePrice("$1,000") // Returns 1000
 * parsePrice("Free") // Returns null
 * parsePrice("N/A") // Returns null
 */
export const parsePrice = (priceString: string): number | null => {
    if (!priceString || priceString === "N/A" || priceString === "Free") {
        return null;
    }

    const match = priceString.match(/\$?([\d,]+\.?\d*)/);

    if (match) {
        return Number.parseFloat(match[1].replaceAll(",", ""));
    }

    return null;
};
