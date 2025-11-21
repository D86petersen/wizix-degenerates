// Real-time scoring service
import { espnService } from '../api/espn.js';
import { db } from '../api/supabase.js';
import { config } from '../config.js';
import { getCurrentNFLWeek } from '../utils/date.js';

class ScoringService {
    constructor() {
        this.updateInterval = null;
        this.isRunning = false;
    }

    /**
     * Start real-time score updates
     */
    start() {
        if (this.isRunning) return;

        this.isRunning = true;
        console.log('🔴 Starting real-time score updates...');

        // Initial update
        this.updateScores();

        // Set up interval
        this.updateInterval = setInterval(() => {
            this.updateScores();
        }, config.app.refreshInterval);
    }

    /**
     * Stop real-time updates
     */
    stop() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        this.isRunning = false;
        console.log('⏹️ Stopped real-time score updates');
    }

    /**
     * Update scores from ESPN and cache in database
     */
    async updateScores() {
        try {
            const currentWeek = getCurrentNFLWeek(config.app.currentSeason);

            // Fetch latest scores from ESPN
            const result = await espnService.getScoreboard(currentWeek);

            if (!result.success) {
                console.error('Failed to fetch scores:', result.error);
                return;
            }

            const games = result.data;

            // Cache each game in database
            for (const game of games) {
                await db.cacheGame({
                    espn_event_id: game.id,
                    week: game.week,
                    season: game.season,
                    home_team_id: game.homeTeam.id,
                    away_team_id: game.awayTeam.id,
                    home_score: game.homeTeam.score,
                    away_score: game.awayTeam.score,
                    game_status: game.status.type,
                    game_time: game.date,
                    last_updated: new Date().toISOString(),
                });
            }

            // Update pick results for completed games
            const completedGames = games.filter(g => g.status.completed);

            for (const game of completedGames) {
                await this.updatePickResults(game);
            }

            console.log(`✅ Updated ${games.length} games (${completedGames.length} completed)`);
        } catch (error) {
            console.error('Error updating scores:', error);
        }
    }

    /**
     * Update pick results for a completed game
     */
    async updatePickResults(game) {
        try {
            // Determine winner
            const winnerId = game.homeTeam.winner
                ? game.homeTeam.id
                : game.awayTeam.winner
                    ? game.awayTeam.id
                    : null;

            if (!winnerId) {
                console.warn(`No winner determined for game ${game.id}`);
                return;
            }

            // This would need to be done via a Supabase function or edge function
            // For now, we'll just log it
            console.log(`Game ${game.id} winner: ${winnerId}`);

            // In a production app, you'd call a Supabase function here to update all picks
            // for this game in a single transaction
        } catch (error) {
            console.error('Error updating pick results:', error);
        }
    }

    /**
     * Manually calculate and update all pick results for a week
     */
    async calculateWeekResults(week, season, poolId) {
        try {
            // Get all games for the week
            const gamesResult = await espnService.getScoreboard(week, season);

            if (!gamesResult.success) {
                return { success: false, error: 'Failed to fetch games' };
            }

            const games = gamesResult.data;
            const completedGames = games.filter(g => g.status.completed);

            // Get all picks for this pool/week
            const picksResult = await db.getPoolPicks(poolId, week, season);

            if (!picksResult.success) {
                return { success: false, error: 'Failed to fetch picks' };
            }

            const picks = picksResult.data;
            let updated = 0;

            // Update each pick
            for (const pick of picks) {
                const game = completedGames.find(g => g.id === pick.game_id);

                if (!game) continue;

                const winnerId = game.homeTeam.winner
                    ? game.homeTeam.id
                    : game.awayTeam.winner
                        ? game.awayTeam.id
                        : null;

                if (!winnerId) continue;

                const isCorrect = pick.picked_team_id === winnerId;

                await db.updatePickResult(pick.id, isCorrect);
                updated++;
            }

            return {
                success: true,
                updated,
                total: picks.length,
                completed: completedGames.length,
            };
        } catch (error) {
            console.error('Error calculating week results:', error);
            return { success: false, error: error.message };
        }
    }
}

// Export singleton instance
export const scoringService = new ScoringService();
