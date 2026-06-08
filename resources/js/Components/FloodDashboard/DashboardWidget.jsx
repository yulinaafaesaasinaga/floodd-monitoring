import MiniWaterChart from '@/Components/FloodDashboard/MiniWaterChart';
import RelayManualSlider from '@/Components/FloodDashboard/RelayManualSlider';
import { TH_NORMAL_MAX_CM, TH_SIAGA_MAX_CM } from '@/lib/dashboardWidgetDefaults';
import { formatDateTimeWib } from '@/lib/wibTime';
import axios from 'axios';
import { useMemo, useState } from 'react';

function avgWater(latestData) {
    const rows = latestData ?? [];
    if (!rows.length) {
        return null;
    }
    const sum = rows.reduce((a, r) => a + Number(r.water_level ?? 0), 0);
    return Math.round((sum / rows.length) * 10) / 10;
}

function maxWater(latestData) {
    const rows = latestData ?? [];
    if (!rows.length) {
        return null;
    }
    return Math.max(...rows.map((r) => Number(r.water_level ?? 0)));
}

function latestReadingForDevice(latestData, deviceId) {
    const rows = latestData ?? [];
    if (!deviceId) {
        return rows[0] ?? null;
    }
    return rows.find((r) => r.device_id === deviceId) ?? null;
}

/** Sesuai firmware: NORMAL ≤4 cm, SIAGA ≤8 cm, AWAS >8 cm */
function classifyFloodLevel(waterCm, normalMax, siagaMax) {
    const w = Number(waterCm ?? 0);
    if (w <= normalMax) {
        return { label: 'NORMAL', className: 'bg-emerald-500/25 text-emerald-100' };
    }
    if (w <= siagaMax) {
        return { label: 'SIAGA', className: 'bg-amber-500/25 text-amber-100' };
    }
    return { label: 'AWAS', className: 'bg-red-500/25 text-red-100' };
}

function thresholdNormal(widget) {
    return Number(
        widget.thNormalMax ?? widget.thAmanMax ?? TH_NORMAL_MAX_CM,
    );
}

function thresholdSiaga(widget) {
    return Number(widget.thSiagaMax ?? TH_SIAGA_MAX_CM);
}

function alertLevelLabel(level) {
    switch (level) {
        case 'danger':
            return 'AWAS';
        case 'warning':
            return 'SIAGA';
        default:
            return 'NORMAL';
    }
}

function commandButtonLabel(cmd) {
    const map = {
        pump_on: 'Pompa ON',
        pump_off: 'Pompa OFF',
        start: 'Start',
        stop: 'Stop',
        alert: 'Alert',
        reset: 'Reset',
    };
    return map[cmd] ?? cmd;
}

function inferRelayFromRow(r) {
    return r.alert_level === 'danger' ? 'ON' : 'OFF';
}

export default function DashboardWidget({
    widget,
    dash,
    locked,
    onRemove,
    onCommandSent,
}) {
    const [busy, setBusy] = useState(null);
    const [manualRelayMsg, setManualRelayMsg] = useState(null);
    const stats = dash.stats ?? {};
    const iot = dash.iot_connectivity ?? {};

    const chartReadings = useMemo(() => {
        const pts = Number(widget.chartPoints ?? 60);
        if (widget.device_id && dash.chart_readings_by_device?.[widget.device_id]) {
            return (dash.chart_readings_by_device[widget.device_id] ?? []).slice(-pts);
        }
        return (dash.chart_readings ?? []).slice(-pts);
    }, [dash, widget.chartPoints, widget.device_id]);

    const historyRows = useMemo(() => {
        let rows = [...(dash.latest_data ?? [])];
        if (widget.device_id) {
            rows = rows.filter((r) => r.device_id === widget.device_id);
        }
        return rows.slice(0, 40);
    }, [dash.latest_data, widget.device_id]);

    const sendCmd = async (cmd) => {
        if (!widget.device_id) {
            return;
        }
        setBusy(cmd);
        try {
            await axios.post(route('dashboard.commands.send'), {
                device_id: widget.device_id,
                command: cmd,
            });
            onCommandSent?.();
        } finally {
            setBusy(null);
        }
    };

    const sendManualRelay = async (cmd) => {
        if (!widget.device_id) {
            return false;
        }
        setBusy(cmd);
        setManualRelayMsg(null);
        try {
            await axios.post(route('dashboard.commands.send'), {
                device_id: widget.device_id,
                command: cmd,
            });
            setManualRelayMsg({ kind: 'ok', text: 'Perintah dimasukkan ke antrian.' });
            onCommandSent?.();
            return true;
        } catch (err) {
            const msg =
                err.response?.data?.message ??
                err.response?.data?.errors?.device_id?.[0] ??
                'Gagal mengirim perintah.';
            setManualRelayMsg({
                kind: 'err',
                text: typeof msg === 'string' ? msg : 'Gagal mengirim perintah.',
            });
            return false;
        } finally {
            setBusy(null);
        }
    };

    const body = () => {
        switch (widget.type) {
            case 'iot_live': {
                const live = Boolean(iot.live);
                const last = iot.last_ingest_at;
                return (
                    <div className="text-sm">
                        <p
                            className={
                                'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ' +
                                (live
                                    ? 'bg-emerald-500/25 text-emerald-100'
                                    : 'bg-amber-500/25 text-amber-100')
                            }
                        >
                            <span
                                className={
                                    'h-2 w-2 rounded-full ' +
                                    (live ? 'animate-pulse bg-emerald-500' : 'bg-amber-500')
                                }
                            />
                            {live ? 'DATA HIDUP DARI PERANGKAT' : 'MENUNGGU DATA SENSOR'}
                        </p>
                        <p className="mt-2 text-xs text-slate-300">
                            Ingest terakhir:{' '}
                            {last
                                ? formatDateTimeWib(last, {
                                      dateStyle: 'short',
                                      timeStyle: 'medium',
                                  })
                                : 'belum pernah'}
                            {typeof iot.readings_last_hour === 'number' ? (
                                <>
                                    {' '}
                                    · {iot.readings_last_hour} pembacaan / jam
                                </>
                            ) : null}
                        </p>
                    </div>
                );
            }
            case 'ultrasonic_now': {
                const row = latestReadingForDevice(
                    dash.latest_data,
                    widget.device_id,
                );
                const cm = row?.water_level ?? null;
                const nMax = thresholdNormal(widget);
                const sMax = thresholdSiaga(widget);
                const lv =
                    cm === null
                        ? null
                        : classifyFloodLevel(cm, nMax, sMax);
                return (
                    <div>
                        <p className="text-3xl font-bold tabular-nums text-white">
                            {cm === null ? '—' : `${Number(cm).toFixed(1)}`}
                            <span className="text-lg font-normal text-slate-400">
                                {' '}
                                {widget.unit || 'cm'}
                            </span>
                        </p>
                        {lv ? (
                            <div
                                className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-bold ${lv.className}`}
                            >
                                {lv.label}
                            </div>
                        ) : (
                            <p className="mt-2 text-xs text-slate-400">Belum ada pembacaan.</p>
                        )}
                        {row ? (
                            <p className="mt-1 text-xs text-slate-400">
                                {row.device_id} · ultrasonik (tinggi air)
                            </p>
                        ) : null}
                    </div>
                );
            }
            case 'relay_pump': {
                const row = latestReadingForDevice(
                    dash.latest_data,
                    widget.device_id,
                );
                let relayOn = row?.relay_on;
                if (relayOn === null || relayOn === undefined) {
                    relayOn = row?.alert_level === 'danger';
                }
                const on = Boolean(relayOn);
                return (
                    <div className="text-sm">
                        <p className="mb-2 rounded-md bg-slate-800 px-2 py-1 text-xs text-slate-200">
                            <span className="font-semibold text-white">Otomatis</span>
                        </p>
                        <div className="flex flex-wrap items-center gap-3">
                            <div>
                                <p className="text-xs font-medium text-slate-400">Relay (aktif LOW)</p>
                                <p
                                    className={
                                        'mt-1 text-lg font-bold ' +
                                        (on ? 'text-red-600' : 'text-slate-300')
                                    }
                                >
                                    {on ? 'ON (pompa jalan)' : 'OFF'}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-slate-400">Level server</p>
                                <p className="mt-1 text-lg font-bold text-white">
                                    {row ? alertLevelLabel(row.alert_level) : '—'}
                                </p>
                            </div>
                        </div>
                        {row ? (
                            <p className="mt-2 text-xs text-slate-400">
                                {row.device_id} ·{' '}
                                {formatDateTimeWib(row.created_at, {
                                    dateStyle: 'short',
                                    timeStyle: 'medium',
                                })}
                            </p>
                        ) : (
                            <p className="mt-2 text-xs text-slate-400">Belum ada telemetri.</p>
                        )}
                    </div>
                );
            }
            case 'relay_manual': {
                const onCmd = widget.commandOn || 'pump_on';

                return (
                    <div className="space-y-1.5 text-sm">
                        <p className="rounded-md border border-indigo-800/40 bg-indigo-950/60 px-2 py-1.5 text-xs text-indigo-100">
                            <span className="font-semibold">Manual</span> 
                        </p>
                        {!widget.device_id ? (
                            <p className="text-xs font-medium text-amber-200">
                                Pilih perangkat saat menambah widget (hapus lalu tambah lagi bila
                                perlu).
                            </p>
                        ) : (
                            <p className="text-xs text-slate-300">
                                Perangkat:{' '}
                                <span className="font-mono font-medium">{widget.device_id}</span>
                            </p>
                        )}
                        <RelayManualSlider
                            key={widget.id}
                            deviceId={widget.device_id}
                            commandOn={onCmd}
                            sendRelay={sendManualRelay}
                            busy={busy}
                        />
                        {manualRelayMsg ? (
                            <p
                                className={
                                    'text-xs ' +
                                    (manualRelayMsg.kind === 'ok'
                                        ? 'text-emerald-300'
                                        : 'text-red-300')
                                }
                            >
                                {manualRelayMsg.text}
                            </p>
                        ) : null}
                    </div>
                );
            }
            case 'stat_alerts':
                return (
                    <div className="flex gap-6 text-sm">
                        <div>
                            <p className="text-xs text-amber-200">SIAGA (1 jam)</p>
                            <p className="text-2xl font-bold text-amber-100">
                                {stats.warning_siaga_last_hour ?? 0}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-red-200">AWAS (1 jam)</p>
                            <p className="text-2xl font-bold text-red-100">
                                {stats.danger_awas_last_hour ?? 0}
                            </p>
                        </div>
                    </div>
                );
            case 'stat_online': {
                const total = dash.devices?.length ?? 0;
                const on =
                    dash.devices?.filter((d) => d.status === 'online').length ?? 0;
                return (
                    <p className="text-3xl font-bold text-white">
                        {on}
                        <span className="text-lg font-normal text-slate-400"> / {total}</span>
                    </p>
                );
            }
            case 'stat_avg': {
                const v = avgWater(dash.latest_data);
                return (
                    <p className="text-3xl font-bold text-white">
                        {v === null ? '—' : `${v} ${widget.unit || 'cm'}`}
                    </p>
                );
            }
            case 'stat_max': {
                const v = maxWater(dash.latest_data);
                return (
                    <p className="text-3xl font-bold text-white">
                        {v === null ? '—' : `${v} ${widget.unit || 'cm'}`}
                    </p>
                );
            }
            case 'stat_total':
                return (
                    <p className="text-3xl font-bold text-white">
                        {stats.sensor_readings_total ?? 0}
                    </p>
                );
            case 'chart_device':
                return (
                    <MiniWaterChart
                        readings={chartReadings}
                        color={widget.chartColor}
                        heightClass="h-48"
                    />
                );
            case 'device_status': {
                const devs = widget.device_id
                    ? (dash.devices ?? []).filter((d) => d.device_id === widget.device_id)
                    : dash.devices ?? [];
                return (
                    <div className="max-h-52 overflow-auto text-xs">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b text-slate-400">
                                    <th className="py-1 pr-2">ID</th>
                                    <th className="py-1 pr-2">Nama</th>
                                    <th className="py-1 pr-2">Terakhir</th>
                                    <th className="py-1">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {devs.map((d) => (
                                    <tr key={d.device_id} className="border-b border-slate-700">
                                        <td className="py-1 pr-2 font-mono">{d.device_id}</td>
                                        <td className="py-1 pr-2">{d.name}</td>
                                        <td className="py-1 pr-2 whitespace-nowrap text-slate-300">
                                            {d.last_seen_at
                                                ? formatDateTimeWib(d.last_seen_at, {
                                                      timeStyle: 'short',
                                                      dateStyle: 'short',
                                                  })
                                                : '—'}
                                        </td>
                                        <td className="py-1">{d.status}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
            }
            case 'water_history':
                return (
                    <div className="max-h-52 overflow-auto text-xs">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b text-slate-400">
                                    <th className="py-1 pr-2">Waktu</th>
                                    <th className="py-1 pr-2">cm</th>
                                    <th className="py-1 pr-2">Level</th>
                                    <th className="py-1">Relay</th>
                                </tr>
                            </thead>
                            <tbody>
                                {historyRows.map((r) => (
                                    <tr key={r.id} className="border-b border-slate-700">
                                        <td className="py-1 pr-2 whitespace-nowrap">
                                            {formatDateTimeWib(r.created_at, {
                                                dateStyle: 'short',
                                                timeStyle: 'short',
                                            })}
                                        </td>
                                        <td className="py-1 pr-2">{r.water_level}</td>
                                        <td className="py-1 pr-2">
                                            {alertLevelLabel(r.alert_level)}
                                        </td>
                                        <td className="py-1">
                                            {r.relay_on === null || r.relay_on === undefined
                                                ? inferRelayFromRow(r)
                                                : r.relay_on
                                                  ? 'ON'
                                                  : 'OFF'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
            case 'command_history':
                return (
                    <div className="max-h-52 overflow-auto text-xs">
                        {(dash.commands ?? []).slice(0, 12).map((c) => (
                            <div
                                key={c.id}
                                className="flex justify-between border-b border-slate-700 py-1"
                            >
                                <span className="font-mono text-slate-200">{c.device_id}</span>
                                <span>{c.command}</span>
                                <span className="text-slate-400">{c.status}</span>
                            </div>
                        ))}
                    </div>
                );
            case 'worker_status':
                return (
                    <p className="text-xs text-slate-400">
                        Widget ini sudah tidak dipakai — reset layout atau hapus widget.
                    </p>
                );
            case 'activity_log':
                return (
                    <div className="max-h-52 overflow-auto text-xs">
                        {(dash.activity_log ?? []).slice(0, 15).map((log) => (
                            <div
                                key={log.id}
                                className="border-b border-slate-700 py-1 text-slate-200"
                            >
                                <span className="font-medium">{log.action}</span>{' '}
                                <span className="text-slate-400">{log.detail}</span>
                            </div>
                        ))}
                    </div>
                );
            case 'level': {
                const row = latestReadingForDevice(
                    dash.latest_data,
                    widget.device_id,
                );
                const water = row?.water_level ?? 0;
                const nMax = thresholdNormal(widget);
                const sMax = thresholdSiaga(widget);
                const lv = classifyFloodLevel(water, nMax, sMax);
                return (
                    <div>
                        <div
                            className={`inline-block rounded-full px-3 py-1 text-sm font-bold ${lv.className}`}
                        >
                            {lv.label}
                        </div>
                        <p className="mt-2 text-2xl font-semibold text-white">
                            {water} {widget.unit || 'cm'}
                        </p>
                        <p className="text-xs text-slate-400">
                            Ambang: NORMAL ≤ {nMax} cm · SIAGA ≤ {sMax} cm
                        </p>
                        {row ? (
                            <p className="mt-1 text-xs text-slate-400">
                                {row.device_id} ·{' '}
                                {formatDateTimeWib(row.created_at, {
                                    dateStyle: 'short',
                                    timeStyle: 'medium',
                                })}
                            </p>
                        ) : null}
                    </div>
                );
            }
            case 'control_panel': {
                const on = widget.commandOn || 'pump_on';
                const off = widget.commandOff || 'pump_off';
                const al = widget.commandAlert || 'alert';
                const rs = widget.commandReset || 'reset';
                return (
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            disabled={!widget.device_id || busy}
                            onClick={() => sendCmd(on)}
                            className="rounded bg-emerald-600 px-2 py-1 text-xs font-medium text-white disabled:opacity-40"
                        >
                            {busy === on ? '…' : commandButtonLabel(on)}
                        </button>
                        <button
                            type="button"
                            disabled={!widget.device_id || busy}
                            onClick={() => sendCmd(off)}
                            className="rounded bg-slate-600 px-2 py-1 text-xs font-medium text-white disabled:opacity-40"
                        >
                            {busy === off ? '…' : commandButtonLabel(off)}
                        </button>
                        <button
                            type="button"
                            disabled={!widget.device_id || busy}
                            onClick={() => sendCmd(al)}
                            className="rounded bg-amber-500 px-2 py-1 text-xs font-medium text-white disabled:opacity-40"
                        >
                            {busy === al ? '…' : commandButtonLabel(al)}
                        </button>
                        <button
                            type="button"
                            disabled={!widget.device_id || busy}
                            onClick={() => sendCmd(rs)}
                            className="rounded bg-red-600 px-2 py-1 text-xs font-medium text-white disabled:opacity-40"
                        >
                            {busy === rs ? '…' : commandButtonLabel(rs)}
                        </button>
                        {!widget.device_id ? (
                            <p className="w-full text-xs text-amber-200">
                                Pilih perangkat saat menambah widget agar perintah dikirim ke ESP32
                                yang benar.
                            </p>
                        ) : null}
                    </div>
                );
            }
            default:
                return (
                    <p className="text-sm text-slate-400">Tipe tidak dikenal: {widget.type}</p>
                );
        }
    };

    return (
        <div className="flex h-full flex-col rounded-lg border border-slate-700 bg-slate-900 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-700 bg-slate-800/90 px-2 py-1">
                <span className="truncate text-xs font-semibold text-white">
                    {widget.title}
                </span>
                {!locked && onRemove ? (
                    <button
                        type="button"
                        onClick={() => onRemove(widget.id)}
                        className="rounded px-1.5 text-xs text-red-400 hover:bg-red-950/50"
                        title="Hapus widget"
                    >
                        ×
                    </button>
                ) : null}
            </div>
            <div className="flex h-full min-h-0 flex-1 flex-col overflow-auto p-2">
                {body()}
            </div>
        </div>
    );
}
