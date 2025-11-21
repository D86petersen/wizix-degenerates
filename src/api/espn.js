// ESPN API Service with error handling and fallbacks
import { config } from '../config.js';

class ESPNService {
    constructor() {
        this.cache = new Map();
        this.teams = null;
    }

    /**
     * Make API request with retry logic and error handling
     */
    async fetchWithRetry(url, attempts = config.espn.retryAttempts) {
        for (let i = 0; i < attempts; i++) {
            try {
                const response = await fetch(url);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                return { success: true, data };
            } catch (error) {
                console.warn(`ESPN API attempt ${i + 1} failed:`, error.message);

                if (i === attempts - 1) {
                    return {
                        success: false,
                        error: error.message,
                        fallback: true
                    };
                }

                // Wait before retry
                await new Promise(resolve =>
                    setTimeout(resolve, config.espn.retryDelay * (i + 1))
                );
            }
        }
    }

    /**
     * Get cached data if available and not expired
     */
    getCached(key) {
        const cached = this.cache.get(key);

        if (!cached) return null;

        const now = Date.now();
        if (now - cached.timestamp > config.espn.cacheTimeout) {
            this.cache.delete(key);
            return null;
        }

        return cached.data;
    }

    /**
     * Set cache data
     */
    setCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
        });
    }

    /**
     * Get scoreboard for a specific week
     */
    async getScoreboard(week = null, season = config.app.currentSeason, seasonType = 2) {
        const cacheKey = `scoreboard_${season}_${seasonType}_${week}`;
        const cached = this.getCached(cacheKey);

        if (cached) {
            return { success: true, data: cached, cached: true };
        }

        let url = `${config.espn.baseUrl}${config.espn.endpoints.scoreboard}`;
        url += `?seasontype=${seasonType}`;

        if (week) {
            url += `&week=${week}`;
        }

        const result = await this.fetchWithRetry(url);

        if (result.success) {
            const games = this.parseScoreboard(result.data);
            this.setCache(cacheKey, games);
            return { success: true, data: games };
        }

        return {
            success: false,
            error: result.error,
            data: [],
            fallback: true,
        };
    }

    /**
     * Parse scoreboard response
     */
    parseScoreboard(data) {
        if (!data.events || !Array.isArray(data.events)) {
            return [];
        }

        return data.events.map(event => {
            const competition = event.competitions[0];
            const homeTeam = competition.competitors.find(c => c.homeAway === 'home');
            const awayTeam = competition.competitors.find(c => c.homeAway === 'away');

            return {
                id: event.id,
                name: event.name,
                shortName: event.shortName,
                date: event.date,
                status: {
                    type: competition.status.type.name,
                    detail: competition.status.type.detail,
                    completed: competition.status.type.completed,
                    inProgress: competition.status.type.name === 'STATUS_IN_PROGRESS',
                },
                homeTeam: {
                    id: homeTeam.id,
                    name: homeTeam.team.name,
                    displayName: homeTeam.team.displayName,
                    abbreviation: homeTeam.team.abbreviation,
                    logo: homeTeam.team.logo,
                    score: parseInt(homeTeam.score) || 0,
                    winner: homeTeam.winner || false,
                },
                awayTeam: {
                    id: awayTeam.id,
                    name: awayTeam.team.name,
                    displayName: awayTeam.team.displayName,
                    abbreviation: awayTeam.team.abbreviation,
                    logo: awayTeam.team.logo,
                    score: parseInt(awayTeam.score) || 0,
                    winner: awayTeam.winner || false,
                },
                week: data.week?.number || null,
                season: data.season?.year || config.app.currentSeason,
            };
        });
    }

    /**
     * Get all NFL teams
     */
    async getTeams() {
        // Return cached teams if available
        if (this.teams) {
            return { success: true, data: this.teams, cached: true };
        }

        const cacheKey = 'teams';
        const cached = this.getCached(cacheKey);

        if (cached) {
            this.teams = cached;
            return { success: true, data: cached, cached: true };
        }

        const url = `${config.espn.baseUrl}${config.espn.endpoints.teams}`;
        const result = await this.fetchWithRetry(url);

        if (result.success) {
            const teams = this.parseTeams(result.data);
            this.teams = teams;
            this.setCache(cacheKey, teams);
            return { success: true, data: teams };
        }

        return {
            success: false,
            error: result.error,
            data: [],
            fallback: true,
        };
    }

    /**
     * Parse teams response
     */
    parseTeams(data) {
        if (!data.sports || !data.sports[0] || !data.sports[0].leagues) {
            return [];
        }

        const teams = data.sports[0].leagues[0].teams;

        return teams.map(item => {
            const team = item.team;
            return {
                id: team.id,
                name: team.name,
                displayName: team.displayName,
                abbreviation: team.abbreviation,
                logo: team.logos?.[0]?.href || '',
                color: team.color || '000000',
                alternateColor: team.alternateColor || 'FFFFFF',
            };
        });
    }

    /**
     * Get game summary (detailed info)
     */
    async getGameSummary(eventId) {
        const cacheKey = `summary_${eventId}`;
        const cached = this.getCached(cacheKey);

        if (cached) {
            return { success: true, data: cached, cached: true };
        }

        const url = `${config.espn.baseUrl}${config.espn.endpoints.summary}?event=${eventId}`;
        const result = await this.fetchWithRetry(url);

        if (result.success) {
            this.setCache(cacheKey, result.data);
            return { success: true, data: result.data };
        }

        return {
            success: false,
            error: result.error,
            fallback: true,
        };
    }

    /**
     * Get live games only
     */
    async getLiveGames(week = null, season = config.app.currentSeason) {
        const scoreboardResult = await this.getScoreboard(week, season);

        if (!scoreboardResult.success) {
            return scoreboardResult;
        }

        const liveGames = scoreboardResult.data.filter(game => game.status.inProgress);

        return {
            success: true,
            data: liveGames,
            cached: scoreboardResult.cached,
        };
    }

    /**
     * Get team by ID
     */
    async getTeamById(teamId) {
        const teamsResult = await this.getTeams();

        if (!teamsResult.success) {
            return null;
        }

        return teamsResult.data.find(team => team.id === teamId);
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
        this.teams = null;
    }

    /**
     * Clear specific cache entry
     */
    clearCacheEntry(key) {
        this.cache.delete(key);
    }
}

// Export singleton instance
export const espnService = new ESPNService();
