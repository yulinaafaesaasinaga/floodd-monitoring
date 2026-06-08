import { WIB_TIMEZONE } from '@/lib/wibTime';
import Chart from 'chart.js/auto';
import { useEffect, useRef } from 'react';

export default function WaterLevelChart({ chartReadings, chartDevice }) {
    const canvasRef = useRef(null);
    const chartInstance = useRef(null);

    useEffect(() => {
        if (chartInstance.current) {
            chartInstance.current.destroy();
            chartInstance.current = null;
        }

        if (!canvasRef.current) {
            return;
        }

        const rows = chartReadings ?? [];
        if (rows.length === 0) {
            return;
        }

        const labels = rows.map((r) =>
            new Date(r.created_at).toLocaleString('id-ID', {
                timeZone: WIB_TIMEZONE,
                dateStyle: 'short',
                timeStyle: 'short',
            }),
        );
        const dataPoints = rows.map((r) => Number(r.water_level));

        chartInstance.current = new Chart(canvasRef.current, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: chartDevice
                            ? `Ketinggian air (cm) — ${chartDevice}`
                            : 'Ketinggian air (cm)',
                        data: dataPoints,
                        borderColor: 'rgb(79, 70, 229)',
                        backgroundColor: 'rgba(79, 70, 229, 0.12)',
                        fill: true,
                        tension: 0.25,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        ticks: { color: '#e2e8f0', maxTicksLimit: 8 },
                        grid: { color: 'rgba(148,163,184,0.12)' },
                    },
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#e2e8f0' },
                        grid: { color: 'rgba(148,163,184,0.12)' },
                    },
                },
            },
        });

        return () => {
            chartInstance.current?.destroy();
            chartInstance.current = null;
        };
    }, [chartReadings, chartDevice]);

    if (!chartReadings?.length) {
        return (
            <div className="flex h-72 items-center justify-center rounded-lg border border-dashed border-slate-600 bg-slate-900/50 text-sm text-slate-300">
                Belum ada data grafik. Pilih perangkat atau kirim data dari device ke
                ingest API.
            </div>
        );
    }

    return (
        <div className="h-72 w-full">
            <canvas ref={canvasRef} />
        </div>
    );
}
