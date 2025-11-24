/**
 * Sync module - Google Sheets synchronization
 * Handles bidirectional sync between IndexedDB and Google Sheets
 */

const Sync = {
  // Google API configuration
  config: {
    clientId: null,
    apiKey: null,
    spreadsheetId: null,
    discoveryDocs: [
      'https://sheets.googleapis.com/$discovery/rest?version=v4',
      'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'
    ],
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.file'
    ].join(' ')
  },

  // Sync status
  status: {
    initialized: false,
    syncing: false,
    lastSync: null,
    pendingOperations: 0
  },

  /**
   * Initialize Google API
   */
  async init() {
    try {
      // Load config from database
      const config = await this.loadConfig();
      
      if (!config.clientId || !config.apiKey) {
        console.log('Google API not configured');
        return false;
      }
      
      this.config.clientId = config.clientId;
      this.config.apiKey = config.apiKey;
      this.config.spreadsheetId = config.spreadsheetId;
      
      // Initialize Google API client
      await this.loadGoogleAPI();
      
      this.status.initialized = true;
      console.log('Sync module initialized');
      
      return true;
    } catch (error) {
      console.error('Sync initialization error:', error);
      return false;
    }
  },

  /**
   * Load Google API client library
   */
  async loadGoogleAPI() {
    return new Promise((resolve, reject) => {
      if (typeof gapi === 'undefined') {
        reject(new Error('Google API not loaded'));
        return;
      }
      
      gapi.load('client:auth2', async () => {
        try {
          await gapi.client.init({
            apiKey: this.config.apiKey,
            clientId: this.config.clientId,
            discoveryDocs: this.config.discoveryDocs,
            scope: this.config.scopes
          });
          
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  },

  /**
   * Load sync configuration from database
   */
  async loadConfig() {
    try {
      const clientIdConfig = await db.config.get('google_client_id');
      const apiKeyConfig = await db.config.get('google_api_key');
      const spreadsheetConfig = await db.config.get('google_spreadsheet_id');
      
      return {
        clientId: clientIdConfig?.value,
        apiKey: apiKeyConfig?.value,
        spreadsheetId: spreadsheetConfig?.value
      };
    } catch (error) {
      return {};
    }
  },

  /**
   * Save sync configuration
   */
  async saveConfig(config) {
    try {
      if (config.clientId) {
        await db.config.put({ key: 'google_client_id', value: config.clientId });
      }
      if (config.apiKey) {
        await db.config.put({ key: 'google_api_key', value: config.apiKey });
      }
      if (config.spreadsheetId) {
        await db.config.put({ key: 'google_spreadsheet_id', value: config.spreadsheetId });
      }
      
      return true;
    } catch (error) {
      console.error('Error saving config:', error);
      return false;
    }
  },

  /**
   * Check if user is signed in to Google
   */
  isSignedIn() {
    if (!this.status.initialized) {
      return false;
    }
    
    return gapi.auth2.getAuthInstance().isSignedIn.get();
  },

  /**
   * Sign in to Google
   */
  async signIn() {
    try {
      if (!this.status.initialized) {
        throw new Error('Sync not initialized');
      }
      
      await gapi.auth2.getAuthInstance().signIn();
      console.log('Signed in to Google');
      
      return true;
    } catch (error) {
      console.error('Sign in error:', error);
      return false;
    }
  },

  /**
   * Sign out from Google
   */
  async signOut() {
    try {
      if (!this.status.initialized) {
        return true;
      }
      
      await gapi.auth2.getAuthInstance().signOut();
      console.log('Signed out from Google');
      
      return true;
    } catch (error) {
      console.error('Sign out error:', error);
      return false;
    }
  },

  /**
   * Get pending sync operations count
   */
  async getPendingCount() {
    try {
      const count = await db.sync.where('synced').equals(0).count();
      this.status.pendingOperations = count;
      return count;
    } catch (error) {
      return 0;
    }
  },

  /**
   * Sync all pending operations
   */
  async syncAll() {
    if (this.status.syncing) {
      console.log('Sync already in progress');
      return false;
    }
    
    try {
      this.status.syncing = true;
      
      // Check if signed in
      if (!this.isSignedIn()) {
        throw new Error('Not signed in to Google');
      }
      
      // Get pending operations
      const pending = await db.sync.where('synced').equals(0).toArray();
      
      console.log(`Syncing ${pending.length} operations...`);
      
      let successCount = 0;
      let errorCount = 0;
      
      // Process each operation
      for (const operation of pending) {
        try {
          await this.syncOperation(operation);
          
          // Mark as synced
          await db.sync.update(operation.id, { synced: 1 });
          
          successCount++;
        } catch (error) {
          console.error('Sync operation failed:', operation, error);
          errorCount++;
        }
      }
      
      // Update last sync time
      this.status.lastSync = Date.now();
      await db.config.put({ key: 'last_sync', value: this.status.lastSync });
      
      console.log(`Sync complete: ${successCount} success, ${errorCount} errors`);
      
      return {
        success: true,
        successCount,
        errorCount
      };
    } catch (error) {
      console.error('Sync error:', error);
      return {
        success: false,
        error: error.message
      };
    } finally {
      this.status.syncing = false;
    }
  },

  /**
   * Sync a single operation
   */
  async syncOperation(operation) {
    const { table, recordId, action } = operation;
    
    // Get sheet name for table
    const sheetName = this.getSheetName(table);
    
    if (!sheetName) {
      console.warn('No sheet mapping for table:', table);
      return;
    }
    
    // Get record data
    let record = null;
    if (action !== 'delete') {
      record = await db[table].get(recordId);
    }
    
    // Perform sync based on action
    switch (action) {
      case 'create':
        await this.appendRow(sheetName, record);
        break;
      case 'update':
        await this.updateRow(sheetName, recordId, record);
        break;
      case 'delete':
        await this.deleteRow(sheetName, recordId);
        break;
    }
  },

  /**
   * Get Google Sheets sheet name for table
   */
  getSheetName(table) {
    const mapping = {
      pacientes: 'Pacientes',
      cuidadores: 'Cuidadores',
      agendamentos: 'Agendamentos',
      lancamentosFinanceiros: 'Financeiro',
      timelineEventos: 'Timeline'
    };
    
    return mapping[table];
  },

  /**
   * Append row to Google Sheet
   */
  async appendRow(sheetName, data) {
    try {
      const range = `${sheetName}!A:Z`;
      const values = [this.recordToArray(data)];
      
      await gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: this.config.spreadsheetId,
        range: range,
        valueInputOption: 'RAW',
        resource: { values }
      });
      
      console.log('Row appended to', sheetName);
    } catch (error) {
      console.error('Error appending row:', error);
      throw error;
    }
  },

  /**
   * Update row in Google Sheet
   */
  async updateRow(sheetName, recordId, data) {
    try {
      // Find row by ID
      const rowIndex = await this.findRowById(sheetName, recordId);
      
      if (rowIndex === -1) {
        // Row not found, append instead
        await this.appendRow(sheetName, data);
        return;
      }
      
      const range = `${sheetName}!A${rowIndex}:Z${rowIndex}`;
      const values = [this.recordToArray(data)];
      
      await gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: this.config.spreadsheetId,
        range: range,
        valueInputOption: 'RAW',
        resource: { values }
      });
      
      console.log('Row updated in', sheetName);
    } catch (error) {
      console.error('Error updating row:', error);
      throw error;
    }
  },

  /**
   * Delete row from Google Sheet
   */
  async deleteRow(sheetName, recordId) {
    try {
      const rowIndex = await this.findRowById(sheetName, recordId);
      
      if (rowIndex === -1) {
        console.log('Row not found for deletion');
        return;
      }
      
      // Clear the row instead of deleting to maintain row numbers
      const range = `${sheetName}!A${rowIndex}:Z${rowIndex}`;
      
      await gapi.client.sheets.spreadsheets.values.clear({
        spreadsheetId: this.config.spreadsheetId,
        range: range
      });
      
      console.log('Row deleted from', sheetName);
    } catch (error) {
      console.error('Error deleting row:', error);
      throw error;
    }
  },

  /**
   * Find row index by record ID
   */
  async findRowById(sheetName, recordId) {
    try {
      const range = `${sheetName}!A:A`;
      
      const response = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: this.config.spreadsheetId,
        range: range
      });
      
      const values = response.result.values || [];
      
      for (let i = 0; i < values.length; i++) {
        if (values[i][0] === String(recordId)) {
          return i + 1; // Sheet rows are 1-indexed
        }
      }
      
      return -1;
    } catch (error) {
      console.error('Error finding row:', error);
      return -1;
    }
  },

  /**
   * Convert record object to array for sheet row
   */
  recordToArray(record) {
    // Convert record to array based on known fields
    // This is a simplified version - in production, define proper schemas
    return Object.values(record);
  },

  /**
   * Pull data from Google Sheets to local database
   */
  async pullFromSheets() {
    try {
      if (!this.isSignedIn()) {
        throw new Error('Not signed in to Google');
      }
      
      console.log('Pulling data from Google Sheets...');
      
      // Pull each table
      const tables = ['pacientes', 'cuidadores', 'agendamentos', 'lancamentosFinanceiros'];
      
      for (const table of tables) {
        const sheetName = this.getSheetName(table);
        if (sheetName) {
          await this.pullTable(table, sheetName);
        }
      }
      
      console.log('Pull complete');
      
      return { success: true };
    } catch (error) {
      console.error('Pull error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Pull single table from sheet
   */
  async pullTable(table, sheetName) {
    try {
      const range = `${sheetName}!A:Z`;
      
      const response = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: this.config.spreadsheetId,
        range: range
      });
      
      const values = response.result.values || [];
      
      if (values.length === 0) {
        console.log('No data in', sheetName);
        return;
      }
      
      // First row is headers, skip it
      const dataRows = values.slice(1);
      
      console.log(`Pulled ${dataRows.length} rows from ${sheetName}`);
      
      // In production, properly map columns to record fields
      // For now, this is a placeholder
    } catch (error) {
      console.error('Error pulling table:', error);
    }
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Sync };
} else {
  window.Sync = Sync;
}
