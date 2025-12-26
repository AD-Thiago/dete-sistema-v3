/**
 * DETE v4.0 - Supabase Client
 * Cliente JavaScript para integração com Supabase
 */

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Configurar com suas credenciais do Supabase
const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL || 'https://seu-projeto.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY || 'sua-chave-anonima';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// ============================================
// MÓDULO: Pacientes
// ============================================

export class PacienteManager {
  /**
   * Buscar paciente por CPF
   */
  async getPorCPF(cpf) {
    const { data, error } = await supabase
      .from('pacientes')
      .select('*')
      .eq('cpf', cpf)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Buscar paciente Dete
   */
  async getDete() {
    return this.getPorCPF('146.161.618-28');
  }

  /**
   * Atualizar foto do paciente
   */
  async atualizarFoto(pacienteId, file) {
    // Upload para Storage
    const fileName = `${pacienteId}/${Date.now()}_${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('fotos')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    // Obter URL pública
    const { data: urlData } = supabase.storage
      .from('fotos')
      .getPublicUrl(fileName);

    // Atualizar paciente
    const { error: updateError } = await supabase
      .from('pacientes')
      .update({ foto_url: urlData.publicUrl })
      .eq('id', pacienteId);

    if (updateError) throw updateError;

    return urlData.publicUrl;
  }
}

// ============================================
// MÓDULO: Medicações
// ============================================

export class MedicacaoManager {
  /**
   * Listar medicações ativas do paciente
   */
  async listarAtivas(pacienteId) {
    const { data, error } = await supabase
      .from('medicacoes')
      .select('*')
      .eq('paciente_id', pacienteId)
      .eq('ativo', true)
      .order('nome');

    if (error) throw error;
    return data;
  }

  /**
   * Registrar administração de medicação
   */
  async registrarAdministracao(medicacaoId, horarioPrevisto, status = 'TOMADA', observacoes = null) {
    const { data, error } = await supabase
      .from('medicacao_administracoes')
      .insert({
        medicacao_id: medicacaoId,
        horario_previsto: horarioPrevisto,
        horario_administrado: status === 'TOMADA' ? new Date().toISOString() : null,
        administrado_por: (await supabase.auth.getUser()).data.user?.id,
        status,
        observacoes,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Atualizar estoque de medicação
   */
  async atualizarEstoque(medicacaoId, novoEstoque) {
    const { data, error } = await supabase
      .from('medicacoes')
      .update({ estoque_atual: novoEstoque })
      .eq('id', medicacaoId)
      .select()
      .single();

    if (error) throw error;

    // Trigger automático criará alerta se estoque baixo
    return data;
  }

  /**
   * Obter horário de medicações de hoje
   */
  async getHorarioHoje(pacienteId) {
    const hoje = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('medicacoes')
      .select(`
        id,
        nome,
        dosagem,
        horarios,
        medicacao_administracoes!inner (
          id,
          horario_previsto,
          horario_administrado,
          status
        )
      `)
      .eq('paciente_id', pacienteId)
      .eq('ativo', true)
      .gte('medicacao_administracoes.horario_previsto', `${hoje}T00:00:00`)
      .lte('medicacao_administracoes.horario_previsto', `${hoje}T23:59:59`)
      .order('medicacao_administracoes.horario_previsto');

    if (error) throw error;
    return data;
  }
}

// ============================================
// MÓDULO: Sinais Vitais
// ============================================

export class SinaisVitaisManager {
  /**
   * Registrar sinais vitais
   */
  async registrar(pacienteId, dados) {
    const { data, error } = await supabase
      .from('sinais_vitais')
      .insert({
        paciente_id: pacienteId,
        data_hora: new Date().toISOString(),
        ...dados,
        medido_por: (await supabase.auth.getUser()).data.user?.id,
      })
      .select()
      .single();

    if (error) throw error;

    // Trigger automático criará alertas se PA elevada
    return data;
  }

  /**
   * Obter histórico de pressão arterial
   */
  async getHistoricoPA(pacienteId, dias = 30) {
    const dataInicio = new Date();
    dataInicio.setDate(dataInicio.getDate() - dias);

    const { data, error } = await supabase
      .from('sinais_vitais')
      .select('data_hora, pressao_sistolica, pressao_diastolica')
      .eq('paciente_id', pacienteId)
      .gte('data_hora', dataInicio.toISOString())
      .not('pressao_sistolica', 'is', null)
      .not('pressao_diastolica', 'is', null)
      .order('data_hora');

    if (error) throw error;
    return data;
  }

  /**
   * Obter última medição
   */
  async getUltima(pacienteId) {
    const { data, error } = await supabase
      .from('sinais_vitais')
      .select('*')
      .eq('paciente_id', pacienteId)
      .order('data_hora', { ascending: false })
      .limit(1)
      .single();

    if (error) throw error;
    return data;
  }
}

// ============================================
// MÓDULO: Exames
// ============================================

export class ExameManager {
  /**
   * Upload e processar exame PDF
   */
  async uploadExame(pacienteId, file, tipoExame = 'LABORATORIAL') {
    try {
      // 1. Upload para Storage
      const fileName = `${pacienteId}/${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('exames')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // 2. Criar registro no banco
      const { data: examData, error: examError } = await supabase
        .from('exames')
        .insert({
          paciente_id: pacienteId,
          tipo_exame: tipoExame,
          data_realizacao: new Date().toISOString().split('T')[0],
          arquivo_url: uploadData.path,
          arquivo_nome: file.name,
          status: 'PENDENTE',
        })
        .select()
        .single();

      if (examError) throw examError;

      // 3. Processar com IA (Edge Function)
      // TODO: Implementar quando Edge Function estiver deployada
      // const { data: processData } = await supabase.functions
      //   .invoke('process-exam-pdf', { body: { examId: examData.id } });

      return examData;
    } catch (error) {
      console.error('Erro ao processar exame:', error);
      throw error;
    }
  }

  /**
   * Listar exames do paciente
   */
  async listar(pacienteId, limit = 20) {
    const { data, error } = await supabase
      .from('exames')
      .select('*')
      .eq('paciente_id', pacienteId)
      .order('data_realizacao', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  /**
   * Buscar exames por tipo
   */
  async buscarPorTipo(pacienteId, tipoExame) {
    const { data, error } = await supabase
      .from('exames')
      .select('*')
      .eq('paciente_id', pacienteId)
      .eq('tipo_exame', tipoExame)
      .order('data_realizacao', { ascending: false });

    if (error) throw error;
    return data;
  }
}

// ============================================
// MÓDULO: Alertas
// ============================================

export class AlertaManager {
  /**
   * Listar alertas ativos
   */
  async listarAtivos(pacienteId) {
    const { data, error } = await supabase
      .from('alertas')
      .select('*')
      .eq('paciente_id', pacienteId)
      .eq('resolvido', false)
      .order('severidade') // EMERGENCIA primeiro
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  /**
   * Marcar alerta como visualizado
   */
  async marcarVisualizado(alertaId) {
    const { error } = await supabase
      .from('alertas')
      .update({
        visualizado: true,
        visualizado_em: new Date().toISOString(),
        visualizado_por: (await supabase.auth.getUser()).data.user?.id,
      })
      .eq('id', alertaId);

    if (error) throw error;
  }

  /**
   * Marcar alerta como resolvido
   */
  async marcarResolvido(alertaId) {
    const { error } = await supabase
      .from('alertas')
      .update({
        resolvido: true,
        resolvido_em: new Date().toISOString(),
        resolvido_por: (await supabase.auth.getUser()).data.user?.id,
      })
      .eq('id', alertaId);

    if (error) throw error;
  }

  /**
   * Subscrever alertas em tempo real
   */
  subscribeNovosAlertas(pacienteId, callback) {
    const subscription = supabase
      .channel('alertas')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'alertas',
          filter: `paciente_id=eq.${pacienteId}`,
        },
        (payload) => {
          const alerta = payload.new;

          // Notificação push (se permitido)
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`DETE - ${alerta.severidade}`, {
              body: alerta.mensagem,
              icon: '/icons/icon-192.png',
              badge: '/icons/badge.png',
              vibrate: alerta.severidade === 'EMERGENCIA' ? [200, 100, 200] : [100],
              tag: alerta.id,
            });
          }

          // Callback customizado
          callback(alerta);
        }
      )
      .subscribe();

    return subscription;
  }
}

// ============================================
// MÓDULO: Consultas
// ============================================

export class ConsultaManager {
  /**
   * Listar próximas consultas
   */
  async listarProximas(pacienteId) {
    const { data, error } = await supabase
      .from('consultas')
      .select('*')
      .eq('paciente_id', pacienteId)
      .in('status', ['AGENDADA', 'CONFIRMADA'])
      .gte('data_hora', new Date().toISOString())
      .order('data_hora');

    if (error) throw error;
    return data;
  }

  /**
   * Agendar consulta
   */
  async agendar(pacienteId, dados) {
    const { data, error } = await supabase
      .from('consultas')
      .insert({
        paciente_id: pacienteId,
        status: 'AGENDADA',
        ...dados,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Marcar como realizada
   */
  async marcarRealizada(consultaId, observacoes = null) {
    const { error } = await supabase
      .from('consultas')
      .update({
        status: 'REALIZADA',
        observacoes,
      })
      .eq('id', consultaId);

    if (error) throw error;
  }
}

// ============================================
// MÓDULO: Autenticação
// ============================================

export class AuthManager {
  /**
   * Login com email/senha
   */
  async login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  }

  /**
   * Login com Google
   */
  async loginComGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });

    if (error) throw error;
    return data;
  }

  /**
   * Registrar novo usuário
   */
  async registrar(email, password, metadata = {}) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });

    if (error) throw error;
    return data;
  }

  /**
   * Logout
   */
  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  /**
   * Obter usuário atual
   */
  async getUsuarioAtual() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }

  /**
   * Observar mudanças de autenticação
   */
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
  }
}

// ============================================
// EXPORTAR INSTÂNCIAS
// ============================================

export const pacienteManager = new PacienteManager();
export const medicacaoManager = new MedicacaoManager();
export const sinaisVitaisManager = new SinaisVitaisManager();
export const exameManager = new ExameManager();
export const alertaManager = new AlertaManager();
export const consultaManager = new ConsultaManager();
export const authManager = new AuthManager();
