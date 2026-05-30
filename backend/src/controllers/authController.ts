// src/controllers/authController.ts
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { supabase } from '../utils/supabase';
import { signToken } from '../utils/jwt';
import { ApiResponse, Admin } from '../types';
import { AuthRequest } from '../middleware/auth';

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Fetch admin by email
    const { data: admin, error } = await supabase
      .from('admins')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (error || !admin) {
      res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      } as ApiResponse);
      return;
    }

    // Verify password
    const isValid = await bcrypt.compare(password, admin.password_hash);
    if (!isValid) {
      res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      } as ApiResponse);
      return;
    }

    const token = signToken({ adminId: admin.id, email: admin.email });

    res.json({
      success: true,
      data: {
        token,
        admin: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
        },
      },
      message: 'Login successful',
    } as ApiResponse);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' } as ApiResponse);
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { data: admin, error } = await supabase
      .from('admins')
      .select('id, email, name, created_at')
      .eq('id', req.adminId)
      .single();

    if (error || !admin) {
      res.status(404).json({ success: false, error: 'Admin not found' } as ApiResponse);
      return;
    }

    res.json({ success: true, data: admin } as ApiResponse);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' } as ApiResponse);
  }
};

export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    const { data: admin } = await supabase
      .from('admins')
      .select('password_hash')
      .eq('id', req.adminId)
      .single();

    if (!admin) {
      res.status(404).json({ success: false, error: 'Admin not found' } as ApiResponse);
      return;
    }

    const isValid = await bcrypt.compare(currentPassword, admin.password_hash);
    if (!isValid) {
      res.status(400).json({ success: false, error: 'Current password is incorrect' } as ApiResponse);
      return;
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await supabase.from('admins').update({ password_hash: newHash }).eq('id', req.adminId);

    res.json({ success: true, message: 'Password updated successfully' } as ApiResponse);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' } as ApiResponse);
  }
};
