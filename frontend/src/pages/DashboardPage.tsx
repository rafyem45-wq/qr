// src/pages/DashboardPage.tsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, QrCode, CheckCircle, XCircle, Activity, TrendingUp } from 'lucide-react';
import api from '@/lib/api';
import { Stats, ScanLog } from '@/types';
import { StatCard } from '@/components/ui/StatCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { Spinner } from '@/components/ui/Spinner';
import { format } from 'date-fns';

export const DashboardPage: React.FC = () => {
  const { data: statsData, isLoading: statsLoading } = useQuery<{ data: Stats }>({
    queryKey: ['stats'],
    queryFn: () => api.get('/scan-logs/stats').then((r) => r.data),
    refetchInterval: 30000,
  });

  const { data: logsData, isLoading: logsLoading } = useQuery<{ data: ScanLog[] }>({
    queryKey: ['recent-scans'],
    queryFn: () => api.get('/scan-logs?limit=8&sort=desc').then((r) => r.data),
    refetchInterval: 15000,
  });

  const stats = statsData?.data;
  const recentScans = logsData?.data || [];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Dashboard"
        description="System overview and recent activity"
      />

      {/* Stats Grid */}
      {statsLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <StatCard
            label="Total Users"
            value={stats?.total_users || 0}
            icon={Users}
            color="brand"
          />
          <StatCard
            label="Active Users"
            value={stats?.active_users || 0}
            icon={Activity}
            color="emerald"
          />
          <StatCard
            label="Total Scans"
            value={stats?.total_scans || 0}
            icon={QrCode}
            color="zinc"
          />
          <StatCard
            label="Valid Scans"
            value={stats?.valid_scans || 0}
            icon={CheckCircle}
            color="emerald"
          />
          <StatCard
            label="Invalid Scans"
            value={stats?.invalid_scans || 0}
            icon={XCircle}
            color="red"
          />
          <StatCard
            label="Scans (7 days)"
            value={stats?.recent_scans_7d || 0}
            icon={TrendingUp}
            color="amber"
          />
        </div>
      )}

      {/* Recent Scans */}
      <div className="card">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-100">Recent Scans</h2>
          <span className="text-xs text-zinc-500">Live</span>
        </div>
        {logsLoading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : recentScans.length === 0 ? (
          <div className="py-12 text-center text-sm text-zinc-500">No scans yet</div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {recentScans.map((scan) => (
              <div
                key={scan.id}
                className="flex items-center justify-between px-6 py-3.5 hover:bg-zinc-800/30 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      scan.result === 'valid' ? 'bg-emerald-400' : 'bg-red-400'
                    }`}
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-zinc-200 truncate">
                      {scan.user_name}
                    </div>
                    <div className="text-xs text-zinc-500 font-mono truncate">{scan.qr_data}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                  <span className={scan.result === 'valid' ? 'badge-valid' : 'badge-invalid'}>
                    {scan.result}
                  </span>
                  <span className="text-xs text-zinc-500 hidden sm:block">
                    {format(new Date(scan.scanned_at), 'MMM d, HH:mm')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
