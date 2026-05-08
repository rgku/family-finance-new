# FamFlow — Plano: Adicionar "Modo Casal" dentro do conceito Família

> **Princípio:** Não substituir Família por Casal. Manter o conceito Família como está e **adicionar uma camada Casal por cima**, ativável quando o agregado tem exatamente 2 adultos que querem regras de divisão entre si.

---

## 1. Como encaixa no que já existe

A app continua a ter:
- **Família** (até N membros) — o conceito guarda-chuva. Não muda.
- **Convites, partilha, dashboard familiar, orçamentos partilhados** — tudo igual.

Adiciona-se:
- **"Relação de Casal"** dentro da Família. Quando 2 membros adultos se associam como casal, desbloqueiam-se as funcionalidades extra (regras de divisão + acerto MB WAY).
- Família com 1 adulto + filhos → continua a funcionar igual, sem nada novo.
- Família com 3+ adultos → continua igual; podem opcionalmente declarar 2 deles como casal.
- Família com 2 adultos → onboarding sugere ativar Modo Casal, mas é **opcional**.

---

## 2. Definições → Família → Casal (novo separador)

Dentro do ecrã **Família** existente, adicionar um separador / secção **Casal** com:

### Estado 1 — Sem casal definido
```text
┌──────────────────────────────────────────┐
│  Querem ativar o Modo Casal?            │
│                                          │
│  Permite definir regras de divisão de   │
│  despesas entre 2 membros e fazer       │
│  acerto mensal por MB WAY.              │
│                                          │
│  [Ativar Modo Casal]                    │
└──────────────────────────────────────────┘
```

### Estado 2 — Casal ativo
Mostra os 2 membros + modo de divisão escolhido + botão "Editar regras".

---

## 3. Os 5 modos de divisão (configuráveis)

Default agressivo: **Pool Comum**, porque há casais que "têm tudo junto e é indiferente" — esses não precisam de pensar em nada.

| # | Modo | Para quem | O que faz |
|---|---|---|---|
| 0 | **Pool Comum** *(default)* | "Tudo junto, não contamos" | Não calcula dívidas. Dashboard único. Acerto desligado. |
| 1 | **50/50** | Rendimentos parecidos | Despesas partilhadas dividem a metades |
| 2 | **Proporcional ao rendimento** | Rendimentos diferentes | Cada um indica salário; app calcula % automática |
| 3 | **Por categorias** | Divisão tradicional | "Renda = A, Mercado = B, Lazer = 50/50" |
| 4 | **Personalizado** | Casos especiais | Combinação livre por categoria, valor, conta |

Mudar de modo é 1 clique nas Definições. Ao mudar, **só afeta transações futuras** (não recalcula histórico, evita confusão).

---

## 4. Onboarding — alteração mínima

O fluxo atual de Família mantém-se. Acrescenta-se **1 passo opcional** quando o agregado fica com 2 adultos:

```text
"Vocês os 2 querem definir regras de divisão de despesas?"

  [Sim, ativar Modo Casal]   [Agora não, talvez depois]
                             ↑ default
```

Quem clica "Sim" → escolhe modo (Pool Comum default) → salário (se proporcional) → done.
Quem clica "Agora não" → app funciona como sempre funcionou.

---

## 5. Comportamento nas transações

### Sem Modo Casal ativo
Form igual ao atual. Nada muda.

### Com Modo Casal ativo (qualquer modo ≠ Pool)
Adiciona-se 1 linha no form:

```text
Restaurante  -45,00€   Categoria: Lazer
─────────────────────────────────────────
Pago por:   [Tu ▼]
Divisão:    ● Conforme regra (50/50 → 22,50 cada)
            ○ 100% pessoal (não dividir)
            ○ Personalizar...
```

### Com Pool Comum
Form atual + apenas mostra "Registado por: Maria". Sem campos de divisão.

---

## 6. Acerto Mensal MB WAY (apenas modos 50/50, Proporcional, Categorias, Personalizado)

### Como funciona
1. Cron dia 1 do mês fecha período anterior
2. Calcula saldo líquido: "João deve 124,05€ a Maria"
3. Push + email aos 2
4. Card no topo do dashboard: **"Acerto de Novembro — [Acertar agora]"**

### Métodos de pagamento (FamFlow não toca no dinheiro)
- **MB WAY deeplink** — `mbway://payment?phone=...&amount=...`
- **QR Code MB WAY** (fallback)
- **Copiar IBAN** (one-tap)
- **Marcar como pago manualmente**

Confirmação dupla: ambos têm de confirmar para fechar período.

### Ecrã de acerto
```text
Acerto de Novembro 2025
─────────────────────────────────
Despesas partilhadas:    1.842,50 €
Pago pela Maria:           1.045,30
Pago pelo João:              797,20
─────────────────────────────────
→ João deve a Maria:       124,05 €

[💳 Pagar com MB WAY]  [Copiar IBAN]  [Marcar pago]
📄 Descarregar PDF
```

**Sem licença bancária necessária** — somos facilitador, não intermediário.

---

## 7. Modelo de dados (alto nível)

Acrescentar (sem mexer no existente):

- **`couple_relation`** — `family_id`, `user_a`, `user_b`, `active` (bool)
- **`couple_settings`** — `couple_id`, `mode`, `income_a`, `income_b`, `default_payer`
- **`category_rules`** — `couple_id`, `category_id`, `responsible_user`, `split_a`, `split_b`
- **`transaction_split`** — `transaction_id`, `paid_by`, `share_a`, `share_b`, `is_personal`
- **`settlement_period`** — `couple_id`, `month`, `status`, `net_amount`, `direction`
- **`settlement_payment`** — `period_id`, `method`, `confirmed_a`, `confirmed_b`, `pdf_url`

Tudo o que existe (Família, Membros, Transações, Orçamentos, Metas) **fica intacto**.

---

## 8. Sprint Plan (3 semanas)

### Semana 1 — Foundation + bug fixes
- Migration das 6 tabelas novas
- Definições → Família → separador "Casal"
- Ativar Casal + escolher modo (default Pool Comum)
- Bug fix: código de convite "null"
- Bug fix: metas duplicadas no histórico
- Bug fix: dashboard "saldo 0" com transações existentes

### Semana 2 — Engine de divisão
- Modos 50/50 + Proporcional + Categorias + Personalizado
- Selector de divisão no form de transação
- Toggle "100% pessoal" por transação
- Recalcular splits ao mudar modo (só forward)

### Semana 3 — Acerto + MB WAY
- Cron mensal de fecho
- Card "Quem deve a quem" no dashboard (só se modo ≠ Pool)
- Ecrã de acerto detalhado + PDF
- Deeplink MB WAY + QR + IBAN + marcar pago
- Notificações push/email do acerto
- Confirmação dupla

### Critério de "done"
5 cenários validados de ponta a ponta:
1. Pool Comum (sem cálculos)
2. 50/50 puro
3. Proporcional 60/40
4. Categorias com fallback
5. Mudança de modo a meio do mês

Os <10 beta testers fazem o ciclo completo sem ajuda.

### Parking lot
- Multi-moeda (EUR-only por agora)
- Reembolsos parciais complexos (Sprint 1.5)
- Custódia interna de dinheiro (precisaria PSP)
- 3+ adultos no mesmo "casal" (não faz sentido conceptualmente)

---

## 9. Posicionamento e copy

### Não mudar
- Nome "FamFlow", logo, conceito de Família
- Landing atual mantém-se

### Adicionar (sem substituir)
- Nova secção na landing: **"Para casais: dividam despesas com regras justas"**
- Copy: *"FamFlow é para a tua família — e quando vocês os 2 quiserem, ativam o Modo Casal e dividem despesas com regras justas. Tudo junto ou cada um na sua: vocês escolhem."*
- Vídeo de 30s a mostrar Modo Casal a funcionar
- Página `/casais` dedicada com SEO ("dividir despesas casal portugal", etc.)

### Pricing (proposta)
- **Free** — Família até 2 membros, sem Modo Casal
- **Premium €4.99/mês** — Família ilimitada, IA, Modo Casal completo
- **DUO €7.99/mês** — Premium + acerto MB WAY automatizado + PDF mensal

---

## 10. Resumo visual da arquitectura

```text
FAMÍLIA (conceito existente, intocado)
│
├── Membros (existente)
├── Dashboard partilhado (existente)
├── Orçamentos partilhados (existente)
├── Metas conjuntas (existente)
│
└── ⭐ MODO CASAL (novo, opcional)
    ├── 2 membros associados como casal
    ├── Modo de divisão (5 opções, default Pool Comum)
    ├── Regras por categoria (opcional)
    ├── Splits automáticos nas transações
    └── Acerto mensal MB WAY
```

**Família = guarda-chuva. Casal = camada extra opcional dentro.**

---

## Próximo passo

Avançar com **Semana 1** (foundation + bug fixes urgentes). Entrega valor imediato (resolve bugs) e prepara terreno sem disruptir nada do que já existe.
