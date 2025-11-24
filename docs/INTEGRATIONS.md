# Guia de Integrações - DETE v3.0

## 🔗 Google Workspace Integration

Este guia detalha o processo completo de configuração das integrações com Google Workspace (Sheets + Drive).

---

## 🛠️ Pré-requisitos

- Conta Google (Gmail)
- Acesso ao [Google Cloud Console](https://console.cloud.google.com)
- Domínio ou URL do sistema (pode ser localhost para testes)

---

## 1️⃣ Configurar Google Cloud Project

### Passo 1.1: Criar Projeto

1. Acesse https://console.cloud.google.com
2. Clique em "Select a project" no topo
3. Clique em "NEW PROJECT"
4. Preencha:
   - **Project name**: `DETE Sistema`
   - **Organization**: (opcional)
5. Clique em "CREATE"

### Passo 1.2: Ativar APIs

1. No menu lateral, vá para **APIs & Services** > **Library**
2. Busque e ative as seguintes APIs:

   **Google Sheets API**
   - Busque: "Google Sheets API"
   - Clique em "Google Sheets API"
   - Clique em "ENABLE"

   **Google Drive API**
   - Busque: "Google Drive API"
   - Clique em "Google Drive API"
   - Clique em "ENABLE"

### Passo 1.3: Configurar OAuth Consent Screen

1. Vá para **APIs & Services** > **OAuth consent screen**
2. Selecione **External** (ou Internal se tiver Google Workspace)
3. Clique em "CREATE"
4. Preencha:
   - **App name**: `DETE v3.0`
   - **User support email**: seu email
   - **Developer contact**: seu email
5. Clique em "SAVE AND CONTINUE"

6. **Scopes**:
   - Clique em "ADD OR REMOVE SCOPES"
   - Adicione:
     - `https://www.googleapis.com/auth/spreadsheets`
     - `https://www.googleapis.com/auth/drive.file`
   - Clique em "UPDATE" > "SAVE AND CONTINUE"

7. **Test users** (se External):
   - Adicione seu email e outros usuários de teste
   - Clique em "SAVE AND CONTINUE"

8. Revise e clique em "BACK TO DASHBOARD"

### Passo 1.4: Criar Credenciais OAuth 2.0

1. Vá para **APIs & Services** > **Credentials**
2. Clique em "+ CREATE CREDENTIALS" > "OAuth client ID"
3. Selecione **Application type**: "Web application"
4. Preencha:
   - **Name**: `DETE Web Client`
   - **Authorized JavaScript origins**:
     ```
     http://localhost:8000
     http://127.0.0.1:8000
     https://seu-dominio.com (se já tiver)
     ```
   - **Authorized redirect URIs**:
     ```
     http://localhost:8000
     http://127.0.0.1:8000
     https://seu-dominio.com (se já tiver)
     ```
5. Clique em "CREATE"

6. **Copie as credenciais**:
   - **Client ID**: algo como `123456789-abc.apps.googleusercontent.com`
   - **Client Secret**: (não será usado no frontend)

### Passo 1.5: Criar API Key

1. Em **Credentials**, clique em "+ CREATE CREDENTIALS" > "API key"
2. Copie a **API Key** gerada (algo como `AIzaSy...`)
3. Clique em "RESTRICT KEY"
4. Em "API restrictions", selecione "Restrict key"
5. Marque:
   - Google Sheets API
   - Google Drive API
6. Clique em "SAVE"

---

## 2️⃣ Configurar no DETE

### Via Interface Web (Recomendado)

1. Abra o DETE no navegador
2. Vá para **Configurações** > **Integrações**
3. Siga o wizard:

   **Passo 1: Credenciais Google Cloud**
   - Cole o **Client ID**
   - Cole a **API Key**
   - Clique em "Testar Conexão"
   - Se OK, clique em "Próximo"

   **Passo 2: Autenticação**
   - Clique em "Autenticar com Google"
   - Selecione sua conta Google
   - Aceite as permissões solicitadas
   - Clique em "Próximo"

   **Passo 3: Google Sheets**
   - Selecione:
     - ○ **Criar Nova Planilha** (recomendado)
     - ○ **Usar Planilha Existente**
   - Se criar nova, clique em "Criar Planilha"
   - Clique em "Próximo"

   **Passo 4: Google Drive**
   - Clique em "Criar Estrutura de Pastas"
   - Aguarde a criação das pastas
   - Clique em "Próximo"

   **Passo 5: Sincronização**
   - Configure:
     - Modo: Automática (recomendado)
     - Intervalo: 5 minutos
     - ☑ Sincronizar ao salvar
     - ☑ Sincronizar ao iniciar
   - Clique em "Salvar e Finalizar"

4. Teste a sincronização:
   - Adicione um paciente
   - Aguarde a sincronização
   - Abra a planilha no Google Sheets
   - Verifique se o paciente aparece

---

## 3️⃣ Estrutura do Google Sheets

### Planilha: DETE_Database

**Abas criadas automaticamente:**

1. **Pacientes**
   ```
   ID | Nome | DataNascimento | CPF | Telefone | Email | Endereço | Cidade | Estado | CEP | TipoSanguineo | Alergias | ContatoEmergencia | DataCadastro | Status
   ```

2. **Profissionais**
   ```
   ID | Nome | Especialidade | Registro | Telefone | Email | DataAdmissao | Status
   ```

3. **Agendamentos**
   ```
   ID | PacienteID | ProfissionalID | Data | Hora | Tipo | Status | Observacoes
   ```

4. **EvolucaoClinica**
   ```
   ID | PacienteID | ProfissionalID | DataHora | Descricao | Sinais | Sintomas
   ```

5. **PlanosCuidado**
   ```
   ID | PacienteID | Titulo | Descricao | Objetivos | DataCriacao | Status
   ```

6. **Medicacoes**
   ```
   ID | PacienteID | ProfissionalID | Medicamento | Dosagem | Frequencia | DataInicio | DataFim | Status
   ```

7. **Exames**
   ```
   ID | PacienteID | ProfissionalID | TipoExame | DataSolicitacao | DataRealizacao | Resultado | Status
   ```

8. **Cuidadores**
   ```
   ID | Nome | CPF | Especializacao | SalarioBase | ValorHora | TipoContrato | DataAdmissao | Status
   ```

9. **LancamentosFinanceiros**
   ```
   ID | Data | Tipo | Categoria | Descricao | PacienteID | Valor | FormaPagamento | Status
   ```

10. **TimelineEventos**
    ```
    ID | PacienteID | Tipo | Data | Titulo | Descricao | Importancia
    ```

11. **Usuarios**
    ```
    ID | Nome | Email | Username | Perfil | Status | DataCriacao
    ```

---

## 4️⃣ Estrutura do Google Drive

**Pasta: DETE_Sistema/**

```
📁 DETE_Sistema/
├── 📁 Pacientes/
│   ├── 📁 [ID_Paciente_1]/
│   │   ├── 📄 prontuario.pdf
│   │   ├── 📄 exames/
│   │   └── 📄 receitas/
│   └── ...
├── 📁 Relatorios/
│   ├── 📄 DRE_2025_01.pdf
│   ├── 📄 Estatisticas_2025_01.xlsx
│   └── ...
├── 📁 Backups/
│   ├── 💾 backup_2025_01_15.json
│   ├── 💾 backup_2025_01_16.json
│   └── ...
├── 📁 Formularios/
│   ├── 📄 consentimento_template.pdf
│   ├── 📄 anamnese_template.pdf
│   └── ...
└── 📁 Configuracoes/
    ├── ⚙️ config.json
    └── 🔐 credentials.encrypted
```

---

## 5️⃣ Sincronização

### Modos de Sincronização

**1. Manual**
- Sincroniza apenas quando clicar no botão "Sincronizar"
- Útil para controle total

**2. Automática**
- Sincroniza em intervalos definidos (1, 5, 10, 15, 30 min ou 1h)
- Sincroniza ao salvar (opcional)
- Sincroniza ao iniciar sistema (opcional)

### Fluxo de Sincronização

```
IndexedDB ↔ Google Sheets

1. Usuário cria/edita dado
   ↓
2. Salvo no IndexedDB (local)
   ↓
3. Adicionado à fila de sync
   ↓
4. Background sync envia para Sheets
   ↓
5. Sheets atualizado
   ↓
6. Marcado como sincronizado
```

### Resolução de Conflitos

**Última alteração prevalece (padrão)**
- Timestamp mais recente vence
- Automático, sem intervenção

**Perguntar ao usuário**
- Sistema detecta conflito
- Mostra diferenças
- Usuário escolhe qual manter

---

## 6️⃣ Segurança

### Tokens OAuth2

- **Access Token**: Expira em 1 hora
- **Refresh Token**: Renova automaticamente
- Armazenados **criptografados** no IndexedDB
- Nunca enviados para servidores externos

### Permissões Solicitadas

```javascript
const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',     // Ler/escrever Sheets
  'https://www.googleapis.com/auth/drive.file'        // Criar/ler arquivos no Drive
];
```

**NÃO solicitamos**:
- Acesso a todos os arquivos do Drive
- Permissões de Gmail
- Contatos
- Calendário

---

## 7️⃣ Troubleshooting

### Erro: "Access blocked: DETE v3.0's request is invalid"

**Solução**:
1. Verifique se as URLs autorizadas estão corretas
2. Certifique-se de incluir `http://` ou `https://`
3. Sem `/` no final da URL

### Erro: "Token has been expired or revoked"

**Solução**:
1. Vá em Configurações > Integrações
2. Clique em "Reautenticar"
3. Faça login novamente

### Erro: "The caller does not have permission"

**Solução**:
1. Verifique se as APIs estão ativadas no Google Cloud
2. Verifique os scopes no OAuth consent screen
3. Reautentique o usuário

### Sincronização não funciona

**Solução**:
1. Verifique conexão com internet
2. Abra console do navegador (F12)
3. Verifique erros na aba Console
4. Teste manualmente: Configurações > Integrações > Sincronizar Agora

---

## 8️⃣ Referências

- [Google Sheets API Documentation](https://developers.google.com/sheets/api)
- [Google Drive API Documentation](https://developers.google.com/drive/api)
- [OAuth 2.0 for Client-side Web Apps](https://developers.google.com/identity/protocols/oauth2/javascript-implicit-flow)

---

**Última atualização:** Novembro 2025