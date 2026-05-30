// src/controllers/usersController.ts
import { Response } from 'express';
import { supabase } from '../utils/supabase';
import { generateQrData, generateQrCodeImage } from '../utils/qrcode';
import { ApiResponse, User } from '../types';
import { AuthRequest } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, status, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    let query = supabase
      .from('users')
      .select('id, full_name, email, qr_code, status, created_at, updated_at', { count: 'exact' });

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }
    if (status) {
      query = query.eq('status', status);
    }

    query = query.order('created_at', { ascending: false }).range(offset, offset + limitNum - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data,
      total: count || 0,
      page: pageNum,
      limit: limitNum,
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch users' } as ApiResponse);
  }
};

export const getUserById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      res.status(404).json({ success: false, error: 'User not found' } as ApiResponse);
      return;
    }

    res.json({ success: true, data } as ApiResponse<User>);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch user' } as ApiResponse);
  }
};

export const createUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { full_name, email, status = 'active' } = req.body;

    // Check for duplicate email if provided
    if (email) {
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('email', email.toLowerCase().trim())
        .single();

      if (existing) {
        res.status(409).json({ success: false, error: 'A user with this email already exists' } as ApiResponse);
        return;
      }
    }

    const userId = uuidv4();
    const qrData = generateQrData(userId);
    const qrCodeImage = await generateQrCodeImage(qrData);

    const { data, error } = await supabase
      .from('users')
      .insert({
        id: userId,
        full_name: full_name.trim(),
        email: email ? email.toLowerCase().trim() : null,
        qr_code: qrCodeImage,
        qr_data: qrData,
        status,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data,
      message: 'User created successfully',
    } as ApiResponse<User>);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ success: false, error: 'Failed to create user' } as ApiResponse);
  }
};

export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { full_name, email, status } = req.body;

    // Ensure user exists
    const { data: existing } = await supabase.from('users').select('id').eq('id', id).single();
    if (!existing) {
      res.status(404).json({ success: false, error: 'User not found' } as ApiResponse);
      return;
    }

    // Check email uniqueness if changing email
    if (email) {
      const { data: emailConflict } = await supabase
        .from('users')
        .select('id')
        .eq('email', email.toLowerCase().trim())
        .neq('id', id)
        .single();

      if (emailConflict) {
        res.status(409).json({ success: false, error: 'Email already in use by another user' } as ApiResponse);
        return;
      }
    }

    const updates: Partial<User> = { updated_at: new Date().toISOString() };
    if (full_name) updates.full_name = full_name.trim();
    if (email !== undefined) updates.email = email ? email.toLowerCase().trim() : null;
    if (status) updates.status = status;

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data,
      message: 'User updated successfully',
    } as ApiResponse<User>);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, error: 'Failed to update user' } as ApiResponse);
  }
};

export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) throw error;

    res.json({ success: true, message: 'User deleted successfully' } as ApiResponse);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete user' } as ApiResponse);
  }
};

export const regenerateQr = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { data: user } = await supabase.from('users').select('id').eq('id', id).single();
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' } as ApiResponse);
      return;
    }

    const qrData = generateQrData(id);
    const qrCodeImage = await generateQrCodeImage(qrData);

    const { data, error } = await supabase
      .from('users')
      .update({ qr_data: qrData, qr_code: qrCodeImage, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data,
      message: 'QR code regenerated successfully',
    } as ApiResponse<User>);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to regenerate QR code' } as ApiResponse);
  }
};
