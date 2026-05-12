"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useData } from "@/hooks/DataProvider";
import { DesktopSidebar, MobileHeader, MobileNav } from "@/components/Sidebar";
import { useDeviceType } from "@/hooks/useDeviceType";
import { Icon } from "@/components/Icon";
import { parseCSV, bankPresets } from "@/lib/csvImport";

export default function ImportPage() {
  const { user, signOut, supabase } = useAuth();
  const isMobile = useDeviceType();
  const { addTransaction } = useData();
  
  const [selectedBank, setSelectedBank] = useState("generic");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [imported, setImported] = useState(false);
  const [userFamilyId, setUserFamilyId] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !supabase) return;
    supabase
      .from("profiles")
      .select("family_id")
      .eq("id", user.id)
      .single()
      .then(({ data }) => setUserFamilyId(data?.family_id || null));
  }, [user]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setLoading(true);
    setImported(false);

    try {
      const mapping = bankPresets[selectedBank] || {
        dateColumn: "date",
        descriptionColumn: "description",
        amountColumn: "amount",
      };

      const parsed = await parseCSV(uploadedFile, mapping);
      setPreview(parsed.slice(0, 10));
    } catch (error) {
      console.error("Error parsing CSV:", error);
      alert("Erro ao ler ficheiro. Verifica o formato.");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!file || preview.length === 0) return;

    setLoading(true);

    try {
      const mapping = bankPresets[selectedBank];
      const transactions = await parseCSV(file, mapping);

      for (const trans of transactions) {
        await addTransaction({
          description: trans.description,
          amount: trans.amount,
          type: trans.type,
          category: trans.category || "Outros",
          date: trans.date,
        });
      }

      setImported(true);
      setFile(null);
      setPreview([]);
      alert(`${transactions.length} transações importadas com sucesso!`);
    } catch (error) {
      console.error("Error importing:", error);
      alert("Erro ao importar transações. Tenta novamente.");
    } finally {
      setLoading(false);
    }
  };

  const pageContent = (
    <div className="p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-on-surface">Importar Transações</h1>
        <p className="text-on-surface-variant">Importa extratos bancários em CSV</p>
      </header>

      <div className="max-w-2xl space-y-6">
        {/* Bank Selector */}
        <div className="bg-surface-container rounded-lg p-6">
          <label className="block text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-4">
            Seleciona o banco
          </label>
          <select
            value={selectedBank}
            onChange={(e) => {
              setSelectedBank(e.target.value);
              setFile(null);
              setPreview([]);
            }}
            className="w-full bg-surface-container-low border-none rounded-2xl px-5 py-4 text-on-surface focus:ring-2 focus:ring-primary/20 transition-all"
          >
            <option value="famflow">FamFlow History (export CSV)</option>
            <option value="generic">CSV Genérico (qualquer banco)</option>
            <option value="revolut">Revolut</option>
            <option value="n26">N26</option>
            <option value="millennium">Millennium bcp</option>
            <option value="cgd">CGD</option>
            <option value="santander">Santander</option>
          </select>
          <p className="text-xs text-on-surface-variant mt-2">
            {selectedBank === "generic"
              ? "O sistema tentará detetar automaticamente as colunas"
              : `Formato otimizado para ${selectedBank === "millennium" ? "Millennium bcp" : selectedBank}`}
          </p>
          {selectedBank === "famflow" && (
            <div className="mt-3 space-y-2">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <Icon name="info" size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-500">
                    <strong>Nota:</strong> Todas as transações importadas ficarão associadas apenas à tua conta. 
                    Outros membros da família <strong>não</strong> terão acesso a estas transações.
                  </p>
                </div>
              </div>
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <Icon name="warning" size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-500">
                    <strong>Atenção:</strong> O CSV exportado inclui transações de <strong>todos</strong> os membros da família. Antes de importar, <strong>remove do ficheiro as linhas onde o user_id é o teu</strong> (coluna B no Excel) para evitares criar transações duplicadas.
                  </p>
                </div>
              </div>
            </div>
          )}
          {selectedBank !== "famflow" && userFamilyId && (
            <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-start gap-2">
                <Icon name="group" size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-green-500">
                  <strong>Família ativa:</strong> As transações importadas serão partilhadas com os membros da tua família.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* File Upload */}
        <div className="bg-surface-container rounded-lg p-6">
          <label className="block text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-4">
            Ficheiro CSV
          </label>
          <div className="border-2 border-dashed border-surface-container-highest rounded-2xl p-8 text-center">
            <Icon name="upload_file" size={48} className="text-on-surface-variant mx-auto mb-4 opacity-50" />
            <p className="text-on-surface mb-2">Arrasta o ficheiro ou clica para selecionar</p>
            <p className="text-xs text-on-surface-variant">Formatos suportados: .csv</p>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="mt-4"
              disabled={loading}
            />
          </div>
        </div>

        {/* Preview */}
        {preview.length > 0 && (
          <div className="bg-surface-container rounded-lg p-6">
            <h3 className="font-bold text-lg text-on-surface mb-4">
              Preview ({preview.length} primeiras transações)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-container-highest">
                    <th className="text-left p-3 text-xs font-bold text-on-surface-variant uppercase">Data</th>
                    <th className="text-left p-3 text-xs font-bold text-on-surface-variant uppercase">Descrição</th>
                    <th className="text-right p-3 text-xs font-bold text-on-surface-variant uppercase">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((t, i) => (
                    <tr key={i} className="border-b border-surface-container">
                      <td className="p-3 text-on-surface-variant">{t.date}</td>
                      <td className="p-3 text-on-surface">{t.description}</td>
                      <td className={`p-3 text-right font-bold ${t.type === "income" ? "text-primary" : "text-tertiary"}`}>
                        {t.type === "income" ? "+" : "-"}{Number(t.amount || 0).toFixed(2)}€
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {preview.length === 10 && (
              <p className="text-xs text-on-surface-variant mt-2">
                Mostrando apenas as primeiras 10. Todas serão importadas.
              </p>
            )}
          </div>
        )}

        {/* Import Button */}
        {imported ? (
          <div className="bg-primary/20 rounded-lg p-6 text-center">
            <Icon name="check_circle" size={48} className="text-primary mx-auto mb-4" />
            <h3 className="font-bold text-lg text-on-surface mb-2">Importação concluída!</h3>
            <p className="text-on-surface-variant">
              As transações foram adicionadas à tua conta.
            </p>
          </div>
        ) : (
          <button
            onClick={handleImport}
            disabled={!file || preview.length === 0 || loading}
            className="w-full py-4 bg-primary text-on-primary font-bold rounded-full hover:brightness-110 shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
          >
            {loading ? "A importar..." : `Importar ${preview.length > 0 ? `(${preview.length}+ transações)` : ""}`}
          </button>
        )}

        {/* Help */}
        <div className="bg-surface-container-low rounded-lg p-6">
          <h4 className="font-bold text-on-surface mb-2">Precisas de ajuda?</h4>
          <p className="text-sm text-on-surface-variant mb-4">
            O formato CSV deve incluir pelo menos:
          </p>
          <ul className="space-y-2 text-sm text-on-surface-variant">
            <li className="flex items-center gap-2">
              <Icon name="check" size={16} className="text-primary" />
              Data da transação
            </li>
            <li className="flex items-center gap-2">
              <Icon name="check" size={16} className="text-primary" />
              Descrição ou nome do comércio
            </li>
            <li className="flex items-center gap-2">
              <Icon name="check" size={16} className="text-primary" />
              Valor (positivo para receitas, negativo para despesas)
            </li>
          </ul>
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div className="min-h-screen bg-surface">
        <MobileHeader onSignOut={signOut} />
        <main className="pt-20 px-4 pb-24 max-w-4xl mx-auto">
          {pageContent}
        </main>
        <MobileNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <DesktopSidebar onSignOut={signOut} />
      <main className="ml-64">{pageContent}</main>
    </div>
  );
}
