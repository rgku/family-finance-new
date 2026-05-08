# Checklist de Tarefa Completa

Após completar uma tarefa de código, seguir esta sequência:

## 1. Verificar Compilação

```bash
# Build de produção (detecta erros de tipo e build)
npm run build
```

✅ Build bem-sucedido sem erros

## 2. Rodar Linter

```bash
# ESLint
npm run lint
```

✅ Sem erros ou warnings do ESLint

## 3. Rodar Testes

```bash
# Testes unitários
npm run test

# Ou com coverage se necessário
npm run test:coverage
```

✅ Todos testes passam
✅ Coverage >= 70% (se aplicável à área modificada)

## 4. Verificar Formatação

```bash
# Se houver script de format (verificar package.json)
npm run format
```

## 5. Testar Manualmente (se aplicável)

```bash
# Iniciar dev server
npm run dev
```

- Acessar http://localhost:3000
- Verificar funcionalidade alterada
- Testar edge cases

## 6. Git Commit (se solicitado)

```bash
# Ver mudanças
git status
git diff

# Adicionar e commitar
git add .
git commit -m "tipo: descrição clara"

# Push (se solicitado)
git push
```

## Padrões de Commit

```
feat: nova funcionalidade
fix: correção de bug
refactor: refatoração sem mudança de comportamento
docs: atualização de documentação
test: adicionar/modificar testes
chore: configuração, build, ferramentas
```

## 7. Verificar Próximos Passos

- Existe tarefa relacionada pendente?
- Documentação precisa atualização?
- Há dependências para outras features?

## Resumo Rápido

```bash
# Sequência completa
npm run build && npm run lint && npm run test
```

Se tudo passar: ✅ Tarefa completa e verificada
