// lib/reports.ts
import {
    getAllSavedDates,
    getEntriesByDatesAveraged,
    type EntryDay,
} from "@/storage/entries";

// --------- Utilities ---------
function isoAddDays(iso: string, delta: number) {
    const d = new Date(iso + "T00:00:00");
    d.setDate(d.getDate() + delta);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}
function inRange(iso: string, startISO: string, endISO: string) {
    return iso >= startISO && iso <= endISO;
}
function mean(nums: number[]) {
    return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
}
function round(n: number | undefined) {
    return n == null ? undefined : Math.round(n);
}

// --------- Range access ---------
export async function getEntriesInRange(
    startISO: string,
    endISO: string
): Promise<EntryDay[]> {
    const all = await getAllSavedDates();
    const wanted = all.filter((d) => inRange(d, startISO, endISO));
    return getEntriesByDatesAveraged(wanted);
}

// --------- 1) DAILY ---------
export async function getDailyValue(
    dateISO: string
): Promise<number | undefined> {
    const [d] = await getEntriesByDatesAveraged([dateISO]);
    return d?.alignment_pct;
}

// Sparkline buckets (morning / afternoon / night), uses timestamps when available.
// Legacy numeric-only samples are ignored for dayparting but still in the daily average.
export function buildDailySparkline(
    entry: EntryDay
): { part: "morning" | "afternoon" | "night"; value: number }[] {
    const buckets: Record<"morning" | "afternoon" | "night", number[]> = {
        morning: [],
        afternoon: [],
        night: [],
    };
    for (const s of entry.samples || []) {
        if (typeof s === "number") continue; // legacy
        const h = new Date(s.t).getHours();
        const part = h >= 5 && h < 12 ? "morning" : h >= 12 && h < 18 ? "afternoon" : "night";
        buckets[part].push(s.v);
    }
    const out: { part: "morning" | "afternoon" | "night"; value: number }[] =
        [];
    (["morning", "afternoon", "night"] as const).forEach((part) => {
        const m = round(mean(buckets[part]));
        if (m != null && !Number.isNaN(m)) out.push({ part, value: m });
    });
    return out;
}

// --------- 2) WEEKLY (7 bars) ---------
export async function getWeeklyBars(
    endDateISO: string
): Promise<{ date: string; value: number | null }[]> {
    const start = isoAddDays(endDateISO, -6);
    const entries = await getEntriesInRange(start, endDateISO);
    const map = new Map(entries.map((e) => [e.date, e.alignment_pct]));
    const bars: { date: string; value: number | null }[] = [];
    for (let i = 0; i < 7; i++) {
        const d = isoAddDays(start, i);
        bars.push({ date: d, value: map.get(d) ?? null }); // null = missing day (render a gap)
    }
    return bars;
}

// --------- 3) MONTHLY (rolling 30-day line) ---------
export async function getMonthlyTrend(
    endDateISO: string
): Promise<{ date: string; value: number }[]> {
    const start = isoAddDays(endDateISO, -29);
    const entries = await getEntriesInRange(start, endDateISO);
    const map = new Map(entries.map((e) => [e.date, e.alignment_pct]));
    const points: { date: string; value: number }[] = [];
    for (let i = 0; i < 30; i++) {
        const d = isoAddDays(start, i);
        const v = map.get(d);
        if (v != null) points.push({ date: d, value: v }); // keep drama by skipping nulls
    }
    return points;
}

// --------- 4) OVERALL (lifetime + comps) ---------
export async function getOverallAverages(): Promise<{
    lifetime_avg: number;
    last7_avg: number;
    last30_avg: number;
    current_day?: number;
}> {
    const dates = await getAllSavedDates();
    if (!dates.length) return { lifetime_avg: 0, last7_avg: 0, last30_avg: 0 };

    const all = await getEntriesByDatesAveraged(dates);
    const lifetime_avg = Math.round(mean(all.map((d) => d.alignment_pct)));

    const last = dates[dates.length - 1];
    const last7 = await getEntriesInRange(isoAddDays(last, -6), last);
    const last30 = await getEntriesInRange(isoAddDays(last, -29), last);

    const last7_avg = Math.round(mean(last7.map((d) => d.alignment_pct)));
    const last30_avg = Math.round(mean(last30.map((d) => d.alignment_pct)));

    return {
        lifetime_avg,
        last7_avg,
        last30_avg,
        current_day: all[all.length - 1]?.alignment_pct,
    };
}

// --------- 5) Snapshot (for your Reports top card) ---------
export async function getReportsSnapshot(endDateISO: string): Promise<{
    daily?: number;
    weekly_avg: number;
    monthly_avg: number;
    lifetime_avg: number;
}> {
    const daily = await getDailyValue(endDateISO);

    const last7 = await getEntriesInRange(
        isoAddDays(endDateISO, -6),
        endDateISO
    );
    const weekly_avg = Math.round(mean(last7.map((d) => d.alignment_pct)));

    const last30 = await getEntriesInRange(
        isoAddDays(endDateISO, -29),
        endDateISO
    );
    const monthly_avg = Math.round(mean(last30.map((d) => d.alignment_pct)));

    const dates = await getAllSavedDates();
    const all = dates.length ? await getEntriesByDatesAveraged(dates) : [];
    const lifetime_avg = Math.round(mean(all.map((d) => d.alignment_pct)));

    return { daily, weekly_avg, monthly_avg, lifetime_avg };
}
