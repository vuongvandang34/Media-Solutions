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
  Mail,
  Building,
  Globe,
  Lock,
  Unlock,
  CheckCircle,
  Eye,
  ArrowLeft,
  ArrowRight,
  MapPin,
  Clipboard,
  Star,
  Info,
} from 'lucide-react';
import CustomerForm from './CustomerForm';

interface CustomerMember {
  id: string;
  customerCode: string;
  name: string;
  phone: string;
  email: string | null;
  birthday: Date | string | null;
  website: string | null;
  company: string | null;
  address: string | null;
  note: string | null;
  status: 'ACTIVE' | 'LOCKED';
  averageRating: number | null;
  createdAt: Date | string;
}

interface CustomerTableProps {
  customers: CustomerMember[];
  total: number;
  currentPage: number;
  limit: number;
  currentUser: {
    id: string;
    role: string;
  };
}

export default function CustomerTable({
  customers,
  total,
  currentPage,
  limit,
  currentUser,
}: CustomerTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchVal, setSearchVal] = useState(searchParams.get('search') || '');
  const [statusVal, setStatusVal] = useState(searchParams.get('status') || '');

  // Modals and sliding detail card state
  const [formOpen, setFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerMember | undefined>(undefined);
  const [viewingCustomer, setViewingCustomer] = useState<CustomerMember | null>(null);

  const canManage = ['BUSINESS_OWNER', 'MANAGER'].includes(currentUser.role);
  const canDelete = currentUser.role === 'BUSINESS_OWNER';

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

  const handleLockStatusToggle = async (member: CustomerMember) => {
    if (!canManage) return;

    const nextStatus = member.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
    try {
      const res = await fetch(`/api/customers/${member.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...member, status: nextStatus }),
      });

      if (res.ok) {
        router.refresh();
        if (viewingCustomer?.id === member.id) {
          setViewingCustomer((prev) => (prev ? { ...prev, status: nextStatus } : null));
        }
      }
    } catch (err) {
      console.error('Failed to toggle lock status:', err);
    }
  };

  const handleDeleteCustomer = async (member: CustomerMember) => {
    if (!canDelete) return;
    if (!confirm(`Are you sure you want to mark ${member.name} as LOCKED? This soft-deletes customer access but preserves ratings.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/customers/${member.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        router.refresh();
        if (viewingCustomer?.id === member.id) {
          setViewingCustomer((prev) => (prev ? { ...prev, status: 'LOCKED' } : null));
        }
      }
    } catch (err) {
      console.error('Failed to soft-delete customer:', err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'LOCKED':
        return 'bg-rose-500/10 text-rose-450 border-rose-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-550/20';
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Filter and Add Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-5">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2 max-w-lg">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by name, phone, email, or customer code..."
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
              <option value="LOCKED">Locked</option>
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
                setEditingCustomer(undefined);
                setFormOpen(true);
              }}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/10 hover:bg-indigo-500 transition duration-150"
            >
              <Plus className="h-4.5 w-4.5" />
              <span>Add Customer</span>
            </button>
          )}
        </div>
      </div>

      {/* Customer Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/20 shadow-xl backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm text-slate-355">
            <thead className="bg-slate-900/60 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Customer Code</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Company</th>
                <th className="px-6 py-4">Rating</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 bg-transparent">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-xs text-slate-550">
                    No customer records found matching your filters.
                  </td>
                </tr>
              ) : (
                customers.map((member) => (
                  <tr key={member.id} className="transition duration-150 hover:bg-slate-900/30">
                    <td className="px-6 py-4 font-mono text-xs font-bold text-white">
                      {member.customerCode}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">{member.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs">
                          <Phone className="h-3.5 w-3.5 text-slate-550" />
                          <span>{member.phone}</span>
                        </div>
                        {member.email && (
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-450">
                            <Mail className="h-3 w-3" />
                            <span className="truncate max-w-[170px]">{member.email}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium">
                      {member.company ? (
                        <div className="flex items-center gap-1.5">
                          <Building className="h-3.5 w-3.5 text-slate-500" />
                          <span>{member.company}</span>
                        </div>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {member.averageRating ? (
                        <div className="flex items-center gap-1 rounded bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 w-max text-xs font-bold text-amber-400">
                          <Star className="h-3 w-3 fill-amber-400" />
                          <span>{Number(member.averageRating).toFixed(1)}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-550">No ratings</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${getStatusBadge(member.status)}`}>
                        {member.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setViewingCustomer(member)}
                          title="View Profile Details"
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition duration-150"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {canManage && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleLockStatusToggle(member)}
                              title={member.status === 'ACTIVE' ? 'Lock Account' : 'Unlock Account'}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition duration-150"
                            >
                              {member.status === 'ACTIVE' ? (
                                <Lock className="h-4 w-4" />
                              ) : (
                                <Unlock className="h-4 w-4 text-emerald-450" />
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setEditingCustomer(member);
                                setFormOpen(true);
                              }}
                              title="Edit"
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition duration-150"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          </>
                        )}

                        {canDelete && member.status === 'ACTIVE' && (
                          <button
                            type="button"
                            onClick={() => handleDeleteCustomer(member)}
                            title="Soft Delete"
                            className="rounded-lg p-1.5 text-rose-455 hover:bg-rose-500/10 transition duration-150"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
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
            Showing customers {limit * (currentPage - 1) + 1} to {Math.min(limit * currentPage, total)} of {total} records
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

      {/* Dynamic Add/Edit Modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-400" />
                <span>{editingCustomer ? 'Edit Customer Registry' : 'Register New Customer'}</span>
              </h3>
              <button
                onClick={() => setFormOpen(false)}
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-350 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <CustomerForm
              initialData={editingCustomer}
              onClose={() => setFormOpen(false)}
              onSuccess={() => {
                setFormOpen(false);
                router.refresh();
              }}
            />
          </div>
        </div>
      )}

      {/* View Details Sliding/Centering Panel */}
      {viewingCustomer && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] uppercase font-mono font-bold text-indigo-400">
                  Client ID: {viewingCustomer.customerCode}
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">{viewingCustomer.name}</h3>
              </div>
              <button
                onClick={() => setViewingCustomer(null)}
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-350 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {/* Rating Section */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-800 bg-slate-950/40">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase">Workspace Status</span>
                  <span className={`block font-bold text-xs ${viewingCustomer.status === 'ACTIVE' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {viewingCustomer.status}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase block">Average Satisfaction</span>
                  {viewingCustomer.averageRating ? (
                    <div className="flex items-center gap-1 mt-0.5 text-sm font-bold text-amber-400 justify-end">
                      <Star className="h-4 w-4 fill-amber-400" />
                      <span>{Number(viewingCustomer.averageRating).toFixed(1)} / 5.0</span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-650 block mt-0.5">No survey responses yet</span>
                  )}
                </div>
              </div>

              {/* Grid profile fields */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Phone */}
                <div className="space-y-1 rounded-xl border border-slate-850 bg-slate-950/20 p-3">
                  <span className="text-[9px] text-slate-500 font-bold uppercase flex items-center gap-1">
                    <Phone className="h-3 w-3 text-slate-600" />
                    <span>Phone Number</span>
                  </span>
                  <span className="block text-xs font-semibold text-white">{viewingCustomer.phone}</span>
                </div>

                {/* Email */}
                <div className="space-y-1 rounded-xl border border-slate-850 bg-slate-950/20 p-3">
                  <span className="text-[9px] text-slate-500 font-bold uppercase flex items-center gap-1">
                    <Mail className="h-3 w-3 text-slate-600" />
                    <span>Email Address</span>
                  </span>
                  <span className="block text-xs font-semibold text-white truncate max-w-full">
                    {viewingCustomer.email || '—'}
                  </span>
                </div>

                {/* Birthday */}
                <div className="space-y-1 rounded-xl border border-slate-850 bg-slate-950/20 p-3">
                  <span className="text-[9px] text-slate-500 font-bold uppercase flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-slate-600" />
                    <span>Birthday</span>
                  </span>
                  <span className="block text-xs font-semibold text-white">
                    {viewingCustomer.birthday
                      ? new Date(viewingCustomer.birthday).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : '—'}
                  </span>
                </div>

                {/* Website */}
                <div className="space-y-1 rounded-xl border border-slate-850 bg-slate-950/20 p-3">
                  <span className="text-[9px] text-slate-500 font-bold uppercase flex items-center gap-1">
                    <Globe className="h-3 w-3 text-slate-600" />
                    <span>Website URL</span>
                  </span>
                  {viewingCustomer.website ? (
                    <a
                      href={viewingCustomer.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-xs font-semibold text-indigo-400 hover:underline truncate max-w-full"
                    >
                      {viewingCustomer.website}
                    </a>
                  ) : (
                    <span className="block text-xs font-semibold text-white">—</span>
                  )}
                </div>

                {/* Company */}
                <div className="space-y-1 rounded-xl border border-slate-850 bg-slate-950/20 p-3 sm:col-span-2">
                  <span className="text-[9px] text-slate-500 font-bold uppercase flex items-center gap-1">
                    <Building className="h-3 w-3 text-slate-600" />
                    <span>Company Name</span>
                  </span>
                  <span className="block text-xs font-semibold text-white">{viewingCustomer.company || '—'}</span>
                </div>

                {/* Address */}
                <div className="space-y-1 rounded-xl border border-slate-850 bg-slate-950/20 p-3 sm:col-span-2">
                  <span className="text-[9px] text-slate-500 font-bold uppercase flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-slate-600" />
                    <span>Physical Address</span>
                  </span>
                  <p className="text-xs font-medium text-white leading-relaxed">{viewingCustomer.address || '—'}</p>
                </div>

                {/* Notes */}
                <div className="space-y-1 rounded-xl border border-slate-850 bg-slate-950/20 p-3 sm:col-span-2">
                  <span className="text-[9px] text-slate-500 font-bold uppercase flex items-center gap-1">
                    <Clipboard className="h-3.5 w-3.5 text-slate-600" />
                    <span>Internal Client Notes</span>
                  </span>
                  <p className="text-xs font-medium text-slate-350 leading-relaxed">{viewingCustomer.note || '—'}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              {canManage && viewingCustomer.status !== 'LOCKED' && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingCustomer(viewingCustomer);
                    setViewingCustomer(null);
                    setFormOpen(true);
                  }}
                  className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-900 transition flex items-center gap-1"
                >
                  <Edit className="h-3 w-3" />
                  <span>Edit Profile</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setViewingCustomer(null)}
                className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700 transition"
              >
                Close Details
              </button>
            </div>
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
