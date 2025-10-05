const SkeletonCard = () => (
    <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 animate-pulse">
        <div className="h-6 bg-slate-700 rounded w-3/4 mb-3"></div>
        <div className="flex items-baseline gap-2">
            <div className="h-8 bg-slate-700 rounded w-1/4"></div>
            <div className="h-4 bg-slate-700 rounded w-1/2"></div>
        </div>
        <div className="h-4 bg-slate-700 rounded w-full mt-2"></div>
    </div>
);

const SkeletonChart = () => (
     <div className="bg-slate-800 p-4 rounded-lg animate-pulse">
        <div className="flex justify-between items-center mb-4">
            <div className="h-7 bg-slate-700 rounded w-1/3"></div>
            <div className="h-10 bg-slate-700 rounded w-1/4"></div>
        </div>
        <div className="h-[400px] bg-slate-700 rounded-md"></div>
    </div>
);

export const LoadingSkeleton = () => (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        {/* Skeleton Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-800/50 rounded-lg animate-pulse">
            <div className="h-8 bg-slate-700 rounded w-1/2"></div>
            <div className="h-10 bg-slate-700 rounded w-1/4"></div>
        </div>

        {/* Skeleton Filters */}
        <div className="bg-slate-800 p-4 rounded-lg animate-pulse">
            <div className="flex flex-wrap items-center gap-4">
                <div className="h-9 bg-slate-700 rounded w-32"></div>
                <div className="h-9 bg-slate-700 rounded w-36"></div>
                <div className="h-9 bg-slate-700 rounded w-28"></div>
            </div>
        </div>

        {/* Skeleton Scorecards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
        </div>

        {/* Skeleton Chart */}
        <SkeletonChart />
    </div>
);
