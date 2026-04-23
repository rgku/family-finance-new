"use client";

import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";

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
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("pt-PT", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-PT");
  };

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
        </View>

        {safeBudget.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Orçamentos</Text>
            {safeBudget.map((b, index) => {
              const percentUsed = b.limit > 0 ? (b.spent / b.limit) * 100 : 0;
              return (
                <View key={index} style={styles.row}>
                  <Text style={styles.label}>{b.category}</Text>
                  <Text style={styles.value}>
                    {formatCurrency(b.spent)} / {formatCurrency(b.limit)}
                    {"  "}
                    ({percentUsed.toFixed(0)}%)
                  </Text>
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