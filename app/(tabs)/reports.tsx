import { ScrollView, View, ActivityIndicator } from "react-native";
import { Text } from "@/components/Text";
import { colors } from "@/theme/colors";
import { textStyles } from "@/theme/typography";
import { ReportCard } from "@/components/ReportCard";
import { DailyReportCard } from "@/components/DailyReportCard";
import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { getReportsSnapshot, getWeeklyBars } from "@/lib/reports";

interface ReportsData {
    daily?: number;
    weekly_avg: number;
    monthly_avg: number;
    lifetime_avg: number;
}

interface WeeklyTrendDay {
    date: string;
    value: number | null;
}

export default function ReportsScreen() {
    const [reportsData, setReportsData] = useState<ReportsData | null>(null);
    const [weeklyTrend, setWeeklyTrend] = useState<WeeklyTrendDay[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const todayKey = (() => {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
    })();

    const loadReportsData = useCallback(async () => {
        console.log("📈 ReportsScreen: Loading reports data for", todayKey);
        setLoading(true);
        setError(null);

        try {
            const [snapshot, weekly] = await Promise.all([
                getReportsSnapshot(todayKey),
                getWeeklyBars(todayKey),
            ]);

            console.log("📈 ReportsScreen: Data loaded:", {
                snapshot,
                weeklyLength: weekly?.length || 0,
            });

            setReportsData(snapshot);
            setWeeklyTrend(weekly || []);

            console.log("📈 ReportsScreen: State updated successfully");
        } catch (err) {
            console.error("📈 ReportsScreen: Error loading reports data:", err);
            setError("Failed to load reports data");
            // Set default empty data to prevent further errors
            setReportsData({
                weekly_avg: 0,
                monthly_avg: 0,
                lifetime_avg: 0,
            });
            setWeeklyTrend([]);
        } finally {
            setLoading(false);
        }
    }, [todayKey]);

    useEffect(() => {
        console.log(
            "📈 ReportsScreen: Component mounted, loading initial data"
        );
        loadReportsData();
    }, [loadReportsData]);

    useFocusEffect(
        useCallback(() => {
            console.log(
                "📈 ReportsScreen: Screen focused, refreshing reports data"
            );
            loadReportsData();
        }, [loadReportsData])
    );

    // Loading state
    if (loading) {
        return (
            <ScrollView
                style={{ flex: 1, backgroundColor: colors.bg }}
                contentContainerStyle={{ padding: 16, gap: 16 }}
            >
                <Text style={textStyles.h1}>Reports</Text>
                <View style={styles.loadingCard}>
                    <ActivityIndicator size="large" color={colors.accent} />
                    <Text style={[styles.loadingText, { color: colors.sub }]}>
                        Loading reports...
                    </Text>
                </View>
            </ScrollView>
        );
    }

    // Error state
    if (error) {
        return (
            <ScrollView
                style={{ flex: 1, backgroundColor: colors.bg }}
                contentContainerStyle={{ padding: 16, gap: 16 }}
            >
                <Text style={textStyles.h1}>Reports</Text>
                <View style={styles.errorCard}>
                    <Text style={styles.errorText}>⚠️ {error}</Text>
                    <Text style={[styles.errorSubtext, { color: colors.sub }]}>
                        Pull down to refresh
                    </Text>
                </View>
            </ScrollView>
        );
    }

    // No data state
    if (!reportsData) {
        return (
            <ScrollView
                style={{ flex: 1, backgroundColor: colors.bg }}
                contentContainerStyle={{ padding: 16, gap: 16 }}
            >
                <Text style={textStyles.h1}>Reports</Text>
                <View style={styles.emptyCard}>
                    <Text
                        style={[
                            styles.emptyText,
                            { color: colors.text || "#FFFFFF" },
                        ]}
                    >
                        No data available yet
                    </Text>
                    <Text style={[styles.emptySubtext, { color: colors.sub }]}>
                        Add some check-ins to see your reports
                    </Text>
                </View>
            </ScrollView>
        );
    }

    // Safe calculation of trend values
    const trendValues = weeklyTrend
        .map((day) => day?.value ?? null)
        .filter((val): val is number => val !== null);

    // Safe calculation of current and delta values
    const currentAvg = reportsData.daily ?? reportsData.weekly_avg ?? 0;
    const previousAvg = reportsData.weekly_avg ?? 0;
    const delta = Math.round((currentAvg - previousAvg) * 10) / 10; // Round to 1 decimal

    // Format percentage values safely
    const formatPct = (value: number | undefined): string => {
        return value !== undefined ? `${Math.round(value)}%` : "0%";
    };

    const formatDelta = (value: number): string => {
        const sign = value >= 0 ? "+" : "";
        return `${sign}${Math.round(value * 10) / 10}`;
    };

    const insightLines = [
        `Current: ${formatPct(currentAvg)} (${formatDelta(
            delta
        )} vs weekly avg)`,
        `Weekly average: ${formatPct(reportsData.weekly_avg)}`,
        `Monthly average: ${formatPct(reportsData.monthly_avg)}`,
        `Lifetime average: ${formatPct(reportsData.lifetime_avg)}`,
    ];

    return (
        <ScrollView
            style={{ flex: 1, backgroundColor: colors.bg }}
            contentContainerStyle={{ padding: 16, gap: 16 }}
        >
            <Text style={textStyles.h1}>Reports</Text>

            <ReportCard
                key={`report-card-${todayKey}-${currentAvg}-${Date.now()}`} // Force re-render when data changes
                title="Today"
                avg={currentAvg}
                delta={delta}
                drainers={[]} // TODO: Extract from entry data
                booster={undefined} // TODO: Extract from entry data
                autopilotPct={0} // TODO: Calculate from data
                gaveInDays={0} // TODO: Calculate from data
                trendValues={trendValues}
            />

            <DailyReportCard
                key={`daily-card-${todayKey}-${
                    reportsData.weekly_avg
                }-${Date.now()}`}
                avg={reportsData.weekly_avg}
                delta={reportsData.weekly_avg - reportsData.monthly_avg} // Weekly vs monthly comparison
            />

            <View style={styles.insightsCard}>
                <Text
                    style={[
                        styles.insightsTitle,
                        { color: colors.text || "#FFFFFF" },
                    ]}
                >
                    Insights
                </Text>
                {insightLines.map((line, index) => (
                    <Text
                        key={index}
                        style={[
                            styles.insightItem,
                            { color: colors.text || "#FFFFFF" },
                        ]}
                    >
                        • {line}
                    </Text>
                ))}
            </View>
        </ScrollView>
    );
}

const styles = {
    loadingCard: {
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 24,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: "center" as const,
        justifyContent: "center" as const,
        minHeight: 120,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        fontWeight: "500" as const,
    },
    errorCard: {
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 24,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: "center" as const,
        minHeight: 120,
        justifyContent: "center" as const,
    },
    errorText: {
        color: "#FF6B6B",
        fontSize: 16,
        fontWeight: "600" as const,
        textAlign: "center" as const,
        marginBottom: 8,
    },
    errorSubtext: {
        fontSize: 14,
        textAlign: "center" as const,
    },
    emptyCard: {
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 24,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: "center" as const,
        minHeight: 120,
        justifyContent: "center" as const,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: "600" as const,
        textAlign: "center" as const,
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        textAlign: "center" as const,
    },
    insightsCard: {
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },
    insightsTitle: {
        fontWeight: "700" as const,
        marginBottom: 12,
        fontSize: 16,
    },
    insightItem: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 4,
    },
};
