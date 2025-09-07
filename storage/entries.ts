// storage/entries.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

export type EntryDay = {
    date: string; // 'YYYY-MM-DD'
    // NEW: raw samples collected that day (each save pushes one sample)
    samples?: number[]; // e.g., [70, 75, 80]
    alignment_pct: number; // computed average of samples (or single value)
    prompt_id?: string;
    answer_tags?: string[]; // merged tags for the day (unique set)
    note?: string;
};

const KEY_ALL_DATES = "hs:dates";
const KEY_ENTRY = (date: string) => `hs:entry:${date}`;

// Utility
function uniq<T>(arr: T[] = []) {
    return Array.from(new Set(arr));
}
function avg(nums: number[]) {
    return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
}

// Append a sample for a day and recompute the average.
// Backward compatible: if an old entry only has alignment_pct, we start samples from that.
export async function saveEntrySample(e: {
    date: string;
    alignment_pct: number;
    prompt_id?: string;
    answer_tags?: string[];
    note?: string;
}): Promise<void> {
    const key = KEY_ENTRY(e.date);
    const raw = await AsyncStorage.getItem(key);
    let prev: EntryDay | undefined = raw
        ? (JSON.parse(raw) as EntryDay)
        : undefined;

    if (!prev) {
        // brand new day
        const samples = [e.alignment_pct];
        const entry: EntryDay = {
            date: e.date,
            samples,
            alignment_pct: Math.round(avg(samples)),
            prompt_id: e.prompt_id,
            answer_tags: uniq(e.answer_tags),
            note: e.note,
        };
        await AsyncStorage.setItem(key, JSON.stringify(entry));
    } else {
        // upgrade old single-value to samples array if needed
        const priorSamples =
            Array.isArray(prev.samples) && prev.samples.length
                ? prev.samples.slice()
                : [prev.alignment_pct];
        priorSamples.push(e.alignment_pct);

        const mergedTags = uniq([
            ...(prev.answer_tags || []),
            ...(e.answer_tags || []),
        ]);

        const entry: EntryDay = {
            ...prev,
            samples: priorSamples,
            alignment_pct: Math.round(avg(priorSamples)),
            prompt_id: e.prompt_id ?? prev.prompt_id,
            answer_tags: mergedTags,
            note: e.note ?? prev.note,
        };
        await AsyncStorage.setItem(key, JSON.stringify(entry));
    }

    // maintain date index
    const rawIdx = await AsyncStorage.getItem(KEY_ALL_DATES);
    const dates: string[] = rawIdx ? JSON.parse(rawIdx) : [];
    if (!dates.includes(e.date)) {
        dates.push(e.date);
        dates.sort();
        await AsyncStorage.setItem(KEY_ALL_DATES, JSON.stringify(dates));
    }
}

// Read one day (averaged)
export async function getEntryAveraged(
    date: string
): Promise<EntryDay | undefined> {
    const raw = await AsyncStorage.getItem(KEY_ENTRY(date));
    if (!raw) return undefined;
    const d = JSON.parse(raw) as EntryDay;
    if (!d.samples || !d.samples.length) {
        // backward compat: synthesize samples
        d.samples = [d.alignment_pct];
    }
    d.alignment_pct = Math.round(avg(d.samples));
    return d;
}

// Read many days (averaged)
export async function getEntriesByDatesAveraged(
    dateKeys: string[]
): Promise<EntryDay[]> {
    const keys = dateKeys.map(KEY_ENTRY);
    const pairs = await AsyncStorage.multiGet(keys);
    const out: EntryDay[] = [];
    for (const [, value] of pairs) {
        if (!value) continue;
        const d = JSON.parse(value) as EntryDay;
        if (!d.samples || !d.samples.length) d.samples = [d.alignment_pct];
        d.alignment_pct = Math.round(avg(d.samples));
        out.push(d);
    }
    return out.sort((a, b) => a.date.localeCompare(b.date));
}

// Existing helpers preserved
export async function getAllSavedDates(): Promise<string[]> {
    const raw = await AsyncStorage.getItem(KEY_ALL_DATES);
    return raw ? (JSON.parse(raw) as string[]) : [];
}

// Optional: wipe everything (dev helper)
export async function clearAll(): Promise<void> {
    const dates = await getAllSavedDates();
    const keys = dates.map(KEY_ENTRY);
    keys.push(KEY_ALL_DATES);
    await AsyncStorage.multiRemove(keys);
}
