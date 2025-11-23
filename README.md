# DETE v3.0 - Sistema de Gestão de Cuidados

<div align="center">

![DETE Logo](https://img.shields.io/badge/DETE-v3.0-blue?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)
![Status](https://img.shields.io/badge/status-Em%20Desenvolvimento-yellow?style=for-the-badge)

Sistema completo para gestão de cuidados de saúde com integração Google Workspace

[Demonstração](#) · [Documentação](./docs/README.md) · [Issues](https://github.com/AD-Thiago/dete-sistema-v3/issues)

</div>

---

## 🎯 Visão Geral

DETE v3.0 é um sistema web completo e moderno para gestão de cuidados de saúde, desenvolvido com as tecnologias mais recentes de 2025. Oferece integração real com Google Workspace (Sheets + Drive), persistência local com IndexedDB, design premium e funcionalidade PWA completa.

### ✨ Principais Características

- ✅ **Integrações Reais**: Google Sheets API e Google Drive API totalmente funcionais
- ✅ **Persistência Local**: IndexedDB com sincronização bidirecional
- ✅ **PWA Completo**: Instalavel, modo offline, background sync
- ✅ **Design Premium**: Interface moderna seguindo padrões 2025
- ✅ **Módulos Completos**: Dashboard, Pacientes, Cuidadores, Financeiro, Timeline
- ✅ **Multi-usuário**: Sistema de permissões e auditoria

---

## 🚀 Funcionalidades

### Módulos Principais

#### 📊 Dashboard
- Estatísticas em tempo real
- Gráficos interativos (Chart.js)
- Indicadores de performance
- Alertas e notificações

#### 👥 Gestão de Pacientes
- CRUD completo
- Prontuário eletrônico
- Histórico de evolução clínica
- Planos de cuidado

#### 🧑‍⚕️ Gestão de Cuidadores
- Cadastro e escala de trabalho
- Controle de ponto
- Fechamento mensal
- Cálculo de salários

#### 💰 Financeiro
- Lançamentos (receitas/despesas)
- DRE (Demonstrativo de Resultados)
- Orçamentos
- Custos por paciente

#### 📅 Timeline
- Linha do tempo visual do tratamento
- Eventos marcantes
- Evolução cronológica

#### 📊 Relatórios
- Exportação Excel/PDF
- Dashboards personalizados
- Gráficos analíticos

### 🔗 Integrações

#### Google Workspace
- **Google Sheets**: Sincronização automática de dados
- **Google Drive**: Armazenamento de documentos e backups
- **OAuth2**: Autenticação segura

#### Recursos Avançados
- **IndexedDB**: Persistência local robusta
- **Service Worker**: Modo offline completo
- **Background Sync**: Sincronização em segundo plano
- **Push Notifications**: Notificações em tempo real

---

## 🛠️ Tecnologias

### Frontend
```
- HTML5 / CSS3 / JavaScript (ES6+)
- Tailwind CSS (Design System)
- Chart.js (Gráficos)
- FullCalendar (Calendário)
- Dexie.js (IndexedDB wrapper)
```

### APIs & Integrações
```
- Google Sheets API v4
- Google Drive API v3
- Google OAuth2
- Firebase Cloud Messaging (opcional)
```

### PWA & Performance
```
- Service Workers
- Web App Manifest
- Background Sync API
- Cache API
```

---

## 💻 Instalação

### Pré-requisitos

- Navegador moderno (Chrome, Firefox, Edge, Safari)
- Servidor web (local ou hospedado)
- Credenciais Google Cloud (para integrações)

### Passo 1: Clone o Repositório

```bash
git clone https://github.com/AD-Thiago/dete-sistema-v3.git
cd dete-sistema-v3
```

### Passo 2: Configure as Integrações

1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. Crie um novo projeto
3. Ative as APIs:
   - Google Sheets API
   - Google Drive API
4. Crie credenciais OAuth 2.0
5. Configure as URLs autorizadas

### Passo 3: Execute o Projeto

#### Opção 1: Servidor Local Simples (Python)
```bash
# Python 3
python -m http.server 8000
```

#### Opção 2: Node.js (http-server)
```bash
npx http-server -p 8000
```

#### Opção 3: Live Server (VS Code)
```
Instale a extensão "Live Server" e clique em "Go Live"
```

### Passo 4: Configure via Interface

1. Abra `http://localhost:8000`
2. Vá para Configurações > Integrações
3. Siga o wizard de setup:
   - Credenciais Google Cloud
   - Autenticação OAuth2
   - Configuração Google Sheets
   - Configuração Google Drive
   - Sincronização

---

## 📚 Documentação

### Estrutura do Projeto

```
dete-sistema-v3/
├── index.html              # Página principal
├── manifest.json           # PWA manifest
├── service-worker.js       # Service worker
├── css/
│   ├── tailwind.min.css    # Tailwind CSS
│   ├── design-system.css   # Design system
│   └── components.css      # Componentes
├── js/
│   ├── app.js              # Aplicação principal
│   ├── db.js               # IndexedDB (Dexie)
│   ├── router.js           # Roteamento SPA
│   ├── sync.js             # Sincronização
│   ├── google-api.js       # Google APIs
│   └── modules/
│       ├── dashboard.js
│       ├── pacientes.js
│       ├── cuidadores.js
│       ├── financeiro.js
│       └── timeline.js
├── icons/                  # Ícones PWA
├── docs/                   # Documentação
└── README.md
```

### Guias Disponíveis

- [📖 Documentação Técnica Completa](./docs/TECHNICAL.md)
- [🔗 Guia de Integrações](./docs/INTEGRATIONS.md)
- [📦 Guia de Deploy](./docs/DEPLOY.md)
- [🎨 Design System](./docs/DESIGN_SYSTEM.md)
- [👥 Guia de Contribuição](./CONTRIBUTING.md)

---

## 👨‍💻 Desenvolvimento

### Como Contribuir

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

Veja [CONTRIBUTING.md](./CONTRIBUTING.md) para mais detalhes.

### Roadmap

- [x] Módulos principais (Dashboard, Pacientes, Cuidadores, Financeiro)
- [x] Integração Google Workspace
- [x] PWA completo
- [x] Design premium
- [ ] Testes automatizados (em andamento)
- [ ] Internacionalização (i18n)
- [ ] Tema personalizável
- [ ] Integração WhatsApp
- [ ] App Mobile (React Native)

---

## 📝 Licença

Distribuído sob a licença MIT. Veja `LICENSE` para mais informações.

---

## ❓ Suporte

Se você encontrar algum problema ou tiver dúvidas:

- 🐛 [Reporte bugs](https://github.com/AD-Thiago/dete-sistema-v3/issues/new?template=bug_report.md)
- 💡 [Solicite features](https://github.com/AD-Thiago/dete-sistema-v3/issues/new?template=feature_request.md)
- 💬 [Discussões](https://github.com/AD-Thiago/dete-sistema-v3/discussions)

---

## 👏 Agradecimentos

- Equipe de desenvolvimento DETE
- Comunidade open-source
- Contribuidores

---

<div align="center">

**Desenvolvido com ❤️ por [TCruz](https://github.com/AD-Thiago)**

[Website](https://analisandodados.com) · [LinkedIn](https://linkedin.com) · [Twitter](https://twitter.com)

</div>