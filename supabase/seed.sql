-- ============================================
-- DETE v4.0 - SEED DATA
-- ============================================
-- Dados iniciais para desenvolvimento e testes
-- ============================================

-- Buscar ID do paciente Dete
DO $$
DECLARE
  dete_id UUID;
BEGIN
  SELECT id INTO dete_id FROM pacientes WHERE cpf = '146.161.618-28';
  
  IF dete_id IS NULL THEN
    RAISE EXCEPTION 'Paciente Dete não encontrada. Execute schema.sql primeiro.';
  END IF;
  
  -- ============================================
  -- MEDICAÇÕES DA DETE
  -- ============================================
  INSERT INTO medicacoes (
    paciente_id, nome, principio_ativo, dosagem, frequencia, horarios, 
    indicacao, medico_prescritor, data_inicio, estoque_atual, ativo
  ) VALUES
    -- Manhã (08:00)
    (dete_id, 'Losartana', 'Losartana Potássica', '50mg', '12/12h', ARRAY['08:00', '20:00']::TIME[], 
     'Hipertensão + Proteção Renal', 'Dr. Cardiologista', '2025-09-01', 45, TRUE),
    
    (dete_id, 'Anlodipino', 'Anlodipino Besilato', '10mg', '1x/dia', ARRAY['08:00']::TIME[], 
     'Hipertensão', 'Dr. Cardiologista', '2025-09-01', 30, TRUE),
    
    (dete_id, 'Carvedilol', 'Carvedilol', '6,25mg', '12/12h', ARRAY['08:00', '20:00']::TIME[], 
     'Insuficiência Cardíaca', 'Dr. Cardiologista', '2025-09-01', 50, TRUE),
    
    (dete_id, 'Espironolactona', 'Espironolactona', '25mg', '1x/dia', ARRAY['08:00']::TIME[], 
     'Insuficiência Cardíaca', 'Dr. Cardiologista', '2025-09-01', 28, TRUE),
    
    (dete_id, 'Dapagliflozina', 'Dapagliflozina', '10mg', '1x/dia', ARRAY['08:00']::TIME[], 
     'Diabetes + Proteção Cardíaca', 'Dr. Endocrinologista', '2025-09-15', 25, TRUE),
    
    -- Almoço (12:00)
    (dete_id, 'AAS', 'Ácido Acetilsalicílico', '100mg', '1x/dia', ARRAY['12:00']::TIME[], 
     'Antiagregante Plaquetário (pós-AVC)', 'Dr. Neurologista', '2025-08-30', 60, TRUE),
    
    (dete_id, 'Metformina', 'Cloridrato de Metformina', '850mg', '3x/dia', ARRAY['08:00', '12:00', '20:00']::TIME[], 
     'Diabetes Tipo 2', 'Dr. Endocrinologista', '2024-01-01', 80, TRUE),
    
    -- Noite (20:00) - já incluídas acima
    -- (Losartana, Carvedilol, Metformina já listadas)
    
    -- Noite (22:00)
    (dete_id, 'Atorvastatina', 'Atorvastatina Cálcica', '40mg', '1x/dia', ARRAY['22:00']::TIME[], 
     'Dislipidemia + Pós-AVC', 'Dr. Cardiologista', '2025-09-01', 35, TRUE)
  ON CONFLICT DO NOTHING;
  
  -- ============================================
  -- SINAIS VITAIS - ÚLTIMOS 7 DIAS
  -- ============================================
  INSERT INTO sinais_vitais (
    paciente_id, data_hora, pressao_sistolica, pressao_diastolica, 
    frequencia_cardiaca, glicemia, peso, observacoes
  ) VALUES
    -- 29/11/2025 (hoje)
    (dete_id, '2025-11-29 08:00:00-03', 132, 84, 68, 105, 68.5, 'Paciente bem disposta'),
    (dete_id, '2025-11-29 20:00:00-03', 128, 82, 70, NULL, NULL, NULL),
    
    -- 28/11/2025
    (dete_id, '2025-11-28 08:00:00-03', 138, 88, 72, 98, 68.3, NULL),
    (dete_id, '2025-11-28 20:00:00-03', 135, 85, 68, NULL, NULL, NULL),
    
    -- 27/11/2025
    (dete_id, '2025-11-27 08:00:00-03', 142, 90, 75, 110, 68.7, 'Dormiu bem'),
    (dete_id, '2025-11-27 20:00:00-03', 136, 86, 70, NULL, NULL, NULL),
    
    -- 26/11/2025
    (dete_id, '2025-11-26 08:00:00-03', 130, 82, 68, 92, 68.2, NULL),
    (dete_id, '2025-11-26 20:00:00-03', 134, 84, 72, NULL, NULL, NULL),
    
    -- 25/11/2025
    (dete_id, '2025-11-25 08:00:00-03', 136, 86, 70, 102, 68.4, NULL),
    (dete_id, '2025-11-25 20:00:00-03', 132, 83, 68, NULL, NULL, NULL),
    
    -- 24/11/2025
    (dete_id, '2025-11-24 08:00:00-03', 140, 88, 74, 108, 68.6, NULL),
    (dete_id, '2025-11-24 20:00:00-03', 138, 87, 71, NULL, NULL, NULL),
    
    -- 23/11/2025
    (dete_id, '2025-11-23 08:00:00-03', 135, 85, 69, 95, 68.3, NULL),
    (dete_id, '2025-11-23 20:00:00-03', 133, 84, 68, NULL, NULL, NULL)
  ON CONFLICT DO NOTHING;
  
  -- ============================================
  -- CONSULTAS FUTURAS
  -- ============================================
  INSERT INTO consultas (
    paciente_id, especialidade, medico, crm, data_hora, local, 
    endereco, telefone, status, motivo
  ) VALUES
    (dete_id, 'Cardiologia', 'Dr. João Silva', '12345-SP', 
     '2025-12-05 14:00:00-03', 'Clínica CardioSaúde', 
     'Rua Exemplo, 123 - São Paulo/SP', '(11) 3333-4444', 
     'AGENDADA', 'Retorno cardiológico - ajuste medicações'),
    
    (dete_id, 'Neurologia', 'Dra. Maria Santos', '67890-SP', 
     '2025-12-12 10:00:00-03', 'Hospital NeuroExcelência', 
     'Av. Paulista, 1000 - São Paulo/SP', '(11) 5555-6666', 
     'AGENDADA', 'Acompanhamento pós-AVC (3 meses)'),
    
    (dete_id, 'Endocrinologia', 'Dr. Pedro Costa', '11111-SP', 
     '2025-12-20 15:30:00-03', 'Centro EndócrinoSP', 
     'Rua Diabetes, 456 - São Paulo/SP', '(11) 7777-8888', 
     'AGENDADA', 'Controle de diabetes + resultados HbA1c')
  ON CONFLICT DO NOTHING;
  
  RAISE NOTICE 'Seed data inserido com sucesso para paciente Dete (ID: %)', dete_id;
END $$;
