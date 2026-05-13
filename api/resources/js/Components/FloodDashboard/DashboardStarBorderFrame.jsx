import StarBorderFrame from '@/Components/StarBorderFrame';

/**
 * Bingkai grid dashboard — preset StarBorder + radius layout grid.
 */
export default function DashboardStarBorderFrame({ children }) {
    return (
        <StarBorderFrame
            className="rounded-lg"
            innerClassName="rounded-[7px] bg-slate-950 ring-1 ring-inset ring-white/40"
        >
            {children}
        </StarBorderFrame>
    );
}
