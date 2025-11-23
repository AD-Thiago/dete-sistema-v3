# Contribuindo para o DETE v3.0

Primeiro, obrigado por considerar contribuir para o DETE! 🚀

## Código de Conduta

Este projeto adere a um Código de Conduta. Ao participar, você concorda em manter um ambiente respeitoso e acolhedor.

## Como Posso Contribuir?

### Reportando Bugs

Antes de criar um issue de bug:
- Verifique se o bug já foi reportado
- Use a template de bug report
- Inclua:
  - Descrição clara do problema
  - Passos para reproduzir
  - Comportamento esperado vs atual
  - Screenshots (se aplicável)
  - Ambiente (navegador, SO, versão)

### Sugerindo Melhorias

Para sugerir novas funcionalidades:
- Use a template de feature request
- Descreva o problema que a feature resolve
- Explique como você imagina que funcione
- Considere alternativas

### Pull Requests

1. **Fork o projeto**
```bash
git clone https://github.com/AD-Thiago/dete-sistema-v3.git
cd dete-sistema-v3
```

2. **Crie uma branch**
```bash
git checkout -b feature/MinhaNovaFeature
# ou
git checkout -b fix/CorrecaoDeBug
```

3. **Faça suas alterações**
- Siga o guia de estilo do projeto
- Escreva testes se aplicável
- Atualize a documentação

4. **Commit suas mudanças**
```bash
git add .
git commit -m "feat: Adiciona nova funcionalidade X"
```

Use o padrão de commits:
- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Mudanças na documentação
- `style:` Formatação, ponto-e-vírgula, etc
- `refactor:` Refatoração de código
- `test:` Adição de testes
- `chore:` Atualizações de build, CI, etc

5. **Push para o GitHub**
```bash
git push origin feature/MinhaNovaFeature
```

6. **Abra um Pull Request**
- Use a template de PR
- Descreva suas mudanças claramente
- Referencie issues relacionadas
- Aguarde a revisão

## Guia de Estilo

### JavaScript

```javascript
// Use ES6+
const minhaFuncao = async (parametro) => {
  try {
    const resultado = await algumaOperacao(parametro);
    return resultado;
  } catch (error) {
    console.error('Erro:', error);
    throw error;
  }
};

// Use nomes descritivos
const calcularTotalMensal = (lancamentos) => {
  return lancamentos.reduce((acc, lanc) => acc + lanc.valor, 0);
};

// Comente código complexo
// Calcula média ponderada considerando prioridade
const mediaPonderada = itens.reduce((acc, item) => {
  return acc + (item.valor * item.prioridade);
}, 0) / totalPrioridades;
```

### HTML

```html
<!-- Use semântica correta -->
<section class="pacientes-lista">
  <header>
    <h2>Pacientes Ativos</h2>
  </header>
  
  <main>
    <!-- Conteúdo -->
  </main>
</section>

<!-- Acessibilidade -->
<button 
  aria-label="Adicionar novo paciente"
  class="btn btn-primary"
>
  <span aria-hidden="true">+</span>
  Novo Paciente
</button>
```

### CSS

```css
/* Use classes BEM ou utilitárias */
.card {
  /* Propriedades estruturais */
  display: flex;
  flex-direction: column;
  
  /* Espaçamento */
  padding: var(--space-md);
  gap: var(--space-sm);
  
  /* Visual */
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  
  /* Transições */
  transition: all var(--transition-base);
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}
```

## Estrutura de Commits

### Formato
```
<tipo>(<escopo>): <descrição curta>

<descrição longa opcional>

<footer opcional>
```

### Exemplos
```
feat(pacientes): Adiciona filtro por status

Implementa filtro dropdown para filtrar pacientes
por status (Ativo, Inativo, Suspenso).

Fixes #123
```

```
fix(sync): Corrige erro na sincronização com Sheets

O token OAuth estava expirando sem renovar.
Agora renova automaticamente 5min antes de expirar.

Closes #456
```

## Testes

Antes de submeter PR, teste:

1. **Funcionalidade básica**
   - CRUD de pacientes
   - CRUD de cuidadores
   - Lançamentos financeiros
   - Timeline

2. **Integrações**
   - Autenticação Google
   - Sincronização Sheets
   - Upload para Drive

3. **Responsividade**
   - Desktop (1920x1080)
   - Tablet (768x1024)
   - Mobile (375x667)

4. **Navegadores**
   - Chrome (latest)
   - Firefox (latest)
   - Safari (latest)
   - Edge (latest)

## Documentação

Se adicionar/modificar funcionalidades:

1. Atualize o README se necessário
2. Adicione comentários JSDoc
3. Atualize documentação técnica em `docs/`

## Processo de Revisão

1. Mantenedor revisa o PR
2. Pode solicitar mudanças
3. Você faz ajustes
4. Após aprovação, PR é merged
5. Seu nome é adicionado aos contribuidores! 🎉

## Dúvidas?

Se tiver dúvidas:
- Abra uma [Discussion](https://github.com/AD-Thiago/dete-sistema-v3/discussions)
- Entre em contato: thiago@analisandodados.com

---

**Obrigado por contribuir! 🚀**