// Leaderboard View
import { Navbar } from '../components/Navbar.js';
import { LoadingSpinner } from '../components/LoadingSpinner.js';
import { auth } from '../auth/auth.js';
import { db } from '../api/supabase.js';
import { config } from '../config.js';

export class Leaderboard {
    constructor() {
        this.navbar = new Navbar();
        this.user = null;
        this.pools = [];
        this.selectedPool = null;
        this.standings = [];
    }

    async render() {
        const navbarHtml = await this.navbar.render();

        return `
      ${navbarHtml}
      <div class="container section">
        <div id="leaderboard-content">
          ${LoadingSpinner('Loading leaderboard...')}
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

        // Load leaderboard for selected pool
        if (this.selectedPool) {
            const leaderboardResult = await db.getLeaderboard(
                this.selectedPool.id,
                config.app.currentSeason
            );

            if (leaderboardResult.success) {
                this.standings = leaderboardResult.data;
            }
        }
    }

    renderContent() {
        if (this.pools.length === 0) {
            return `
        <div class="animate-fade-in text-center" style="padding: var(--space-3xl);">
          <h2>No Pools Found</h2>
          <p style="margin: var(--space-lg) 0; color: var(--color-text-muted);">
            Join a pool to see the leaderboard.
          </p>
          <a href="#/pools" class="btn btn-primary">Browse Pools</a>
        </div>
      `;
        }

        return `
      <div class="animate-fade-in">
        <div style="margin-bottom: var(--space-2xl);">
          <h1>LEADERBOARD</h1>
          <p style="font-size: 1.2rem; color: var(--color-text-muted);">
            ${this.selectedPool?.name || 'Pool Rankings'}
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
        
        <!-- Leaderboard Table -->
        <div class="card">
          ${this.standings.length > 0 ? `
            <table class="leaderboard-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Player</th>
                  <th>Wins</th>
                  <th>Losses</th>
                  <th>Win %</th>
                </tr>
              </thead>
              <tbody>
                ${this.standings.map((standing, index) => {
            const rank = index + 1;
            const winPct = standing.total > 0
                ? ((standing.wins / standing.total) * 100).toFixed(1)
                : '0.0';
            const isCurrentUser = standing.userId === this.user.id;

            return `
                    <tr class="stagger-item" style="animation-delay: ${index * 0.05}s; ${isCurrentUser ? 'background: rgba(57, 255, 20, 0.05);' : ''}">
                      <td>
                        <span class="leaderboard-rank ${rank === 1 ? 'top-1' : rank === 2 ? 'top-2' : rank === 3 ? 'top-3' : ''}">
                          ${rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank}
                        </span>
                      </td>
                      <td>
                        <div style="display: flex; align-items: center; gap: var(--space-md);">
                          ${standing.avatarUrl ? `
                            <img src="${standing.avatarUrl}" alt="${standing.displayName}" 
                                 style="width: 32px; height: 32px; border-radius: 50%; border: 2px solid var(--color-border);" />
                          ` : ''}
                          <span style="font-weight: 600;">
                            ${standing.displayName}
                            ${isCurrentUser ? '<span style="color: var(--color-neon-green); margin-left: var(--space-sm);">(You)</span>' : ''}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span style="color: var(--color-neon-green); font-weight: 600;">
                          ${standing.wins}
                        </span>
                      </td>
                      <td>
                        <span style="color: var(--color-neon-red); font-weight: 600;">
                          ${standing.losses}
                        </span>
                      </td>
                      <td>
                        <span style="color: var(--color-neon-gold); font-weight: 600;">
                          ${winPct}%
                        </span>
                      </td>
                    </tr>
                  `;
        }).join('')}
              </tbody>
            </table>
          ` : `
            <div style="text-align: center; padding: var(--space-3xl); color: var(--color-text-muted);">
              <p>No standings yet. Make some picks to get on the board!</p>
            </div>
          `}
        </div>
        
        <!-- Degen Badges -->
        ${this.standings.length > 0 ? `
          <div class="grid grid-3" style="margin-top: var(--space-3xl);">
            <div class="card text-center stagger-item">
              <h3 style="font-size: 2rem; margin-bottom: var(--space-sm);">🔥</h3>
              <h4>Hot Streak</h4>
              <p style="color: var(--color-text-muted); margin-top: var(--space-sm);">
                ${this.standings[0]?.displayName || 'TBD'}
              </p>
            </div>
            
            <div class="card text-center stagger-item">
              <h3 style="font-size: 2rem; margin-bottom: var(--space-sm);">💎</h3>
              <h4>Diamond Hands</h4>
              <p style="color: var(--color-text-muted); margin-top: var(--space-sm);">
                Most Consistent
              </p>
            </div>
            
            <div class="card text-center stagger-item">
              <h3 style="font-size: 2rem; margin-bottom: var(--space-sm);">🎲</h3>
              <h4>Biggest Degen</h4>
              <p style="color: var(--color-text-muted); margin-top: var(--space-sm);">
                Most Active
              </p>
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
        const contentDiv = document.getElementById('leaderboard-content');
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
    }
}
