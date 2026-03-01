"use client";

// Simplified resizer component without complex types
const DataTableResizer = ({ header }: { header: any }) => (
    <div
        className="hover:bg-border absolute top-0 right-0 h-full w-1 cursor-col-resize touch-none bg-transparent select-none"
        onMouseDown={header.getResizeHandler()}
        onTouchStart={header.getResizeHandler()}
    />
);

export default DataTableResizer;
