import clsx from "clsx";
import { Save, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import type { Row, RowData, TableInstance } from "../../types";

interface Props<TData extends RowData> {
    className?: string;
    row: Row<TData>;
    style?: React.CSSProperties;
    table: TableInstance<TData>;
    variant?: "icon" | "text";
}

export const EditActionButtons = <TData extends RowData>({ className, row, style, table, variant = "icon", ...rest }: Props<TData>) => {
    const {
        getState,
        options: { localization, onCreatingRowCancel, onCreatingRowSave, onEditingRowCancel, onEditingRowSave },
        refs: { editInputRefs },
        setCreatingRow,
        setEditingRow,
    } = table;
    const { creatingRow, editingRow, isSaving } = getState();

    const isCreating = creatingRow?.id === row.id;
    const isEditing = editingRow?.id === row.id;

    const handleCancel = () => {
        if (isCreating) {
            onCreatingRowCancel?.({ row, table });
            setCreatingRow(null);
        } else if (isEditing) {
            onEditingRowCancel?.({ row, table });
            setEditingRow(null);
        }

        row._valuesCache = {} as any; // reset values cache
    };

    const handleSubmitRow = () => {
        // look for auto-filled input values
        Object.values(editInputRefs?.current)
            .filter((inputRef) => row.id === inputRef?.name?.split("_")?.[0])
            ?.forEach((input) => {
                if (input.value !== undefined && Object.hasOwn(row?._valuesCache as object, input.name)) {
                    // @ts-ignore
                    row._valuesCache[input.name] = input.value;
                }
            });

        if (isCreating) {
            onCreatingRowSave?.({
                exitCreatingMode: () => setCreatingRow(null),
                row,
                table,
                values: row._valuesCache,
            });
        } else if (isEditing) {
            onEditingRowSave?.({
                exitEditingMode: () => setEditingRow(null),
                row,
                table,
                values: row?._valuesCache,
            });
        }
    };

    return (
        <div className={clsx("ano-edit-action-buttons flex gap-1", className)} onClick={(e) => e.stopPropagation()} style={style} {...rest}>
            {variant === "icon"
                ? (
                <>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button aria-label={localization.cancel} className="h-8 w-8 p-0" onClick={handleCancel} variant="ghost">
                                <X className="h-4 w-4 text-red-500" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{localization.cancel}</p>
                        </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button aria-label={localization.save} className="h-8 w-8 p-0" disabled={isSaving} onClick={handleSubmitRow} variant="ghost">
                                <Save className="h-4 w-4 text-blue-500" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{localization.save}</p>
                        </TooltipContent>
                    </Tooltip>
                </>
                )
                : (
                <>
                    <Button onClick={handleCancel} variant="ghost">
                        {localization.cancel}
                    </Button>
                    <Button disabled={isSaving} onClick={handleSubmitRow} variant="default">
                        {localization.save}
                    </Button>
                </>
                )}
        </div>
    );
};
