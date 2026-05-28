'use client';

import React, { useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  Users,
  Search,
  Plus,
  Edit,
  Trash2,
  Calendar,
  Phone,
  UserCheck,
  UserMinus,
  Lock,
  User,
  ArrowLeft,
  ArrowRight,
  Filter,
} from 'lucide-react';
import StaffForm from './StaffForm';

interface StaffMember {
  id: string;
  staffCode: string;
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
  status: 'ACTIVE' | 'ABSENT' | 'RESIGNED';
  createdAt: Date | string;
}

interface StaffTableProps {
  staff: StaffMember[];
  total: number;
  currentPage: number;
  limit: number;
  currentUser: {
    id: string;
    role: string;
  };
  planLimits: {
    maxStaff: number;
    planName: string;
  };
}

export default function StaffTable({
  staff,
  total,
  currentPage,
  limit,
  currentUser,
  planLimits,
}: StaffTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchVal, setSearchVal] = useState(searchParams.get('search') || '');
  const [statusVal, setStatusVal] = useState(searchParams.get('status') || '');

  // Add/Edit Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | undefined>(undefined);

  const canManage = ['BUSINESS_OWNER', 'MANAGER'].includes(currentUser.role);
  const canDelete = currentUser.role === 'BUSINESS_OWNER';

  // Count active staff for plan limit warnings
  const activeStaffCount = staff.filter((s) => s.status !== 'RESIGNED').length;
  const isLimitReached = total >= planLimits.maxStaff;

  const updateFilters = (search: string, status: string, page: number) => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (status) params.set('status', status);
    if (page > 1) params.set('page', page.toString());

    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters(searchVal, statusVal, 1);
  };

  const handleStatusChange = (status: string) => {
    setStatusVal(status);
    updateFilters(searchVal, status, 1);
  };

  const handleClearFilters = () => {
    setSearchVal('');
    setStatusVal('');
    router.push(pathname);
  };

  const handleQuickStatusToggle = async (member: StaffMember) => {
    if (!canManage) return;

    const nextStatus = member.status === 'ACTIVE' ? 'ABSENT' : 'ACTIVE';
    try {
      const res = await fetch(`/api/staff/${member.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (res.ok) {
        router.refresh();
      }
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const handleDeleteStaff = async (member: StaffMember) => {
    if (!canDelete) return;
    if (!confirm(`Are you sure you want to mark ${member.fullName} as RESIGNED? This soft-deletes the staff member but keeps their history.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/staff/${member.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        router.refresh();
      }
    } catch (err) {
      console.error('Failed to soft-delete staff:', err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'ABSENT':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'RESIGNED':
        return 'bg-rose-500/10 text-rose-450 border-rose-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-550/20';
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Plan limit alerts */}
      {isLimitReached && canManage && (
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 text-sm text-yellow-400">
          <div className="flex items-center gap-2">
            <Lock className="h-4.5 w-4.5" />
            <span>
              Your <strong>{planLimits.planName}</strong> plan has reached its staff limit of <strong>{planLimits.maxStaff}</strong> members.
            </span>
          </div>
          <button
            type="button"
            className="rounded-lg bg-yellow-500/15 border border-yellow-500/30 px-3 py-1.5 text-xs font-semibold hover:bg-yellow-500/25 transition"
          >
            Upgrade Plan
          </button>
        </div>
      )}

      {/* Filter and Add Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-5">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2 max-w-lg">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by name, phone, or staff code..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-900/40 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition duration-150"
            />
            <Search className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-500" />
          </div>
          <button
            type="submit"
            className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm font-semibold hover:bg-slate-900 transition duration-150"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-2">
          {/* Status Select */}
          <div className="relative">
            <select
              value={statusVal}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="ABSENT">Absent</option>
              <option value="RESIGNED">Resigned</option>
            </select>
          </div>

          {(searchVal || statusVal) && (
            <button
              onClick={handleClearFilters}
              className="text-xs text-slate-500 hover:text-slate-400 font-semibold px-2 py-1"
            >
              Clear
            </button>
          )}

          {canManage && (
            <button
              onClick={() => {
                setEditingStaff(undefined);
                setModalOpen(true);
              }}
              disabled={isLimitReached}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/10 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150"
            >
              <Plus className="h-4.5 w-4.5" />
              <span>Add Staff</span>
            </button>
          )}
        </div>
      </div>

      {/* Staff Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/20 shadow-xl backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm text-slate-350">
            <thead className="bg-slate-900/60 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Staff Code</th>
                <th className="px-6 py-4">Full Name</th>
                <th className="px-6 py-4">Phone</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Created At</th>
                {canManage && <th className="px-6 py-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 bg-transparent">
              {staff.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-xs text-slate-550">
                    No staff records found matching your filters.
                  </td>
                </tr>
              ) : (
                staff.map((member) => (
                  <tr key={member.id} className="transition duration-150 hover:bg-slate-900/30">
                    <td className="px-6 py-4 font-mono text-xs font-bold text-white">
                      {member.staffCode}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 overflow-hidden rounded-full border border-slate-800 bg-slate-900 flex items-center justify-center">
                          {member.avatarUrl ? (
                            <img
                              src={member.avatarUrl}
                              alt={member.fullName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <User className="h-4.5 w-4.5 text-slate-550" />
                          )}
                        </div>
                        <span className="font-semibold text-white">{member.fullName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium">
                      {member.phone ? (
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-slate-500" />
                          <span>{member.phone}</span>
                        </div>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${getStatusBadge(member.status)}`}>
                        {member.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>
                          {new Date(member.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </td>
                    {canManage && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {member.status !== 'RESIGNED' && (
                            <button
                              type="button"
                              onClick={() => handleQuickStatusToggle(member)}
                              title={member.status === 'ACTIVE' ? 'Mark Absent' : 'Mark Active'}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition duration-150"
                            >
                              {member.status === 'ACTIVE' ? (
                                <UserMinus className="h-4 w-4" />
                              ) : (
                                <UserCheck className="h-4 w-4 text-emerald-450" />
                              )}
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setEditingStaff(member);
                              setModalOpen(true);
                            }}
                            title="Edit"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition duration-150"
                          >
                            <Edit className="h-4 w-4" />
                          </button>

                          {canDelete && member.status !== 'RESIGNED' && (
                            <button
                              type="button"
                              onClick={() => handleDeleteStaff(member)}
                              title="Delete"
                              className="rounded-lg p-1.5 text-rose-450 hover:bg-rose-500/10 transition duration-150"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-slate-500">
            Showing staff {limit * (currentPage - 1) + 1} to {Math.min(limit * currentPage, total)} of {total} records
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => updateFilters(searchVal, statusVal, currentPage - 1)}
              disabled={currentPage === 1}
              className="rounded-xl border border-slate-800 bg-slate-950 p-2 text-slate-400 hover:bg-slate-900 transition disabled:opacity-50"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-semibold text-slate-300 px-3">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => updateFilters(searchVal, statusVal, currentPage + 1)}
              disabled={currentPage === totalPages}
              className="rounded-xl border border-slate-800 bg-slate-950 p-2 text-slate-400 hover:bg-slate-900 transition disabled:opacity-50"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Edit/Add Staff Modal Overlay */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-400" />
                <span>{editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}</span>
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-350 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <StaffForm
              initialData={editingStaff}
              onClose={() => setModalOpen(false)}
              onSuccess={() => {
                setModalOpen(false);
                router.refresh();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Add simple close icon fallback if not imported
function X(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
