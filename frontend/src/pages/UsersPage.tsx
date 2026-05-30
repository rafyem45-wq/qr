// src/pages/UsersPage.tsx
import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Download,
  RefreshCw,
  Eye,
  Users,
  Filter,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { User, PaginatedResponse } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { format } from 'date-fns';

// ─── User Form ──────────────────────────────────────────────────────────────
interface UserFormProps {
  user?: User | null;
  onClose: () => void;
  onSuccess: () => void;
}

const UserForm: React.FC<UserFormProps> = ({ user, onClose, onSuccess }) => {
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [status, setStatus] = useState<'active' | 'inactive'>(user?.status || 'active');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;
    setSubmitting(true);

    try {
      if (user) {
        await api.put(`/users/${user.id}`, {
          full_name: fullName,
          email: email || null,
          status,
        });
        toast.success('User updated successfully');
      } else {
        await api.post('/users', {
          full_name: fullName,
          email: email || null,
          status,
        });
        toast.success('User created successfully');
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Operation failed';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1.5">Full Name *</label>
        <input
          className="input"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="John Doe"
          required
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1.5">
          Email <span className="text-zinc-600">(optional)</span>
        </label>
        <input
          className="input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="john@example.com"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1.5">Status</label>
        <select
          className="input"
          value={status}
          onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-secondary flex-1">
          Cancel
        </button>
        <button type="submit" disabled={submitting} className="btn-primary flex-1">
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-zinc-950/30 border-t-zinc-950 animate-spin" />
              Saving...
            </span>
          ) : user ? (
            'Update User'
          ) : (
            'Create User'
          )}
        </button>
      </div>
    </form>
  );
};

// ─── QR Modal ───────────────────────────────────────────────────────────────
const QrModal: React.FC<{ user: User; onClose: () => void; onRegenerate: () => void }> = ({
  user,
  onClose,
  onRegenerate,
}) => {
  const downloadQr = () => {
    const link = document.createElement('a');
    link.href = user.qr_code;
    link.download = `qr-${user.full_name.replace(/\s+/g, '-').toLowerCase()}.png`;
    link.click();
  };

  return (
    <div className="text-center">
      <div className="mb-3">
        <div className="text-base font-semibold text-zinc-100">{user.full_name}</div>
        {user.email && <div className="text-sm text-zinc-500">{user.email}</div>}
      </div>
      <div className="inline-block p-3 bg-white rounded-2xl mb-4">
        <img src={user.qr_code} alt="QR Code" className="w-48 h-48" />
      </div>
      <div className="font-mono text-xs text-zinc-500 mb-5 bg-zinc-800/60 rounded-lg px-3 py-2 break-all">
        {user.qr_data}
      </div>
      <div className="flex gap-3">
        <button onClick={onRegenerate} className="btn-secondary flex-1 flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Regenerate
        </button>
        <button onClick={downloadQr} className="btn-primary flex-1 flex items-center justify-center gap-2">
          <Download className="w-4 h-4" />
          Download
        </button>
      </div>
      <button onClick={onClose} className="mt-3 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
        Close
      </button>
    </div>
  );
};

// ─── Main Page ───────────────────────────────────────────────────────────────
export const UsersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [viewQrUser, setViewQrUser] = useState<User | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<User | null>(null);

  const { data, isLoading, refetch } = useQuery<PaginatedResponse<User>>({
    queryKey: ['users', search, statusFilter, page],
    queryFn: () =>
      api
        .get('/users', { params: { search: search || undefined, status: statusFilter || undefined, page, limit: 15 } })
        .then((r) => r.data),
    placeholderData: (prev) => prev,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => {
      toast.success('User deleted');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDeleteConfirm(null);
    },
    onError: () => toast.error('Failed to delete user'),
  });

  const regenQrMutation = useMutation({
    mutationFn: (id: string) => api.post(`/users/${id}/regenerate-qr`),
    onSuccess: (res) => {
      toast.success('QR code regenerated');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setViewQrUser(res.data.data);
    },
    onError: () => toast.error('Failed to regenerate QR code'),
  });

  const handleSearch = useCallback((val: string) => {
    setSearch(val);
    setPage(1);
  }, []);

  const users = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 15);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Users"
        description={`${total.toLocaleString()} total users`}
        action={
          <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add User
          </button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            className="input pl-9"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-zinc-500 flex-shrink-0" />
          <select
            className="input w-36"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : users.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No users found"
            description={search ? 'Try adjusting your search.' : 'Add your first user to get started.'}
            action={
              !search ? (
                <button onClick={() => setShowCreate(true)} className="btn-primary">
                  Add User
                </button>
              ) : undefined
            }
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left text-xs font-medium text-zinc-500 px-6 py-3">Name</th>
                    <th className="text-left text-xs font-medium text-zinc-500 px-4 py-3">Email</th>
                    <th className="text-left text-xs font-medium text-zinc-500 px-4 py-3">Status</th>
                    <th className="text-left text-xs font-medium text-zinc-500 px-4 py-3">Created</th>
                    <th className="text-right text-xs font-medium text-zinc-500 px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-zinc-800/20 transition-colors">
                      <td className="px-6 py-3.5 font-medium text-zinc-200">{user.full_name}</td>
                      <td className="px-4 py-3.5 text-zinc-500">{user.email || '—'}</td>
                      <td className="px-4 py-3.5">
                        <span className={user.status === 'active' ? 'badge-active' : 'badge-inactive'}>
                          <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'active' ? 'bg-emerald-400' : 'bg-zinc-500'}`} />
                          {user.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-zinc-500 text-xs">
                        {format(new Date(user.created_at), 'MMM d, yyyy')}
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setViewQrUser(user)}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-brand-400 hover:bg-brand-500/10 transition-colors"
                            title="View QR"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditUser(user)}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(user)}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile list */}
            <div className="md:hidden divide-y divide-zinc-800">
              {users.map((user) => (
                <div key={user.id} className="px-4 py-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-medium text-zinc-200">{user.full_name}</div>
                      <div className="text-xs text-zinc-500">{user.email || 'No email'}</div>
                    </div>
                    <span className={user.status === 'active' ? 'badge-active' : 'badge-inactive'}>
                      {user.status}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setViewQrUser(user)} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5" /> QR
                    </button>
                    <button onClick={() => setEditUser(user)} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5">
                      <Edit2 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button onClick={() => setDeleteConfirm(user)} className="btn-danger text-xs py-1.5 px-3 flex items-center gap-1.5">
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-3.5 border-t border-zinc-800">
                <span className="text-xs text-zinc-500">
                  Page {page} of {totalPages}
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

      {/* Create modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Add New User">
        <UserForm onClose={() => setShowCreate(false)} onSuccess={() => refetch()} />
      </Modal>

      {/* Edit modal */}
      <Modal isOpen={!!editUser} onClose={() => setEditUser(null)} title="Edit User">
        <UserForm
          user={editUser}
          onClose={() => setEditUser(null)}
          onSuccess={() => refetch()}
        />
      </Modal>

      {/* QR modal */}
      {viewQrUser && (
        <Modal isOpen={true} onClose={() => setViewQrUser(null)} title="QR Code" size="sm">
          <QrModal
            user={viewQrUser}
            onClose={() => setViewQrUser(null)}
            onRegenerate={() => regenQrMutation.mutate(viewQrUser.id)}
          />
        </Modal>
      )}

      {/* Delete confirm */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete User" size="sm">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-6 h-6 text-red-400" />
          </div>
          <p className="text-sm text-zinc-300 mb-1">
            Delete <span className="font-semibold">{deleteConfirm?.full_name}</span>?
          </p>
          <p className="text-xs text-zinc-500 mb-6">This action cannot be undone.</p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1">
              Cancel
            </button>
            <button
              onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm.id)}
              disabled={deleteMutation.isPending}
              className="btn-danger flex-1"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
