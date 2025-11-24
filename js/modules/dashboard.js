/**
 * Dashboard module
 * Main dashboard with statistics and overview
 */

const dashboard = {
  /**
   * Render dashboard
   */
  async render() {
    const content = document.getElementById('page-content');
    if (!content) return;
    
    // Get statistics
    const stats = await this.getStats();
    
    content.innerHTML = `
      <div class="space-y-6">
        <!-- Page Header -->
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p class="mt-2 text-gray-600 dark:text-gray-400">Visão geral do sistema</p>
        </div>
        
        <!-- Stats Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          ${this.renderStatCard('Pacientes', stats.pacientes, 'primary', 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z')}
          ${this.renderStatCard('Cuidadores', stats.cuidadores, 'success', 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z')}
          ${this.renderStatCard('Agendamentos Hoje', stats.agendamentosHoje, 'warning', 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z')}
          ${this.renderStatCard('Pendências', stats.pendencias, 'error', 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z')}
        </div>
        
        <!-- Charts Row -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Recent Activity -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">Atividades Recentes</h3>
            </div>
            <div class="card-body">
              ${this.renderRecentActivity()}
            </div>
          </div>
          
          <!-- Quick Actions -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">Ações Rápidas</h3>
            </div>
            <div class="card-body">
              ${this.renderQuickActions()}
            </div>
          </div>
        </div>
        
        <!-- Alerts -->
        ${stats.alerts.length > 0 ? this.renderAlerts(stats.alerts) : ''}
      </div>
    `;
  },

  /**
   * Get dashboard statistics
   */
  async getStats() {
    try {
      const pacientesCount = await db.pacientes.count();
      const cuidadoresCount = await db.cuidadores.count();
      
      // Get today's appointments
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const agendamentosHoje = await db.agendamentos
        .where('data')
        .between(today.getTime(), tomorrow.getTime())
        .count();
      
      // Get pending sync operations
      const pendencias = await db.sync.where('synced').equals(0).count();
      
      // Check for alerts
      const alerts = [];
      
      if (pendencias > 0) {
        alerts.push({
          type: 'warning',
          message: `Você tem ${pendencias} ${pendencias === 1 ? 'operação pendente' : 'operações pendentes'} de sincronização.`
        });
      }
      
      return {
        pacientes: pacientesCount,
        cuidadores: cuidadoresCount,
        agendamentosHoje,
        pendencias,
        alerts
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      return {
        pacientes: 0,
        cuidadores: 0,
        agendamentosHoje: 0,
        pendencias: 0,
        alerts: []
      };
    }
  },

  /**
   * Render stat card
   */
  renderStatCard(title, value, color, iconPath) {
    const colors = {
      primary: 'bg-primary-50 text-primary-600 dark:bg-primary-900 dark:text-primary-300',
      success: 'bg-green-50 text-green-600 dark:bg-green-900 dark:text-green-300',
      warning: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300',
      error: 'bg-red-50 text-red-600 dark:bg-red-900 dark:text-red-300'
    };
    
    return `
      <div class="card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600 dark:text-gray-400">${title}</p>
            <p class="mt-2 text-3xl font-bold text-gray-900 dark:text-white">${value}</p>
          </div>
          <div class="p-3 rounded-lg ${colors[color]}">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${iconPath}"></path>
            </svg>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Render recent activity
   */
  renderRecentActivity() {
    return `
      <div class="space-y-4">
        <div class="flex items-start gap-3">
          <div class="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-primary-500"></div>
          <div class="flex-1">
            <p class="text-sm font-medium text-gray-900 dark:text-white">Sistema iniciado</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">Agora mesmo</p>
          </div>
        </div>
        <div class="empty-state-description text-center py-8">
          <p>Nenhuma atividade recente</p>
        </div>
      </div>
    `;
  },

  /**
   * Render quick actions
   */
  renderQuickActions() {
    return `
      <div class="grid grid-cols-2 gap-4">
        <button class="btn btn-primary" onclick="router.navigate('/pacientes')">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
          Novo Paciente
        </button>
        <button class="btn btn-primary" onclick="router.navigate('/agendamentos')">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
          </svg>
          Agendar
        </button>
        <button class="btn btn-secondary" onclick="router.navigate('/cuidadores')">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
          </svg>
          Cuidadores
        </button>
        <button class="btn btn-secondary" onclick="router.navigate('/financeiro')">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          Financeiro
        </button>
      </div>
    `;
  },

  /**
   * Render alerts
   */
  renderAlerts(alerts) {
    return `
      <div class="space-y-4">
        ${alerts.map(alert => `
          <div class="alert alert-${alert.type}">
            ${alert.message}
          </div>
        `).join('')}
      </div>
    `;
  }
};

// Export module
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { dashboard };
} else {
  window.dashboard = dashboard;
}
