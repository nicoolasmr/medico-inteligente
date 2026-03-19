import { Skeleton } from "../ui/skeleton"

export function PatientTableSkeleton() {
    return (
        <div className="card border border-bg-border overflow-hidden">
            <div className="px-6 py-4 border-b border-bg-border bg-bg-surface/50">
                <Skeleton className="h-4 w-32" />
            </div>
            <div className="p-0">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="px-6 py-4 flex items-center gap-4 border-b border-bg-border last:border-0">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-[250px]" />
                            <Skeleton className="h-3 w-[150px]" />
                        </div>
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-8 w-8 rounded-sm" />
                    </div>
                ))}
            </div>
        </div>
    )
}
