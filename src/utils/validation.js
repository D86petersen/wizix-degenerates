// Form validation utilities

/**
 * Validate email format
 */
export function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * Validate password strength
 * Requirements: At least 8 characters, 1 uppercase, 1 lowercase, 1 number
 */
export function validatePassword(password) {
    if (password.length < 8) {
        return { valid: false, message: 'Password must be at least 8 characters' };
    }

    if (!/[A-Z]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one uppercase letter' };
    }

    if (!/[a-z]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one lowercase letter' };
    }

    if (!/[0-9]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one number' };
    }

    return { valid: true, message: '' };
}

/**
 * Validate display name
 */
export function validateDisplayName(name) {
    if (!name || name.trim().length < 2) {
        return { valid: false, message: 'Display name must be at least 2 characters' };
    }

    if (name.length > 50) {
        return { valid: false, message: 'Display name must be less than 50 characters' };
    }

    return { valid: true, message: '' };
}

/**
 * Validate picks for a week
 */
export function validatePicks(picks, games) {
    if (!picks || picks.length === 0) {
        return { valid: false, message: 'You must make at least one pick' };
    }

    // Check if all games have picks
    const gameIds = games.map(g => g.id);
    const pickedGameIds = picks.map(p => p.gameId);

    const missingPicks = gameIds.filter(id => !pickedGameIds.includes(id));

    if (missingPicks.length > 0) {
        return {
            valid: false,
            message: `You must pick all ${games.length} games`
        };
    }

    return { valid: true, message: '' };
}

/**
 * Sanitize user input
 */
export function sanitizeInput(input) {
    if (typeof input !== 'string') return input;

    return input
        .trim()
        .replace(/[<>]/g, '') // Remove potential HTML tags
        .substring(0, 1000); // Limit length
}
