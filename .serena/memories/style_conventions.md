# Estilo e Convenções

## TypeScript

### Configuração
- `strict: true` no tsconfig
- `noEmit: true` (Next.js compila)
- `jsx: react-jsx`
- Module resolution: `bundler`

### Tipagem
```typescript
// ✅ Interfaces para objetos complexos
interface Transaction {
  id: string
  amount: number
  category: string
  date: string
}

// ✅ Type aliases para uniões/primitivos
type TransactionType = 'income' | 'expense'
type Currency = 'EUR' | 'USD' | 'BRL'

// ✅ Generic types quando aplicável
interface ApiResponse<T> {
  data: T
  status: number
}

// ❌ Evitar any
const data: any // ❌
const data: unknown // ✅ (se tipo realmente desconhecido)
```

### Funções
```typescript
// ✅ Explicitar tipos de parâmetros e retorno
function calculateTotal(transactions: Transaction[]): number {
  return transactions.reduce((sum, t) => sum + t.amount, 0)
}

// ✅ Arrow functions com tipagem
const calculateTotal = (transactions: Transaction[]): number => {
  return transactions.reduce((sum, t) => sum + t.amount, 0)
}
```

## React/Next.js

### Componentes
```typescript
// ✅ Functional components com typed props
interface DashboardProps {
  userId: string
  initialData?: Transaction[]
}

export function Dashboard({ userId, initialData = [] }: DashboardProps) {
  return <div>...</div>
}

// ✅ Default values no destructuring
export function Card({ title = 'Default', children }: CardProps) {
  return <div>{title}{children}</div>
}
```

### Hooks
```typescript
// ✅ Custom hooks com tipagem
export function useTransactions(userId: string) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  
  // ... lógica
  
  return { transactions, loading }
}

// ✅ ReturnType quando necessário
type UseTransactionsReturn = ReturnType<typeof useTransactions>
```

### Server vs Client Components
```typescript
// ✅ Server Component (padrão)
export default async function Page() {
  const data = await fetchData()
  return <div>{data}</div>
}

// ✅ Client Component (quando hooks/eventos)
'use client'

export function Counter() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>
}
```

## TailwindCSS

### Padrões
```tsx
// ✅ Classes em ordem lógica
<div className="flex items-center justify-between gap-4 p-4 bg-white rounded-lg shadow">
  {/* conteúdo */}
</div>

// ✅ Conditional classes com template literal
<div className={`p-4 rounded ${isActive ? 'bg-blue-500' : 'bg-gray-500'}`}>
  {/* conteúdo */}
</div>

// ✅ clsx ou classnames para múltiplas condições
import { clsx } from 'clsx'
<div className={clsx('p-4', isActive && 'bg-blue-500')}>
```

## Nomenclatura

### Arquivos
- Componentes: `PascalCase.tsx` (ex: `UserProfile.tsx`)
- Hooks: `usePascalCase.ts` (ex: `useAuth.ts`)
- Utils: `camelCase.ts` (ex: `formatCurrency.ts`)
- Pages: `directory/page.tsx` (Next.js convention)

### Variáveis/Funções
```typescript
// ✅ Descritivo e em inglês
const currentUser = getUser()
const calculateTotal = () => {}
const isTransactionValid = true

// ❌ Evitar abreviações obscuras
const usr = getUser() // ❌
const calc = () => {} // ❌
```

## Comentários

### Quando usar
- Explicar "porquê" não óbvio
- Documentar decisões complexas
- TODOs com contexto

```typescript
// ✅ Bom: explica razão
// Using debounce to prevent excessive API calls on search input
const debouncedSearch = debounce(search, 300)

// ✅ TODO com contexto
// TODO: Move this to server component when Next.js 17 supports it
```

## Testes (Jest)

### Estrutura
```typescript
describe('calculateTotal', () => {
  it('should return 0 for empty array', () => {
    expect(calculateTotal([])).toBe(0)
  })
  
  it('should sum all transactions', () => {
    const transactions = [{ amount: 100 }, { amount: 200 }]
    expect(calculateTotal(transactions)).toBe(300)
  })
})
```

### Coverage
- Mínimo: 70% (branches, functions, lines, statements)
- Foco em: `src/lib/ai/**`
