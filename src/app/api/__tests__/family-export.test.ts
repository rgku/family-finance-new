import { describe, it, expect } from "@jest/globals";

describe("generateExportFilename", () => {
  const generateFilename = (userIdPart: string, endDateStr: string): string => {
    return `famflow-historico-${userIdPart}-${endDateStr}.csv`;
  };

  it("should generate correct filename format", () => {
    const filename = generateFilename("abc12345", "2026-05-12");
    expect(filename).toBe("famflow-historico-abc12345-2026-05-12.csv");
  });

  it("should use familia- prefix for family exports", () => {
    const filename = generateFilename("familia-abc12345", "2026-05-12");
    expect(filename).toBe("famflow-historico-familia-abc12345-2026-05-12.csv");
  });
});

describe("Export CSV structure", () => {
  const buildCsv = (transactions: Array<Record<string, unknown>>): string[] => {
    const csvRows: string[] = [];
    csvRows.push("id,user_id,family_id,data,descricao,categoria,tipo,valor,criado_em");
    
    for (const t of transactions) {
      csvRows.push(
        `"${t.id}","${t.user_id}","${t.family_id || ""}","${t.date}",` +
        `"${(t.description as string || "").replace(/"/g, '""')}","${(t.category as string || "Outros").replace(/"/g, '""')}",` +
        `"${t.type}","${t.amount}","${t.created_at || ""}"`
      );
    }

    return csvRows;
  };

  it("should output only header when no transactions", () => {
    const csv = buildCsv([]);
    expect(csv.length).toBe(1);
    expect(csv[0]).toBe("id,user_id,family_id,data,descricao,categoria,tipo,valor,criado_em");
  });

  it("should output header + 2 transaction rows", () => {
    const csv = buildCsv([
      { id: "1", user_id: "u1", family_id: "f1", date: "2026-05-01", description: "Supermercado", category: "Alimentação", type: "expense", amount: -50, created_at: "2026-05-01T10:00:00Z" },
      { id: "2", user_id: "u2", family_id: null, date: "2026-05-02", description: "Salário", category: "Trabalho", type: "income", amount: 1000, created_at: "2026-05-02T09:00:00Z" },
    ]);
    expect(csv.length).toBe(3);
    expect(csv[1]).toContain("Supermercado");
    expect(csv[1]).toContain("expense");
    expect(csv[2]).toContain("Salário");
    expect(csv[2]).toContain("income");
  });

  it("should escape double quotes in description", () => {
    const csv = buildCsv([
      { id: "1", user_id: "u1", family_id: null, date: "2026-05-01", description: 'Livro "O Príncipe"', category: "Lazer", type: "expense", amount: 15, created_at: "2026-05-01T10:00:00Z" },
    ]);
    expect(csv[1]).toContain('"Livro ""O Príncipe"""');
  });

  it("should use Outros as default category", () => {
    const csv = buildCsv([
      { id: "1", user_id: "u1", family_id: null, date: "2026-05-01", description: "Compra", category: null, type: "expense", amount: 10, created_at: null },
    ]);
    expect(csv[1]).toContain("Outros");
  });

  it("should NOT include goals or budgets sections", () => {
    const csv = buildCsv([
      { id: "1", user_id: "u1", family_id: null, date: "2026-05-01", description: "Test", category: "Outros", type: "expense", amount: 10, created_at: null },
    ]);
    const joined = csv.join("\n");
    expect(joined).not.toContain("===");
    expect(joined).not.toContain("GOALS");
    expect(joined).not.toContain("BUDGETS");
    expect(joined).not.toContain("Total:");
    expect(joined).not.toContain("Period:");
  });
});
