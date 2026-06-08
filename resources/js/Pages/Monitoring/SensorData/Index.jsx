import PrimaryButton from '@/Components/PrimaryButton';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';

export default function Index({ sensorData, devices, filters }) {
    const { data, setData, get, processing } = useForm({
        device_id: filters.device_id || '',
        alert_level: filters.alert_level || '',
        date_from: filters.date_from || '',
        date_to: filters.date_to || '',
    });

    const applyFilters = (e) => {
        e.preventDefault();
        get(route('monitoring.sensor-data.index'), {
            preserveState: true,
            replace: true,
        });
    };

    const clearFilters = () => {
        router.get(route('monitoring.sensor-data.index'));
    };

    const removeRow = (id) => {
        if (confirm('Hapus baris data ini?')) {
            router.delete(route('monitoring.sensor-data.destroy', id));
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold text-white">Data sensor</h2>
            }
        >
            <Head title="Data sensor" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <form
                        onSubmit={applyFilters}
                        className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-700 bg-slate-900 p-4 shadow-sm"
                    >
                        <div>
                            <label className="block text-xs font-medium text-slate-300">
                                Perangkat
                            </label>
                            <select
                                className="mt-1 rounded-md border-slate-600 bg-slate-950 text-sm text-white shadow-sm focus:border-amber-500 focus:ring-amber-500"
                                value={data.device_id}
                                onChange={(e) => setData('device_id', e.target.value)}
                            >
                                <option value="">Semua</option>
                                {devices.map((d) => (
                                    <option key={d.device_id} value={d.device_id}>
                                        {d.name} ({d.device_id})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-300">
                                Level (DB)
                            </label>
                            <select
                                className="mt-1 rounded-md border-slate-600 bg-slate-950 text-sm text-white shadow-sm focus:border-amber-500 focus:ring-amber-500"
                                value={data.alert_level}
                                onChange={(e) => setData('alert_level', e.target.value)}
                            >
                                <option value="">Semua</option>
                                <option value="normal">NORMAL</option>
                                <option value="warning">SIAGA</option>
                                <option value="danger">AWAS</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-300">
                                Dari
                            </label>
                            <input
                                type="date"
                                className="mt-1 rounded-md border-slate-600 bg-slate-950 text-sm text-white shadow-sm focus:border-amber-500 focus:ring-amber-500"
                                value={data.date_from}
                                onChange={(e) => setData('date_from', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-300">
                                Sampai
                            </label>
                            <input
                                type="date"
                                className="mt-1 rounded-md border-slate-600 bg-slate-950 text-sm text-white shadow-sm focus:border-amber-500 focus:ring-amber-500"
                                value={data.date_to}
                                onChange={(e) => setData('date_to', e.target.value)}
                            />
                        </div>
                        <PrimaryButton type="submit" disabled={processing}>
                            Terapkan
                        </PrimaryButton>
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="rounded-md border border-slate-600 bg-slate-800 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-700"
                        >
                            Reset
                        </button>
                    </form>

                    <div className="overflow-hidden rounded-lg border border-slate-700 bg-slate-900 shadow-sm">
                        <table className="min-w-full divide-y divide-slate-700 text-sm">
                            <thead className="bg-slate-800/80">
                                <tr>
                                    <th className="px-4 py-3 text-left font-semibold text-slate-200">
                                        Device
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold text-slate-200">
                                        Air (cm)
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold text-slate-200">
                                        Hujan (opsional)
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold text-slate-200">
                                        Relay
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold text-slate-200">
                                        Level
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold text-slate-200">
                                        Waktu
                                    </th>
                                    <th className="px-4 py-3 text-right font-semibold text-slate-200">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {sensorData.data.map((row) => (
                                    <tr key={row.id} className="hover:bg-slate-800/50">
                                        <td className="px-4 py-3 font-mono text-white">
                                            {row.device_id}
                                        </td>
                                        <td className="px-4 py-3 text-white">{row.water_level}</td>
                                        <td className="px-4 py-3 text-white">{row.rainfall ?? '—'}</td>
                                        <td className="px-4 py-3 text-white">
                                            {row.relay_on === null || row.relay_on === undefined
                                                ? '—'
                                                : row.relay_on
                                                  ? 'ON'
                                                  : 'OFF'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={
                                                    'inline-flex rounded-full px-2 py-0.5 text-xs font-medium ' +
                                                    (row.alert_level === 'danger'
                                                        ? 'bg-red-500/20 text-red-200'
                                                        : row.alert_level === 'warning'
                                                          ? 'bg-amber-500/20 text-amber-200'
                                                          : 'bg-emerald-500/20 text-emerald-200')
                                                }
                                            >
                                                {row.alert_level === 'danger'
                                                    ? 'AWAS'
                                                    : row.alert_level === 'warning'
                                                      ? 'SIAGA'
                                                      : 'NORMAL'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-300">
                                            {row.created_at}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                type="button"
                                                onClick={() => removeRow(row.id)}
                                                className="text-sm font-medium text-red-400 hover:text-red-300"
                                            >
                                                Hapus
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {sensorData.links?.length > 3 ? (
                        <div className="flex flex-wrap gap-1">
                            {sensorData.links.map((l, i) => (
                                <Link
                                    key={i}
                                    href={l.url || '#'}
                                    className={
                                        'rounded px-3 py-1 text-sm ' +
                                        (l.active
                                            ? 'bg-amber-600 text-white'
                                            : 'bg-slate-800 text-white ring-1 ring-slate-600 hover:bg-slate-700') +
                                        (!l.url ? ' pointer-events-none opacity-50' : '')
                                    }
                                    dangerouslySetInnerHTML={{ __html: l.label }}
                                />
                            ))}
                        </div>
                    ) : null}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
