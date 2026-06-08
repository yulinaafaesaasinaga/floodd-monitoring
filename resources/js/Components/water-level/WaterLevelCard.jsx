import { useEffect, useMemo, useState } from 'react';
import { subscribeWaterLevelEcho } from './echoBridge';
import { fetchWaterLevels, statusFromValue } from './waterLevelApi';

/**
 * @param {{
 *   sensorId: string,
 *   label?: string,
 *   value?: number,
 *   unit?: string,
 *   status?: 'NORMAL'|'SIAGA'|'BAHAYA',
 *   normalMaxCm?: number,
 *   siagaMaxCm?: number,
 *   className?: string,
 * }} props
 */
export default function WaterLevelCard({
    sensorId,
    label: labelProp,
    value: valueProp,
    unit: unitProp,
    status: statusProp,
    normalMaxCm: normalMaxProp = 4,
    siagaMaxCm: siagaMaxProp = 8,
    className = '',
}) {
    const [row, setRow] = useState(null);
    const [thresholds, setThresholds] = useState({
        normalMax: normalMaxProp,
        siagaMax: siagaMaxProp,
    });

    useEffect(() => {
        let cancelled = false;

        const apply = (data) => {
            if (cancelled) {
                return;
            }
            const t = data.thresholds_cm;
            if (t) {
                setThresholds({
                    normalMax: t.normal_max ?? normalMaxProp,
                    siagaMax: t.siaga_max ?? siagaMaxProp,
                });
            }
            const found = data.levels?.find(
                (l) => l.sensorId === sensorId || l.id === sensorId,
            );
            setRow(found ?? null);
        };

        const load = async () => {
            try {
                const data = await fetchWaterLevels();
                apply(data);
            } catch {
                if (!cancelled) {
                    setRow(null);
                }
            }
        };

        load();
        const off = subscribeWaterLevelEcho((p) => apply(p));
        return () => {
            cancelled = true;
            off();
        };
    }, [sensorId, normalMaxProp, siagaMaxProp]);

    const value = useMemo(() => {
        if (valueProp !== undefined && valueProp !== null) {
            return Number(valueProp);
        }
        return row?.value ?? 0;
    }, [valueProp, row]);

    const unit = unitProp ?? row?.unit ?? 'cm';
    const label = labelProp ?? row?.label ?? sensorId;

    const status = useMemo(() => {
        if (statusProp) {
            return statusProp;
        }
        if (row?.status) {
            return row.status;
        }
        return statusFromValue(value, thresholds.normalMax, thresholds.siagaMax);
    }, [statusProp, row, value, thresholds]);

    const ringFx =
        status === 'BAHAYA' ? (
            <span
                className="pointer-events-none absolute inset-0 rounded-2xl border-2 border-red-500 animate-ping opacity-40"
                aria-hidden
            />
        ) : status === 'SIAGA' ? (
            <span
                className="pointer-events-none absolute inset-0 rounded-2xl border-2 border-amber-400 animate-siaga-ring opacity-70"
                aria-hidden
            />
        ) : null;

    return (
        <div
            className={
                'relative rounded-2xl border border-white/20 bg-white/10 p-5 shadow-lg backdrop-blur-md transition-all duration-300 hover:scale-105 ' +
                className
            }
        >
            {ringFx}
            <div className="relative flex flex-col gap-1">
                <span className="text-xs font-medium uppercase tracking-wide text-sky-200/90">
                    {label}
                </span>
                <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-semibold tabular-nums text-white">
                        {value.toFixed(2)}
                    </span>
                    <span className="text-sm text-sky-100/80">{unit}</span>
                </div>
                <span
                    className={
                        'mt-2 inline-flex w-fit rounded-full px-2.5 py-0.5 text-xs font-bold ' +
                        (status === 'BAHAYA'
                            ? 'bg-red-500/25 text-red-100 ring-1 ring-red-400/60'
                            : status === 'SIAGA'
                              ? 'bg-amber-400/20 text-amber-100 ring-1 ring-amber-300/50'
                              : 'bg-emerald-500/20 text-emerald-100 ring-1 ring-emerald-400/40')
                    }
                >
                    {status}
                </span>
            </div>
        </div>
    );
}
