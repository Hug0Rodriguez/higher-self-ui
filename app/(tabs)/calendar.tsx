// app/(tabs)/calendar.tsx
import { useCallback, useMemo, useState } from "react";
import { View, Modal, Pressable } from "react-native";
import { Text } from "@/components/Text";
import { colors } from "@/theme/colors";
import { textStyles } from "@/theme/typography";
import { HeatCalendar } from "@/components/HeatCalendar";
import { DayDetailsCard } from "@/components/DayDetailsCard";
import {
    getAllSavedDates,
    getEntriesByDatesAveraged,
    type EntryDay,
} from "@/storage/entries";
import { useFocusEffect } from "expo-router";

function buildMonthGrid(date = new Date()) {
    const y = date.getFullYear(),
        m = date.getMonth();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => {
        const d = new Date(y, m, i + 1);
        const key = d.toISOString().slice(0, 10);
        return { key, label: String(i + 1) };
    });
}

export default function CalendarScreen() {
    const days = useMemo(() => buildMonthGrid(), []);
    const [byDate, setByDate] = useState<
        Record<string, { pct?: number; tags?: string[]; count?: number }>
    >({});
    const [openKey, setOpenKey] = useState<string | null>(null);

    const refreshMonth = useCallback(async () => {
        const savedDates = await getAllSavedDates();
        if (!savedDates.length) {
            setByDate({});
            return;
        }

        const keysInThisMonth = new Set(days.map((d) => d.key));
        const monthDates = savedDates.filter((k) => keysInThisMonth.has(k));
        if (!monthDates.length) {
            setByDate({});
            return;
        }

        // NEW: fetch averaged entries
        const entries: EntryDay[] = await getEntriesByDatesAveraged(monthDates);

        const map: Record<
            string,
            { pct?: number; tags?: string[]; count?: number }
        > = {};
        for (const e of entries) {
            map[e.date] = {
                pct: e.alignment_pct, // this is the average
                tags: e.answer_tags,
                count: e.samples?.length || 1, // number of samples contributing to avg
            };
        }
        setByDate(map);
    }, [days]);

    // Refresh whenever tab gains focus
    useFocusEffect(
        useCallback(() => {
            let active = true;
            (async () => {
                if (active) await refreshMonth();
            })();
            return () => {
                active = false;
            };
        }, [refreshMonth])
    );

    const picked = openKey ? byDate[openKey] : undefined;

    return (
        <View
            style={{
                flex: 1,
                backgroundColor: colors.bg,
                padding: 16,
                gap: 16,
            }}
        >
            <Text style={textStyles.h1}>Calendar</Text>
            <HeatCalendar days={days} byDate={byDate} onPick={setOpenKey} />

            <Modal
                visible={!!openKey}
                transparent
                animationType="fade"
                onRequestClose={() => setOpenKey(null)}
            >
                <Pressable
                    onPress={() => setOpenKey(null)}
                    style={{
                        flex: 1,
                        justifyContent: "center",
                        padding: 16,
                        backgroundColor: "rgba(0,0,0,0.5)",
                    }}
                >
                    <DayDetailsCard
                        date={openKey!}
                        pct={picked?.pct}
                        tags={picked?.tags}
                        count={picked?.count}
                    />
                </Pressable>
            </Modal>
        </View>
    );
}
