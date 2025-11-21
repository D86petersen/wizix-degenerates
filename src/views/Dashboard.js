// Dashboard View
import { Navbar } from '../components/Navbar.js';
import { LoadingSpinner } from '../components/LoadingSpinner.js';
import { auth } from '../auth/auth.js';
import { db } from '../api/supabase.js';
import { espnService } from '../api/espn.js';
import { getCurrentNFLWeek } from '../utils/date.js';
import { config } from '../config.js';

export class Dashboard {
    constructor() {
        this.navbar = new Navbar();
        this.user = null;
        this.pools = [];
        this.liveGames = [];
        this.stats = {
            totalPools: 0,
            activePicks: 0,
            wins: 0,
            losses: 0,
        };
    }

    async render() {
        const navbarHtml = await this.navbar.render();

        return `
      ${navbarHtml}
      <div class="container section">
        <div id="dashboard-content">
          ${LoadingSpinner('Loading your dashboard...')}
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
            this.stats.totalPools = this.pools.length;
        }

        // Load live games
        const currentWeek = getCurrentNFLWeek(config.app.currentSeason);
        const liveGamesResult = await espnService.getLiveGames(currentWeek);
        if (liveGamesResult.success) {
            this.liveGames = liveGamesResult.data;
        }

        // Calculate stats (simplified for now)
        this.stats.activePicks = this.pools.length * currentWeek;
    }

    renderContent() {
        return `
      <div class="animate-fade-in">
        <div style="margin-bottom: var(--space-2xl);">
          <h1>WELCOME BACK, ${this.user?.user_metadata?.display_name || 'DEGEN'}!</h1>
          <p style="font-size: 1.2rem; color: var(--color-text-muted);">
            Ready to make some picks?
          </p>
        </div>
        
        <!-- Stats Grid -->
        <div class="grid grid-4" style="margin-bottom: var(--space-3xl);">
          <div class="stat-card stagger-item">
            <div class="stat-value">${this.stats.totalPools}</div>
            <div class="stat-label">Active Pools</div>
          </div>
          
          <div class="stat-card stagger-item">
            <div class="stat-value">${this.stats.wins}</div>
            <div class="stat-label">Wins</div>
          </div>
          
          <div class="stat-card stagger-item">
            <div class="stat-value">${this.stats.losses}</div>
            <div class="stat-label">Losses</div>
          </div>
          
          <div class="stat-card stagger-item">
            <div class="stat-value">${this.stats.wins + this.stats.losses > 0 ? Math.round((this.stats.wins / (this.stats.wins + this.stats.losses)) * 100) : 0}%</div>
            <div class="stat-label">Win Rate</div>
          </div>
        </div>
        
        <!-- Quick Actions -->
        <div class="grid grid-2" style="margin-bottom: var(--space-3xl);">
          <div class="card stagger-item">
            <div class="card-header">
              <h3 class="card-title">🏈 Make Your Picks</h3>
              <p class="card-subtitle">Week ${getCurrentNFLWeek(config.app.currentSeason)} is here</p>
            </div>
            <div class="card-body">
              <p>Don't miss out! Submit your picks before the games lock.</p>
            </div>
            <div class="card-footer">
              <a href="#/picks" class="btn btn-primary">Make Picks</a>
            </div>
          </div>
          
          <div class="card stagger-item">
            <div class="card-header">
              <h3 class="card-title">📊 Leaderboard</h3>
              <p class="card-subtitle">See where you stand</p>
            </div>
            <div class="card-body">
              <p>Check your ranking against other degens in your pools.</p>
            </div>
            <div class="card-footer">
              <a href="#/leaderboard" class="btn btn-outline">View Rankings</a>
            </div>
          </div>
        </div>
        
        <!-- Live Games -->
        ${this.liveGames.length > 0 ? `
          <div class="card stagger-item">
            <div class="card-header">
              <h3 class="card-title">🔴 LIVE GAMES</h3>
              <p class="card-subtitle">${this.liveGames.length} game${this.liveGames.length !== 1 ? 's' : ''} in progress</p>
            </div>
            <div class="card-body">
              <div class="grid grid-2">
                ${this.liveGames.map(game => `
                  <div class="card">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-md);">
                      <div style="display: flex; align-items: center; gap: var(--space-sm);">
                        <img src="${game.awayTeam.logo}" alt="${game.awayTeam.name}" style="width: 30px; height: 30px;" />
                        <span>${game.awayTeam.abbreviation}</span>
                      </div>
                      <span style="font-family: var(--font-display); font-size: 1.5rem; color: var(--color-neon-gold);">${game.awayTeam.score}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                      <div style="display: flex; align-items: center; gap: var(--space-sm);">
                        <img src="${game.homeTeam.logo}" alt="${game.homeTeam.name}" style="width: 30px; height: 30px;" />
                        <span>${game.homeTeam.abbreviation}</span>
                      </div>
                      <span style="font-family: var(--font-display); font-size: 1.5rem; color: var(--color-neon-gold);">${game.homeTeam.score}</span>
                    </div>
                    <div style="margin-top: var(--space-md); text-align: center;">
                      <span class="badge badge-live">${game.status.detail}</span>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
            <div class="card-footer">
              <a href="#/scores" class="btn btn-outline">View All Scores</a>
            </div>
          </div>
        ` : ''}
        
        <!-- My Pools -->
        <div class="card stagger-item">
          <div class="card-header">
            <h3 class="card-title">My Pools</h3>
            <p class="card-subtitle">${this.pools.length} active pool${this.pools.length !== 1 ? 's' : ''}</p>
          </div>
          <div class="card-body">
            ${this.pools.length > 0 ? `
              <div style="display: flex; flex-direction: column; gap: var(--space-md);">
                ${this.pools.map(pool => `
                  <div class="card">
                    <h4>${pool.name}</h4>
                    <p style="color: var(--color-text-muted); font-size: 0.9rem;">
                      ${pool.pool_type.toUpperCase()} • Season ${pool.season}
                    </p>
                  </div>
                `).join('')}
              </div>
            ` : `
              <p style="text-align: center; color: var(--color-text-muted); padding: var(--space-xl);">
                You haven't joined any pools yet.
              </p>
            `}
          </div>
          <div class="card-footer">
            <a href="#/pools" class="btn btn-outline">Browse Pools</a>
          </div>
        </div>
      </div>
    `;
    }

    async attachEventListeners() {
        this.navbar.attachEventListeners();

        // Load data
        await this.loadData();

        // Update content
        const contentDiv = document.getElementById('dashboard-content');
        if (contentDiv) {
            contentDiv.innerHTML = this.renderContent();
        }
    }
}
