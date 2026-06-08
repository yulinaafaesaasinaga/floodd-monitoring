import { WIB_TIMEZONE } from '@/lib/wibTime';
import Chart from 'chart.js/auto';
import { useEffect, useRef } from 'react';

function chartOptions() {
    return {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        transitions: {
            active: { animation: { duration: 0 } },
        },
        plugins: { legend: { display: false } },
        scales: {
            x: {
                ticks: { maxTicksLimit: 8, color: '#e2e8f0' },
                grid: { color: 'rgba(148,163,184,0.12)' },
            },
            y: {
                beginAtZero: true,
                ticks: { color: '#e2e8f0' },
                grid: { color: 'rgba(148,163,184,0.12)' },
            },
        },
    };
}

export default function MiniWaterChart({ readings, color = '#4f46e5', heightClass = 'h-40' }) {
    const canvasRef = useRef(null);
    const chartRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) {
            return;
        }

        const rows = readings ?? [];
        if (rows.length === 0) {
            if (chartRef.current) {
                chartRef.current.destroy();
                chartRef.current = null;
            }
            return;
        }

        const labels = rows.map((r) =>
            new Date(r.created_at).toLocaleTimeString('id-ID', {
                timeZone: WIB_TIMEZONE,
                hour: '2-digit',
                minute: '2-digit',
            }),
        );
        const data = rows.map((r) => Number(r.water_level));

        if (!chartRef.current) {
            chartRef.current = new Chart(canvas, {
                type: 'line',
                data: {
                    labels,
                    datasets: [
                        {
                            label: 'cm',
                            data,
                            borderColor: color,
                            backgroundColor: `${color}22`,
                            fill: true,
                            tension: 0.2,
                            pointRadius: 0,
                        },
                    ],
                },
                options: chartOptions(),
            });
            return;
        }

        const chart = chartRef.current;
        chart.data.labels = labels;
        chart.data.datasets[0].data = data;
        chart.data.datasets[0].borderColor = color;
        chart.data.datasets[0].backgroundColor = `${color}22`;
        chart.update();
    }, [readings, color]);

    useEffect(
        () => () => {
            chartRef.current?.destroy();
            chartRef.current = null;
        },
        [],
    );

    if (!readings?.length) {
        return (
            <p className="text-xs text-slate-400">Tidak ada titik data untuk grafik.</p>
        );
    }

    return (
        <div className={`relative w-full ${heightClass}`}>
            <canvas ref={canvasRef} />
        </div>
    );
}
