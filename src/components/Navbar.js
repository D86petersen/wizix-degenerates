// Navbar Component
import { auth } from '../auth/auth.js';
import { router } from '../utils/router.js';

export class Navbar {
    constructor() {
        this.user = null;
        this.mobileMenuOpen = false;
    }

    async render() {
        this.user = await auth.getCurrentUser();

        return `
      <nav class="navbar">
        <div class="navbar-container">
          <a href="#/dashboard" class="navbar-brand">
            <span>🎲</span>
            <span>WIZIX DEGENERATES</span>
          </a>
          
          ${this.user ? this.renderAuthenticatedNav() : ''}
        </div>
      </nav>
    `;
    }

    renderAuthenticatedNav() {
        const currentRoute = router.getCurrentRoute();

        return `
      <button class="navbar-toggle" id="mobile-menu-toggle">
        ☰
      </button>
      
      <ul class="navbar-nav" id="navbar-nav">
        <li>
          <a href="#/dashboard" class="navbar-link ${currentRoute === '/dashboard' ? 'active' : ''}">
            Dashboard
          </a>
        </li>
        <li>
          <a href="#/pools" class="navbar-link ${currentRoute === '/pools' ? 'active' : ''}">
            Pools
          </a>
        </li>
        <li>
          <a href="#/picks" class="navbar-link ${currentRoute === '/picks' ? 'active' : ''}">
            Make Picks
          </a>
        </li>
        <li>
          <a href="#/scores" class="navbar-link ${currentRoute === '/scores' ? 'active' : ''}">
            Live Scores
          </a>
        </li>
        <li>
          <a href="#/leaderboard" class="navbar-link ${currentRoute === '/leaderboard' ? 'active' : ''}">
            Leaderboard
          </a>
        </li>
      </ul>
      
      <div class="navbar-user">
        <button class="btn btn-ghost" id="sign-out-btn">
          Sign Out
        </button>
      </div>
    `;
    }

    attachEventListeners() {
        // Mobile menu toggle
        const mobileToggle = document.getElementById('mobile-menu-toggle');
        if (mobileToggle) {
            mobileToggle.addEventListener('click', () => {
                const nav = document.getElementById('navbar-nav');
                if (nav) {
                    nav.classList.toggle('mobile-open');
                }
            });
        }

        // Sign out
        const signOutBtn = document.getElementById('sign-out-btn');
        if (signOutBtn) {
            signOutBtn.addEventListener('click', async () => {
                await auth.signOut();
                router.navigate('/auth');
            });
        }
    }
}
