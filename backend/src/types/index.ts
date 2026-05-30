// src/types/index.ts

export interface Admin {
  id: string;
  email: string;
  password_hash: string;
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

export interface JwtPayload {
  adminId: string;
  email: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
}
