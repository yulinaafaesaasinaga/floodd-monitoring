import { Head, Link } from '@inertiajs/react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import Hero from '@/Components/Hero';

export default function Welcome({ auth, canLogin, canRegister }) {
    const reduceMotion = useReducedMotion();
    const { scrollY } = useScroll();

    const navBgAlpha = useTransform(
        scrollY,
        [0, 140],
        reduceMotion ? [0.55, 0.62] : [0.28, 0.62],
    );
    const navBg = useTransform(navBgAlpha, (a) => `rgba(15, 23, 42, ${a})`);
    const navBlurPx = useTransform(
        scrollY,
        [0, 140],
        reduceMotion ? [12, 12] : [8, 18],
    );
    const navBackdrop = useTransform(
        navBlurPx,
        (px) => `saturate(1.2) blur(${px}px)`,
    );
    const navBorderAlpha = useTransform(
        scrollY,
        [0, 140],
        reduceMotion ? [0.22, 0.28] : [0.12, 0.35],
    );
    const navBorder = useTransform(
        navBorderAlpha,
        (a) => `rgba(71, 85, 105, ${a})`,
    );

    return (
        <>
            <Head title="Flood Monitoring System" />

            <div className="min-h-screen bg-slate-950 text-white selection:bg-sky-500/35 selection:text-white">
                <div className="relative flex min-h-screen flex-col">
                    <motion.header
                        style={{
                            backgroundColor: navBg,
                            backdropFilter: navBackdrop,
                            WebkitBackdropFilter: navBackdrop,
                            borderBottomColor: navBorder,
                        }}
                        className="sticky top-0 z-40 flex shrink-0 items-center justify-between gap-3 border-b border-slate-700/0 px-4 py-3 sm:px-6"
                    >
                        <Link
                            href="/"
                            className="flex min-w-0 items-center gap-3 transition-opacity hover:opacity-90 sm:gap-5"
                        >
                            <img
                                src="/img/logo.png"
                                alt=""
                                className="h-10 w-auto shrink-0 object-contain sm:h-12"
                            />
                            <span className="truncate text-xl font-bold tracking-tight text-white sm:text-2xl">
                                Flood Monitoring System
                            </span>
                        </Link>

                        <nav className="flex shrink-0 items-center gap-2 sm:gap-4">
                            {auth.user ? (
                                <Link
                                    href={route('dashboard')}
                                    className="rounded-xl px-3 py-2 text-sm font-medium text-white ring-1 ring-transparent transition hover:bg-slate-800/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    {canLogin ? (
                                        <Link
                                            href={route('login')}
                                            className="rounded-xl px-3 py-2 text-sm font-medium text-white ring-1 ring-transparent transition hover:bg-slate-800/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                                        >
                                            Login
                                        </Link>
                                    ) : null}
                                    {canRegister ? (
                                        <Link
                                            href={route('register')}
                                            className="rounded-xl border border-sky-400/40 bg-slate-800/90 px-3 py-2 text-sm font-semibold text-sky-200 shadow-sm backdrop-blur-sm transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                                        >
                                            Register
                                        </Link>
                                    ) : null}
                                </>
                            )}
                        </nav>
                    </motion.header>

                    <main className="relative flex-1">
                        <Hero
                            auth={auth}
                            canLogin={canLogin}
                            canRegister={canRegister}
                        />
                    </main>

                    <footer className="relative border-t border-slate-800 bg-slate-900/90 py-6 text-center text-xs text-slate-400 backdrop-blur-sm">
                        Flood Monitoring System
                    </footer>
                </div>
            </div>
        </>
    );
}
