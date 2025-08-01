import { Skeleton } from "@/components/ui/skeleton";

interface SkeletonTableProps {
    columns?: number;
    rows?: number;
}

export const SkeletonTable = ({ columns = 19, rows = 10 }: SkeletonTableProps) => (
        <div className="w-full">
            {/* Table Container */}
            <div className="border">
                {/* Table Header */}
                <div className="bg-muted/50 border-b">
                    <div className="flex items-center px-4 py-3">
                        {Array.from({ length: columns }).map((_, index) => (
                            <div className="flex-1 px-2" key={index}>
                                <Skeleton className="h-4 w-full max-w-24" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Table Rows */}
                <div className="divide-y">
                    {Array.from({ length: rows }).map((_, rowIndex) => (
                        <div className="hover:bg-muted/50 flex items-center px-4 py-3" key={rowIndex}>
                            {Array.from({ length: columns }).map((_, colIndex) => (
                                <div className="flex-1 px-2" key={colIndex}>
                                    <Skeleton className="h-4 w-full max-w-20" />
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
);
