// DailyVibrationalDisplay.tsx - Shows current daily vibrational status
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { getEntryAveraged, type EntryDay } from "@/storage/entries";
import { chakraColorForPct, chakraLabelForPct } from "@/theme/chakras";
import { colors } from "@/theme/colors";

export function DailyVibrationalDisplay() {
    const [entry, setEntry] = useState<EntryDay | undefined>(undefined);
    const [loading, setLoading] = useState(true);

    const todayKey = useMemo(() => {
        const d = new Date();
        const y = d.getFullYear();
        const m = `${d.getMonth() + 1}`.padStart(2, "0");
        const day = `${d.getDate()}`.padStart(2, "0");
        return `${y}-${m}-${day}`;
    }, []);

    const loadData = useCallback(async () => {
        setLoading(true);
        const entryData = await getEntryAveraged(todayKey);
        setEntry(entryData);
        setLoading(false);
    }, [todayKey]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    if (loading) {
        return (
            <View
                style={{
                    backgroundColor: colors.bg2,
                    borderRadius: 16,
                    padding: 20,
                    marginHorizontal: 16,
                    marginVertical: 8,
                    alignItems: "center",
                }}
            >
                <Text style={{ color: colors.sub, fontSize: 14 }}>
                    Loading daily status...
                </Text>
            </View>
        );
    }

    if (!entry) {
        return (
            <View
                style={{
                    backgroundColor: colors.bg2,
                    borderRadius: 16,
                    padding: 20,
                    marginHorizontal: 16,
                    marginVertical: 8,
                    alignItems: "center",
                }}
            >
                <Text
                    style={{
                        color: colors.sub,
                        fontSize: 16,
                        fontWeight: "600",
                    }}
                >
                    No entries yet today
                </Text>
                <Text style={{ color: colors.sub, fontSize: 12, marginTop: 4 }}>
                    Start logging your alignment to see your vibrational status
                </Text>
            </View>
        );
    }

    const currentPct = entry.alignment_pct;
    const chakraColor = chakraColorForPct(currentPct);
    const chakraLabel = chakraLabelForPct(currentPct);
    const sampleCount = entry.samples?.length || 0;

    return (
        <View
            style={{
                backgroundColor: colors.bg2,
                borderRadius: 12,
                padding: 16,
                marginHorizontal: 0,
                marginVertical: 4,
            }}
        >
            {/* Header */}
            <View
                style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 12,
                }}
            >
                <Text
                    style={{
                        color: colors.text,
                        fontSize: 16,
                        fontWeight: "600",
                    }}
                >
                    Today's Vibration
                </Text>
                <TouchableOpacity
                    onPress={loadData}
                    style={{
                        backgroundColor: "rgba(255,255,255,0.10)",
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 8,
                    }}
                >
                    <Text style={{ color: colors.text, fontSize: 12 }}>
                        Refresh
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Main Status - Compact */}
            <View
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 20,
                }}
            >
                <View style={{ alignItems: "center" }}>
                    <Text
                        style={{
                            color: colors.sub,
                            fontSize: 12,
                            marginBottom: 4,
                        }}
                    >
                        Current Alignment
                    </Text>
                    <Text
                        style={{
                            color: colors.text,
                            fontSize: 28,
                            fontWeight: "700",
                        }}
                    >
                        {currentPct}%
                    </Text>
                </View>

                <View style={{ alignItems: "center" }}>
                    <View
                        style={{
                            width: 50,
                            height: 50,
                            borderRadius: 25,
                            backgroundColor: chakraColor,
                            justifyContent: "center",
                            alignItems: "center",
                            marginBottom: 6,
                        }}
                    >
                        <Text
                            style={{
                                color: "white",
                                fontSize: 11,
                                fontWeight: "600",
                            }}
                        >
                            {chakraLabel.split(" ")[0]}
                        </Text>
                    </View>
                    <Text
                        style={{
                            color: chakraColor,
                            fontSize: 12,
                            fontWeight: "600",
                        }}
                    >
                        {chakraLabel}
                    </Text>
                </View>
            </View>
        </View>
    );
}
