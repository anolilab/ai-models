// Trailing zeros, and the point if nothing follows it.
const TRAILING_ZEROS_PATTERN = /\.?0+$/;

// Each word, for title casing.
const WORD_PATTERN = /\w\S*/g;

// Everything that is not a digit.
const NON_DIGIT_PATTERN = /\D/g;/**
                                 * Utility functions for formatting data during export operations
                                 */

/**
 * Format ISO timestamp to readable date format (DD/MM/YYYY hh:mm A).
 */
export const formatTimestampToReadable = (timestamp: string | null | undefined): string => {
    if (!timestamp)
        return "";

    try {
        const date = new Date(timestamp);

        if (isNaN(date.getTime()))
            return timestamp;

        return date.toLocaleDateString("en-GB", {
            day: "2-digit",
            hour: "2-digit",
            hour12: true,
            minute: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    } catch {
        return timestamp;
    }
};

/**
 * Format ISO date to readable date format (DD/MM/YYYY).
 */
export const formatDateToReadable = (date: string | null | undefined): string => {
    if (!date)
        return "";

    try {
        const dateObj = new Date(date);

        if (isNaN(dateObj.getTime()))
            return date;

        return dateObj.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    } catch {
        return date;
    }
};

/**
 * Format AI model costs with appropriate units and precision.
 * @param cost Cost per 1K tokens as a decimal number (schema stores costs as per 1K tokens)
 * @returns Formatted cost string with appropriate units
 */
export const formatModelCost = (cost: number | null | undefined): string => {
    if (cost === null || cost === undefined) {
        return "-";
    }

    if (cost === 0) {
        return "Free";
    }

    // Ensure we have a proper decimal number (handle scientific notation)
    const decimalCost = typeof cost === "number" ? cost : parseFloat(String(cost));

    // Cost is already in "per 1K tokens" format, so we display it directly
    // For very small costs (< $0.000001 per 1K = $1 per 1B), show per billion tokens
    if (decimalCost < 0.000001) {
        return `$${(decimalCost * 1000000).toFixed(3)}/1B tokens`;
    }

    // For small costs (< $0.001 per 1K = $1 per 1M), show per million tokens
    // Example: 0.0004 per 1K = $0.40 per 1M tokens
    if (decimalCost < 0.001) {
        return `$${(decimalCost * 1000).toFixed(2)}/1M tokens`;
    }

    // For costs less than $1 per 1K tokens, show per 1K tokens
    if (decimalCost < 1) {
        return `$${decimalCost.toFixed(2)}/1K tokens`;
    }

    // For costs $1 and above per 1K tokens, show per 1K tokens
    // Remove trailing zeros for whole numbers
    const formatted = decimalCost % 1 === 0 ? decimalCost.toFixed(0) : decimalCost.toFixed(4).replace(TRAILING_ZEROS_PATTERN, "");

    return `$${formatted}/1K tokens`;
};

/**
 * Format currency values with proper symbol and formatting.
 */
export const formatCurrency = (amount: number | string | null | undefined, currency = "USD"): string => {
    if (amount === null || amount === undefined || amount === "")
        return "";

    const numericAmount = typeof amount === "string" ? parseFloat(amount) : amount;

    if (isNaN(numericAmount))
        return String(amount);

    return new Intl.NumberFormat("en-US", {
        currency,
        minimumFractionDigits: 2,
        style: "currency",
    }).format(numericAmount);
};

/**
 * Format numbers with thousand separators.
 */
export const formatNumber = (value: number | string | null | undefined): string => {
    if (value === null || value === undefined || value === "")
        return "";

    const numericValue = typeof value === "string" ? parseFloat(value) : value;

    if (isNaN(numericValue))
        return String(value);

    return new Intl.NumberFormat("en-US").format(numericValue);
};

/**
 * Capitalize first letter of each word.
 */
export const formatToTitleCase = (text: string | null | undefined): string => {
    if (!text)
        return "";

    return text.replace(WORD_PATTERN, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
};

/**
 * Format boolean values to human-readable text.
 */
export const formatBoolean = (value: boolean | string | null | undefined, options = { false: "No", true: "Yes" }): string => {
    if (value === null || value === undefined)
        return "";

    const boolValue = typeof value === "string" ? value.toLowerCase() === "true" : Boolean(value);

    return boolValue ? options.true : options.false;
};

/**
 * Format phone numbers to a standard format.
 */
export const formatPhoneNumber = (phone: string | null | undefined): string => {
    if (!phone)
        return "";

    // Remove all non-digits
    const cleaned = phone.replace(NON_DIGIT_PATTERN, "");

    // Format as (XXX) XXX-XXXX for US numbers
    if (cleaned.length === 10) {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }

    // Return original if not standard length
    return phone;
};

/**
 * Truncate long text with ellipsis.
 */
export const formatTruncatedText = (text: string | null | undefined, maxLength = 50): string => {
    if (!text)
        return "";

    if (text.length <= maxLength)
        return text;

    return `${text.slice(0, maxLength)}...`;
};
