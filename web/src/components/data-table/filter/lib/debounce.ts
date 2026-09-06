type ControlFunctions = {
    cancel: () => void;
    flush: () => void;
    isPending: () => boolean;
};

type DebounceOptions = {
    leading?: boolean;
    maxWait?: number;
    trailing?: boolean;
};

export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number,
    options: DebounceOptions = {},
): ((...args: Parameters<T>) => ReturnType<T> | undefined) & ControlFunctions {
    const { leading = false, maxWait, trailing = true } = options;
    let timeout: NodeJS.Timeout | null = null;
    let lastArgs: Parameters<T> | null = null;
    let lastThis: any;
    let result: ReturnType<T> | undefined;
    let lastCallTime: number | null = null;
    let lastInvokeTime = 0;

    const maxWaitTime = maxWait !== undefined ? Math.max(wait, maxWait) : null;

    const invokeFunc = (time: number): ReturnType<T> | undefined => {
        if (lastArgs === null)
            return undefined;

        const args = lastArgs;
        const thisArg = lastThis;

        lastArgs = null;
        lastThis = null;
        lastInvokeTime = time;
        result = func.apply(thisArg, args);

        return result;
    };

    const shouldInvoke = (time: number): boolean => {
        if (lastCallTime === null)
            return false;

        const timeSinceLastCall = time - lastCallTime;
        const timeSinceLastInvoke = time - lastInvokeTime;

        return lastCallTime === null || timeSinceLastCall >= wait || timeSinceLastCall < 0 || (maxWaitTime !== null && timeSinceLastInvoke >= maxWaitTime);
    };

    const startTimer = (pendingFunc: () => void, waitTime: number): NodeJS.Timeout => setTimeout(pendingFunc, waitTime);

    const remainingWait = (time: number): number => {
        if (lastCallTime === null)
            return wait;

        const timeSinceLastCall = time - lastCallTime;
        const timeSinceLastInvoke = time - lastInvokeTime;
        const timeWaiting = wait - timeSinceLastCall;

        return maxWaitTime !== null ? Math.min(timeWaiting, maxWaitTime - timeSinceLastInvoke) : timeWaiting;
    };

    const timerExpired = () => {
        const time = Date.now();

        if (shouldInvoke(time)) {
            return trailingEdge(time);
        }

        timeout = startTimer(timerExpired, remainingWait(time));
    };

    const leadingEdge = (time: number): ReturnType<T> | undefined => {
        lastInvokeTime = time;
        timeout = startTimer(timerExpired, wait);

        return leading ? invokeFunc(time) : undefined;
    };

    const trailingEdge = (time: number): ReturnType<T> | undefined => {
        timeout = null;

        if (trailing && lastArgs) {
            return invokeFunc(time);
        }

        lastArgs = null;
        lastThis = null;

        return result;
    };

    const debounced = (this: any, ...args: Parameters<T>): ReturnType<T> | undefined => {
        const time = Date.now();
        const isInvoking = shouldInvoke(time);

        lastArgs = args;
        lastThis = this;
        lastCallTime = time;

        if (isInvoking) {
            if (timeout === null) {
                return leadingEdge(lastCallTime);
            }

            if (maxWaitTime !== null) {
                timeout = startTimer(timerExpired, wait);

                return invokeFunc(lastCallTime);
            }
        }

        if (timeout === null) {
            timeout = startTimer(timerExpired, wait);
        }

        return result;
    };

    debounced.cancel = () => {
        if (timeout !== null) {
            clearTimeout(timeout);
        }

        lastInvokeTime = 0;
        lastArgs = null;
        lastThis = null;
        lastCallTime = null;
        timeout = null;
    };

    debounced.flush = () => (timeout === null ? result : trailingEdge(Date.now()));

    debounced.isPending = () => timeout !== null;

    return debounced;
}
