// Make Picks View
import { Navbar } from '../components/Navbar.js';
import { LoadingSpinner } from '../components/LoadingSpinner.js';
import { GameCard } from '../components/GameCard.js';
import { auth } from '../auth/auth.js';
import { db } from '../api/supabase.js';
import { espnService } from '../api/espn.js';
import { getCurrentNFLWeek } from '../utils/date.js';
import { config } from '../config.js';

export class MakePicks {
    constructor() {
        this.navbar = new Navbar();
        this.user = null;
        this.pools = [];
        this.selectedPool = null;
        this.games = [];
        this.picks = {};
        this.existingPicks = [];
        this.currentWeek = getCurrentNFLWeek(config.app.currentSeason);
    }

    async render() {
        const navbarHtml = await this.navbar.render();

        return `
      ${navbarHtml}
      <div class="container section">
        <div id="picks-content">
          ${LoadingSpinner('Loading games...')}
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
            if (this.pools.length > 0) {
                this.selectedPool = this.pools[0];
            }
        }

        // Load games for current week
        const gamesResult = await espnService.getScoreboard(this.currentWeek);
        if (gamesResult.success) {
            this.games = gamesResult.data;
        }

        // Load existing picks if pool selected
        if (this.selectedPool) {
            const picksResult = await db.getUserPicks(
                this.user.id,
                this.selectedPool.id,
                this.currentWeek,
                config.app.currentSeason
            );

            if (picksResult.success) {
                this.existingPicks = picksResult.data;
                // Convert to picks object
                this.existingPicks.forEach(pick => {
                    this.picks[pick.game_id] = pick.picked_team_id;
                });
            }
        }
    }

    renderContent() {
        if (this.pools.length === 0) {
            return `
        <div class="animate-fade-in text-center" style="padding: var(--space-3xl);">
          <h2>No Pools Found</h2>
          <p style="margin: var(--space-lg) 0; color: var(--color-text-muted);">
            You need to join a pool before you can make picks.
          </p>
          <a href="#/pools" class="btn btn-primary">Browse Pools</a>
        </div>
      `;
        }

        return `
      <div class="animate-fade-in">
        <div style="margin-bottom: var(--space-2xl);">
          <h1>MAKE YOUR PICKS</h1>
          <p style="font-size: 1.2rem; color: var(--color-text-muted);">
            Week ${this.currentWeek} • ${this.games.length} Games
          </p>
        </div>
        
        <!-- Pool Selector -->
        ${this.pools.length > 1 ? `
          <div class="form-group" style="margin-bottom: var(--space-xl);">
            <label class="form-label">Select Pool</label>
            <select id="pool-selector" class="form-select">
              ${this.pools.map(pool => `
                <option value="${pool.id}" ${pool.id === this.selectedPool?.id ? 'selected' : ''}>
                  ${pool.name}
                </option>
              `).join('')}
            </select>
          </div>
        ` : ''}
        
        <!-- Games Grid -->
        <div class="grid grid-2" style="margin-bottom: var(--space-xl);">
          ${this.games.map((game, index) => {
            const userPick = this.existingPicks.find(p => p.game_id === game.id);
            return `<div class="stagger-item" style="animation-delay: ${index * 0.05}s;">${GameCard(game, userPick)}</div>`;
        }).join('')}
        </div>
        
        <!-- Submit Button -->
        <div style="text-align: center;">
          <button id="submit-picks-btn" class="btn btn-primary" style="min-width: 300px;">
            SUBMIT PICKS (${Object.keys(this.picks).length}/${this.games.length})
          </button>
          <p style="margin-top: var(--space-md); color: var(--color-text-muted); font-size: 0.9rem;">
            You can update your picks until each game starts
          </p>
        </div>
      </div>
    `;
    }

    async attachEventListeners() {
        this.navbar.attachEventListeners();

        // Load data
        await this.loadData();

        // Update content
        const contentDiv = document.getElementById('picks-content');
        if (contentDiv) {
            contentDiv.innerHTML = this.renderContent();
        }

        // Pool selector
        const poolSelector = document.getElementById('pool-selector');
        if (poolSelector) {
            poolSelector.addEventListener('change', async (e) => {
                this.selectedPool = this.pools.find(p => p.id === e.target.value);
                this.picks = {};
                await this.loadData();
                contentDiv.innerHTML = this.renderContent();
                this.attachPickListeners();
            });
        }

        // Attach pick listeners
        this.attachPickListeners();

        // Submit button
        const submitBtn = document.getElementById('submit-picks-btn');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => this.submitPicks());
        }
    }

    attachPickListeners() {
        // Global function for team selection
        window.selectTeam = (gameId, teamId) => {
            this.picks[gameId] = teamId;

            // Update UI
            const gameCard = document.querySelector(`[data-game-id="${gameId}"]`);
            if (gameCard) {
                const teams = gameCard.querySelectorAll('.team');
                teams.forEach(team => {
                    const tid = team.getAttribute('data-team-id');
                    if (tid === teamId) {
                        team.classList.add('selected');
                    } else {
                        team.classList.remove('selected');
                    }
                });
            }

            // Update submit button
            const submitBtn = document.getElementById('submit-picks-btn');
            if (submitBtn) {
                submitBtn.textContent = `SUBMIT PICKS (${Object.keys(this.picks).length}/${this.games.length})`;
            }
        };
    }

    async submitPicks() {
        if (!this.selectedPool) {
            alert('Please select a pool');
            return;
        }

        if (Object.keys(this.picks).length !== this.games.length) {
            alert(`Please pick all ${this.games.length} games before submitting`);
            return;
        }

        // Format picks for database
        const picksData = Object.entries(this.picks).map(([gameId, teamId]) => ({
            pool_id: this.selectedPool.id,
            user_id: this.user.id,
            game_id: gameId,
            week: this.currentWeek,
            season: config.app.currentSeason,
            picked_team_id: teamId,
            is_correct: null,
        }));

        // Submit to database
        const result = await db.submitPicks(picksData);

        if (result.success) {
            alert('✅ Picks submitted successfully!');
            // Reload to show updated picks
            await this.loadData();
            const contentDiv = document.getElementById('picks-content');
            if (contentDiv) {
                contentDiv.innerHTML = this.renderContent();
                this.attachPickListeners();
            }
        } else {
            alert('❌ Error submitting picks: ' + result.error);
        }
    }
}
