"use client";

import { useState } from "react";
import { useFamilyMembers } from "@/hooks/useFamilyMembers";
import { useDeviceType } from "@/hooks/useDeviceType";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";

export default function FamilyPage() {
  const { 
    members, 
    family, 
    memberLimit, 
    currentCount, 
    userRole, 
    loading, 
    inviteMember, 
    updateMember, 
    removeMember 
  } = useFamilyMembers();
  const isMobile = useDeviceType();
  const router = useRouter();
  
  const [isInviting, setIsInviting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: "", email: "", role: "member" as "member" | "view_only" });
  const [createForm, setCreateForm] = useState({ name: "" });
  const [joinCode, setJoinCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  
  // Export modal states
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showFallbackModal, setShowFallbackModal] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportFullHistory, setExportFullHistory] = useState(false);
  const [pendingAction, setPendingAction] = useState<"leave" | "delete" | null>(null);
  const [showRemoveModal, setShowRemoveModal] = useState<{ memberId: string; memberName: string; memberEmail: string } | null>(null);

  const handleCreateFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");
    
    try {
      const res = await fetch("/api/family", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", name: createForm.name || "Minha Família" }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Erro ao criar família");
      }
      
      setMessage("Família criada com sucesso!");
      setIsCreating(false);
      router.refresh();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
      setMessage(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    
    setSubmitting(true);
    setMessage("");
    
    try {
      const res = await fetch("/api/family", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "join", name: joinCode }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Erro ao entrar na família");
      }
      
      setMessage("Entrou na família com sucesso!");
      setIsJoining(false);
      router.refresh();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
      setMessage(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteForm.name || !inviteForm.email) return;
    
    setSubmitting(true);
    setMessage("");
    
    try {
      const result = await inviteMember(inviteForm.name, inviteForm.email, inviteForm.role);
      setMessage(`Membro adicionado! Código: ${result.inviteCode}`);
      setInviteForm({ name: "", email: "", role: "member" });
      setIsInviting(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
      setMessage(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (memberId: string, memberName: string, memberEmail: string) => {
    setShowRemoveModal({ memberId, memberName, memberEmail });
  };

  const handleConfirmRemove = async () => {
    if (!showRemoveModal) return;
    
    try {
      await removeMember(showRemoveModal.memberId);
      setMessage(`${showRemoveModal.memberName} foi removido da família.`);
      setShowRemoveModal(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
      setMessage(errorMessage);
    }
  };

  const handleLeaveFamily = async () => {
    if (!family) return;
    
    if (userRole === "owner") {
      setMessage("⚠️ Proprietário não pode sair. Transfere a propriedade ou elimina a família.");
      return;
    }
    
    setShowLeaveModal(true);
  };

  const handleDeleteFamily = async () => {
    if (!family) return;
    
    if (currentCount > 1) {
      setMessage("⚠️ Não podes eliminar a família com outros membros. Remove todos os membros primeiro.");
      return;
    }
    
    setShowDeleteModal(true);
  };

  const handleExportAndLeave = async () => {
    if (!family) return;
    
    setExporting(true);
    
    try {
      const months = exportFullHistory ? 60 : 12;
      
      const res = await fetch("/api/family/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ months, includeGoals: true, includeBudgets: true }),
      });
      
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Erro ao exportar dados");
      }
      
      const blob = new Blob([data.csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = data.filename;
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const leaveRes = await fetch("/api/family", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "leave" }),
      });
      
      const leaveData = await leaveRes.json();
      
      if (!leaveRes.ok) {
        throw new Error(leaveData.error || "Erro ao sair da família");
      }
      
      setMessage("Saíste da família com sucesso!");
      setShowLeaveModal(false);
      router.refresh();
    } catch (error) {
      console.error("Export/leave error:", error);
      setExporting(false);
      setShowFallbackModal(true);
      setPendingAction("leave");
    }
  };

  const handleExportAndDelete = async () => {
    if (!family) return;
    
    setExporting(true);
    
    try {
      const months = exportFullHistory ? 60 : 12;
      
      const res = await fetch("/api/family/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ months, includeGoals: true, includeBudgets: true }),
      });
      
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Erro ao exportar dados");
      }
      
      const blob = new Blob([data.csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = data.filename;
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const deleteRes = await fetch("/api/family", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete" }),
      });
      
      const deleteData = await deleteRes.json();
      
      if (!deleteRes.ok) {
        throw new Error(deleteData.error || "Erro ao eliminar família");
      }
      
      setMessage("Família eliminada com sucesso!");
      setShowDeleteModal(false);
      router.refresh();
    } catch (error) {
      console.error("Export/delete error:", error);
      setExporting(false);
      setShowFallbackModal(true);
      setPendingAction("delete");
    }
  };

  const handleFallbackLeave = async () => {
    try {
      const res = await fetch("/api/family", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "leave" }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Erro ao sair da família");
      }
      
      setMessage("Saíste da família com sucesso!");
      setShowFallbackModal(false);
      router.refresh();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      setMessage(errorMessage);
      setShowFallbackModal(false);
    }
  };

  const handleFallbackDelete = async () => {
    try {
      const res = await fetch("/api/family", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete" }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Erro ao eliminar família");
      }
      
      setMessage("Família eliminada com sucesso!");
      setShowFallbackModal(false);
      router.refresh();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      setMessage(errorMessage);
      setShowFallbackModal(false);
    }
  };

  const roleLabels = {
    owner: "Proprietário",
    member: "Membro",
    view_only: "Apenas visualização",
  };

  const statusColors = {
    pending: "bg-yellow-500/20 text-yellow-400",
    active: "bg-green-500/20 text-green-400",
    inactive: "bg-slate-500/20 text-slate-400",
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <Link href="/dashboard" className="text-primary hover:underline text-sm">
          ← Voltar ao Dashboard
        </Link>
      </div>

      <header className="mb-8">
        <h1 className="text-3xl font-bold text-on-surface">
          {family ? family.name : "Família"}
        </h1>
        <p className="text-on-surface-variant">
          {family 
            ? `${currentCount} membro${currentCount !== 1 ? 's' : ''} • Código: ${family.invite_code}`
            : "Gerir membros da família"}
        </p>
      </header>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${message.includes('sucesso') ? 'bg-primary/20 text-primary' : 'bg-error/20 text-error'}`}>
          {message}
        </div>
      )}

      {/* No Family - Create or Join */}
      {!family && (
        <div className="bg-surface-container rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-bold text-on-surface mb-4">Ainda não pertences a uma família</h2>
          <p className="text-on-surface-variant mb-6">Cria uma nova família ou entra numa família existente com código de convite.</p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => setIsCreating(!isCreating)}
              className="flex-1 py-3 bg-primary text-on-primary rounded-full font-medium"
            >
              Criar Família
            </button>
            <button
              onClick={() => setIsJoining(!isJoining)}
              className="flex-1 py-3 bg-surface-container-high text-on-surface rounded-full font-medium"
            >
              Entrar com Código
            </button>
          </div>

          {isCreating && (
            <form onSubmit={handleCreateFamily} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase mb-2">
                  Nome da Família
                </label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ name: e.target.value })}
                  className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-on-surface"
                  placeholder="Minha Família"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-primary text-on-primary rounded-full font-medium disabled:opacity-50"
              >
                {submitting ? "A criar..." : "Criar Família"}
              </button>
            </form>
          )}

          {isJoining && (
            <form onSubmit={handleJoinFamily} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase mb-2">
                  Código de Convite
                </label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-on-surface font-mono"
                  placeholder="Coloca o código da familia aqui"
                  maxLength={16}
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-primary text-on-primary rounded-full font-medium disabled:opacity-50"
              >
                {submitting ? "A entrar..." : "Entrar na Família"}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Family Info Card */}
      {family ? (
        <div className="bg-surface-container rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-on-surface">{family.name}</h2>
            <span className="text-sm text-on-surface-variant">
              {currentCount} / {memberLimit} membros
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-on-surface-variant">Código convite:</span>
            <code className="bg-surface-container-high px-3 py-1 rounded font-mono text-primary">
              {family.invite_code}
            </code>
          </div>
          
          {userRole === "owner" && currentCount === 1 ? (
            <div className="mt-4 pt-4 border-t border-on-surface/10">
              <button
                onClick={() => handleDeleteFamily()}
                className="text-sm text-error hover:underline"
              >
                Eliminar Família
              </button>
            </div>
          ) : userRole !== "owner" && (
            <div className="mt-4 pt-4 border-t border-on-surface/10">
              <button
                onClick={handleLeaveFamily}
                className="text-sm text-error hover:underline"
              >
                Sair da Família
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-yellow-500/20 text-yellow-400 p-4 rounded-lg mb-6">
          Sem família associada. family_id não está definido no teu perfil.
        </div>
      )}

      {/* Members List */}
      {family && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-on-surface">Membros</h2>
            {currentCount < memberLimit && (
              <button
                onClick={() => setIsInviting(!isInviting)}
                className="px-4 py-2 bg-primary text-on-primary rounded-full text-sm font-medium"
              >
                + Convidar Membro
              </button>
            )}
          </div>

          {isInviting && (
            <form onSubmit={handleInvite} className="bg-surface-container rounded-lg p-6 mb-4">
              <h3 className="text-lg font-medium mb-4">Convidar Novo Membro</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase mb-2">
                    Nome
                  </label>
                  <input
                    type="text"
                    value={inviteForm.name}
                    onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                    className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-on-surface"
                    placeholder="Nome do membro"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-on-surface"
                    placeholder="email@exemplo.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase mb-2">
                    Permissão
                  </label>
                  <select
                    value={inviteForm.role}
                    onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value as "member" | "view_only" })}
                    className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-on-surface"
                  >
                    <option value="member">Membro (pode editar)</option>
                    <option value="view_only">Apenas visualização</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsInviting(false)}
                  className="flex-1 py-3 bg-surface-container text-on-surface rounded-full font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 bg-primary text-on-primary rounded-full font-medium disabled:opacity-50"
                >
                  {submitting ? "A enviar..." : "Enviar Convite"}
                </button>
              </div>
            </form>
          )}

          <div className="space-y-3">
            {members.length === 0 ? (
              <div className="text-center py-12 text-on-surface-variant">
                <p>Nenhum membro além de ti.</p>
                <button
                  onClick={() => setIsInviting(true)}
                  className="text-primary hover:underline mt-2"
                >
                  Convidar primeiro membro
                </button>
              </div>
            ) : (
              members.map((member) => (
                <div
                  key={member.id}
                  className="bg-surface-container rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center">
                      <span className="text-lg font-medium text-primary">
                        {member.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-on-surface">{member.name}</p>
                      <p className="text-sm text-on-surface-variant">{member.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs ${statusColors[member.status]}`}>
                      {member.status === "pending" ? "Pendente" : "Ativo"}
                    </span>
                    <span className="text-xs text-on-surface-variant">
                      {roleLabels[member.role as keyof typeof roleLabels]}
                    </span>

                    {userRole === "owner" && member.role !== "owner" && (
                      <button
                        onClick={() => handleRemove(member.id, member.name, member.email)}
                        className="p-2 text-error hover:bg-error/20 rounded-lg"
                        aria-label="Remover membro"
                      >
                        <Icon name="delete" size={16} className="text-base" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modal: Sair da Família */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container rounded-2xl p-6 max-w-md w-full space-y-4">
            <div className="flex items-start gap-3">
              <Icon name="warning" size={24} className="text-warning flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-bold text-on-surface">Antes de sair da família</h3>
                <p className="text-sm text-on-surface-variant mt-1">
                  Informação importante sobre os teus dados
                </p>
              </div>
            </div>

            <div className="bg-surface-container-low rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-2">
                <Icon name="check_circle" size={18} className="text-success flex-shrink-0 mt-0.5" />
                <p className="text-sm text-on-surface">
                  <strong>O teu histórico PESSOAL será mantido</strong>
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Icon name="error" size={18} className="text-error flex-shrink-0 mt-0.5" />
                <p className="text-sm text-on-surface">
                  <strong>Perdes acesso ao histórico da FAMÍLIA</strong> (inclui transações que criaste aqui)
                </p>
              </div>
            </div>

            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Icon name="download" size={18} className="text-primary" />
                <p className="text-sm text-on-surface">
                  <strong>Vamos exportar tudo em CSV para:</strong>
                </p>
              </div>
              <p className="text-xs text-on-surface-variant font-mono bg-surface-container px-3 py-2 rounded">
                famflow-historico-{new Date().toISOString().split('T')[0]}.csv
              </p>

              <label className="flex items-center gap-3 p-3 bg-surface-container-low rounded-lg cursor-pointer hover:bg-surface-container-high transition-colors">
                <input
                  type="checkbox"
                  checked={exportFullHistory}
                  onChange={(e) => setExportFullHistory(e.target.checked)}
                  className="w-4 h-4 rounded border-surface-container-high"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-on-surface">Exportar histórico completo (5 anos)</p>
                  <p className="text-xs text-on-surface-variant">Predefinição: últimos 12 meses</p>
                </div>
              </label>

              <p className="text-xs text-on-surface-variant">
                Podes importar noutra família depois.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLeaveModal(false)}
                disabled={exporting}
                className="flex-1 py-3 bg-surface-container text-on-surface rounded-full font-medium hover:bg-surface-container-high transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExportAndLeave}
                disabled={exporting}
                className="flex-1 py-3 bg-primary text-on-primary rounded-full font-medium hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {exporting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                    A exportar...
                  </>
                ) : (
                  'Sair e Exportar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Eliminar Família */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container rounded-2xl p-6 max-w-md w-full space-y-4">
            <div className="flex items-start gap-3">
              <Icon name="warning" size={24} className="text-error flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-bold text-on-surface">Antes de eliminar a família</h3>
                <p className="text-sm text-on-surface-variant mt-1">
                  Esta ação é permanente e irreversível
                </p>
              </div>
            </div>

            <div className="bg-error/10 border border-error/20 rounded-lg p-4 space-y-2">
              <p className="text-sm text-on-surface">
                <strong>A família "{family?.name}" será eliminada permanentemente.</strong>
              </p>
              <p className="text-xs text-on-surface-variant">
                Todos os membros perderão acesso aos dados partilhados.
              </p>
            </div>

            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Icon name="download" size={18} className="text-primary" />
                <p className="text-sm text-on-surface">
                  <strong>Vamos exportar tudo em CSV para:</strong>
                </p>
              </div>
              <p className="text-xs text-on-surface-variant font-mono bg-surface-container px-3 py-2 rounded">
                famflow-historico-{new Date().toISOString().split('T')[0]}.csv
              </p>

              <label className="flex items-center gap-3 p-3 bg-surface-container-low rounded-lg cursor-pointer hover:bg-surface-container-high transition-colors">
                <input
                  type="checkbox"
                  checked={exportFullHistory}
                  onChange={(e) => setExportFullHistory(e.target.checked)}
                  className="w-4 h-4 rounded border-surface-container-high"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-on-surface">Exportar histórico completo (5 anos)</p>
                  <p className="text-xs text-on-surface-variant">Predefinição: últimos 12 meses</p>
                </div>
              </label>

              <p className="text-xs text-on-surface-variant">
                Podes importar noutra família depois.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={exporting}
                className="flex-1 py-3 bg-surface-container text-on-surface rounded-full font-medium hover:bg-surface-container-high transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExportAndDelete}
                disabled={exporting}
                className="flex-1 py-3 bg-error text-on-error rounded-full font-medium hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {exporting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-on-error border-t-transparent rounded-full animate-spin" />
                    A exportar...
                  </>
                ) : (
                  'Eliminar e Exportar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Fallback (exportação falhou) */}
      {showFallbackModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container rounded-2xl p-6 max-w-md w-full space-y-4">
            <div className="flex items-start gap-3">
              <Icon name="error" size={24} className="text-error flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-bold text-on-surface">Exportação indisponível</h3>
                <p className="text-sm text-on-surface-variant mt-1">
                  Não foi possível gerar o CSV agora
                </p>
              </div>
            </div>

            <div className="bg-surface-container-low rounded-lg p-4 space-y-3">
              <p className="text-sm text-on-surface">
                Ocorreu um erro ao tentar exportar os teus dados.
              </p>
              <ul className="text-sm text-on-surface-variant space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  Podes tentar exportar depois em <strong>Definições &gt; Exportar Dados</strong>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  Ou podes sair/eliminar agora (vais perder acesso ao histórico da família)
                </li>
              </ul>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowFallbackModal(false)}
                className="flex-1 py-3 bg-surface-container text-on-surface rounded-full font-medium hover:bg-surface-container-high transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleFallbackLeave}
                className="flex-1 py-3 bg-primary text-on-primary rounded-full font-medium hover:brightness-110 transition-all"
              >
                Sair
              </button>
              <button
                type="button"
                onClick={handleFallbackDelete}
                className="flex-1 py-3 bg-error text-on-error rounded-full font-medium hover:brightness-110 transition-all"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Remover Membro */}
      {showRemoveModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container rounded-2xl p-6 max-w-md w-full space-y-4">
            <div className="flex items-start gap-3">
              <Icon name="warning" size={24} className="text-warning flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-bold text-on-surface">Remover membro</h3>
                <p className="text-sm text-on-surface-variant mt-1">
                  {showRemoveModal.memberName} ({showRemoveModal.memberEmail})
                </p>
              </div>
            </div>

            <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 space-y-2">
              <p className="text-sm text-on-surface">
                <strong>Atenção:</strong> Este membro perderá acesso aos dados partilhados da família.
              </p>
              <ul className="text-xs text-on-surface-variant space-y-1">
                <li>• O histórico pessoal do membro será mantido</li>
                <li>• Transações criadas por outros membros deixarão de ser visíveis</li>
                <li>• O membro pode exportar os seus dados em Definições</li>
              </ul>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowRemoveModal(null)}
                className="flex-1 py-3 bg-surface-container text-on-surface rounded-full font-medium hover:bg-surface-container-high transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmRemove}
                className="flex-1 py-3 bg-error text-on-error rounded-full font-medium hover:brightness-110 transition-all"
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}