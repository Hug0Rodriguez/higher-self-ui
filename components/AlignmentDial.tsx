import { View } from "react-native";
import Slider from "@react-native-community/slider";
import { Text } from "@/components/Text";
import { colors } from "@/theme/colors";

export function AlignmentDial({
    value,
    onChange,
}: {
    value: number;
    onChange: (n: number) => void;
}) {
    return (
        <View
            style={{
                backgroundColor: colors.card,
                borderRadius: 16,
                padding: 16,
            }}
        >
            <Text
                style={{ fontSize: 48, fontWeight: "800", textAlign: "center" }}
            >
                {value}%
            </Text>
            <Slider
                minimumValue={0}
                maximumValue={100}
                step={1}
                value={value}
                onValueChange={onChange}
                minimumTrackTintColor={colors.accent}
                maximumTrackTintColor={colors.neutral}
                thumbTintColor={colors.accent}
            />
            <Text dim style={{ textAlign: "center", marginTop: 8 }}>
                How aligned did you feel today?
            </Text>
        </View>
    );
}
