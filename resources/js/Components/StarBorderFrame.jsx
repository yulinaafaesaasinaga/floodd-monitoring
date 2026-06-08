import { useReducedMotion } from 'framer-motion';
import './StarBorderFrame.css';

const DEFAULT_SPEED = '5.5s';
const BEAM_COLOR = 'rgb(192, 132, 252)';
const BEAM_COLOR_SOFT = 'rgb(244, 114, 182)';

/**
 * Bingkai “Star Border” ala React Bits — dipakai dashboard grid & Hero landing.
 *
 * @param {object} props
 * @param {import('react').ReactNode} props.children
 * @param {string} [props.className] Kelas tambahan pada wrapper luar (sertakan `rounded-*`).
 * @param {string} [props.innerClassName] Kelas pada shell dalam (background, ring, `rounded-*` sedikit lebih kecil dari luar bila padding 2px).
 * @param {string} [props.speed] Durasi satu siklus animasi beam, mis. `'5.5s'`.
 */
export default function StarBorderFrame({
    children,
    className = '',
    innerClassName = '',
    speed: speedProp = DEFAULT_SPEED,
}) {
    const reduceMotion = useReducedMotion();
    const speed = reduceMotion ? '0s' : speedProp;
    const radial = `radial-gradient(circle, ${BEAM_COLOR}, ${BEAM_COLOR_SOFT} 18%, transparent 42%)`;

    return (
        <div
            className={`sb-frame ${className}`.trim()}
            style={{ padding: '2px' }}
        >
            {!reduceMotion ? (
                <>
                    <div
                        aria-hidden
                        className="sb-frame__beam-bottom"
                        style={{
                            background: radial,
                            animationDuration: speed,
                        }}
                    />
                    <div
                        aria-hidden
                        className="sb-frame__beam-top"
                        style={{
                            background: radial,
                            animationDuration: speed,
                        }}
                    />
                </>
            ) : (
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-br from-white/10 via-transparent to-transparent"
                />
            )}
            <div
                className={`relative z-10 overflow-hidden ${innerClassName}`.trim()}
            >
                {children}
            </div>
        </div>
    );
}
