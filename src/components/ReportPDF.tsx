"use client";

import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: "#ffffff",
    fontFamily: "Helvetica",
  },
  // Header Institucional
  header: {
    marginBottom: 30,
    borderBottomWidth: 3,
    borderBottomColor: "#4edea3",
    paddingBottom: 15,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  logo: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#4edea3",
    letterSpacing: 2,
  },
  headerTitle: {
    fontSize: 18,
    color: "#64748b",
    textAlign: "right",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 11,
    color: "#64748b",
  },
  generatedAt: {
    fontSize: 9,
    color: "#94a3b8",
    marginTop: 4,
  },
  // Secções
  section: {
    marginTop: 25,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
    paddingBottom: 6,
    borderBottomWidth: 2,
    borderBottomColor: "#4edea3",
  },
  // Resumo em grid
  summaryGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  summaryCard: {
    width: "31%",
    padding: 15,
    borderRadius: 8,
    backgroundColor: "#f8fafc",
  },
  summaryLabel: {
    fontSize: 9,
    color: "#64748b",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0f172a",
  },
  summaryPositive: {
    color: "#10b981",
  },
  summaryNegative: {
    color: "#ef4444",
  },
  // Comparação Mensal
  comparisonGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  comparisonCard: {
    width: "48%",
    padding: 12,
    borderRadius: 6,
    backgroundColor: "#f1f5f9",
  },
  comparisonLabel: {
    fontSize: 9,
    color: "#64748b",
    marginBottom: 8,
  },
  comparisonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  comparisonValue: {
    fontSize: 11,
    fontWeight: "bold",
  },
  comparisonPercent: {
    fontSize: 10,
    fontWeight: "bold",
  },
  // Estatísticas
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statItem: {
    width: "48%",
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 9,
    color: "#64748b",
  },
  statValue: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#0f172a",
  },
  // Gráfico de Barras
  barChartContainer: {
    marginBottom: 15,
  },
  barRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  barLabel: {
    width: 80,
    fontSize: 9,
    color: "#64748b",
  },
  barContainer: {
    flex: 1,
    height: 20,
    backgroundColor: "#f1f5f9",
    borderRadius: 4,
    overflow: "hidden",
    flexDirection: "row",
  },
  barIncome: {
    backgroundColor: "#10b981",
    height: "100%",
  },
  barExpense: {
    backgroundColor: "#ef4444",
    height: "100%",
  },
  barValue: {
    width: 70,
    fontSize: 9,
    fontWeight: "bold",
    textAlign: "right",
    marginLeft: 8,
  },
  // Gráfico de Pizza (representação simplificada)
  pieChartContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  pieLegend: {
    flex: 1,
  },
  pieLegendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  pieColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
    marginRight: 8,
  },
  pieLabel: {
    fontSize: 9,
    color: "#0f172a",
  },
  pieValue: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#0f172a",
    marginLeft: "auto",
  },
  // Orçamentos com barras
  budgetItem: {
    marginBottom: 10,
  },
  budgetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  budgetCategory: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#0f172a",
  },
  budgetValues: {
    fontSize: 9,
    color: "#64748b",
  },
  budgetBarContainer: {
    height: 8,
    backgroundColor: "#f1f5f9",
    borderRadius: 4,
    overflow: "hidden",
  },
  budgetBar: {
    height: "100%",
    borderRadius: 4,
  },
  budgetBarGreen: {
    backgroundColor: "#10b981",
  },
  budgetBarYellow: {
    backgroundColor: "#f59e0b",
  },
  budgetBarRed: {
    backgroundColor: "#ef4444",
  },
  // Tabela
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  tableHeaderText: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#64748b",
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  tableCell: {
    fontSize: 9,
    color: "#0f172a",
  },
  col1: { width: "40%" },
  col2: { width: "20%" },
  col3: { width: "15%" },
  col4: { width: "25%", textAlign: "right" },
  // Footer
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 8,
    color: "#94a3b8",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 10,
  },
  // Cores para categorias
  cat1: { backgroundColor: "#4edea3" },
  cat2: { backgroundColor: "#3b82f6" },
  cat3: { backgroundColor: "#f59e0b" },
  cat4: { backgroundColor: "#ef4444" },
  cat5: { backgroundColor: "#8b5cf6" },
  cat6: { backgroundColor: "#ec4899" },
});

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: string;
  category: string;
  date: string;
}

interface Goal {
  name: string;
  target: number;
  current: number;
  deadline?: string | null;
}

interface ReportData {
  month: string;
  year: number;
  income: number;
  expenses: number;
  balance: number;
  savings?: number;
  budget: { category: string; limit: number; spent: number }[];
  transactions: Transaction[];
  goals?: Goal[];
  previousMonth?: {
    income: number;
    expenses: number;
    balance: number;
  };
  stats?: {
    dailyAverage: number;
    highestExpense: { description: string; amount: number };
    totalTransactions: number;
    categoriesCount: number;
    daysInPeriod: number;
  };
}

const MAX_TRANSACTIONS_IN_PDF = 25;

const CATEGORY_COLORS = [
  styles.cat1,
  styles.cat2,
  styles.cat3,
  styles.cat4,
  styles.cat5,
  styles.cat6,
];

export function PDFReport({ data }: { data: ReportData }) {
  if (!data || !data.month || !data.year) {
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <Text>Sem dados disponíveis para gerar o relatório</Text>
        </Page>
      </Document>
    );
  }
  
  const safeTransactions = data.transactions || [];
  const safeBudget = data.budget || [];
  const safeGoals = data.goals || [];
  const previousMonth = data.previousMonth;
  const stats = data.stats;
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("pt-PT", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-PT");
  };

  const formatFullDate = () => {
    const now = new Date();
    return now.toLocaleDateString("pt-PT", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatMonthYear = () => {
    const monthNames = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    return `${monthNames[data.year - 1]} ${data.year}`;
  };

  const getBudgetBarStyle = (percentage: number) => {
    if (percentage >= 100) return styles.budgetBarRed;
    if (percentage >= 80) return styles.budgetBarYellow;
    return styles.budgetBarGreen;
  };

  const incomePercent = previousMonth && previousMonth.income > 0
    ? ((data.income - previousMonth.income) / previousMonth.income) * 100
    : 0;

  const expensePercent = previousMonth && previousMonth.expenses > 0
    ? ((data.expenses - previousMonth.expenses) / previousMonth.expenses) * 100
    : 0;

  const maxBarValue = Math.max(data.income, data.expenses, 1);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header Institucional A4 */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.logo}>FamFlow</Text>
            <Text style={styles.headerTitle}>Gestão Financeira Familiar</Text>
          </View>
          <Text style={styles.title}>Relatório Financeiro Mensal</Text>
          <Text style={styles.subtitle}>Período: {formatMonthYear()}</Text>
          <Text style={styles.generatedAt}>Gerado em: {formatFullDate()}</Text>
        </View>

        {/* Resumo do Mês */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumo do Mês</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Receitas</Text>
              <Text style={{ ...styles.summaryValue, ...styles.summaryPositive }}>
                {formatCurrency(data.income)}
              </Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Despesas</Text>
              <Text style={{ ...styles.summaryValue, ...styles.summaryNegative }}>
                {formatCurrency(data.expenses)}
              </Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Saldo</Text>
              <Text style={{
                ...styles.summaryValue,
                ...(data.balance >= 0 ? styles.summaryPositive : styles.summaryNegative),
              }}>
                {formatCurrency(data.balance)}
              </Text>
            </View>
          </View>
        </View>

        {/* Comparação Mensal */}
        {previousMonth && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Comparação vs Mês Anterior</Text>
            <View style={styles.comparisonGrid}>
              <View style={styles.comparisonCard}>
                <Text style={styles.comparisonLabel}>Receitas</Text>
                <View style={styles.comparisonRow}>
                  <Text style={styles.comparisonValue}>{formatCurrency(data.income)}</Text>
                  <Text style={{
                    ...styles.comparisonPercent,
                    color: incomePercent >= 0 ? "#10b981" : "#ef4444",
                  }}>
                    {incomePercent >= 0 ? "↑" : "↓"} {Math.abs(incomePercent).toFixed(1)}%
                  </Text>
                </View>
              </View>
              <View style={styles.comparisonCard}>
                <Text style={styles.comparisonLabel}>Despesas</Text>
                <View style={styles.comparisonRow}>
                  <Text style={styles.comparisonValue}>{formatCurrency(data.expenses)}</Text>
                  <Text style={{
                    ...styles.comparisonPercent,
                    color: expensePercent <= 0 ? "#10b981" : "#ef4444",
                  }}>
                    {expensePercent >= 0 ? "↑" : "↓"} {Math.abs(expensePercent).toFixed(1)}%
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Gráfico de Barras - Receitas vs Despesas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Receitas vs Despesas</Text>
          <View style={styles.barChartContainer}>
            <View style={styles.barRow}>
              <Text style={styles.barLabel}>Receitas</Text>
              <View style={styles.barContainer}>
                <View style={{
                  ...styles.barIncome,
                  width: `${(data.income / maxBarValue) * 100}%`,
                }} />
              </View>
              <Text style={styles.barValue}>{formatCurrency(data.income)}</Text>
            </View>
            <View style={styles.barRow}>
              <Text style={styles.barLabel}>Despesas</Text>
              <View style={styles.barContainer}>
                <View style={{
                  ...styles.barExpense,
                  width: `${(data.expenses / maxBarValue) * 100}%`,
                }} />
              </View>
              <Text style={styles.barValue}>{formatCurrency(data.expenses)}</Text>
            </View>
          </View>
        </View>

        {/* Estatísticas Avançadas */}
        {stats && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Estatísticas</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Média Diária</Text>
                <Text style={styles.statValue}>{formatCurrency(stats.dailyAverage)}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Total Transações</Text>
                <Text style={styles.statValue}>{stats.totalTransactions}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Maior Gasto</Text>
                <Text style={styles.statValue}>
                  {stats.highestExpense.description.length > 20
                    ? stats.highestExpense.description.substring(0, 20) + "..."
                    : stats.highestExpense.description}
                </Text>
                <Text style={{ ...styles.statValue, ...styles.summaryNegative }}>
                  {formatCurrency(stats.highestExpense.amount)}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Categorias</Text>
                <Text style={styles.statValue}>{stats.categoriesCount} usadas</Text>
              </View>
            </View>
          </View>
        )}

        {/* Gastos por Categoria (Pizza simplificado) */}
        {safeBudget.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Gastos por Categoria</Text>
            <View style={styles.pieChartContainer}>
              <View style={styles.pieLegend}>
                {safeBudget.slice(0, 6).map((b, index) => {
                  const totalBudget = safeBudget.reduce((sum, item) => sum + item.spent, 0);
                  const percentage = totalBudget > 0 ? (b.spent / totalBudget) * 100 : 0;
                  const colorStyle = CATEGORY_COLORS[index % CATEGORY_COLORS.length];
                  return (
                    <View key={index} style={styles.pieLegendItem}>
                      <View style={colorStyle} />
                      <Text style={styles.pieLabel}>{b.category}</Text>
                      <Text style={styles.pieValue}>
                        {formatCurrency(b.spent)} ({percentage.toFixed(0)}%)
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {/* Orçamentos com Barras de Progresso */}
        {safeBudget.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Orçamentos</Text>
            {safeBudget.map((b, index) => {
              const percentUsed = b.limit > 0 ? (b.spent / b.limit) * 100 : 0;
              const barStyle = getBudgetBarStyle(percentUsed);
              return (
                <View key={index} style={styles.budgetItem}>
                  <View style={styles.budgetHeader}>
                    <Text style={styles.budgetCategory}>{b.category}</Text>
                    <Text style={styles.budgetValues}>
                      {formatCurrency(b.spent)} / {formatCurrency(b.limit)} ({percentUsed.toFixed(0)}%)
                    </Text>
                  </View>
                  <View style={styles.budgetBarContainer}>
                    <View style={[styles.budgetBar, barStyle, { width: `${Math.min(percentUsed, 100)}%` }]} />
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Goals Detalhado */}
        {safeGoals.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Objetivos de Poupança</Text>
            {safeGoals.map((goal, index) => {
              const progress = goal.target > 0 ? (goal.current / goal.target) * 100 : 0;
              const remaining = goal.target - goal.current;
              return (
                <View key={index} style={styles.budgetItem}>
                  <View style={styles.budgetHeader}>
                    <Text style={styles.budgetCategory}>{goal.name}</Text>
                    <Text style={styles.budgetValues}>
                      {formatCurrency(goal.current)} / {formatCurrency(goal.target)} ({progress.toFixed(0)}%)
                    </Text>
                  </View>
                  <View style={styles.budgetBarContainer}>
                    <View style={[styles.budgetBar, styles.budgetBarGreen, { width: `${Math.min(progress, 100)}%` }]} />
                  </View>
                  <Text style={{ ...styles.statLabel, marginTop: 4 }}>
                    Faltam: {formatCurrency(remaining)}
                    {goal.deadline && ` • Até: ${formatDate(goal.deadline)}`}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Transações */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transações</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={{ ...styles.tableHeaderText, ...styles.col1 }}>Descrição</Text>
              <Text style={{ ...styles.tableHeaderText, ...styles.col2 }}>Categoria</Text>
              <Text style={{ ...styles.tableHeaderText, ...styles.col3 }}>Data</Text>
              <Text style={{ ...styles.tableHeaderText, ...styles.col4 }}>Valor</Text>
            </View>
            {safeTransactions.slice(0, MAX_TRANSACTIONS_IN_PDF).map((t, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={{ ...styles.tableCell, ...styles.col1 }}>
                  {t.description.length > 25 ? t.description.substring(0, 25) + "..." : t.description}
                </Text>
                <Text style={{ ...styles.tableCell, ...styles.col2 }}>{t.category}</Text>
                <Text style={{ ...styles.tableCell, ...styles.col3 }}>{formatDate(t.date)}</Text>
                <Text
                  style={{
                    ...styles.tableCell,
                    ...styles.col4,
                    ...(t.type === "income" ? styles.summaryPositive : styles.summaryNegative),
                  }}
                >
                  {t.type === "income" ? "+" : "-"}
                  {formatCurrency(t.amount)}
                </Text>
              </View>
            ))}
            {safeTransactions.length > MAX_TRANSACTIONS_IN_PDF && (
              <Text style={{ ...styles.tableCell, padding: 8, textAlign: "center" }}>
                ... e mais {safeTransactions.length - MAX_TRANSACTIONS_IN_PDF} transações
              </Text>
            )}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Gerado por FamFlow • famflow.app</Text>
          <Text>Este documento contém dados financeiros confidenciais</Text>
        </View>
      </Page>
    </Document>
  );
}
