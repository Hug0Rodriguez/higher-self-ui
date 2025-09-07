import { View } from "react-native";
import { Text } from "@/components/Text";
import { colors } from "@/theme/colors";
import { MiniTrend } from "@/components/MiniTrend";

function Badge({ label }: { label: string }) {
    return (
        <View
            style={{
                borderColor: colors.border,
                borderWidth: 1,
                borderRadius: 999,
                paddingVertical: 6,
                paddingHorizontal: 10,
            }}
        >
            <Text>{label}</Text>
        </View>
    );
}

export function ReportCard({
    title,
    avg,
    delta,
    drainers,
    booster,
    autopilotPct,
    gaveInDays,
    trendValues,
}: {
    title: string;
    avg: number;
    delta: number;
    drainers: string[];
    booster?: string;
    autopilotPct: number;
    gaveInDays: number;
    trendValues: number[];
}) {
    return (
        <View
            style={{
                backgroundColor: colors.card,
                borderRadius: 16,
                padding: 16,
                gap: 10,
                borderWidth: 1,
                borderColor: colors.border,
            }}
        >
            <Text style={{ fontWeight: "700" }}>{title}</Text>
            <Text style={{ fontSize: 30, fontWeight: "800" }}>
                {avg}%{" "}
                <Text dim>
                    ({delta >= 0 ? "+" : ""}
                    {delta})
                </Text>
            </Text>
            <MiniTrend values={trendValues} />
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {!!drainers.length && (
                    <Badge label={`Drainers: ${drainers.join(", ")}`} />
                )}
                {!!booster && <Badge label={`Booster: ${booster}`} />}
                <Badge label={`Autopilot: ${autopilotPct}%`} />
                <Badge label={`Gave in: ${gaveInDays}d`} />
            </View>
        </View>
    );
}
