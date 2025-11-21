// Pool List View
import { Navbar } from '../components/Navbar.js';
import { LoadingSpinner } from '../components/LoadingSpinner.js';
import { auth } from '../auth/auth.js';
import { db } from '../api/supabase.js';
import { config } from '../config.js';

export class PoolList {
    constructor() {
        this.navbar = new Navbar();
        this.user = null;
        this.allPools = [];
        this.userPools = [];
    }

    async render() {
        const navbarHtml = await this.navbar.render();

        return `
      ${navbarHtml}
      <div class="container section">
        <div id="pools-content">
          ${LoadingSpinner('Loading pools...')}
        </div>
      </div>
    `;
    }

    async loadData() {
        this.user = await auth.getCurrentUser();

        if (!this.user) return;

        // Load all pools
        const poolsResult = await db.getPools();
        if (poolsResult.success) {
            this.allPools = poolsResult.data;
        }

        // Load user's pools
        const userPoolsResult = await db.getUserPools(this.user.id);
        if (userPoolsResult.success) {
            this.userPools = userPoolsResult.data;
        }
    }

    renderContent() {
        const userPoolIds = this.userPools.map(p => p.id);
        const availablePools = this.allPools.filter(p => !userPoolIds.includes(p.id));

        return `
      <div class="animate-fade-in">
        <div style="margin-bottom: var(--space-2xl);">
          <h1>POOLS</h1>
          <p style="font-size: 1.2rem; color: var(--color-text-muted);">
            Join a pool to start making picks
          </p>
        </div>
        
        <!-- My Pools -->
        ${this.userPools.length > 0 ? `
          <div style="margin-bottom: var(--space-3xl);">
            <h2 style="margin-bottom: var(--space-lg);">My Pools</h2>
            <div class="grid grid-2">
              ${this.userPools.map((pool, index) => `
                <div class="card stagger-item" style="animation-delay: ${index * 0.05}s;">
                  <div class="card-header">
                    <h3 class="card-title">${pool.name}</h3>
                    <p class="card-subtitle">
                      ${pool.pool_type.toUpperCase()} • Season ${pool.season}
                    </p>
                  </div>
                  <div class="card-body">
                    <div style="display: flex; gap: var(--space-lg);">
                      <div>
                        <div style="font-size: 0.85rem; color: var(--color-text-muted);">Entry Fee</div>
                        <div style="font-size: 1.2rem; font-weight: 600; color: var(--color-neon-gold);">
                          $${pool.entry_fee || 0}
                        </div>
                      </div>
                      <div>
                        <div style="font-size: 0.85rem; color: var(--color-text-muted);">Members</div>
                        <div style="font-size: 1.2rem; font-weight: 600;">
                          ${pool.pool_members?.[0]?.count || 0}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="card-footer">
                    <button class="btn btn-secondary btn-sm" onclick="window.leavePool('${pool.id}')">
                      Leave Pool
                    </button>
                    <a href="#/picks" class="btn btn-primary btn-sm">
                      Make Picks
                    </a>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
        
        <!-- Available Pools -->
        <div>
          <h2 style="margin-bottom: var(--space-lg);">Available Pools</h2>
          ${availablePools.length > 0 ? `
            <div class="grid grid-2">
              ${availablePools.map((pool, index) => `
                <div class="card stagger-item" style="animation-delay: ${(this.userPools.length + index) * 0.05}s;">
                  <div class="card-header">
                    <h3 class="card-title">${pool.name}</h3>
                    <p class="card-subtitle">
                      ${pool.pool_type.toUpperCase()} • Season ${pool.season}
                    </p>
                  </div>
                  <div class="card-body">
                    <div style="display: flex; gap: var(--space-lg);">
                      <div>
                        <div style="font-size: 0.85rem; color: var(--color-text-muted);">Entry Fee</div>
                        <div style="font-size: 1.2rem; font-weight: 600; color: var(--color-neon-gold);">
                          $${pool.entry_fee || 0}
                        </div>
                      </div>
                      <div>
                        <div style="font-size: 0.85rem; color: var(--color-text-muted);">Members</div>
                        <div style="font-size: 1.2rem; font-weight: 600;">
                          ${pool.pool_members?.[0]?.count || 0}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="card-footer">
                    <button class="btn btn-primary" onclick="window.joinPool('${pool.id}')">
                      Join Pool
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : `
            <div class="card text-center" style="padding: var(--space-3xl);">
              <p style="color: var(--color-text-muted);">
                ${this.userPools.length > 0
                ? "You've joined all available pools!"
                : 'No pools available yet.'}
              </p>
            </div>
          `}
        </div>
      </div>
    `;
    }

    async attachEventListeners() {
        this.navbar.attachEventListeners();

        // Load data
        await this.loadData();

        // Update content
        const contentDiv = document.getElementById('pools-content');
        if (contentDiv) {
            contentDiv.innerHTML = this.renderContent();
        }

        // Global functions for join/leave
        window.joinPool = async (poolId) => {
            const result = await db.joinPool(poolId, this.user.id);

            if (result.success) {
                alert('✅ Successfully joined pool!');
                await this.loadData();
                contentDiv.innerHTML = this.renderContent();
            } else {
                alert('❌ Error joining pool: ' + result.error);
            }
        };

        window.leavePool = async (poolId) => {
            if (!confirm('Are you sure you want to leave this pool?')) {
                return;
            }

            const result = await db.leavePool(poolId, this.user.id);

            if (result.success) {
                alert('✅ Successfully left pool');
                await this.loadData();
                contentDiv.innerHTML = this.renderContent();
            } else {
                alert('❌ Error leaving pool: ' + result.error);
            }
        };
    }
}
