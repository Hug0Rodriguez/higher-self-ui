// components/DayDetailsCard.tsx
import { View } from "react-native";
import { Text } from "./Text";
import { colors } from "@/theme/colors";
import { chakraColorForPct, chakraLabelForPct } from "@/theme/chakras";

export function DayDetailsCard({
    date,
    pct,
    tags,
    count,
}: {
    date: string;
    pct?: number;
    tags?: string[];
    count?: number;
}) {
    const pillColor = chakraColorForPct(pct);
    const label = chakraLabelForPct(pct);

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
            <Text style={{ fontWeight: "700" }}>{date}</Text>
            <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
                <View
                    style={{
                        width: 10,
                        height: 10,
                        borderRadius: 999,
                        backgroundColor: pillColor,
                    }}
                />
                <Text style={{ fontSize: 28, fontWeight: "800" }}>
                    {pct != null ? `${pct}%` : "No entry"}
                </Text>
                <Text dim>• {label}</Text>
                <Text dim>• {count} samples</Text>
            </View>
            {!!tags?.length && (
                <View
                    style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}
                >
                    {tags.map((t) => (
                        <View
                            key={t}
                            style={{
                                borderColor: colors.border,
                                borderWidth: 1,
                                borderRadius: 999,
                                paddingVertical: 6,
                                paddingHorizontal: 10,
                            }}
                        >
                            <Text>{t}</Text>
                        </View>
                    ))}
                </View>
            )}
        </View>
    );
}
