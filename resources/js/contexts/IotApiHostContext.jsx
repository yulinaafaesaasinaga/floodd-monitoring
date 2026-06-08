import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
} from 'react';

const STORAGE_KEY = 'iot-flood-api-base-url';

export function normalizeIotApiBase(input) {
    const t = (input ?? '').trim();
    if (!t) {
        return '';
    }
    let candidate = t;
    if (!/^https?:\/\//i.test(candidate)) {
        candidate = `http://${candidate}`;
    }
    try {
        return new URL(candidate).origin;
    } catch {
        return '';
    }
}

function readStoredBase() {
    if (typeof window === 'undefined') {
        return '';
    }
    return normalizeIotApiBase(localStorage.getItem(STORAGE_KEY) || '');
}

const IotApiHostContext = createContext(null);

export function IotApiHostProvider({ children }) {
    const [baseUrl, setBaseUrlState] = useState(readStoredBase);

    const saveIotApiBase = useCallback((input) => {
        const raw = (input ?? '').trim();
        if (!raw) {
            localStorage.removeItem(STORAGE_KEY);
            setBaseUrlState('');
            return { ok: true };
        }
        const n = normalizeIotApiBase(input);
        if (!n) {
            return {
                ok: false,
                error: 'URL tidak valid. Contoh: http://192.168.1.10:8000 atau https://api.domain.com',
            };
        }
        localStorage.setItem(STORAGE_KEY, n);
        setBaseUrlState(n);
        return { ok: true };
    }, []);

    const clearBaseUrl = useCallback(() => {
        localStorage.removeItem(STORAGE_KEY);
        setBaseUrlState('');
    }, []);

    const resolveUrl = useCallback(
        (ziggyPath) => {
            const p = String(ziggyPath ?? '');
            if (!baseUrl) {
                return p;
            }
            if (p.startsWith('http://') || p.startsWith('https://')) {
                return p;
            }
            return `${baseUrl}${p.startsWith('/') ? p : `/${p}`}`;
        },
        [baseUrl],
    );

    const ingestUrl = useMemo(() => {
        const origin =
            baseUrl ||
            (typeof window !== 'undefined' ? window.location.origin : '');
        if (!origin) {
            return '/api/ingest';
        }
        return `${origin.replace(/\/$/, '')}/api/ingest`;
    }, [baseUrl]);

    const value = useMemo(
        () => ({
            baseUrl,
            saveIotApiBase,
            clearBaseUrl,
            resolveUrl,
            ingestUrl,
            isCustomHost: Boolean(baseUrl),
        }),
        [baseUrl, saveIotApiBase, clearBaseUrl, resolveUrl, ingestUrl],
    );

    return (
        <IotApiHostContext.Provider value={value}>
            {children}
        </IotApiHostContext.Provider>
    );
}

export function useIotApiHost() {
    const ctx = useContext(IotApiHostContext);
    if (!ctx) {
        throw new Error('useIotApiHost harus dipakai di dalam IotApiHostProvider');
    }
    return ctx;
}
