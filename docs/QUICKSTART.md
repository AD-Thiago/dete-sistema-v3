# Quick Start - DETE v3.0

## 🚀 Comece em 5 Minutos

Guia rápido para ter o DETE rodando localmente.

---

## 1️⃣ Clone o Repositório

```bash
git clone https://github.com/AD-Thiago/dete-sistema-v3.git
cd dete-sistema-v3
```

---

## 2️⃣ Execute Localmente

### Opção A: Python (se tiver instalado)

```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

### Opção B: Node.js

```bash
# Instalar http-server globalmente (uma vez)
npm install -g http-server

# Executar
http-server -p 8000
```

### Opção C: VS Code (Live Server)

1. Instale extensão "Live Server"
2. Clique com botão direito em `index.html`
3. Selecione "Open with Live Server"

### Opção D: PHP

```bash
php -S localhost:8000
```

---

## 3️⃣ Abra no Navegador

Acesse: **http://localhost:8000**

---

## 4️⃣ Explore o Sistema

O sistema vem com **modo demo** ativo. Você pode:

✅ Navegar por todos os módulos
✅ Criar pacientes de teste
✅ Criar cuidadores de teste
✅ Lançar transações financeiras
✅ Visualizar timeline
✅ Ver dashboards e gráficos

**Dados armazenados**: IndexedDB (local no navegador)

---

## 5️⃣ Configurar Integrações (Opcional)

Para habilitar sincronização com Google Sheets/Drive:

1. **Obtenha credenciais Google Cloud**
   - Siga: [Guia de Integrações](./INTEGRATIONS.md)

2. **Configure no sistema**
   - Vá para: `Configurações > Integrações`
   - Siga o wizard de setup

---

## 📚 Próximos Passos

### Aprenda Mais

- 📖 [Documentação Técnica](./TECHNICAL.md) - Arquitetura e implementação
- 🔗 [Guia de Integrações](./INTEGRATIONS.md) - Google Workspace
- 🚀 [Guia de Deploy](./DEPLOY.md) - Colocar em produção
- 👥 [Guia de Contribuição](../CONTRIBUTING.md) - Como contribuir

### Teste Funcionalidades

**Dashboard**
- Estatísticas em tempo real
- Gráficos interativos
- Alertas e notificações

**Pacientes**
- Adicionar novo paciente
- Editar informações
- Ver prontuário
- Timeline do tratamento

**Cuidadores**
- Cadastrar cuidador
- Definir escala
- Registrar ponto
- Fechamento mensal

**Financeiro**
- Lançar receita
- Lançar despesa
- Visualizar DRE
- Orçamento vs Realizado

**Relatórios**
- Exportar para Excel
- Exportar para PDF
- Dashboards customizados

---

## ❓ Dúvidas Comuns

### Como limpar dados de teste?

```javascript
// Abra DevTools (F12) > Console
await dbUtils.clearAll();
```

### Como fazer backup?

1. `Configurações > Backup/Restore`
2. Clique em "Exportar Dados"
3. Salve o arquivo JSON

### Como restaurar backup?

1. `Configurações > Backup/Restore`
2. Clique em "Importar Dados"
3. Selecione arquivo JSON

### Como ver dados no IndexedDB?

1. Abra DevTools (F12)
2. Aba "Application"
3. Lateral esquerda: Storage > IndexedDB > DETEDatabase
4. Explore as tabelas

---

## 🐛 Problemas?

Se encontrar problemas:

1. **Verifique console do navegador** (F12)
2. **Limpe cache** (Ctrl+Shift+Delete)
3. **Teste em modo anônimo**
4. **Abra issue** no GitHub

---

## 💬 Suporte

- 🐛 [Reportar Bug](https://github.com/AD-Thiago/dete-sistema-v3/issues/new?template=bug_report.md)
- 💡 [Sugerir Feature](https://github.com/AD-Thiago/dete-sistema-v3/issues/new?template=feature_request.md)
- 💬 [Discussões](https://github.com/AD-Thiago/dete-sistema-v3/discussions)

---

**Boa codificação! 🚀**