import type { DropdownOption } from "../types";

export const parseCSSVarId = (id: string): string => id.replace(/[^a-z0-9]/gi, "_");

export const parseFromValuesOrFunc = <T, U>(fn: ((arg: U) => T) | T | undefined, arg: U): T | undefined => (fn instanceof Function ? fn(arg) : fn);

export const getValueAndLabel = (option?: DropdownOption | null): { label: string; value: string } => {
    let label: string = "";
    let value: string = "";

    if (option) {
        if (typeof option !== "object") {
            label = option;
            value = option;
        } else {
            label = option.label ?? option.value;
            value = option.value ?? label;
        }
    }

    return { label, value };
};

/**
 * Creates a data attribute object that can be spread onto React elements.
 * @param name The data attribute name (without data- prefix)
 * @param value The value for the data attribute (only adds if truthy)
 * @returns Object with data attribute or empty object
 */
export const dataVariable = (name: string, value: unknown): Record<string, string | undefined> => {
    if (!value) {
        return {};
    }

    return {
        [`data-${name}`]: String(value),
    };
};
