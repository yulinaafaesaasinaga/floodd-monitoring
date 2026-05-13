import PrimaryButton from '@/Components/PrimaryButton';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';

const commandOptions = [
    { value: 'start', label: 'Start monitoring' },
    { value: 'stop', label: 'Stop monitoring' },
    { value: 'alert', label: 'Aktifkan alert' },
    { value: 'reset', label: 'Reset sensor' },
    { value: 'reboot', label: 'Reboot device' },
];

export default function Index({ commands, devices }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        device_id: '',
        command: 'start',
    });

    const send = (e) => {
        e.preventDefault();
        post(route('monitoring.commands.store'), {
            preserveScroll: true,
            onSuccess: () => reset(),
        });
    };

    const markDone = (id) => {
        router.post(route('monitoring.commands.executed', id));
    };

    const remove = (id) => {
        if (confirm('Hapus command ini?')) {
            router.delete(route('monitoring.commands.destroy', id));
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold text-white">Command</h2>
            }
        >
            <Head title="Command" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <form
                        onSubmit={send}
                        className="grid gap-4 rounded-lg border border-slate-700 bg-slate-900 p-4 shadow-sm sm:grid-cols-3"
                    >
                        <div>
                            <label className="block text-xs font-medium text-slate-300">
                                Perangkat
                            </label>
                            <select
                                className="mt-1 w-full rounded-md border-slate-600 bg-slate-950 text-sm text-white shadow-sm focus:border-amber-500 focus:ring-amber-500"
                                value={data.device_id}
                                onChange={(e) => setData('device_id', e.target.value)}
                                required
                            >
                                <option value="">Pilih…</option>
                                {devices.map((d) => (
                                    <option key={d.device_id} value={d.device_id}>
                                        {d.name} ({d.device_id})
                                    </option>
                                ))}
                            </select>
                            {errors.device_id ? (
                                <p className="mt-1 text-sm text-red-400">{errors.device_id}</p>
                            ) : null}
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-300">
                                Perintah
                            </label>
                            <select
                                className="mt-1 w-full rounded-md border-slate-600 bg-slate-950 text-sm text-white shadow-sm focus:border-amber-500 focus:ring-amber-500"
                                value={data.command}
                                onChange={(e) => setData('command', e.target.value)}
                            >
                                {commandOptions.map((o) => (
                                    <option key={o.value} value={o.value}>
                                        {o.label}
                                    </option>
                                ))}
                            </select>
                            {errors.command ? (
                                <p className="mt-1 text-sm text-red-400">{errors.command}</p>
                            ) : null}
                        </div>
                        <div className="flex items-end">
                            <PrimaryButton type="submit" disabled={processing} className="w-full sm:w-auto">
                                Kirim command
                            </PrimaryButton>
                        </div>
                    </form>

                    <div className="overflow-hidden rounded-lg border border-slate-700 bg-slate-900 shadow-sm">
                        <table className="min-w-full divide-y divide-slate-700 text-sm">
                            <thead className="bg-slate-800/80">
                                <tr>
                                    <th className="px-4 py-3 text-left font-semibold text-slate-200">
                                        Device
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold text-slate-200">
                                        Command
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold text-slate-200">
                                        Status
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
                                {commands.data.map((c) => (
                                    <tr key={c.id} className="hover:bg-slate-800/50">
                                        <td className="px-4 py-3 font-mono text-white">
                                            {c.device_id}
                                        </td>
                                        <td className="px-4 py-3 text-white">{c.command}</td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={
                                                    'inline-flex rounded-full px-2 py-0.5 text-xs font-medium ' +
                                                    (c.status === 'executed'
                                                        ? 'bg-emerald-500/20 text-emerald-200'
                                                        : 'bg-amber-500/20 text-amber-200')
                                                }
                                            >
                                                {c.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-300">{c.created_at}</td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex flex-wrap justify-end gap-2">
                                                {c.status === 'pending' ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => markDone(c.id)}
                                                        className="text-sm font-medium text-emerald-300 hover:text-emerald-200"
                                                    >
                                                        Executed
                                                    </button>
                                                ) : null}
                                                <button
                                                    type="button"
                                                    onClick={() => remove(c.id)}
                                                    className="text-sm font-medium text-red-400 hover:text-red-300"
                                                >
                                                    Hapus
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {commands.links?.length > 3 ? (
                        <div className="flex flex-wrap gap-1">
                            {commands.links.map((l, i) => (
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
