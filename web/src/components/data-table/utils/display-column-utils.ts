import type { DefinedTableOptions, DisplayColumnIds, Localization, RowData, StatefulTableOptions } from "../types";
import { getAllLeafColumnDefs, getColumnId } from "./column-utils";

export default function defaultDisplayColumnProps<TData extends RowData>({
    header,
    id,
    size,
    tableOptions,
}: {
    header?: keyof Localization;
    id: DisplayColumnIds;
    size: number;
    tableOptions: DefinedTableOptions<TData>;
}): Record<string, unknown> {
    const { defaultDisplayColumn, displayColumnDefOptions, localization } = tableOptions;

    return {
        ...defaultDisplayColumn,
        header: header ? localization[header] ?? "" : "",
        size,
        ...displayColumnDefOptions?.[id],
        id,
    } as const;
}

export const showRowPinningColumn = <TData extends RowData>(tableOptions: StatefulTableOptions<TData>): boolean => {
    const { enableRowPinning, rowPinningDisplayMode } = tableOptions;

    return !!(enableRowPinning && !rowPinningDisplayMode?.startsWith("select"));
};

export const showRowDragColumn = <TData extends RowData>(tableOptions: StatefulTableOptions<TData>): boolean => {
    const { enableRowDragging, enableRowOrdering } = tableOptions;

    return !!(enableRowDragging || enableRowOrdering);
};

export const showRowExpandColumn = <TData extends RowData>(tableOptions: StatefulTableOptions<TData>): boolean => {
    const {
        enableExpanding,
        enableGrouping,
        renderDetailPanel,
        state: { grouping },
    } = tableOptions;

    return !!(enableExpanding || (enableGrouping && grouping?.length) || renderDetailPanel);
};

export const showRowActionsColumn = <TData extends RowData>(tableOptions: StatefulTableOptions<TData>): boolean => {
    const {
        createDisplayMode,
        editDisplayMode,
        enableEditing,
        enableRowActions,
        state: { creatingRow },
    } = tableOptions;

    return !!(enableRowActions || (creatingRow && createDisplayMode === "row") || (enableEditing && ["modal", "row"].includes(editDisplayMode ?? "")));
};

export const showRowSelectionColumn = <TData extends RowData>(tableOptions: StatefulTableOptions<TData>): boolean => !!tableOptions.enableRowSelection;

export const showRowNumbersColumn = <TData extends RowData>(tableOptions: StatefulTableOptions<TData>): boolean => !!tableOptions.enableRowNumbers;

export const showRowSpacerColumn = <TData extends RowData>(tableOptions: StatefulTableOptions<TData>): boolean => tableOptions.layoutMode === "grid-no-grow";

export const getLeadingDisplayColumnIds = <TData extends RowData>(tableOptions: StatefulTableOptions<TData>): DisplayColumnIds[] =>
    [
        showRowPinningColumn(tableOptions) && "ano-row-pin",
        showRowDragColumn(tableOptions) && "ano-row-drag",
        tableOptions.positionActionsColumn === "first" && showRowActionsColumn(tableOptions) && "ano-row-actions",
        tableOptions.positionExpandColumn === "first" && showRowExpandColumn(tableOptions) && "ano-row-expand",
        showRowSelectionColumn(tableOptions) && "ano-row-select",
        showRowNumbersColumn(tableOptions) && "ano-row-numbers",
    ].filter(Boolean) as DisplayColumnIds[];

export const getTrailingDisplayColumnIds = <TData extends RowData>(tableOptions: StatefulTableOptions<TData>): DisplayColumnIds[] =>
    [
        tableOptions.positionActionsColumn === "last" && showRowActionsColumn(tableOptions) && "ano-row-actions",
        tableOptions.positionExpandColumn === "last" && showRowExpandColumn(tableOptions) && "ano-row-expand",
        showRowSpacerColumn(tableOptions) && "ano-row-spacer",
    ].filter(Boolean) as DisplayColumnIds[];

export const getDefaultColumnOrderIds = <TData extends RowData>(tableOptions: StatefulTableOptions<TData>, reset = false): string[] => {
    const {
        state: { columnOrder: currentColumnOrderIds = [] },
    } = tableOptions;

    const leadingDisplayColIds: string[] = getLeadingDisplayColumnIds(tableOptions);
    const trailingDisplayColIds: string[] = getTrailingDisplayColumnIds(tableOptions);

    const defaultColumnDefIds = getAllLeafColumnDefs(tableOptions.columns).map((columnDef) => getColumnId(columnDef));

    let allLeafColumnDefIds = reset ? defaultColumnDefIds : Array.from(new Set([...currentColumnOrderIds, ...defaultColumnDefIds]));

    allLeafColumnDefIds = allLeafColumnDefIds.filter((colId) => !leadingDisplayColIds.includes(colId) && !trailingDisplayColIds.includes(colId));

    return [...leadingDisplayColIds, ...allLeafColumnDefIds, ...trailingDisplayColIds];
};
