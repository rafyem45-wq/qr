// src/pages/ScanHistoryPage.tsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, CheckCircle2, XCircle, History, Filter } from 'lucide-react';
import api from '@/lib/api';
import { ScanLog, PaginatedResponse } from '@/types';
import { PageHeader } from '@/components/ui/PageHeader';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { format } from 'date-fns';

export const ScanHistoryPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [resultFilter, setResultFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<'desc' | 'asc'>('desc');

  const { data, isLoading } = useQuery<PaginatedResponse<ScanLog>>({
    queryKey: ['scan-logs', search, resultFilter, dateFrom, dateTo, page, sort],
    queryFn: () =>
      api
        .get('/scan-logs', {
          params: {
            search: search || undefined,
            result: resultFilter || undefined,
            date_from: dateFrom || undefined,
            date_to: dateTo || undefined,
            page,
            limit: 20,
            sort,
          },
        })
        .then((r) => r.data),
    placeholderData: (prev) => prev,
  });

  const logs = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 20);

  const clearFilters = () => {
    setSearch('');
    setResultFilter('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const hasFilters = search || resultFilter || dateFrom || dateTo;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Scan History"
        description={`${total.toLocaleString()} scan records`}
      />

      {/* Filters */}
      <div className="card p-4 mb-6 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              className="input pl-9"
              placeholder="Search by user name..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Filter className="w-4 h-4 text-zinc-500" />
            <select
              className="input w-32"
              value={resultFilter}
              onChange={(e) => { setResultFilter(e.target.value); setPage(1); }}
            >
              <option value="">All Results</option>
              <option value="valid">Valid</option>
              <option value="invalid">Invalid</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1 flex gap-3">
            <div className="flex-1">
              <label className="block text-xs text-zinc-500 mb-1">From</label>
              <input
                type="date"
                className="input text-xs"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-zinc-500 mb-1">To</label>
              <input
                type="date"
                className="input text-xs"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <select
              className="input text-xs w-32"
              value={sort}
              onChange={(e) => setSort(e.target.value as 'desc' | 'asc')}
            >
              <option value="desc">Newest first</option>
              <option value="asc">Oldest first</option>
            </select>
            {hasFilters && (
              <button onClick={clearFilters} className="btn-secondary text-xs py-2 px-3 whitespace-nowrap">
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : logs.length === 0 ? (
          <EmptyState
            icon={History}
            title="No scan records"
            description={hasFilters ? 'Try adjusting your filters.' : 'Scan records will appear here after QR codes are verified.'}
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left text-xs font-medium text-zinc-500 px-6 py-3">User</th>
                    <th className="text-left text-xs font-medium text-zinc-500 px-4 py-3">QR Data</th>
                    <th className="text-left text-xs font-medium text-zinc-500 px-4 py-3">Result</th>
                    <th className="text-left text-xs font-medium text-zinc-500 px-4 py-3">Date & Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-zinc-800/20 transition-colors">
                      <td className="px-6 py-3.5">
                        <div className="font-medium text-zinc-200">{log.user_name}</div>
                        {log.user_id && (
                          <div className="text-[11px] text-zinc-600 font-mono">{log.user_id}</div>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-mono text-xs text-zinc-500 max-w-[200px] truncate">
                          {log.qr_data}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={log.result === 'valid' ? 'badge-valid' : 'badge-invalid'}>
                          {log.result === 'valid' ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <XCircle className="w-3 h-3" />
                          )}
                          {log.result}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-zinc-500">
                        {format(new Date(log.scanned_at), 'MMM d, yyyy HH:mm:ss')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile list */}
            <div className="md:hidden divide-y divide-zinc-800">
              {logs.map((log) => (
                <div key={log.id} className="px-4 py-4 flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-zinc-200 truncate">{log.user_name}</div>
                    <div className="font-mono text-xs text-zinc-600 truncate mt-0.5">{log.qr_data}</div>
                    <div className="text-xs text-zinc-500 mt-1">
                      {format(new Date(log.scanned_at), 'MMM d, yyyy HH:mm')}
                    </div>
                  </div>
                  <span className={`flex-shrink-0 ${log.result === 'valid' ? 'badge-valid' : 'badge-invalid'}`}>
                    {log.result}
                  </span>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-3.5 border-t border-zinc-800">
                <span className="text-xs text-zinc-500">
                  {total.toLocaleString()} records · Page {page} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
