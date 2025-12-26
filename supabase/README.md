# 🏛️ Supabase Setup - DETE v4.0

## 📋 Pré-requisitos

- Conta no [Supabase](https://supabase.com)
- PostgreSQL 15+ (incluído no Supabase)
- Node.js 18+ (para scripts)
- Supabase CLI (opcional, para deploy local)

## 🚀 Setup Inicial

### 1. Criar Projeto Supabase

1. Acesse https://supabase.com/dashboard
2. Clique em "New Project"
3. Preencha:
   - **Name**: `dete-sistema-v4`
   - **Database Password**: (anote a senha)
   - **Region**: `South America (São Paulo)`
   - **Pricing Plan**: Pro ($25/mês recomendado)
4. Aguarde ~2 minutos para provisionamento

### 2. Habilitar Extensões

1. No dashboard, vá em **Database** → **Extensions**
2. Procure e habilite:
   - ✅ `pgvector` - Para embeddings de IA
   - ✅ `pg_net` - Para HTTP requests
   - ✅ `pg_cron` - Para tarefas agendadas (opcional)

### 3. Executar Schema SQL

**Opção A: Via Dashboard (Recomendado)**

1. Vá em **SQL Editor**
2. Clique em "New Query"
3. Copie todo o conteúdo de `schema.sql`
4. Cole e clique em **Run**
5. Aguarde execução (~30 segundos)
6. Verificar sucesso: "Success. No rows returned"

**Opção B: Via Supabase CLI**

```bash
# Instalar CLI
npm install -g supabase

# Login
supabase login

# Link ao projeto
supabase link --project-ref seu-project-ref

# Executar migrations
supabase db push
```

### 4. Inserir Dados Iniciais (Seed)

1. No **SQL Editor**, crie nova query
2. Copie conteúdo de `seed.sql`
3. Execute
4. Verifique mensagem: "Seed data inserido com sucesso para paciente Dete"

### 5. Configurar Storage

1. Vá em **Storage**
2. Clique em "Create bucket"
3. Crie os seguintes buckets:

**Bucket: `exames`**
- Public: ❌ Não
- Allowed MIME types: `application/pdf, image/*`
- File size limit: 10 MB

**Bucket: `consultas`**
- Public: ❌ Não
- Allowed MIME types: `application/pdf, image/*, text/*`
- File size limit: 5 MB

**Bucket: `prescricoes`**
- Public: ❌ Não
- Allowed MIME types: `application/pdf, image/*`
- File size limit: 5 MB

**Bucket: `fotos`**
- Public: ✅ Sim (somente leitura)
- Allowed MIME types: `image/*`
- File size limit: 2 MB

### 6. Configurar Autenticação

1. Vá em **Authentication** → **Providers**
2. Habilite:
   - ✅ **Email** (já habilitado por padrão)
   - ✅ **Google OAuth**:
     - Client ID: (do Google Cloud Console)
     - Client Secret: (do Google Cloud Console)
3. Configure URLs:
   - **Site URL**: `http://localhost:3000` (dev) ou seu domínio
   - **Redirect URLs**: `http://localhost:3000/auth/callback`

### 7. Obter Credenciais

1. Vá em **Settings** → **API**
2. Copie:
   - **Project URL**: `https://[seu-projeto].supabase.co`
   - **anon public key**: `eyJhbGci...`
   - **service_role key**: `eyJhbGci...` (⚠️ NUNCA expor no frontend)
3. Salve em `.env`:

```bash
cp .env.example .env
# Editar .env com suas credenciais
```

## 🧪 Testar Configuração

### Via Dashboard

1. **Table Editor** → `pacientes`
2. Deve ver 1 linha: "Ildete da Paz Duarte (Dete)"
3. **Table Editor** → `medicacoes`
4. Deve ver 8 medicações
5. **Table Editor** → `sinais_vitais`
6. Deve ver 14 registros (7 dias × 2 medições/dia)

### Via JavaScript

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

// Testar conexão
const { data, error } = await supabase
  .from('pacientes')
  .select('nome, nome_social')
  .single()

console.log(data) // { nome: 'Ildete da Paz Duarte', nome_social: 'Dete' }
```

## 📊 Verificar Triggers

### Testar Alerta de PA Elevada

```sql
-- Inserir PA crítica (deve gerar alerta EMERGENCIA)
INSERT INTO sinais_vitais (
  paciente_id, 
  pressao_sistolica, 
  pressao_diastolica
) 
SELECT id, 185, 115 
FROM pacientes 
WHERE cpf = '146.161.618-28';

-- Verificar alerta criado
SELECT * FROM alertas 
WHERE severidade = 'EMERGENCIA' 
ORDER BY created_at DESC 
LIMIT 1;
```

### Testar Alerta de Estoque Baixo

```sql
-- Atualizar estoque para nível crítico
UPDATE medicacoes 
SET estoque_atual = 2 
WHERE nome = 'Losartana';

-- Verificar alerta criado
SELECT * FROM alertas 
WHERE tipo = 'MEDICACAO' 
AND severidade = 'URGENTE'
ORDER BY created_at DESC 
LIMIT 1;
```

## 🔐 Row Level Security (RLS)

As políticas RLS estão configuradas para:
- ✅ Usuários autenticados podem acessar TODOS os dados
- ❌ Usuários não autenticados NÃO têm acesso

**Para multi-tenancy (múltiplos pacientes/famílias)**, ajustar policies para:

```sql
-- Exemplo: Acesso apenas aos dados do próprio paciente
CREATE POLICY "Família acessa apenas seus dados"
  ON pacientes FOR ALL
  USING (
    id IN (
      SELECT paciente_id FROM usuarios_familia 
      WHERE usuario_id = auth.uid()
    )
  );
```

## 📈 Monitoramento

### Dashboard Supabase

1. **Database** → **Reports**:
   - Query performance
   - Table sizes
   - Index usage
2. **Storage** → **Usage**:
   - Storage consumption
   - Bandwidth
3. **Auth** → **Users**:
   - User activity
   - Sign-ups

### Logs

1. **Logs Explorer**
2. Filtrar por:
   - `postgres` - Erros de database
   - `auth` - Erros de autenticação
   - `storage` - Erros de upload

## 🆘 Troubleshooting

### Erro: "Extension pgvector not found"

**Solução**: Habilitar extensão manualmente

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Erro: "Permission denied for table X"

**Solução**: Verificar RLS

```sql
-- Ver policies ativas
SELECT * FROM pg_policies WHERE tablename = 'nome_da_tabela';

-- Desabilitar temporariamente (DEV ONLY)
ALTER TABLE nome_da_tabela DISABLE ROW LEVEL SECURITY;
```

### Erro: "Too many connections"

**Solução**: Usar connection pooling

```javascript
const supabase = createClient(url, key, {
  db: {
    pooler: {
      mode: 'transaction',
      connectionTimeout: 2000,
    },
  },
})
```

## 📚 Próximos Passos

- [ ] Implementar Edge Functions (ver `/supabase/functions/`)
- [ ] Configurar Realtime subscriptions
- [ ] Setup de backup automático
- [ ] Configurar DNS customizado
- [ ] Implementar rate limiting

## 💰 Custos Estimados

**Supabase Pro**: $25/mês
- Database: 8 GB incluído
- Storage: 100 GB incluído
- Bandwidth: 250 GB incluído
- Edge Functions: 2M requests incluído

**Uso estimado DETE**:
- Database: ~500 MB
- Storage: ~5 GB (PDFs de exames)
- Bandwidth: ~20 GB/mês
- Edge Functions: ~50k requests/mês

✅ **Plano Pro é suficiente com margem confortável**

## 🔗 Links Úteis

- [Supabase Docs](https://supabase.com/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [pgvector Guide](https://github.com/pgvector/pgvector)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
