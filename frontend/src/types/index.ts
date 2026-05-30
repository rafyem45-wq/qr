// src/types/index.ts

export interface Admin {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export interface User {
  id: string;
  full_name: string;
  email: string | null;
  qr_code: string;
  qr_data: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface ScanLog {
  id: string;
  user_id: string | null;
  user_name: string;
  scanned_at: string;
  result: 'valid' | 'invalid';
  qr_data: string;
  scanner_info: string | null;
}

export interface Stats {
  total_scans: number;
  valid_scans: number;
  invalid_scans: number;
  total_users: number;
  active_users: number;
  recent_scans_7d: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface VerifyResult {
  valid: boolean;
  message: string;
  user?: {
    id: string;
    full_name: string;
    email: string | null;
    status: string;
    created_at: string;
  };
  scan_id?: string;
}
