import axios from 'axios';

/**
 * Polling ringan ke /api/water-levels (data dummy server) → CustomEvent agar semua komponen sinkron.
 * Tidak memakai database; tidak bergantung Echo/Reverb untuk channel ini.
 */
const EVENT = 'water-level-updated';

let pollerStarted = false;

function ensureDummyPoller() {
    if (typeof window === 'undefined' || pollerStarted) {
        return;
    }
    pollerStarted = true;

    const tick = async () => {
        try {
            const { data } = await axios.get('/api/water-levels');
            window.dispatchEvent(new CustomEvent(EVENT, { detail: data }));
        } catch {
            /* abaikan */
        }
    };

    tick();
    window.setInterval(tick, 2000);
}

/** Panggil dari app setelah bootstrap. */
export function primeWaterLevelEchoBridge() {
    ensureDummyPoller();
}

/**
 * @param {(payload: object) => void} callback
 */
export function subscribeWaterLevelEcho(callback) {
    if (typeof window === 'undefined') {
        return () => {};
    }
    ensureDummyPoller();
    const handler = (e) => {
        callback(e.detail);
    };
    window.addEventListener(EVENT, handler);
    return () => window.removeEventListener(EVENT, handler);
}
