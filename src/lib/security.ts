import { supabase } from './supabase/client';

export function maskEmail(email: string | null): string {
  if (!email || email === '') return '';
  
  const atIndex = email.indexOf('@');
  if (atIndex > 2) {
    return email.substring(0, 1) + '***' + email.substring(atIndex);
  }
  
  return email;
}

export function maskName(name: string | null): string {
  if (!name || name === '') return '';
  
  const parts = name.split(' ');
  return parts.map(part => {
    if (part.length <= 1) return part;
    return part[0].toUpperCase() + '***';
  }).join(' ');
}

export function maskPhone(phone: string | null): string {
  if (!phone || phone === '') return '';
  
  if (phone.length <= 5) return phone;
  
  return phone.substring(0, 3) + '****' + phone.substring(phone.length - 2);
}

export function maskAmount(amount: number, showDecimals = false): string {
  if (showDecimals) {
    return amount.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return Math.round(amount).toLocaleString('pt-PT');
}

export function maskCardNumber(cardNumber: string | null): string {
  if (!cardNumber || cardNumber === '') return '';
  
  if (cardNumber.length <= 4) return cardNumber;
  
  return '**** **** **** ' + cardNumber.slice(-4);
}

export interface AuditLogEntry {
  user_id: string;
  table_name: string;
  record_id: string;
  action: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
}

export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const { error } = await supabase
      .from('audit_log')
      .insert({
        user_id: session.user.id,
        family_id: null,
        table_name: entry.table_name,
        record_id: entry.record_id,
        action: entry.action,
        old_values: entry.old_values || null,
        new_values: entry.new_values || null,
      });

    if (error) {
      console.error('Audit log error:', error);
    }
  } catch (err) {
    console.error('Failed to log audit event:', err);
  }
}

export function sanitizeInput(input: string, maxLength = 500): string {
  if (!input) return '';
  
  return input
    .substring(0, maxLength)
    .replace(/[<>]/g, '')
    .trim();
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateAmount(amount: string | number): boolean {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return !isNaN(num) && num >= 0 && num <= 9999999999.99;
}

export interface DecryptedTransaction {
  id: string;
  description: string;
  amount: number;
}

export async function fetchDecryptedTransactions(familyId: string): Promise<DecryptedTransaction[]> {
  const { data, error } = await supabase
    .from('transactions_decrypted')
    .select('id, description, amount')
    .eq('family_id', familyId);

  if (error) {
    console.error('Failed to fetch transactions:', error);
    return [];
  }

  return data || [];
}

export interface SafeFamilyMember {
  id: string;
  family_id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

export async function fetchSafeFamilyMembers(familyId: string): Promise<SafeFamilyMember[]> {
  const { data, error } = await supabase
    .from('family_members_safe')
    .select('id, family_id, name, email, role, status')
    .eq('family_id', familyId);

  if (error) {
    console.error('Failed to fetch family members:', error);
    return [];
  }

  return data || [];
}

export interface AuditLogQuery {
  table_name?: string;
  user_id?: string;
  action?: string;
  limit?: number;
}

export interface AuditLogEntryDB {
  id: string;
  user_id: string;
  family_id: string;
  table_name: string;
  record_id: string;
  action: string;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  created_at: string;
}

export async function fetchAuditLogs(query: AuditLogQuery): Promise<AuditLogEntryDB[]> {
  let q = supabase
    .from('audit_log')
    .select('*')
    .order('created_at', { ascending: false });

  if (query.table_name) {
    q = q.eq('table_name', query.table_name);
  }
  if (query.user_id) {
    q = q.eq('user_id', query.user_id);
  }
  if (query.action) {
    q = q.eq('action', query.action);
  }
  if (query.limit) {
    q = q.limit(query.limit);
  } else {
    q = q.limit(100);
  }

  const { data, error } = await q;

  if (error) {
    console.error('Failed to fetch audit logs:', error);
    return [];
  }

  return data || [];
}