"use client";

import { useState, useEffect, useCallback } from "react";

export interface FamilyMember {
  id: string;
  family_id: string;
  user_id: string;
  name: string;
  email: string;
  role: "owner" | "member" | "view_only";
  status: "pending" | "active" | "inactive";
  created_at: string;
}

export interface FamilyInfo {
  id: string;
  name: string;
  invite_code: string;
}

export function useFamilyMembers() {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [family, setFamily] = useState<FamilyInfo | null>(null);
  const [memberLimit, setMemberLimit] = useState(1);
  const [currentCount, setCurrentCount] = useState(0);
  const [userRole, setUserRole] = useState<string>("member");
  const [loading, setLoading] = useState(true);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/family/members");
      const data = await res.json();
      
      if (res.ok) {
        setMembers(data.members || []);
        setFamily(data.family);
        setMemberLimit(data.memberLimit);
        setCurrentCount(data.currentCount);
        setUserRole(data.userRole);
      }
    } catch (err) {
      console.error("Failed to fetch members:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const inviteMember = async (name: string, email: string, role: "member" | "view_only" = "member") => {
    const res = await fetch("/api/family/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, role }),
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.error);
    }
    
    await fetchMembers();
    return data;
  };

  const updateMember = async (memberId: string, updates: { name?: string; role?: string }) => {
    const res = await fetch("/api/family/members", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        memberId, 
        ...updates, 
        action: "update" 
      }),
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.error);
    }
    
    await fetchMembers();
  };

  const removeMember = async (memberId: string) => {
    const res = await fetch("/api/family/members", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        memberId, 
        action: "remove" 
      }),
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.error);
    }
    
    await fetchMembers();
  };

  return {
    members,
    family,
    memberLimit,
    currentCount,
    userRole,
    loading,
    inviteMember,
    updateMember,
    removeMember,
    refresh: fetchMembers,
  };
}