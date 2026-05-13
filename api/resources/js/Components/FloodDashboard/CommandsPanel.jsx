import axios from 'axios';
import { useMemo, useState } from 'react';

import { formatDateTimeWib } from '@/lib/wibTime';

export default function CommandsPanel({ commands, devices, onSent }) {
    const [deviceId, setDeviceId] = useState('');
    const [command, setCommand] = useState('start');
    const [sending, setSending] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    const rows = commands ?? [];
    const deviceOptions = useMemo(() => devices ?? [], [devices]);

    const send = async (e) => {
        e.preventDefault();
        setMessage(null);
        setError(null);
        if (!deviceId) {
            setError('Pilih perangkat.');
            return;
        }
        setSending(true);
        try {
            await axios.post(route('dashboard.commands.send'), {
                device_id: deviceId,
                command,
            });
            setMessage('Perintah dimasukkan antrian.');
            onSent?.();
        } catch (err) {
            const msg =
                err.response?.data?.message ??
                err.response?.data?.errors?.device_id?.[0] ??
                'Gagal mengirim perintah.';
            setError(typeof msg === 'string' ? msg : 'Gagal mengirim perintah.');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="overflow-hidden border border-slate-700 bg-slate-900 shadow-sm sm:rounded-lg">
            <div className="border-b border-slate-700 px-6 py-4">
                <h3 className="text-lg font-medium text-white">Command</h3>
                <p className="mt-1 text-sm text-slate-400">
                    Kirim perintah ke device (endpoint web, sesi login + CSRF).
                </p>
            </div>

            <form
                onSubmit={send}
                className="flex flex-col gap-3 border-b border-slate-700 bg-slate-800/50 px-6 py-4 sm:flex-row sm:items-end"
            >
                <div className="min-w-0 flex-1">
                    <label className="block text-xs font-medium text-slate-300">
                        Perangkat
                    </label>
                    <select
                        className="mt-1 block w-full rounded-md border-slate-600 bg-slate-950 text-sm text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        value={deviceId}
                        onChange={(e) => setDeviceId(e.target.value)}
                    >
                        <option value="">— pilih —</option>
                        {deviceOptions.map((d) => (
                            <option key={d.device_id} value={d.device_id}>
                                {d.device_id} — {d.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-300">
                        Perintah
                    </label>
                    <select
                        className="mt-1 block w-full rounded-md border-slate-600 bg-slate-950 text-sm text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        value={command}
                        onChange={(e) => setCommand(e.target.value)}
                    >
                        <option value="start">start</option>
                        <option value="stop">stop</option>
                        <option value="alert">alert</option>
                        <option value="reset">reset</option>
                        <option value="reboot">reboot</option>
                    </select>
                </div>
                <button
                    type="submit"
                    disabled={sending}
                    className="inline-flex justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
                >
                    {sending ? 'Mengirim…' : 'Kirim'}
                </button>
            </form>

            {message && (
                <p className="border-b border-emerald-800 bg-emerald-950/60 px-6 py-2 text-sm text-emerald-100">
                    {message}
                </p>
            )}
            {error && (
                <p className="border-b border-red-800 bg-red-950/60 px-6 py-2 text-sm text-red-200">
                    {error}
                </p>
            )}

            <div className="overflow-x-auto">
                {rows.length === 0 ? (
                    <p className="p-6 text-sm text-slate-400">Belum ada command.</p>
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
                                    Perintah
                                </th>
                                <th className="px-6 py-3 font-medium text-slate-200">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700 bg-slate-900">
                            {rows.map((c) => (
                                <tr key={c.id}>
                                    <td className="whitespace-nowrap px-6 py-3 text-slate-300">
                                        {formatDateTimeWib(c.created_at, {
                                            dateStyle: 'short',
                                            timeStyle: 'medium',
                                        })}
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-3 font-mono text-white">
                                        {c.device_id}
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-3 text-white">
                                        {c.command}
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-3 text-slate-300">
                                        {c.status}
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
