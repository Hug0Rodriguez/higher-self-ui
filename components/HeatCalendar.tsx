// components/HeatCalendar.tsx
import { View, Pressable } from "react-native";
import { Text } from "./Text";
import { colors } from "../theme/colors";
import { chakraColorForPct, chakras } from "../theme/chakras";

type DayCell = { key: string; label: string };
type ByDate = Record<string, { pct?: number; tags?: string[] }>;

export function HeatCalendar({
    days,
    byDate,
    onPick,
}: {
    days: DayCell[];
    byDate: ByDate;
    onPick: (key: string) => void;
}) {
    return (
        <View
            style={{
                backgroundColor: colors.card,
                borderRadius: 16,
                padding: 12,
                gap: 8,
                borderWidth: 1,
                borderColor: colors.border,
            }}
        >
            <Text style={{ fontWeight: "700" }}>This Month (Chakra View)</Text>

            {/* Grid: 8 columns x dynamic rows */}
            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                {days.map((d) => {
                    const pct = byDate[d.key]?.pct;
                    const bg = chakraColorForPct(pct);
                    const isEmpty = pct == null;
                    return (
                        <Pressable
                            key={d.key}
                            onPress={() => onPick(d.key)}
                            style={{
                                width: "12.5%",
                                aspectRatio: 1,
                                padding: 4,
                            }}
                        >
                            <View
                                style={{
                                    flex: 1,
                                    borderRadius: 8,
                                    backgroundColor: bg,
                                    opacity: isEmpty ? 0.25 : 0.95,
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <Text style={{ fontSize: 11 }}>{d.label}</Text>
                            </View>
                        </Pressable>
                    );
                })}
            </View>

            {/* Chakra legend */}
            <View style={{ marginTop: 8, gap: 6 }}>
                <Text dim>Chakra scale by alignment %</Text>
                <View
                    style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}
                >
                    <LegendChip color={chakras.root} label="0–14 Root" />
                    <LegendChip color={chakras.sacral} label="15–29 Sacral" />
                    <LegendChip color={chakras.solar} label="30–44 Solar" />
                    <LegendChip color={chakras.heart} label="45–59 Heart" />
                    <LegendChip color={chakras.throat} label="60–74 Throat" />
                    <LegendChip
                        color={chakras.thirdEye}
                        label="75–89 Third Eye"
                    />
                    <LegendChip color={chakras.crown} label="90–100 Crown" />
                </View>
            </View>
        </View>
    );
}

function LegendChip({ color, label }: { color: string; label: string }) {
    return (
        <View
            style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.08)",
            }}
        >
            <View
                style={{
                    width: 12,
                    height: 12,
                    borderRadius: 999,
                    backgroundColor: color,
                }}
            />
            <Text>{label}</Text>
        </View>
    );
}
