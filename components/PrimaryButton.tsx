import { Pressable, View } from "react-native";
import { Text } from "@/components/Text";
import { colors } from "../theme/colors";

export function PrimaryButton({
    label,
    onPress,
    disabled,
}: {
    label: string;
    onPress: () => void;
    disabled?: boolean;
}) {
    return (
        <Pressable
            onPress={onPress}
            disabled={!!disabled}
            style={{ opacity: disabled ? 0.6 : 1 }}
        >
            <View
                style={{
                    backgroundColor: colors.accent,
                    paddingVertical: 12,
                    borderRadius: 14,
                    alignItems: "center",
                }}
            >
                <Text style={{ fontWeight: "700" }}>{label}</Text>
            </View>
        </Pressable>
    );
}
