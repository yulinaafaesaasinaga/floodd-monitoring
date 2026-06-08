import { Canvas, useFrame } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { subscribeWaterLevelEcho } from './echoBridge';
import { fetchWaterLevels } from './waterLevelApi';

/**
 * @param {{ levelRef: { current: number } }} props
 */
function WaveMesh({ levelRef }) {
    const geom = useMemo(() => new THREE.PlaneGeometry(14, 14, 32, 32), []);
    const smooth = useRef(0);
    const scaleCm = 50;

    useFrame((state, delta) => {
        const v = levelRef.current ?? 0;
        const tgt = Math.min(Math.max(v / scaleCm, 0), 1.25);
        smooth.current += (tgt - smooth.current) * Math.min(1, delta / 0.5);
        const amp = smooth.current;
        const t = state.clock.elapsedTime;
        const pos = geom.attributes.position;
        for (let i = 0; i < pos.count; i += 1) {
            const x = pos.getX(i);
            const y = pos.getY(i);
            const wave =
                Math.sin(x * 0.75 + t * 1.2) * 0.45 +
                Math.cos(y * 0.65 + t * 0.9) * 0.35;
            pos.setZ(i, wave * amp * 1.4 + amp * 0.65);
        }
        pos.needsUpdate = true;
        geom.computeVertexNormals();
    });

    useEffect(() => () => geom.dispose(), [geom]);

    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} geometry={geom}>
            <meshStandardMaterial
                color="#38bdf8"
                emissive="#1d4ed8"
                emissiveIntensity={0.28}
                metalness={0.12}
                roughness={0.38}
                side={THREE.DoubleSide}
            />
        </mesh>
    );
}

/**
 * @param {{ levelRef: { current: number } }} props
 */
function Scene({ levelRef }) {
    return (
        <>
            <ambientLight intensity={0.5} />
            <directionalLight position={[8, 14, 6]} intensity={1.05} />
            <directionalLight
                position={[-6, 4, -8]}
                intensity={0.4}
                color="#38bdf8"
            />
            <WaveMesh levelRef={levelRef} />
        </>
    );
}

/**
 * @param {{
 *   sensorId?: string | null,
 *   height?: number,
 *   className?: string,
 * }} props
 */
export default function WaterLevelChart3D({
    sensorId = null,
    height = 280,
    className = '',
}) {
    const levelRef = useRef(0);

    useEffect(() => {
        let cancelled = false;
        const applyPayload = (payload) => {
            const row = sensorId
                ? payload.levels?.find(
                      (l) => l.sensorId === sensorId || l.id === sensorId,
                  )
                : payload.levels?.[0];
            if (row && typeof row.value === 'number') {
                levelRef.current = row.value;
            }
        };

        const pull = async () => {
            try {
                const data = await fetchWaterLevels();
                if (!cancelled) {
                    applyPayload(data);
                }
            } catch {
                if (!cancelled) {
                    levelRef.current = 0;
                }
            }
        };

        pull();
        const iv = window.setInterval(pull, 8000);
        const off = subscribeWaterLevelEcho((payload) => applyPayload(payload));
        return () => {
            cancelled = true;
            window.clearInterval(iv);
            off();
        };
    }, [sensorId]);

    return (
        <div
            className={
                'w-full overflow-hidden rounded-2xl border border-white/20 bg-white/10 shadow-lg backdrop-blur-md ' +
                className
            }
            style={{ height }}
        >
            <Canvas
                dpr={[1, 2]}
                style={{ width: '100%', height: '100%' }}
                gl={{ alpha: true }}
                onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
                camera={{ position: [0, 5.5, 12], fov: 48 }}
            >
                <Suspense fallback={null}>
                    <Scene levelRef={levelRef} />
                </Suspense>
            </Canvas>
        </div>
    );
}
