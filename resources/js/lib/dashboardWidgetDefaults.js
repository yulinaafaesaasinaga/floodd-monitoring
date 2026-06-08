/** Ambang ultrasonik (cm) — sama dengan firmware ESP32 + SensorController PHP */
export const TH_NORMAL_MAX_CM = 4;
export const TH_SIAGA_MAX_CM = 8;

/** Tipe widget untuk halaman Ringkasan (tanpa riwayat — pindah ke halaman Riwayat) */
export const WIDGET_TYPE_OPTIONS_RINGKASAN = [
    { value: 'iot_live', label: 'Status koneksi IoT (data nyata)' },
    { value: 'ultrasonic_now', label: 'Ultrasonik — tinggi air saat ini' },
    { value: 'level', label: 'Level NORMAL / SIAGA / AWAS' },
    {
        value: 'relay_pump',
        label: 'Relay — otomatis (dari telemetri sensor)',
    },
    {
        value: 'relay_manual',
        label: 'Relay — manual (perintah ke perangkat)',
    },
    { value: 'chart_device', label: 'Grafik tinggi air' },
    { value: 'device_status', label: 'Daftar perangkat ESP32' },
    { value: 'stat_total', label: 'Total pembacaan tersimpan' },
    {
        value: 'stat_alerts',
        label: 'Peringatan SIAGA / AWAS (jam terakhir)',
    },
    { value: 'control_panel', label: 'Panel perintah ke perangkat' },
];

/** Hanya halaman Riwayat */
export const WIDGET_TYPE_OPTIONS_RIWAYAT = [
    { value: 'water_history', label: 'Riwayat pembacaan sensor' },
    { value: 'command_history', label: 'Antrian perintah' },
    { value: 'activity_log', label: 'Log aktivitas' },
];

/** Alias lama — sama dengan ringkasan */
export const WIDGET_TYPE_OPTIONS = WIDGET_TYPE_OPTIONS_RINGKASAN;

const HISTORY_WIDGET_TYPES = new Set([
    'water_history',
    'command_history',
    'activity_log',
]);

const LEGACY_WIDGET_TYPES = {
    worker_status: 'iot_live',
    stat_online: 'iot_live',
    stat_avg: 'ultrasonic_now',
    stat_max: 'level',
    relay_auto_manual: 'relay_manual',
};

function newId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return `w-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createWidget(type, overrides = {}) {
    const resolvedType = LEGACY_WIDGET_TYPES[type] ?? type;
    return {
        id: overrides.id ?? newId(),
        type: resolvedType,
        title: overrides.title ?? 'Widget',
        device_id: overrides.device_id ?? '',
        field: overrides.field ?? 'water_level',
        unit: overrides.unit ?? 'cm',
        chartColor: overrides.chartColor ?? '#2563eb',
        gaugeMin: overrides.gaugeMin ?? 0,
        gaugeMax: overrides.gaugeMax ?? 12,
        commandOn: overrides.commandOn ?? 'pump_on',
        commandOff: overrides.commandOff ?? 'pump_off',
        commandAlert: overrides.commandAlert ?? 'alert',
        commandReset: overrides.commandReset ?? 'reset',
        chartPoints: overrides.chartPoints ?? 60,
        chartMode: overrides.chartMode ?? 'single',
        thNormalMax:
            overrides.thNormalMax ??
            overrides.thAmanMax ??
            TH_NORMAL_MAX_CM,
        thSiagaMax: overrides.thSiagaMax ?? TH_SIAGA_MAX_CM,
        x: overrides.x ?? 0,
        y: overrides.y ?? 0,
        w: overrides.w ?? 4,
        h: overrides.h ?? 3,
    };
}

export function createStarterLayout() {
    return [
        createWidget('iot_live', {
            title: 'Koneksi IoT',
            x: 0,
            y: 0,
            w: 12,
            h: 2,
        }),
        createWidget('ultrasonic_now', {
            title: 'Ultrasonik — tinggi air',
            x: 0,
            y: 2,
            w: 4,
            h: 3,
        }),
        createWidget('level', {
            title: 'Level banjir',
            x: 4,
            y: 2,
            w: 4,
            h: 3,
        }),
        createWidget('relay_pump', {
            title: 'Relay — otomatis (sensor)',
            x: 8,
            y: 2,
            w: 4,
            h: 3,
        }),
        createWidget('relay_manual', {
            title: 'Relay — manual',
            x: 0,
            y: 5,
            w: 12,
            h: 3,
        }),
        createWidget('chart_device', {
            title: 'Grafik tinggi air (cm)',
            x: 0,
            y: 8,
            w: 12,
            h: 4,
        }),
        createWidget('device_status', {
            title: 'Perangkat (ESP32)',
            x: 0,
            y: 12,
            w: 12,
            h: 5,
        }),
    ];
}

export function createRiwayatStarterLayout() {
    return [
        createWidget('water_history', {
            title: 'Riwayat pembacaan sensor',
            x: 0,
            y: 0,
            w: 12,
            h: 5,
        }),
        createWidget('command_history', {
            title: 'Antrian perintah',
            x: 0,
            y: 5,
            w: 12,
            h: 4,
        }),
        createWidget('activity_log', {
            title: 'Log aktivitas',
            x: 0,
            y: 9,
            w: 12,
            h: 5,
        }),
    ];
}

/**
 * @param {unknown} layout
 * @param {'default' | 'riwayat'} layoutKind
 */
export function normalizeLayout(layout, layoutKind = 'default') {
    if (!Array.isArray(layout) || layout.length === 0) {
        return layoutKind === 'riwayat'
            ? createRiwayatStarterLayout()
            : createStarterLayout();
    }
    let rows = layout.map((w) => {
        const rawType = w.type || 'stat_total';
        const type = LEGACY_WIDGET_TYPES[rawType] ?? rawType;
        return {
            ...createWidget(type, w),
            id: w.id || newId(),
        };
    });
    if (layoutKind === 'default') {
        rows = rows.filter((w) => !HISTORY_WIDGET_TYPES.has(w.type));
    } else {
        rows = rows.filter((w) => HISTORY_WIDGET_TYPES.has(w.type));
    }
    if (rows.length === 0) {
        return layoutKind === 'riwayat'
            ? createRiwayatStarterLayout()
            : createStarterLayout();
    }
    return rows;
}
