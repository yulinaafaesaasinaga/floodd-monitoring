export default function StatCard({ label, value }) {
    return (
        <div className="overflow-hidden rounded-lg border border-slate-700 bg-slate-900 shadow-sm ring-1 ring-white/5">
            <div className="p-5">
                <p className="text-sm font-medium text-slate-400">{label}</p>
                <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
            </div>
        </div>
    );
}
