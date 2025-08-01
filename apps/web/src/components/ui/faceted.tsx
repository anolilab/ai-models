"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type FacetedValue<Multiple extends boolean> = Multiple extends true ? string[] : string;

interface FacetedContextValue<Multiple extends boolean = boolean> {
    multiple?: Multiple;
    onItemSelect?: (value: string) => void;
    value?: FacetedValue<Multiple>;
}

const FacetedContext = React.createContext<FacetedContextValue<boolean> | null>(null);

function useFacetedContext(name: string) {
    const context = React.useContext(FacetedContext);

    if (!context) {
        throw new Error(`\`${name}\` must be within Faceted`);
    }

    return context;
}

interface FacetedProps<Multiple extends boolean = false> extends React.ComponentProps<typeof Popover> {
    children?: React.ReactNode;
    multiple?: Multiple;
    onValueChange?: (value: FacetedValue<Multiple> | undefined) => void;
    value?: FacetedValue<Multiple>;
}

function Faceted<Multiple extends boolean = false>(props: FacetedProps<Multiple>) {
    const { children, multiple = false, onOpenChange: onOpenChangeProp, onValueChange, open: openProp, value, ...facetedProps } = props;

    const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
    const isControlled = openProp !== undefined;
    const open = isControlled ? openProp : uncontrolledOpen;

    const onOpenChange = React.useCallback(
        (newOpen: boolean) => {
            if (!isControlled) {
                setUncontrolledOpen(newOpen);
            }

            onOpenChangeProp?.(newOpen);
        },
        [isControlled, onOpenChangeProp],
    );

    const onItemSelect = React.useCallback(
        (selectedValue: string) => {
            if (!onValueChange)
                return;

            if (multiple) {
                const currentValue = (Array.isArray(value) ? value : []) as string[];
                const newValue = currentValue.includes(selectedValue) ? currentValue.filter((v) => v !== selectedValue) : [...currentValue, selectedValue];

                onValueChange(newValue as FacetedValue<Multiple>);
            } else {
                if (value === selectedValue) {
                    onValueChange(undefined);
                } else {
                    onValueChange(selectedValue as FacetedValue<Multiple>);
                }

                requestAnimationFrame(() => onOpenChange(false));
            }
        },
        [multiple, value, onValueChange, onOpenChange],
    );

    const contextValue = React.useMemo<FacetedContextValue<typeof multiple>>(() => { return { multiple, onItemSelect, value }; }, [value, onItemSelect, multiple]);

    return (
        <FacetedContext.Provider value={contextValue}>
            <Popover onOpenChange={onOpenChange} open={open} {...facetedProps}>
                {children}
            </Popover>
        </FacetedContext.Provider>
    );
}

function FacetedTrigger(props: React.ComponentProps<typeof PopoverTrigger>) {
    const { children, className, ...triggerProps } = props;

    return (
        <PopoverTrigger {...triggerProps} className={cn("justify-between text-left", className)}>
            {children}
        </PopoverTrigger>
    );
}

interface FacetedBadgeListProps extends React.ComponentProps<"div"> {
    badgeClassName?: string;
    max?: number;
    options?: { label: string; value: string }[];
    placeholder?: string;
}

function FacetedBadgeList(props: FacetedBadgeListProps) {
    const { badgeClassName, className, max = 2, options = [], placeholder = "Select options...", ...badgeListProps } = props;

    const context = useFacetedContext("FacetedBadgeList");
    const values = Array.isArray(context.value) ? context.value : ([context.value].filter(Boolean) as string[]);

    const getLabel = React.useCallback(
        (value: string) => {
            const option = options.find((opt) => opt.value === value);

            return option?.label ?? value;
        },
        [options],
    );

    if (!values || values.length === 0) {
        return (
            <div {...badgeListProps} className="text-muted-foreground flex w-full items-center gap-1">
                {placeholder}
                <ChevronsUpDown className="ml-auto size-4 shrink-0 opacity-50" />
            </div>
        );
    }

    return (
        <div {...badgeListProps} className={cn("flex flex-wrap items-center gap-1", className)}>
            {values.length > max
                ? (
                <Badge className={cn("px-1 font-normal", badgeClassName)} variant="secondary">
                    {values.length} selected
                </Badge>
                )
                : values.map((value) => (
                    <Badge className={cn("px-1 font-normal", badgeClassName)} key={value} variant="secondary">
                        <span className="truncate">{getLabel(value)}</span>
                    </Badge>
                ))
            }
        </div>
    );
}

function FacetedContent(props: React.ComponentProps<typeof PopoverContent>) {
    const { children, className, ...contentProps } = props;

    return (
        <PopoverContent {...contentProps} align="start" className={cn("w-[200px] origin-(--radix-popover-content-transform-origin) p-0", className)}>
            <Command>{children}</Command>
        </PopoverContent>
    );
}

const FacetedInput = CommandInput;

const FacetedList = CommandList;

const FacetedEmpty = CommandEmpty;

const FacetedGroup = CommandGroup;

interface FacetedItemProps extends React.ComponentProps<typeof CommandItem> {
    value: string;
}

function FacetedItem(props: FacetedItemProps) {
    const { children, className, onSelect, value, ...itemProps } = props;
    const context = useFacetedContext("FacetedItem");

    const isSelected = context.multiple ? Array.isArray(context.value) && context.value.includes(value) : context.value === value;

    const onItemSelect = React.useCallback(
        (currentValue: string) => {
            if (onSelect) {
                onSelect(currentValue);
            } else if (context.onItemSelect) {
                context.onItemSelect(currentValue);
            }
        },
        [onSelect, context.onItemSelect],
    );

    return (
        <CommandItem
            aria-selected={isSelected}
            className={cn("gap-2", className)}
            data-selected={isSelected}
            onSelect={() => onItemSelect(value)}
            {...itemProps}
        >
            <span
                className={cn(
                    "border-primary flex size-4 items-center justify-center border",
                    isSelected ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible",
                )}
            >
                <Check className="size-4" />
            </span>
            {children}
        </CommandItem>
    );
}

const FacetedSeparator = CommandSeparator;

export { Faceted, FacetedBadgeList, FacetedContent, FacetedEmpty, FacetedGroup, FacetedInput, FacetedItem, FacetedList, FacetedSeparator, FacetedTrigger };
