// Simple hash-based router for static hosting

class Router {
    constructor() {
        this.routes = {};
        this.currentRoute = null;
        this.authGuard = null;

        // Listen for hash changes
        window.addEventListener('hashchange', () => this.handleRoute());
        window.addEventListener('load', () => this.handleRoute());
    }

    /**
     * Register a route
     */
    on(path, handler) {
        this.routes[path] = handler;
        return this;
    }

    /**
     * Set authentication guard
     */
    setAuthGuard(guardFn) {
        this.authGuard = guardFn;
        return this;
    }

    /**
     * Navigate to a route
     */
    navigate(path) {
        window.location.hash = path;
    }

    /**
     * Handle route change
     */
    async handleRoute() {
        const hash = window.location.hash.slice(1) || '/';
        const route = this.routes[hash] || this.routes['/'];

        if (!route) {
            console.error(`No route found for ${hash}`);
            return;
        }

        // Check authentication if guard is set
        if (this.authGuard) {
            const isAuthenticated = await this.authGuard();

            if (!isAuthenticated && hash !== '/' && hash !== '/auth') {
                this.navigate('/auth');
                return;
            }

            if (isAuthenticated && hash === '/auth') {
                this.navigate('/dashboard');
                return;
            }
        }

        this.currentRoute = hash;

        // Execute route handler
        if (typeof route === 'function') {
            await route();
        }
    }

    /**
     * Get current route
     */
    getCurrentRoute() {
        return this.currentRoute;
    }

    /**
     * Get route parameters (for future use with dynamic routes)
     */
    getParams() {
        const hash = window.location.hash.slice(1);
        const [path, queryString] = hash.split('?');

        if (!queryString) return {};

        const params = {};
        queryString.split('&').forEach(param => {
            const [key, value] = param.split('=');
            params[key] = decodeURIComponent(value);
        });

        return params;
    }
}

// Export singleton instance
export const router = new Router();
