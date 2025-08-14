import type { MouseEvent } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import type { Row, RowData, TableInstance } from "../../types";
import { getIsRowSelected, getRowSelectionHandler, getSelectAllHandler } from "../../utils/row-utils";
import { parseFromValuesOrFunc } from "../../utils/utils";

interface Props<TData extends RowData> {
    className?: string;
    renderedRowIndex?: number;
    row?: Row<TData>;
    style?: React.CSSProperties;
    table: TableInstance<TData>;
}

export const SelectCheckbox = <TData extends RowData>({ className, renderedRowIndex = 0, row, style, table, ...rest }: Props<TData>) => {
    const {
        getState,
        options: { enableMultiRowSelection, localization, mantineSelectAllCheckboxProps, mantineSelectCheckboxProps, selectAllMode, selectDisplayMode },
    } = table;
    const { density, isLoading } = getState();

    const selectAll = !row;

    const allRowsSelected = selectAll ? selectAllMode === "page" ? table.getIsAllPageRowsSelected() : table.getIsAllRowsSelected() : undefined;

    const isChecked = selectAll ? allRowsSelected : getIsRowSelected({ row, table });

    const checkboxProps = {
        ...selectAll
            ? parseFromValuesOrFunc(mantineSelectAllCheckboxProps, { table })
            : parseFromValuesOrFunc(mantineSelectCheckboxProps, {
                row,
                table,
            }),
        className,
        style,
        ...rest,
    };

    const onSelectionChange = row
        ? getRowSelectionHandler({
            renderedRowIndex,
            row,
            table,
        })
        : undefined;

    const onSelectAllChange = getSelectAllHandler({ table });

    const commonProps = {
        "aria-label": selectAll ? localization.toggleSelectAll : localization.toggleSelectRow,
        checked: isChecked,
        disabled: isLoading || (row && !row.getCanSelect()) || row?.id === "ano-row-create",
        onClick: (e: MouseEvent<HTMLInputElement>) => {
            e.stopPropagation();
            checkboxProps?.onClick?.(e);
        },
        title: undefined,
    };

    const handleChange = (checked: boolean) => {
        if (selectAll) {
            onSelectAllChange({ target: { checked } } as any);
        } else {
            onSelectionChange!({ target: { checked } } as any);
        }
    };

    const tooltipLabel = checkboxProps?.title ?? (selectAll ? localization.toggleSelectAll : localization.toggleSelectRow);

    const SelectComponent = () => {
        if (selectDisplayMode === "switch") {
            return <Switch {...commonProps} checked={isChecked} onCheckedChange={handleChange} />;
        }

        if (selectDisplayMode === "radio" || enableMultiRowSelection === false) {
            return (
                <RadioGroup onValueChange={(value) => handleChange(value === "selected")} value={isChecked ? "selected" : "unselected"}>
                    <RadioGroupItem {...commonProps} className="sr-only" value="selected" />
                </RadioGroup>
            );
        }

        return (
            <Checkbox
                {...commonProps}
                checked={isChecked}
                onCheckedChange={handleChange}
                ref={(ref) => {
                    if (ref && selectAll) {
                        ref.indeterminate = !isChecked && selectAll ? table.getIsSomeRowsSelected() : row?.getIsSomeSelected() && row.getCanSelectSubRows();
                    }
                }}
            />
        );
    };

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <span>
                    <SelectComponent />
                </span>
            </TooltipTrigger>
            <TooltipContent>
                <p>{tooltipLabel}</p>
            </TooltipContent>
        </Tooltip>
    );
};
