import type { Row, RowData, TableInstance } from "../../types";
import { parseFromValuesOrFunc } from "../../utils/utils";
import { RowPinButton } from "../buttons/row-pin-button";

interface Props<TData extends RowData> {
    className?: string;
    row: Row<TData>;
    style?: React.CSSProperties;
    table: TableInstance<TData>;
}

export const TableBodyRowPinButton = <TData extends RowData>({ className, row, style, table, ...rest }: Props<TData>) => {
    const {
        getState,
        options: { enableRowPinning, rowPinningDisplayMode },
    } = table;
    const { density } = getState();

    const canPin = parseFromValuesOrFunc(enableRowPinning, row as any);

    if (!canPin)
        return null;

    const rowPinButtonProps = {
        row,
        table,
        ...rest,
    };

    if (rowPinningDisplayMode === "top-and-bottom" && !row.getIsPinned()) {
        return (
            <div
                className={className}
                style={{
                    display: "flex",
                    flexDirection: density === "xs" ? "row" : "column",
                    ...style,
                }}
            >
                <RowPinButton pinningPosition="top" {...rowPinButtonProps} />
                <RowPinButton pinningPosition="bottom" {...rowPinButtonProps} />
            </div>
        );
    }

    return <RowPinButton pinningPosition={rowPinningDisplayMode === "bottom" ? "bottom" : "top"} {...rowPinButtonProps} />;
};
