import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import type { Row, RowData, TableInstance } from "../../types";
import { parseFromValuesOrFunc } from "../../utils/utils";
import { EditActionButtons } from "../buttons/edit-action-buttons";
import { EditCellTextInput } from "../inputs/edit-cell-text-input";

interface Props<TData extends RowData> {
    onOpenChange?: (open: boolean) => void;
    open: boolean;
    table: TableInstance<TData>;
    title?: string;
}

export const EditRowModal = <TData extends RowData>({ onOpenChange, open, table, title, ...rest }: Props<TData>) => {
    const {
        getState,
        options: {
            mantineCreateRowModalProps,
            mantineEditRowModalProps,
            onCreatingRowCancel,
            onEditingRowCancel,
            renderCreateRowModalContent,
            renderEditRowModalContent,
        },
        setCreatingRow,
        setEditingRow,
    } = table;
    const { creatingRow, editingRow } = getState();
    const row = (creatingRow ?? editingRow) as Row<TData>;

    const arg = { row, table };
    const modalProps = {
        ...parseFromValuesOrFunc(mantineEditRowModalProps, arg),
        ...creatingRow && parseFromValuesOrFunc(mantineCreateRowModalProps, arg),
        ...rest,
    };

    const internalEditComponents = row
        .getAllCells()
        .filter((cell) => cell.column.columnDef.columnDefType === "data")
        .map((cell) => <EditCellTextInput cell={cell} key={cell.id} table={table} />);

    const handleCancel = () => {
        if (creatingRow) {
            onCreatingRowCancel?.({ row, table });
            setCreatingRow(null);
        } else {
            onEditingRowCancel?.({ row, table });
            setEditingRow(null);
        }

        row._valuesCache = {} as any; // reset values cache
        onOpenChange?.(false);
    };

    const modalTitle = title ?? (creatingRow ? "Create Row" : "Edit Row");

    return (
        <Dialog onOpenChange={onOpenChange} open={open}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{modalTitle}</DialogTitle>
                </DialogHeader>
                {((creatingRow
                    && renderCreateRowModalContent?.({
                        internalEditComponents,
                        row,
                        table,
                    }))
                    || renderEditRowModalContent?.({
                        internalEditComponents,
                        row,
                        table,
                    })) ?? (
                    <>
                        <form onSubmit={(e) => e.preventDefault()}>
                            <div className="space-y-6 py-4">{internalEditComponents}</div>
                        </form>
                        <div className="flex justify-end">
                            <EditActionButtons row={row} table={table} variant="text" />
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
};
