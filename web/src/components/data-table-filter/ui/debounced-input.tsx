import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";

const DebouncedInput = ({
    debounceMs = 500, // This is the wait time, not the function
    onChange,
    value: initialValue,
    ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> & {
    debounceMs?: number;
    onChange: (value: string | number) => void;
    value: string | number;
}) => {
    const [value, setValue] = useState(initialValue);

    useEffect(() => {
        setValue(initialValue);
    }, [initialValue]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            onChange(value);
        }, debounceMs);

        return () => clearTimeout(timeout);
    }, [value, debounceMs, onChange]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setValue(e.target.value);
    };

    return <Input {...props} onChange={handleChange} value={value} />;
};

export default DebouncedInput;
