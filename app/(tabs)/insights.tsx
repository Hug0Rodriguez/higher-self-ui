import { View } from "react-native";
import { Text } from "@/components/Text";
import { colors } from "@/theme/colors";
import { textStyles } from "@/theme/typography";

export default function InsightsScreen() {
    // UI-only inline placeholders; NO external state
    const bullets = [
        "Night scrolling often precedes low days.",
        "Morning journaling appears on your best days.",
    ];
    const suggestion = "Journal in the morning";

    return (
        <View
            style={{
                flex: 1,
                backgroundColor: colors.bg,
                padding: 16,
                gap: 16,
            }}
        >
            <Text style={textStyles.h1}>Insights</Text>
            <View
                style={{
                    backgroundColor: colors.card,
                    borderRadius: 16,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: colors.border,
                }}
            >
                <Text style={{ fontWeight: "700" }}>This Week You Noticed</Text>
                {bullets.slice(0, 2).map((b, i) => (
                    <Text key={i} style={{ marginTop: 6 }}>
                        • {b}
                    </Text>
                ))}
                <View
                    style={{
                        marginTop: 10,
                        alignSelf: "flex-start",
                        borderColor: colors.accent,
                        borderWidth: 1,
                        borderRadius: 999,
                        paddingVertical: 6,
                        paddingHorizontal: 12,
                    }}
                >
                    <Text>Try next week: {suggestion}</Text>
                </View>
            </View>
        </View>
    );
}
