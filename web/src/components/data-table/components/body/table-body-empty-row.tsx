import type { RowData, TableInstance } from "../../types";

interface Props<TData extends RowData> {
    className?: string;
    style?: React.CSSProperties;
    table: TableInstance<TData>;
}

export default function TableBodyEmptyRow<TData extends RowData>({ className, style, table }: Props<TData>): React.JSX.Element {
    const {
        getState,
        options: { layoutMode, localization, renderDetailPanel, renderEmptyRowsFallback },
        refs: { tablePaperRef },
    } = table;
    const { columnFilters, globalFilter } = getState();

    return (
        <tr
            className={className}
            style={{
                display: layoutMode?.startsWith("grid") ? "grid" : undefined,
                ...style,
            }}
        >
            {renderDetailPanel && (
                <td
                    colSpan={1}
                    style={{
                        display: layoutMode?.startsWith("grid") ? "grid" : undefined,
                    }}
                >
                    {/* ExpandButton would go here if needed */}
                </td>
            )}
            <td
                colSpan={table.getVisibleLeafColumns().length}
                style={{
                    display: layoutMode?.startsWith("grid") ? "grid" : undefined,
                }}
            >
                {renderEmptyRowsFallback?.({ table }) ?? (
                    <div
                        className="text-muted-foreground w-full py-8 text-center italic"
                        style={{
                            maxWidth: `min(100vw, ${tablePaperRef.current?.clientWidth ?? 360}px)`,
                        }}
                    >
                        {globalFilter || columnFilters.length ? localization.noResultsFound : localization.noRecordsToDisplay}
                    </div>
                )}
            </td>
        </tr>
    );
}
