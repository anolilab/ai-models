import { X } from "lucide-react";
import { memo } from "react";

import { Button } from "@/components/ui/button";
import cn from "@/lib/utils";

import type { DataTableFilterActions } from "../core/types";
import type { Locale } from "../lib/i18n";
import { t } from "../lib/i18n";

interface FilterActionsProps {
    actions?: DataTableFilterActions;
    hasFilters: boolean;
    locale?: Locale;
}

const filterActionsFn = ({ actions, hasFilters, locale = "en" }: FilterActionsProps) => (
        <Button className={!hasFilters ? "hidden" : ""} onClick={actions?.removeAllFilters} variant="destructive">
            <X />
            <span className="hidden md:block">{t("clear", locale)}</span>
        </Button>
);

const FilterActions = memo(filterActionsFn);

export default FilterActions;
