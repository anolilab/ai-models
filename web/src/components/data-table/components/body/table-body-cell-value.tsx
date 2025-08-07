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

const TableBodyCellValue = <TData extends RowData>({ cell, renderedColumnIndex = 0, renderedRowIndex = 0, table }: Props<TData>) => {
    const { column, row } = cell;
    const { columnDef } = column;

    let renderedCellValue
        = cell.getIsAggregated() && columnDef.AggregatedCell
            ? columnDef.AggregatedCell({
                cell,
                column,
                row,
                table,
                renderedColumnIndex,
                renderedRowIndex,
            })
            : row.getIsGrouped() && !cell.getIsGrouped()
                ? null
                : cell.getIsGrouped() && columnDef.GroupedCell
                    ? columnDef.GroupedCell({
                        cell,
                        column,
                        row,
                        table,
                        renderedColumnIndex,
                        renderedRowIndex,
                    })
                    : undefined;

    const isGroupedValue = renderedCellValue !== undefined;

    if (!isGroupedValue) {
        renderedCellValue = cell.renderValue();
    }

    if (columnDef.Cell && !isGroupedValue) {
        renderedCellValue = columnDef.Cell({
            cell,
            column,
            renderedCellValue,
            row,
            renderedColumnIndex,
            renderedRowIndex,
            table,
        });
    }

    return renderedCellValue;
};

export default TableBodyCellValue;