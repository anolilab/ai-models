import type { LucideIcon } from "lucide-react";

/*
 * # GENERAL NOTES:
 *
 * ## GENERICS:
 *
 * TData is the shape of a single row in your data table.
 * TVal is the shape of the underlying value for a column.
 * TType is the type (kind) of the column.
 *
 */

export type ElementType<T> = T extends (infer U)[] ? U : T;

export type Nullable<T> = T | null | undefined;

/*
 * The model of a column option.
 * Used for representing underlying column values of type `option` or `multiOption`.
 */
export interface ColumnOption {
    /* An optional icon to display next to the label. */
    icon?: React.ReactElement | React.ElementType;
    /* The label to display for the option. */
    label: string;
    /* The internal value of the option. */
    value: string;
}

export interface ColumnOptionExtended extends ColumnOption {
    count?: number;
    selected?: boolean;
}

/*
 * Represents the data type (kind) of a column.
 */
export type ColumnDataType
    /* The column value is a string that should be searchable. */
    = | "text"
        | "number"
        | "date"
    /* The column value can be a single value from a list of options. */
        | "option"
    /* The column value can be zero or more values from a list of options. */
        | "multiOption";

/*
 * Represents the data type (kind) of option and multi-option columns.
 */
export type OptionBasedColumnDataType = Extract<ColumnDataType, "option" | "multiOption">;

/*
 * Maps a ColumnDataType to it's primitive type (i.e. string, number, etc.).
 */
export type ColumnDataNativeMap = {
    date: Date;
    multiOption: string[];
    number: number;
    option: string;
    text: string;
};

/*
 * Represents the value of a column filter.
 * Contigent on the filtered column's data type.
 */
export type FilterValues<T extends ColumnDataType> = ElementType<ColumnDataNativeMap[T]>[];

/*
 * An accessor function for a column's data.
 * Uses the original row data as an argument.
 */
export type TAccessorFn<TData, TVal = unknown> = (data: TData) => TVal;

/*
 * Used by `option` and `multiOption` columns.
 * Transforms the underlying column value into a valid ColumnOption.
 */
export type TTransformOptionFn<TVal = unknown> = (value: ElementType<NonNullable<TVal>>) => ColumnOption;

/*
 * Used by `option` and `multiOption` columns.
 * A custom ordering function when sorting a column's options.
 */
export type TOrderFn<TVal = unknown> = (a: ElementType<NonNullable<TVal>>, b: ElementType<NonNullable<TVal>>) => number;

/*
 * The configuration for a column.
 */
export type ColumnConfig<TData, TType extends ColumnDataType = any, TVal = unknown, TId extends string = string> = {
    accessor: TAccessorFn<TData, TVal>;
    displayName: string;
    facetedOptions?: TType extends OptionBasedColumnDataType ? Map<string, number> : never;
    icon: LucideIcon;
    id: TId;
    max?: TType extends "number" ? number : never;
    min?: TType extends "number" ? number : never;
    options?: TType extends OptionBasedColumnDataType ? ColumnOption[] : never;
    orderFn?: TType extends OptionBasedColumnDataType ? TOrderFn<TVal> : never;
    transformOptionFn?: TType extends OptionBasedColumnDataType ? TTransformOptionFn<TVal> : never;
    type: TType;
};

export type OptionColumnId<T> = T extends ColumnConfig<infer TData, "option" | "multiOption", infer TVal, infer TId> ? TId : never;

export type OptionColumnIds<T extends ReadonlyArray<ColumnConfig<any, any, any, any>>> = {
    [K in keyof T]: OptionColumnId<T[K]>;
}[number];

export type NumberColumnId<T> = T extends ColumnConfig<infer TData, "number", infer TVal, infer TId> ? TId : never;

export type NumberColumnIds<T extends ReadonlyArray<ColumnConfig<any, any, any, any>>> = {
    [K in keyof T]: NumberColumnId<T[K]>;
}[number];

/*
 * Describes a helper function for creating column configurations.
 */
export type ColumnConfigHelper<TData> = {
    accessor: <TAccessor extends TAccessorFn<TData>, TType extends ColumnDataType, TVal extends ReturnType<TAccessor>>(
        accessor: TAccessor,
        config?: Omit<ColumnConfig<TData, TType, TVal>, "accessor">,
    ) => ColumnConfig<TData, TType, unknown>;
};

export type DataTableFilterConfig<TData> = {
    columns: ColumnConfig<TData>[];
    data: TData[];
};

export type ColumnProperties<TData, TVal> = {
    getFacetedMinMaxValues: () => [number, number] | undefined;
    getFacetedUniqueValues: () => Map<string, number> | undefined;
    getOptions: () => ColumnOption[];
    getValues: () => ElementType<NonNullable<TVal>>[];
    prefetchFacetedMinMaxValues: () => Promise<void>; // Prefetch faceted min/max values
    prefetchFacetedUniqueValues: () => Promise<void>; // Prefetch faceted unique values
    prefetchOptions: () => Promise<void>; // Prefetch options
    prefetchValues: () => Promise<void>; // Prefetch values
};

export type ColumnPrivateProperties<TData, TVal> = {
    _prefetchedFacetedMinMaxValuesCache: [number, number] | null;
    _prefetchedFacetedUniqueValuesCache: Map<string, number> | null;
    _prefetchedOptionsCache: ColumnOption[] | null;
    _prefetchedValuesCache: ElementType<NonNullable<TVal>>[] | null;
};

export type Column<TData, TType extends ColumnDataType = any, TVal = unknown> = ColumnConfig<TData, TType, TVal>
    & ColumnPrivateProperties<TData, TVal>
    & ColumnProperties<TData, TVal>;

/*
 * Describes the available actions on column filters.
 * Includes both column-specific and global actions, ultimately acting on the column filters.
 */
export interface DataTableFilterActions {
    addFilterValue: <TData, TType extends OptionBasedColumnDataType>(column: Column<TData, TType>, values: FilterModel<TType>["values"]) => void;

    removeAllFilters: () => void;

    removeFilter: (columnId: string) => void;

    removeFilterValue: <TData, TType extends OptionBasedColumnDataType>(column: Column<TData, TType>, value: FilterModel<TType>["values"]) => void;

    setFilterOperator: <TType extends ColumnDataType>(columnId: string, operator: FilterModel<TType>["operator"]) => void;

    setFilterValue: <TData, TType extends ColumnDataType>(column: Column<TData, TType>, values: FilterModel<TType>["values"]) => void;
}

export type FilterStrategy = "client" | "server";

/* Operators for text data */
export type TextFilterOperator = "contains" | "does not contain";

/* Operators for number data */
export type NumberFilterOperator
    = | "is"
        | "is not"
        | "is less than"
        | "is greater than or equal to"
        | "is greater than"
        | "is less than or equal to"
        | "is between"
        | "is not between";

/* Operators for date data */
export type DateFilterOperator = "is" | "is not" | "is before" | "is on or after" | "is after" | "is on or before" | "is between" | "is not between";

/* Operators for option data */
export type OptionFilterOperator = "is" | "is not" | "is any of" | "is none of";

/* Operators for multi-option data */
export type MultiOptionFilterOperator = "include" | "exclude" | "include any of" | "include all of" | "exclude if any of" | "exclude if all";

/* Maps filter operators to their respective data types */
export type FilterOperators = {
    date: DateFilterOperator;
    multiOption: MultiOptionFilterOperator;
    number: NumberFilterOperator;
    option: OptionFilterOperator;
    text: TextFilterOperator;
};

/*
 *
 * FilterValue is a type that represents a filter value for a specific column.
 *
 * It consists of:
 * - Operator: The operator to be used for the filter.
 * - Values: An array of values to be used for the filter.
 *
 */
export type FilterModel<TType extends ColumnDataType = any> = {
    columnId: string;
    operator: FilterOperators[TType];
    type: TType;
    values: FilterValues<TType>;
};

export type FiltersState = FilterModel[];

/*
 * FilterDetails is a type that represents the details of all the filter operators for a specific column data type.
 */
export type FilterDetails<T extends ColumnDataType> = {
    [key in FilterOperators[T]]: FilterOperatorDetails<key, T>;
};

export type FilterOperatorTarget = "single" | "multiple";

export type FilterOperatorDetailsBase<OperatorValue, T extends ColumnDataType> = {
    /* Whether the operator is negated. */
    isNegated: boolean;
    /* The i18n key for the operator. */
    key: string;
    /* If the operator is not negated, this provides the negated equivalent. */
    negation?: FilterOperators[T];
    /* If the operator is negated, this provides the positive equivalent. */
    negationOf?: FilterOperators[T];
    /* The singular form of the operator, if applicable. */
    pluralOf?: FilterOperators[T];
    /* All related operators. Normally, all the operators which share the same target. */
    relativeOf: FilterOperators[T] | FilterOperators[T][];
    /* The plural form of the operator, if applicable. */
    singularOf?: FilterOperators[T];
    /* How much data the operator applies to. */
    target: FilterOperatorTarget;
    /* The operator value. Usually the string representation of the operator. */
    value: OperatorValue;
};

/*
 *
 * FilterOperatorDetails is a type that provides details about a filter operator for a specific column data type.
 * It extends FilterOperatorDetailsBase with additional logic and contraints on the defined properties.
 *
 */
export type FilterOperatorDetails<OperatorValue, T extends ColumnDataType> = FilterOperatorDetailsBase<OperatorValue, T>
    & ({ isNegated: false; negation: FilterOperators[T]; negationOf?: never } | { isNegated: true; negation?: never; negationOf: FilterOperators[T] })
    & (
        | { pluralOf?: never; singularOf?: never }
        | { pluralOf?: never; singularOf: FilterOperators[T]; target: "single" }
        | { pluralOf: FilterOperators[T]; singularOf?: never; target: "multiple" }
    );

/* Maps column data types to their respective filter operator details */
export type FilterTypeOperatorDetails = {
    [key in ColumnDataType]: FilterDetails<key>;
};
