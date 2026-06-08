/** Waktu Indonesia Barat (UTC+7) — dipakai konsisten di UI. */
export const WIB_TIMEZONE = 'Asia/Jakarta';

const locale = 'id-ID';

/**
 * @param {string|number|Date} dateInput
 * @param {Intl.DateTimeFormatOptions} [options]
 */
export function formatDateTimeWib(dateInput, options = {}) {
    const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (Number.isNaN(d.getTime())) {
        return '—';
    }
    return d.toLocaleString(locale, {
        timeZone: WIB_TIMEZONE,
        ...options,
    });
}

/**
 * @param {string|number|Date} dateInput
 * @param {Intl.DateTimeFormatOptions} [options]
 */
export function formatTimeWib(dateInput, options = {}) {
    const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (Number.isNaN(d.getTime())) {
        return '—';
    }
    return d.toLocaleTimeString(locale, {
        timeZone: WIB_TIMEZONE,
        ...options,
    });
}

/**
 * Tahun / bulan / hari saat ini di WIB (untuk kalender, dsb.).
 * @param {Date} [from]
 * @returns {{ year: number, month: number, day: number }}
 */
export function getWibYmd(from = new Date()) {
    const s = new Intl.DateTimeFormat('en-CA', {
        timeZone: WIB_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(from);
    const [y, m, day] = s.split('-').map((x) => parseInt(x, 10));
    return { year: y, month: m, day };
}
