import { useEffect, useMemo, useState } from 'react';
import { subscribeWaterLevelEcho } from './echoBridge';
import { fetchWaterLevels } from './waterLevelApi';

/**
 * @param {{
 *   normalMaxCm?: number,
 *   siagaMaxCm?: number,
 *   className?: string,
 * }} props
 */
export default function WaterLevelAlertTicker({
    normalMaxCm = 4,
    siagaMaxCm = 8,
    className = '',
}) {
    const [parts, setParts] = useState([]);

    useEffect(() => {
        let cancelled = false;

        const apply = (data) => {
            if (cancelled) {
                return;
            }
            const nMax = data.thresholds_cm?.normal_max ?? normalMaxCm;
            const sMax = data.thresholds_cm?.siaga_max ?? siagaMaxCm;
            const list = (data.levels ?? []).map((l) => ({
                id: l.sensorId,
                text: `${l.label}: ${l.value} ${l.unit} — ${l.status} (aman ≤${nMax} cm, siaga ≤${sMax} cm)`,
            }));
            setParts(list);
        };

        const load = async () => {
            try {
                apply(await fetchWaterLevels());
            } catch {
                if (!cancelled) {
                    setParts([]);
                }
            }
        };

        load();
        const off = subscribeWaterLevelEcho((p) => apply(p));
        return () => {
            cancelled = true;
            off();
        };
    }, [normalMaxCm, siagaMaxCm]);

    const text = useMemo(() => {
        if (!parts.length) {
            return 'Menunggu data sensor ketinggian air…';
        }
        return parts.map((p) => p.text).join('   •   ');
    }, [parts]);

    return (
        <div
            className={
                'relative overflow-hidden rounded-2xl border border-white/20 bg-white/10 py-2.5 shadow-md backdrop-blur-md ' +
                className
            }
        >
            <div className="flex w-max animate-marquee gap-16 pl-4">
                <span className="whitespace-nowrap text-sm font-medium text-sky-100">
                    {text}
                </span>
                <span className="whitespace-nowrap text-sm font-medium text-sky-100">
                    {text}
                </span>
            </div>
        </div>
    );
}
