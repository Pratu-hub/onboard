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

const AVATAR_COLORS = [
  { bg: 'bg-primary/20 border-primary/30', text: 'text-primary' },
  { bg: 'bg-success/20 border-success/30', text: 'text-success' },
  { bg: 'bg-info/20 border-info/30', text: 'text-info' },
];

const statusConfig = {
  pending:        { label: 'Pending Docs', className: 'badge-neutral' },
  uploaded:       { label: 'Pending Docs', className: 'badge-neutral' },
  ai_processing:  { label: 'Under Review', className: 'badge-info' },
  flagged:        { label: 'Flagged',      className: 'badge-warning' },
  verified:       { label: 'Verified',     className: 'badge-success' },
  rejected:       { label: 'Rejected',     className: 'badge-danger' },
};

/* Determine overall case status from a collection of documents */
const getCaseStatus = (docs) => {
  if (docs.some(d => d.status === 'flagged')) return 'flagged';
  if (docs.some(d => d.status === 'rejected')) return 'rejected';
  if (docs.some(d => d.status === 'pending' || d.status === 'uploaded')) return 'pending';
  if (docs.some(d => d.status === 'ai_processing')) return 'ai_processing';
  return 'verified';
};

/* ──────── Component ──────── */

const PendingCasesList = ({ documents, onCaseSelect }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  /* Group documents by user to create "Cases" */
  const cases = useMemo(() => {
    const userMap = new Map();
    documents.forEach(doc => {
      if (!userMap.has(doc.user_id)) {
        userMap.set(doc.user_id, {
          user_id: doc.user_id,
          user_name: doc.user_name,
          user_email: doc.user_email,
          user_department: doc.user_department,
          user_joining_date: doc.user_joining_date,
          user_manager_name: doc.user_manager_name,
          user_role: doc.user_role,
          documents: []
        });
      }
      userMap.get(doc.user_id).documents.push(doc);
    });

    return Array.from(userMap.values()).map(c => ({
      ...c,
      status: getCaseStatus(c.documents)
    }));
  }, [documents]);

  const departments = useMemo(() => {
    const set = new Set(cases.map((c) => c.user_department).filter(Boolean));
    return ['all', ...Array.from(set).sort()];
  }, [cases]);

  const filtered = useMemo(() => {
    return cases.filter((c) => {
      if (departmentFilter !== 'all' && c.user_department !== departmentFilter) return false;
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          (c.user_name || '').toLowerCase().includes(q) ||
          (c.user_email || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [cases, departmentFilter, statusFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const pageItems = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const totalActive = cases.length;
  const highPriority = cases.filter((c) => ['flagged', 'rejected'].includes(c.status)).length;

  return (
    <div className="text-white font-body pb-12 glass-animate-in p-8">
      {/* ── Hero Header ── */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="font-headline text-3xl font-extrabold tracking-tight mb-2 drop-shadow-sm">
            Pending Cases
          </h2>
          <p className="font-body text-white/60 max-w-2xl text-sm leading-relaxed">
            Review and approve candidate documentation for upcoming joiners. Maintain operational excellence through precise HR intelligence.
          </p>
        </div>
        <div className="flex gap-4">
          <div className="glass-panel px-6 py-4 rounded-2xl flex flex-col items-center justify-center min-w-[140px] relative overflow-hidden">
            <div className="absolute inset-0 bg-primary/5"></div>
            <span className="text-3xl font-extrabold text-primary font-headline drop-shadow-[0_0_10px_rgba(24,86,255,0.4)] relative z-10">{String(totalActive).padStart(2, '0')}</span>
            <span className="text-[10px] uppercase font-bold text-white/50 tracking-[0.2em] relative z-10 mt-1">Total Active</span>
          </div>
          <div className="glass-panel px-6 py-4 rounded-2xl flex flex-col items-center justify-center min-w-[140px] border border-danger/30 relative overflow-hidden">
            <div className="absolute inset-0 bg-danger/10"></div>
            <span className="text-3xl font-extrabold text-danger font-headline drop-shadow-[0_0_10px_rgba(234,33,67,0.4)] relative z-10">{String(highPriority).padStart(2, '0')}</span>
            <span className="text-[10px] uppercase font-bold text-danger/80 tracking-[0.2em] relative z-10 mt-1">High Priority</span>
          </div>
        </div>
      </div>

      {/* ── Filters Bar ── */}
      <div className="glass-panel rounded-2xl p-5 mb-8 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-white/40">filter_list</span>
          <span className="text-xs font-bold text-white/60 uppercase tracking-widest">Filters:</span>
        </div>
        <select
          value={departmentFilter}
          onChange={(e) => { setDepartmentFilter(e.target.value); setCurrentPage(1); }}
          className="glass-surface border border-white/10 rounded-xl text-xs font-semibold py-2.5 px-4 focus:ring-1 focus:ring-primary/50 outline-none cursor-pointer text-white [color-scheme:dark]"
        >
          {departments.map((d) => (
            <option key={d} value={d} className="bg-slate-900">{d === 'all' ? 'All Departments' : d}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          className="glass-surface border border-white/10 rounded-xl text-xs font-semibold py-2.5 px-4 focus:ring-1 focus:ring-primary/50 outline-none cursor-pointer text-white [color-scheme:dark]"
        >
          <option value="all" className="bg-slate-900">All Statuses</option>
          <option value="pending" className="bg-slate-900">Pending Docs</option>
          <option value="ai_processing" className="bg-slate-900">Under Review</option>
          <option value="flagged" className="bg-slate-900">Flagged</option>
          <option value="verified" className="bg-slate-900">Verified</option>
          <option value="rejected" className="bg-slate-900">Rejected</option>
        </select>
        <div className="ml-auto relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-lg pointer-events-none">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            placeholder="Search candidates..."
            className="glass-surface border border-white/10 rounded-xl text-sm pl-12 py-2.5 pr-4 focus:ring-1 focus:ring-primary/50 outline-none w-64 text-white placeholder:text-white/20 transition-all"
          />
        </div>
      </div>

      {/* ── Data Table ── */}
      <div className="glass-panel rounded-2xl shadow-lg border border-white/10 overflow-hidden">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.08]">
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-white/40">Hire Name</th>
                <th className="px-6 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-white/40">Department</th>
                <th className="px-6 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-white/40">Joining Date</th>
                <th className="px-6 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-white/40">Docs</th>
                <th className="px-6 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-white/40">Case Status</th>
                <th className="px-8 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {pageItems.map((c, idx) => {
                const color = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                const status = statusConfig[c.status] || statusConfig.pending;
                return (
                  <tr key={c.user_id} className="hover:bg-white/[0.04] transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl border flex items-center justify-center font-extrabold text-base shadow-[0_0_10px_rgba(24,86,255,0.1)] group-hover:scale-105 transition-transform ${color.bg} ${color.text}`}>
                          {getInitials(c.user_name)}
                        </div>
                        <div>
                          <span className="font-bold text-white text-sm group-hover:text-primary transition-colors">{c.user_name}</span>
                          <p className="text-[11px] text-white/40 mt-0.5">{c.user_email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-sm font-medium text-white/70">{c.user_department || '—'}</span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-sm font-bold text-white/90 font-mono">{formatDate(c.user_joining_date)}</span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-white/40 text-sm">folder</span>
                        <span className="text-xs text-white/60 font-bold">
                          {c.documents.length} Files
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`${status.className} px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button
                        onClick={() => onCaseSelect(c)}
                        className="px-6 py-2.5 glass-surface border border-primary/50 text-primary hover:bg-primary hover:text-white text-[10px] uppercase tracking-[0.2em] font-bold rounded-xl transition-all hover:shadow-[0_0_15px_rgba(24,86,255,0.4)] active:scale-95"
                      >
                        Review Case
                      </button>
                    </td>
                  </tr>
                );
              })}
              {pageItems.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-8 py-16 text-center text-white/40 italic text-sm">
                    No pending cases found matching the criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        <div className="px-8 py-5 flex items-center justify-between border-t border-white/[0.08] glass-surface">
          <span className="text-xs font-medium text-white/40">
            Showing <span className="font-bold text-white">{pageItems.length}</span> of <span className="font-bold text-white">{filtered.length}</span> results
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="w-8 h-8 flex items-center justify-center rounded-lg glass-surface hover:bg-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed border border-white/5 transition-all"
              >
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all shadow-sm ${
                    page === currentPage
                      ? 'bg-primary text-white shadow-[0_0_10px_rgba(24,86,255,0.4)]'
                      : 'glass-surface text-white/60 hover:text-white hover:bg-white/10 border border-white/5'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="w-8 h-8 flex items-center justify-center rounded-lg glass-surface hover:bg-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed border border-white/5 transition-all"
              >
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PendingCasesList;
