/**
 * Main application entry point
 * Initializes and coordinates all modules
 */

const App = {
  // Application state
  state: {
    initialized: false,
    currentUser: null,
    darkMode: false
  },

  /**
   * Initialize the application
   */
  async init() {
    try {
      console.log('Initializing DETE v3.0...');
      
      // Initialize database
      await this.initDatabase();
      
      // Load theme preference
      this.loadTheme();
      
      // Initialize authentication
      await this.initAuth();
      
      // Initialize sync module
      await this.initSync();
      
      // Setup navigation
      this.setupNavigation();
      
      // Register routes
      this.registerRoutes();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Hide loading screen and show app
      this.hideLoadingScreen();
      
      // Initialize router
      await router.handleRouteChange();
      
      this.state.initialized = true;
      console.log('DETE v3.0 initialized successfully');
    } catch (error) {
      console.error('Application initialization error:', error);
      this.showError('Erro ao inicializar aplicação');
    }
  },

  /**
   * Initialize database
   */
  async initDatabase() {
    try {
      // Test database connection
      await db.open();
      console.log('Database initialized');
      
      // Create default admin if none exists
      await Auth.createDefaultAdmin();
    } catch (error) {
      console.error('Database initialization error:', error);
      throw error;
    }
  },

  /**
   * Initialize authentication
   */
  async initAuth() {
    try {
      const user = await Auth.init();
      this.state.currentUser = user;
      
      if (user) {
        console.log('User authenticated:', user.username);
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
    }
  },

  /**
   * Initialize sync module
   */
  async initSync() {
    try {
      await Sync.init();
      
      // Update pending sync count
      await this.updateSyncStatus();
    } catch (error) {
      console.error('Sync initialization error:', error);
    }
  },

  /**
   * Setup navigation menu
   */
  setupNavigation() {
    const nav = document.getElementById('sidebar-nav');
    if (!nav) return;
    
    const menuItems = [
      {
        icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
        title: 'Dashboard',
        href: '/dashboard'
      },
      {
        icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
        title: 'Pacientes',
        href: '/pacientes'
      },
      {
        icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
        title: 'Cuidadores',
        href: '/cuidadores'
      },
      {
        icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
        title: 'Agendamentos',
        href: '/agendamentos'
      },
      {
        icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
        title: 'Financeiro',
        href: '/financeiro'
      },
      {
        icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
        title: 'Timeline',
        href: '/timeline'
      },
      {
        icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
        title: 'Relatórios',
        href: '/relatorios'
      },
      {
        icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
        title: 'Configurações',
        href: '/configuracoes'
      }
    ];
    
    nav.innerHTML = menuItems.map(item => `
      <a href="#${item.href}" class="nav-item" data-link>
        <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${item.icon}"></path>
        </svg>
        <span>${item.title}</span>
      </a>
    `).join('');
  },

  /**
   * Register application routes
   */
  registerRoutes() {
    // Dashboard
    router.register('/dashboard', async () => {
      await this.loadModule('dashboard');
    }, { title: 'Dashboard - DETE v3.0' });
    
    // Pacientes
    router.register('/pacientes', async () => {
      await this.loadModule('pacientes');
    }, { title: 'Pacientes - DETE v3.0' });
    
    router.register('/pacientes/:id', async (params) => {
      await this.loadModule('pacientes', params);
    }, { title: 'Detalhes do Paciente - DETE v3.0' });
    
    // Cuidadores
    router.register('/cuidadores', async () => {
      await this.loadModule('cuidadores');
    }, { title: 'Cuidadores - DETE v3.0' });
    
    // Agendamentos
    router.register('/agendamentos', async () => {
      await this.loadModule('agendamentos');
    }, { title: 'Agendamentos - DETE v3.0' });
    
    // Financeiro
    router.register('/financeiro', async () => {
      await this.loadModule('financeiro');
    }, { title: 'Financeiro - DETE v3.0' });
    
    // Timeline
    router.register('/timeline', async () => {
      await this.loadModule('timeline');
    }, { title: 'Timeline - DETE v3.0' });
    
    // Relatórios
    router.register('/relatorios', async () => {
      await this.loadModule('relatorios');
    }, { title: 'Relatórios - DETE v3.0' });
    
    // Configurações
    router.register('/configuracoes', async () => {
      await this.loadModule('configuracoes');
    }, { title: 'Configurações - DETE v3.0' });
    
    // Login
    router.register('/login', async () => {
      await this.loadModule('login');
    }, { title: 'Login - DETE v3.0', requiresAuth: false });
    
    // 404
    router.register('/404', async () => {
      this.show404();
    }, { title: 'Página não encontrada - DETE v3.0', requiresAuth: false });
  },

  /**
   * Load a module
   */
  async loadModule(moduleName, params = {}) {
    const content = document.getElementById('page-content');
    if (!content) return;
    
    // Show loading
    content.innerHTML = `
      <div class="flex items-center justify-center" style="min-height: 400px;">
        <div class="text-center">
          <div class="spinner mx-auto mb-4"></div>
          <p class="text-gray-600 dark:text-gray-400">Carregando ${moduleName}...</p>
        </div>
      </div>
    `;
    
    try {
      // Check if module file exists
      const moduleScript = document.createElement('script');
      moduleScript.type = 'module';
      moduleScript.src = `/js/modules/${moduleName}.js`;
      
      // Wait for module to load
      await new Promise((resolve, reject) => {
        moduleScript.onload = resolve;
        moduleScript.onerror = reject;
        document.head.appendChild(moduleScript);
      });
      
      // Call module's render function if it exists
      if (window[moduleName] && typeof window[moduleName].render === 'function') {
        await window[moduleName].render(params);
      }
    } catch (error) {
      console.error(`Error loading module ${moduleName}:`, error);
      
      // Show placeholder for unimplemented modules
      content.innerHTML = `
        <div class="empty-state">
          <svg class="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
          </svg>
          <h2 class="empty-state-title">Módulo ${moduleName}</h2>
          <p class="empty-state-description">Este módulo está em desenvolvimento.</p>
          <button class="btn btn-primary" onclick="router.navigate('/dashboard')">
            Voltar ao Dashboard
          </button>
        </div>
      `;
    }
  },

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Mobile menu toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.getElementById('sidebar');
    
    if (mobileMenuBtn && sidebar) {
      mobileMenuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('-translate-x-full');
      });
    }
    
    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        this.toggleTheme();
      });
    }
    
    // User menu
    const userMenuBtn = document.getElementById('user-menu-btn');
    if (userMenuBtn) {
      userMenuBtn.addEventListener('click', () => {
        this.showUserMenu();
      });
    }
    
    // Global search
    const globalSearch = document.getElementById('global-search');
    if (globalSearch) {
      globalSearch.addEventListener('input', Utils.debounce((e) => {
        this.handleGlobalSearch(e.target.value);
      }, 300));
    }
  },

  /**
   * Hide loading screen
   */
  hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    const app = document.getElementById('app');
    
    if (loadingScreen) {
      loadingScreen.classList.add('hidden');
    }
    
    if (app) {
      app.classList.remove('hidden');
    }
  },

  /**
   * Load theme preference
   */
  loadTheme() {
    const savedTheme = localStorage.getItem('dete-theme');
    this.state.darkMode = savedTheme === 'dark';
    
    if (this.state.darkMode) {
      document.documentElement.classList.add('dark');
    }
  },

  /**
   * Toggle theme
   */
  toggleTheme() {
    this.state.darkMode = !this.state.darkMode;
    
    if (this.state.darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('dete-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('dete-theme', 'light');
    }
  },

  /**
   * Show user menu
   */
  showUserMenu() {
    // Create dropdown menu
    const dropdown = document.createElement('div');
    dropdown.className = 'dropdown-menu';
    dropdown.style.position = 'fixed';
    dropdown.style.top = '60px';
    dropdown.style.right = '20px';
    
    dropdown.innerHTML = `
      <button class="dropdown-item" onclick="router.navigate('/perfil')">
        Meu Perfil
      </button>
      <button class="dropdown-item" onclick="router.navigate('/configuracoes')">
        Configurações
      </button>
      <div class="dropdown-divider"></div>
      <button class="dropdown-item" onclick="App.logout()">
        Sair
      </button>
    `;
    
    document.body.appendChild(dropdown);
    
    // Remove on click outside
    setTimeout(() => {
      const closeMenu = (e) => {
        if (!dropdown.contains(e.target)) {
          dropdown.remove();
          document.removeEventListener('click', closeMenu);
        }
      };
      document.addEventListener('click', closeMenu);
    }, 100);
  },

  /**
   * Handle global search
   */
  async handleGlobalSearch(query) {
    if (!query || query.length < 2) return;
    
    console.log('Searching for:', query);
    // TODO: Implement search across all entities
  },

  /**
   * Update sync status
   */
  async updateSyncStatus() {
    const count = await Sync.getPendingCount();
    console.log(`Pending sync operations: ${count}`);
    // TODO: Update UI with sync status
  },

  /**
   * Logout user
   */
  async logout() {
    const confirmed = await Utils.showConfirm(
      'Sair',
      'Tem certeza que deseja sair?'
    );
    
    if (confirmed) {
      await Auth.logout();
      router.navigate('/login');
      Utils.showToast('Logout realizado com sucesso', 'success');
    }
  },

  /**
   * Show 404 page
   */
  show404() {
    const content = document.getElementById('page-content');
    if (content) {
      content.innerHTML = `
        <div class="empty-state">
          <svg class="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <h2 class="empty-state-title">Página não encontrada</h2>
          <p class="empty-state-description">A página que você está procurando não existe.</p>
          <button class="btn btn-primary" onclick="router.navigate('/dashboard')">
            Voltar ao Dashboard
          </button>
        </div>
      `;
    }
  },

  /**
   * Show error message
   */
  showError(message) {
    Utils.showToast(message, 'error');
  }
};

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => App.init());
} else {
  App.init();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { App };
} else {
  window.App = App;
}
