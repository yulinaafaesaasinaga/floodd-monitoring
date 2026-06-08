import { TH_NORMAL_MAX_CM, TH_SIAGA_MAX_CM } from '@/lib/dashboardWidgetDefaults';
import { formatDateTimeWib } from '@/lib/wibTime';
import { useEffect, useRef, useState } from 'react';

function formatTs(iso) {
    if (!iso) {
        return '—';
    }
    try {
        return formatDateTimeWib(iso, {
            dateStyle: 'short',
            timeStyle: 'medium',
        });
    } catch {
        return '—';
    }
}

/**
 * Banner + notifikasi peramban saat telemetri nyata dari ESP32 terdeteksi (bukan sekadar UI kosong).
 */
export default function IotLiveNotifications({ iotConnectivity }) {
    const live = Boolean(iotConnectivity?.live);
    const lastIngestAt = iotConnectivity?.last_ingest_at ?? null;
    const readingsLastHour = Number(iotConnectivity?.readings_last_hour ?? 0);

    const prevLive = useRef(live);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        const was = prevLive.current;
        if (live && !was && readingsLastHour > 0) {
            setToast('Perangkat IoT mengirim data — dashboard terhubung ke sensor nyata.');
            window.setTimeout(() => setToast(null), 6500);
            if (
                typeof Notification !== 'undefined' &&
                Notification.permission === 'granted'
            ) {
                try {
                    new Notification('IoT Flood — terhubung', {
                        body: 'Data sensor diterima dari perangkat Anda.',
                    });
                } catch {
                    /* ignore */
                }
            } else if (
                typeof Notification !== 'undefined' &&
                Notification.permission === 'default'
            ) {
                Notification.requestPermission().then((p) => {
                    if (p === 'granted') {
                        try {
                            new Notification('IoT Flood — terhubung', {
                                body: 'Data sensor diterima dari perangkat Anda.',
                            });
                        } catch {
                            /* ignore */
                        }
                    }
                });
            }
        }
        prevLive.current = live;
    }, [live, readingsLastHour]);

    return (
        <div className="space-y-2">
            {toast ? (
                <div
                    role="status"
                    className="rounded-lg border border-emerald-600/50 bg-emerald-950/80 px-4 py-2 text-sm text-emerald-100 shadow-sm"
                >
                    {toast}
                </div>
            ) : null}

            {live ? (
                <div className="rounded-lg border border-emerald-600/50 bg-emerald-950/70 px-4 py-3 text-sm text-white shadow-sm">
                    <p className="font-semibold">Koneksi IoT Terhubung</p>
                </div>
            ) : (
                <div className="rounded-lg border border-amber-600/50 bg-amber-950/70 px-4 py-3 text-sm text-white shadow-sm">
                    <p className="font-semibold">Koneksi IoT Terputus</p>
                </div>
            )}
        </div>
    );
}
