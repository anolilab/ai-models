"use client";

import { GripVertical } from "lucide-react";

import { Separator } from "@/components/ui/separator";
import cn from "@/lib/utils";

// Simplified resizer component without complex types
const DataTableResizer = ({ header }: { header: any }) => (
    <div
        className="hover:bg-border absolute top-0 right-0 h-full w-1 cursor-col-resize touch-none bg-transparent select-none"
        onMouseDown={header.getResizeHandler()}
        onTouchStart={header.getResizeHandler()}
    />
);

export default DataTableResizer;
