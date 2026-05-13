import { motion } from 'framer-motion';
import { useLayoutEffect, useRef, useState } from 'react';

/** 4.5rem pada root 16px */
const THUMB_W_PX = 72;
const PAD_PX = 4;

/** Spring lembut untuk geser (translateX di GPU) */
const glideSpring = {
    type: 'spring',
    stiffness: 88,
    damping: 17,
    mass: 0.52,
    restDelta: 0.01,
    restSpeed: 0.01,
};

const softSpring = { type: 'spring', stiffness: 200, damping: 26 };

/**
 * Toggle klik: ON = pump_on, OFF = relay_auto (ikuti sensor).
 * Thumb digeser pakai translateX (bukan left) supaya animasi lebih halus.
 */
export default function RelayManualSlider({
    deviceId,
    commandOn = 'pump_on',
    sendRelay,
    busy,
}) {
    const [committedOn, setCommittedOn] = useState(false);
    const trackRef = useRef(null);
    const [thumbTravelPx, setThumbTravelPx] = useState(0);

    useLayoutEffect(() => {
        const el = trackRef.current;
        if (!el || typeof ResizeObserver === 'undefined') {
            return;
        }
        const measure = () => {
            const w = el.getBoundingClientRect().width;
            setThumbTravelPx(Math.max(0, w - THUMB_W_PX - PAD_PX * 2));
        };
        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    const handleToggle = async () => {
        if (!deviceId || busy) {
            return;
        }
        const nextOn = !committedOn;
        const cmd = nextOn ? commandOn : 'relay_auto';
        const ok = await sendRelay(cmd);
        if (ok) {
            setCommittedOn(nextOn);
        }
    };

    const disabled = !deviceId || !!busy;

    return (
        <div className="mt-3">
            <motion.button
                type="button"
                disabled={disabled}
                onClick={() => void handleToggle()}
                whileTap={disabled ? undefined : { scale: 0.988 }}
                transition={{ type: 'tween', duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
                className={
                    'mx-auto block w-full max-w-[14rem] rounded-full border p-1 text-left shadow-inner outline-none ' +
                    'ring-indigo-500/40 transition-colors focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-45 ' +
                    (disabled ? 'border-slate-600' : 'border-slate-500 hover:border-slate-400')
                }
                aria-pressed={committedOn}
                aria-label={
                    committedOn
                        ? 'Relay manual aktif, klik untuk OFF dan ikuti sensor'
                        : 'Relay ikuti sensor, klik untuk ON manual'
                }
            >
                <motion.span
                    ref={trackRef}
                    className="relative block h-10 w-full min-w-[11rem] overflow-hidden rounded-full transform-gpu"
                    animate={{
                        boxShadow: committedOn
                            ? 'inset 0 1px 2px rgba(22, 163, 74, 0.22)'
                            : 'inset 0 1px 2px rgba(220, 38, 38, 0.18)',
                    }}
                    transition={softSpring}
                >
                    <span className="absolute inset-0 rounded-full bg-gradient-to-b from-red-100 via-red-200/90 to-red-300/80" />
                    <motion.span
                        aria-hidden
                        className="absolute inset-0 rounded-full bg-gradient-to-b from-emerald-100 via-emerald-200/90 to-emerald-300/80"
                        initial={false}
                        animate={{ opacity: committedOn ? 1 : 0 }}
                        transition={{ duration: 0.48, ease: [0.16, 1, 0.3, 1] }}
                    />
                    <span
                        className={
                            'pointer-events-none absolute left-3 top-1/2 z-0 -translate-y-1/2 text-[10px] font-bold uppercase tracking-wide transition-colors duration-300 ' +
                            (committedOn ? 'text-emerald-900/70' : 'text-red-900/60')
                        }
                    >
                        Off
                    </span>
                    <span
                        className={
                            'pointer-events-none absolute right-3 top-1/2 z-0 -translate-y-1/2 text-[10px] font-bold uppercase tracking-wide transition-colors duration-300 ' +
                            (committedOn ? 'text-emerald-900/70' : 'text-red-900/60')
                        }
                    >
                        On
                    </span>
                    <motion.span
                        className="absolute top-1 z-10 h-8 w-[4.5rem] cursor-pointer overflow-hidden rounded-full text-[10px] font-bold uppercase tracking-wide text-white shadow-lg ring-1 ring-black/10 will-change-transform"
                        style={{ left: PAD_PX }}
                        initial={false}
                        animate={{
                            x: committedOn ? thumbTravelPx : 0,
                            scale: busy ? 0.97 : 1,
                        }}
                        transition={{
                            x: glideSpring,
                            scale: { type: 'spring', stiffness: 380, damping: 28 },
                        }}
                    >
                        <span className="absolute inset-0 bg-gradient-to-b from-red-500 to-red-700" />
                        <motion.span
                            aria-hidden
                            className="absolute inset-0 bg-gradient-to-b from-emerald-500 to-emerald-700"
                            initial={false}
                            animate={{ opacity: committedOn ? 1 : 0 }}
                            transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
                        />
                        <span className="relative z-10 flex h-full w-full items-center justify-center">
                            <motion.span
                                aria-hidden
                                className="select-none opacity-95"
                                animate={{ opacity: busy ? 0.55 : 0.95 }}
                                transition={{ duration: 0.22, ease: 'easeOut' }}
                            >
                                ∥
                            </motion.span>
                        </span>
                    </motion.span>
                </motion.span>
            </motion.button>
            <p className="mt-1.5 text-center text-[11px] leading-snug text-slate-400">
                Klik untuk ON manual atau OFF (kembali ikuti sensor)
            </p>
        </div>
    );
}
