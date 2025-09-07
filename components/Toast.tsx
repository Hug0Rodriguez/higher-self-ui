import { useEffect, useRef } from "react";
import { Animated } from "react-native";
import { Text } from "@/components/Text";
import { colors } from "@/theme/colors";

export function Toast({ visible, msg }: { visible: boolean; msg: string }) {
    const opacity = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.timing(opacity, {
            toValue: visible ? 1 : 0,
            duration: 200,
            useNativeDriver: true,
        }).start();
    }, [visible]);
    if (!visible) return null;
    return (
        <Animated.View
            style={{
                position: "absolute",
                bottom: 24,
                left: 16,
                right: 16,
                opacity,
                backgroundColor: colors.card,
                borderRadius: 12,
                padding: 12,
                alignItems: "center",
                borderWidth: 1,
                borderColor: colors.border,
            }}
        >
            <Text>{msg}</Text>
        </Animated.View>
    );
}
