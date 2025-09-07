// components/AnimatedAtoms.tsx
import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    View,
    Animated,
    Easing,
    LayoutChangeEvent,
    StyleProp,
    ViewStyle,
    Platform,
} from "react-native";
import { chakraColorForPct } from "../theme/chakras";

// Visible + smooth defaults
const DEFAULT_ATOM_COUNT = 24;
const MIN_DIAMETER = 10;
const MAX_DIAMETER = 20;

function clamp(n: number, a: number, b: number) {
    return Math.max(a, Math.min(b, n));
}

function paramsFromLevel(level: number) {
    const L = clamp(level, 0, 100);
    const duration = Math.round(1200 - (L / 100) * 950); // 1200ms -> 250ms
    const hopPct = 0.06 + (L / 100) * 0.16; // 6% -> 22%
    const opacity = 0.75 + (L / 100) * 0.2; // 0.75 -> 0.95
    return { duration, hopPct, opacity };
}

type Atom = {
    key: string;
    x: Animated.Value;
    y: Animated.Value;
    size: number;
    curX: number;
    curY: number;
};

export function AnimatedAtoms({
    level,
    atomCount = DEFAULT_ATOM_COUNT,
    style,
}: {
    level: number; // 0..100
    atomCount?: number;
    style?: StyleProp<ViewStyle>;
}) {
    const [box, setBox] = useState({ w: 0, h: 0 });
    const atomsRef = useRef<Atom[]>([]);
    const runningAnims = useRef<Animated.CompositeAnimation[]>([]);
    const color = useMemo(() => chakraColorForPct(level), [level]);
    const { duration, hopPct, opacity } = useMemo(
        () => paramsFromLevel(level),
        [level]
    );

    // Build atoms once
    const ensureAtoms = useCallback(() => {
        if (atomsRef.current.length) return atomsRef.current;
        const atoms: Atom[] = Array.from({ length: atomCount }, (_, i) => ({
            key: `atom-${i}`,
            x: new Animated.Value(0),
            y: new Animated.Value(0),
            size: Math.round(
                MIN_DIAMETER + Math.random() * (MAX_DIAMETER - MIN_DIAMETER)
            ),
            curX: 0,
            curY: 0,
        }));
        atomsRef.current = atoms;
        return atoms;
    }, [atomCount]);

    // Random start positions
    const randomizeStartPositions = useCallback(() => {
        if (!box.w || !box.h) return;
        for (const a of atomsRef.current) {
            const nx = Math.random() * Math.max(1, box.w - a.size);
            const ny = Math.random() * Math.max(1, box.h - a.size);
            a.curX = nx;
            a.curY = ny;
            a.x.setValue(nx);
            a.y.setValue(ny);
        }
    }, [box.w, box.h]);

    // Next hop target
    function nextTarget(a: Atom) {
        const maxDx = box.w * hopPct;
        const maxDy = box.h * hopPct;
        const dx = (Math.random() * 2 - 1) * maxDx;
        const dy = (Math.random() * 2 - 1) * maxDy;
        let nx = a.curX + dx;
        let ny = a.curY + dy;
        nx = clamp(nx, 0, Math.max(0, box.w - a.size));
        ny = clamp(ny, 0, Math.max(0, box.h - a.size));
        return { nx, ny };
    }

    // Stop all animations
    const stopAll = useCallback(() => {
        runningAnims.current.forEach((anim) => {
            try {
                anim.stop?.();
            } catch {}
        });
        runningAnims.current = [];
    }, []);

    // Start (or restart) loops
    const restartLoops = useCallback(() => {
        stopAll();
        if (!box.w || !box.h) return;

        atomsRef.current.forEach((a, idx) => {
            const hop = () => {
                const { nx, ny } = nextTarget(a);
                const anim = Animated.parallel([
                    Animated.timing(a.x, {
                        toValue: nx,
                        duration,
                        easing: Easing.linear,
                        useNativeDriver: false,
                    }),
                    Animated.timing(a.y, {
                        toValue: ny,
                        duration,
                        easing: Easing.linear,
                        useNativeDriver: false,
                    }),
                ]);
                runningAnims.current.push(anim);
                anim.start(({ finished }) => {
                    if (finished) {
                        a.curX = nx;
                        a.curY = ny;
                        hop();
                    }
                });
            };
            setTimeout(hop, idx * 40); // stagger
        });
    }, [box.w, box.h, duration, hopPct, stopAll]);

    // Measure container
    const onLayout = (e: LayoutChangeEvent) => {
        const { width, height } = e.nativeEvent.layout;
        if (width !== box.w || height !== box.h)
            setBox({ w: width, h: height });
    };

    // Init when size ready
    useEffect(() => {
        ensureAtoms();
        if (!box.w || !box.h) return;
        randomizeStartPositions();
        restartLoops();
        return stopAll;
    }, [
        box.w,
        box.h,
        ensureAtoms,
        randomizeStartPositions,
        restartLoops,
        stopAll,
    ]);

    // React to level changes (speed/hop)
    useEffect(() => {
        if (!box.w || !box.h) return;
        restartLoops();
        return stopAll;
    }, [duration, hopPct, box.w, box.h, restartLoops, stopAll]);

    const atoms = ensureAtoms();

    return (
        <View
            onLayout={onLayout}
            style={[
                {
                    height: 160,
                    borderRadius: 16,
                    overflow: "hidden",
                    backgroundColor: "rgba(255,255,255,0.04)",
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.12)",
                },
                style,
            ]}
        >
            {atoms.map((a) => (
                <Animated.View
                    key={a.key}
                    style={{
                        position: "absolute",
                        left: a.x,
                        top: a.y,
                        width: a.size,
                        height: a.size,
                        borderRadius: a.size / 2,
                        backgroundColor: color, // <-- chakra color by slider pct
                        opacity,
                        shadowColor: color,
                        shadowOpacity: Platform.OS === "ios" ? 0.35 : 0,
                        shadowRadius: Platform.OS === "ios" ? 6 : 0,
                        shadowOffset: { width: 0, height: 0 },
                    }}
                />
            ))}
        </View>
    );
}
