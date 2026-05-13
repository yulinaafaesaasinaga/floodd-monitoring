import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';

export default function Download() {
    const { devices, defaultDate } = usePage().props;
    const [date, setDate] = useState(defaultDate ?? '');
    const [deviceId, setDeviceId] = useState('');

    const excelHref = useMemo(() => {
        const params = new URLSearchParams();
        params.set('date', date || defaultDate);
        if (deviceId) {
            params.set('device_id', deviceId);
        }
        return `${route('dashboard.download.excel')}?${params.toString()}`;
    }, [date, deviceId, defaultDate]);

    return (
        <AuthenticatedLayout title="Download data">
            <Head title="Download" />

            <div className="py-10">
                <div className="mx-auto max-w-2xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <div className="rounded-lg border border-slate-700 bg-slate-900 p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-white">
                            Unduh ketinggian air (Excel)
                        </h2>

                        <div className="mt-6 space-y-4">
                            <div>
                                <label
                                    htmlFor="dl-date"
                                    className="block text-xs font-medium text-slate-300"
                                >
                                    Tanggal
                                </label>
                                <input
                                    id="dl-date"
                                    type="date"
                                    className="mt-1 w-full max-w-xs rounded-md border-slate-600 bg-slate-950 text-sm text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="dl-device"
                                    className="block text-xs font-medium text-slate-300"
                                >
                                    Perangkat (opsional)
                                </label>
                                <select
                                    id="dl-device"
                                    className="mt-1 w-full max-w-md rounded-md border-slate-600 bg-slate-950 text-sm text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    value={deviceId}
                                    onChange={(e) => setDeviceId(e.target.value)}
                                >
                                    <option value="">Semua perangkat</option>
                                    {(devices ?? []).map((d) => (
                                        <option key={d.device_id} value={d.device_id}>
                                            {d.device_id} — {d.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="mt-6 flex flex-wrap gap-3">
                            <a
                                href={excelHref}
                                className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                            >
                                Unduh data
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
