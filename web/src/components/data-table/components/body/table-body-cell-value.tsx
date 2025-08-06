import React from "react";

import type { Cell, CellValue, RowData, TableInstance } from "../../types";
import { parseFromValuesOrFunc } from "../../utils/utils";

const allowedTypes = ["string", "number"];
const allowedFilterVariants = ["text", "autocomplete"];

interface Props<TData extends RowData, TValue = CellValue> {
    cell: Cell<TData, TValue>;
    renderedColumnIndex?: number;
    renderedRowIndex?: number;
    table: TableInstance<TData>;
}

// Custom highlight component to replace Mantine's Highlight
const Highlight = ({ children, highlight, ...props }: { [key: string]: any; children: string; highlight: string | string[] }) => {
    if (!highlight || !children)
        return <span {...props}>{children}</span>;

    const highlights = Array.isArray(highlight) ? highlight : [highlight];
    let result = children;

    highlights.forEach((h) => {
        if (h) {
            const regex = new RegExp(`(${h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");

            result = result.replace(regex, "<mark>$1</mark>");
        }
    });

    return <span {...props} className="[&_mark]:rounded [&_mark]:bg-yellow-200 [&_mark]:px-0.5" dangerouslySetInnerHTML={{ __html: result }} />;
};

export const TableBodyCellValue = <TData extends RowData>({ cell, renderedColumnIndex = 0, renderedRowIndex = 0, table }: Props<TData>) => {
    const {
        getState,
        options: { enableFilterMatchHighlighting, mantineHighlightProps = { size: "sm" } },
    } = table;
    const { column, row } = cell;
    const { columnDef } = column;
    const { globalFilter, globalFilterFn } = getState();
    const filterValue = column.getFilterValue();

    const highlightProps = parseFromValuesOrFunc(mantineHighlightProps, {
        cell,
        column,
        row,
        table,
    });

    // Helper function to ensure value is renderable
    const ensureRenderableValue = (value: any): React.ReactNode => {
        if (value === null || value === undefined) {
            return "";
        }

        if (value instanceof Date) {
            return value.toLocaleString();
        }

        if (typeof value === "object" && !React.isValidElement(value)) {
            return JSON.stringify(value);
        }

        return value;
    };

    let renderedCellValue
        = cell.getIsAggregated() && columnDef.AggregatedCell
            ? ensureRenderableValue(
                columnDef.AggregatedCell({
                    cell,
                    column,
                    row,
                    table,
                }),
            )
            : row.getIsGrouped() && !cell.getIsGrouped()
                ? null
                : cell.getIsGrouped() && columnDef.GroupedCell
                    ? ensureRenderableValue(
                        columnDef.GroupedCell({
                            cell,
                            column,
                            row,
                            table,
                        }),
                    )
                    : undefined;

    const isGroupedValue = renderedCellValue !== undefined;

    if (!isGroupedValue) {
        const rawValue = cell.renderValue();

        renderedCellValue = ensureRenderableValue(rawValue);
    }

    if (
        enableFilterMatchHighlighting
        && columnDef.enableFilterMatchHighlighting !== false
        && renderedCellValue
        && allowedTypes.includes(typeof renderedCellValue)
        && ((filterValue && allowedTypes.includes(typeof filterValue) && allowedFilterVariants.includes(columnDef.filterVariant as string))
            || (globalFilter && allowedTypes.includes(typeof globalFilter) && column.getCanGlobalFilter()))
    ) {
        let highlight: string | string[] = (column.getFilterValue() ?? globalFilter ?? "").toString() as string;

        if ((filterValue ? columnDef._filterFn : globalFilterFn) === "fuzzy") {
            highlight = highlight.split(" ");
        }

        renderedCellValue = (
            <Highlight highlight={highlight} {...highlightProps}>
                {renderedCellValue?.toString()}
            </Highlight>
        );
    }

    if (columnDef.Cell && !isGroupedValue) {
        renderedCellValue = ensureRenderableValue(
            columnDef.Cell({
                cell,
                column,
                renderedCellValue,
                renderedColumnIndex,
                renderedRowIndex,
                row,
                table,
            }),
        );
    }

    return renderedCellValue;
};
