import { useEffect, useState } from 'react';
import { subscribeWaterLevelEcho } from './echoBridge';
import { fetchWaterLevels } from './waterLevelApi';

function rankAlert(alert) {
    if (alert === 'danger') {
        return 3;
    }
    if (alert === 'warning') {
        return 2;
    }
    return 1;
}

/**
 * @param {{ className?: string }} props
 */
export default function WaterLevelNotification({ className = '' }) {
    const [line, setLine] = useState(null);

    useEffect(() => {
        let cancelled = false;

        const pick = (data) => {
            const levels = data.levels ?? [];
            if (!levels.length) {
                setLine('Belum ada pembacaan sensor.');
                return;
            }
            let best = levels[0];
            for (const l of levels) {
                const r = rankAlert(l.alert_level);
                const br = rankAlert(best.alert_level);
                if (r > br) {
                    best = l;
                } else if (r === br) {
                    const ta = l.updated_at ? Date.parse(l.updated_at) : 0;
                    const tb = best.updated_at ? Date.parse(best.updated_at) : 0;
                    if (ta > tb) {
                        best = l;
                    }
                }
            }
            setLine(
                `${best.label}: ${best.value} ${best.unit} — status ${best.status}`,
            );
        };

        const load = async () => {
            try {
                const data = await fetchWaterLevels();
                if (!cancelled) {
                    pick(data);
                }
            } catch {
                if (!cancelled) {
                    setLine('Gagal memuat notifikasi ketinggian air.');
                }
            }
        };

        load();
        const off = subscribeWaterLevelEcho((p) => {
            if (!cancelled) {
                pick(p);
            }
        });
        return () => {
            cancelled = true;
            off();
        };
    }, []);

    return (
        <div
            className={
                'flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 shadow-md backdrop-blur-md ' +
                className
            }
        >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/20 text-sky-200 ring-1 ring-sky-400/30">
                <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    aria-hidden
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
                    />
                </svg>
            </span>
            <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-sky-200/90">
                    Peringatan ketinggian air
                </p>
                <p className="truncate text-sm text-white">{line}</p>
            </div>
        </div>
    );
}
