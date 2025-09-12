// storage/entries.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

export type Sample = { v: number; t: string }; // value + ISO timestamp

export type EntryDay = {
    date: string; // 'YYYY-MM-DD'
    samples?: Sample[];
    alignment_pct: number; // computed average of samples (rounded 0-100)
    prompt_id?: string;
    answer_tags?: string[]; // unique set
    note?: string;
};

const KEY_ALL_DATES = "hs:dates";
const KEY_ENTRY = (date: string) => `hs:entry:${date}`;

// ---------------- Utilities ----------------
function uniq<T>(arr: T[] = []) {
    return Array.from(new Set(arr));
}
function avg(nums: number[]) {
    return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
}
function clamp01to100(n: number) {
    return Math.max(0, Math.min(100, n));
}
function toISODate(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

// ---------------- Core Save ----------------
/**
 * Append a sample for a day and recompute the average.
 * Backward compatible: if an old entry only has alignment_pct, we start samples from that.
 * Adds timestamps so you can build intra-day sparklines (morning/afternoon/night).
 */
export async function saveEntrySample(e: {
    date: string; // 'YYYY-MM-DD'
    alignment_pct: number; // 0-100
    prompt_id?: string;
    answer_tags?: string[];
    note?: string;
}): Promise<void> {
    const key = KEY_ENTRY(e.date);
    const raw = await AsyncStorage.getItem(key);
    let prev: EntryDay | undefined = raw
        ? (JSON.parse(raw) as EntryDay)
        : undefined;

    const nowISO = new Date().toISOString();
    const newSample: Sample = { v: clamp01to100(e.alignment_pct), t: nowISO };

    if (!prev) {
        // brand new day
        const samples: Sample[] = [newSample];
        const entry: EntryDay = {
            date: e.date,
            samples,
            alignment_pct: Math.round(avg(samples.map((s) => s.v))),
            prompt_id: e.prompt_id,
            answer_tags: uniq(e.answer_tags),
            note: e.note,
        };
        await AsyncStorage.setItem(key, JSON.stringify(entry));
    } else {
        // add new sample to existing samples
        const priorSamples: Sample[] = Array.isArray(prev.samples)
            ? prev.samples.slice()
            : [];

        priorSamples.push(newSample);

        const mergedTags = uniq([
            ...(prev.answer_tags || []),
            ...(e.answer_tags || []),
        ]);

        const entry: EntryDay = {
            ...prev,
            samples: priorSamples,
            alignment_pct: Math.round(avg(priorSamples.map((s) => s.v))),
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
        dates.sort(); // lexicographic works for ISO dates
        await AsyncStorage.setItem(KEY_ALL_DATES, JSON.stringify(dates));
    }
}

// ---------------- Reads (averaged) ----------------
export async function getEntryAveraged(
    date: string
): Promise<EntryDay | undefined> {
    const raw = await AsyncStorage.getItem(KEY_ENTRY(date));
    if (!raw) return undefined;
    const d = JSON.parse(raw) as EntryDay;

    // Clean up any legacy data and ensure we have proper V2 samples
    if (d.samples && d.samples.length > 0) {
        // Filter out any legacy V1 samples (numbers) and keep only V2 samples
        const cleanSamples = d.samples.filter(
            (s): s is Sample => typeof s === "object" && "v" in s && "t" in s
        );
        d.samples = cleanSamples;
        d.alignment_pct = Math.round(avg(cleanSamples.map((s) => s.v)));
    } else {
        // If no samples, create a default sample from the alignment_pct
        const nowISO = new Date().toISOString();
        d.samples = [{ v: d.alignment_pct || 0, t: nowISO }];
    }

    return d;
}

export async function getEntriesByDatesAveraged(
    dateKeys: string[]
): Promise<EntryDay[]> {
    const keys = dateKeys.map(KEY_ENTRY);
    const pairs = await AsyncStorage.multiGet(keys);
    const out: EntryDay[] = [];
    for (const [, value] of pairs) {
        if (!value) continue;
        const d = JSON.parse(value) as EntryDay;

        // Clean up any legacy data and ensure we have proper V2 samples
        if (d.samples && d.samples.length > 0) {
            // Filter out any legacy V1 samples (numbers) and keep only V2 samples
            const cleanSamples = d.samples.filter(
                (s): s is Sample =>
                    typeof s === "object" && "v" in s && "t" in s
            );
            d.samples = cleanSamples;
            d.alignment_pct = Math.round(avg(cleanSamples.map((s) => s.v)));
        } else {
            // If no samples, create a default sample from the alignment_pct
            const nowISO = new Date().toISOString();
            d.samples = [{ v: d.alignment_pct || 0, t: nowISO }];
        }

        out.push(d);
    }
    return out.sort((a, b) => a.date.localeCompare(b.date));
}

// ---------------- Index helpers ----------------
export async function getAllSavedDates(): Promise<string[]> {
    const raw = await AsyncStorage.getItem(KEY_ALL_DATES);
    return raw ? (JSON.parse(raw) as string[]) : [];
}

// ---------------- Dev helper ----------------
export async function clearAll(): Promise<void> {
    const dates = await getAllSavedDates();
    const keys = dates.map(KEY_ENTRY);
    keys.push(KEY_ALL_DATES);
    await AsyncStorage.multiRemove(keys);
}

// ---------------- Convenience (optional) ----------------
export function todayISO(): string {
    return toISODate(new Date());
}
