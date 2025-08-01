import { FilterXIcon } from "lucide-react";
import { memo } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { DataTableFilterActions } from "../core/types";
import type { Locale } from "../lib/i18n";
import { t } from "../lib/i18n";

interface FilterActionsProps {
    actions?: DataTableFilterActions;
    hasFilters: boolean;
    locale?: Locale;
}

export const FilterActions = memo(__FilterActions);

function __FilterActions({ actions, hasFilters, locale = "en" }: FilterActionsProps) {
    return (
        <Button className={!hasFilters ? "hidden" : ""} onClick={actions?.removeAllFilters} variant="destructive">
            <FilterXIcon />
            <span className="hidden md:block">{t("clear", locale)}</span>
        </Button>
    );
}
