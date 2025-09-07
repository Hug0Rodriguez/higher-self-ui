// app/(tabs)/log.tsx
import { useMemo, useState } from "react";
import { View } from "react-native";
import { Text } from "@/components/Text";
import { colors } from "@/theme/colors";
import { textStyles } from "@/theme/typography";
import { AlignmentDial } from "@/components/AlignmentDial";
import { PromptCard } from "@/components/PromptCard";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Toast } from "@/components/Toast";
import { saveEntrySample } from "@/storage/entries";
import { AnimatedAtoms } from "@/components/AnimatedAtoms";

const PROMPTS = [
    {
        id: "drainer",
        title: "What action lowered you most today?",
        chips: [
            { key: "doomscroll", label: "Doomscroll" },
            { key: "skip_start", label: "Didn’t start" },
            { key: "junk_food", label: "Junk food" },
            { key: "late_night", label: "Late night" },
        ],
    },
    {
        id: "booster",
        title: "What action raised alignment most?",
        chips: [
            { key: "journal", label: "Journal" },
            { key: "meditate", label: "Meditate" },
            { key: "finish_task", label: "Finished task" },
            { key: "exercise", label: "Exercise" },
        ],
    },
    {
        id: "gavein",
        title: "Did you give in to a draining habit?",
        chips: [
            { key: "gaveIn", label: "Yes" },
            { key: "stayedStrong", label: "No" },
        ],
    },
];

export default function LogScreen() {
    const [pct, setPct] = useState(70);
    const [tags, setTags] = useState<string[]>([]);
    const [showToast, setShowToast] = useState(false);

    const prompt = useMemo(() => {
        const dayIndex = new Date().getDay();
        return PROMPTS[dayIndex % PROMPTS.length];
    }, []);

    function toggleTag(k: string) {
        setTags((t) => (t.includes(k) ? t.filter((x) => x !== k) : [...t, k]));
    }

    async function onSave() {
        await saveEntrySample({
            date: new Date().toISOString().slice(0, 10),
            alignment_pct: pct,
            prompt_id: prompt.id,
            answer_tags: tags,
        });
        setShowToast(true);
        setTimeout(() => setShowToast(false), 1200);
    }

    return (
        <View
            style={{
                flex: 1,
                backgroundColor: colors.bg,
                padding: 16,
                gap: 16,
            }}
        >
            <Text style={textStyles.h1}>Today</Text>
            <AnimatedAtoms level={pct} />
            <AlignmentDial value={pct} onChange={setPct} />
            <PromptCard
                title={prompt.title}
                chips={prompt.chips}
                value={tags}
                onToggle={toggleTag}
            />
            <PrimaryButton label="Save" onPress={onSave} />
            <Toast visible={showToast} msg="Saved" />
        </View>
    );
}
