// Live Scores View with Real-time Updates
import { Navbar } from '../components/Navbar.js';
import { LoadingSpinner } from '../components/LoadingSpinner.js';
import { GameCard } from '../components/GameCard.js';
import { auth } from '../auth/auth.js';
import { db } from '../api/supabase.js';
import { espnService } from '../api/espn.js';
import { getCurrentNFLWeek } from '../utils/date.js';
import { config } from '../config.js';

export class LiveScores {
    constructor() {
        this.navbar = new Navbar();
        this.user = null;
        this.games = [];
        this.userPicks = [];
        this.selectedPool = null;
        this.pools = [];
        this.currentWeek = getCurrentNFLWeek(config.app.currentSeason);
        this.refreshInterval = null;
    }

    async render() {
        const navbarHtml = await this.navbar.render();

        return `
      ${navbarHtml}
      <div class="container section">
        <div id="scores-content">
          ${LoadingSpinner('Loading live scores...')}
        </div>
      </div>
    `;
    }

    async loadData() {
        this.user = await auth.getCurrentUser();

        if (!this.user) return;

        // Load user's pools
        const poolsResult = await db.getUserPools(this.user.id);
        if (poolsResult.success) {
            this.pools = poolsResult.data;
            if (this.pools.length > 0 && !this.selectedPool) {
                this.selectedPool = this.pools[0];
            }
        }

        // Load games
        const gamesResult = await espnService.getScoreboard(this.currentWeek);
        if (gamesResult.success) {
            this.games = gamesResult.data;
        }

        // Load user picks if pool selected
        if (this.selectedPool) {
            const picksResult = await db.getUserPicks(
                this.user.id,
                this.selectedPool.id,
                this.currentWeek,
                config.app.currentSeason
            );

            if (picksResult.success) {
                this.userPicks = picksResult.data;
            }
        }
    }

    renderContent() {
        const liveGames = this.games.filter(g => g.status.inProgress);
        const completedGames = this.games.filter(g => g.status.completed);
        const upcomingGames = this.games.filter(g => !g.status.inProgress && !g.status.completed);

        return `
      <div class="animate-fade-in">
        <div style="margin-bottom: var(--space-2xl); display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h1>LIVE SCORES</h1>
            <p style="font-size: 1.2rem; color: var(--color-text-muted);">
              Week ${this.currentWeek} • ${liveGames.length} Live • ${completedGames.length} Final
            </p>
          </div>
          <div>
            <span class="badge badge-live">Auto-refreshing every 30s</span>
          </div>
        </div>
        
        <!-- Pool Selector -->
        ${this.pools.length > 1 ? `
          <div class="form-group" style="margin-bottom: var(--space-xl);">
            <label class="form-label">View Picks For</label>
            <select id="pool-selector" class="form-select">
              ${this.pools.map(pool => `
                <option value="${pool.id}" ${pool.id === this.selectedPool?.id ? 'selected' : ''}>
                  ${pool.name}
                </option>
              `).join('')}
            </select>
          </div>
        ` : ''}
        
        <!-- Live Games -->
        ${liveGames.length > 0 ? `
          <div style="margin-bottom: var(--space-3xl);">
            <h2 style="margin-bottom: var(--space-lg);">
              🔴 LIVE NOW
            </h2>
            <div class="grid grid-2">
              ${liveGames.map(game => {
            const userPick = this.userPicks.find(p => p.game_id === game.id);
            return GameCard(game, userPick, null, true);
        }).join('')}
            </div>
          </div>
        ` : ''}
        
        <!-- Completed Games -->
        ${completedGames.length > 0 ? `
          <div style="margin-bottom: var(--space-3xl);">
            <h2 style="margin-bottom: var(--space-lg);">
              ✅ FINAL
            </h2>
            <div class="grid grid-2">
              ${completedGames.map(game => {
            const userPick = this.userPicks.find(p => p.game_id === game.id);
            return GameCard(game, userPick, null, true);
        }).join('')}
            </div>
          </div>
        ` : ''}
        
        <!-- Upcoming Games -->
        ${upcomingGames.length > 0 ? `
          <div>
            <h2 style="margin-bottom: var(--space-lg);">
              📅 UPCOMING
            </h2>
            <div class="grid grid-2">
              ${upcomingGames.map(game => {
            const userPick = this.userPicks.find(p => p.game_id === game.id);
            return GameCard(game, userPick, null, true);
        }).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
    }

    async attachEventListeners() {
        this.navbar.attachEventListeners();

        // Load data
        await this.loadData();

        // Update content
        const contentDiv = document.getElementById('scores-content');
        if (contentDiv) {
            contentDiv.innerHTML = this.renderContent();
        }

        // Pool selector
        const poolSelector = document.getElementById('pool-selector');
        if (poolSelector) {
            poolSelector.addEventListener('change', async (e) => {
                this.selectedPool = this.pools.find(p => p.id === e.target.value);
                await this.loadData();
                contentDiv.innerHTML = this.renderContent();
            });
        }

        // Start auto-refresh for live games
        this.startAutoRefresh();
    }

    startAutoRefresh() {
        // Clear existing interval
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }

        // Only refresh if there are live games
        const hasLiveGames = this.games.some(g => g.status.inProgress);

        if (hasLiveGames) {
            this.refreshInterval = setInterval(async () => {
                await this.loadData();
                const contentDiv = document.getElementById('scores-content');
                if (contentDiv) {
                    contentDiv.innerHTML = this.renderContent();
                }
            }, config.app.refreshInterval);
        }
    }

    cleanup() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }
}
