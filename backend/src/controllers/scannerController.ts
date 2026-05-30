// src/controllers/scannerController.ts
import { Request, Response } from 'express';
import { supabase } from '../utils/supabase';
import { parseQrData } from '../utils/qrcode';
import { ApiResponse, ScanLog } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const verifyQr = async (req: Request, res: Response): Promise<void> => {
  try {
    const { qr_data, scanner_info } = req.body;

    if (!qr_data || typeof qr_data !== 'string') {
      res.status(400).json({ success: false, error: 'QR data is required' } as ApiResponse);
      return;
    }

    const parsed = parseQrData(qr_data.trim());

    if (!parsed) {
      // Log invalid scan
      await supabase.from('scan_logs').insert({
        id: uuidv4(),
        user_id: null,
        user_name: 'Unknown',
        result: 'invalid',
        qr_data: qr_data.trim(),
        scanner_info: scanner_info || null,
      });

      res.status(200).json({
        success: true,
        data: {
          valid: false,
          message: 'Invalid QR code format',
        },
      } as ApiResponse);
      return;
    }

    // Look up user
    const { data: user, error } = await supabase
      .from('users')
      .select('id, full_name, email, status, qr_data, created_at')
      .eq('id', parsed.userId)
      .eq('qr_data', qr_data.trim())
      .single();

    if (error || !user) {
      // Log invalid scan (user not found or qr_data mismatch)
      await supabase.from('scan_logs').insert({
        id: uuidv4(),
        user_id: null,
        user_name: 'Unknown',
        result: 'invalid',
        qr_data: qr_data.trim(),
        scanner_info: scanner_info || null,
      });

      res.json({
        success: true,
        data: {
          valid: false,
          message: 'QR code not found in system',
        },
      } as ApiResponse);
      return;
    }

    if (user.status === 'inactive') {
      // Log as invalid — inactive user
      await supabase.from('scan_logs').insert({
        id: uuidv4(),
        user_id: user.id,
        user_name: user.full_name,
        result: 'invalid',
        qr_data: qr_data.trim(),
        scanner_info: scanner_info || null,
      });

      res.json({
        success: true,
        data: {
          valid: false,
          message: 'User account is inactive',
          user: {
            id: user.id,
            full_name: user.full_name,
            status: user.status,
          },
        },
      } as ApiResponse);
      return;
    }

    // Valid scan — log it
    const { data: scanLog } = await supabase
      .from('scan_logs')
      .insert({
        id: uuidv4(),
        user_id: user.id,
        user_name: user.full_name,
        result: 'valid',
        qr_data: qr_data.trim(),
        scanner_info: scanner_info || null,
      })
      .select()
      .single();

    res.json({
      success: true,
      data: {
        valid: true,
        message: 'QR code verified successfully',
        user: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          status: user.status,
          created_at: user.created_at,
        },
        scan_id: scanLog?.id,
      },
    } as ApiResponse);
  } catch (error) {
    console.error('Verify QR error:', error);
    res.status(500).json({ success: false, error: 'Verification failed' } as ApiResponse);
  }
};
