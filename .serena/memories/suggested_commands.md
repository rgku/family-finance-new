# Comandos Sugeridos

## Desenvolvimento Diário

```bash
# Iniciar servidor de desenvolvimento
npm run dev

# Build de produção
npm run build

# Rodar em produção (após build)
npm run start
```

## Qualidade de Código

```bash
# Lint (ESLint)
npm run lint

# Testes unitários
npm run test

# Testes com coverage report
npm run test:coverage
```

## Git

```bash
# Ver status
git status

# Ver diferenças
git diff

# Adicionar arquivos
git add .
# ou específico: git add <file>

# Commit
git commit -m "mensagem"

# Push
git push

# Pull
git pull
```

## Windows PowerShell Úteis

```powershell
# Listar diretórios
Get-ChildItem -Directory

# Listar arquivos
Get-ChildItem -File

# Buscar em arquivos
Select-String -Pattern "texto" -Path *.ts

# Criar diretório
New-Item -ItemType Directory -Path "nome"

# Remover arquivo/diretório
Remove-Item -Path "nome"

# Ler arquivo
Get-Content "arquivo.txt"
```

## Node/npm

```bash
# Instalar dependências
npm install

# Instalar pacote
npm install <package>
npm install -D <package>  # dev dependency

# Atualizar pacotes
npm update

# Verificar pacotes desatualizados
npm outdated

# Limpar cache
npm cache clean --force
```

## Supabase (se aplicável)

```bash
# Link projeto
npx supabase link

# Sync types
npx supabase gen types typescript --project-id <id> > src/lib/supabase/types.ts
```
