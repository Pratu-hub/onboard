import React, { useState, useEffect } from 'react';
import { api } from '../../../api';

const AuditLogView = ({ userId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      fetchLogs();
    }
  }, [isOpen, userId]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await api(`/documents/cases/${userId}/logs`);
      setLogs(data.logs);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + 
           ' - ' + 
           d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const getActionBadge = (type) => {
    const t = type.toUpperCase();
    if (t === 'VERIFIED') return <span className="badge-success px-2 py-1 rounded-md font-bold text-[9px] uppercase tracking-widest">VERIFIED</span>;
    if (t === 'REJECTED') return <span className="badge-danger px-2 py-1 rounded-md font-bold text-[9px] uppercase tracking-widest">REJECTED</span>;
    if (t === 'FLAGGED') return <span className="badge-warning px-2 py-1 rounded-md font-bold text-[9px] uppercase tracking-widest">FLAGGED</span>;
    if (t === 'UPLOADED') return <span className="badge-neutral px-2 py-1 rounded-md font-bold text-[9px] uppercase tracking-widest">UPLOADED</span>;
    return <span className="badge-info px-2 py-1 rounded-md font-bold text-[9px] uppercase tracking-widest">{t}</span>;
  };

  return (
    <div className="fixed bottom-0 left-0 md:left-64 right-0 z-50 pointer-events-none text-white font-body">
      <div className="max-w-7xl mx-auto px-4 md:px-8 pointer-events-auto">
        <div className={`glass-elevated rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border border-white/20 border-b-0 overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${isOpen ? 'h-96' : 'h-16'}`}>
          {/* Toggle Header */}
          <div 
            onClick={() => setIsOpen(!isOpen)}
            className="flex justify-between items-center px-8 py-4 glass-surface cursor-pointer hover:bg-white/10 transition-colors border-b border-white/[0.05]"
          >
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-primary drop-shadow-[0_0_5px_rgba(24,86,255,0.5)]">history</span>
              <h4 className="text-sm font-headline font-extrabold tracking-[0.2em] uppercase text-white drop-shadow-sm">System Audit Log</h4>
              <span className="px-2.5 py-1 bg-primary/20 border border-primary/30 text-primary text-[9px] uppercase tracking-widest font-bold rounded-lg shadow-[0_0_10px_rgba(24,86,255,0.2)]">
                {logs.length} Events
              </span>
            </div>
            <div className="flex items-center gap-6">
              <button className="text-[10px] font-bold text-primary uppercase tracking-widest hover:text-white transition-colors">Export CSV</button>
              <div className={`w-8 h-8 rounded-full glass-surface flex items-center justify-center border border-white/10 transition-transform duration-500 text-white/60 ${isOpen ? 'rotate-180 bg-white/10 text-white' : ''}`}>
                <span className="material-symbols-outlined text-sm">
                  keyboard_arrow_up
                </span>
              </div>
            </div>
          </div>

          {/* Table Content */}
          <div className="overflow-y-auto h-full pb-16 bg-black/40">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-48 space-y-3">
                <span className="material-symbols-outlined animate-spin text-primary text-3xl drop-shadow-[0_0_15px_rgba(24,86,255,0.8)]">refresh</span>
                <span className="text-[10px] uppercase tracking-widest font-bold text-white/50">Fetching Immutable Logs...</span>
              </div>
            ) : logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-white/40 italic text-sm font-medium">
                No system history recorded for this case yet.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-black/60 backdrop-blur-md text-[9px] uppercase tracking-[0.2em] font-bold text-white/40 border-b border-white/10 z-10">
                  <tr>
                    <th className="px-8 py-4">Timestamp</th>
                    <th className="px-6 py-4">Reviewer / System</th>
                    <th className="px-6 py-4">Action Type</th>
                    <th className="px-8 py-4">Encrypted Notes</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-white/[0.05]">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/[0.04] transition-colors group">
                      <td className="px-8 py-4 font-mono font-medium text-white/50 whitespace-nowrap text-[11px]">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[14px] text-white/30">{log.reviewer_name ? 'person' : 'robot_2'}</span>
                          <span className="font-bold text-white/90 uppercase tracking-wide text-[11px]">{log.reviewer_name || 'System Auto-Resolver'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getActionBadge(log.action_type)}
                      </td>
                      <td className="px-8 py-4 text-white/60 italic text-[11px]">
                        {log.notes || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogView;
