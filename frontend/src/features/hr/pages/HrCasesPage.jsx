import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../../api';
import CaseDetailView from '../../hr-reviewer/components/CaseDetailView';

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
    case 'verified': return <span className="badge-success px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">ACTIVE</span>;
    case 'flagged': return <span className="badge-warning px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">FLAGGED</span>;
    case 'rejected': return <span className="badge-danger px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">REJECTED</span>;
    case 'pending':
    case 'uploaded':
    case 'ai_processing': return <span className="badge-info px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">PENDING APPROVAL</span>;
    default: return <span className="badge-neutral px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">DRAFT</span>;
  }
};

const getProgress = (docs) => {
  if (!docs || docs.length === 0) return { percent: 0, color: 'bg-white/20' };
  const verified = docs.filter(d => d.status === 'verified').length;
  const flagged = docs.filter(d => d.status === 'flagged' || d.status === 'rejected').length;
  const percent = Math.round((verified / docs.length) * 100);
  
  let color = 'bg-primary shadow-[0_0_10px_rgba(24,86,255,0.6)]';
  if (flagged > 0) color = 'bg-danger shadow-[0_0_10px_rgba(234,33,67,0.6)]';
  else if (percent < 50) color = 'bg-info shadow-[0_0_10px_rgba(56,189,248,0.6)]';
  
  return { percent, color };
};

const HrCasesPage = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('LIST'); // LIST, DETAIL
  const [selectedCase, setSelectedCase] = useState(null);

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
    
    // First, ensure all documents are verified locally/in state
    const pendingDocs = selectedCase.documents.filter(d => ['pending', 'uploaded', 'ai_processing', 'flagged'].includes(d.status));
    
    if (pendingDocs.length > 0) {
      if (!confirm(`Verify all ${pendingDocs.length} pending documents for ${selectedCase.user_name} and trigger final provisioning?`)) return;
      try {
        await Promise.all(pendingDocs.map(d => api(`/documents/${d.id}/status`, { method: 'PATCH', body: { status: 'verified' } })));
        const docIds = pendingDocs.map(d => d.id);
        setDocuments(prev => prev.map(d => docIds.includes(d.id) ? { ...d, status: 'verified' } : d));
        setSelectedCase(prev => ({
          ...prev,
          documents: prev.documents.map(d => docIds.includes(d.id) ? { ...d, status: 'verified' } : d)
        }));
      } catch (err) { 
        alert('Failed to verify some documents.'); 
        return;
      }
    } else {
      if (!confirm(`Trigger final provisioning for ${selectedCase.user_name}?`)) return;
    }

    // Now trigger the final Case Approval / Provisioning Pipeline
    try {
      const response = await api(`/onboarding/approve-case/${selectedCase.user_id}`, { method: 'POST' });
      alert(response.message || 'Case approved and provisioning started!');
      fetchDocuments(); // Refresh list to show updated status
    } catch (err) {
      alert('Provisioning trigger failed: ' + err.message);
    }
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
    <div className="text-white font-body pb-12 glass-animate-in">
      {/* Hero Header Section */}
      <div className="mb-10">
        <h2 className="font-headline font-extrabold text-3xl tracking-tight mb-2 drop-shadow-sm">Case Management</h2>
        <p className="text-white/60 max-w-2xl text-sm leading-relaxed">Orchestrate enterprise-wide onboarding flows and IT provisioning tasks from a single unified workspace.</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="glass-panel p-6 rounded-2xl flex flex-col shadow-[0_4px_30px_rgba(0,0,0,0.1)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[40px] pointer-events-none -mr-10 -mt-10"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <span className="p-2.5 bg-primary/20 border border-primary/30 text-primary rounded-xl material-symbols-outlined shadow-[0_0_10px_rgba(24,86,255,0.2)]">assignment</span>
            <span className="text-xs font-bold text-primary flex items-center gap-1 drop-shadow-sm">
              <span className="material-symbols-outlined text-xs">trending_up</span> +12%
            </span>
          </div>
          <p className="text-[10px] font-bold text-white/50 uppercase tracking-[0.2em] mb-1 relative z-10">Total Cases</p>
          <h3 className="text-3xl font-bold font-headline relative z-10 text-white">{cases.length}</h3>
        </div>
        
        <div className="glass-panel p-6 rounded-2xl flex flex-col shadow-[0_4px_30px_rgba(0,0,0,0.1)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-info/20 rounded-full blur-[40px] pointer-events-none -mr-10 -mt-10"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <span className="p-2.5 bg-info/20 border border-info/30 text-info rounded-xl material-symbols-outlined shadow-[0_0_10px_rgba(56,189,248,0.2)]">timer</span>
            <span className="text-xs font-bold text-info flex items-center gap-1 drop-shadow-sm">
              <span className="material-symbols-outlined text-xs">keyboard_arrow_down</span> 4.2h
            </span>
          </div>
          <p className="text-[10px] font-bold text-white/50 uppercase tracking-[0.2em] mb-1 relative z-10">Avg Approval Time</p>
          <h3 className="text-3xl font-bold font-headline relative z-10 text-white">2.4<span className="text-xl text-white/60 ml-1">Days</span></h3>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex flex-col shadow-[0_4px_30px_rgba(0,0,0,0.1)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-danger/20 rounded-full blur-[40px] pointer-events-none -mr-10 -mt-10"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <span className="p-2.5 bg-danger/20 border border-danger/30 text-danger rounded-xl material-symbols-outlined shadow-[0_0_10px_rgba(234,33,67,0.2)]">document_scanner</span>
            <span className="text-xs font-bold text-danger flex items-center gap-1 drop-shadow-sm">
              <span className="material-symbols-outlined text-xs">warning</span> +1.2%
            </span>
          </div>
          <p className="text-[10px] font-bold text-white/50 uppercase tracking-[0.2em] mb-1 relative z-10">Doc Rejection Rate</p>
          <h3 className="text-3xl font-bold font-headline relative z-10 text-white">3.8<span className="text-xl text-white/60 ml-1">%</span></h3>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex flex-col shadow-[0_4px_30px_rgba(0,0,0,0.1)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-success/20 rounded-full blur-[40px] pointer-events-none -mr-10 -mt-10"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <span className="p-2.5 bg-success/20 border border-success/30 text-success rounded-xl material-symbols-outlined shadow-[0_0_10px_rgba(7,202,107,0.2)]">cloud_done</span>
            <span className="text-xs font-bold text-success flex items-center gap-1 drop-shadow-sm">
              <span className="material-symbols-outlined text-xs">verified</span> 99.8%
            </span>
          </div>
          <p className="text-[10px] font-bold text-white/50 uppercase tracking-[0.2em] mb-1 relative z-10">Provisioning Success</p>
          <h3 className="text-3xl font-bold font-headline relative z-10 text-white">98.2<span className="text-xl text-white/60 ml-1">%</span></h3>
        </div>
      </div>

      {/* Table Container */}
      <div className="glass-panel rounded-2xl overflow-hidden shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
        
        {/* Filters & Bulk Actions */}
        <div className="p-5 border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 glass-surface px-4 py-2 rounded-xl transition-all hover:bg-white/10">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Status:</span>
              <select 
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="border-none text-xs font-semibold p-0 pr-6 focus:ring-0 bg-transparent text-white outline-none cursor-pointer [color-scheme:dark]"
              >
                <option value="All Statuses" className="bg-slate-900">All Statuses</option>
                <option value="Pending" className="bg-slate-900">Pending</option>
                <option value="Active" className="bg-slate-900">Active</option>
                <option value="Flagged" className="bg-slate-900">Flagged</option>
              </select>
            </div>
            <div className="flex items-center gap-2 glass-surface px-4 py-2 rounded-xl transition-all hover:bg-white/10">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Dept:</span>
              <select 
                value={departmentFilter}
                onChange={e => setDepartmentFilter(e.target.value)}
                className="border-none text-xs font-semibold p-0 pr-6 focus:ring-0 bg-transparent text-white outline-none cursor-pointer [color-scheme:dark]"
              >
                {departments.map(d => <option key={d} value={d} className="bg-slate-900">{d}</option>)}
              </select>
            </div>
            <button className="p-2 glass-surface rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer">
              <span className="material-symbols-outlined text-lg">calendar_today</span>
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto min-h-[400px]">
          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center space-y-4">
              <span className="material-symbols-outlined animate-spin text-primary text-4xl drop-shadow-[0_0_15px_rgba(24,86,255,0.8)]">sync</span>
              <span className="text-white/60 text-sm font-medium">Synchronizing enterprise data...</span>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.08]">
                  <th className="px-6 py-4 w-12"><input type="checkbox" className="w-4 h-4 rounded border-white/20 bg-white/5 text-primary focus:ring-primary/50 focus:ring-offset-0" /></th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-[0.2em] font-bold text-white/40">Employee / Case ID</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-[0.2em] font-bold text-white/40">Department</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-[0.2em] font-bold text-white/40">Role</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-[0.2em] font-bold text-white/40">Status</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-[0.2em] font-bold text-white/40 text-right">Progress</th>
                  <th className="px-6 py-4 w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredCases.map(c => {
                  const { percent, color } = getProgress(c.documents);
                  return (
                    <tr 
                      key={c.user_id} 
                      className="hover:bg-white/[0.04] transition-colors cursor-pointer group"
                      onClick={() => {
                        setSelectedCase(c);
                        setActiveView('DETAIL');
                      }}
                    >
                      <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                        <input type="checkbox" className="w-4 h-4 rounded border-white/20 bg-white/5 text-primary focus:ring-primary/50 focus:ring-offset-0" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 text-primary flex items-center justify-center font-bold text-sm shadow-[0_0_10px_rgba(24,86,255,0.2)] group-hover:scale-105 transition-all">
                            {getInitials(c.user_name)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">{c.user_name}</p>
                            <p className="text-[10px] font-mono text-white/40 mt-0.5">ID: CASE-{c.user_id + 8000}-X</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-white/70 font-medium">{c.user_department || '—'}</td>
                      <td className="px-6 py-4 text-xs text-white/70">{c.user_role?.replace('_', ' ') || 'Candidate'}</td>
                      <td className="px-6 py-4">
                        {getStatusBadge(c.status)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-3">
                          <div className="w-24 glass-surface border border-white/5 h-2 rounded-full overflow-hidden">
                            <div className={`${color} h-full rounded-full transition-all duration-1000`} style={{ width: `${percent}%` }}></div>
                          </div>
                          <span className="text-[11px] font-bold text-white/60 w-8 text-right font-mono">{percent}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-white/40 hover:text-white transition-colors" onClick={e => e.stopPropagation()}>
                          <span className="material-symbols-outlined">more_vert</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredCases.length === 0 && !loading && (
                  <tr>
                    <td colSpan="7" className="px-6 py-16 text-center text-white/40 italic text-sm">No cases found matching the criteria.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer Pagination */}
        <div className="px-6 py-4 flex items-center justify-between border-t border-white/[0.08]">
          <p className="text-xs text-white/40">Showing <span className="font-bold text-white">{filteredCases.length}</span> active cases</p>
          <div className="flex gap-2">
            <button className="p-1.5 rounded-lg glass-surface text-white/30 cursor-not-allowed border border-white/5">
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <button className="px-3 py-1 rounded-lg bg-primary text-white text-xs font-bold shadow-[0_0_10px_rgba(24,86,255,0.4)]">1</button>
            <button className="p-1.5 rounded-lg glass-surface text-white/30 cursor-not-allowed border border-white/5">
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HrCasesPage;
