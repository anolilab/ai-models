import clsx from "clsx";
import { X } from "lucide-react";
import { Fragment, useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import type { RowData, TableInstance } from "../../types";
import { getSelectAllHandler } from "../../utils/row-utils";
import { parseFromValuesOrFunc } from "../../utils/utils";
import { SelectCheckbox } from "../inputs/select-checkbox";

interface Props<TData extends RowData> {
    className?: string;
    stackAlertBanner?: boolean;
    style?: React.CSSProperties;
    table: TableInstance<TData>;
}

export const ToolbarAlertBanner = <TData extends RowData>({ className, stackAlertBanner, style, table, ...rest }: Props<TData>) => {
    const {
        getFilteredSelectedRowModel,
        getPrePaginationRowModel,
        getState,
        options: {
            enableRowSelection,
            enableSelectAll,
            localization,
            mantineToolbarAlertBannerBadgeProps,
            mantineToolbarAlertBannerProps,
            manualPagination,
            positionToolbarAlertBanner,
            renderToolbarAlertBannerContent,
            rowCount,
        },
    } = table;
    const { density, grouping, rowSelection, showAlertBanner } = getState();

    const alertProps = {
        ...parseFromValuesOrFunc(mantineToolbarAlertBannerProps, {
            table,
        }),
        ...rest,
    };
    const badgeProps = parseFromValuesOrFunc(mantineToolbarAlertBannerBadgeProps, { table });

    const totalRowCount = rowCount ?? getPrePaginationRowModel().flatRows.length;

    const selectedRowCount = useMemo(
        () => (manualPagination ? Object.values(rowSelection).filter(Boolean).length : getFilteredSelectedRowModel().rows.length),
        [rowSelection, totalRowCount, manualPagination],
    );

    const selectedAlert = selectedRowCount
        ? (
        <div className="flex items-center gap-3">
            <span>
                {localization.selectedCountOfRowCountRowsSelected
                    ?.replace("{selectedCount}", selectedRowCount.toString())
                    ?.replace("{rowCount}", totalRowCount.toString())}
            </span>
            <Button onClick={(event) => getSelectAllHandler({ table })(event, false, true)} size="sm" variant="ghost">
                {localization.clearSelection}
            </Button>
        </div>
        )
        : null;

    const groupedAlert
        = grouping.length > 0
            ? (
            <div className="flex items-center gap-2">
                <span>{localization.groupedBy}</span>
                {grouping.map((columnId, index) => (
                    <Fragment key={`${index}-${columnId}`}>
                        {index > 0 ? localization.thenBy : ""}
                        <Badge className="ml-[1ch]" variant="default" {...badgeProps}>
                            {table.getColumn(columnId).columnDef.header}
                            <Button className="ml-1 h-4 w-4 p-0" onClick={() => table.getColumn(columnId).toggleGrouping()} size="sm" variant="ghost">
                                <X className="h-3 w-3" />
                            </Button>
                        </Badge>
                    </Fragment>
                ))}
            </div>
            )
            : null;

    const shouldShow = showAlertBanner || !!selectedAlert || !!groupedAlert;

    if (!shouldShow) {
        return null;
    }

    return (
        <div
            className={clsx(
                "relative top-0 right-0 left-0 z-10 w-full rounded-md rounded-none border border-blue-200 bg-blue-50 p-2 p-4 text-base",
                stackAlertBanner && !positionToolbarAlertBanner && "mb-0",
                !stackAlertBanner && positionToolbarAlertBanner === "bottom" && "-mb-4",
                className,
            )}
            style={style}
        >
            {renderToolbarAlertBannerContent?.({
                groupedAlert,
                selectedAlert,
                table,
            }) ?? (
                <div className={clsx("gap-2 p-2 px-4", positionToolbarAlertBanner === "head-overlay" && "p-0.5 md:p-2 xl:p-4", density)}>
                    {enableRowSelection && enableSelectAll && positionToolbarAlertBanner === "head-overlay" && <SelectCheckbox table={table} />}
                    <div className="space-y-2">
                        {alertProps?.children}
                        {selectedAlert}
                        {groupedAlert}
                    </div>
                </div>
            )}
        </div>
    );
};
