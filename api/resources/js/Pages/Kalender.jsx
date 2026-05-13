import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import { getWibYmd } from '@/lib/wibTime';
import { useCallback, useEffect, useMemo, useState } from 'react';

const WEEKDAY_LABELS = ['Sn', 'Sl', 'Rb', 'Km', 'Jm', 'Sb', 'Mg'];

function padMonthCells(year, month) {
    const first = new Date(year, month - 1, 1);
    const mondayBased = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month, 0).getDate();
    const cells = [];
    for (let i = 0; i < mondayBased; i++) {
        cells.push({ type: 'empty', key: `e-${i}` });
    }
    for (let d = 1; d <= daysInMonth; d++) {
        const ymd = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        cells.push({ type: 'day', key: ymd, day: d, ymd });
    }
    while (cells.length % 7 !== 0) {
        cells.push({ type: 'empty', key: `trail-${cells.length}` });
    }
    return cells;
}

function dayCellClass(level) {
    if (level === 'danger') {
        return 'bg-red-900/80 text-red-100';
    }
    if (level === 'warning') {
        return 'bg-amber-800/80 text-amber-100';
    }
    return 'bg-slate-800 text-white';
}

export default function Kalender() {
    const wibToday = getWibYmd();
    const [year, setYear] = useState(wibToday.year);
    const [month, setMonth] = useState(wibToday.month);
    const [dayLevels, setDayLevels] = useState({});
    const [loading, setLoading] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await axios.get(route('dashboard.kalender.data'), {
                params: { year, month },
            });
            setDayLevels(data.days ?? {});
        } catch {
            setDayLevels({});
        } finally {
            setLoading(false);
        }
    }, [year, month]);

    useEffect(() => {
        load();
    }, [load]);

    const cells = useMemo(() => padMonthCells(year, month), [year, month]);

    const title = new Intl.DateTimeFormat('id-ID', {
        month: 'short',
        year: 'numeric',
    }).format(new Date(year, month - 1, 1));

    const shiftMonth = (delta) => {
        const d = new Date(year, month - 1 + delta, 1);
        setYear(d.getFullYear());
        setMonth(d.getMonth() + 1);
    };

    return (
        <AuthenticatedLayout title="Kalender">
            <Head title="Kalender" />

            <div className="py-4 sm:py-6">
                <div className="mx-auto max-w-xl px-3 sm:px-4">
                    <div className="rounded-lg border border-slate-700 bg-slate-900 p-3 shadow-sm sm:p-4">
                        <div className="flex items-center justify-between gap-2 border-b border-slate-700 pb-2">
                            <h2
                                className="truncate text-sm font-semibold text-white"
                                title="Warna dari data sensor (tabel sensor_data) per hari: mayoritas AWAS = merah, SIAGA = kuning, AMAN = abu."
                            >
                                Kalender level
                            </h2>
                            <div className="flex shrink-0 items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => shiftMonth(-1)}
                                    className="rounded border border-slate-600 bg-slate-800 px-2 py-0.5 text-xs text-white hover:bg-slate-700"
                                >
                                    ‹
                                </button>
                                <span className="min-w-[6.5rem] text-center text-xs font-medium capitalize text-white">
                                    {title}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => shiftMonth(1)}
                                    className="rounded border border-slate-600 bg-slate-800 px-2 py-0.5 text-xs text-white hover:bg-slate-700"
                                >
                                    ›
                                </button>
                            </div>
                        </div>

                        {loading ? (
                            <p className="py-2 text-center text-[10px] text-slate-400">Memuat…</p>
                        ) : null}

                        <div className="mt-2 grid grid-cols-7 gap-px bg-slate-700 text-center text-xs font-medium text-slate-300">
                            {WEEKDAY_LABELS.map((l) => (
                                <div key={l} className="bg-slate-800 py-0.5">
                                    {l}
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 gap-px bg-slate-700">
                            {cells.map((c) => {
                                if (c.type === 'empty') {
                                    return <div key={c.key} className="h-10 bg-slate-900" />;
                                }
                                const level = dayLevels[c.ymd] ?? null;
                                return (
                                    <div
                                        key={c.key}
                                        title={
                                            level === 'danger'
                                                ? 'Dominan AWAS'
                                                : level === 'warning'
                                                  ? 'Dominan SIAGA'
                                                  : 'Dominan AMAN / tanpa data'
                                        }
                                        className={
                                            'flex h-10 items-center justify-center text-sm font-medium leading-none ' +
                                            dayCellClass(level)
                                        }
                                    >
                                        {c.day}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-0.5 text-xs text-white">
                            <span className="inline-flex items-center gap-1">
                                <span className="h-2 w-3 shrink-0 rounded-sm bg-red-700" />
                                AWAS
                            </span>
                            <span className="inline-flex items-center gap-1">
                                <span className="h-2 w-3 shrink-0 rounded-sm bg-amber-600" />
                                SIAGA
                            </span>
                            <span className="inline-flex items-center gap-1">
                                <span className="h-2 w-3 shrink-0 rounded-sm bg-slate-700 ring-1 ring-slate-500" />
                                AMAN
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
