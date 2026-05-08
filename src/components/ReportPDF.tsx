"use client";

import { Document, Page, Text, View, StyleSheet, Font, Svg, Circle, Path, Rect, Line, Polyline } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: "#ffffff",
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#4edea3",
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: "#64748b",
  },
  section: {
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  label: {
    fontSize: 10,
    color: "#64748b",
  },
  value: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#0f172a",
  },
  total: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4edea3",
    textAlign: "right",
    marginTop: 8,
  },
  positive: {
    color: "#4edea3",
  },
  negative: {
    color: "#ef4444",
  },
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
  col1: { width: "45%" },
  col2: { width: "20%" },
  col3: { width: "15%" },
  col4: { width: "20%", textAlign: "right" },
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
  chartContainer: {
    marginTop: 15,
    marginBottom: 15,
  },
  chartTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#64748b",
    marginBottom: 8,
  },
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statBox: {
    width: "48%",
    padding: 8,
    backgroundColor: "#f8fafc",
    borderRadius: 4,
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 8,
    color: "#64748b",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#0f172a",
  },
  comparisonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  comparisonLabel: {
    fontSize: 9,
    color: "#64748b",
  },
  comparisonValue: {
    fontSize: 9,
    fontWeight: "bold",
  },
  progressContainer: {
    marginTop: 4,
  },
  progressBar: {
    height: 6,
    backgroundColor: "#e2e8f0",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
});

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: string;
  category: string;
  date: string;
}

interface ReportData {
  month: string;
  year: number;
  income: number;
  expenses: number;
  balance: number;
  budget: { category: string; limit: number; spent: number }[];
  transactions: Transaction[];
  previousMonth?: { income: number; expenses: number; balance: number };
  categoryBreakdown?: { category: string; amount: number }[];
}

const CATEGORY_COLORS = [
  "#4edea3", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6",
  "#ec4899", "#14b8a6", "#6366f1", "#f97316", "#84cc16",
];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("pt-PT");
}

function PieChart({ data }: { data: { category: string; amount: number }[] }) {
  const filteredData = data.filter(d => d.amount > 0).sort((a, b) => b.amount - a.amount);
  const total = filteredData.reduce((sum, d) => sum + d.amount, 0);
  
  if (filteredData.length === 0 || total === 0) {
    return (
      <View style={{ height: 150, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ fontSize: 9, color: "#94a3b8" }}>Sem dados para exibição</Text>
      </View>
    );
  }

  const size = 150;
  const center = size / 2;
  const radius = 60;
  let currentAngle = 0;

  const slices = filteredData.map((item, index) => {
    const percentage = item.amount / total;
    const angle = percentage * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle += angle;

    const startRad = (startAngle - 90) * (Math.PI / 180);
    const endRad = (endAngle - 90) * (Math.PI / 180);

    const x1 = center + radius * Math.cos(startRad);
    const y1 = center + radius * Math.sin(startRad);
    const x2 = center + radius * Math.cos(endRad);
    const y2 = center + radius * Math.sin(endRad);

    const largeArcFlag = angle > 180 ? 1 : 0;

    const pathData = [
      `M ${center} ${center}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      `Z`,
    ].join(" ");

    return (
      <Path
        key={index}
        d={pathData}
        fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
        stroke="#ffffff"
        strokeWidth={1}
      />
    );
  });

  const legendItems = filteredData.slice(0, 6).map((item, index) => (
    <View key={index} style={{ flexDirection: "row", alignItems: "center", marginBottom: 3 }}>
      <View
        style={{
          width: 10,
          height: 10,
          backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
          marginRight: 6,
          borderRadius: 2,
        }}
      />
      <Text style={{ fontSize: 7, color: "#475569" }}>
        {item.category}: {formatCurrency(item.amount)} ({((item.amount / total) * 100).toFixed(0)}%)
      </Text>
    </View>
  ));

  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginVertical: 10 }}>
      <Svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
        {slices}
        <Circle cx={center} cy={center} r={25} fill="#ffffff" />
      </Svg>
      <View style={{ marginLeft: 10, flex: 1 }}>{legendItems}</View>
    </View>
  );
}

function BarChart({ income, expenses }: { income: number; expenses: number }) {
  const maxValue = Math.max(income, expenses);
  const chartHeight = 100;
  const barWidth = 50;
  const gap = 30;
  const chartWidth = barWidth * 2 + gap;

  const incomeHeight = maxValue > 0 ? (income / maxValue) * chartHeight : 0;
  const expensesHeight = maxValue > 0 ? (expenses / maxValue) * chartHeight : 0;

  return (
    <View style={{ marginTop: 10 }}>
      <Svg viewBox={`0 0 ${chartWidth} ${chartHeight + 30}`} width={chartWidth} height={chartHeight + 30}>
        <Line
          x1={0}
          y1={chartHeight}
          x2={chartWidth}
          y2={chartHeight}
          stroke="#e2e8f0"
          strokeWidth={1}
        />
        <Rect
          x={0}
          y={chartHeight - incomeHeight}
          width={barWidth}
          height={incomeHeight}
          fill="#4edea3"
          rx={3}
        />
        <Rect
          x={barWidth + gap}
          y={chartHeight - expensesHeight}
          width={barWidth}
          height={expensesHeight}
          fill="#ef4444"
          rx={3}
        />
      </Svg>
      <View style={{ flexDirection: "row", justifyContent: "space-around", marginTop: 5 }}>
        <Text style={{ fontSize: 8, color: "#64748b" }}>Receitas</Text>
        <Text style={{ fontSize: 8, color: "#64748b" }}>Despesas</Text>
      </View>
    </View>
  );
}

const MAX_TRANSACTIONS_IN_PDF = 20;

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
  const categoryBreakdown = data.categoryBreakdown || [];
  const previousMonth = data.previousMonth;
  
  const incomePercentChange = previousMonth && previousMonth.income > 0
    ? ((data.income - previousMonth.income) / previousMonth.income) * 100
    : 0;
  
  const expensesPercentChange = previousMonth && previousMonth.expenses > 0
    ? ((data.expenses - previousMonth.expenses) / previousMonth.expenses) * 100
    : 0;
  
  const balancePercentChange = previousMonth && previousMonth.balance !== 0
    ? ((data.balance - previousMonth.balance) / Math.abs(previousMonth.balance)) * 100
    : 0;

  const daysInMonth = new Date(data.year, data.transactions.length > 0 ? parseInt(data.transactions[0]?.date.split("-")[1] || "1") - 1 : 0, 0).getDate();
  const avgDailyExpense = data.expenses / daysInMonth;
  const maxExpense = safeTransactions
    .filter(t => t.type === "expense")
    .sort((a, b) => b.amount - a.amount)[0];
  const maxIncome = safeTransactions
    .filter(t => t.type === "income")
    .sort((a, b) => b.amount - a.amount)[0];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>FamFlow - Relatório Mensal</Text>
          <Text style={styles.subtitle}>
            {data.month} {data.year}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumo Financeiro</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Receitas</Text>
            <Text style={{ ...styles.value, ...styles.positive }}>
              {formatCurrency(data.income)}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Despesas</Text>
            <Text style={{ ...styles.value, ...styles.negative }}>
              {formatCurrency(data.expenses)}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Balanço</Text>
            <Text
              style={{
                ...styles.value,
                ...(data.balance >= 0 ? styles.positive : styles.negative),
              }}
            >
              {formatCurrency(data.balance)}
            </Text>
          </View>
          
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Receitas vs Despesas</Text>
            <BarChart income={data.income} expenses={data.expenses} />
          </View>
        </View>

        {previousMonth && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Comparação com Mês Anterior</Text>
            <View style={styles.comparisonRow}>
              <Text style={styles.comparisonLabel}>Receitas</Text>
              <Text style={{
                ...styles.comparisonValue,
                color: incomePercentChange >= 0 ? "#4edea3" : "#ef4444",
              }}>
                {incomePercentChange >= 0 ? "📈" : "📉"} {incomePercentChange >= 0 ? "+" : ""}{incomePercentChange.toFixed(1)}%
              </Text>
            </View>
            <View style={styles.comparisonRow}>
              <Text style={styles.comparisonLabel}>Despesas</Text>
              <Text style={{
                ...styles.comparisonValue,
                color: expensesPercentChange <= 0 ? "#4edea3" : "#ef4444",
              }}>
                {expensesPercentChange >= 0 ? "📈" : "📉"} {expensesPercentChange >= 0 ? "+" : ""}{expensesPercentChange.toFixed(1)}%
              </Text>
            </View>
            <View style={styles.comparisonRow}>
              <Text style={styles.comparisonLabel}>Balanço</Text>
              <Text style={{
                ...styles.comparisonValue,
                color: balancePercentChange >= 0 ? "#4edea3" : "#ef4444",
              }}>
                {balancePercentChange >= 0 ? "📈" : "📉"} {balancePercentChange >= 0 ? "+" : ""}{balancePercentChange.toFixed(1)}%
              </Text>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estatísticas</Text>
          <View style={styles.statGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Média Diária</Text>
              <Text style={styles.statValue}>{formatCurrency(avgDailyExpense)}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Total Transações</Text>
              <Text style={styles.statValue}>{safeTransactions.length}</Text>
            </View>
            {maxExpense && (
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Maior Despesa</Text>
                <Text style={{ ...styles.statValue, fontSize: 9 }}>{formatCurrency(maxExpense.amount)}</Text>
                <Text style={{ fontSize: 7, color: "#64748b" }}>{maxExpense.description}</Text>
              </View>
            )}
            {maxIncome && (
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Maior Receita</Text>
                <Text style={{ ...styles.statValue, fontSize: 9 }}>{formatCurrency(maxIncome.amount)}</Text>
                <Text style={{ fontSize: 7, color: "#64748b" }}>{maxIncome.description}</Text>
              </View>
            )}
          </View>
        </View>

        {categoryBreakdown.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Gastos por Categoria</Text>
            <PieChart data={categoryBreakdown} />
          </View>
        )}

        {safeBudget.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Orçamentos</Text>
            {safeBudget.map((b, index) => {
              const percentUsed = b.limit > 0 ? (b.spent / b.limit) * 100 : 0;
              const isOver = percentUsed > 100;
              const isWarning = percentUsed > 80 && percentUsed <= 100;
              const color = isOver ? "#ef4444" : isWarning ? "#f59e0b" : "#4edea3";
              
              return (
                <View key={index} style={{ marginBottom: 8 }}>
                  <View style={styles.row}>
                    <Text style={styles.label}>{b.category}</Text>
                    <Text style={{ ...styles.value, color }}>
                      {formatCurrency(b.spent)} / {formatCurrency(b.limit)} ({percentUsed.toFixed(0)}%)
                    </Text>
                  </View>
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${Math.min(percentUsed, 100)}%`,
                            backgroundColor: color,
                          },
                        ]}
                      />
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

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
                <Text style={{ ...styles.tableCell, ...styles.col1 }}>{t.description}</Text>
                <Text style={{ ...styles.tableCell, ...styles.col2 }}>{t.category}</Text>
                <Text style={{ ...styles.tableCell, ...styles.col3 }}>{formatDate(t.date)}</Text>
                <Text
                  style={{
                    ...styles.tableCell,
                    ...styles.col4,
                    ...(t.type === "income" ? styles.positive : styles.negative),
                  }}
                >
                  {t.type === "income" ? "+" : "-"}
                  {formatCurrency(t.amount)}
                </Text>
              </View>
            ))}
            {safeTransactions.length > 20 && (
              <Text style={{ ...styles.tableCell, padding: 8, textAlign: "center" }}>
                ... e mais {safeTransactions.length - MAX_TRANSACTIONS_IN_PDF} transações
              </Text>
            )}
          </View>
        </View>

        <View style={styles.footer}>
          <Text>Gerado por FamFlow - Family Financial Management</Text>
          <Text>{new Date().toLocaleDateString("pt-PT")}</Text>
        </View>
      </Page>
    </Document>
  );
}