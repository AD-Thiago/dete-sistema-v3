# Arquitetura do Sistema - DETE v3.0

## 🏛️ Visão Arquitetural

O DETE v3.0 é uma aplicação web moderna, single-page (SPA), com arquitetura orientada a eventos e persistência híbrida (local + cloud).

---

## 📊 Diagrama de Alto Nível

```
┌────────────────────────────────────────┐
│           FRONTEND (Browser)              │
│                                          │
│  ┌────────────────────────────────┐  │
│  │     UI Components (HTML/CSS)     │  │
│  └────────────┬───────────────────┘  │
│                │                         │
│  ┌────────────┴───────────────────┐  │
│  │  Business Logic (JavaScript)   │  │
│  │                                │  │
│  │  ● Modules (Dashboard, etc)   │  │
│  │  ● Router (SPA navigation)    │  │
│  │  ● State Management          │  │
│  └────────────┬───────────────────┘  │
│                │                         │
│  ┌────────────┴───────────────────┐  │
│  │      Data Layer (Dexie.js)      │  │
│  │                                │  │
│  │  ● CRUD Operations           │  │
│  │  ● Queries & Filters         │  │
│  │  ● Sync Queue                │  │
│  └────────────┬───────────────────┘  │
│                │                         │
│  ┌────────────┴───────────────────┐  │
│  │       IndexedDB (Browser)      │  │
│  └────────────────────────────────┘  │
└────────────────┬───────────────────────┘
                 │
    ┌────────────┼────────────┐
    │  Service Worker    │
    │                   │
    │  ● Cache API     │
    │  ● Background Sync│
    │  ● Push Notify   │
    └────────────┬───────────┘
                 │
    ┌────────────┼────────────┐
    │                   │
    │  EXTERNAL SERVICES │
    │                   │
    ├───────────────────────┤
    │                   │
    │  Google Sheets API │
    │  Google Drive API  │
    │  OAuth2 (Google)   │
    │  Firebase (FCM)    │
    │                   │
    └───────────────────────┘
```

---

## 📦 Camadas da Aplicação

### 1. Presentation Layer (UI)

**Tecnologias:**
- HTML5 semântico
- Tailwind CSS (utility-first)
- CSS custom (design system)
- Vanilla JavaScript (sem frameworks)

**Responsabilidades:**
- Renderização de componentes
- Interação do usuário
- Validação de formulários (client-side)
- Responsividade
- Acessibilidade (ARIA)

**Padrões:**
- Component-based architecture
- Template strings para renderização
- Event delegation
- Progressive enhancement

### 2. Business Logic Layer

**Módulos:**
```
js/
├── app.js           # Aplicação principal
├── router.js        # Roteamento SPA
├── auth.js          # Autenticação
├── sync.js          # Sincronização
├── google-api.js    # Google APIs
├── utils.js         # Utilitários
└── modules/
    ├── dashboard.js
    ├── pacientes.js
    ├── cuidadores.js
    ├── financeiro.js
    └── timeline.js
```

**Responsabilidades:**
- Regras de negócio
- Validações complexas
- Transformação de dados
- Orquestração de operações
- Event handling

**Padrões:**
- Module pattern
- Event-driven architecture
- Dependency injection
- Single responsibility

### 3. Data Access Layer

**Tecnologia:** Dexie.js (wrapper do IndexedDB)

**Responsabilidades:**
- CRUD operations
- Queries complexas
- Indexing
- Transactions
- Migration management

**Padrões:**
- Repository pattern
- Unit of Work
- Query builder

### 4. Persistence Layer

**Tecnologias:**
- **Local:** IndexedDB (browser)
- **Cloud:** Google Sheets (spreadsheet database)
- **Files:** Google Drive (document storage)

**Estratégia:**
- **Offline-first:** Dados salvos localmente primeiro
- **Background sync:** Sincronização em segundo plano
- **Conflict resolution:** Última escrita vence (configurável)

### 5. Service Layer (PWA)

**Service Worker:**
- Cache de assets (HTML, CSS, JS, imagens)
- Offline fallback
- Background sync API
- Push notifications API

**Estratégias de Cache:**
```javascript
// Network First (dados dinâmicos)
fetch(request)
  .catch(() => caches.match(request));

// Cache First (assets estáticos)
caches.match(request)
  .then(cached => cached || fetch(request));
```

---

## 🔄 Fluxo de Dados

### Fluxo de Criação de Dados

```
1. Usuário preenche formulário
   ↓
2. Validação client-side (UI)
   ↓
3. Business logic processa
   ↓
4. Data layer salva no IndexedDB
   ↓
5. Trigger evento 'data-changed'
   ↓
6. Sync manager adiciona à fila
   ↓
7. Background sync envia para Google Sheets
   ↓
8. Atualiza status de sincronização
```

### Fluxo de Leitura de Dados

```
1. Usuário navega para página
   ↓
2. Router carrega módulo
   ↓
3. Módulo requisita dados
   ↓
4. Data layer consulta IndexedDB
   ↓
5. Dados retornados e renderizados
   ↓
6. (Paralelo) Sync verifica atualizações no Sheets
   ↓
7. Se houver atualizações, merge e re-render
```

### Fluxo de Sincronização

```
IndexedDB ↔ Sync Queue ↔ Google Sheets

←────────────────────────────────────→
    Pull (importação)      Push (exportação)

1. Detecta mudanças (timestamp)
2. Compara versões
3. Resolve conflitos
4. Aplica mudanças
5. Atualiza sync log
```

---

## 🛡️ Segurança

### Autenticação

```
Google OAuth2 Flow:

1. User clicks "Login with Google"
2. Redirect to Google OAuth consent screen
3. User grants permissions
4. Google redirects back with auth code
5. Exchange auth code for tokens
6. Store tokens encrypted in IndexedDB
7. Use access token for API calls
8. Refresh token when expired
```

### Armazenamento de Credenciais

```javascript
// Tokens NUNCA são armazenados em plain text
const encryptedToken = await crypto.subtle.encrypt(
  { name: 'AES-GCM', iv },
  key,
  encoder.encode(token)
);

await db.config.put({
  key: 'accessToken',
  value: encryptedToken
});
```

### Permissões de APIs

```javascript
const SCOPES = [
  // MÍNIMO NECESSÁRIO
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file'
];

// NÃO solicitamos:
// - drive.readonly (todos os arquivos)
// - gmail
// - contacts
// - calendar
```

---

## 🚀 Performance

### Otimizações Implementadas

**Frontend:**
- Lazy loading de módulos
- Code splitting (se crescer)
- Minificação de assets
- Compressão Gzip/Brotli
- CDN para bibliotecas externas

**Database:**
- Indexes em campos de busca
- Queries otimizadas
- Batch operations
- Transaction batching

**Network:**
- Service Worker caching
- HTTP/2 server push (se disponível)
- Preload/prefetch de recursos críticos
- Debounce em sync automático

### Métricas Alvo

```
Lighthouse Score:
- Performance: > 90
- Accessibility: > 95
- Best Practices: > 90
- SEO: > 90
- PWA: 100

Core Web Vitals:
- LCP (Largest Contentful Paint): < 2.5s
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1
```

---

## 📊 Escalabilidade

### Limitações

**IndexedDB:**
- Máximo ~50MB em mobile
- Máximo ~10GB em desktop
- Varia por navegador

**Google Sheets:**
- Máximo 10 milhões de células por planilha
- Máximo 18.278 colunas
- Rate limit: 60 requests/minute/user

**Google Drive:**
- Quota gratuito: 15GB
- Rate limit: 1000 requests/100 seconds/user

### Estratégias de Escala

**Particionamento de Dados:**
```javascript
// Separar por ano
'Pacientes_2024'
'Pacientes_2025'

// Ou por status
'Pacientes_Ativos'
'Pacientes_Inativos'
```

**Paginação:**
```javascript
const pageSize = 50;
const offset = page * pageSize;

await db.pacientes
  .offset(offset)
  .limit(pageSize)
  .toArray();
```

**Lazy Loading:**
```javascript
// Carregar apenas dados necessários
await db.pacientes
  .where('status')
  .equals('Ativo')
  .toArray();

// Não carregar todos de uma vez
```

---

## 🔍 Monitoramento e Debugging

### Logging

```javascript
const logger = {
  info: (msg, data) => console.log('[INFO]', msg, data),
  warn: (msg, data) => console.warn('[WARN]', msg, data),
  error: (msg, error) => {
    console.error('[ERROR]', msg, error);
    // Enviar para Sentry
    Sentry.captureException(error);
  }
};
```

### Error Tracking

```javascript
// Sentry integration
Sentry.init({
  dsn: 'YOUR_DSN',
  environment: 'production',
  beforeSend(event) {
    // Filtrar dados sensíveis
    return sanitizeEvent(event);
  }
});
```

### Performance Monitoring

```javascript
// Medir tempo de operações
const start = performance.now();
await operation();
const duration = performance.now() - start;

console.log(`Operation took ${duration}ms`);
```

---

## 📐 Versionamento

### Schema Versioning

```javascript
db.version(1).stores({ /* initial schema */ });

db.version(2).stores({
  // adicionar novo campo
  pacientes: '++id, nome, cpf, status, dataCadastro, novoCampo'
}).upgrade(tx => {
  // migração de dados
  return tx.pacientes.toCollection().modify(paciente => {
    paciente.novoCampo = 'default';
  });
});
```

### Semantic Versioning

```
MAJOR.MINOR.PATCH

3.0.0 - Versão inicial
3.0.1 - Bug fix
3.1.0 - Nova feature (backward compatible)
4.0.0 - Breaking change
```

---

## 📚 Referências Arquiteturais

- [Clean Architecture (Robert C. Martin)](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Offline First Architecture](https://offlinefirst.org/)
- [PWA Architecture Best Practices](https://web.dev/pwa-checklist/)
- [IndexedDB Best Practices](https://developers.google.com/web/fundamentals/instant-and-offline/web-storage/indexeddb-best-practices)

---

**Última atualização:** Novembro 2025  
**Versão:** 3.0.0