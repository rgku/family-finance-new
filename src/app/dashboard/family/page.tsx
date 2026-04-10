"use client";

import { useState } from "react";
import { useFamilyMembers } from "@/hooks/useFamilyMembers";
import { useDeviceType } from "@/hooks/useDeviceType";
import Link from "next/link";

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
  
  const [isInviting, setIsInviting] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: "", email: "", role: "member" as "member" | "view_only" });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

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

  const handleRemove = async (memberId: string, memberName: string) => {
    if (confirm(`Remover ${memberName} da família?`)) {
      try {
        await removeMember(memberId);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
        setMessage(errorMessage);
      }
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
        <h1 className="text-3xl font-bold text-on-surface">Família</h1>
        <p className="text-on-surface-variant">Gerir membros da família</p>
      </header>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${message.includes('adicionado') ? 'bg-primary/20 text-primary' : 'bg-error/20 text-error'}`}>
          {message}
        </div>
      )}

      {/* Family Info Card */}
      {family && (
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
        </div>
      )}

      {/* Members List */}
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
                      onClick={() => handleRemove(member.id, member.name)}
                      className="p-2 text-error hover:bg-error/20 rounded-lg"
                      aria-label="Remover membro"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}