import { ScrollView, View } from "react-native";
import { Text } from "@/components/Text";
import { colors } from "@/theme/colors";
import { textStyles } from "@/theme/typography";
import { ReportCard } from "@/components/ReportCard";

export default function ReportsScreen() {
    // UI-only placeholders (inline so there is NO external mock/state)
    const week = {
        avg: 72,
        delta: +6,
        drainers: ["doomscroll", "late_night"],
        booster: "journal",
        autopilotPct: 43,
        gaveInDays: 2,
        trend: [60, 64, 62, 70, 72, 78, 80],
    };

    const month = {
        avg: 69,
        delta: +3,
        drainers: ["skip_start"],
        booster: "exercise",
        autopilotPct: 39,
        gaveInDays: 7,
        trend: [55, 58, 60, 62, 64, 66, 69, 70, 72, 68, 71, 69, 70, 73],
    };

    const insightLines = [
        "Trending upward (+6 vs last week).",
        "Frequent drainer: late_night.",
        "Helpful booster: journal.",
    ];

    return (
        <ScrollView
            style={{ flex: 1, backgroundColor: colors.bg }}
            contentContainerStyle={{ padding: 16, gap: 16 }}
        >
            <Text style={textStyles.h1}>Reports</Text>
            <ReportCard
                title="This Week"
                avg={week.avg}
                delta={week.delta}
                drainers={week.drainers}
                booster={week.booster}
                autopilotPct={week.autopilotPct}
                gaveInDays={week.gaveInDays}
                trendValues={week.trend}
            />
            <ReportCard
                title="This Month"
                avg={month.avg}
                delta={month.delta}
                drainers={month.drainers}
                booster={month.booster}
                autopilotPct={month.autopilotPct}
                gaveInDays={month.gaveInDays}
                trendValues={month.trend}
            />
            <View
                style={{
                    backgroundColor: colors.card,
                    borderRadius: 16,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: colors.border,
                }}
            >
                <Text style={{ fontWeight: "700", marginBottom: 8 }}>
                    Insights
                </Text>
                {insightLines.map((s, i) => (
                    <Text key={i}>• {s}</Text>
                ))}
            </View>
        </ScrollView>
    );
}
