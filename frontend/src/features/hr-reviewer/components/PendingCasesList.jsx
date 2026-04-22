import React, { useState, useMemo } from 'react';

const ITEMS_PER_PAGE = 6;

/* ──────── Helpers ──────── */

const getInitials = (name) => {
  if (!name) return '??';
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

/* Color ring for initials avatar — cycles through primary/secondary/tertiary */
const AVATAR_COLORS = [
  { bg: 'bg-primary/10', text: 'text-primary' },
  { bg: 'bg-secondary/10', text: 'text-secondary' },
  { bg: 'bg-tertiary/10', text: 'text-tertiary' },
];

const statusConfig = {
  pending:        { label: 'Pending Docs', bg: 'bg-[#fff8e1]', text: 'text-[#974700]', border: 'border-[#ffecb3]' },
  uploaded:       { label: 'Pending Docs', bg: 'bg-[#fff8e1]', text: 'text-[#974700]', border: 'border-[#ffecb3]' },
  ai_processing:  { label: 'Under Review', bg: 'bg-orange-50',  text: 'text-orange-700', border: 'border-orange-100' },
  flagged:        { label: 'Flagged',      bg: 'bg-error-container', text: 'text-on-error-container', border: 'border-error/10' },
  verified:       { label: 'Verified',     bg: 'bg-green-50',   text: 'text-green-700', border: 'border-green-100' },
  rejected:       { label: 'Rejected',     bg: 'bg-red-50',     text: 'text-red-700', border: 'border-red-100' },
};

/* ──────── Component ──────── */

const PendingCasesList = ({ documents, onCaseSelect }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  /* Derive unique departments from data */
  const departments = useMemo(() => {
    const set = new Set(documents.map((d) => d.user_department).filter(Boolean));
    return ['all', ...Array.from(set).sort()];
  }, [documents]);

  /* Filter + paginate */
  const filtered = useMemo(() => {
    return documents.filter((doc) => {
      if (departmentFilter !== 'all' && doc.user_department !== departmentFilter) return false;
      if (statusFilter !== 'all' && doc.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          (doc.user_name || '').toLowerCase().includes(q) ||
          (doc.user_email || '').toLowerCase().includes(q) ||
          (doc.doc_type || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [documents, departmentFilter, statusFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const pageItems = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  /* Stat counts */
  const totalActive = documents.length;
  const highPriority = documents.filter((d) => ['flagged', 'rejected'].includes(d.status)).length;

  if (!documents || documents.length === 0) {
    return (
      <div className="bg-surface-container-lowest rounded-xl p-12 text-center">
        <span className="material-symbols-outlined text-5xl text-on-surface-variant/40 mb-4 block">assignment</span>
        <p className="text-on-surface-variant text-lg">No documents pending review.</p>
      </div>
    );
  }

  return (
    <div>
      {/* ── Hero Header ── */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="font-headline text-3xl font-extrabold text-on-surface tracking-tight mb-2">
            Pending Cases
          </h2>
          <p className="font-body text-on-surface-variant max-w-2xl">
            Review and approve candidate documentation for upcoming joiners. Maintain operational excellence through precise HR intelligence.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="bg-surface-container-low px-4 py-2 rounded-xl flex flex-col items-center justify-center min-w-[120px]">
            <span className="text-2xl font-bold text-primary">{String(totalActive).padStart(2, '0')}</span>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Total Active</span>
          </div>
          <div className="bg-primary/5 px-4 py-2 rounded-xl flex flex-col items-center justify-center min-w-[120px] border border-primary/10">
            <span className="text-2xl font-bold text-tertiary">{String(highPriority).padStart(2, '0')}</span>
            <span className="text-[10px] uppercase font-bold text-tertiary/70 tracking-widest">High Priority</span>
          </div>
        </div>
      </div>

      {/* ── Filters Bar ── */}
      <div className="bg-surface-container-low rounded-xl p-4 mb-6 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-slate-400">filter_list</span>
          <span className="text-sm font-semibold text-on-surface-variant">Filters:</span>
        </div>
        <select
          value={departmentFilter}
          onChange={(e) => { setDepartmentFilter(e.target.value); setCurrentPage(1); }}
          className="bg-surface-container-lowest border-none rounded-lg text-sm font-medium py-2 px-4 shadow-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
        >
          {departments.map((d) => (
            <option key={d} value={d}>{d === 'all' ? 'All Departments' : d}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          className="bg-surface-container-lowest border-none rounded-lg text-sm font-medium py-2 px-4 shadow-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending Docs</option>
          <option value="uploaded">Uploaded</option>
          <option value="ai_processing">Under Review</option>
          <option value="flagged">Flagged</option>
          <option value="verified">Verified</option>
          <option value="rejected">Rejected</option>
        </select>
        <div className="ml-auto relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            placeholder="Search cases..."
            className="bg-surface-container-lowest border-none rounded-lg text-sm pl-10 py-2 pr-4 shadow-sm focus:ring-2 focus:ring-primary/20 focus:outline-none w-56"
          />
        </div>
      </div>

      {/* ── Data Table ── */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[11px] uppercase tracking-widest font-bold text-slate-400">Hire Name</th>
                <th className="px-6 py-4 text-[11px] uppercase tracking-widest font-bold text-slate-400">Department</th>
                <th className="px-6 py-4 text-[11px] uppercase tracking-widest font-bold text-slate-400">Document</th>
                <th className="px-6 py-4 text-[11px] uppercase tracking-widest font-bold text-slate-400">Uploaded</th>
                <th className="px-6 py-4 text-[11px] uppercase tracking-widest font-bold text-slate-400">Case Status</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {pageItems.map((doc, idx) => {
                const color = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                const status = statusConfig[doc.status] || statusConfig.pending;
                return (
                  <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors group">
                    {/* Name + Initials Avatar */}
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full ${color.bg} flex items-center justify-center ${color.text} font-bold text-sm`}>
                          {getInitials(doc.user_name)}
                        </div>
                        <div>
                          <span className="font-bold text-on-surface text-sm">{doc.user_name}</span>
                          <p className="text-[11px] text-on-surface-variant mt-0.5">{doc.user_email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Department */}
                    <td className="px-6 py-5">
                      <span className="text-sm text-on-surface-variant">{doc.user_department || '—'}</span>
                    </td>

                    {/* Document Type */}
                    <td className="px-6 py-5">
                      <span className="text-sm text-on-surface capitalize">{(doc.doc_type || '').replace(/_/g, ' ')}</span>
                    </td>

                    {/* Uploaded Date */}
                    <td className="px-6 py-5">
                      <span className="text-sm font-medium text-on-surface">{formatDate(doc.uploaded_at)}</span>
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${status.bg} ${status.text} border ${status.border}`}>
                        {status.label}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="px-6 py-5 text-right">
                      <button
                        onClick={() => onCaseSelect(doc)}
                        className="px-5 py-2.5 bg-gradient-to-br from-primary to-primary-container text-white text-[11px] uppercase tracking-widest font-bold rounded-lg shadow-sm hover:shadow-md transition-all active:scale-95"
                      >
                        Review Case
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        <div className="px-6 py-4 flex items-center justify-between border-t border-slate-50">
          <span className="text-xs text-on-surface-variant">
            Showing {pageItems.length} of {filtered.length} results
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                    page === currentPage
                      ? 'bg-primary text-white'
                      : 'hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PendingCasesList;
