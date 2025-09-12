// DailyChart.tsx - Consumer-ready daily alignment chart
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

import { getWeeklyBars } from "@/lib/reports";
import { chakraColorForPct } from "@/theme/chakras";

const SpaceMono = require("@/assets/fonts/SpaceMono-Regular.ttf");

type WeekRow = { day: number; pct: number };

const { width: screenWidth } = Dimensions.get("window");
const CHART_PADDING = 24;
const CHART_WIDTH = screenWidth - CHART_PADDING * 2;

export default function DailyChart() {
    const font = useFont(SpaceMono, 11);
    const [data, setData] = useState<WeekRow[]>([]);
    const [weeklyAlignment, setWeeklyAlignment] = useState<number>(0);
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
        console.log(`📊 DailyChart: Today key generated: ${key}`);
        return key;
    }, []);

    // Get current day of week in chart format (0 = Monday, 6 = Sunday)
    const currentDayOfWeek = useMemo(() => {
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
        // Convert to our chart format: 0 = Monday, 6 = Sunday
        const chartDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        console.log(
            `📊 DailyChart: Today is ${
                ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dayOfWeek]
            } (${dayOfWeek}) -> chart day ${chartDay} (${
                ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][chartDay]
            })`
        );
        return chartDay;
    }, []);

    const loadData = useCallback(
        async (forceRefresh = false, retryCount = 0) => {
            const maxRetries = 3;
            console.log(`📊 DailyChart: Loading daily data for ${todayKey}`);

            if (forceRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }
            setError(null);

            try {
                const weeklyBars = await getWeeklyBars(todayKey);
                console.log(`📊 DailyChart: Raw daily data:`, weeklyBars);

                // Process daily data into chart format
                const chartData: WeekRow[] = weeklyBars
                    .map((bar) => {
                        // Parse date with local timezone to avoid UTC issues
                        const actualDayOfWeek = new Date(
                            bar.date + "T00:00:00"
                        ).getDay();
                        // Convert to Monday=0, Sunday=6 format for chart
                        const chartDay =
                            actualDayOfWeek === 0 ? 6 : actualDayOfWeek - 1;
                        console.log(
                            `📊 DailyChart: Date ${
                                bar.date
                            } -> day ${actualDayOfWeek} -> chart ${chartDay} (${
                                [
                                    "Mon",
                                    "Tue",
                                    "Wed",
                                    "Thu",
                                    "Fri",
                                    "Sat",
                                    "Sun",
                                ][chartDay]
                            })`
                        );
                        return {
                            day: chartDay,
                            pct: bar.value !== null ? Math.round(bar.value) : 0,
                        };
                    })
                    .filter((row) => row.pct >= 0); // Keep all valid data including 0%

                console.log(`📊 DailyChart: Processed chart data:`, chartData);

                // Calculate weekly average
                const validValues = chartData
                    .filter((d) => d.pct > 0)
                    .map((d) => d.pct);
                const weeklyAvg =
                    validValues.length > 0
                        ? validValues.reduce((a, b) => a + b, 0) /
                          validValues.length
                        : 0;

                setData(chartData);
                setWeeklyAlignment(weeklyAvg);

                console.log(
                    `📊 DailyChart: State updated - weekly avg: ${weeklyAvg}%`
                );

                // Trigger animations
                Animated.parallel([
                    Animated.timing(fadeAnim, {
                        toValue: 1,
                        duration: 600,
                        useNativeDriver: true,
                    }),
                    Animated.timing(slideAnim, {
                        toValue: 0,
                        duration: 600,
                        useNativeDriver: true,
                    }),
                    Animated.spring(chartScaleAnim, {
                        toValue: 1,
                        tension: 50,
                        friction: 8,
                        useNativeDriver: true,
                    }),
                ]).start();
            } catch (err) {
                console.error("📊 DailyChart: Data loading error:", err);

                // Retry logic
                if (retryCount < maxRetries) {
                    console.log(
                        `📊 DailyChart: Retrying... (${
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
                    setRefreshing(false);
                }
            }
        },
        [todayKey, error, fadeAnim, slideAnim, chartScaleAnim]
    );

    useEffect(() => {
        console.log("📊 DailyChart: Component mounted, loading initial data");
        loadData();
    }, [loadData]);

    useFocusEffect(
        useCallback(() => {
            console.log("📊 DailyChart: Screen focused, refreshing data");
            loadData(true); // Force refresh on focus
        }, [loadData])
    );

    const { chartData, xMin, xMax, hasMultiplePoints } = useMemo(() => {
        console.log(
            `📊 DailyChart: Processing chart data, data length: ${data.length}`,
            data
        );

        if (!data.length) {
            console.log(`📊 DailyChart: No data, returning empty chart`);
            return {
                chartData: [] as WeekRow[],
                xMin: 0,
                xMax: 6,
                hasMultiplePoints: false,
            };
        }

        const sortedData = [...data].sort((a, b) => a.day - b.day);
        console.log(`📊 DailyChart: Chart data processed:`, {
            dataPoints: sortedData.length,
            hasMultiplePoints: sortedData.length > 1,
            data: sortedData,
        });

        return {
            chartData: sortedData,
            xMin: 0,
            xMax: 6,
            hasMultiplePoints: sortedData.length > 1,
        };
    }, [data]);

    const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const formatX = (v: number) =>
        dayLabels[Math.round(Math.max(0, Math.min(6, v)))];
    const formatY = (v: number) => `${Math.round(v)}%`;

    const mainLineColor = chakraColorForPct(weeklyAlignment);

    // Loading state
    if (loading) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Daily Alignment</Text>
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
                    <Text style={styles.title}>Daily Alignment</Text>
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
    if (!chartData.length) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Daily Alignment</Text>
                </View>
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>📊</Text>
                    <Text style={styles.emptyTitle}>No data this week</Text>
                    <Text style={styles.emptySubtext}>
                        Add some check-ins to see your weekly alignment pattern
                    </Text>
                </View>
            </View>
        );
    }

    // Chart configuration
    const axisOptions = {
        tickCount: { x: 7, y: 5 },
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
                    <Text style={styles.title}>Daily Alignment</Text>
                    <Text
                        style={[
                            styles.alignmentValue,
                            { color: mainLineColor },
                        ]}
                    >
                        {Math.round(weeklyAlignment)}% avg
                    </Text>
                </View>
                <TouchableOpacity
                    onPress={() => {
                        console.log("📊 DailyChart: Manual refresh triggered");
                        loadData(true);
                    }}
                    style={styles.refreshButton}
                >
                    <Text style={styles.refreshButtonText}>↻ Refresh</Text>
                </TouchableOpacity>
            </View>

            {/* Data summary */}
            <View style={styles.summaryContainer}>
                {chartData.map((point, index) => {
                    const isToday = point.day === currentDayOfWeek;
                    return (
                        <View
                            key={index}
                            style={[
                                styles.summaryItem,
                                isToday && styles.summaryItemToday,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.summaryTime,
                                    isToday && styles.summaryTimeToday,
                                ]}
                            >
                                {formatX(point.day)}
                                {isToday && " • Today"}
                            </Text>
                            <Text
                                style={[
                                    styles.summaryValue,
                                    { color: mainLineColor },
                                    isToday && styles.summaryValueToday,
                                ]}
                            >
                                {point.pct}%
                            </Text>
                        </View>
                    );
                })}
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
                    data={chartData}
                    xKey="day"
                    yKeys={["pct"]}
                    domain={{ x: [xMin, xMax], y: [0, 100] }}
                    domainPadding={{
                        left: hasMultiplePoints ? 40 : 60,
                        right: hasMultiplePoints ? 40 : 60,
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

                                    const isToday =
                                        Math.round(point.x) ===
                                        currentDayOfWeek;
                                    const radius = isToday
                                        ? hasMultiplePoints
                                            ? 7
                                            : 10
                                        : hasMultiplePoints
                                        ? 5
                                        : 8;

                                    return (
                                        <Scatter
                                            key={`point-${index}`}
                                            points={[point]}
                                            radius={radius}
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

                                    const isToday =
                                        Math.round(point.x) ===
                                        currentDayOfWeek;
                                    const radius = isToday
                                        ? hasMultiplePoints
                                            ? 9
                                            : 12
                                        : hasMultiplePoints
                                        ? 7
                                        : 10;
                                    const strokeWidth = isToday ? 3 : 2;

                                    return (
                                        <Scatter
                                            key={`ring-${index}`}
                                            points={[point]}
                                            radius={radius}
                                            color={mainLineColor}
                                            style="stroke"
                                            strokeWidth={strokeWidth}
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
    summaryItemToday: {
        backgroundColor: "rgba(255,255,255,0.08)",
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.15)",
    },
    summaryTime: {
        color: "#8A8EA3",
        fontSize: 11,
        fontWeight: "500" as const,
        textTransform: "uppercase" as const,
        letterSpacing: 0.5,
    },
    summaryTimeToday: {
        color: "white",
        fontWeight: "600" as const,
    },
    summaryValue: {
        fontSize: 16,
        fontWeight: "700" as const,
        marginTop: 2,
    },
    summaryValueToday: {
        fontSize: 18,
        fontWeight: "800" as const,
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
