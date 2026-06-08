import { Head, Link } from '@inertiajs/react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import Hero from '@/Components/Hero';
import { useState, useEffect } from 'react';
import axios from 'axios';

// IMPORT KOMPONEN GRAFIK ASLI DARI DASHBOARD ADMIN
import WaterLevelChart from '@/Components/FloodDashboard/WaterLevelChart';

export default function Welcome({ auth, canLogin, canRegister }) {
    // -------------------------------------------------------------------------
    // 1. STATE UNTUK DATA REALSENSOR IOT (PUBLIC)
    // -------------------------------------------------------------------------
    const [waterLevel, setWaterLevel] = useState(0);
    const [statusBanjir, setStatusBanjir] = useState('NORMAL');
    const [chartReadings, setChartReadings] = useState([]);
    const [chartDevice, setChartDevice] = useState(null);
    const [loading, setLoading] = useState(true);

    // -------------------------------------------------------------------------
    // 2. LIFECYCLE EFFECT UNTUK POLLING DATA REAL-TIME SETIAP 5 DETIK
    // -------------------------------------------------------------------------
    useEffect(() => {
        const fetchSensorData = async () => {
            try {
                // Menembak endpoint rute publik bawaan backend Laravel kamu
                const response = await axios.get('/landing/chart-data'); 
                
                if (response.data) {
                    const readings = response.data.chart_readings || [];
                    const deviceName = response.data.chart_device || null;
                    
                    // Simpan data array pembacaan untuk disuplai ke komponen grafik
                    setChartReadings(readings);
                    setChartDevice(deviceName);
                    
                    // Jika ada data di dalam array, ambil index terakhir sebagai data terbaru
                    if (readings.length > 0) {
                        const sensorLatest = readings[readings.length - 1];
                        
                        // Membaca properti water_level sesuai spesifikasi Chart asli
                        setWaterLevel(Number(sensorLatest.water_level) || 0);
                        
                        // Menentukan status banjir secara dinamis berdasarkan ambang batas level banjir admin (0-4 Normal, dst)
                        if (sensorLatest.status) {
                            setStatusBanjir(sensorLatest.status);
                        } else {
                            const level = Number(sensorLatest.water_level) || 0;
                            if (level <= 4) setStatusBanjir('NORMAL');
                            else if (level <= 8) setStatusBanjir('SIAGA');
                            else setStatusBanjir('BAHAYA');
                        }
                    } else {
                        // Jika koneksi IoT mati atau database kosong
                        setWaterLevel(0);
                        setStatusBanjir('MENUNGGU DATA SENSOR');
                    }
                }
                setLoading(false);
            } catch (error) {
                console.error("Gagal mengambil data IoT untuk publik:", error);
            }
        };

        // Ambil data awal saat landing page dimuat
        fetchSensorData();

        // Lakukan sinkronisasi otomatis (polling) setiap 5 detik agar data persis seperti admin
        const interval = setInterval(fetchSensorData, 5000);
        
        return () => clearInterval(interval);
    }, []);

    // -------------------------------------------------------------------------
    // 3. LOGIKA ANIMASI SCROLL (FRAMER MOTION ORIGINAL)
    // -------------------------------------------------------------------------
    const reduceMotion = useReducedMotion();
    const { scrollY } = useScroll();

    const navBgAlpha = useTransform(scrollY, [0, 140], reduceMotion ? [0.55, 0.62] : [0.28, 0.62]);
    const navBg = useTransform(navBgAlpha, (a) => `rgba(15, 23, 42, ${a})`);
    
    const navBlurPx = useTransform(scrollY, [0, 140], reduceMotion ? [12, 12] : [8, 18]);
    const navBackdrop = useTransform(navBlurPx, (px) => `saturate(1.2) blur(${px}px)`);
    
    const navBorderAlpha = useTransform(scrollY, [0, 140], reduceMotion ? [0.22, 0.28] : [0.12, 0.35]);
    const navBorder = useTransform(navBorderAlpha, (a) => `rgba(71, 85, 105, ${a})`);

    return (
        <>
            <Head title="Flood Monitoring System" />

            <div className="min-h-screen bg-slate-950 text-white selection:bg-sky-500/35 selection:text-white">
                <div className="relative flex min-h-screen flex-col">
                    
                    {/* --- NAVBAR --- */}
                    <motion.header
                        style={{
                            backgroundColor: navBg,
                            backdropFilter: navBackdrop,
                            WebkitBackdropFilter: navBackdrop,
                            borderBottomColor: navBorder,
                        }}
                        className="sticky top-0 z-40 flex shrink-0 items-center justify-between gap-3 border-b border-slate-700/0 px-4 py-3 sm:px-6"
                    >
                        <Link href="/" className="flex min-w-0 items-center gap-3 transition-opacity hover:opacity-90 sm:gap-5">
                            <img src="/img/logo.png" alt="" className="h-10 w-auto shrink-0 object-contain sm:h-12" />
                            <span className="truncate text-xl font-bold tracking-tight text-white sm:text-2xl">
                                Flood Monitoring System
                            </span>
                        </Link>

                       
                    </motion.header>

                    {/* --- KONTEN UTAMA --- */}
                    <main className="relative flex-1">
                        
                        {/* 1. Banner Hero Atas */}
                        <Hero auth={auth} canLogin={canLogin} canRegister={canRegister} />

                        {/* 2. SECTION MONITORING PUBLIC (MENGGANTIKAN AREA PUTIH) */}
                        <section className="relative z-10 border-t border-slate-900 bg-slate-950 px-4 py-16 sm:px-6 lg:px-8">
                            <div className="mx-auto max-w-7xl">
                                
                                <div className="mb-12 text-center">
                                    <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                                        Pantau Ketinggian Air Terkini
                                    </h2>
                                    <p className="mx-auto mt-3 max-w-2xl text-lg text-slate-400 sm:mt-4">
                                        Data indikator dan grafik fluktuasi real-time langsung dari sensor tanpa perlu login.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                                    
                                    {/* KARTU KIRI: Widget Angka & Status Banjir */}
                                    <div className="flex flex-col justify-between rounded-2xl border border-slate-800/60 bg-slate-900/50 p-6 shadow-xl backdrop-blur-md">
                                        <div>
                                            <h3 className="text-lg font-semibold text-slate-200">Ketinggian Air</h3>
                                            <p className="text-xs text-slate-500">
                                                {loading ? 'Menghubungkan ke IoT...' : 'Sinkronisasi Aktif (5s)'}
                                            </p>
                                        </div>
                                        
                                        <div className="my-8 text-center">
                                            <span className="text-6xl font-black tracking-tight text-sky-400">
                                                {waterLevel} <span className="text-2xl font-medium text-slate-500">cm</span>
                                            </span>
                                        </div>
                                        
                                        <div className="text-center">
                                            <span className={`inline-flex items-center rounded-full px-4 py-1.5 text-sm font-semibold ring-1 ring-inset ${
                                                statusBanjir.toUpperCase() === 'NORMAL' 
                                                    ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20' 
                                                    : statusBanjir.toUpperCase() === 'SIAGA' || statusBanjir.toUpperCase() === 'WASPADA'
                                                    ? 'bg-amber-500/10 text-amber-400 ring-amber-500/20'
                                                    : 'bg-red-500/10 text-red-400 ring-red-500/20'
                                            }`}>
                                                Status: {statusBanjir}
                                            </span>
                                        </div>
                                    </div>

                                    {/* KARTU KANAN: Tempat Merender Grafik Asli Admin */}
                                    <div className="rounded-2xl border border-slate-800/60 bg-slate-900/50 p-6 shadow-xl backdrop-blur-md md:col-span-2">
                                        <div className="mb-4 flex items-center justify-between">
                                            <h3 className="text-lg font-semibold text-slate-200">
                                                Grafik Tinggi Air {chartDevice ? `— ${chartDevice}` : ''}
                                            </h3>
                                            <span className="inline-flex items-center gap-1.5 rounded-md bg-sky-500/10 px-2 py-1 text-xs font-medium text-sky-400 ring-1 ring-inset ring-sky-500/20">
                                                <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse"></span>
                                                Live
                                            </span>
                                        </div>
                                        
                                        {/* MEMANGGIL KOMPONEN CHART DENGAN PROPS YANG SESUAI */}
                                        <div className="w-full rounded-xl bg-slate-950/40 p-2 border border-slate-800/40">
                                            <WaterLevelChart 
                                                chartReadings={chartReadings} 
                                                chartDevice={chartDevice} 
                                            />
                                        </div>
                                    </div>

                                </div>

                            </div>
                        </section>

                    </main>

                    {/* --- FOOTER --- */}
                    <footer className="relative border-t border-slate-800 bg-slate-900/90 py-6 text-center text-xs text-slate-400 backdrop-blur-sm">
                        Flood Monitoring System
                    </footer>
                </div>
            </div>
        </>
    );
}