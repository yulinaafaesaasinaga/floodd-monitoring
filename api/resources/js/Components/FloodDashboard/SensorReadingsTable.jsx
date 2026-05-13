import { formatDateTimeWib } from '@/lib/wibTime';

const alertClass = (level) => {
    switch (level) {
        case 'danger':
            return 'bg-red-500/20 text-red-200';
        case 'warning':
            return 'bg-amber-500/20 text-amber-200';
        default:
            return 'bg-emerald-500/20 text-emerald-200';
    }
};

export default function SensorReadingsTable({ latestData }) {
    const rows = latestData ?? [];

    return (
        <div className="overflow-hidden border border-slate-700 bg-slate-900 shadow-sm sm:rounded-lg">
            <div className="border-b border-slate-700 px-6 py-4">
                <h3 className="text-lg font-medium text-white">
                    Pembacaan sensor terbaru
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                    Maks. 100 entri terakhir (sumber sama dengan field{' '}
                    <code className="rounded bg-slate-800 px-1 text-slate-200">
                        latest_data
                    </code>{' '}
                    di API).
                </p>
            </div>
            <div className="overflow-x-auto">
                {rows.length === 0 ? (
                    <p className="p-6 text-sm text-slate-400">
                        Belum ada data. Pastikan perangkat mengirim ke{' '}
                        <code className="rounded bg-slate-800 px-1 text-slate-200">
                            POST /api/ingest
                        </code>{' '}
                        dengan header API key.
                    </p>
                ) : (
                    <table className="min-w-full divide-y divide-slate-700 text-left text-sm">
                        <thead className="bg-slate-800/80">
                            <tr>
                                <th className="px-6 py-3 font-medium text-slate-200">
                                    Waktu
                                </th>
                                <th className="px-6 py-3 font-medium text-slate-200">
                                    Device
                                </th>
                                <th className="px-6 py-3 font-medium text-slate-200">
                                    Air (cm)
                                </th>
                                <th className="px-6 py-3 font-medium text-slate-200">
                                    Hujan
                                </th>
                                <th className="px-6 py-3 font-medium text-slate-200">
                                    Alert
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700 bg-slate-900">
                            {rows.map((row) => (
                                <tr key={row.id}>
                                    <td className="whitespace-nowrap px-6 py-3 text-slate-300">
                                        {formatDateTimeWib(row.created_at, {
                                            dateStyle: 'short',
                                            timeStyle: 'medium',
                                        })}
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-3 font-mono text-white">
                                        {row.device_id}
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-3 text-white">
                                        {row.water_level}
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-3 text-white">
                                        {row.rainfall}
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-3">
                                        <span
                                            className={
                                                'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ' +
                                                alertClass(row.alert_level)
                                            }
                                        >
                                            {row.alert_level}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
