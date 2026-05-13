import PrimaryButton from '@/Components/PrimaryButton';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

export default function Index({ devices }) {
    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-xl font-semibold text-white">Perangkat</h2>
                    <Link href={route('monitoring.devices.create')}>
                        <PrimaryButton>Tambah perangkat</PrimaryButton>
                    </Link>
                </div>
            }
        >
            <Head title="Perangkat" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="overflow-hidden rounded-lg border border-slate-700 bg-slate-900 shadow-sm">
                        <table className="min-w-full divide-y divide-slate-700 text-sm">
                            <thead className="bg-slate-800/80">
                                <tr>
                                    <th className="px-4 py-3 text-left font-semibold text-slate-200">
                                        Device ID
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold text-slate-200">
                                        Nama
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold text-slate-200">
                                        Lokasi
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold text-slate-200">
                                        Status DB
                                    </th>
                                    <th className="px-4 py-3 text-right font-semibold text-slate-200">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {devices.data.map((d) => (
                                    <tr key={d.id} className="hover:bg-slate-800/50">
                                        <td className="px-4 py-3 font-mono text-white">
                                            {d.device_id}
                                        </td>
                                        <td className="px-4 py-3 text-white">{d.name}</td>
                                        <td className="px-4 py-3 text-slate-300">{d.location}</td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={
                                                    'inline-flex rounded-full px-2 py-0.5 text-xs font-medium ' +
                                                    (d.status === 'online'
                                                        ? 'bg-emerald-500/20 text-emerald-200'
                                                        : 'bg-red-500/20 text-red-200')
                                                }
                                            >
                                                {d.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <Link
                                                href={route('monitoring.devices.edit', d.id)}
                                                className="font-medium text-amber-300 hover:text-amber-200"
                                            >
                                                Edit
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {devices.links?.length > 3 ? (
                        <div className="mt-4 flex flex-wrap gap-1">
                            {devices.links.map((l, i) => (
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
