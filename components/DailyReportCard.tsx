import { View, Pressable, Animated } from "react-native";
import { Text } from "@/components/Text";
import { colors } from "@/theme/colors";
import DailyChart from "@/components/DailyChart";
import { useRef, useEffect, useState } from "react";

export function DailyReportCard({
    avg,
    delta,
}: {
    avg: number;
    delta: number;
}) {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const glowAnim = useRef(new Animated.Value(0)).current;
    const [showChart, setShowChart] = useState(false);
    const chartHeightAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Subtle glow pulse animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(glowAnim, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: false,
                }),
                Animated.timing(glowAnim, {
                    toValue: 0,
                    duration: 2000,
                    useNativeDriver: false,
                }),
            ])
        ).start();
    }, [glowAnim]);

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.98,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 100,
            friction: 5,
            useNativeDriver: true,
        }).start();
    };

    const getAlignmentLevel = () => {
        if (avg >= 80)
            return { emoji: "🔥", label: "On Fire", color: colors.good };
        if (avg >= 60)
            return { emoji: "⚡", label: "Strong", color: colors.accent };
        if (avg >= 40)
            return { emoji: "🌱", label: "Growing", color: colors.warn };
        return { emoji: "🎯", label: "Building", color: colors.bad };
    };

    const alignmentLevel = getAlignmentLevel();

    const toggleChart = () => {
        setShowChart(!showChart);
        Animated.timing(chartHeightAnim, {
            toValue: showChart ? 0 : 1,
            duration: 300,
            useNativeDriver: false,
        }).start();
    };

    return (
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut}>
                <Animated.View
                    style={[
                        {
                            backgroundColor: colors.card,
                            borderRadius: 24,
                            padding: 0,
                            borderWidth: 1,
                            borderColor: colors.border,
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 8 },
                            shadowOpacity: 0.2,
                            shadowRadius: 16,
                            elevation: 12,
                            overflow: "hidden",
                        },
                        {
                            shadowOpacity: glowAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0.2, 0.35],
                            }),
                        },
                    ]}
                >
                    {/* Header Section with Gradient Effect */}
                    <View
                        style={{
                            padding: 20,
                            paddingBottom: 16,
                            backgroundColor: `${alignmentLevel.color}15`,
                            borderBottomWidth: 1,
                            borderBottomColor: `${alignmentLevel.color}20`,
                        }}
                    >
                        <View
                            style={{
                                flexDirection: "row",
                                justifyContent: "space-between",
                                alignItems: "flex-start",
                            }}
                        >
                            <View style={{ flex: 1 }}>
                                <Text
                                    style={{
                                        fontSize: 16,
                                        fontWeight: "600",
                                        color: colors.sub,
                                        marginBottom: 4,
                                        letterSpacing: 0.5,
                                    }}
                                >
                                    DAILY AVERAGE
                                </Text>
                                <View
                                    style={{
                                        flexDirection: "row",
                                        alignItems: "baseline",
                                        gap: 8,
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: 42,
                                            fontWeight: "800",
                                            color: alignmentLevel.color,
                                            lineHeight: 48,
                                            letterSpacing: -1,
                                        }}
                                    >
                                        {Math.round(avg)}%
                                    </Text>
                                    <View
                                        style={{
                                            backgroundColor:
                                                delta >= 0
                                                    ? "rgba(34, 197, 94, 0.15)"
                                                    : "rgba(239, 68, 68, 0.15)",
                                            paddingHorizontal: 8,
                                            paddingVertical: 4,
                                            borderRadius: 8,
                                        }}
                                    >
                                        <Text
                                            style={{
                                                fontSize: 14,
                                                fontWeight: "700",
                                                color:
                                                    delta >= 0
                                                        ? colors.good
                                                        : colors.bad,
                                            }}
                                        >
                                            {delta >= 0 ? "+" : ""}
                                            {Math.round(delta)}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                            <View style={{ alignItems: "center", gap: 4 }}>
                                <Text style={{ fontSize: 32 }}>
                                    {alignmentLevel.emoji}
                                </Text>
                                <Text
                                    style={{
                                        fontSize: 12,
                                        fontWeight: "600",
                                        color: alignmentLevel.color,
                                        letterSpacing: 0.5,
                                    }}
                                >
                                    {alignmentLevel.label}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Toggle Button */}
                    <Pressable
                        onPress={toggleChart}
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "center",
                            paddingVertical: 12,
                            borderBottomWidth: showChart ? 1 : 0,
                            borderBottomColor: `${colors.border}50`,
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 12,
                                fontWeight: "600",
                                color: colors.accent,
                                marginRight: 4,
                            }}
                        >
                            {showChart ? "Hide Details" : "Show Details"}
                        </Text>
                        <Text
                            style={{
                                fontSize: 12,
                                color: colors.accent,
                                transform: [
                                    { rotate: showChart ? "180deg" : "0deg" },
                                ],
                            }}
                        >
                            ▼
                        </Text>
                    </Pressable>

                    {/* Animated Chart Section */}
                    {showChart && (
                        <Animated.View
                            style={{
                                opacity: chartHeightAnim,
                                transform: [
                                    {
                                        scaleY: chartHeightAnim,
                                    },
                                ],
                                marginBottom: 20,
                            }}
                        >
                            <View style={{ paddingHorizontal: 0 }}>
                                <DailyChart key={`daily-chart-${Date.now()}`} />
                            </View>
                        </Animated.View>
                    )}
                </Animated.View>
            </Pressable>
        </Animated.View>
    );
}
