# Plano de Melhorias - FamFlow
## Analytics Aprimorado & Reports PDF

**Data:** 24 de Abril de 2026  
**Versão:** 1.0  
**Estado:** Em Planeamento

---

## 1. VISÃO GERAL

O objetivo é melhorar duas funcionalidades principais:
1. **Analytics** - Ajudar o utilizador a perceber para onde vai o dinheiro e como gerir melhor
2. **Reports** - Criar relatórios visuais completos para análise mensal

---

## 2. ANALYTICS APRIMORADO

### 2.1 Estado Atual

| Componente | Status |
|------------|--------|
| Sumário (Receitas/Despesas/Poupança) | ✅ Existente |
| Tendência mensal (6 meses) | ✅ Existente |
| Despesas por categoria | ✅ Existente |
| Insights de IA | ✅ Existente |
| Previsão próximo mês | ✅ Existente |

### 2.2 Componentes a Adicionar

| # | Componente | Descrição | Prioridade | Esforço |
|---|------------|-----------|------------|---------|
| 1 | **Card "vs Budget"** | Mostra quanto falta/sobra vs orçamento por categoria | 🔴 Alta | 2h |
| 2 | **Dicas Poupança** | Sugestões personalizadas por IA baseadas no padrão de gastos | 🔴 Alta | 3h |
| 3 | **Tendência Poupança** | Gráfico de evolução da poupança (3 meses) | 🟡 Média | 2h |
| 4 | **Alertas IA** | Padrões anómalos detectados pela IA | 🟡 Média | 4h |
| 5 | **Goals Visual Melhorado** | Progresso visual dos objetivos com próximos passos | 🟡 Média | 2h |

### 2.3 Detalhamento dos Componentes

#### Card "vs Budget"
- Mostrar diferença entre gasto real e orçamento por categoria
- Ex: "Alimentação: 500€/600€ (-100€ dentro do budget)"
- Ex: "Lazer: 300€/200€ (+50€ sobre budget)"
- Cores: Verde (dentro), Amarelo (80-100%), Vermelho (>100%)

#### Dicas Poupança (por IA)
- Analisa padrão de gastos do utilizador
- Gera sugestões personalizadas:
  - "Se reduzires 50€ em Lazer, pouparias mais 2.8%"
  - "Poupança atual: 28%, meta: 30%"
  - "Já poupaste 500€ este mês, continua assim!"

#### Tendência Poupança (3 meses)
- Gráfico de barras mostrando evolução da poupança
- Comparação com mês anterior
- Indicador de progresso vs meta

#### Alertas IA
- Deteta padrões anómalos usando IA:
  - "Gastaste 45% mais em Restaurantes que mês passado"
  - "Supermercado está no limite do orçamento há 2 meses"
  - "Poupança aumentou 20% vs média dos últimos 3 meses"
- Usa histórico do utilizador para comparações inteligentes
- Baseado nos insights de IA já existentes, expandido

#### Goals Visual Melhorado
- Progresso bar melhorada com % e valor em euros
- Indicar quanto falta para atingir objetivo
- Mostrar data limite se existir
- Sugestão de contribuição mensal para atingir meta

### 2.4 Layout Proposto

```
┌─────────────────────────────────────────────────────────────┐
│  ANÁLISE FINANCEIRA                              📅 Abril   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐ ┌──────────────────┐ ┌────────────┐   │
│  │ 💎 Poupança: 28%│ │ vs Budget: +120€ │ │ vs Mês Ant │   │
│  │ Meta: 30%       │ │ Categoria: Lazer │ │ Desp:-5%   │   │
│  └──────────────────┘ └──────────────────┘ └────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 💰 RECEITAS     │ 💸 DESPESAS     │ 💎 POUPANÇA      │   │
│  │ +2.500€         │ -1.800€         │ +700€ (28%)      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────┐ ┌────────────────────────────┐│
│  │ 💡 DICAS DE POUPANÇA   │ │ ⚠️ ALERTAS                 ││
│  │                         │ │                            ││
│  │ • Reduzir 50€ em lazer  │ │ • Restaurantes +45% vs M.P.││
│  │   = +2.8% mais poup.    │ │ • Objetivo Férias 80%      ││
│  │                         │ │                            ││
│  │ • Poupança atual: 28%   │ │ • Supermercado no limite   ││
│  │   Meta próxima: 30%     │ │                            ││
│  └─────────────────────────┘ └────────────────────────────┘│
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 📊 TENDÊNCIA POUPANÇA (3 meses)                       │   │
│  │                                                     │   │
│  │ Fev: 15% ████████░░░░░░                              │   │
│  │ Mar: 22% ████████████░░░░                           │   │
│  │ Abr: 28% ██████████████░░░                          │   │
│  │                                                     │   │
│  │ Meta: 30% ████████████████████                        │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 🎯 OBJETIVOS DE POUPANÇA                              │   │
│  │                                                     │   │
│  │ Férias ████████░░ 80% (800€ de 1000€)                │   │
│  │        Faltam: 200€ • Até: Dez/2024                   │   │
│  │                                                     │   │
│  │ Carro ████░░░░░░ 40% (400€ de 1000€)                 │   │
│  │       Faltam: 600€ • Até: Jun/2025                    │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 2.5 Decisões Técnicas

| Decisão | Escolha |
|---------|---------|
| Biblioteca de gráficos | Recharts (já usado na app) |
| Tendência mensal | Manter 6 meses (já implementado) |
| Tendência poupança | 3 meses |
| IA (insights) | Manter existente + expandir |
| IA (alertas) | Usar existente como base, adicionar padrões |

---

## 3. REPORTS APRIMORADO

### 3.1 Estado Atual

| Componente | Status |
|------------|--------|
| Sumário (Receitas/Despesas/Balanço) | ✅ Existente |
| Lista orçamentos | ✅ Existente |
| Exportação CSV | ✅ Existente |
| Exportação PDF | ✅ Existente |
| Partilha link | ✅ Existente |

### 3.2 Componentes a Adicionar

| # | Componente | Descrição | Prioridade | Esforço |
|---|------------|-----------|------------|---------|
| 1 | **Header A4** | Logo, título, período, data emissão | 🔴 Alta | 1h |
| 2 | **Gráficos Visuais** | Pizzas, barras no PDF | 🔴 Alta | 4h |
| 3 | **Comparação Mensal** | Este mês vs mês anterior | 🟡 Média | 2h |
| 4 | **Estatísticas Avançadas** | Média diária, maiores gastos, total transações | 🟡 Média | 2h |
| 5 | **Orçamentos Visual** | Status com barras e cores | 🟡 Média | 2h |
| 6 | **Goals Detalhado** | Progresso com quanto falta | 🟡 Média | 2h |

### 3.3 Detalhamento dos Componentes

#### Header A4
- Logo FamFlow
- Título: "RELATÓRIO FINANCEIRO MENSAL"
- Período: "1 de Abril a 30 de Abril de 2024"
- Data de emissão: "30 de Abril de 2024 às 14:30"

#### Gráficos Visuais
- **Gráfico de barras**: Receitas vs Despesas (comparativo)
- **Gráfico de pizza**: Gastos por categoria
- **Gráfico de tendência**: Últimos 3 meses

#### Comparação Mensal
- Receitas: +X% vs mês anterior
- Despesas: -X% vs mês anterior
- Poupança: +X% vs mês anterior
- Ícones: 📈 (aumento positivo), 📉 (diminuição)

#### Estatísticas Avançadas
- Despesa média diária
- Maior despesa única (valor + descrição)
- Maior receita (valor + descrição)
- Total de transações
- Categorias usadas vs disponíveis
- Dias do período

#### Orçamentos Visual
- Barra de progresso com cores:
  - Verde: < 80%
  - Amarelo: 80-100%
  - Vermelho: > 100%
- Mostrar: categoria, gasto, limite, % usado

#### Goals Detalhado
- Progresso bar com %
- Valor atual / valor meta
- Quanto falta para atingir
- Data limite se existir

### 3.4 Layout PDF Proposto (A4)

```
┌─────────────────────────────────────────────────────────────┐
│                    📊 FamFlow                               │
│              RELATÓRIO FINANCEIRO MENSAL                     │
├─────────────────────────────────────────────────────────────┤
│  Período: 1 de Abril a 30 de Abril de 2024                   │
│  Data de emissão: 30 de Abril de 2024                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────┐   │
│  │           RESUMO DO MÊS                             │   │
│  │                                                    │   │
│  │   ┌──────────┐  ┌──────────┐  ┌──────────┐        │   │
│  │   │ RECEITAS │  │ DESPESAS │  │ SALDO    │        │   │
│  │   │ +2.500€  │  │ -1.800€  │  │ +700€    ��        │   │
│  │   └──────────┘  └──────────┘  └──────────┘        │   │
│  │                                                    │   │
│  │   [GRÁFICO DE BARRAS: Receitas vs Despesas]        │   │
│  └────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────┐ ┌────────────────────────────┐      │
│  │ vs MÊS ANTERIOR     │ │ ESTATÍSTICAS              │      │
│  │                     │ │                            │      │
│  │ 📈 Receitas: +4%   │ │ • Média diária: 60€       │      │
│  │ 📉 Despesas: -3%    │ │ • Maior gasto: 450€       │      │
│  │ 📈 Poupança: +43%   │ │ • Total trans.: 47        │      │
│  └─────────────────────┘ └────────────────────────────┘      │
│                                                              │
│  ┌────────────────────────────────────────────────────┐   │
│  │        GASTOS POR CATEGORIA                          │   │
│  │                                                    │   │
│  │        [GRÁFICO DE PIZZA]                          │   │
│  │                                                    │   │
│  │  ● Alimentação    28%    (500€)                   │   │
│  │  ● Transporte     19%    (350€)                   │   │
│  │  ● Lazer           17%    (300€)                   │   │
│  │  ● Outros         36%    (650€)                   │   │
│  └────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌────────────────────────────────────────────────────┐   │
│  │        ORÇAMENTOS                                   │   │
│  │                                                    │   │
│  │  [███████░░] Alimentação   500€/600€   83%  ✓       │   │
│  │  [████████░] Transporte    350€/400€   87%  ✓       │   │
│  │  [██████████] Lazer        300€/200€  150%  ⚠️      │   │
│  └────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌────────────────────────────────────────────────────┐   │
│  │        OBJETIVOS DE POUPANÇA                         │   │
│  │                                                    │   │
│  │  🎯 Férias 2024                                     │   │
│  │     [████████████████████░░░░░░░░] 80%              │   │
│  │     800€ de 1.000€ • Faltam: 200€                   │   │
│  │                                                    │   │
│  │  🎯 Fundo Emergência                                 │   │
│  │     [██████████░░░░░░░░░░░░░░░] 50%                │   │
│  │     1.000€ de 2.000€ • Faltam: 1.000€               │   │
│  └────────────────────────────────────────────────────┘   │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│  Gerado por FamFlow • famflow.app                          │
│  Este documento contém dados protegidos                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. FUNCIONALIDADE FUTURA (PREMIUM)

### Exportação Automática Mensal
- **Para quem:** Utilizadores Premium
- **Descrição:** Relatório mensal enviado por email automaticamente
- **Quando:** No dia do ciclo de faturação
- **Estado:** Para depois

---

## 5. TIMELINE ESTIMADO

### Fase 1: Analytics
| Tarefa | Esforço | Status |
|--------|---------|--------|
| Card "vs Budget" | 2h | Pending |
| Dicas Poupança | 3h | Pending |
| Tendência Poupança | 2h | Pending |
| Alertas IA | 4h | Pending |
| Goals Visual | 2h | Pending |

**Total Fase 1:** ~2-3 dias

### Fase 2: Reports
| Tarefa | Esforço | Status |
|--------|---------|--------|
| Header A4 | 1h | Pending |
| Gráficos no PDF | 4h | Pending |
| Comparação Mensal | 2h | Pending |
| Estatísticas | 2h | Pending |
| Orçamentos Visual | 2h | Pending |
| Goals Detalhado | 2h | Pending |

**Total Fase 2:** ~2 dias

---

## 6. PRIORIDADE DE IMPLEMENTAÇÃO

### Ordem Sugerida:

1. **Fase 1 - Analytics**
   - 1.1 Card "vs Budget" (mais simples, maior impacto)
   - 1.2 Tendência Poupança (visual, rápido)
   - 1.3 Dicas Poupança (usa IA existente)
   - 1.4 Goals Visual (melhoria do existente)
   - 1.5 Alertas IA (mais complexo)

2. **Fase 2 - Reports**
   - 2.1 Header institucional
   - 2.2 Gráficos no PDF
   - 2.3 Comparação mensal
   - 2.4 Estatísticas
   - 2.5 Orçamentos visual
   - 2.6 Goals detalhado

---

## 7. NOTAS TÉCNICAS

### Analytics
- Ficheiros a modificar: `src/app/dashboard/analytics/page.tsx`
- Componentes: `src/components/charts/`
- Hook IA: `src/hooks/useAIInsights.ts`

### Reports
- Ficheiros a modificar: `src/app/dashboard/reports/page.tsx`
- Componente PDF: `src/components/ReportPDF.tsx`

---

## 8. CHECKLIST

### Analytics
- [ ] Card "vs Budget" implementado
- [ ] Tendência Poupança 3 meses
- [ ] Dicas Poupança por IA
- [ ] Goals visual melhorado
- [ ] Alertas IA implementados

### Reports
- [ ] Header institucional A4
- [ ] Gráficos no PDF
- [ ] Comparação mensal
- [ ] Estatísticas avançadas
- [ ] Orçamentos visual
- [ ] Goals detalhado

---

**Documento criado:** 24 de Abril de 2026  
**Última atualização:** 24 de Abril de 2026