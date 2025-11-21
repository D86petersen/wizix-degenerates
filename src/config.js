// Configuration
export const config = {
    supabase: {
        url: import.meta.env.VITE_SUPABASE_URL || '',
        anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    },
    espn: {
        baseUrl: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl',
        endpoints: {
            scoreboard: '/scoreboard',
            teams: '/teams',
            summary: '/summary',
        },
        retryAttempts: 3,
        retryDelay: 1000,
        cacheTimeout: 30000, // 30 seconds
    },
    app: {
        name: import.meta.env.VITE_APP_NAME || 'Wizix Degenerates',
        currentSeason: parseInt(import.meta.env.VITE_CURRENT_SEASON) || 2024,
        refreshInterval: 30000, // 30 seconds for live games
        pickLockMinutes: 0, // Lock picks at game time
    },
};
