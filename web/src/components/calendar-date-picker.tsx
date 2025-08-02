"use client";

import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { endOfDay, endOfMonth, endOfWeek, endOfYear, startOfDay, startOfMonth, startOfWeek, startOfYear, subDays } from "date-fns";
import { formatInTimeZone, toDate } from "date-fns-tz";
import { CalendarIcon } from "lucide-react";
import * as React from "react";
import type { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import cn from "@/lib/utils";

import { Calendar } from "./ui/calendar";

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const multiSelectVariants = cva(
    "flex items-center justify-center whitespace-nowrap text-sm font-medium text-foreground ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    {
        defaultVariants: {
            variant: "default",
        },
        variants: {
            variant: {
                default: "bg-primary text-primary-foreground hover:bg-primary/90",
                destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                ghost: "hover:bg-accent hover:text-accent-foreground text-background",
                link: " underline-offset-4 hover:underline text-background",
                outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
                secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
            },
        },
    },
);

interface CalendarDatePickerProps extends React.HTMLAttributes<HTMLButtonElement>, VariantProps<typeof multiSelectVariants> {
    className?: string;
    closeOnSelect?: boolean;
    date: DateRange;
    id?: string;
    numberOfMonths?: 1 | 2;
    onDateSelect: (range: { from: Date; to: Date }) => void;
    yearsRange?: number;
}

export const CalendarDatePicker = React.forwardRef<HTMLButtonElement, CalendarDatePickerProps>(
    ({ className, closeOnSelect = false, date, id = "calendar-date-picker", numberOfMonths = 2, onDateSelect, variant, yearsRange = 10, ...props }, ref) => {
        const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);
        const [selectedRange, setSelectedRange] = React.useState<string | null>(numberOfMonths === 2 ? "This Year" : "Today");
        const [monthFrom, setMonthFrom] = React.useState<Date | undefined>(date?.from);
        const [yearFrom, setYearFrom] = React.useState<number | undefined>(date?.from?.getFullYear());
        const [monthTo, setMonthTo] = React.useState<Date | undefined>(numberOfMonths === 2 ? date?.to : date?.from);
        const [yearTo, setYearTo] = React.useState<number | undefined>(numberOfMonths === 2 ? date?.to?.getFullYear() : date?.from?.getFullYear());
        const [highlightedPart, setHighlightedPart] = React.useState<string | null>(null);

        const { timeZone } = Intl.DateTimeFormat().resolvedOptions();

        const handleClose = () => setIsPopoverOpen(false);

        const handleTogglePopover = () => setIsPopoverOpen((prev) => !prev);

        const selectDateRange = (from: Date, to: Date, range: string) => {
            const startDate = startOfDay(toDate(from, { timeZone }));
            const endDate = numberOfMonths === 2 ? endOfDay(toDate(to, { timeZone })) : startDate;

            onDateSelect({ from: startDate, to: endDate });
            setSelectedRange(range);
            setMonthFrom(from);
            setYearFrom(from.getFullYear());
            setMonthTo(to);
            setYearTo(to.getFullYear());
            closeOnSelect && setIsPopoverOpen(false);
        };

        const handleDateSelect = (range: DateRange | undefined) => {
            if (range) {
                let from = startOfDay(toDate(range.from as Date, { timeZone }));
                let to = range.to ? endOfDay(toDate(range.to, { timeZone })) : from;

                if (numberOfMonths === 1) {
                    if (range.from !== date.from) {
                        to = from;
                    } else {
                        from = startOfDay(toDate(range.to as Date, { timeZone }));
                    }
                }

                onDateSelect({ from, to });
                setMonthFrom(from);
                setYearFrom(from.getFullYear());
                setMonthTo(to);
                setYearTo(to.getFullYear());
            }

            setSelectedRange(null);
        };

        const handleMonthChange = (newMonthIndex: number, part: string) => {
            setSelectedRange(null);

            if (part === "from") {
                if (yearFrom !== undefined) {
                    if (newMonthIndex < 0 || newMonthIndex > yearsRange + 1)
                        return;

                    const newMonth = new Date(yearFrom, newMonthIndex, 1);
                    const from
                        = numberOfMonths === 2
                            ? startOfMonth(toDate(newMonth, { timeZone }))
                            : date?.from
                                ? new Date(date.from.getFullYear(), newMonth.getMonth(), date.from.getDate())
                                : newMonth;
                    const to = numberOfMonths === 2 ? date.to ? endOfDay(toDate(date.to, { timeZone })) : endOfMonth(toDate(newMonth, { timeZone })) : from;

                    if (from <= to) {
                        onDateSelect({ from, to });
                        setMonthFrom(newMonth);
                        setMonthTo(date.to);
                    }
                }
            } else if (yearTo !== undefined) {
                if (newMonthIndex < 0 || newMonthIndex > yearsRange + 1)
                    return;

                const newMonth = new Date(yearTo, newMonthIndex, 1);
                const from = date.from ? startOfDay(toDate(date.from, { timeZone })) : startOfMonth(toDate(newMonth, { timeZone }));
                const to = numberOfMonths === 2 ? endOfMonth(toDate(newMonth, { timeZone })) : from;

                if (from <= to) {
                    onDateSelect({ from, to });
                    setMonthTo(newMonth);
                    setMonthFrom(date.from);
                }
            }
        };

        const handleYearChange = (newYear: number, part: string) => {
            setSelectedRange(null);

            if (part === "from") {
                if (years.includes(newYear)) {
                    const newMonth = monthFrom ? new Date(newYear, monthFrom ? monthFrom.getMonth() : 0, 1) : new Date(newYear, 0, 1);
                    const from
                        = numberOfMonths === 2
                            ? startOfMonth(toDate(newMonth, { timeZone }))
                            : date.from
                                ? new Date(newYear, newMonth.getMonth(), date.from.getDate())
                                : newMonth;
                    const to = numberOfMonths === 2 ? date.to ? endOfDay(toDate(date.to, { timeZone })) : endOfMonth(toDate(newMonth, { timeZone })) : from;

                    if (from <= to) {
                        onDateSelect({ from, to });
                        setYearFrom(newYear);
                        setMonthFrom(newMonth);
                        setYearTo(date.to?.getFullYear());
                        setMonthTo(date.to);
                    }
                }
            } else if (years.includes(newYear)) {
                const newMonth = monthTo ? new Date(newYear, monthTo.getMonth(), 1) : new Date(newYear, 0, 1);
                const from = date.from ? startOfDay(toDate(date.from, { timeZone })) : startOfMonth(toDate(newMonth, { timeZone }));
                const to = numberOfMonths === 2 ? endOfMonth(toDate(newMonth, { timeZone })) : from;

                if (from <= to) {
                    onDateSelect({ from, to });
                    setYearTo(newYear);
                    setMonthTo(newMonth);
                    setYearFrom(date.from?.getFullYear());
                    setMonthFrom(date.from);
                }
            }
        };

        const today = new Date();

        const years = Array.from({ length: yearsRange + 1 }, (_, i) => today.getFullYear() - yearsRange / 2 + i);

        const dateRanges = [
            { end: today, label: "Today", start: today },
            { end: subDays(today, 1), label: "Yesterday", start: subDays(today, 1) },
            {
                end: endOfWeek(today, { weekStartsOn: 1 }),
                label: "This Week",
                start: startOfWeek(today, { weekStartsOn: 1 }),
            },
            {
                end: subDays(endOfWeek(today, { weekStartsOn: 1 }), 7),
                label: "Last Week",
                start: subDays(startOfWeek(today, { weekStartsOn: 1 }), 7),
            },
            { end: today, label: "Last 7 Days", start: subDays(today, 6) },
            {
                end: endOfMonth(today),
                label: "This Month",
                start: startOfMonth(today),
            },
            {
                end: endOfMonth(subDays(today, today.getDate())),
                label: "Last Month",
                start: startOfMonth(subDays(today, today.getDate())),
            },
            { end: endOfYear(today), label: "This Year", start: startOfYear(today) },
            {
                end: endOfYear(subDays(today, 365)),
                label: "Last Year",
                start: startOfYear(subDays(today, 365)),
            },
        ];

        const handleMouseOver = (part: string) => {
            setHighlightedPart(part);
        };

        const handleMouseLeave = () => {
            setHighlightedPart(null);
        };

        const handleWheel = (event: React.WheelEvent, part: string) => {
            event.preventDefault();
            setSelectedRange(null);

            if (highlightedPart === "firstDay") {
                const newDate = new Date(date.from as Date);
                const increment = event.deltaY > 0 ? -1 : 1;

                newDate.setDate(newDate.getDate() + increment);

                if (newDate <= (date.to as Date)) {
                    numberOfMonths === 2 ? onDateSelect({ from: newDate, to: new Date(date.to as Date) }) : onDateSelect({ from: newDate, to: newDate });
                    setMonthFrom(newDate);
                } else if (newDate > (date.to as Date) && numberOfMonths === 1) {
                    onDateSelect({ from: newDate, to: newDate });
                    setMonthFrom(newDate);
                }
            } else if (highlightedPart === "firstMonth") {
                const currentMonth = monthFrom ? monthFrom.getMonth() : 0;
                const newMonthIndex = currentMonth + (event.deltaY > 0 ? -1 : 1);

                handleMonthChange(newMonthIndex, "from");
            } else if (highlightedPart === "firstYear" && yearFrom !== undefined) {
                const newYear = yearFrom + (event.deltaY > 0 ? -1 : 1);

                handleYearChange(newYear, "from");
            } else if (highlightedPart === "secondDay") {
                const newDate = new Date(date.to as Date);
                const increment = event.deltaY > 0 ? -1 : 1;

                newDate.setDate(newDate.getDate() + increment);

                if (newDate >= (date.from as Date)) {
                    onDateSelect({ from: new Date(date.from as Date), to: newDate });
                    setMonthTo(newDate);
                }
            } else if (highlightedPart === "secondMonth") {
                const currentMonth = monthTo ? monthTo.getMonth() : 0;
                const newMonthIndex = currentMonth + (event.deltaY > 0 ? -1 : 1);

                handleMonthChange(newMonthIndex, "to");
            } else if (highlightedPart === "secondYear" && yearTo !== undefined) {
                const newYear = yearTo + (event.deltaY > 0 ? -1 : 1);

                handleYearChange(newYear, "to");
            }
        };

        React.useEffect(() => {
            const firstDayElement = document.getElementById(`firstDay-${id}`);
            const firstMonthElement = document.getElementById(`firstMonth-${id}`);
            const firstYearElement = document.getElementById(`firstYear-${id}`);
            const secondDayElement = document.getElementById(`secondDay-${id}`);
            const secondMonthElement = document.getElementById(`secondMonth-${id}`);
            const secondYearElement = document.getElementById(`secondYear-${id}`);

            const elements = [firstDayElement, firstMonthElement, firstYearElement, secondDayElement, secondMonthElement, secondYearElement];

            const addPassiveEventListener = (element: HTMLElement | null) => {
                if (element) {
                    element.addEventListener("wheel", handleWheel as unknown as EventListener, {
                        passive: false,
                    });
                }
            };

            elements.forEach(addPassiveEventListener);

            return () => {
                elements.forEach((element) => {
                    if (element) {
                        element.removeEventListener("wheel", handleWheel as unknown as EventListener);
                    }
                });
            };
        }, [highlightedPart, date]);

        const formatWithTz = (date: Date, fmt: string) => formatInTimeZone(date, timeZone, fmt);

        return (
            <>
                <style>
                    {`
            .date-part {
              touch-action: none;
            }
          `}
                </style>
                <Popover onOpenChange={setIsPopoverOpen} open={isPopoverOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            id="date"
                            ref={ref}
                            {...props}
                            className={cn("w-auto", multiSelectVariants({ className, variant }))}
                            onClick={handleTogglePopover}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            <span>
                                {date?.from
                                    ? date.to
                                        ? (
                                        <>
                                            <span
                                                className={cn("date-part", highlightedPart === "firstDay" && "font-bold underline")}
                                                id={`firstDay-${id}`}
                                                onMouseLeave={handleMouseLeave}
                                                onMouseOver={() => handleMouseOver("firstDay")}
                                            >
                                                {formatWithTz(date.from, "dd")}
                                            </span>{" "}
                                            <span
                                                className={cn("date-part", highlightedPart === "firstMonth" && "font-bold underline")}
                                                id={`firstMonth-${id}`}
                                                onMouseLeave={handleMouseLeave}
                                                onMouseOver={() => handleMouseOver("firstMonth")}
                                            >
                                                {formatWithTz(date.from, "LLL")}
                                            </span>
                                            ,{" "}
                                            <span
                                                className={cn("date-part", highlightedPart === "firstYear" && "font-bold underline")}
                                                id={`firstYear-${id}`}
                                                onMouseLeave={handleMouseLeave}
                                                onMouseOver={() => handleMouseOver("firstYear")}
                                            >
                                                {formatWithTz(date.from, "y")}
                                            </span>
                                            {numberOfMonths === 2 && (
                                                <>
                                                    {" - "}
                                                    <span
                                                        className={cn("date-part", highlightedPart === "secondDay" && "font-bold underline")}
                                                        id={`secondDay-${id}`}
                                                        onMouseLeave={handleMouseLeave}
                                                        onMouseOver={() => handleMouseOver("secondDay")}
                                                    >
                                                        {formatWithTz(date.to, "dd")}
                                                    </span>{" "}
                                                    <span
                                                        className={cn("date-part", highlightedPart === "secondMonth" && "font-bold underline")}
                                                        id={`secondMonth-${id}`}
                                                        onMouseLeave={handleMouseLeave}
                                                        onMouseOver={() => handleMouseOver("secondMonth")}
                                                    >
                                                        {formatWithTz(date.to, "LLL")}
                                                    </span>
                                                    ,{" "}
                                                    <span
                                                        className={cn("date-part", highlightedPart === "secondYear" && "font-bold underline")}
                                                        id={`secondYear-${id}`}
                                                        onMouseLeave={handleMouseLeave}
                                                        onMouseOver={() => handleMouseOver("secondYear")}
                                                    >
                                                        {formatWithTz(date.to, "y")}
                                                    </span>
                                                </>
                                            )}
                                        </>
                                        )
                                        : (
                                        <>
                                            <span
                                                className={cn("date-part", highlightedPart === "day" && "font-bold underline")}
                                                id="day"
                                                onMouseLeave={handleMouseLeave}
                                                onMouseOver={() => handleMouseOver("day")}
                                            >
                                                {formatWithTz(date.from, "dd")}
                                            </span>{" "}
                                            <span
                                                className={cn("date-part", highlightedPart === "month" && "font-bold underline")}
                                                id="month"
                                                onMouseLeave={handleMouseLeave}
                                                onMouseOver={() => handleMouseOver("month")}
                                            >
                                                {formatWithTz(date.from, "LLL")}
                                            </span>
                                            ,{" "}
                                            <span
                                                className={cn("date-part", highlightedPart === "year" && "font-bold underline")}
                                                id="year"
                                                onMouseLeave={handleMouseLeave}
                                                onMouseOver={() => handleMouseOver("year")}
                                            >
                                                {formatWithTz(date.from, "y")}
                                            </span>
                                        </>
                                        )
                                    : (
                                    <span>Select a date</span>
                                    )}
                            </span>
                        </Button>
                    </PopoverTrigger>
                    {isPopoverOpen && (
                        <PopoverContent
                            align="start"
                            avoidCollisions={false}
                            className="w-auto"
                            onEscapeKeyDown={handleClose}
                            onInteractOutside={handleClose}
                            style={{
                                maxHeight: "var(--radix-popover-content-available-height)",
                                overflowY: "auto",
                            }}
                        >
                            <div className="flex">
                                {numberOfMonths === 2 && (
                                    <div className="border-foreground/10 flex flex-col gap-1 border-r pr-4 text-left">
                                        {dateRanges.map(({ end, label, start }) => (
                                            <Button
                                                className={cn(
                                                    "hover:bg-primary/90 hover:text-background justify-start",
                                                    selectedRange === label && "bg-primary text-background hover:bg-primary/90 hover:text-background",
                                                )}
                                                key={label}
                                                onClick={() => {
                                                    selectDateRange(start, end, label);
                                                    setMonthFrom(start);
                                                    setYearFrom(start.getFullYear());
                                                    setMonthTo(end);
                                                    setYearTo(end.getFullYear());
                                                }}
                                                variant="ghost"
                                            >
                                                {label}
                                            </Button>
                                        ))}
                                    </div>
                                )}
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-4">
                                        <div className="ml-3 flex gap-2">
                                            <Select
                                                onValueChange={(value) => {
                                                    handleMonthChange(months.indexOf(value), "from");
                                                    setSelectedRange(null);
                                                }}
                                                value={monthFrom ? months[monthFrom.getMonth()] : undefined}
                                            >
                                                <SelectTrigger className="hover:bg-accent hover:text-accent-foreground w-[122px] font-medium focus:ring-0 focus:ring-offset-0">
                                                    <SelectValue placeholder="Month" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {months.map((month, idx) => (
                                                        <SelectItem key={idx} value={month}>
                                                            {month}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <Select
                                                onValueChange={(value) => {
                                                    handleYearChange(Number(value), "from");
                                                    setSelectedRange(null);
                                                }}
                                                value={yearFrom ? yearFrom.toString() : undefined}
                                            >
                                                <SelectTrigger className="hover:bg-accent hover:text-accent-foreground w-[122px] font-medium focus:ring-0 focus:ring-offset-0">
                                                    <SelectValue placeholder="Year" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {years.map((year, idx) => (
                                                        <SelectItem key={idx} value={year.toString()}>
                                                            {year}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        {numberOfMonths === 2 && (
                                            <div className="flex gap-2">
                                                <Select
                                                    onValueChange={(value) => {
                                                        handleMonthChange(months.indexOf(value), "to");
                                                        setSelectedRange(null);
                                                    }}
                                                    value={monthTo ? months[monthTo.getMonth()] : undefined}
                                                >
                                                    <SelectTrigger className="hover:bg-accent hover:text-accent-foreground w-[122px] font-medium focus:ring-0 focus:ring-offset-0">
                                                        <SelectValue placeholder="Month" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {months.map((month, idx) => (
                                                            <SelectItem key={idx} value={month}>
                                                                {month}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <Select
                                                    onValueChange={(value) => {
                                                        handleYearChange(Number(value), "to");
                                                        setSelectedRange(null);
                                                    }}
                                                    value={yearTo ? yearTo.toString() : undefined}
                                                >
                                                    <SelectTrigger className="hover:bg-accent hover:text-accent-foreground w-[122px] font-medium focus:ring-0 focus:ring-offset-0">
                                                        <SelectValue placeholder="Year" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {years.map((year, idx) => (
                                                            <SelectItem key={idx} value={year.toString()}>
                                                                {year}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex">
                                        <Calendar
                                            className={className}
                                            defaultMonth={monthFrom}
                                            mode="range"
                                            month={monthFrom}
                                            numberOfMonths={numberOfMonths}
                                            onMonthChange={setMonthFrom}
                                            onSelect={handleDateSelect}
                                            selected={date}
                                            showOutsideDays={false}
                                        />
                                    </div>
                                </div>
                            </div>
                        </PopoverContent>
                    )}
                </Popover>
            </>
        );
    },
);

CalendarDatePicker.displayName = "CalendarDatePicker";
