import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import { useIotApiHost } from '@/contexts/IotApiHostContext';
import { Link, usePage } from '@inertiajs/react';
import {
    AnimatePresence,
    motion,
    useReducedMotion,
    useScroll,
    useTransform,
} from 'framer-motion';
import { useEffect, useState } from 'react';

const SIDEBAR_COLLAPSED_KEY = 'iot-flood-sidebar-collapsed';

const easeOutExpo = [0.16, 1, 0.3, 1];
const easeOutSoft = [0.22, 1, 0.36, 1];

function useLgUp() {
    const [lgUp, setLgUp] = useState(() =>
        typeof window !== 'undefined'
            ? window.matchMedia('(min-width: 1024px)').matches
            : false,
    );

    useEffect(() => {
        const mq = window.matchMedia('(min-width: 1024px)');
        const onChange = () => setLgUp(mq.matches);
        onChange();
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, []);

    return lgUp;
}

function SidebarNavLink({ href, active, children, onNavigate }) {
    return (
        <Link
            href={href}
            onClick={onNavigate}
            className={
                'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ' +
                (active
                    ? 'border-r-2 border-amber-400 bg-amber-500/15 text-amber-200'
                    : 'text-slate-200 hover:bg-slate-800 hover:text-white')
            }
        >
            {children}
        </Link>
    );
}

export default function AuthenticatedLayout({
    header,
    title,
    navbarTrailing,
    children,
}) {
    const page = usePage();
    const user = page.props.auth.user;
    const isAdmin = page.props.isAdmin;
    const flash = page.props.flash ?? {};
    const reduceMotion = useReducedMotion();
    const lgUp = useLgUp();
    const { scrollY } = useScroll();

    /** Navbar kaca: tetap cukup transparan agar konten di bawah (mis. grid) terlihat saat scroll. */
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
    const navBackdrop = useTransform(navBlurPx, (px) => `saturate(1.2) blur(${px}px)`);
    const navBorderAlpha = useTransform(
        scrollY,
        [0, 140],
        reduceMotion ? [0.22, 0.28] : [0.12, 0.35],
    );
    const navBorder = useTransform(
        navBorderAlpha,
        (a) => `rgba(71, 85, 105, ${a})`,
    );

    const {
        baseUrl: iotApiBaseUrl,
        saveIotApiBase,
        clearBaseUrl: clearIotApiBase,
        ingestUrl: iotIngestUrl,
    } = useIotApiHost();

    /** null = belum dicek; true = host API menjawab & telemetri hidup; false = lainnya */
    const [apiIndicator, setApiIndicator] = useState(null);

    useEffect(() => {
        let cancelled = false;
        const origin = (
            iotApiBaseUrl || (typeof window !== 'undefined' ? window.location.origin : '')
        ).replace(/\/$/, '');
        if (!origin) {
            return;
        }

        const check = async () => {
            const ctlHost = new AbortController();
            const tidHost = window.setTimeout(() => ctlHost.abort(), 6000);
            let hostOk = false;
            try {
                const res = await fetch(`${origin}/api/water-levels`, {
                    method: 'GET',
                    signal: ctlHost.signal,
                    credentials: 'omit',
                    mode: 'cors',
                    cache: 'no-store',
                });
                hostOk = res.ok;
            } catch {
                hostOk = false;
            } finally {
                window.clearTimeout(tidHost);
            }

            let live = false;
            try {
                const res = await fetch(route('dashboard.iot-connectivity'), {
                    method: 'GET',
                    credentials: 'same-origin',
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    cache: 'no-store',
                });
                if (res.ok) {
                    const body = await res.json();
                    live = Boolean(body?.live);
                }
            } catch {
                live = false;
            }

            if (!cancelled) {
                setApiIndicator(hostOk && live);
            }
        };

        void check();
        const interval = window.setInterval(check, 15000);
        return () => {
            cancelled = true;
            window.clearInterval(interval);
        };
    }, [iotApiBaseUrl]);

    const [apiModalOpen, setApiModalOpen] = useState(false);
    const [apiDraft, setApiDraft] = useState('');
    const [apiFormError, setApiFormError] = useState(null);

    useEffect(() => {
        if (!apiModalOpen) {
            return;
        }
        setApiFormError(null);
        let cancelled = false;

        const loadFromFirmware = async () => {
            try {
                const res = await fetch(route('dashboard.firmware-api-host'), {
                    method: 'GET',
                    credentials: 'same-origin',
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    cache: 'no-store',
                });
                if (cancelled) {
                    return;
                }
                if (res.ok) {
                    const data = await res.json();
                    if (data?.origin) {
                        setApiDraft(data.origin);
                        return;
                    }
                }
            } catch {
                /* abaikan */
            }
            if (!cancelled) {
                setApiDraft(iotApiBaseUrl || '');
            }
        };

        void loadFromFirmware();
        return () => {
            cancelled = true;
        };
    }, [apiModalOpen, iotApiBaseUrl]);

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(() => {
        if (typeof window === 'undefined') {
            return false;
        }
        return window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1';
    });

    useEffect(() => {
        setMobileMenuOpen(false);
    }, [page.url]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.localStorage.setItem(
                SIDEBAR_COLLAPSED_KEY,
                desktopSidebarCollapsed ? '1' : '0',
            );
        }
    }, [desktopSidebarCollapsed]);

    const closeMobile = () => setMobileMenuOpen(false);

    const path = page.url.split('?')[0] ?? '';

    const hasNavbarExtras =
        (title != null && title !== '') || navbarTrailing != null;

    const sidebarOpenMobile = mobileMenuOpen;
    const sidebarOpenDesktop = lgUp && !desktopSidebarCollapsed;

    const sidebarAnimate = reduceMotion
        ? lgUp
            ? {
                  width: desktopSidebarCollapsed ? 0 : 256,
                  opacity: desktopSidebarCollapsed ? 0 : 1,
                  x: 0,
              }
            : {
                  x: mobileMenuOpen ? 0 : -304,
                  opacity: 1,
              }
        : lgUp
          ? {
                width: desktopSidebarCollapsed ? 0 : 256,
                opacity: desktopSidebarCollapsed ? 0 : 1,
                x: 0,
            }
          : {
                x: mobileMenuOpen ? 0 : -304,
                opacity: 1,
            };

    const sidebarTransition = reduceMotion
        ? { duration: 0.15 }
        : lgUp
          ? {
                width: {
                    type: 'tween',
                    duration: 0.62,
                    ease: easeOutSoft,
                },
                opacity: {
                    type: 'tween',
                    duration: 0.38,
                    ease: easeOutExpo,
                },
            }
          : {
                x: sidebarOpenMobile
                    ? {
                          type: 'spring',
                          stiffness: 165,
                          damping: 24,
                          mass: 0.95,
                          restDelta: 0.35,
                          restSpeed: 0.4,
                      }
                    : {
                          type: 'spring',
                          stiffness: 420,
                          damping: 40,
                          mass: 0.72,
                      },
            };

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            {flash.success ? (
                <div className="fixed inset-x-0 top-0 z-[60] border-b border-emerald-700 bg-emerald-600 px-4 py-2 text-center text-sm font-medium text-white shadow">
                    {flash.success}
                </div>
            ) : null}
            {flash.error ? (
                <div className="fixed inset-x-0 top-0 z-[60] border-b border-red-700 bg-red-600 px-4 py-2 text-center text-sm font-medium text-white shadow">
                    {flash.error}
                </div>
            ) : null}

            <div className="flex min-h-screen">
                <AnimatePresence>
                    {sidebarOpenMobile ? (
                        <motion.div
                            key="sidebar-backdrop"
                            role="presentation"
                            aria-hidden
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={
                                reduceMotion
                                    ? { duration: 0.1 }
                                    : {
                                          duration: 0.42,
                                          ease: easeOutExpo,
                                      }
                            }
                            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px] lg:hidden"
                            onPointerDown={closeMobile}
                        />
                    ) : null}
                </AnimatePresence>

                <motion.aside
                    layout={false}
                    initial={false}
                    animate={{
                        ...sidebarAnimate,
                        pointerEvents:
                            lgUp && desktopSidebarCollapsed
                                ? 'none'
                                : !lgUp && !mobileMenuOpen
                                  ? 'none'
                                  : 'auto',
                    }}
                    transition={sidebarTransition}
                    className={
                        'fixed inset-y-0 left-0 z-50 flex w-[min(16rem,85vw)] max-w-[16rem] flex-col overflow-hidden border-r border-slate-700 bg-slate-900 shadow-lg will-change-[transform,width,opacity] lg:shadow-sm ' +
                        (sidebarOpenDesktop ? 'lg:border-slate-700' : 'lg:border-transparent')
                    }
                >
                    <div className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-slate-700 px-3">
                        <Link
                            href="/"
                            className="flex min-w-0 flex-1 items-center gap-2"
                            onClick={closeMobile}
                        >
                            <ApplicationLogo className="h-11 w-auto shrink-0" />
                            <span className="truncate text-sm font-semibold tracking-tight text-white">
                                Flood Monitoring
                            </span>
                        </Link>
                        <button
                            type="button"
                            onClick={() => {
                                setMobileMenuOpen(false);
                                setDesktopSidebarCollapsed(true);
                            }}
                            className="hidden shrink-0 rounded-md p-2 text-slate-400 transition-colors duration-200 hover:bg-slate-800 hover:text-white lg:inline-flex"
                            aria-label="Sembunyikan sidebar"
                            title="Sembunyikan sidebar"
                        >
                            <svg
                                className="h-5 w-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                                />
                            </svg>
                        </button>
                        <button
                            type="button"
                            onClick={closeMobile}
                            className="inline-flex shrink-0 rounded-md p-2 text-slate-400 transition-colors duration-200 hover:bg-slate-800 hover:text-white lg:hidden"
                            aria-label="Tutup menu"
                        >
                            <svg
                                className="h-5 w-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>

                    <nav className="flex min-h-0 flex-1 flex-col space-y-1 overflow-y-auto p-3">
                        <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Utama
                        </p>
                        <SidebarNavLink
                            href={route('dashboard')}
                            active={path === '/dashboard'}
                            onNavigate={closeMobile}
                        >
                            <span>Ringkasan</span>
                        </SidebarNavLink>
                        <SidebarNavLink
                            href={route('dashboard.riwayat')}
                            active={path === '/dashboard/riwayat'}
                            onNavigate={closeMobile}
                        >
                            <span>Riwayat</span>
                        </SidebarNavLink>

                        <p className="mb-2 mt-6 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Integrasi
                        </p>
                        <button
                            type="button"
                            onClick={() => {
                                setApiModalOpen(true);
                                closeMobile();
                            }}
                            className={
                                'group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition ' +
                                (apiModalOpen
                                    ? 'border-r-2 border-amber-400 bg-amber-500/15 text-amber-200'
                                    : 'text-slate-200 hover:bg-slate-800 hover:text-white')
                            }
                        >
                            <span className="min-w-0 flex-1 truncate">API</span>
                            <span
                                className={
                                    'h-2 w-2 shrink-0 rounded-full ' +
                                    (apiIndicator === true
                                        ? 'bg-emerald-500'
                                        : apiIndicator === false
                                          ? 'bg-red-500'
                                          : 'bg-slate-300')
                                }
                                title={
                                    apiIndicator === true
                                        ? 'Host API OK · telemetri hidup'
                                        : apiIndicator === false
                                          ? 'Merah: tidak ada telemetri baru atau host API tidak terjangkau'
                                          : 'Memeriksa…'
                                }
                                aria-label={
                                    apiIndicator === true
                                        ? 'Host API OK dan telemetri hidup'
                                        : apiIndicator === false
                                          ? 'Telemetri tidak hidup atau API tidak terjangkau'
                                          : 'Memeriksa koneksi'
                                }
                            />
                        </button>
                        <SidebarNavLink
                            href={route('dashboard.download')}
                            active={path === '/dashboard/download'}
                            onNavigate={closeMobile}
                        >
                            <span>Download</span>
                        </SidebarNavLink>
                        <SidebarNavLink
                            href={route('dashboard.kalender')}
                            active={path === '/dashboard/kalender'}
                            onNavigate={closeMobile}
                        >
                            <span>Kalender</span>
                        </SidebarNavLink>

                        {isAdmin ? (
                            <>
                                <p className="mb-2 mt-6 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                                    Monitoring
                                </p>
                                <SidebarNavLink
                                    href={route('monitoring.devices.index')}
                                    active={path.startsWith('/monitoring/devices')}
                                    onNavigate={closeMobile}
                                >
                                    <span>Perangkat</span>
                                </SidebarNavLink>
                                <SidebarNavLink
                                    href={route('monitoring.sensor-data.index')}
                                    active={path.startsWith('/monitoring/sensor-data')}
                                    onNavigate={closeMobile}
                                >
                                    <span>Data sensor</span>
                                </SidebarNavLink>
                                <SidebarNavLink
                                    href={route('monitoring.commands.index')}
                                    active={path.startsWith('/monitoring/commands')}
                                    onNavigate={closeMobile}
                                >
                                    <span>Command</span>
                                </SidebarNavLink>
                            </>
                        ) : null}
                    </nav>
                </motion.aside>

                <div
                    className={
                        'flex min-h-screen min-w-0 flex-1 flex-col lg:transition-[padding] lg:duration-[620ms] lg:ease-[cubic-bezier(0.22,1,0.36,1)] ' +
                        (sidebarOpenDesktop ? 'lg:pl-64' : 'lg:pl-0')
                    }
                >
                    <motion.header
                        layout={false}
                        initial={
                            reduceMotion ? false : { opacity: 0, y: -10 }
                        }
                        animate={{ opacity: 1, y: 0 }}
                        transition={
                            reduceMotion
                                ? { duration: 0.01 }
                                : {
                                      type: 'spring',
                                      stiffness: 420,
                                      damping: 34,
                                      mass: 0.65,
                                  }
                        }
                        style={{
                            backgroundColor: navBg,
                            backdropFilter: navBackdrop,
                            WebkitBackdropFilter: navBackdrop,
                            borderBottomColor: navBorder,
                        }}
                        className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-slate-700/0 px-3 sm:gap-3 sm:px-4"
                    >
                        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                            <button
                                type="button"
                                className="inline-flex rounded-md border border-slate-600 bg-slate-800 p-2 text-white transition-colors duration-200 hover:bg-slate-700 lg:hidden"
                                onClick={() => setMobileMenuOpen((v) => !v)}
                                aria-label="Buka menu"
                            >
                                <svg
                                    className="h-5 w-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                </svg>
                            </button>
                            {desktopSidebarCollapsed ? (
                                <button
                                    type="button"
                                    className="hidden rounded-md border border-slate-600 bg-slate-800 p-2 text-white transition-colors duration-200 hover:bg-slate-700 lg:inline-flex"
                                    onClick={() => setDesktopSidebarCollapsed(false)}
                                    aria-label="Tampilkan sidebar"
                                    title="Tampilkan sidebar"
                                >
                                    <svg
                                        className="h-5 w-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M13 5l7 7-7 7M5 5l7 7-7 7"
                                        />
                                    </svg>
                                </button>
                            ) : null}
                        </div>

                        {hasNavbarExtras ? (
                            <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
                                {title ? (
                                    <h1 className="min-w-0 flex-1 truncate text-sm font-semibold leading-none text-white sm:text-base">
                                        {title}
                                    </h1>
                                ) : (
                                    <div className="min-w-0 flex-1" />
                                )}
                                {navbarTrailing ? (
                                    <div className="flex shrink-0 items-center gap-2">
                                        {navbarTrailing}
                                    </div>
                                ) : null}
                            </div>
                        ) : (
                            <div className="min-w-0 flex-1" />
                        )}

                        <div className="flex shrink-0 items-center border-l border-slate-700 pl-2 sm:pl-3">
                            <Dropdown>
                                <Dropdown.Trigger>
                                    <button
                                        type="button"
                                        className="inline-flex max-w-[9rem] items-center gap-1.5 rounded-md border border-slate-600 bg-slate-800 py-1.5 pl-2.5 pr-2 text-left text-xs font-medium text-white shadow-sm transition-colors duration-200 hover:bg-slate-700 sm:max-w-[12rem] sm:gap-2 sm:pl-3 sm:text-sm"
                                    >
                                        <span className="truncate">{user.name}</span>
                                        <svg
                                            className="h-4 w-4 shrink-0 text-slate-400"
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </button>
                                </Dropdown.Trigger>
                                <Dropdown.Content align="right" width="48">
                                    <Dropdown.Link href={route('profile.edit')}>
                                        Profile
                                    </Dropdown.Link>
                                    <Dropdown.Link
                                        href={route('logout')}
                                        method="post"
                                        as="button"
                                    >
                                        Log Out
                                    </Dropdown.Link>
                                </Dropdown.Content>
                            </Dropdown>
                        </div>
                    </motion.header>

                    {header ? (
                        <div className="border-b border-slate-700 bg-slate-900 shadow-sm">
                            <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
                                {header}
                            </div>
                        </div>
                    ) : null}

                    <main className="flex-1 bg-slate-950 text-white">{children}</main>
                </div>
            </div>

            {apiModalOpen ? (
                <div
                    className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4"
                    role="presentation"
                    onClick={() => setApiModalOpen(false)}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="iot-api-host-title"
                        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-600 bg-slate-900 p-5 shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3
                            id="iot-api-host-title"
                            className="text-lg font-semibold text-white"
                        >
                            Host API dashboard dan IoT
                        </h3>
                       
                        <label className="mt-4 block text-xs font-medium text-slate-300">
                            Base URL (origin saja)
                        </label>
                        <p className="mt-1 text-[11px] leading-snug text-slate-400">
                            Default diisi dari{' '}
                            <code className="rounded bg-slate-800 px-1 text-[10px] text-slate-200">
                                client/Flood_Monitoring_System.ino
                            </code>{' '}
                            (<code className="rounded bg-slate-800 px-1 text-[10px] text-slate-200">API_HOST</code>) saat dialog
                            dibuka. Edit file itu, buka lagi dialog, lalu <strong>Simpan</strong> — tanpa tempel
                            manual. Jika kolom kosong, Simpan juga memuat ulang dari file tersebut.
                        </p>
                        <input
                            type="url"
                            inputMode="url"
                            autoComplete="url"
                            placeholder="http://127.0.0.1:8000"
                            className="mt-1 w-full rounded-md border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-white shadow-sm placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            value={apiDraft}
                            onChange={(e) => {
                                setApiDraft(e.target.value);
                                setApiFormError(null);
                            }}
                        />
                        {apiFormError ? (
                            <p className="mt-2 text-sm text-red-400">{apiFormError}</p>
                        ) : null}
   
                      
                      
                        <div className="mt-5 flex flex-wrap justify-end gap-2">
                            <button
                                type="button"
                                className="rounded-md border border-slate-600 px-3 py-1.5 text-sm text-white hover:bg-slate-800"
                                onClick={() => setApiModalOpen(false)}
                            >
                                Tutup
                            </button>
                            <button
                                type="button"
                                className="rounded-md border border-slate-600 px-3 py-1.5 text-sm text-white hover:bg-slate-800"
                                onClick={() => {
                                    clearIotApiBase();
                                    setApiDraft('');
                                    setApiFormError(null);
                                    setApiModalOpen(false);
                                }}
                            >
                                Pakai situs ini
                            </button>
                            <button
                                type="button"
                                className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500"
                                onClick={async () => {
                                    let value = apiDraft.trim();
                                    if (!value) {
                                        try {
                                            const res = await fetch(
                                                route('dashboard.firmware-api-host'),
                                                {
                                                    method: 'GET',
                                                    credentials: 'same-origin',
                                                    headers: {
                                                        Accept: 'application/json',
                                                        'X-Requested-With': 'XMLHttpRequest',
                                                    },
                                                    cache: 'no-store',
                                                },
                                            );
                                            if (res.ok) {
                                                const data = await res.json();
                                                if (data?.origin) {
                                                    value = data.origin;
                                                    setApiDraft(data.origin);
                                                }
                                            }
                                        } catch {
                                            /* abaikan */
                                        }
                                    }
                                    if (!value) {
                                        setApiFormError(
                                            'Isi URL atau pastikan client/Flood_Monitoring_System.ino berisi API_HOST.',
                                        );
                                        return;
                                    }
                                    const r = saveIotApiBase(value);
                                    if (!r.ok) {
                                        setApiFormError(r.error ?? 'Gagal menyimpan.');
                                        return;
                                    }
                                    setApiFormError(null);
                                    setApiModalOpen(false);
                                }}
                            >
                                Simpan
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
