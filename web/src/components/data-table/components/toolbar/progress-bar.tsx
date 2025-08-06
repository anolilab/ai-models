import clsx from "clsx";

import { Progress } from "@/components/ui/progress";

import type { RowData, TableInstance } from "../../types";
import { parseFromValuesOrFunc } from "../../utils/utils";

interface Props<TData extends RowData> {
    className?: string;
    isTopToolbar: boolean;
    style?: React.CSSProperties;
    table: TableInstance<TData>;
}

export const ProgressBar = <TData extends RowData>({ className, isTopToolbar, style, table, ...rest }: Props<TData>) => {
    const {
        getState,
        options: { mantineProgressProps },
    } = table;
    const { isSaving, showProgressBars } = getState();

    const linearProgressProps = {
        ...parseFromValuesOrFunc(mantineProgressProps, {
            isTopToolbar,
            table,
        }),
        ...rest,
    };

    if (!isSaving && !showProgressBars) {
        return null;
    }

    return (
        <div className={clsx("absolute top-0 w-full", isTopToolbar && "top-auto bottom-0", className)} style={style}>
            <Progress aria-busy="true" aria-label="Loading" className="w-full" value={100} {...linearProgressProps} />
        </div>
    );
};
