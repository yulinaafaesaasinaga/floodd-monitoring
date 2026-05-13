import { formatDateTimeWib } from '@/lib/wibTime';

const statusBadge = (status) => {
    const on = status === 'online';
    return (
        <span
            className={
                'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ' +
                (on
                    ? 'bg-emerald-500/20 text-emerald-200'
                    : 'bg-slate-600 text-slate-200')
            }
        >
            {status}
        </span>
    );
};

export default function DevicesTable({ devices }) {
    const rows = devices ?? [];

    return (
        <div className="overflow-hidden border border-slate-700 bg-slate-900 shadow-sm sm:rounded-lg">
            <div className="border-b border-slate-700 px-6 py-4">
                <h3 className="text-lg font-medium text-white">Perangkat</h3>
                <p className="mt-1 text-sm text-slate-400">
                    Status dihitung dari telemetry &amp; command (sama seperti API
                    dashboard).
                </p>
            </div>
            <div className="overflow-x-auto">
                {rows.length === 0 ? (
                    <p className="p-6 text-sm text-slate-400">Belum ada perangkat.</p>
                ) : (
                    <table className="min-w-full divide-y divide-slate-700 text-left text-sm">
                        <thead className="bg-slate-800/80">
                            <tr>
                                <th className="px-6 py-3 font-medium text-slate-200">
                                    ID
                                </th>
                                <th className="px-6 py-3 font-medium text-slate-200">
                                    Nama
                                </th>
                                <th className="px-6 py-3 font-medium text-slate-200">
                                    Lokasi
                                </th>
                                <th className="px-6 py-3 font-medium text-slate-200">
                                    Status
                                </th>
                                <th className="px-6 py-3 font-medium text-slate-200">
                                    Terakhir lihat
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700 bg-slate-900">
                            {rows.map((d) => (
                                <tr key={d.device_id}>
                                    <td className="whitespace-nowrap px-6 py-3 font-mono text-white">
                                        {d.device_id}
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-3 text-white">
                                        {d.name}
                                    </td>
                                    <td className="px-6 py-3 text-slate-300">
                                        {d.location}
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-3">
                                        {statusBadge(d.status)}
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-3 text-slate-300">
                                        {d.last_seen_at
                                            ? formatDateTimeWib(d.last_seen_at, {
                                                  dateStyle: 'short',
                                                  timeStyle: 'medium',
                                              })
                                            : '—'}
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
