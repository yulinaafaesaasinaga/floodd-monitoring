import { useEffect, useState } from 'react';
import { subscribeWaterLevelEcho } from './echoBridge';
import { fetchWaterLevels } from './waterLevelApi';
import WaterLevelCard from './WaterLevelCard';

/**
 * Mengambil daftar sensor lalu merender satu kartu per sensor (tiap kartu tetap fetch sendiri).
 *
 * @param {{ className?: string }} props
 */
export default function WaterLevelCardGrid({ className = '' }) {
    const [sensorIds, setSensorIds] = useState([]);

    useEffect(() => {
        let cancelled = false;

        const apply = (data) => {
            if (cancelled) {
                return;
            }
            const ids = (data.levels ?? []).map((l) => l.sensorId || l.id);
            setSensorIds(ids);
        };

        const load = async () => {
            try {
                apply(await fetchWaterLevels());
            } catch {
                if (!cancelled) {
                    setSensorIds([]);
                }
            }
        };

        load();
        const off = subscribeWaterLevelEcho((p) => apply(p));
        return () => {
            cancelled = true;
            off();
        };
    }, []);

    if (!sensorIds.length) {
        return (
            <div
                className={
                    'rounded-2xl border border-dashed border-white/25 bg-white/5 px-4 py-8 text-center text-sm text-sky-100/80 backdrop-blur-sm ' +
                    className
                }
            >
                Belum ada perangkat / data sensor. Kartu akan muncul setelah ada
                pembacaan di basis data.
            </div>
        );
    }

    return (
        <div
            className={
                'grid gap-4 sm:grid-cols-2 xl:grid-cols-3 ' + className
            }
        >
            {sensorIds.map((id) => (
                <WaterLevelCard key={id} sensorId={id} />
            ))}
        </div>
    );
}
