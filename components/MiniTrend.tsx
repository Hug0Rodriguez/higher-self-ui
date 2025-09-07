import { View } from "react-native";
import { colors } from "@/theme/colors";

export function MiniTrend({ values }: { values: number[] }) {
    const max = Math.max(1, ...values);
    return (
        <View
            style={{
                height: 36,
                flexDirection: "row",
                gap: 2,
                alignItems: "flex-end",
            }}
        >
            {values.map((v, i) => (
                <View
                    key={i}
                    style={{
                        width: 6,
                        height: (v / max) * 36,
                        backgroundColor: colors.accent,
                        borderRadius: 2,
                    }}
                />
            ))}
        </View>
    );
}
