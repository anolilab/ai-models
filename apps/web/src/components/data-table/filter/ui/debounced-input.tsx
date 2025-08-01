import { useCallback, useEffect, useState } from "react";

import { Input } from "@/components/ui/input";

import { debounce } from "../lib/debounce";

export function DebouncedInput({
    debounceMs = 500, // This is the wait time, not the function
    onChange,
    value: initialValue,
    ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> & {
    debounceMs?: number;
    onChange: (value: string | number) => void;
    value: string | number;
}) {
    const [value, setValue] = useState(initialValue);

    // Sync with initialValue when it changes
    useEffect(() => {
        setValue(initialValue);
    }, [initialValue]);

    // Define the debounced function with useCallback
    const debouncedOnChange = useCallback(
        debounce((newValue: string | number) => {
            onChange(newValue);
        }, debounceMs), // Pass the wait time here
        [debounceMs, onChange], // Dependencies
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;

        setValue(newValue); // Update local state immediately
        debouncedOnChange(newValue); // Call debounced version
    };

    return <Input {...props} onChange={handleChange} value={value} />;
}
