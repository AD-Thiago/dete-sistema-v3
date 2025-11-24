/**
 * Router module - SPA routing system
 * Handles client-side navigation without page reloads
 */

class Router {
  constructor() {
    this.routes = new Map();
    this.currentRoute = null;
    this.defaultRoute = '/dashboard';
    
    // Listen for navigation events
    window.addEventListener('popstate', () => this.handleRouteChange());
    window.addEventListener('hashchange', () => this.handleRouteChange());
    
    // Handle link clicks
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-link]')) {
        e.preventDefault();
        this.navigate(e.target.getAttribute('href'));
      }
    });
  }

  /**
   * Register a route
   */
  register(path, handler, options = {}) {
    this.routes.set(path, {
      handler,
      title: options.title || 'DETE v3.0',
      requiresAuth: options.requiresAuth !== false,
      permissions: options.permissions || []
    });
  }

  /**
   * Navigate to a route
   */
  async navigate(path) {
    // Update URL
    window.history.pushState({}, '', `#${path}`);
    
    // Handle route change
    await this.handleRouteChange();
  }

  /**
   * Handle route changes
   */
  async handleRouteChange() {
    // Get current path from hash
    let path = window.location.hash.slice(1) || this.defaultRoute;
    
    // Find matching route
    let route = this.routes.get(path);
    
    // If no exact match, try pattern matching
    if (!route) {
      route = this.matchRoute(path);
    }
    
    // If still no match, go to 404
    if (!route) {
      path = '/404';
      route = this.routes.get(path);
    }
    
    // Check authentication
    if (route && route.requiresAuth) {
      const isAuthenticated = await this.checkAuth();
      if (!isAuthenticated) {
        this.navigate('/login');
        return;
      }
    }
    
    // Check permissions
    if (route && route.permissions.length > 0) {
      const hasPermission = await this.checkPermissions(route.permissions);
      if (!hasPermission) {
        this.navigate('/unauthorized');
        return;
      }
    }
    
    // Update current route
    this.currentRoute = path;
    
    // Update document title
    document.title = route?.title || 'DETE v3.0';
    
    // Update active nav item
    this.updateNavigation(path);
    
    // Execute route handler
    if (route && route.handler) {
      try {
        await route.handler(this.getRouteParams(path));
      } catch (error) {
        console.error('Route handler error:', error);
        this.showError('Erro ao carregar página');
      }
    }
  }

  /**
   * Match route patterns (e.g., /pacientes/:id)
   */
  matchRoute(path) {
    for (const [pattern, route] of this.routes.entries()) {
      const regex = this.pathToRegex(pattern);
      if (regex.test(path)) {
        return route;
      }
    }
    return null;
  }

  /**
   * Convert path pattern to regex
   */
  pathToRegex(path) {
    const pattern = path
      .replace(/\//g, '\\/')
      .replace(/:\w+/g, '([^/]+)');
    return new RegExp(`^${pattern}$`);
  }

  /**
   * Extract route parameters
   */
  getRouteParams(path) {
    const params = {};
    const parts = path.split('/').filter(Boolean);
    
    for (const [pattern] of this.routes.entries()) {
      const patternParts = pattern.split('/').filter(Boolean);
      
      if (patternParts.length === parts.length) {
        let match = true;
        
        for (let i = 0; i < patternParts.length; i++) {
          if (patternParts[i].startsWith(':')) {
            const paramName = patternParts[i].slice(1);
            params[paramName] = parts[i];
          } else if (patternParts[i] !== parts[i]) {
            match = false;
            break;
          }
        }
        
        if (match) {
          return params;
        }
      }
    }
    
    return params;
  }

  /**
   * Check if user is authenticated
   */
  async checkAuth() {
    try {
      const sessionData = await db.config.get('currentUser');
      return !!sessionData?.value;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check user permissions
   */
  async checkPermissions(requiredPermissions) {
    try {
      const sessionData = await db.config.get('currentUser');
      const user = sessionData?.value;
      
      if (!user || !user.perfil) {
        return false;
      }
      
      // Admin has all permissions
      if (user.perfil === 'admin') {
        return true;
      }
      
      // Check specific permissions
      return requiredPermissions.every(permission => 
        user.permissions?.includes(permission)
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * Update active navigation item
   */
  updateNavigation(path) {
    // Remove active class from all nav items
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
    });
    
    // Add active class to current nav item
    const activeNav = document.querySelector(`[href="#${path}"]`)?.closest('.nav-item');
    if (activeNav) {
      activeNav.classList.add('active');
    }
  }

  /**
   * Show error message
   */
  showError(message) {
    const content = document.getElementById('page-content');
    if (content) {
      content.innerHTML = `
        <div class="empty-state">
          <svg class="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <h2 class="empty-state-title">Erro</h2>
          <p class="empty-state-description">${message}</p>
          <button class="btn btn-primary" onclick="router.navigate('/dashboard')">
            Voltar ao Dashboard
          </button>
        </div>
      `;
    }
  }

  /**
   * Reload current route
   */
  reload() {
    this.handleRouteChange();
  }

  /**
   * Go back in history
   */
  back() {
    window.history.back();
  }
}

// Create router instance
const router = new Router();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Router, router };
} else {
  window.Router = Router;
  window.router = router;
}
