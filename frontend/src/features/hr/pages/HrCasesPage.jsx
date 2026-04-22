import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../../api';
import CaseDetailView from '../../hr-reviewer/components/CaseDetailView';

// Reusing some helpers
const getInitials = (name) => {
  if (!name) return '??';
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
};

const getCaseStatus = (docs) => {
  if (docs.some(d => d.status === 'flagged')) return 'flagged';
  if (docs.some(d => d.status === 'rejected')) return 'rejected';
  if (docs.some(d => d.status === 'pending' || d.status === 'uploaded')) return 'pending';
  if (docs.some(d => d.status === 'ai_processing')) return 'ai_processing';
  return 'verified';
};

const getStatusBadge = (status) => {
  switch(status) {
    case 'verified': return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">ACTIVE</span>;
    case 'flagged': return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-error-container text-on-error-container border border-error/10">FLAGGED</span>;
    case 'rejected': return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-error-container text-on-error-container border border-error/10">REJECTED</span>;
    case 'pending':
    case 'uploaded':
    case 'ai_processing': return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-secondary-container/20 text-on-secondary-container border border-secondary/10">PENDING APPROVAL</span>;
    default: return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-surface-variant text-on-surface-variant border border-outline-variant/30">DRAFT</span>;
  }
};

const getProgress = (docs) => {
  if (!docs || docs.length === 0) return { percent: 0, color: 'bg-tertiary' };
  const verified = docs.filter(d => d.status === 'verified').length;
  const flagged = docs.filter(d => d.status === 'flagged' || d.status === 'rejected').length;
  const percent = Math.round((verified / docs.length) * 100);
  
  let color = 'bg-primary';
  if (flagged > 0) color = 'bg-error';
  else if (percent < 50) color = 'bg-tertiary';
  
  return { percent, color };
};

const HrCasesPage = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('LIST'); // LIST, DETAIL
  const [selectedCase, setSelectedCase] = useState(null);

  // Filters
  const [departmentFilter, setDepartmentFilter] = useState('All Departments');
  const [statusFilter, setStatusFilter] = useState('All Statuses');

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const data = await api('/documents');
      setDocuments(data.documents);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

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

  const filteredCases = useMemo(() => {
    return cases.filter(c => {
      if (departmentFilter !== 'All Departments' && c.user_department !== departmentFilter) return false;
      
      if (statusFilter !== 'All Statuses') {
        const s = statusFilter.toLowerCase();
        if (s === 'pending' && !['pending', 'uploaded', 'ai_processing'].includes(c.status)) return false;
        if (s === 'flagged' && !['flagged', 'rejected'].includes(c.status)) return false;
        if (s === 'active' && c.status !== 'verified') return false;
      }
      return true;
    });
  }, [cases, departmentFilter, statusFilter]);

  const departments = useMemo(() => {
    const set = new Set(cases.map((c) => c.user_department).filter(Boolean));
    return ['All Departments', ...Array.from(set).sort()];
  }, [cases]);

  // Document Handlers for Case Detail View
  const handleVerify = async (docId) => {
    try {
      await api(`/documents/${docId}/status`, { method: 'PATCH', body: { status: 'verified' } });
      setDocuments(prev => prev.map(d => d.id === docId ? { ...d, status: 'verified' } : d));
      if (selectedCase) {
        setSelectedCase(prev => ({
          ...prev,
          documents: prev.documents.map(d => d.id === docId ? { ...d, status: 'verified' } : d)
        }));
      }
    } catch (err) { alert('Failed to verify document'); }
  };

  const handleReject = async (docId, notes) => {
    try {
      await api(`/documents/${docId}/status`, { method: 'PATCH', body: { status: 'rejected', reviewer_notes: notes } });
      setDocuments(prev => prev.map(d => d.id === docId ? { ...d, status: 'rejected', reviewer_notes: notes } : d));
      if (selectedCase) {
        setSelectedCase(prev => ({
          ...prev,
          documents: prev.documents.map(d => d.id === docId ? { ...d, status: 'rejected', reviewer_notes: notes } : d)
        }));
      }
    } catch (err) { alert('Failed to reject document'); throw err; }
  };

  const handleApproveAll = async () => {
    if (!selectedCase) return;
    const pendingDocs = selectedCase.documents.filter(d => ['pending', 'uploaded', 'ai_processing', 'flagged'].includes(d.status));
    if (pendingDocs.length === 0) return alert('All documents are already verified.');
    if (!confirm(`Approve all ${pendingDocs.length} pending documents for ${selectedCase.user_name}?`)) return;

    try {
      await Promise.all(pendingDocs.map(d => api(`/documents/${d.id}/status`, { method: 'PATCH', body: { status: 'verified' } })));
      const docIds = pendingDocs.map(d => d.id);
      setDocuments(prev => prev.map(d => docIds.includes(d.id) ? { ...d, status: 'verified' } : d));
      setSelectedCase(prev => ({
        ...prev,
        documents: prev.documents.map(d => docIds.includes(d.id) ? { ...d, status: 'verified' } : d)
      }));
    } catch (err) { alert('Failed to approve some documents.'); fetchDocuments(); }
  };

  if (activeView === 'DETAIL' && selectedCase) {
    return (
      <div className="h-full">
        <CaseDetailView 
          currentCase={selectedCase}
          onBack={() => setActiveView('LIST')}
          onVerify={handleVerify}
          onReject={handleReject}
          onApproveAll={handleApproveAll}
        />
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Hero Header Section */}
      <div className="mb-10">
        <h2 className="font-headline font-extrabold text-3xl text-on-surface tracking-tight mb-2">Case Management</h2>
        <p className="text-on-surface-variant max-w-2xl">Orchestrate enterprise-wide onboarding flows and IT provisioning tasks from a single unified workspace.</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/15 flex flex-col shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="p-2 bg-primary-fixed-dim/30 text-primary rounded-lg material-symbols-outlined">assignment</span>
            <span className="text-xs font-bold text-primary flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">trending_up</span> +12%
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Cases This Month</p>
          <h3 className="text-2xl font-bold font-headline text-on-surface">{cases.length}</h3>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/15 flex flex-col shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="p-2 bg-secondary-container/20 text-secondary rounded-lg material-symbols-outlined">timer</span>
            <span className="text-xs font-bold text-secondary flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">keyboard_arrow_down</span> 4.2h
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Avg Time-to-Approval</p>
          <h3 className="text-2xl font-bold font-headline text-on-surface">2.4 Days</h3>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/15 flex flex-col shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="p-2 bg-error-container/40 text-error rounded-lg material-symbols-outlined">document_scanner</span>
            <span className="text-xs font-bold text-error flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">warning</span> +1.2%
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Doc Rejection Rate</p>
          <h3 className="text-2xl font-bold font-headline text-on-surface">3.8%</h3>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/15 flex flex-col shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="p-2 bg-tertiary-fixed/40 text-tertiary rounded-lg material-symbols-outlined">cloud_done</span>
            <span className="text-xs font-bold text-tertiary flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">verified</span> 99.8%
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Provisioning Success</p>
          <h3 className="text-2xl font-bold font-headline text-on-surface">98.2%</h3>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/15 overflow-hidden shadow-sm">
        
        {/* Filters & Bulk Actions */}
        <div className="p-4 bg-surface-container-low/50 flex flex-wrap items-center justify-between gap-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-outline-variant/15 shadow-sm">
              <span className="text-xs font-bold text-slate-400">Status:</span>
              <select 
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="border-none text-xs font-semibold p-0 pr-6 focus:ring-0 bg-transparent cursor-pointer"
              >
                <option>All Statuses</option>
                <option>Pending</option>
                <option>Active</option>
                <option>Flagged</option>
              </select>
            </div>
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-outline-variant/15 shadow-sm">
              <span className="text-xs font-bold text-slate-400">Dept:</span>
              <select 
                value={departmentFilter}
                onChange={e => setDepartmentFilter(e.target.value)}
                className="border-none text-xs font-semibold p-0 pr-6 focus:ring-0 bg-transparent cursor-pointer"
              >
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <button className="p-2 bg-white rounded-lg border border-outline-variant/15 text-slate-500 hover:text-primary transition-colors shadow-sm">
              <span className="material-symbols-outlined text-lg">calendar_today</span>
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 flex justify-center"><span className="material-symbols-outlined animate-spin text-primary text-3xl">sync</span></div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low/30 border-b border-slate-100">
                  <th className="px-6 py-4 w-12"><input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/20" /></th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-500">Employee / Case ID</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-500">Department</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-500">Role</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-500">Status</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-500 text-right">Progress</th>
                  <th className="px-6 py-4 w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredCases.map(c => {
                  const { percent, color } = getProgress(c.documents);
                  return (
                    <tr 
                      key={c.user_id} 
                      className="hover:bg-surface-container-low transition-colors cursor-pointer group"
                      onClick={() => {
                        setSelectedCase(c);
                        setActiveView('DETAIL');
                      }}
                    >
                      <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                        <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/20" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary-container text-white flex items-center justify-center font-bold text-sm shadow-sm group-hover:ring-2 group-hover:ring-primary/20 transition-all">
                            {getInitials(c.user_name)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">{c.user_name}</p>
                            <p className="text-[10px] font-mono text-slate-400">ID: CASE-{c.user_id + 8000}-X</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-on-surface-variant font-medium">{c.user_department || '—'}</td>
                      <td className="px-6 py-4 text-sm text-on-surface-variant">{c.user_role?.replace('_', ' ') || 'Candidate'}</td>
                      <td className="px-6 py-4">
                        {getStatusBadge(c.status)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-3">
                          <div className="w-24 bg-surface-container-high h-2 rounded-full overflow-hidden">
                            <div className={`${color} h-full rounded-full transition-all duration-1000`} style={{ width: `${percent}%` }}></div>
                          </div>
                          <span className="text-[11px] font-bold text-slate-600 w-8 text-right">{percent}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-slate-400 hover:text-primary transition-colors" onClick={e => e.stopPropagation()}>
                          <span className="material-symbols-outlined">more_vert</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredCases.length === 0 && !loading && (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-slate-500 italic">No cases found matching the criteria.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer Pagination */}
        <div className="px-6 py-4 flex items-center justify-between bg-surface-container-low/20 border-t border-outline-variant/10">
          <p className="text-xs text-slate-500">Showing <span className="font-bold text-on-surface">{filteredCases.length}</span> active cases</p>
          <div className="flex gap-2">
            <button className="p-1.5 rounded-lg border border-outline-variant/15 hover:bg-white text-slate-400 transition-all disabled:opacity-50" disabled>
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <button className="px-3 py-1 rounded-lg bg-primary text-white text-xs font-bold">1</button>
            <button className="p-1.5 rounded-lg border border-outline-variant/15 hover:bg-white text-slate-400 transition-all disabled:opacity-50" disabled>
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HrCasesPage;
