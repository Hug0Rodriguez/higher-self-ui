// lib/time-periods.ts

export type TimePeriod = 'morning' | 'afternoon' | 'night';

/**
 * Determines the time period based on hour of day
 * Morning: 5am-12pm
 * Afternoon: 12pm-6pm  
 * Night: 6pm-5am
 */
export function getTimePeriod(timestamp: string | Date): TimePeriod {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    const hour = date.getHours();
    
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    return 'night';
}

/**
 * Gets a human-readable label for the time period
 */
export function getTimePeriodLabel(period: TimePeriod): string {
    switch (period) {
        case 'morning': return '🌅 Morning (5am-12pm)';
        case 'afternoon': return '☀️ Afternoon (12pm-6pm)';
        case 'night': return '🌙 Night (6pm-5am)';
    }
}

/**
 * Gets emoji for the time period
 */
export function getTimePeriodEmoji(period: TimePeriod): string {
    switch (period) {
        case 'morning': return '🌅';
        case 'afternoon': return '☀️';
        case 'night': return '🌙';
    }
}

/**
 * Converts time period to array index for bucketing
 */
export function timePeriodToIndex(period: TimePeriod): number {
    return period === 'morning' ? 0 : period === 'afternoon' ? 1 : 2;
}