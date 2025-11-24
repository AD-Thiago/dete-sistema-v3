/**
 * Database module using Dexie.js (IndexedDB wrapper)
 * Provides structured data persistence for the DETE system
 */

// Initialize Dexie database
const db = new Dexie('DETEDatabase');

// Define database schema
db.version(1).stores({
  // Core entities
  pacientes: '++id, nome, cpf, status, dataCadastro, cuidadorResponsavel',
  profissionais: '++id, nome, especialidade, registro, status',
  agendamentos: '++id, pacienteId, profissionalId, data, status, tipo',
  
  // Clinical records
  evolucaoClinica: '++id, pacienteId, profissionalId, dataHora, tipo',
  planosCuidado: '++id, pacienteId, status, dataCriacao, dataRevisao',
  medicacoes: '++id, pacienteId, profissionalId, dataInicio, dataFim, status',
  exames: '++id, pacienteId, profissionalId, dataSolicitacao, dataRealizacao, status',
  
  // Caregivers
  cuidadores: '++id, nome, cpf, especializacao, status, salarioBase, valorHora',
  escalas: '++id, cuidadorId, pacienteId, dataInicio, dataFim, turno',
  pontosRegistrados: '++id, cuidadorId, data, tipo, timestamp',
  fechamentosMensais: '++id, cuidadorId, mesAno, totalHoras, valorTotal, status',
  
  // Financial
  lancamentosFinanceiros: '++id, data, tipo, categoria, valor, status, pacienteId',
  orcamentos: '++id, mesAno, categoria, valorPrevisto, valorRealizado',
  
  // Timeline
  timelineEventos: '++id, pacienteId, tipo, data, titulo, descricao',
  
  // System
  usuarios: '++id, email, &username, perfil, status',
  config: '&key, value',
  sync: '++id, table, recordId, action, timestamp, synced',
  auditLog: '++id, userId, action, table, recordId, timestamp'
});

// Helper functions

/**
 * Generic CRUD operations
 */
const crud = {
  /**
   * Create a new record
   */
  async create(table, data) {
    try {
      const id = await db[table].add({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Add to sync queue
      await addToSyncQueue(table, id, 'create');
      
      // Log audit
      await logAudit('create', table, id);
      
      return id;
    } catch (error) {
      console.error(`Error creating ${table}:`, error);
      throw error;
    }
  },
  
  /**
   * Read a record by ID
   */
  async read(table, id) {
    try {
      return await db[table].get(id);
    } catch (error) {
      console.error(`Error reading ${table}:`, error);
      throw error;
    }
  },
  
  /**
   * Update a record
   */
  async update(table, id, changes) {
    try {
      await db[table].update(id, {
        ...changes,
        updatedAt: new Date()
      });
      
      // Add to sync queue
      await addToSyncQueue(table, id, 'update');
      
      // Log audit
      await logAudit('update', table, id);
      
      return true;
    } catch (error) {
      console.error(`Error updating ${table}:`, error);
      throw error;
    }
  },
  
  /**
   * Delete a record
   */
  async delete(table, id) {
    try {
      await db[table].delete(id);
      
      // Add to sync queue
      await addToSyncQueue(table, id, 'delete');
      
      // Log audit
      await logAudit('delete', table, id);
      
      return true;
    } catch (error) {
      console.error(`Error deleting ${table}:`, error);
      throw error;
    }
  },
  
  /**
   * List all records
   */
  async list(table, filters = {}) {
    try {
      let query = db[table].toCollection();
      
      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        query = query.filter(item => item[key] === value);
      });
      
      return await query.toArray();
    } catch (error) {
      console.error(`Error listing ${table}:`, error);
      throw error;
    }
  }
};

/**
 * Add operation to sync queue
 */
async function addToSyncQueue(table, recordId, action) {
  try {
    await db.sync.add({
      table,
      recordId,
      action,
      timestamp: Date.now(),
      synced: 0
    });
  } catch (error) {
    console.error('Error adding to sync queue:', error);
  }
}

/**
 * Log audit trail
 */
async function logAudit(action, table, recordId) {
  try {
    const user = await getCurrentUser();
    
    await db.auditLog.add({
      userId: user?.id || null,
      action,
      table,
      recordId,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error logging audit:', error);
  }
}

/**
 * Get current user from session
 */
async function getCurrentUser() {
  try {
    const sessionData = await db.config.get('currentUser');
    return sessionData?.value || null;
  } catch (error) {
    return null;
  }
}

/**
 * Database utilities
 */
const dbUtils = {
  /**
   * Clear all data (for testing)
   */
  async clearAll() {
    const tables = [
      'pacientes', 'profissionais', 'agendamentos',
      'evolucaoClinica', 'planosCuidado', 'medicacoes', 'exames',
      'cuidadores', 'escalas', 'pontosRegistrados', 'fechamentosMensais',
      'lancamentosFinanceiros', 'orcamentos',
      'timelineEventos', 'sync', 'auditLog'
    ];
    
    for (const table of tables) {
      await db[table].clear();
    }
    
    console.log('All tables cleared');
  },
  
  /**
   * Export data to JSON
   */
  async exportData() {
    const data = {};
    
    const tables = [
      'pacientes', 'profissionais', 'agendamentos',
      'evolucaoClinica', 'planosCuidado', 'medicacoes', 'exames',
      'cuidadores', 'escalas', 'pontosRegistrados',
      'lancamentosFinanceiros', 'timelineEventos'
    ];
    
    for (const table of tables) {
      data[table] = await db[table].toArray();
    }
    
    return data;
  },
  
  /**
   * Import data from JSON
   */
  async importData(data) {
    for (const [table, records] of Object.entries(data)) {
      if (db[table]) {
        await db[table].bulkAdd(records);
      }
    }
    
    console.log('Data imported successfully');
  }
};

// Export database and utilities
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { db, crud, dbUtils };
} else {
  window.db = db;
  window.crud = crud;
  window.dbUtils = dbUtils;
}