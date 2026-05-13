import DashboardStarBorderFrame from '@/Components/FloodDashboard/DashboardStarBorderFrame';
import DashboardWidget from '@/Components/FloodDashboard/DashboardWidget';
import {
    WIDGET_TYPE_OPTIONS_RINGKASAN,
    createRiwayatStarterLayout,
    createStarterLayout,
    createWidget,
    normalizeLayout,
} from '@/lib/dashboardWidgetDefaults';
import axios from 'axios';
import { GridStack } from 'gridstack';
import 'gridstack/dist/gridstack.min.css';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

export default function DashboardGridLayout({
    userLayout,
    layoutLocked,
    dash,
    onCommandSent,
    layoutName = 'default',
    widgetTypeOptions: widgetTypeOptionsProp,
}) {
    const widgetTypeOptions = widgetTypeOptionsProp ?? WIDGET_TYPE_OPTIONS_RINGKASAN;
    const [widgets, setWidgets] = useState(() => normalizeLayout(userLayout, layoutName));
    const [locked, setLocked] = useState(() => Boolean(layoutLocked));
    const [saveHint, setSaveHint] = useState('Layout siap.');
    const [modalOpen, setModalOpen] = useState(false);
    const [draftType, setDraftType] = useState(
        () => widgetTypeOptions[0]?.value ?? 'iot_live',
    );
    const [draftTitle, setDraftTitle] = useState('Widget baru');
    const [draftDevice, setDraftDevice] = useState('');
    const [draftThAman, setDraftThAman] = useState(4);
    const [draftThSiaga, setDraftThSiaga] = useState(8);
    const [clearingHistory, setClearingHistory] = useState(false);

    const containerRef = useRef(null);
    const gridRef = useRef(null);
    const saveTimerRef = useRef(null);
    const gridInitedRef = useRef(false);
    const widgetsRef = useRef(widgets);
    const lockedRef = useRef(locked);
    const layoutNameRef = useRef(layoutName);
    const getLayoutSnapshotRef = useRef(() => widgetsRef.current);
    widgetsRef.current = widgets;
    lockedRef.current = locked;
    layoutNameRef.current = layoutName;

    /**
     * Jangan sinkron ulang dari props setiap render: `refresh()` / Echo memicu re-render
     * Inertia, sementara `userLayout` di props tidak ikut ter-update — stringify lama bisa
     * memicu `setWidgets` dan menimpa posisi GridStack yang baru saja diseret.
     * Layout awal cukup dari useState; simpanan ke DB lewat scheduleSave.
     */
    /** Gabungkan metadata widget (state) dengan posisi terkini dari GridStack — sumber posisi yang benar adalah engine. */
    const getLayoutSnapshot = useCallback(() => {
        const g = gridRef.current;
        const base = widgetsRef.current;
        if (!g) {
            return base;
        }
        const pos = {};
        g.getGridItems().forEach((el) => {
            const n = el.gridstackNode;
            if (n?.id) {
                pos[String(n.id)] = {
                    x: n.x,
                    y: n.y,
                    w: n.w,
                    h: n.h,
                };
            }
        });
        return base.map((w) => ({ ...w, ...(pos[w.id] || {}) }));
    }, []);

    getLayoutSnapshotRef.current = getLayoutSnapshot;

    const scheduleSave = useCallback(() => {
        if (saveTimerRef.current) {
            clearTimeout(saveTimerRef.current);
        }
        saveTimerRef.current = setTimeout(() => {
            const layout = getLayoutSnapshot();
            axios
                .post(route('dashboard.user-layout.store'), {
                    layout,
                    layout_locked: lockedRef.current,
                    layout_name: layoutName,
                })
                .then(() => setSaveHint('Layout tersimpan.'))
                .catch(() => setSaveHint('Gagal menyimpan layout.'));
        }, 400);
    }, [getLayoutSnapshot, layoutName]);

    const handleGridChangeRef = useRef(() => {});

    handleGridChangeRef.current = () => {
        const g = gridRef.current;
        if (!g || g.isIgnoreChangeCB()) {
            return;
        }
        const pos = {};
        g.getGridItems().forEach((el) => {
            const n = el.gridstackNode;
            if (n?.id) {
                pos[String(n.id)] = {
                    x: n.x,
                    y: n.y,
                    w: n.w,
                    h: n.h,
                };
            }
        });
        setWidgets((prev) => {
            const next = prev.map((w) => ({ ...w, ...(pos[w.id] || {}) }));
            const unchanged =
                prev.length === next.length &&
                next.every((w) => {
                    const p = prev.find((x) => x.id === w.id);
                    return (
                        p &&
                        p.x === w.x &&
                        p.y === w.y &&
                        p.w === w.w &&
                        p.h === w.h
                    );
                });
            if (unchanged) {
                return prev;
            }
            widgetsRef.current = next;
            scheduleSave();
            setSaveHint('Menyimpan…');
            return next;
        });
    };

    useLayoutEffect(() => {
        const host = containerRef.current;
        if (!host || gridInitedRef.current) {
            return;
        }
        const g = GridStack.init(
            {
                column: 12,
                cellHeight: 72,
                float: true,
                margin: 4,
                minRow: 1,
            },
            host,
        );
        gridRef.current = g;
        gridInitedRef.current = true;
        /** Hanya setelah drag/resize selesai — `change` saat drag masih jalan bisa memicu React + g.update() dan mengembalikan item ke posisi lama. */
        const persistLayout = () => handleGridChangeRef.current();
        g.on('dragstop', persistLayout);
        g.on('resizestop', persistLayout);

        let resizeRaf = null;
        const scheduleResize = () => {
            if (resizeRaf != null) {
                return;
            }
            resizeRaf = requestAnimationFrame(() => {
                resizeRaf = null;
                g.onResize?.();
            });
        };
        const ro = new ResizeObserver(scheduleResize);
        ro.observe(host);
        window.addEventListener('resize', scheduleResize);
        scheduleResize();

        const flushPendingSave = () => {
            if (!saveTimerRef.current) {
                return;
            }
            clearTimeout(saveTimerRef.current);
            saveTimerRef.current = null;
            const layout = getLayoutSnapshotRef.current();
            const body = JSON.stringify({
                layout,
                layout_locked: lockedRef.current,
                layout_name: layoutNameRef.current,
            });
            const xsrf = document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1];
            fetch(route('dashboard.user-layout.store'), {
                method: 'POST',
                credentials: 'same-origin',
                keepalive: true,
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    ...(xsrf ? { 'X-XSRF-TOKEN': decodeURIComponent(xsrf) } : {}),
                },
                body,
            }).catch(() => {});
        };
        window.addEventListener('pagehide', flushPendingSave);

        return () => {
            if (resizeRaf != null) {
                cancelAnimationFrame(resizeRaf);
                resizeRaf = null;
            }
            ro.disconnect();
            window.removeEventListener('resize', scheduleResize);
            window.removeEventListener('pagehide', flushPendingSave);
            g.off('dragstop');
            g.off('resizestop');
            g.destroy(true);
            gridRef.current = null;
            gridInitedRef.current = false;
        };
    }, []);

    useEffect(() => {
        gridRef.current?.setStatic?.(locked);
    }, [locked]);

    useLayoutEffect(() => {
        const g = gridRef.current;
        if (!g || !gridInitedRef.current) {
            return;
        }
        g.batchUpdate(true);
        widgets.forEach((w) => {
            const el = document.getElementById(w.id);
            if (!el) {
                return;
            }
            if (!el.gridstackNode) {
                g.makeWidget(el, {
                    id: w.id,
                    x: w.x,
                    y: w.y,
                    w: w.w,
                    h: w.h,
                    minW: 2,
                    minH: 2,
                });
            } else {
                const n = el.gridstackNode;
                const idMissing = !n.id || String(n.id) !== String(w.id);
                if (
                    !idMissing &&
                    n.x === w.x &&
                    n.y === w.y &&
                    n.w === w.w &&
                    n.h === w.h
                ) {
                    return;
                }
                g.update(el, {
                    id: w.id,
                    x: w.x,
                    y: w.y,
                    w: w.w,
                    h: w.h,
                });
            }
        });
        const keep = new Set(widgets.map((w) => w.id));
        g.getGridItems().forEach((el) => {
            const id = el.gridstackNode?.id;
            if (id && !keep.has(String(id))) {
                g.removeWidget(el, false, true);
            }
        });
        g.batchUpdate(false);
    }, [widgets]);

    const removeWidget = (id) => {
        const g = gridRef.current;
        const el = document.getElementById(id);
        if (g && el) {
            g.removeWidget(el, false, true);
        }
        setWidgets((prev) => {
            const next = prev.filter((w) => w.id !== id);
            widgetsRef.current = next;
            scheduleSave();
            setSaveHint('Menyimpan…');
            return next;
        });
    };

    const addWidgetFromModal = () => {
        const w = createWidget(draftType, {
            title: draftTitle || 'Widget',
            device_id: draftDevice || '',
            thNormalMax: draftThAman,
            thSiagaMax: draftThSiaga,
            x: 0,
            y: 0,
            w: 4,
            h: 3,
        });
        setWidgets((prev) => {
            const next = [...prev, w];
            widgetsRef.current = next;
            scheduleSave();
            setSaveHint('Menyimpan…');
            return next;
        });
        setModalOpen(false);
    };

    const resetLayout = async () => {
        try {
            await axios.delete(route('dashboard.user-layout.destroy'), {
                params: { layout_name: layoutName },
            });
        } catch {
            /* ignore */
        }
        const next =
            layoutName === 'riwayat' ? createRiwayatStarterLayout() : createStarterLayout();
        setWidgets(next);
        setLocked(false);
        lockedRef.current = false;
        try {
            await axios.post(route('dashboard.user-layout.store'), {
                layout: next,
                layout_locked: false,
                layout_name: layoutName,
            });
            setSaveHint('Layout direset ke default.');
        } catch {
            setSaveHint('Layout direset lokal; gagal menyimpan ke server.');
        }
    };

    const clearAllHistoryData = async () => {
        if (
            !window.confirm(
                'Hapus SEMUA riwayat pembacaan sensor, antrian perintah, dan log aktivitas dari database? Perangkat (devices) tidak dihapus. Tindakan ini tidak dapat dibatalkan.',
            )
        ) {
            return;
        }
        setClearingHistory(true);
        setSaveHint('Mengosongkan data…');
        try {
            await axios.post(route('dashboard.riwayat.clear-data'));
            setSaveHint('Riwayat, antrian, dan log telah dikosongkan.');
            onCommandSent?.();
        } catch {
            setSaveHint('Gagal mengosongkan data.');
        } finally {
            setClearingHistory(false);
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex flex-col gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-white">
                        {layoutName === 'riwayat' ? 'Layout riwayat' : 'Layout ringkasan'}
                    </h2>
                    <p className="text-xs text-slate-400">{saveHint}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => {
                            setLocked((v) => {
                                const next = !v;
                                lockedRef.current = next;
                                const layout = getLayoutSnapshotRef.current();
                                axios
                                    .post(route('dashboard.user-layout.store'), {
                                        layout,
                                        layout_locked: next,
                                        layout_name: layoutName,
                                    })
                                    .then(() =>
                                        setSaveHint(
                                            next
                                                ? 'Layout dikunci & tersimpan.'
                                                : 'Kunci dibuka & tersimpan.',
                                        ),
                                    )
                                    .catch(() =>
                                        setSaveHint('Gagal menyimpan status kunci layout.'),
                                    );
                                return next;
                            });
                        }}
                        className="rounded-md border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-slate-700"
                    >
                        {locked ? 'Buka kunci' : 'Kunci layout'}
                    </button>
                    {layoutName === 'riwayat' ? (
                        <button
                            type="button"
                            disabled={clearingHistory}
                            onClick={clearAllHistoryData}
                            title="Hapus semua isi riwayat sensor, antrian perintah, dan log aktivitas dari database"
                            aria-label="Hapus semua riwayat data"
                            className="inline-flex items-center justify-center rounded-md border border-red-800 bg-red-950/40 px-2.5 py-1.5 text-red-200 shadow-sm hover:bg-red-950/70 disabled:opacity-50"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 shrink-0"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                aria-hidden
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                                />
                            </svg>
                        </button>
                    ) : null}
                    <button
                        type="button"
                        disabled={locked}
                        onClick={() => setModalOpen(true)}
                        className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-40"
                    >
                        Tambah widget
                    </button>
                    <button
                        type="button"
                        disabled={locked}
                        onClick={resetLayout}
                        className="rounded-md border border-red-800 bg-red-950/50 px-3 py-1.5 text-xs font-medium text-red-100 hover:bg-red-950/80 disabled:opacity-40"
                    >
                        Reset layout
                    </button>
                </div>
            </div>

            <DashboardStarBorderFrame>
                <div
                    ref={containerRef}
                    className="grid-stack dashboard-grid-stack min-h-[240px] rounded-[7px] p-0"
                >
                    {widgets.map((w) => (
                        <div
                            key={w.id}
                            id={w.id}
                            className="grid-stack-item"
                            {...{
                                'gs-id': w.id,
                                'gs-w': w.w,
                                'gs-h': w.h,
                                'gs-x': w.x,
                                'gs-y': w.y,
                            }}
                        >
                            <div className="grid-stack-item-content h-full overflow-hidden">
                                <DashboardWidget
                                    widget={w}
                                    dash={dash}
                                    locked={locked}
                                    onRemove={locked ? undefined : removeWidget}
                                    onCommandSent={onCommandSent}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </DashboardStarBorderFrame>

            {modalOpen ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-600 bg-slate-900 p-5 shadow-xl">
                        <h3 className="text-lg font-semibold text-white">Tambah widget</h3>
                        <div className="mt-4 space-y-3 text-sm text-white">
                            <div>
                                <label className="block text-xs font-medium text-slate-300">
                                    Tipe
                                </label>
                                <select
                                    className="mt-1 w-full rounded-md border-slate-600 bg-slate-950 text-sm text-white shadow-sm"
                                    value={draftType}
                                    onChange={(e) => setDraftType(e.target.value)}
                                >
                                    {widgetTypeOptions.map((o) => (
                                        <option key={o.value} value={o.value}>
                                            {o.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-300">
                                    Judul
                                </label>
                                <input
                                    type="text"
                                    className="mt-1 w-full rounded-md border-slate-600 bg-slate-950 text-sm text-white shadow-sm"
                                    value={draftTitle}
                                    onChange={(e) => setDraftTitle(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-300">
                                    Perangkat (opsional)
                                </label>
                                <select
                                    className="mt-1 w-full rounded-md border-slate-600 bg-slate-950 text-sm text-white shadow-sm"
                                    value={draftDevice}
                                    onChange={(e) => setDraftDevice(e.target.value)}
                                >
                                    <option value="">— semua / otomatis —</option>
                                    {(dash.devices ?? []).map((d) => (
                                        <option key={d.device_id} value={d.device_id}>
                                            {d.device_id} — {d.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {draftType === 'relay_manual' || draftType === 'control_panel' ? (
                                <p className="rounded-md border border-amber-800/50 bg-amber-950/50 px-2 py-2 text-xs text-amber-100">
                                    <strong>Relay manual / panel perintah:</strong> pilih{' '}
                                    <em>Perangkat</em> agar tombol mengirim perintah ke ESP32 yang
                                    benar (otomatis dari sensor tetap tampil untuk perangkat itu).
                                </p>
                            ) : null}
                            {draftType === 'level' ? (
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-300">
                                            NORMAL maks. (cm)
                                        </label>
                                        <input
                                            type="number"
                                            className="mt-1 w-full rounded-md border-slate-600 bg-slate-950 text-sm text-white"
                                            value={draftThAman}
                                            onChange={(e) =>
                                                setDraftThAman(Number(e.target.value))
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-300">
                                            SIAGA maks. (cm)
                                        </label>
                                        <input
                                            type="number"
                                            className="mt-1 w-full rounded-md border-slate-600 bg-slate-950 text-sm text-white"
                                            value={draftThSiaga}
                                            onChange={(e) =>
                                                setDraftThSiaga(Number(e.target.value))
                                            }
                                        />
                                    </div>
                                </div>
                            ) : null}
                        </div>
                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                type="button"
                                className="rounded-md border border-slate-600 px-3 py-1.5 text-sm text-white hover:bg-slate-800"
                                onClick={() => setModalOpen(false)}
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white"
                                onClick={addWidgetFromModal}
                            >
                                Tambah
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
