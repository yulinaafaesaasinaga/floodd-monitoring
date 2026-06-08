import { formatDateTimeWib } from '@/lib/wibTime';

export default function ActivityLogTable({ activityLog }) {
    const rows = activityLog ?? [];

    return (
        <div className="overflow-hidden border border-slate-700 bg-slate-900 shadow-sm sm:rounded-lg">
            <div className="border-b border-slate-700 px-6 py-4">
                <h3 className="text-lg font-medium text-white">Log aktivitas</h3>
                <p className="mt-1 text-sm text-slate-400">30 entri terakhir.</p>
            </div>
            <div className="overflow-x-auto">
                {rows.length === 0 ? (
                    <p className="p-6 text-sm text-slate-400">Belum ada log.</p>
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
                                    Aksi
                                </th>
                                <th className="px-6 py-3 font-medium text-slate-200">
                                    Detail
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700 bg-slate-900">
                            {rows.map((log) => (
                                <tr key={log.id}>
                                    <td className="whitespace-nowrap px-6 py-3 text-slate-300">
                                        {formatDateTimeWib(log.created_at, {
                                            dateStyle: 'short',
                                            timeStyle: 'medium',
                                        })}
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-3 font-mono text-white">
                                        {log.device_id ?? '—'}
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-3 text-white">
                                        {log.action}
                                    </td>
                                    <td className="px-6 py-3 text-slate-300">{log.detail}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
