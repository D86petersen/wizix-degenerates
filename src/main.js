// Main Application Entry Point
import { router } from './utils/router.js';
import { auth } from './auth/auth.js';
import { scoringService } from './services/scoring.js';
import { AuthView } from './auth/AuthView.js';
import { Dashboard } from './views/Dashboard.js';
import { PoolList } from './views/PoolList.js';
import { MakePicks } from './views/MakePicks.js';
import { LiveScores } from './views/LiveScores.js';
import { Leaderboard } from './views/Leaderboard.js';

class App {
    constructor() {
        this.currentView = null;
    }

    async init() {
        console.log('🎲 Initializing Wizix Degenerates...');

        // Set up authentication guard
        router.setAuthGuard(async () => {
            return await auth.isAuthenticated();
        });

        // Register routes
        this.registerRoutes();
        console.log('✅ Routes registered');

        // Handle initial route after routes are registered
        await router.handleRoute();
        console.log('✅ Initial route handled');

        // Hide loading screen immediately after initialization
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
            console.log('✅ Loading screen hidden');
        } else {
            console.warn('⚠️ Loading screen element not found');
        }

        // Start real-time scoring service
        scoringService.start();

        // Listen for auth state changes
        auth.onAuthStateChange((user) => {
            if (!user && router.getCurrentRoute() !== '/auth') {
                router.navigate('/auth');
            }
        });

        console.log('✅ App initialized');
    }

    registerRoutes() {
        // Auth route
        router.on('/', async () => {
            await this.renderView(new AuthView());
        });

        router.on('/auth', async () => {
            await this.renderView(new AuthView());
        });

        // Dashboard
        router.on('/dashboard', async () => {
            await this.renderView(new Dashboard());
        });

        // Pools
        router.on('/pools', async () => {
            await this.renderView(new PoolList());
        });

        // Make Picks
        router.on('/picks', async () => {
            await this.renderView(new MakePicks());
        });

        // Live Scores
        router.on('/scores', async () => {
            // Clean up previous view if it has a cleanup method
            if (this.currentView && typeof this.currentView.cleanup === 'function') {
                this.currentView.cleanup();
            }
            await this.renderView(new LiveScores());
        });

        // Leaderboard
        router.on('/leaderboard', async () => {
            await this.renderView(new Leaderboard());
        });
    }

    async renderView(view) {
        // Clean up previous view
        if (this.currentView && typeof this.currentView.cleanup === 'function') {
            this.currentView.cleanup();
        }

        this.currentView = view;

        // Get app container
        const app = document.getElementById('app');

        if (!app) {
            console.error('App container not found');
            return;
        }

        // Render view
        const html = await view.render();
        app.innerHTML = html;

        // Attach event listeners
        if (typeof view.attachEventListeners === 'function') {
            await view.attachEventListeners();
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
});

// Handle cleanup on page unload
window.addEventListener('beforeunload', () => {
    scoringService.stop();
});
