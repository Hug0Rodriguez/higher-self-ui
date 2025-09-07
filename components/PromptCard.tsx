import { View, Pressable } from "react-native";
import { Text } from "@/components/Text";
import { colors } from "@/theme/colors";

export function PromptCard({
    title,
    chips,
    value,
    onToggle,
}: {
    title: string;
    chips: { key: string; label: string }[];
    value: string[];
    onToggle: (k: string) => void;
}) {
    return (
        <View
            style={{
                backgroundColor: colors.card,
                borderRadius: 16,
                padding: 16,
                gap: 12,
            }}
        >
            <Text style={{ fontWeight: "700", fontSize: 16 }}>{title}</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {chips.map((c) => {
                    const active = value.includes(c.key);
                    return (
                        <Pressable
                            key={c.key}
                            onPress={() => onToggle(c.key)}
                            style={{
                                borderRadius: 999,
                                borderWidth: 1,
                                borderColor: active
                                    ? colors.accent
                                    : colors.border,
                                paddingVertical: 8,
                                paddingHorizontal: 12,
                                backgroundColor: active
                                    ? "#2B2240"
                                    : "transparent",
                            }}
                        >
                            <Text style={{ fontWeight: "600" }}>{c.label}</Text>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}
