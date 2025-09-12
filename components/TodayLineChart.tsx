// TodayLineChart.tsx - Consumer-ready today's alignment chart
import React, {
    useCallback,
    useEffect,
    useMemo,
    useState,
    useRef,
} from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Dimensions,
    ActivityIndicator,
    Animated,
    RefreshControl,
    ScrollView,
    Pressable,
    AccessibilityInfo,
    Vibration,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import {
    CartesianChart,
    Line,
    Area,
    Scatter,
    useChartPressState,
    type PointsArray,
} from "victory-native";
import { useFont } from "@shopify/react-native-skia";

import {
    getEntryAveraged,
    getEntriesByDatesAveraged,
    type EntryDay,
} from "@/storage/entries";
import { chakraColorForPct } from "@/theme/chakras";

const SpaceMono = require("@/assets/fonts/SpaceMono-Regular.ttf");

type Row = { time: number; pct: number };

const { width: screenWidth } = Dimensions.get("window");
const CHART_PADDING = 24;
const CHART_WIDTH = screenWidth - CHART_PADDING * 2;

interface TodayLineChartProps {
    alignmentData?: {
        alignment_pct: number;
        samples?: Array<{ t: string; v: number }>;
    };
}

export default function TodayLineChart({
    alignmentData,
}: TodayLineChartProps = {}) {
    const font = useFont(SpaceMono, 11);
    const [rows, setRows] = useState<Row[]>([]);
    const [dailyAlignment, setDailyAlignment] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [showHelp, setShowHelp] = useState(false);

    // Animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const chartScaleAnim = useRef(new Animated.Value(0.95)).current;

    const { state, isActive } = useChartPressState({
        x: 0,
        y: { pct: 0 },
    });

    const todayKey = useMemo(() => {
        const d = new Date();
        const y = d.getFullYear();
        const m = `${d.getMonth() + 1}`.padStart(2, "0");
        const day = `${d.getDate()}`.padStart(2, "0");
        const key = `${y}-${m}-${day}`;
        console.log(`📊 TodayLineChart: Today key generated: ${key}`);
        return key;
    }, []);

    const bucketDaypart = (iso: string) => {
        const h = new Date(iso).getHours();
        if (h >= 5 && h < 12) return 0; // morning (5am-12pm)
        if (h >= 12 && h < 18) return 1; // afternoon (12pm-6pm)
        return 2; // night (6pm-5am)
    };

    const mean = (nums: number[]) =>
        nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : NaN;

    const buildDayparts = (entry: EntryDay): Row[] => {
        const buckets: number[][] = [[], [], []];

        for (const s of entry.samples || []) {
            const idx = bucketDaypart(s.t);
            buckets[idx].push(Math.max(0, Math.min(100, s.v)));
        }

        // If no timestamped samples, use single daily average
        if (!buckets[0].length && !buckets[1].length && !buckets[2].length) {
            const dailyAvg =
                typeof entry.alignment_pct === "number"
                    ? entry.alignment_pct
                    : 0;
            return [{ time: 1, pct: Math.round(dailyAvg) }];
        }

        // Show actual time block averages for deeper insight
        const out: Row[] = [];
        for (let i = 0; i < 3; i++) {
            const blockAvg = mean(buckets[i]);
            if (!Number.isNaN(blockAvg)) {
                out.push({ time: i, pct: Math.round(blockAvg) });
            }
        }
        return out;
    };

    const loadData = useCallback(
        async (forceRefresh = false, retryCount = 0) => {
            const maxRetries = 2;

            try {
                console.log(
                    `📊 TodayLineChart: Loading data for ${todayKey} ${
                        forceRefresh ? "(forced)" : ""
                    } ${retryCount > 0 ? `(retry ${retryCount})` : ""}`
                );
                setLoading(true);
                setError(null);

                // Use passed alignmentData if available
                if (alignmentData) {
                    console.log(
                        `📊 TodayLineChart: Using passed alignment data:`,
                        {
                            alignmentPct: alignmentData.alignment_pct,
                            samplesCount: alignmentData.samples?.length || 0,
                        }
                    );

                    const mockEntry: EntryDay = {
                        date: todayKey,
                        alignment_pct: alignmentData.alignment_pct,
                        samples: alignmentData.samples || [],
                    };

                    const dayparts = buildDayparts(mockEntry);
                    console.log(
                        `📊 TodayLineChart: Processed dayparts from prop:`,
                        dayparts
                    );

                    setRows(dayparts);
                    setDailyAlignment(alignmentData.alignment_pct);

                    console.log(
                        `📊 TodayLineChart: State updated from props - alignment: ${alignmentData.alignment_pct}%`
                    );
                    return;
                }

                // Add small delay for forced refresh to allow any pending writes to complete
                if (forceRefresh && retryCount === 0) {
                    await new Promise((resolve) => setTimeout(resolve, 100));
                }

                // Use the same data source as reports screen for consistency
                const entries = await getEntriesByDatesAveraged([todayKey]);
                const entry: EntryDay | undefined = entries[0];

                console.log(
                    `📊 TodayLineChart: Entry data received from storage:`,
                    {
                        hasEntry: !!entry,
                        alignmentPct: entry?.alignment_pct,
                        samplesCount: entry?.samples?.length || 0,
                        lastSample: entry?.samples?.[entry.samples.length - 1],
                    }
                );

                if (!entry) {
                    console.log(
                        `📊 TodayLineChart: No entry found for ${todayKey}`
                    );
                    setRows([]);
                    setDailyAlignment(0);
                    return;
                }

                const dayparts = buildDayparts(entry);
                console.log(
                    `📊 TodayLineChart: Processed dayparts from storage:`,
                    dayparts
                );

                setRows(dayparts);
                setDailyAlignment(entry.alignment_pct || 0);

                console.log(
                    `📊 TodayLineChart: State updated from storage - alignment: ${
                        entry.alignment_pct || 0
                    }%`
                );
            } catch (err) {
                console.error("📊 TodayLineChart: Data loading error:", err);

                // Retry logic
                if (retryCount < maxRetries) {
                    console.log(
                        `📊 TodayLineChart: Retrying... (${
                            retryCount + 1
                        }/${maxRetries})`
                    );
                    setTimeout(() => {
                        loadData(forceRefresh, retryCount + 1);
                    }, 500 * (retryCount + 1)); // Exponential backoff
                    return;
                }

                setError("Failed to load data after retries");
            } finally {
                if (retryCount >= maxRetries || !error) {
                    setLoading(false);
                }
            }
        },
        [todayKey, error, alignmentData]
    );

    useEffect(() => {
        console.log(
            "📊 TodayLineChart: Component mounted, loading initial data"
        );
        loadData();
    }, [loadData]);

    useFocusEffect(
        useCallback(() => {
            console.log("📊 TodayLineChart: Screen focused, refreshing data");
            loadData(true); // Force refresh on focus
        }, [loadData])
    );

    const { data, xMin, xMax, hasMultiplePoints } = useMemo(() => {
        console.log(
            `📊 TodayLineChart: Processing chart data, rows length: ${rows.length}`,
            rows
        );

        if (!rows.length) {
            console.log(
                `📊 TodayLineChart: No rows data, returning empty chart`
            );
            return {
                data: [] as Row[],
                xMin: 0,
                xMax: 2,
                hasMultiplePoints: false,
            };
        }

        const sortedData = [...rows].sort((a, b) => a.time - b.time);
        console.log(`📊 TodayLineChart: Chart data processed:`, {
            dataPoints: sortedData.length,
            hasMultiplePoints: sortedData.length > 1,
            data: sortedData,
        });

        return {
            data: sortedData,
            xMin: 0,
            xMax: 2,
            hasMultiplePoints: sortedData.length > 1,
        };
    }, [rows]);

    const timeLabels = ["Morning", "Afternoon", "Night"];
    const formatX = (v: number) =>
        timeLabels[Math.round(Math.max(0, Math.min(2, v)))];
    const formatY = (v: number) => `${Math.round(v)}%`;

    const mainLineColor = chakraColorForPct(dailyAlignment);

    // Loading state
    if (loading) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Today's Alignment</Text>
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={mainLineColor} />
                    <Text style={styles.loadingText}>Loading your data...</Text>
                </View>
            </View>
        );
    }

    // Error state
    if (error) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Today's Alignment</Text>
                    <TouchableOpacity
                        onPress={() => loadData()}
                        style={styles.refreshButton}
                    >
                        <Text style={styles.refreshButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>⚠️ {error}</Text>
                    <Text style={styles.errorSubtext}>Tap retry to reload</Text>
                </View>
            </View>
        );
    }

    // Empty state
    if (!data.length) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Today's Alignment</Text>
                </View>
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>📊</Text>
                    <Text style={styles.emptyTitle}>No data yet today</Text>
                    <Text style={styles.emptySubtext}>
                        Add your first check-in to see your alignment pattern
                    </Text>
                </View>
            </View>
        );
    }

    // Chart configuration
    const axisOptions = {
        tickCount: { x: 3, y: 5 },
        formatXLabel: formatX,
        formatYLabel: formatY,
        labelColor: "#8A8EA3",
        gridColor: "rgba(138, 142, 163, 0.15)",
        axisSide: { x: "bottom", y: "left" } as const,
        font: font || undefined,
        lineColor: "rgba(138, 142, 163, 0.2)",
        labelOffset: { x: 8, y: 8 },
    };

    return (
        <View style={styles.container}>
            {/* Header with current alignment */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Today's Alignment</Text>
                    <Text
                        style={[
                            styles.alignmentValue,
                            { color: mainLineColor },
                        ]}
                    >
                        {Math.round(dailyAlignment)}% aligned
                    </Text>
                </View>
                <TouchableOpacity
                    onPress={() => {
                        console.log(
                            "📊 TodayLineChart: Manual refresh triggered"
                        );
                        loadData(true);
                    }}
                    style={styles.refreshButton}
                >
                    <Text style={styles.refreshButtonText}>↻ Refresh</Text>
                </TouchableOpacity>
            </View>

            {/* Data summary */}
            <View style={styles.summaryContainer}>
                {data.map((point, index) => (
                    <View key={index} style={styles.summaryItem}>
                        <Text style={styles.summaryTime}>
                            {formatX(point.time)}
                        </Text>
                        <Text
                            style={[
                                styles.summaryValue,
                                { color: mainLineColor },
                            ]}
                        >
                            {point.pct}%
                        </Text>
                    </View>
                ))}
            </View>

            {/* Interactive tooltip */}
            {isActive && state && (
                <View style={styles.tooltip}>
                    <Text style={styles.tooltipText}>
                        {formatX(state.x.value as unknown as number)} •{" "}
                        {formatY(
                            (state.y.pct as any).value as unknown as number
                        )}
                    </Text>
                </View>
            )}

            {/* Chart */}
            <View style={styles.chartContainer}>
                <CartesianChart
                    data={data}
                    xKey="time"
                    yKeys={["pct"]}
                    domain={{ x: [xMin, xMax], y: [0, 100] }}
                    domainPadding={{
                        left: hasMultiplePoints ? 60 : 80,
                        right: hasMultiplePoints ? 60 : 80,
                        top: 30,
                        bottom: 50,
                    }}
                    axisOptions={axisOptions}
                    chartPressState={state}
                >
                    {({ points }) => {
                        const allPts: PointsArray = points.pct;

                        if (!allPts || allPts.length === 0) return null;

                        return (
                            <>
                                {/* Gradient area fill */}
                                <Area
                                    points={allPts}
                                    y0={0}
                                    color={mainLineColor}
                                    opacity={0.15}
                                />

                                {/* Main line - only draw if multiple points */}
                                {hasMultiplePoints && (
                                    <Line
                                        points={allPts}
                                        strokeWidth={3}
                                        color={mainLineColor}
                                        curveType="monotoneX"
                                    />
                                )}

                                {/* Data point markers */}
                                {allPts.map((point: any, index: number) => {
                                    if (
                                        !point ||
                                        typeof point.x !== "number" ||
                                        typeof point.y !== "number"
                                    ) {
                                        return null;
                                    }

                                    return (
                                        <Scatter
                                            key={`point-${index}`}
                                            points={[point]}
                                            radius={hasMultiplePoints ? 5 : 8}
                                            color={mainLineColor}
                                            style="fill"
                                        />
                                    );
                                })}

                                {/* Outer ring for markers */}
                                {allPts.map((point: any, index: number) => {
                                    if (
                                        !point ||
                                        typeof point.x !== "number" ||
                                        typeof point.y !== "number"
                                    ) {
                                        return null;
                                    }

                                    return (
                                        <Scatter
                                            key={`ring-${index}`}
                                            points={[point]}
                                            radius={hasMultiplePoints ? 7 : 10}
                                            color={mainLineColor}
                                            style="stroke"
                                            strokeWidth={2}
                                        />
                                    );
                                })}
                            </>
                        );
                    }}
                </CartesianChart>
            </View>
        </View>
    );
}

const styles = {
    container: {
        backgroundColor: "#0D0D0D",
        borderRadius: 20,
        margin: 16,
        padding: 20,
        minHeight: 320,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    header: {
        flexDirection: "row" as const,
        justifyContent: "space-between" as const,
        alignItems: "flex-start" as const,
        marginBottom: 16,
    },
    title: {
        color: "white",
        fontSize: 18,
        fontWeight: "700" as const,
        letterSpacing: -0.5,
    },
    alignmentValue: {
        fontSize: 14,
        fontWeight: "600" as const,
        marginTop: 2,
        opacity: 0.9,
    },
    refreshButton: {
        backgroundColor: "rgba(255,255,255,0.08)",
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.06)",
    },
    refreshButtonText: {
        color: "#8A8EA3",
        fontSize: 12,
        fontWeight: "500" as const,
    },
    summaryContainer: {
        flexDirection: "row" as const,
        justifyContent: "space-around" as const,
        marginBottom: 20,
        paddingVertical: 12,
        backgroundColor: "rgba(255,255,255,0.03)",
        borderRadius: 12,
    },
    summaryItem: {
        alignItems: "center" as const,
    },
    summaryTime: {
        color: "#8A8EA3",
        fontSize: 11,
        fontWeight: "500" as const,
        textTransform: "uppercase" as const,
        letterSpacing: 0.5,
    },
    summaryValue: {
        fontSize: 16,
        fontWeight: "700" as const,
        marginTop: 2,
    },
    tooltip: {
        position: "absolute" as const,
        right: 20,
        top: 80,
        backgroundColor: "rgba(0,0,0,0.9)",
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        zIndex: 10,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
    },
    tooltipText: {
        color: "white",
        fontWeight: "600" as const,
        fontSize: 12,
        letterSpacing: 0.3,
    },
    chartContainer: {
        flex: 1,
        minHeight: 180,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center" as const,
        alignItems: "center" as const,
        paddingVertical: 40,
    },
    loadingText: {
        color: "#8A8EA3",
        fontSize: 14,
        marginTop: 12,
        fontWeight: "500" as const,
    },
    errorContainer: {
        flex: 1,
        justifyContent: "center" as const,
        alignItems: "center" as const,
        paddingVertical: 40,
    },
    errorText: {
        color: "#FF6B6B",
        fontSize: 16,
        fontWeight: "600" as const,
        textAlign: "center" as const,
    },
    errorSubtext: {
        color: "#8A8EA3",
        fontSize: 14,
        marginTop: 6,
        textAlign: "center" as const,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center" as const,
        alignItems: "center" as const,
        paddingVertical: 40,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    emptyTitle: {
        color: "white",
        fontSize: 18,
        fontWeight: "600" as const,
        marginBottom: 8,
        textAlign: "center" as const,
    },
    emptySubtext: {
        color: "#8A8EA3",
        fontSize: 14,
        textAlign: "center" as const,
        lineHeight: 20,
        maxWidth: 240,
    },
};
