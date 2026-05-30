// src/controllers/scanLogsController.ts
import { Response } from 'express';
import { supabase } from '../utils/supabase';
import { ApiResponse } from '../types';
import { AuthRequest } from '../middleware/auth';

export const getScanLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      search,
      user_id,
      result,
      date_from,
      date_to,
      page = '1',
      limit = '20',
      sort = 'desc',
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = Math.min(parseInt(limit as string, 10), 100);
    const offset = (pageNum - 1) * limitNum;

    let query = supabase
      .from('scan_logs')
      .select('*', { count: 'exact' });

    if (search) {
      query = query.ilike('user_name', `%${search}%`);
    }
    if (user_id) {
      query = query.eq('user_id', user_id);
    }
    if (result) {
      query = query.eq('result', result);
    }
    if (date_from) {
      query = query.gte('scanned_at', date_from);
    }
    if (date_to) {
      // Include the entire end day
      const endDate = new Date(date_to as string);
      endDate.setHours(23, 59, 59, 999);
      query = query.lte('scanned_at', endDate.toISOString());
    }

    query = query
      .order('scanned_at', { ascending: sort === 'asc' })
      .range(offset, offset + limitNum - 1);

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
    console.error('Get scan logs error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch scan logs' } as ApiResponse);
  }
};

export const getScanStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Total scans
    const { count: totalScans } = await supabase
      .from('scan_logs')
      .select('*', { count: 'exact', head: true });

    // Valid scans
    const { count: validScans } = await supabase
      .from('scan_logs')
      .select('*', { count: 'exact', head: true })
      .eq('result', 'valid');

    // Invalid scans
    const { count: invalidScans } = await supabase
      .from('scan_logs')
      .select('*', { count: 'exact', head: true })
      .eq('result', 'invalid');

    // Total users
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    // Active users
    const { count: activeUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    // Scans in last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const { count: recentScans } = await supabase
      .from('scan_logs')
      .select('*', { count: 'exact', head: true })
      .gte('scanned_at', sevenDaysAgo.toISOString());

    res.json({
      success: true,
      data: {
        total_scans: totalScans || 0,
        valid_scans: validScans || 0,
        invalid_scans: invalidScans || 0,
        total_users: totalUsers || 0,
        active_users: activeUsers || 0,
        recent_scans_7d: recentScans || 0,
      },
    } as ApiResponse);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch stats' } as ApiResponse);
  }
};
