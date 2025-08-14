import type { FocusEvent, KeyboardEvent } from "react";
import { useState } from "react";

import { Input } from "@/components/ui/input";

import type { Cell, CellValue, RowData, TableInstance } from "../../types";
import { parseFromValuesOrFunc } from "../../utils/utils";

interface PropsTextInput<TData extends RowData, TValue = CellValue> {
    cell: Cell<TData, TValue>;
    className?: string;
    disabled?: boolean;
    onBlur?: (event: FocusEvent<HTMLInputElement>) => void;
    onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onClick?: (event: React.MouseEvent<HTMLInputElement>) => void;
    onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
    placeholder?: string;
    table: TableInstance<TData>;
    value?: string;
}

export const EditCellTextInput = <TData extends RowData>({
    cell,
    className,
    disabled,
    onBlur: externalOnBlur,
    onChange: externalOnChange,
    onClick: externalOnClick,
    onKeyDown: externalOnKeyDown,
    placeholder,
    table,
    value: externalValue,
    ...rest
}: PropsTextInput<TData>) => {
    const {
        getState,
        options: { createDisplayMode, editDisplayMode, mantineEditTextInputProps },
        refs: { editInputRefs },
        setCreatingRow,
        setEditingCell,
        setEditingRow,
    } = table;
    const { column, row } = cell;
    const { columnDef } = column;
    const { creatingRow, editingRow } = getState();

    const isCreating = creatingRow?.id === row.id;
    const isEditing = editingRow?.id === row.id;

    const [internalValue, setInternalValue] = useState(() => cell.getValue<any>());
    const value = externalValue ?? internalValue;

    const arg = { cell, column, row, table };
    const textInputProps = {
        ...parseFromValuesOrFunc(mantineEditTextInputProps, arg),
        ...parseFromValuesOrFunc(columnDef.mantineEditTextInputProps, arg),
        ...rest,
    };

    const saveInputValueToRowCache = (newValue: null | string) => {
        // @ts-ignore
        row._valuesCache[column.id] = newValue;

        if (isCreating) {
            setCreatingRow(row);
        } else if (isEditing) {
            setEditingRow(row);
        }
    };

    const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
        externalOnBlur?.(event);
        textInputProps.onBlur?.(event);
        saveInputValueToRowCache(value);
        setEditingCell(null);
    };

    const handleEnterKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        externalOnKeyDown?.(event);
        textInputProps.onKeyDown?.(event);

        if (event.key === "Enter") {
            editInputRefs.current[cell.id]?.blur();
        }
    };

    if (columnDef.Edit) {
        return columnDef.Edit?.({ cell, column, row, table });
    }

    const isDisabled = disabled ?? parseFromValuesOrFunc(columnDef.enableEditing, row) === false;
    const inputPlaceholder
        = placeholder ?? (!["custom", "modal"].includes((isCreating ? createDisplayMode : editDisplayMode) as string) ? columnDef.header : undefined);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = event.target.value;

        setInternalValue(newValue);
        externalOnChange?.(event);
        textInputProps.onChange?.(event);
    };

    const handleClick = (event: React.MouseEvent<HTMLInputElement>) => {
        event.stopPropagation();
        externalOnClick?.(event);
        textInputProps?.onClick?.(event);
    };

    return (
        <Input
            className={className}
            disabled={isDisabled}
            name={cell.id}
            onBlur={handleBlur}
            onChange={handleChange}
            onClick={handleClick}
            onKeyDown={handleEnterKeyDown}
            placeholder={inputPlaceholder}
            ref={(node) => {
                if (node) {
                    editInputRefs.current[cell.id] = node;

                    if (textInputProps.ref) {
                        textInputProps.ref.current = node;
                    }
                }
            }}
            value={value ?? ""}
            {...textInputProps}
        />
    );
};
