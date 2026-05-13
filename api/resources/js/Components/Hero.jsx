import { Link } from '@inertiajs/react';
import { motion, useReducedMotion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { formatDateTimeWib } from '@/lib/wibTime';

const HERO_WAVE_FALLBACK_D = 'M0 150 L400 150 L400 200 L0 200 Z';
const HERO_WAVE_LINE_FALLBACK_D = 'M0 150 L400 150';

function coordsToPolylinePath(coords) {
    if (coords.length === 0) {
        return '';
    }
    const fmt = (n) => n.toFixed(2);
    let d = `M ${fmt(coords[0][0])} ${fmt(coords[0][1])}`;
    for (let i = 1; i < coords.length; i += 1) {
        d += ` L ${fmt(coords[i][0])} ${fmt(coords[i][1])}`;
    }
    return d;
}

/**
 * Kurva mulus (kubik) melalui titik — dipakai hanya bila cukup sampel & variasi nyata,
 * supaya tidak ada overshoot gelombang palsu saat data tipis / hampir konstan.
 */
function catmullRomToBezierPath(points) {
    if (points.length < 2) {
        return '';
    }
    const fmt = (n) => n.toFixed(2);
    let d = `M ${fmt(points[0][0])} ${fmt(points[0][1])}`;
    for (let i = 0; i < points.length - 1; i += 1) {
        const p0 = points[Math.max(0, i - 1)];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[Math.min(points.length - 1, i + 2)];
        const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
        const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
        const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
        const cp2y = p2[1] - (p3[1] - p1[1]) / 6;
        d += ` C ${fmt(cp1x)} ${fmt(cp1y)} ${fmt(cp2x)} ${fmt(cp2y)} ${fmt(p2[0])} ${fmt(p2[1])}`;
    }
    return d;
}

/**
 * @returns {{ fillPathD: string, linePathD: string, hoverSamples: { x: number, y: number, cm: number, atMs: number }[], hasData: boolean }}
 */
function buildStaticWaveChart(timeOffset) {
    const vw = 400;
    const vh = 200;
    const topPad = 32;
    const botPad = 28;
    const innerH = vh - topPad - botPad;

    const pts = 28;
    const coords = [];
    /** @type {{ x: number, y: number, cm: number, atMs: number }[]} */
    const hoverSamples = [];

    const scaleMin = 0;
    const scaleMax = 100;

    for (let i = 0; i < pts; i += 1) {
        const t = pts <= 1 ? 0 : i / (pts - 1);
        const x = t * vw;
        
        // Generate continuous dynamic wave
        const wave1 = Math.sin(t * Math.PI * 3 + timeOffset) * 15;
        const wave2 = Math.cos(t * Math.PI * 5 + timeOffset * 1.5) * 8;
        const wave3 = Math.sin(t * Math.PI * 1.5 - timeOffset * 0.5) * 12;
        
        const lv = 50 + wave1 + wave2 + wave3;
        
        const ny = (lv - scaleMin) / (scaleMax - scaleMin);
        const y = topPad + innerH * (1 - ny);
        coords.push([x, y]);
        
        const atMs = Date.now() - (pts - 1 - i) * 60000;
        hoverSamples.push({ x, y, cm: lv, atMs });
    }

    const linePathD = catmullRomToBezierPath(coords);

    return {
        fillPathD: `${linePathD} L ${vw} ${vh} L 0 ${vh} Z`,
        linePathD,
        hoverSamples,
        hasData: true,
    };
}

/**
 * Hero: glassmorphism + area chart dari data sensor (polling + Echo, sama sumber dengan dashboard).
 */
export default function Hero({ auth, canLogin, canRegister }) {
    const reduceMotion = useReducedMotion();
    const [timeOffset, setTimeOffset] = useState(0);
    const svgRef = useRef(null);
    const [lineTip, setLineTip] = useState(null);

    const waveChart = useMemo(
        () => buildStaticWaveChart(timeOffset),
        [timeOffset],
    );

    const updateLineTipFromClient = useCallback(
        (clientX, clientY) => {
            const svg = svgRef.current;
            const { hoverSamples, hasData } = waveChart;
            if (!svg || !hasData || hoverSamples.length === 0) {
                setLineTip(null);
                return;
            }
            const rect = svg.getBoundingClientRect();
            const vb = svg.viewBox.baseVal;
            let best = null;
            let bestD = Infinity;
            for (const s of hoverSamples) {
                const px = rect.left + (s.x / vb.width) * rect.width;
                const py = rect.top + (s.y / vb.height) * rect.height;
                const d = Math.hypot(clientX - px, clientY - py);
                if (d < bestD) {
                    bestD = d;
                    best = s;
                }
            }
            const hitPx = Math.max(22, rect.width * 0.045);
            if (!best || bestD > hitPx) {
                setLineTip(null);
                return;
            }
            const cmRounded = Math.round(best.cm * 10) / 10;
            const when = formatDateTimeWib(best.atMs, {
                dateStyle: 'short',
                timeStyle: 'short',
            });
            setLineTip({
                clientX,
                clientY,
                cm: cmRounded,
                when,
            });
        },
        [waveChart],
    );

    useEffect(() => {
        // Animate the wave continuously
        const intervalMs = 1500;
        const id = window.setInterval(() => {
            setTimeOffset((prev) => prev + 0.5);
        }, intervalMs);
        return () => window.clearInterval(id);
    }, []);

    const headingMotion = reduceMotion
        ? false
        : { x: -40, opacity: 0 };
    const headingAnimate = { x: 0, opacity: 1 };
    const headingTransition = reduceMotion
        ? { duration: 0 }
        : { duration: 0.7 };

    return (
        <section className="relative min-h-screen w-full overflow-x-clip overflow-y-visible bg-slate-950">
            <div className="relative mx-auto min-h-screen max-w-[1600px]">
                {/* Kiri ~45% ruang konten */}
                <div className="relative z-20 flex min-h-screen flex-col justify-start px-4 pb-16 pt-36 sm:px-6 sm:pt-40 lg:absolute lg:left-0 lg:top-0 lg:w-[45%] lg:px-8 lg:pb-0 lg:pt-36 xl:px-12">
                    <div className="mx-auto flex w-full max-w-xl flex-col lg:mx-0">
                        <motion.h1
                            initial={headingMotion}
                            animate={headingAnimate}
                            transition={headingTransition}
                            className="text-5xl font-bold tracking-tight text-white sm:text-6xl"
                        >
                            Flood Monitoring System
                        </motion.h1>

                        <motion.p
                            initial={headingMotion}
                            animate={headingAnimate}
                            transition={
                                reduceMotion
                                    ? { duration: 0 }
                                    : { ...headingTransition, delay: 0.1 }
                            }
                            className="mt-6 text-lg leading-8 text-slate-300"
                        >
                            Pemantauan ketinggian air berbasis IoT — dashboard
                            untuk data & peringatan.
                        </motion.p>

                        <motion.div
                            initial={headingMotion}
                            animate={headingAnimate}
                            transition={
                                reduceMotion
                                    ? { duration: 0 }
                                    : { ...headingTransition, delay: 0.2 }
                            }
                            className="mt-10 flex items-center gap-x-6"
                        >
                            <Link
                                href={
                                    auth.user ? route("dashboard") : route("login")
                                }
                                className="rounded-[16px] bg-sky-500 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-sky-900/30 transition hover:bg-sky-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
                            >
                                Buka dashboard
                            </Link>
                        </motion.div>
                    </div>
                </div>

                {/* Kanan: ~55% layar, visual absolut */}
                <div
                    className="relative flex min-h-[360px] w-full items-center justify-center overflow-visible py-10 lg:absolute lg:right-0 lg:top-0 lg:h-full lg:w-[55%] lg:min-h-0 lg:py-0"
                    aria-hidden
                >
                    <div className="relative flex h-[min(400px,72vw)] w-[min(560px,94vw)] items-center justify-center sm:h-[400px] sm:w-[560px] lg:-translate-x-4 lg:-translate-y-4 xl:-translate-x-8 xl:-translate-y-8">
                        <div className="relative h-[440px] w-[620px] max-h-full max-w-full origin-center -rotate-[16deg]">
                            {/* Visual background air flow */}
                            <img
                                src="/img/air.png"
                                alt=""
                                className="pointer-events-none absolute inset-[-50%] z-0 h-[240%] w-[240%] max-w-none object-cover -translate-x-96 -translate-y-24 rotate-[24deg]"
                                draggable={false}
                            />

                            {/* Card: Glassmorphism effect */}
                            <motion.div
                                initial={
                                    reduceMotion ? false : { y: 60, opacity: 0 }
                                }
                                animate={{ y: 0, opacity: 1 }}
                                transition={
                                    reduceMotion
                                        ? { duration: 0 }
                                        : { duration: 1.2, delay: 0.4, ease: "easeOut" }
                                }
                                className="pointer-events-none absolute inset-0 z-10 rounded-[48px] border border-slate-600/80 bg-slate-900/40 shadow-[-8px_26px_40px_-6px_rgba(56,189,248,0.35),0_0_48px_-10px_rgba(224,242,254,0.22)] backdrop-blur-[2px]"
                            >
                                <div className="absolute inset-0 rounded-[48px] ring-1 ring-inset ring-white/10" />

                                <div className="pointer-events-auto absolute inset-0 overflow-hidden rounded-[48px]">
                                    <svg
                                        ref={svgRef}
                                        viewBox="0 0 400 200"
                                        className="absolute bottom-0 h-full w-full touch-none"
                                        preserveAspectRatio="none"
                                        onMouseMove={(e) => {
                                            updateLineTipFromClient(
                                                e.clientX,
                                                e.clientY,
                                            );
                                        }}
                                        onMouseLeave={() => setLineTip(null)}
                                        onBlur={() => setLineTip(null)}
                                    >
                                        <defs>
                                            <linearGradient
                                                id="heroLandingWaveGradient"
                                                x1="0"
                                                y1="0"
                                                x2="0"
                                                y2="1"
                                            >
                                                <stop
                                                    offset="0%"
                                                    stopColor="#bae6fd"
                                                    stopOpacity="0.45"
                                                />
                                                <stop
                                                    offset="100%"
                                                    stopColor="#7dd3fc"
                                                    stopOpacity="0.18"
                                                />
                                            </linearGradient>
                                            <linearGradient
                                                id="heroSparkLineGradient"
                                                x1="0%"
                                                y1="0%"
                                                x2="100%"
                                                y2="0%"
                                            >
                                                <stop
                                                    offset="0%"
                                                    stopColor="#c084fc"
                                                />
                                                <stop
                                                    offset="45%"
                                                    stopColor="#f472b6"
                                                />
                                                <stop
                                                    offset="100%"
                                                    stopColor="#a78bfa"
                                                />
                                            </linearGradient>
                                        </defs>
                                        <motion.path
                                            style={{ pointerEvents: 'none' }}
                                            initial={{ d: HERO_WAVE_FALLBACK_D }}
                                            animate={{ d: waveChart.fillPathD }}
                                            transition={
                                                reduceMotion
                                                    ? { duration: 0 }
                                                    : {
                                                          duration: 1.5,
                                                          ease: 'linear',
                                                      }
                                            }
                                            fill="url(#heroLandingWaveGradient)"
                                        />
                                        {/* Halo di bawah titik “star” — sama path garis */}
                                        {!reduceMotion ? (
                                            <motion.path
                                                style={{ pointerEvents: 'none' }}
                                                initial={{ d: HERO_WAVE_LINE_FALLBACK_D }}
                                                animate={{ d: waveChart.linePathD }}
                                                transition={{
                                                    duration: 1.5,
                                                    ease: 'linear',
                                                }}
                                                fill="none"
                                                stroke="#38bdf8"
                                                strokeWidth={6}
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeOpacity={0.22}
                                            />
                                        ) : null}

                                        {/* Garis biru gelap (ketinggian) */}
                                        <motion.path
                                            style={{ pointerEvents: 'none' }}
                                            initial={{ d: HERO_WAVE_LINE_FALLBACK_D }}
                                            animate={{ d: waveChart.linePathD }}
                                            transition={
                                                reduceMotion
                                                    ? { duration: 0 }
                                                    : {
                                                          duration: 1.5,
                                                          ease: 'linear',
                                                      }
                                            }
                                            fill="none"
                                            stroke="#38bdf8"
                                            strokeWidth={1.5}
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                        {/* Area hover lebar di atas garis */}
                                        <motion.path
                                            style={{
                                                pointerEvents: 'stroke',
                                                cursor: waveChart.hasData
                                                    ? 'crosshair'
                                                    : 'default',
                                            }}
                                            initial={{ d: HERO_WAVE_LINE_FALLBACK_D }}
                                            animate={{ d: waveChart.linePathD }}
                                            transition={
                                                reduceMotion
                                                    ? { duration: 0 }
                                                    : {
                                                          duration: 1.5,
                                                          ease: 'linear',
                                                      }
                                            }
                                            fill="none"
                                            stroke="transparent"
                                            strokeWidth={22}
                                        />
                                    </svg>
                                    {lineTip ? (
                                        <div
                                            role="tooltip"
                                            className="pointer-events-none fixed z-[100] max-w-[14rem] rounded-lg border border-slate-700/20 bg-slate-900/95 px-3 py-2 text-left text-xs text-white shadow-lg"
                                            style={{
                                                left: lineTip.clientX + 14,
                                                top: lineTip.clientY + 14,
                                            }}
                                        >
                                            <div className="font-semibold tabular-nums">
                                                {lineTip.cm} cm
                                            </div>
                                            <div className="mt-0.5 text-[11px] text-slate-300">
                                                {lineTip.when}
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
