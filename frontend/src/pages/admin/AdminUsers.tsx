import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../services/api';
import { AdminUserListItem } from '../../types';
import {
  Users,
  UserPlus,
  Search,
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  Trash2,
  Edit2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Mail,
  Send,
  Eye,
  RefreshCw,
} from 'lucide-react';

export const AdminUsers: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState<AdminUserListItem | null>(null);
  const [showEditModal, setShowEditModal] = useState<AdminUserListItem | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState<AdminUserListItem | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<AdminUserListItem | null>(null);

  // Form states
  const [createForm, setCreateForm] = useState({
    fullName: '',
    email: '',
    initialPassword: '',
    confirmPassword: '',
    role: 'USER',
    status: 'ACTIVE',
  });
  const [resetPasswordInput, setResetPasswordInput] = useState('');
  const [editForm, setEditForm] = useState({
    fullName: '',
    status: 'ACTIVE',
    role: 'USER',
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Query users
  const { data: users = [], isLoading, refetch } = useQuery({
    queryKey: ['adminUsers', statusFilter],
    queryFn: () => adminApi.listUsers({ status: statusFilter === 'ALL' ? undefined : statusFilter }),
  });

  // Filtered list
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Create User Mutation
  const createMutation = useMutation({
    mutationFn: adminApi.createUser,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] });
      setShowCreateModal(false);
      setCreateForm({
        fullName: '',
        email: '',
        initialPassword: '',
        confirmPassword: '',
        role: 'USER',
        status: 'ACTIVE',
      });
      setSuccessMsg(`Account for ${data.email} successfully created. Temporary password assigned.`);
      setTimeout(() => setSuccessMsg(null), 5000);
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.error || 'Failed to create user account.');
    },
  });

  // Toggle Status Mutation
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'ACTIVE' | 'INACTIVE' }) =>
      adminApi.toggleUserStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] });
    },
  });

  // Reset Password Mutation
  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, newPassword }: { id: string; newPassword: string }) =>
      adminApi.resetUserPassword(id, newPassword),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      setShowResetModal(null);
      setResetPasswordInput('');
      setSuccessMsg(res.message);
      setTimeout(() => setSuccessMsg(null), 5000);
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.error || 'Failed to reset password.');
    },
  });

  // Edit User Mutation
  const editMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => adminApi.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      setShowEditModal(null);
      setSuccessMsg('User updated successfully.');
      setTimeout(() => setSuccessMsg(null), 4000);
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.error || 'Failed to update user.');
    },
  });

  // Delete User Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] });
      setShowDeleteModal(null);
      setSuccessMsg('User successfully deleted from system.');
      setTimeout(() => setSuccessMsg(null), 4000);
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.error || 'Failed to delete user.');
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (createForm.initialPassword !== createForm.confirmPassword) {
      setFormError('Initial password and confirmation password do not match.');
      return;
    }

    if (createForm.initialPassword.length < 8) {
      setFormError('Password must be at least 8 characters long.');
      return;
    }

    createMutation.mutate({
      fullName: createForm.fullName,
      email: createForm.email,
      initialPassword: createForm.initialPassword,
      role: createForm.role,
      status: createForm.status,
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Users className="h-6 w-6 text-rose-500" />
            User Management Module
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Create employee accounts, manage permissions, enforce security credentials, and control workspace access.
          </p>
        </div>

        <button
          onClick={() => {
            setFormError(null);
            setShowCreateModal(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-2 transition-colors shadow-lg shadow-rose-600/20"
        >
          <UserPlus className="h-4 w-4" />
          <span>Create Employee Account</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search employees by name or email..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500 pointer-events-none" />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400 font-medium">Status:</span>
          {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === st
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
          <button
            onClick={() => refetch()}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
            title="Refresh Users"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading user records...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No employee accounts matching the selected criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-900/90 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Password State</th>
                  <th className="py-3 px-4">Gmail Status</th>
                  <th className="py-3 px-4">Campaigns / Sent</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-200">{user.fullName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{user.email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          user.role === 'ADMIN'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          user.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            user.status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-slate-500'
                          }`}
                        ></span>
                        {user.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {user.mustChangePassword ? (
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          Temporary (Change Required)
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-400">
                          Secured
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {user.gmailConnection?.connected ? (
                        <div className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          <span className="truncate max-w-[140px]">
                            {user.gmailConnection.gmailAddress}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-500">Not Connected</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-slate-300 font-mono">
                        {user._count?.campaigns || 0} campaigns / {user._count?.sentEmails || 0} sent
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setShowDetailsModal(user)}
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200"
                          title="View Details"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setEditForm({
                              fullName: user.fullName,
                              status: user.status,
                              role: user.role,
                            });
                            setShowEditModal(user);
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-indigo-400"
                          title="Edit User"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setResetPasswordInput('');
                            setFormError(null);
                            setShowResetModal(user);
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-amber-400"
                          title="Reset Password"
                        >
                          <KeyRound className="h-3.5 w-3.5" />
                        </button>
                        {user.role !== 'ADMIN' && (
                          <button
                            onClick={() =>
                              toggleStatusMutation.mutate({
                                id: user.id,
                                status: user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
                              })
                            }
                            className={`p-1.5 rounded-lg ${
                              user.status === 'ACTIVE'
                                ? 'bg-slate-800 text-slate-400 hover:text-amber-400'
                                : 'bg-slate-800 text-slate-400 hover:text-emerald-400'
                            }`}
                            title={user.status === 'ACTIVE' ? 'Deactivate User' : 'Activate User'}
                          >
                            {user.status === 'ACTIVE' ? (
                              <XCircle className="h-3.5 w-3.5" />
                            ) : (
                              <CheckCircle className="h-3.5 w-3.5" />
                            )}
                          </button>
                        )}
                        {user.role !== 'ADMIN' && (
                          <button
                            onClick={() => setShowDeleteModal(user)}
                            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-rose-400"
                            title="Delete User"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: Create Employee Account */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-7 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-rose-500" />
                Register New Employee Account
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Employee Full Name</label>
                <input
                  type="text"
                  required
                  value={createForm.fullName}
                  onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Corporate Login Email</label>
                <input
                  type="email"
                  required
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  placeholder="employee@company.com"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Initial Password</label>
                  <input
                    type="password"
                    required
                    value={createForm.initialPassword}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, initialPassword: e.target.value })
                    }
                    placeholder="Min 8 characters"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Confirm Password</label>
                  <input
                    type="password"
                    required
                    value={createForm.confirmPassword}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, confirmPassword: e.target.value })
                    }
                    placeholder="Repeat password"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Role Assignment</label>
                  <select
                    value={createForm.role}
                    onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-rose-500"
                  >
                    <option value="USER">USER (Employee Workspace)</option>
                    <option value="ADMIN">ADMIN (System Administrator)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Initial Status</label>
                  <select
                    value={createForm.status}
                    onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-rose-500"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-800/60 text-slate-400 text-[11px] space-y-1">
                <p className="font-semibold text-slate-300">Security Guarantee:</p>
                <p>• Passwords are encrypted using bcrypt work factor 12.</p>
                <p>• The user will be required to change their temporary password upon their first login.</p>
                <p>• Public registration is permanently disabled.</p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-semibold flex items-center gap-1.5 shadow-md shadow-rose-600/20"
                >
                  {createMutation.isPending ? 'Creating Account...' : 'Register Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Reset Password Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-amber-500" />
              Reset Password for {showResetModal.email}
            </h3>
            <p className="text-xs text-slate-400">
              Provide a new temporary password. The user will be required to change it on their next login session.
            </p>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {formError}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                New Temporary Password
              </label>
              <input
                type="password"
                required
                value={resetPasswordInput}
                onChange={(e) => setResetPasswordInput(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResetModal(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={resetPasswordMutation.isPending || resetPasswordInput.length < 8}
                onClick={() =>
                  resetPasswordMutation.mutate({
                    id: showResetModal.id,
                    newPassword: resetPasswordInput,
                  })
                }
                className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-amber-600/20"
              >
                {resetPasswordMutation.isPending ? 'Resetting...' : 'Assign Temporary Password'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Edit User Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Edit2 className="h-5 w-5 text-indigo-400" />
              Edit Employee Profile
            </h3>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {formError}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Account Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Role Assignment</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100"
                >
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowEditModal(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={editMutation.isPending}
                onClick={() =>
                  editMutation.mutate({
                    id: showEditModal.id,
                    data: editForm,
                  })
                }
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold"
              >
                {editMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: User Details Modal */}
      {showDetailsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-brand-400" />
                Employee Account Details
              </h3>
              <button
                onClick={() => setShowDetailsModal(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">User ID</span>
                <span className="font-mono text-slate-200">{showDetailsModal.id}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Full Name</span>
                <span className="font-semibold text-slate-200">{showDetailsModal.fullName}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Corporate Email</span>
                <span className="font-mono text-slate-200">{showDetailsModal.email}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Assigned Role</span>
                <span className="text-slate-200">{showDetailsModal.role}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Account Status</span>
                <span className="text-slate-200">{showDetailsModal.status}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Connected Gmail</span>
                <span className="text-slate-200 font-mono">
                  {showDetailsModal.gmailConnection?.gmailAddress || 'None'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Registered Date</span>
                <span className="text-slate-200">
                  {new Date(showDetailsModal.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Last Authentication</span>
                <span className="text-slate-200">
                  {showDetailsModal.lastLoginAt
                    ? new Date(showDetailsModal.lastLoginAt).toLocaleString()
                    : 'Never logged in'}
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowDetailsModal(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-rose-500/30 rounded-2xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-rose-500" />
              Delete Account: {showDeleteModal.email}
            </h3>
            <p className="text-xs text-slate-400">
              Are you sure you want to delete this employee account? All associated campaigns, recipients, and drafts belonging exclusively to this tenant will be permanently removed.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(showDeleteModal.id)}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-rose-600/20"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Permanently Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
