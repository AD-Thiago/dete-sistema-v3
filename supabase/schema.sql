-- ============================================
-- DETE v4.0 - COMPLETE DATABASE SCHEMA
-- ============================================
-- Supabase PostgreSQL Schema
-- Criado: 29/11/2025
-- ============================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector"; -- Para embeddings de IA

-- ============================================
-- TABELA: pacientes
-- ============================================
CREATE TABLE pacientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  nome_social TEXT,
  data_nascimento DATE NOT NULL,
  cpf TEXT UNIQUE,
  rg TEXT,
  tipo_sanguineo TEXT,
  alergias TEXT[],
  condicoes_cronicas TEXT[],
  foto_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_pacientes_cpf ON pacientes(cpf);
CREATE INDEX idx_pacientes_nome ON pacientes(nome);

-- Comentários
COMMENT ON TABLE pacientes IS 'Informações básicas dos pacientes';
COMMENT ON COLUMN pacientes.nome_social IS 'Nome pelo qual o paciente prefere ser chamado';
COMMENT ON COLUMN pacientes.condicoes_cronicas IS 'Array de condições crônicas diagnosticadas';

-- ============================================
-- TABELA: medicacoes
-- ============================================
CREATE TABLE medicacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  principio_ativo TEXT,
  dosagem TEXT NOT NULL,
  frequencia TEXT NOT NULL,
  horarios TIME[],
  indicacao TEXT,
  medico_prescritor TEXT,
  data_inicio DATE NOT NULL,
  data_fim DATE,
  observacoes TEXT,
  estoque_atual INTEGER DEFAULT 0,
  estoque_minimo INTEGER DEFAULT 7,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_medicacoes_paciente ON medicacoes(paciente_id);
CREATE INDEX idx_medicacoes_ativo ON medicacoes(paciente_id, ativo);
CREATE INDEX idx_medicacoes_estoque ON medicacoes(estoque_atual) WHERE estoque_atual <= estoque_minimo;

-- Comentários
COMMENT ON TABLE medicacoes IS 'Medicações prescritas para os pacientes';
COMMENT ON COLUMN medicacoes.horarios IS 'Array de horários de administração (formato TIME)';
COMMENT ON COLUMN medicacoes.estoque_atual IS 'Quantidade atual de comprimidos/doses';

-- ============================================
-- TABELA: medicacao_administracoes
-- ============================================
CREATE TABLE medicacao_administracoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  medicacao_id UUID NOT NULL REFERENCES medicacoes(id) ON DELETE CASCADE,
  horario_previsto TIMESTAMPTZ NOT NULL,
  horario_administrado TIMESTAMPTZ,
  administrado_por UUID REFERENCES auth.users(id),
  status TEXT NOT NULL CHECK (status IN ('PENDENTE', 'TOMADA', 'ATRASADA', 'PERDIDA')),
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_admin_medicacao ON medicacao_administracoes(medicacao_id);
CREATE INDEX idx_admin_horario ON medicacao_administracoes(horario_previsto);
CREATE INDEX idx_admin_status ON medicacao_administracoes(status) WHERE status = 'PENDENTE';

-- Comentários
COMMENT ON TABLE medicacao_administracoes IS 'Registro de administração de medicações';
COMMENT ON COLUMN medicacao_administracoes.status IS 'PENDENTE: não tomada ainda | TOMADA: tomada no horário | ATRASADA: tomada com atraso | PERDIDA: não tomada';

-- ============================================
-- TABELA: sinais_vitais
-- ============================================
CREATE TABLE sinais_vitais (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  data_hora TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  pressao_sistolica INTEGER,
  pressao_diastolica INTEGER,
  frequencia_cardiaca INTEGER,
  temperatura DECIMAL(4,1),
  saturacao_o2 INTEGER,
  glicemia INTEGER,
  peso DECIMAL(5,2),
  observacoes TEXT,
  medido_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_sinais_paciente_data ON sinais_vitais(paciente_id, data_hora DESC);
CREATE INDEX idx_sinais_pa ON sinais_vitais(pressao_sistolica, pressao_diastolica);

-- Comentários
COMMENT ON TABLE sinais_vitais IS 'Registros de sinais vitais dos pacientes';
COMMENT ON COLUMN sinais_vitais.pressao_sistolica IS 'Pressão sistólica (mmHg)';
COMMENT ON COLUMN sinais_vitais.pressao_diastolica IS 'Pressão diastólica (mmHg)';
COMMENT ON COLUMN sinais_vitais.glicemia IS 'Glicemia (mg/dL)';

-- ============================================
-- TABELA: exames
-- ============================================
CREATE TABLE exames (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  tipo_exame TEXT NOT NULL,
  data_realizacao DATE NOT NULL,
  laboratorio TEXT,
  medico_solicitante TEXT,
  arquivo_url TEXT,
  arquivo_nome TEXT,
  status TEXT NOT NULL DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'PROCESSANDO', 'PROCESSADO', 'REVISADO')),
  
  -- Valores extraídos por IA (JSONB flexível)
  valores_extraidos JSONB,
  valores_revisados JSONB,
  
  -- Análise de IA
  analise_ia TEXT,
  analise_ia_embedding VECTOR(1536), -- OpenAI embeddings
  
  -- Revisão humana
  revisado_por UUID REFERENCES auth.users(id),
  revisado_em TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_exames_paciente_data ON exames(paciente_id, data_realizacao DESC);
CREATE INDEX idx_exames_tipo ON exames(tipo_exame);
CREATE INDEX idx_exames_status ON exames(status);

-- Índice vetorial para busca semântica
CREATE INDEX idx_exames_embedding ON exames 
  USING ivfflat (analise_ia_embedding vector_cosine_ops)
  WITH (lists = 100);

-- Comentários
COMMENT ON TABLE exames IS 'Exames laboratoriais e de imagem';
COMMENT ON COLUMN exames.valores_extraidos IS 'Valores extraídos automaticamente por IA do PDF';
COMMENT ON COLUMN exames.valores_revisados IS 'Valores revisados por humano';
COMMENT ON COLUMN exames.analise_ia_embedding IS 'Vector embedding da análise para busca semântica';

-- ============================================
-- TABELA: consultas
-- ============================================
CREATE TABLE consultas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  especialidade TEXT NOT NULL,
  medico TEXT NOT NULL,
  crm TEXT,
  data_hora TIMESTAMPTZ NOT NULL,
  local TEXT,
  endereco TEXT,
  telefone TEXT,
  status TEXT NOT NULL DEFAULT 'AGENDADA' CHECK (status IN ('AGENDADA', 'CONFIRMADA', 'REALIZADA', 'CANCELADA')),
  motivo TEXT,
  observacoes TEXT,
  lembrete_enviado BOOLEAN DEFAULT FALSE,
  lembrete_enviado_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_consultas_paciente_data ON consultas(paciente_id, data_hora);
CREATE INDEX idx_consultas_status ON consultas(status) WHERE status IN ('AGENDADA', 'CONFIRMADA');
CREATE INDEX idx_consultas_futuras ON consultas(data_hora) WHERE data_hora > NOW();

-- Comentários
COMMENT ON TABLE consultas IS 'Consultas médicas agendadas e realizadas';
COMMENT ON COLUMN consultas.lembrete_enviado IS 'Flag se lembrete foi enviado (48h antes)';

-- ============================================
-- TABELA: evolucoes
-- ============================================
CREATE TABLE evolucoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  data_hora TIMESTAMPTZ DEFAULT NOW(),
  tipo TEXT NOT NULL CHECK (tipo IN ('NOTA_ENFERMAGEM', 'EVOLUCAO_MEDICA', 'OBSERVACAO', 'TRANSCRICAO_AUDIO')),
  conteudo TEXT NOT NULL,
  
  -- Embeddings para busca semântica
  conteudo_embedding VECTOR(1536),
  
  -- IA Summary
  resumo_ia TEXT,
  tags_ia TEXT[],
  
  gravacao_audio_url TEXT,
  autor_id UUID REFERENCES auth.users(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_evolucoes_paciente_data ON evolucoes(paciente_id, data_hora DESC);
CREATE INDEX idx_evolucoes_tipo ON evolucoes(tipo);
CREATE INDEX idx_evolucoes_embedding ON evolucoes 
  USING ivfflat (conteudo_embedding vector_cosine_ops)
  WITH (lists = 100);

-- Comentários
COMMENT ON TABLE evolucoes IS 'Evoluções clínicas e anotações sobre o paciente';
COMMENT ON COLUMN evolucoes.tags_ia IS 'Tags geradas automaticamente pela IA para categorização';

-- ============================================
-- TABELA: alertas
-- ============================================
CREATE TABLE alertas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  severidade TEXT NOT NULL CHECK (severidade IN ('INFO', 'ATENCAO', 'URGENTE', 'EMERGENCIA')),
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  recomendacao TEXT,
  
  -- Contexto adicional (JSONB)
  contexto JSONB,
  
  -- Status
  visualizado BOOLEAN DEFAULT FALSE,
  visualizado_em TIMESTAMPTZ,
  visualizado_por UUID REFERENCES auth.users(id),
  
  resolvido BOOLEAN DEFAULT FALSE,
  resolvido_em TIMESTAMPTZ,
  resolvido_por UUID REFERENCES auth.users(id),
  
  -- Notificações enviadas
  notificacao_push BOOLEAN DEFAULT FALSE,
  notificacao_whatsapp BOOLEAN DEFAULT FALSE,
  notificacao_sms BOOLEAN DEFAULT FALSE,
  notificacao_email BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_alertas_paciente_ativo ON alertas(paciente_id, resolvido, created_at DESC);
CREATE INDEX idx_alertas_severidade ON alertas(severidade, resolvido) WHERE resolvido = FALSE;
CREATE INDEX idx_alertas_tipo ON alertas(tipo, created_at DESC);

-- Comentários
COMMENT ON TABLE alertas IS 'Alertas médicos gerados automaticamente ou manualmente';
COMMENT ON COLUMN alertas.severidade IS 'INFO: informativo | ATENCAO: requer atenção | URGENTE: requer ação em horas | EMERGENCIA: requer ação IMEDIATA';

-- ============================================
-- TABELA: ia_interacoes
-- ============================================
CREATE TABLE ia_interacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paciente_id UUID REFERENCES pacientes(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES auth.users(id),
  
  tipo TEXT NOT NULL CHECK (tipo IN ('CHAT', 'ANALISE_EXAME', 'RELATORIO', 'PERGUNTA_MEDICA')),
  modelo TEXT NOT NULL,
  
  prompt TEXT NOT NULL,
  resposta TEXT NOT NULL,
  
  tokens_entrada INTEGER,
  tokens_saida INTEGER,
  custo_estimado DECIMAL(10,4),
  
  metadata JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_ia_paciente ON ia_interacoes(paciente_id, created_at DESC);
CREATE INDEX idx_ia_tipo ON ia_interacoes(tipo);
CREATE INDEX idx_ia_modelo ON ia_interacoes(modelo);

-- Comentários
COMMENT ON TABLE ia_interacoes IS 'Histórico de interações com modelos de IA';
COMMENT ON COLUMN ia_interacoes.custo_estimado IS 'Custo estimado da chamada em USD';

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function: Atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_pacientes_updated_at 
  BEFORE UPDATE ON pacientes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medicacoes_updated_at 
  BEFORE UPDATE ON medicacoes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exames_updated_at 
  BEFORE UPDATE ON exames
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consultas_updated_at 
  BEFORE UPDATE ON consultas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Function: Verificar sinais vitais anormais
-- ============================================
CREATE OR REPLACE FUNCTION check_sinais_vitais_anormais()
RETURNS TRIGGER AS $$
BEGIN
  -- Pressão arterial CRÍTICA
  IF NEW.pressao_sistolica >= 180 OR NEW.pressao_diastolica >= 110 THEN
    INSERT INTO alertas (
      paciente_id, tipo, severidade, titulo, mensagem, recomendacao, contexto
    ) VALUES (
      NEW.paciente_id,
      'SINAIS_VITAIS',
      'EMERGENCIA',
      'Pressão Arterial CRÍTICA',
      format('🚨 PA: %s/%s mmHg - LIGAR MÉDICO IMEDIATAMENTE', 
        NEW.pressao_sistolica, NEW.pressao_diastolica),
      'Contatar neurologista/cardiologista AGORA. Ligar SAMU 192 se sintomas (dor cabeça, falta de ar, dor peito)',
      jsonb_build_object(
        'sinais_vitais_id', NEW.id,
        'pressao_sistolica', NEW.pressao_sistolica,
        'pressao_diastolica', NEW.pressao_diastolica,
        'contatos', jsonb_build_array(
          'Dr. Neurologista: (11) 9999-1111',
          'Dr. Cardiologista: (11) 9999-2222',
          'SAMU: 192'
        )
      )
    );
  
  -- Pressão arterial ELEVADA
  ELSIF NEW.pressao_sistolica >= 160 OR NEW.pressao_diastolica >= 100 THEN
    INSERT INTO alertas (
      paciente_id, tipo, severidade, titulo, mensagem, recomendacao, contexto
    ) VALUES (
      NEW.paciente_id,
      'SINAIS_VITAIS',
      'URGENTE',
      'Pressão Arterial Elevada',
      format('⚠️ PA: %s/%s mmHg - Monitorar de perto', 
        NEW.pressao_sistolica, NEW.pressao_diastolica),
      'Repetir medição em 30min. Se persistir ou piorar, ligar médico. Evitar esforços.',
      jsonb_build_object(
        'sinais_vitais_id', NEW.id,
        'pressao_sistolica', NEW.pressao_sistolica,
        'pressao_diastolica', NEW.pressao_diastolica
      )
    );
  END IF;
  
  -- Saturação O2 baixa
  IF NEW.saturacao_o2 IS NOT NULL AND NEW.saturacao_o2 < 90 THEN
    INSERT INTO alertas (
      paciente_id, tipo, severidade, titulo, mensagem, recomendacao, contexto
    ) VALUES (
      NEW.paciente_id,
      'SINAIS_VITAIS',
      'EMERGENCIA',
      'Saturação O2 CRÍTICA',
      format('🚨 SpO2: %s%% - EMERGÊNCIA', NEW.saturacao_o2),
      'LIGAR SAMU 192 IMEDIATAMENTE. Posicionar paciente sentado, abrir janelas.',
      jsonb_build_object('sinais_vitais_id', NEW.id, 'saturacao_o2', NEW.saturacao_o2)
    );
  END IF;
  
  -- Glicemia baixa (hipoglicemia)
  IF NEW.glicemia IS NOT NULL AND NEW.glicemia < 70 THEN
    INSERT INTO alertas (
      paciente_id, tipo, severidade, titulo, mensagem, recomendacao, contexto
    ) VALUES (
      NEW.paciente_id,
      'SINAIS_VITAIS',
      'URGENTE',
      'Hipoglicemia',
      format('⚠️ Glicemia: %s mg/dL - BAIXA', NEW.glicemia),
      'Dar 15g de carboidrato rápido (suco, mel, bala). Medir novamente em 15min.',
      jsonb_build_object('sinais_vitais_id', NEW.id, 'glicemia', NEW.glicemia)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para sinais vitais
CREATE TRIGGER trigger_check_sinais_vitais
  AFTER INSERT ON sinais_vitais
  FOR EACH ROW
  EXECUTE FUNCTION check_sinais_vitais_anormais();

-- ============================================
-- Function: Verificar estoque de medicação
-- ============================================
CREATE OR REPLACE FUNCTION check_medicacao_estoque()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.estoque_atual IS NOT NULL AND NEW.estoque_atual <= NEW.estoque_minimo THEN
    INSERT INTO alertas (
      paciente_id, tipo, severidade, titulo, mensagem, recomendacao, contexto
    ) VALUES (
      NEW.paciente_id,
      'MEDICACAO',
      CASE 
        WHEN NEW.estoque_atual = 0 THEN 'EMERGENCIA'
        WHEN NEW.estoque_atual <= 3 THEN 'URGENTE'
        ELSE 'ATENCAO'
      END,
      'Estoque de Medicação',
      format('💊 %s com %s comprimidos restantes', NEW.nome, NEW.estoque_atual),
      CASE
        WHEN NEW.estoque_atual = 0 THEN 'ESTOQUE ESGOTADO! Providenciar HOJE mesmo.'
        WHEN NEW.estoque_atual <= 3 THEN format('URGENTE: Renovar receita e comprar %s em até %s dias', NEW.nome, NEW.estoque_atual)
        ELSE format('Renovar receita e comprar %s nos próximos dias', NEW.nome)
      END,
      jsonb_build_object(
        'medicacao_id', NEW.id,
        'medicacao_nome', NEW.nome,
        'estoque_atual', NEW.estoque_atual,
        'estoque_minimo', NEW.estoque_minimo
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para estoque de medicação
CREATE TRIGGER trigger_check_medicacao_estoque
  AFTER INSERT OR UPDATE OF estoque_atual ON medicacoes
  FOR EACH ROW
  EXECUTE FUNCTION check_medicacao_estoque();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicacao_administracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sinais_vitais ENABLE ROW LEVEL SECURITY;
ALTER TABLE exames ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultas ENABLE ROW LEVEL SECURITY;
ALTER TABLE evolucoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE alertas ENABLE ROW LEVEL SECURITY;
ALTER TABLE ia_interacoes ENABLE ROW LEVEL SECURITY;

-- Políticas: Usuários autenticados podem ver todos os dados
-- (Ajustar conforme necessidade de multi-tenancy)
CREATE POLICY "Usuários autenticados podem acessar pacientes"
  ON pacientes FOR ALL
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem acessar medicações"
  ON medicacoes FOR ALL
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem acessar administrações"
  ON medicacao_administracoes FOR ALL
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem acessar sinais vitais"
  ON sinais_vitais FOR ALL
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem acessar exames"
  ON exames FOR ALL
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem acessar consultas"
  ON consultas FOR ALL
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem acessar evoluções"
  ON evolucoes FOR ALL
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem acessar alertas"
  ON alertas FOR ALL
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem acessar interações IA"
  ON ia_interacoes FOR ALL
  USING (auth.uid() IS NOT NULL);

-- ============================================
-- DADOS INICIAIS (Paciente Dete)
-- ============================================
INSERT INTO pacientes (
  nome,
  nome_social,
  data_nascimento,
  cpf,
  rg,
  tipo_sanguineo,
  condicoes_cronicas
) VALUES (
  'Ildete da Paz Duarte',
  'Dete',
  '1960-08-03',
  '146.161.618-28',
  '24.949.794-3',
  'O+',
  ARRAY[
    'AVC Isquêmico (30/08/2025)',
    'Encefalomalácia Parietal Esquerda',
    'Hipertrofia Ventricular Esquerda Concêntrica',
    'Disfunção Sistólica VE (FE 46%)',
    'Insuficiência Mitral Discreta',
    'Diabetes Mellitus Tipo 2',
    'Hipertensão Arterial Sistêmica',
    'Ateromatose Carotídea Bilateral',
    'Dislipidemia'
  ]
) ON CONFLICT (cpf) DO NOTHING;

-- ============================================
-- COMENTÁRIOS FINAIS
-- ============================================
COMMENT ON SCHEMA public IS 'DETE v4.0 - Sistema de Gestão de Cuidados com IA - Schema completo criado em 29/11/2025';
