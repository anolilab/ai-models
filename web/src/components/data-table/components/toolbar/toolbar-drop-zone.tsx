import clsx from "clsx";
import type { DragEvent } from "react";
import { useEffect } from "react";

import type { RowData, TableInstance } from "../../types";

interface Props<TData extends RowData> {
    className?: string;
    style?: React.CSSProperties;
    table: TableInstance<TData>;
}

export const ToolbarDropZone = <TData extends RowData>({ className, style, table, ...rest }: Props<TData>) => {
    const {
        getState,
        options: { enableGrouping, localization },
        setHoveredColumn,
        setShowToolbarDropZone,
    } = table;

    const { draggingColumn, grouping, hoveredColumn, showToolbarDropZone } = getState();

    const handleDragEnter = (_event: DragEvent<HTMLDivElement>) => {
        setHoveredColumn({ id: "drop-zone" });
    };

    useEffect(() => {
        if (table.options.state?.showToolbarDropZone !== undefined) {
            setShowToolbarDropZone(
                !!enableGrouping && !!draggingColumn && draggingColumn.columnDef.enableGrouping !== false && !grouping.includes(draggingColumn.id),
            );
        }
    }, [enableGrouping, draggingColumn, grouping]);

    if (!showToolbarDropZone) {
        return null;
    }

    return (
        <div
            className={clsx(
                "ano-toolbar-dropzone absolute z-10 flex h-full w-full items-center justify-center border-2 border-dashed border-blue-500 bg-blue-50 p-4 transition-colors",
                hoveredColumn?.id === "drop-zone" && "bg-blue-100",
                className,
            )}
            onDragEnter={handleDragEnter}
            style={style}
            {...rest}
        >
            <span className="text-sm text-gray-600">{localization.dropToGroupBy.replace("{column}", draggingColumn?.columnDef?.header ?? "")}</span>
        </div>
    );
};
