/**
 * Auth module - Authentication and authorization
 * Handles user login, session management, and permissions
 */

const Auth = {
  /**
   * Initialize authentication system
   */
  async init() {
    // Check for existing session
    const currentUser = await this.getCurrentUser();
    
    if (currentUser) {
      console.log('User session found:', currentUser.username);
      return currentUser;
    }
    
    console.log('No active session');
    return null;
  },

  /**
   * Login user
   */
  async login(username, password) {
    try {
      // Get user from database
      const users = await db.usuarios.where('username').equals(username).toArray();
      
      if (users.length === 0) {
        throw new Error('Usuário não encontrado');
      }
      
      const user = users[0];
      
      // In production, use proper password hashing (bcrypt, etc.)
      // For now, simple comparison
      if (user.password !== password) {
        throw new Error('Senha incorreta');
      }
      
      // Check if user is active
      if (user.status !== 'active') {
        throw new Error('Usuário inativo');
      }
      
      // Create session
      await this.createSession(user);
      
      // Log audit
      await db.auditLog.add({
        userId: user.id,
        action: 'login',
        table: 'usuarios',
        recordId: user.id,
        timestamp: Date.now()
      });
      
      console.log('Login successful:', user.username);
      
      return {
        success: true,
        user: this.sanitizeUser(user)
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Logout user
   */
  async logout() {
    try {
      const currentUser = await this.getCurrentUser();
      
      if (currentUser) {
        // Log audit
        await db.auditLog.add({
          userId: currentUser.id,
          action: 'logout',
          table: 'usuarios',
          recordId: currentUser.id,
          timestamp: Date.now()
        });
      }
      
      // Clear session
      await db.config.delete('currentUser');
      
      console.log('Logout successful');
      
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Create user session
   */
  async createSession(user) {
    const sessionData = {
      id: user.id,
      username: user.username,
      email: user.email,
      perfil: user.perfil,
      permissions: this.getPermissions(user.perfil),
      loginTime: Date.now()
    };
    
    await db.config.put({
      key: 'currentUser',
      value: sessionData
    });
  },

  /**
   * Get current user from session
   */
  async getCurrentUser() {
    try {
      const sessionData = await db.config.get('currentUser');
      return sessionData?.value || null;
    } catch (error) {
      return null;
    }
  },

  /**
   * Check if user is authenticated
   */
  async isAuthenticated() {
    const user = await this.getCurrentUser();
    return !!user;
  },

  /**
   * Check if user has specific permission
   */
  async hasPermission(permission) {
    const user = await this.getCurrentUser();
    
    if (!user) {
      return false;
    }
    
    // Admin has all permissions
    if (user.perfil === 'admin') {
      return true;
    }
    
    return user.permissions?.includes(permission) || false;
  },

  /**
   * Check if user has any of the specified roles
   */
  async hasRole(...roles) {
    const user = await this.getCurrentUser();
    
    if (!user) {
      return false;
    }
    
    return roles.includes(user.perfil);
  },

  /**
   * Get permissions for a role
   */
  getPermissions(perfil) {
    const permissions = {
      admin: [
        'dashboard.view',
        'pacientes.view', 'pacientes.create', 'pacientes.edit', 'pacientes.delete',
        'cuidadores.view', 'cuidadores.create', 'cuidadores.edit', 'cuidadores.delete',
        'financeiro.view', 'financeiro.create', 'financeiro.edit', 'financeiro.delete',
        'agendamentos.view', 'agendamentos.create', 'agendamentos.edit', 'agendamentos.delete',
        'relatorios.view', 'relatorios.export',
        'configuracoes.view', 'configuracoes.edit',
        'usuarios.view', 'usuarios.create', 'usuarios.edit', 'usuarios.delete'
      ],
      medico: [
        'dashboard.view',
        'pacientes.view', 'pacientes.create', 'pacientes.edit',
        'agendamentos.view', 'agendamentos.create', 'agendamentos.edit',
        'relatorios.view'
      ],
      cuidador: [
        'dashboard.view',
        'pacientes.view',
        'agendamentos.view',
        'escalas.view'
      ],
      financeiro: [
        'dashboard.view',
        'financeiro.view', 'financeiro.create', 'financeiro.edit',
        'relatorios.view', 'relatorios.export'
      ]
    };
    
    return permissions[perfil] || [];
  },

  /**
   * Register new user
   */
  async register(userData) {
    try {
      // Validate required fields
      if (!userData.username || !userData.email || !userData.password) {
        throw new Error('Campos obrigatórios não preenchidos');
      }
      
      // Check if username already exists
      const existingUser = await db.usuarios
        .where('username')
        .equals(userData.username)
        .first();
      
      if (existingUser) {
        throw new Error('Nome de usuário já existe');
      }
      
      // Check if email already exists
      const existingEmail = await db.usuarios
        .where('email')
        .equals(userData.email)
        .first();
      
      if (existingEmail) {
        throw new Error('Email já cadastrado');
      }
      
      // Create user
      const userId = await db.usuarios.add({
        username: userData.username,
        email: userData.email,
        password: userData.password, // In production, hash this!
        perfil: userData.perfil || 'cuidador',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log('User registered:', userId);
      
      return {
        success: true,
        userId
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Update user password
   */
  async updatePassword(currentPassword, newPassword) {
    try {
      const user = await this.getCurrentUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }
      
      // Get full user data
      const fullUser = await db.usuarios.get(user.id);
      
      // Verify current password
      if (fullUser.password !== currentPassword) {
        throw new Error('Senha atual incorreta');
      }
      
      // Update password
      await db.usuarios.update(user.id, {
        password: newPassword, // In production, hash this!
        updatedAt: new Date()
      });
      
      // Log audit
      await db.auditLog.add({
        userId: user.id,
        action: 'password_change',
        table: 'usuarios',
        recordId: user.id,
        timestamp: Date.now()
      });
      
      return { success: true };
    } catch (error) {
      console.error('Password update error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Request password reset
   */
  async requestPasswordReset(email) {
    try {
      // Get user by email
      const users = await db.usuarios.where('email').equals(email).toArray();
      
      if (users.length === 0) {
        // Don't reveal if email exists for security
        return { success: true };
      }
      
      // In production, send email with reset token
      // For now, just log
      console.log('Password reset requested for:', email);
      
      return { success: true };
    } catch (error) {
      console.error('Password reset error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Sanitize user data (remove sensitive fields)
   */
  sanitizeUser(user) {
    const { password, ...sanitized } = user;
    return sanitized;
  },

  /**
   * Create default admin user if none exists
   */
  async createDefaultAdmin() {
    try {
      const adminCount = await db.usuarios
        .where('perfil')
        .equals('admin')
        .count();
      
      if (adminCount === 0) {
        await db.usuarios.add({
          username: 'admin',
          email: 'admin@dete.com',
          password: 'admin123', // Change this in production!
          perfil: 'admin',
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        console.log('Default admin user created');
        console.log('Username: admin, Password: admin123');
      }
    } catch (error) {
      console.error('Error creating default admin:', error);
    }
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Auth };
} else {
  window.Auth = Auth;
}
