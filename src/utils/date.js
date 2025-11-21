// Date and time utilities

/**
 * Format a date string to a readable format
 */
export function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    });
}

/**
 * Format a date string to include time
 */
export function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
}

/**
 * Format time only
 */
export function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
}

/**
 * Check if a game has started (for pick locking)
 */
export function hasGameStarted(gameTime, lockMinutesBefore = 0) {
    const now = new Date();
    const gameDate = new Date(gameTime);
    const lockTime = new Date(gameDate.getTime() - lockMinutesBefore * 60000);
    return now >= lockTime;
}

/**
 * Calculate current NFL week based on season start
 * NFL season typically starts first Thursday of September
 */
export function getCurrentNFLWeek(season = 2024) {
    const now = new Date();

    // Find first Thursday of September for the given season
    const september = new Date(season, 8, 1); // Month is 0-indexed
    const firstThursday = new Date(september);

    // Find first Thursday
    while (firstThursday.getDay() !== 4) {
        firstThursday.setDate(firstThursday.getDate() + 1);
    }

    // Calculate weeks since season start
    const diffTime = now - firstThursday;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const week = Math.floor(diffDays / 7) + 1;

    // NFL regular season is 18 weeks
    if (week < 1) return 1;
    if (week > 18) return 18;

    return week;
}

/**
 * Get relative time string (e.g., "2 hours ago", "in 3 days")
 */
export function getRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date - now;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMs < 0) {
        // Past
        const absMins = Math.abs(diffMins);
        const absHours = Math.abs(diffHours);
        const absDays = Math.abs(diffDays);

        if (absMins < 60) return `${absMins}m ago`;
        if (absHours < 24) return `${absHours}h ago`;
        return `${absDays}d ago`;
    } else {
        // Future
        if (diffMins < 60) return `in ${diffMins}m`;
        if (diffHours < 24) return `in ${diffHours}h`;
        return `in ${diffDays}d`;
    }
}

/**
 * Check if date is today
 */
export function isToday(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    return date.toDateString() === today.toDateString();
}

/**
 * Get day of week
 */
export function getDayOfWeek(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long' });
}
